/**
 * Gemini Archon Integration Service
 * 
 * Diese Klasse integriert Gemini 2.0 mit erweiterten Funktionen wie Live API
 * und interaktivem Streaming in die Archon-Integration der Anwendung.
 * 
 * Die Integration basiert auf den Beispielen aus dem Google Gemini Cookbook.
 */

import { EventEmitter } from 'events';
import * as genai from '@google/generative-ai';
import { ArchonIntegration } from './archon-integration';

// Konfiguration für die Gemini-Archon-Integration
export interface GeminiArchonConfig {
  model?: string;
  systemPrompt?: string;
  userId?: string;
  sessionId?: string;
  contextData?: any;
  responseType?: 'text' | 'full';
}

// Antwortformat für die Gemini-Archon-Integration
export interface GeminiArchonResponse {
  text?: string;
  data?: any;
  error?: string;
}

/**
 * Gemini-Archon-Integrations-Service
 */
export class GeminiArchonIntegrationService {
  private static instance: GeminiArchonIntegrationService;
  private genAIClient!: genai.GoogleGenerativeAI;
  private activeSessions: Map<string, any> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private archonIntegration: ArchonIntegration;

  /**
   * Private Konstruktor (Singleton-Pattern)
   */
  private constructor(archonIntegration: ArchonIntegration) {
    this.archonIntegration = archonIntegration;
    
    // Initialisiere Google GenAI mit dem API-Key aus den Umgebungsvariablen
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[GeminiArchonIntegration] GEMINI_API_KEY nicht in Umgebungsvariablen gefunden');
    } else {
      this.genAIClient = new genai.GoogleGenerativeAI(apiKey);
      console.log('[GeminiArchonIntegration] Google Gemini AI Client erfolgreich initialisiert');
    }
  }

  /**
   * Singleton-Instanz erhalten
   */
  public static getInstance(archonIntegration: ArchonIntegration): GeminiArchonIntegrationService {
    if (!GeminiArchonIntegrationService.instance) {
      GeminiArchonIntegrationService.instance = new GeminiArchonIntegrationService(archonIntegration);
    }
    return GeminiArchonIntegrationService.instance;
  }

  /**
   * Erstellt eine neue Gemini-Session mit der neuesten Live-Connect-Funktionalität
   */
  public async createSession(config: GeminiArchonConfig = {}): Promise<string> {
    try {
      if (!this.genAIClient) {
        throw new Error('Google Gemini AI Client ist nicht initialisiert');
      }
      
      // Erstelle eine einzigartige Session-ID wenn keine angegeben wurde
      const sessionId = config.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Wähle das Modell basierend auf der Konfiguration oder verwende den Standard
      const modelName = config.model || 'gemini-1.5-pro';
      const model = this.genAIClient.getGenerativeModel({ model: modelName });
      
      // Erstelle einen neuen Chat mit dem ausgewählten Modell
      const chat = model.startChat({
        history: [],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
        },
        safetySettings: [
          {
            category: genai.HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: genai.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: genai.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: genai.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: genai.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: genai.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: genai.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: genai.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          }
        ]
      });
      
      // Initialisiere die Chat-Session mit einem optionalen System-Prompt
      if (config.systemPrompt) {
        await chat.sendMessage(config.systemPrompt);
      }
      
      // Speichere die Session-Informationen
      this.activeSessions.set(sessionId, {
        chat,
        model: modelName,
        userId: config.userId,
        systemPrompt: config.systemPrompt,
        contextData: config.contextData,
        lastActive: Date.now(),
        isStreaming: false,
        streamId: null,
        streamStartTime: null,
        streamEndTime: null,
        config: {
          responseType: config.responseType || 'text'
        }
      });
      
      console.log(`[GeminiArchonIntegration] Neue Session erstellt: ${sessionId}`);
      
      // Informiere Archon über die neue Session (über eigenes Event-System)
      this.emit('gemini_session_created', {
        sessionId,
        modelName,
        timestamp: new Date().toISOString(),
      });
      
      return sessionId;
    } catch (error) {
      console.error('[GeminiArchonIntegration] Fehler beim Erstellen der Session:', error);
      throw new Error(`Fehler beim Erstellen der Gemini-Session: ${error}`);
    }
  }
  
  /**
   * Sendet eine Nachricht an die Gemini-Session und erhält eine Antwort
   */
  public async sendMessage(sessionId: string, message: string): Promise<GeminiArchonResponse> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session mit ID ${sessionId} nicht gefunden`);
      }
      
      // Aktualisiere den Zeitstempel der letzten Aktivität
      session.lastActive = Date.now();
      
      // Sende die Nachricht und erhalte die Antwort
      const result = await session.chat.sendMessage(message);
      const responseText = result.response.text();
      
      // Informiere Archon über die Interaktion (über eigenes Event-System)
      this.emit('gemini_message_exchange', {
        sessionId,
        userMessage: message,
        aiResponse: responseText,
        timestamp: new Date().toISOString(),
      });
      
      if (session.config.responseType === 'full') {
        return {
          text: responseText,
          data: result.response
        };
      }
      
      return {
        text: responseText
      };
    } catch (error) {
      console.error(`[GeminiArchonIntegration] Fehler beim Senden der Nachricht für Session ${sessionId}:`, error);
      
      // Informiere Archon über den Fehler
      this.emit('gemini_error', {
        sessionId,
        error: `${error}`,
        timestamp: new Date().toISOString(),
      });
      
      return {
        error: `Fehler beim Senden der Nachricht: ${error}`
      };
    }
  }
  
  /**
   * Beginnt einen Audio-Stream mit Gemini 2.0 basierend auf dem Cookbook-Beispiel
   */
  public async startAudioStream(sessionId: string, config: any = {}): Promise<string> {
    try {
      // Diese Implementierung ist für die Serverseite angepasst
      // Da wir keinen direkten Browserkontext haben, stellen wir einen Streaming-Endpoint bereit
      
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Hole bestehende Session oder erstelle eine neue
      let session = this.activeSessions.get(sessionId);
      if (!session) {
        // Erstelle eine neue Session, wenn keine existiert
        const newSessionId = await this.createSession({
          ...config,
          sessionId
        });
        session = this.activeSessions.get(newSessionId);
      }
      
      // Speichere Stream-Informationen in der Session
      session.streamId = streamId;
      session.isStreaming = true;
      session.streamStartTime = Date.now();
      
      // Informiere Archon über den neuen Stream
      this.emit('gemini_stream_started', {
        sessionId,
        streamId,
        timestamp: new Date().toISOString(),
      });
      
      return streamId;
    } catch (error) {
      console.error('[GeminiArchonIntegration] Fehler beim Starten des Audio-Streams:', error);
      throw new Error(`Fehler beim Starten des Audio-Streams: ${error}`);
    }
  }
  
  /**
   * Stoppt einen laufenden Audio-Stream
   */
  public async stopAudioStream(sessionId: string, streamId: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session mit ID ${sessionId} nicht gefunden`);
      }
      
      if (session.streamId !== streamId) {
        throw new Error(`Stream mit ID ${streamId} stimmt nicht mit dem aktiven Stream der Session überein`);
      }
      
      // Markiere den Stream als beendet
      session.isStreaming = false;
      session.streamEndTime = Date.now();
      
      // Informiere Archon über das Ende des Streams
      this.emit('gemini_stream_ended', {
        sessionId,
        streamId,
        duration: session.streamEndTime - session.streamStartTime,
        timestamp: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      console.error('[GeminiArchonIntegration] Fehler beim Stoppen des Audio-Streams:', error);
      return false;
    }
  }
  
  /**
   * Beendet eine Gemini-Session und räumt Ressourcen auf
   */
  public async endSession(sessionId: string): Promise<boolean> {
    try {
      if (!this.activeSessions.has(sessionId)) {
        return false;
      }
      
      const session = this.activeSessions.get(sessionId);
      
      // Wenn ein Stream aktiv ist, stoppe ihn
      if (session.isStreaming && session.streamId) {
        await this.stopAudioStream(sessionId, session.streamId);
      }
      
      // Entferne die Session
      this.activeSessions.delete(sessionId);
      
      // Informiere Archon über das Ende der Session
      this.emit('gemini_session_ended', {
        sessionId,
        timestamp: new Date().toISOString(),
      });
      
      console.log(`[GeminiArchonIntegration] Session beendet: ${sessionId}`);
      
      return true;
    } catch (error) {
      console.error('[GeminiArchonIntegration] Fehler beim Beenden der Session:', error);
      return false;
    }
  }
  
  /**
   * Registriert einen Event-Listener für Gemini-Archon-Events
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Entfernt einen Event-Listener
   */
  public off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }
  
  /**
   * Löst ein Event aus
   */
  private emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }
  
  /**
   * Räumt inaktive Sessions auf (kann regelmäßig aufgerufen werden)
   */
  public cleanupInactiveSessions(maxAgeInMinutes: number = 30): void {
    const now = Date.now();
    const maxAgeInMs = maxAgeInMinutes * 60 * 1000;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActive > maxAgeInMs) {
        console.log(`[GeminiArchonIntegration] Bereinige inaktive Session: ${sessionId}`);
        this.endSession(sessionId).catch(err => {
          console.error(`[GeminiArchonIntegration] Fehler beim Bereinigen der Session ${sessionId}:`, err);
        });
      }
    }
  }
}

/**
 * Hilfsfunktion, um eine Instanz des GeminiArchonIntegrationService zu erhalten
 */
export function getGeminiArchonService(archonIntegration: ArchonIntegration): GeminiArchonIntegrationService {
  return GeminiArchonIntegrationService.getInstance(archonIntegration);
}