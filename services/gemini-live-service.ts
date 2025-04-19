/**
 * Gemini Live Service
 * 
 * Dieser Service ermöglicht kontinuierliche Konversationen mit dem Google Gemini-Modell
 * und unterstützt Streaming-Antworten über Server-Sent Events (SSE).
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, ChatSession, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Standardwerte für Generierungskonfiguration
const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

// Konfiguration für Sicherheitseinstellungen (Harm Reduction)
const DEFAULT_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

class GeminiLiveService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private modelName: string = "gemini-1.5-flash"; // Standardmodell
  private activeSessions: Map<string, ChatSession> = new Map();
  private sessionContexts: Map<string, any> = new Map();
  private apiKey: string | undefined;

  constructor() {
    this.initialize();
  }

  /**
   * Initialisiert den Google Gemini AI-Client und das Modell
   */
  private initialize(): void {
    // Versuche API-Key aus verschiedenen Umgebungsvariablen zu laden
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!this.apiKey) {
      console.warn("[GeminiLiveService] Kein API-Key gefunden. Service wird ohne Modell initialisiert.");
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      
      // Lade aktuellstes verfügbares Modell
      this.modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      this.model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: DEFAULT_GENERATION_CONFIG,
        safetySettings: DEFAULT_SAFETY_SETTINGS
      });
      
      console.log(`[GeminiLiveService] Erfolgreich initialisiert mit Modell: ${this.modelName}`);
    } catch (error) {
      console.error("[GeminiLiveService] Fehler bei der Initialisierung:", error);
      this.genAI = null;
      this.model = null;
    }
  }

  /**
   * Prüft, ob der Service verfügbar ist
   */
  public isAvailable(): boolean {
    return !!this.model && !!this.genAI;
  }

  /**
   * Gibt den Namen des verwendeten Modells zurück
   */
  public getModelName(): string {
    return this.modelName;
  }

  /**
   * Initialisiert eine neue Chat-Session
   * @param sessionId - Eindeutige Sessions-ID
   * @param context - Optionaler Kontext für die Session
   */
  public async initializeSession(sessionId: string, context?: any): Promise<boolean> {
    if (!this.isAvailable()) {
      console.error("[GeminiLiveService] Service nicht verfügbar - Session kann nicht erstellt werden");
      return false;
    }

    try {
      // Session-Kontext speichern
      this.sessionContexts.set(sessionId, context);
      
      // Initialen Systemkontext erstellen
      const systemPrompt = this.createSystemPrompt(context);
      
      // Neue Chat-Session erstellen
      const chatSession = this.model!.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "Initialisiere neue Session als HR-Defender Coach" }],
          },
          {
            role: "model",
            parts: [{ text: "Die Session wurde initialisiert. Ich bin bereit, dir als HR-Defender Coach zu helfen." }],
          }
        ],
        generationConfig: {
          ...DEFAULT_GENERATION_CONFIG,
          // Für lange Konversationen höheres Token-Limit
          maxOutputTokens: 2048
        }
      });

      // Session speichern
      this.activeSessions.set(sessionId, chatSession);
      console.log(`[GeminiLiveService] Neue Session erstellt: ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`[GeminiLiveService] Fehler beim Erstellen der Session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Erstellt einen kontextspezifischen System-Prompt basierend auf dem Session-Kontext
   * @param context - Session-Kontext mit Rollen und Dokumenten
   */
  private createSystemPrompt(context?: any): string {
    if (!context) {
      return "Du bist ein hilfreicher KI-Assistent für Menschenrechtsverteidiger. Beantworte Fragen klar, präzise und hilfreich.";
    }

    let systemPrompt = "Du bist ein hilfreicher KI-Assistent für Menschenrechtsverteidiger.";
    
    // Füge rollenspezifische Anweisungen hinzu
    if (context.role) {
      systemPrompt += ` Du übernimmst die Rolle: ${context.role}.`;
    }

    // Wenn ein Dokument im Kontext vorhanden ist, verwende es als Referenz
    if (context.document && context.document.content) {
      systemPrompt += ` Beziehe dich auf folgendes Dokument: "${context.document.title || 'Unbenanntes Dokument'}".`;
      systemPrompt += ` Inhalt: ${context.document.content}`;
    }

    // Füge aufgabenspezifische Anweisungen hinzu
    if (context.task) {
      systemPrompt += ` Deine primäre Aufgabe ist: ${context.task}.`;
    }

    // Füge themenspezifische Anweisungen hinzu
    if (context.topic) {
      systemPrompt += ` Fokussiere dich auf das Thema: ${context.topic}.`;
    }

    return systemPrompt;
  }

  /**
   * Sendet eine Nachricht an eine bestehende Chat-Session
   * @param sessionId - ID der Session
   * @param message - Die zu sendende Nachricht
   * @param stream - Ob die Antwort gestreamt werden soll (als Generator)
   * @returns Die Antwort als Text oder als AsyncGenerator für Streaming
   */
  public async sendMessage(sessionId: string, message: string, stream: boolean = false): Promise<string | AsyncGenerator<string>> {
    if (!this.isAvailable()) {
      throw new Error("Service nicht verfügbar");
    }

    // Prüfe, ob die Session existiert
    const chatSession = this.activeSessions.get(sessionId);
    if (!chatSession) {
      throw new Error(`Session ${sessionId} nicht gefunden`);
    }

    try {
      if (stream) {
        // Streaming-Antwort
        const result = await chatSession.sendMessageStream(message);
        
        // Generator für Text-Chunks erstellen
        return this.createStreamingGenerator(result);
      } else {
        // Normale synchrone Antwort
        const result = await chatSession.sendMessage(message);
        return result.response.text();
      }
    } catch (error) {
      console.error(`[GeminiLiveService] Fehler beim Senden der Nachricht in Session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Erstellt einen AsyncGenerator, der Text-Chunks aus der Stream-Antwort erzeugt
   * @param result - Der Stream-Result vom Gemini-Modell
   */
  private async* createStreamingGenerator(result: any): AsyncGenerator<string> {
    try {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error('[GeminiLiveService] Fehler im Stream:', error);
      throw error;
    }
  }

  /**
   * Beendet eine Chat-Session und gibt deren Ressourcen frei
   * @param sessionId - ID der zu beendenden Session
   * @returns True, wenn die Session erfolgreich beendet wurde
   */
  public endSession(sessionId: string): boolean {
    const sessionExists = this.activeSessions.has(sessionId);
    
    if (sessionExists) {
      this.activeSessions.delete(sessionId);
      this.sessionContexts.delete(sessionId);
      console.log(`[GeminiLiveService] Session beendet: ${sessionId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Gibt die Anzahl der aktiven Sessions zurück
   */
  public getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Gibt eine Liste aller aktiven Session-IDs zurück
   */
  public getActiveSessionIds(): string[] {
    return Array.from(this.activeSessions.keys());
  }
}

// Singleton-Instanz
export const geminiLiveService = new GeminiLiveService();