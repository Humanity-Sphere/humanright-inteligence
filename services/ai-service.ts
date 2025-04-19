/**
 * AI Service für die Menschenrechtsverteidiger-App
 * 
 * Dieser Service bietet eine einheitliche Schnittstelle zu verschiedenen KI-Diensten:
 * - Google Gemini API (über das offizielle SDK, inklusive Gemini 2.5)
 * - OpenRouter API (als flexibler Endpunkt für verschiedene Modelle wie Claude, Llama etc.)
 * 
 * Features:
 * - Intelligente Modellauswahl basierend auf Aufgabentyp
 * - Optimierte Prompts mit aufgabenspezifischen Strategien
 * - Anreicherung mit relevanten OHCHR-Ressourcen
 * - Automatische Parameteranpassung für beste Ergebnisse
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import fetch from 'node-fetch';
import { contextEnrichmentService } from './context-enrichment-service';
import { aiOptimizer, TaskType } from './ai-optimizer';
import { createSystemPrompt } from '../utils/prompt-utils';
import dotenv from 'dotenv';

// Umgebungsvariablen laden
dotenv.config();

// API Key aus der Umgebung laden
const apiKey = process.env.GEMINI_API_KEY || '';

// Überprüfen, ob der API Key vorhanden ist
if (!apiKey) {
  console.warn("WARNUNG: GEMINI_API_KEY nicht gefunden. KI-Funktionen werden nicht verfügbar sein.");
}

// Google Generative AI initialisieren
const genAI = new GoogleGenerativeAI(apiKey);

// Sicherheitseinstellungen für Gemini
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
];

// Model-Optimierungsparameter für verschiedene KI-Modelle
const modelOptimizationParams: Record<string, any> = {
  'gemini-2.5-pro': { temperature: 0.2, maxTokens: 8192, topP: 0.95, topK: 40 },
  'gemini-2.5-flash': { temperature: 0.3, maxTokens: 4096, topP: 0.95, topK: 40 },
  'gemini-1.5-pro': { temperature: 0.2, maxTokens: 4096, topP: 0.95, topK: 40 },
  'gemini-1.5-flash': { temperature: 0.3, maxTokens: 4096, topP: 0.95, topK: 40 },
  'anthropic/claude-3.5-sonnet': { temperature: 0.2, maxTokens: 4096, topP: 0.9 },
  'anthropic/claude-3-opus': { temperature: 0.1, maxTokens: 4096, topP: 0.9 },
  'anthropic/claude-3-sonnet': { temperature: 0.2, maxTokens: 4096, topP: 0.9 },
  'openai/gpt-4o': { temperature: 0.2, maxTokens: 4096, topP: 0.95 },
  'meta-llama/llama-3-70b': { temperature: 0.3, maxTokens: 4096, topP: 0.95 },
  'mistralai/mistral-large': { temperature: 0.3, maxTokens: 4096, topP: 0.95 },
  'cohere/command-r-plus': { temperature: 0.2, maxTokens: 4096, topP: 0.95 },
  'databricks/dbrx-instruct': { temperature: 0.3, maxTokens: 4096, topP: 0.95 },
  'perplexity/pplx-70b-online': { temperature: 0.2, maxTokens: 4096, topP: 0.95 },
};

// ----- Konfiguration und Typen -----

export interface AIServiceConfig {
  provider: 'gemini' | 'openrouter' | 'groq';
  apiKey: string;
  model?: string; // Wird für alle Provider benötigt, aber spezifisch pro Provider
  apiUrl?: string; // Nur für OpenRouter
  siteUrl?: string; // Empfohlen für OpenRouter
  appName?: string; // Empfohlen für OpenRouter
}

// Optionen für jede Anfrage
export interface RequestOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  systemPrompt?: string;
  promptParameters?: Record<string, any>;
  promptTemplate?: string;
  model?: string;
  role?: string;
  context?: string;
  maxOutputTokens?: number;
}

// Struktur für das Analyseergebnis
export interface DocumentAnalysisResult {
  beteiligte_parteien: string[];
  rechtliche_grundlagen: { reference: string; description: string }[];
  zentrale_fakten: string[];
  menschenrechtliche_implikationen: string[];
  verbindungen: string[];
  zeitliche_abfolge: string[];
  schlüsselwörter: string[];
  sentiment?: string;
  suggestedActions?: string[];
  contradictions?: { statement1: string; statement2: string; explanation: string }[];
}

// Interface für den AI Service
export interface IAIService {
  analyzeDocument(document: { title?: string; type?: string; content: string }): Promise<DocumentAnalysisResult>;
  generateContent(params: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    enrichWithResources?: boolean; // Neue Option zur Kontextanreicherung
    taskType?: TaskType;           // Art der Aufgabe für optimierte Modellauswahl
    preferLowCost?: boolean;       // Bevorzuge kostengünstigere Modelle
    outputFormat?: 'json' | 'markdown' | 'html' | 'text'; // Gewünschtes Ausgabeformat
  }): Promise<string>;
  detectPatterns(documents: Array<{ id: number; content: string }>): Promise<any>;
  suggestLegalStrategy(caseData: any): Promise<any>;
  generateText(prompt: string, options?: RequestOptions): Promise<string>;
  generateRecommendations(context: string, options?: RequestOptions): Promise<string[]>;
  analyzeDocument(document: string, options?: RequestOptions): Promise<any>;
}


/**
 * KI-Service Interface
 */

/**
 * Gemini-basierter KI-Service
 */
export class GeminiAIService implements IAIService {
  /**
   * Generiert Text basierend auf einem Prompt
   * @param prompt Der Eingabeprompt
   * @param options Zusätzliche Optionen
   * @returns Generierter Text
   */
  async generateText(prompt: string, options: RequestOptions = {}): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-latest",
        safetySettings,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxOutputTokens || 1024,
        }
      });

      const systemPrompt = createSystemPrompt(options.role || 'default', options.context);
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Fehler bei der Textgenerierung:", error);
      throw new Error(`Fehler bei der Textgenerierung: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analysiert ein Dokument
   * @param document Das zu analysierende Dokument
   * @param options Zusätzliche Optionen
   * @returns Analyseergebnisse als strukturiertes Objekt
   */
  async analyzeDocument(document: string, options: RequestOptions = {}): Promise<any> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro-latest",
        safetySettings,
        generationConfig: {
          temperature: options.temperature || 0.2, // Niedrigere Temperatur für konsistentere Analysen
          maxOutputTokens: options.maxOutputTokens || 1024,
        }
      });

      const systemPrompt = createSystemPrompt(options.role || 'analyst', options.context);
      const analyzePrompt = `
${systemPrompt}

Analysiere das folgende Dokument und extrahiere relevante Informationen. Formatiere die Ausgabe als strukturiertes JSON-Objekt mit folgenden Schlüsseln:
- summary: Eine Zusammenfassung des Dokuments
- keyPoints: Ein Array mit den wichtigsten Punkten
- entities: Ein Array von identifizierten Entitäten (Personen, Organisationen, Orte)
- sentiment: Eine Bewertung des Sentiments (positiv, neutral, negativ)
- topics: Ein Array der identifizierten Themen
- recommendations: Empfehlungen basierend auf dem Inhalt

Dokument:
${document}

Antworte nur mit dem JSON-Objekt, ohne zusätzlichen Text.
`;

      const result = await model.generateContent(analyzePrompt);
      const response = await result.response;
      const text = response.text();

      // Extrahiere das JSON aus der Antwort (falls es von Markdown oder Text umgeben ist)
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

      try {
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Fehler beim Parsen der JSON-Antwort:", parseError);
        // Fallback: Gib die Textantwort zurück, wenn kein gültiges JSON vorhanden ist
        return { rawResponse: text };
      }
    } catch (error) {
      console.error("Fehler bei der Dokumentenanalyse:", error);
      throw new Error(`Fehler bei der Dokumentenanalyse: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generiert Empfehlungen basierend auf einem Kontext
   * @param context Der Kontext, für den Empfehlungen generiert werden sollen
   * @param options Zusätzliche Optionen
   * @returns Ein Array von Empfehlungen
   */
  async generateRecommendations(context: string, options: RequestOptions = {}): Promise<string[]> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-latest",
        safetySettings,
        generationConfig: {
          temperature: options.temperature || 0.8,
          maxOutputTokens: options.maxOutputTokens || 1024,
        }
      });

      const systemPrompt = createSystemPrompt(options.role || 'advocate', options.context);
      const recommendationPrompt = `
${systemPrompt}

Basierend auf dem folgenden Kontext, generiere eine Liste von mindestens 3 und höchstens 5 konkreten Empfehlungen. 
Die Empfehlungen sollten spezifisch, umsetzbar und relevant sein.

Kontext:
${context}

Antworte mit einem JSON-Array, das nur die Empfehlungen enthält, ohne zusätzlichen Text.
Beispiel: ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"]
`;

      const result = await model.generateContent(recommendationPrompt);
      const response = await result.response;
      const text = response.text();

      // Extrahiere das JSON-Array aus der Antwort
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

      try {
        const recommendations = JSON.parse(jsonStr);
        return Array.isArray(recommendations) ? recommendations : [text];
      } catch (parseError) {
        console.error("Fehler beim Parsen der JSON-Antwort:", parseError);
        // Fallback: Teile den Text in Zeilen auf, wenn kein gültiges JSON vorhanden ist
        return text.split('\n').filter(line => line.trim() !== '');
      }
    } catch (error) {
      console.error("Fehler bei der Generierung von Empfehlungen:", error);
      throw new Error(`Fehler bei der Generierung von Empfehlungen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }


  // Helper für Prompt Erstellung
  private _createDocumentAnalysisPrompt(document: { title?: string; type?: string; content: string }): string {
    return `
      Du bist ein Experte für Menschenrechtsdokumentation und juristische Analyse.
      AUFGABE:
      Analysiere das folgende Dokument und extrahiere strukturierte Informationen.
      DOKUMENT:
      Titel: ${document.title || 'Unbekannter Titel'}
      Typ: ${document.type || 'Unbekannter Typ'}
      Inhalt: ${document.content.substring(0, 15000)}... (${document.content.length > 15000 ? 'gekürzt' : ''})

      EXTRAHIERE FOLGENDE INFORMATIONEN ALS JSON-OBJEKT:
      {
        "beteiligte_parteien": ["string"], // Liste aller Personen, Organisationen, Institutionen
        "rechtliche_grundlagen": [{"reference": "string", "description": "string"}], // Erwähnte Gesetze, Verträge, Normen mit kurzer Beschreibung
        "zentrale_fakten": ["string"], // Wichtigste Tatsachenbehauptungen
        "menschenrechtliche_implikationen": ["string"], // Potenzielle Menschenrechtsverletzungen
        "verbindungen": ["string"], // Verknüpfungen zu anderen Fällen/Ereignissen
        "zeitliche_abfolge": ["string"], // Chronologische Ereignisabfolge (wichtige Daten/Zeiträume)
        "schlüsselwörter": ["string"], // Relevante Keywords für Kategorisierung
        "sentiment": "string|null", // Gesamtstimmung: 'positiv', 'negativ', 'neutral', 'gemischt' oder null
        "suggestedActions": ["string"], // Empfohlene nächste Schritte oder Aktionen
        "contradictions": [{"statement1": "string", "statement2": "string", "explanation": "string"}] // Festgestellte Widersprüche mit Erklärung
      }

      Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen oder Formatierungen wie \`\`\`json.
      Stelle sicher, dass das JSON valide ist. Verwende null für Felder, wenn keine Informationen gefunden wurden.
    `;
  }

  // Helper zum Parsen
  private _parseAnalysisResult(content: string): DocumentAnalysisResult {
    try {
      // Direkte Annahme, dass die Antwort bereits JSON ist (wegen response_mime_type)
      const result = JSON.parse(content);
      // Füge leere Arrays/null hinzu, falls Felder fehlen
      return {
        beteiligte_parteien: result.beteiligte_parteien || [],
        rechtliche_grundlagen: result.rechtliche_grundlagen || [],
        zentrale_fakten: result.zentrale_fakten || [],
        menschenrechtliche_implikationen: result.menschenrechtliche_implikationen || [],
        verbindungen: result.verbindungen || [],
        zeitliche_abfolge: result.zeitliche_abfolge || [],
        schlüsselwörter: result.schlüsselwörter || [],
        sentiment: result.sentiment || null,
        suggestedActions: result.suggestedActions || [],
        contradictions: result.contradictions || [],
      };
    } catch (error) {
      console.error('Error parsing JSON from Gemini response:', error, 'Raw content:', content);
      throw new Error('Ungültiges JSON-Format in der KI-Antwort');
    }
  }

  async analyzeDocument(document: { title?: string; type?: string; content: string }): Promise<DocumentAnalysisResult> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro-latest",
        safetySettings,
      });
      const prompt = this._createDocumentAnalysisPrompt(document);

      // System-Instruktion (optional aber empfohlen)
      const systemInstruction = "Du bist ein spezialisierter Assistent für Menschenrechtsanalyse. Extrahiere präzise die angeforderten Informationen als JSON.";

      const result = await model.generateContent([systemInstruction, prompt]);
      const responseText = result.response.text();

      return this._parseAnalysisResult(responseText);

    } catch (error: any) {
      console.error('Error analyzing document with Gemini:', error);
      // Detailliertere Fehlermeldung loggen, falls vorhanden
      if (error.message.includes('SAFETY')) {
        console.error('Gemini Safety Settings Blocked:', error.response?.promptFeedback);
        throw new Error('Gemini-Anfrage wurde aufgrund von Sicherheitseinstellungen blockiert.');
      }
      throw new Error(`Fehler bei der Gemini-Analyse: ${error.message}`);
    }
  }

  async generateContent(params: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    enrichWithResources?: boolean; // Neue Option zur Kontextanreicherung
    taskType?: TaskType;           // Art der Aufgabe für optimierte Modellauswahl
    preferLowCost?: boolean;       // Bevorzuge kostengünstigere Modelle
    outputFormat?: 'json' | 'markdown' | 'html' | 'text'; // Gewünschtes Ausgabeformat
  }): Promise<string> {
    try {
      // Intelligente Modellauswahl basierend auf Aufgabentyp, wenn verfügbar
      let selectedModel = "gemini-2.5-flash-latest";
      let optimizedParams: RequestOptions = {
        prompt: params.prompt
      };

      if (params.taskType) {
        try {
          // Optimale Modellauswahl nur für Gemini-Modelle in dieser Implementation
          const modelOptimization = aiOptimizer.selectOptimalModel(params.taskType, {
            preferLowCost: params.preferLowCost,
            requireMultimodal: false,
            preferredProvider: 'gemini'
          });

          // Nur wenn ein Gemini-Modell empfohlen wird, verwenden wir es
          if (modelOptimization && modelOptimization.provider === 'gemini') {
            selectedModel = modelOptimization.modelId;
            optimizedParams = modelOptimization.parameters || {};
            console.log(`Optimiertes Modell für ${params.taskType}: ${selectedModel}`);
          }
        } catch (optimizerError) {
          console.warn(`Fehler bei der Modelloptimierung: ${optimizerError.message}`);
          // Fallback auf Standard-Modell
        }
      }

      const model = genAI.getGenerativeModel({
        model: selectedModel,
        safetySettings
      });

      // Parameter-Konfiguration mit Priorität für explizite Parameter
      const generationConfig: any = {};
      if (params.max_tokens) generationConfig.maxOutputTokens = params.max_tokens;
      else if (optimizedParams.maxTokens) generationConfig.maxOutputTokens = optimizedParams.maxTokens;

      if (params.temperature !== undefined) generationConfig.temperature = params.temperature;
      else if (optimizedParams.temperature !== undefined) generationConfig.temperature = optimizedParams.temperature;

      if (optimizedParams.topP) generationConfig.topP = optimizedParams.topP;
      if (optimizedParams.topK) generationConfig.topK = optimizedParams.topK;

      // Prompt-Optimierung und Anreicherung
      let finalPrompt = params.prompt;

      // Wenn ein Aufgabentyp angegeben ist, optimieren wir den Prompt
      if (params.taskType) {
        finalPrompt = aiOptimizer.optimizePrompt(params.prompt, params.taskType, {
          enrichWithResources: params.enrichWithResources,
          modelId: selectedModel,
          useStructuredOutput: !!params.outputFormat,
          outputFormat: params.outputFormat
        });
        console.log(`Prompt für ${params.taskType} optimiert`);
      }
      // Ansonsten nur Anreicherung mit Ressourcen, wenn gewünscht
      else if (params.enrichWithResources) {
        finalPrompt = contextEnrichmentService.enrichPromptWithResources(params.prompt, {
          limit: 3,
          format: 'text',
          addToBeginning: false
        });
        console.log('Prompt wurde mit OHCHR-Ressourcen angereichert');
      }

      const systemPrompt = "Du bist ein Assistent für Menschenrechtsverteidiger. Generiere präzise und professionelle Inhalte basierend auf der Anfrage.";
      const result = await model.generateContent([systemPrompt, finalPrompt], generationConfig);

      const responseText = result.response.text();
      if (!responseText) {
        throw new Error("Leere Antwort von Gemini erhalten.");
      }
      return responseText;
    } catch (error: any) {
      console.error('Error generating content with Gemini:', error);
      if (error.message.includes('SAFETY')) {
        console.error('Gemini Safety Settings Blocked:', error.response?.promptFeedback);
        throw new Error('Gemini-Anfrage wurde aufgrund von Sicherheitseinstellungen blockiert.');
      }
      throw new Error(`Fehler bei der Gemini-Inhaltsgenerierung: ${error.message}`);
    }
  }

  async detectPatterns(documents: Array<{ id: number; content: string }>): Promise<any> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro-latest",
        safetySettings,
      });

      // Kombiniere die Dokumenteninhalte mit Limits
      const combinedContent = documents.map(d =>
        `Dokument ID ${d.id}:\n${d.content.substring(0, 5000)}`
      ).join('\n\n---\n\n');

      const prompt = `
        Analysiere die folgenden Dokumente auf wiederkehrende Muster oder systemische Probleme im Bereich Menschenrechte:

        ${combinedContent}

        EXTRAHIERE FOLGENDE INFORMATIONEN ALS JSON-OBJEKT:
        {
          "patterns": [
            {
              "pattern_name": "string", // Name des erkannten Musters
              "description": "string", // Ausführliche Beschreibung des Musters
              "involved_document_ids": [number], // IDs der Dokumente, die dieses Muster zeigen
              "evidence": ["string"], // Konkrete Textstellen oder Belege
              "suggested_actions": ["string"] // Empfohlene Maßnahmen
            }
          ],
          "geographic_clusters": [
            {
              "region": "string", // Erkannte geographische Region
              "frequency": number, // Häufigkeit der Erwähnung
              "document_ids": [number] // IDs der zugehörigen Dokumente
            }
          ],
          "temporal_trends": [
            {
              "time_period": "string", // Erkannter Zeitraum
              "trend_description": "string", // Beschreibung des Trends
              "document_ids": [number] // IDs der zugehörigen Dokumente
            }
          ]
        }

        Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.
      `;

      const systemInstruction = "Du bist ein spezialisierter Assistent für Menschenrechtsanalyse. Erkenne Muster und Trends über mehrere Dokumente hinweg.";

      const result = await model.generateContent([systemInstruction, prompt]);
      const responseText = result.response.text();

      try {
        return JSON.parse(responseText);
      } catch (error) {
        console.error('Error parsing JSON from pattern detection:', error, 'Raw content:', responseText);
        throw new Error('Ungültiges JSON-Format in der Mustererkennungsantwort');
      }
    } catch (error: any) {
      console.error('Error detecting patterns with Gemini:', error);
      throw new Error(`Fehler bei der Mustererkennung: ${error.message}`);
    }
  }

  async suggestLegalStrategy(caseData: any): Promise<any> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro-latest",
        safetySettings,
      });

      const prompt = `
        Basierend auf diesen Falldaten, schlage rechtliche Strategien vor:

        ${JSON.stringify(caseData, null, 2)}

        EXTRAHIERE FOLGENDE INFORMATIONEN ALS JSON-OBJEKT:
        {
          "strategies": [
            {
              "name": "string", // Name der Strategie
              "description": "string", // Detaillierte Beschreibung
              "legal_basis": ["string"], // Rechtliche Grundlagen
              "steps": ["string"], // Konkrete Schritte
              "pros": ["string"], // Vorteile
              "cons": ["string"], // Nachteile
              "success_probability": number, // Erfolgswahrscheinlichkeit (0-1)
              "required_resources": ["string"] // Benötigte Ressourcen
            }
          ],
          "recommended_strategy": "string", // Name der empfohlenen Strategie
          "additional_considerations": ["string"] // Weitere Überlegungen
        }

        Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.
      `;

      const systemInstruction = "Du bist ein Experte für Menschenrechtsgesetzgebung und -strategien. Schlage fundierte juristische Vorgehensweisen vor.";

      const result = await model.generateContent([systemInstruction, prompt]);
      const responseText = result.response.text();

      try {
        return JSON.parse(responseText);
      } catch (error) {
        console.error('Error parsing JSON from legal strategy suggestion:', error, 'Raw content:', responseText);
        throw new Error('Ungültiges JSON-Format in der Strategieempfehlung');
      }
    } catch (error: any) {
      console.error('Error suggesting legal strategy with Gemini:', error);
      throw new Error(`Fehler bei der Strategieempfehlung: ${error.message}`);
    }
  }
}

// ----- OpenRouter Implementierung -----

class OpenRouterService implements IAIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private siteUrl: string;
  private appName: string;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey || !config.apiUrl) {
      throw new Error("API Key and API URL are required for OpenRouterService.");
    }
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl.endsWith('/chat/completions') ? config.apiUrl : `${config.apiUrl}/chat/completions`;
    this.model = config.model || 'anthropic/claude-3.5-sonnet'; // Standardmodell
    this.siteUrl = config.siteUrl || '';
    this.appName = config.appName || 'HumanRightsIntelligence';
  }

  private _createDocumentAnalysisPrompt(document: { title?: string; type?: string; content: string }): string {
    // Ähnlicher Prompt wie bei Gemini
    return `
      Du bist ein Experte für Menschenrechtsdokumentation und juristische Analyse.
      AUFGABE:
      Analysiere das folgende Dokument und extrahiere strukturierte Informationen.
      DOKUMENT:
      Titel: ${document.title || 'Unbekannter Titel'}
      Typ: ${document.type || 'Unbekannter Typ'}
      Inhalt: ${document.content.substring(0, 15000)}... (${document.content.length > 15000 ? 'gekürzt' : ''})

      EXTRAHIERE FOLGENDE INFORMATIONEN:
      - beteiligte_parteien: Liste aller Personen, Organisationen, Institutionen
      - rechtliche_grundlagen: Erwähnte Gesetze, Verträge, Normen mit kurzer Beschreibung
      - zentrale_fakten: Wichtigste Tatsachenbehauptungen
      - menschenrechtliche_implikationen: Potenzielle Menschenrechtsverletzungen
      - verbindungen: Verknüpfungen zu anderen Fällen/Ereignissen
      - zeitliche_abfolge: Chronologische Ereignisabfolge (wichtige Daten/Zeiträume)
      - schlüsselwörter: Relevante Keywords für Kategorisierung
      - sentiment: Gesamtstimmung ('positiv', 'negativ', 'neutral', 'gemischt' oder null)
      - suggestedActions: Empfohlene nächste Schritte oder Aktionen
      - contradictions: Festgestellte Widersprüche mit Erklärung

      Antworte im präzisen JSON-Format ohne Zusatzkommentare.
    `;
  }

  private _parseAnalysisResult(content: string): DocumentAnalysisResult {
    try {
      // Versuche, JSON direkt zu parsen
      let result: any;
      try {
        result = JSON.parse(content);
      } catch (e) {
        // Wenn das nicht klappt, versuche zu extrahieren (manche Modelle fügen Text hinzu)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Keine JSON-Struktur in der Antwort gefunden");
        }
      }

      // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
      return {
        beteiligte_parteien: result.beteiligte_parteien || [],
        rechtliche_grundlagen: result.rechtliche_grundlagen || [],
        zentrale_fakten: result.zentrale_fakten || [],
        menschenrechtliche_implikationen: result.menschenrechtliche_implikationen || [],
        verbindungen: result.verbindungen || [],
        zeitliche_abfolge: result.zeitliche_abfolge || [],
        schlüsselwörter: result.schlüsselwörter || [],
        sentiment: result.sentiment || null,
        suggestedActions: result.suggestedActions || [],
        contradictions: result.contradictions || [],
      };
    } catch (error) {
      console.error('Error parsing JSON from OpenRouter response:', error, 'Raw content:', content);
      throw new Error('Ungültiges JSON-Format in der KI-Antwort');
    }
  }

  async analyzeDocument(document: { title?: string; type?: string; content: string }): Promise<DocumentAnalysisResult> {
    try {
      const messages = [
        {
          role: "system",
          content: "Du bist ein spezialisierter Assistent für Menschenrechtsanalyse. Extrahiere präzise die angeforderten Informationen als JSON."
        },
        {
          role: "user",
          content: this._createDocumentAnalysisPrompt(document)
        }
      ];

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl, // Empfohlen von OpenRouter
          'X-Title': this.appName      // Empfohlen von OpenRouter
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          response_format: { type: "json_object" },
          temperature: 0.2, // Niedrige Temperatur für faktenbasierte Analysen
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      if (!content) {
        throw new Error("Leere Antwort von OpenRouter erhalten.");
      }

      return this._parseAnalysisResult(content);
    } catch (error: any) {
      console.error('Error analyzing document with OpenRouter:', error);
      throw new Error(`Fehler bei der OpenRouter-Analyse: ${error.message}`);
    }
  }

  async generateContent(params: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    enrichWithResources?: boolean;
    taskType?: TaskType;
    preferLowCost?: boolean;
    outputFormat?: 'json' | 'markdown' | 'html' | 'text';
  }): Promise<string> {
    try {
      // Intelligente Modellauswahl, wenn ein Aufgabentyp definiert ist
      let selectedModel = this.model;
      let optimizedParams: RequestOptions = {
        prompt: params.prompt
      };

      if (params.taskType) {
        // Optimale Modellauswahl für OpenRouter-Modelle
        const modelOptimization = aiOptimizer.selectOptimalModel(params.taskType, {
          preferLowCost: params.preferLowCost,
          requireMultimodal: false,
          preferredProvider: 'openrouter'
        });

        // Nur wenn ein OpenRouter-Modell empfohlen wird, verwenden wir es
        if (modelOptimization.provider === 'openrouter') {
          selectedModel = modelOptimization.modelId;
          optimizedParams = modelOptimization.parameters;
          console.log(`Optimiertes Modell für ${params.taskType}: ${selectedModel}`);
        }
      }

      // Prompt-Optimierung und Anreicherung
      let finalPrompt = params.prompt;

      // Wenn ein Aufgabentyp angegeben ist, optimieren wir den Prompt
      if (params.taskType) {
        finalPrompt = aiOptimizer.optimizePrompt(params.prompt, params.taskType, {
          enrichWithResources: params.enrichWithResources,
          modelId: selectedModel,
          useStructuredOutput: !!params.outputFormat,
          outputFormat: params.outputFormat
        });
        console.log(`Prompt für ${params.taskType} optimiert`);
      }
      // Ansonsten nur Anreicherung mit Ressourcen, wenn gewünscht
      else if (params.enrichWithResources) {
        finalPrompt = contextEnrichmentService.enrichPromptWithResources(params.prompt, {
          limit: 3,
          format: 'text',
          addToBeginning: false
        });
        console.log('Prompt wurde mit OHCHR-Ressourcen angereichert');
      }

      // Konvertiere Output-Format für OpenRouter
      const responseFormat = params.outputFormat === 'json' ? { type: "json_object" } : undefined;

      // System-Anweisung
      const systemInstruction = "Du bist ein Assistent für Menschenrechtsverteidiger. Generiere präzise und professionelle Inhalte basierend auf der Anfrage.";

      // Nachrichten-Format für OpenRouter
      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: finalPrompt }
      ];

      // Anfrage an OpenRouter senden
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName
                },
        body: JSON.stringify({
          model: selectedModel,
          messages: messages,
          response_format: responseFormat,
          temperature: params.temperature || optimizedParams.temperature || 0.7,
          max_tokens: params.max_tokens || optimizedParams.maxTokens || 4096
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      if (!content) {
        throw new Error("Leere Antwort von OpenRouter erhalten.");
      }

      return content;
    } catch (error: any) {
      console.error('Error generating content with OpenRouter:', error);
      throw new Error(`Fehler bei der OpenRouter-Inhaltsgenerierung: ${error.message}`);
    }
  }

  async detectPatterns(documents: Array<{ id: number; content: string }>): Promise<any> {
    // Implementierung ähnlich zu Gemini mit Anpassungen für OpenRouter API
    try {
      // Kombiniere die Dokumenteninhalte mit Limits
      const combinedContent = documents.map(d =>
        `Dokument ID ${d.id}:\n${d.content.substring(0, 5000)}`
      ).join('\n\n---\n\n');

      const systemInstruction = "Du bist ein spezialisierter Assistent für Menschenrechtsanalyse. Erkenne Muster und Trends über mehrere Dokumente hinweg.";

      const prompt = `
        Analysiere die folgenden Dokumente auf wiederkehrende Muster oder systemische Probleme im Bereich Menschenrechte:

        ${combinedContent}

        EXTRAHIERE FOLGENDE INFORMATIONEN:
        - patterns: Liste der erkannten Muster (mit Name, Beschreibung, betroffenen Dokument-IDs, Belegen, empfohlenen Maßnahmen)
        - geographic_clusters: Geografische Cluster (Region, Häufigkeit, Dokument-IDs)
        - temporal_trends: Zeitliche Trends (Zeitraum, Trendbeschreibung, Dokument-IDs)

        Antworte im präzisen JSON-Format ohne Zusatzkommentare.
      `;

      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ];

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      if (!content) {
        throw new Error("Leere Antwort von OpenRouter erhalten.");
      }

      try {
        // Versuche, JSON direkt zu parsen
        return JSON.parse(content);
      } catch (error) {
        // Wenn das nicht klappt, versuche zu extrahieren
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Keine JSON-Struktur in der Antwort gefunden");
        }
      }
    } catch (error: any) {
      console.error('Error detecting patterns with OpenRouter:', error);
      throw new Error(`Fehler bei der Mustererkennung mit OpenRouter: ${error.message}`);
    }
  }

  async suggestLegalStrategy(caseData: any): Promise<any> {
    // Implementierung ähnlich zu Gemini mit Anpassungen für OpenRouter API
    try {
      const systemInstruction = "Du bist ein Experte für Menschenrechtsgesetzgebung und -strategien. Schlage fundierte juristische Vorgehensweisen vor.";

      const prompt = `
        Basierend auf diesen Falldaten, schlage rechtliche Strategien vor:

        ${JSON.stringify(caseData, null, 2)}

        EXTRAHIERE FOLGENDE INFORMATIONEN:
        - strategies: Liste der vorgeschlagenen Strategien (mit Name, Beschreibung, rechtlichen Grundlagen, Schritten, Vor- und Nachteilen, Erfolgswahrscheinlichkeit, benötigten Ressourcen)
        - recommended_strategy: Name der empfohlenen Strategie
        - additional_considerations: Weitere wichtige Überlegungen

        Antworte im präzisen JSON-Format ohne Zusatzkommentare.
      `;

      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ];

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      if (!content) {
        throw new Error("Leere Antwort von OpenRouter erhalten.");
      }

      try {
        // Versuche, JSON direkt zu parsen
        return JSON.parse(content);
      } catch (error) {
        // Wenn das nicht klappt, versuche zu extrahieren
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Keine JSON-Struktur in der Antwort gefunden");
        }
      }
    } catch (error: any) {
      console.error('Error suggesting legal strategy with OpenRouter:', error);
      throw new Error(`Fehler bei der Strategieempfehlung mit OpenRouter: ${error.message}`);
    }
  }
}

// ----- Factory, Singleton & Exports -----

// Singleton-Instanz
let aiServiceInstance: IAIService | null = null;

// Import des Groq AI Service
import { GroqAIService } from './groq-service';

export function createAIService(config: AIServiceConfig): IAIService {
  if (config.provider === 'gemini') {
    console.log("Creating GeminiService with model:", config.model || "default");
    return new GeminiAIService(config.apiKey, config.model);
  } else if (config.provider === 'openrouter') {
    console.log("Creating OpenRouterService with model:", config.model || "default");
    return new OpenRouterService(config);
  } else if (config.provider === 'groq') {
    console.log("Creating GroqAIService with model:", config.model || "llama3-70b-8192");
    return new GroqAIService(config.apiKey);
  } else {
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

export function initializeAIService(): IAIService {
  if (aiServiceInstance) {
    return aiServiceInstance;
  }

  // Konfiguration aus Umgebungsvariablen
  const provider = (process.env.AI_PROVIDER || 'gemini') as 'gemini' | 'openrouter' | 'groq';
  
  // API-Key je nach Provider auswählen
  let apiKey = '';
  if (provider === 'openrouter') {
    apiKey = process.env.OPENROUTER_API_KEY || '';
  } else if (provider === 'groq') {
    apiKey = process.env.GROQ_API_KEY || '';
  } else {
    // Default ist Gemini
    apiKey = process.env.GEMINI_API_KEY || '';
  }
  
  const aiConfig: AIServiceConfig = {
    provider,
    apiKey,
    model: process.env.AI_MODEL,
    apiUrl: process.env.OPENROUTER_API_URL,
    siteUrl: process.env.APP_BASE_URL,
    appName: 'HumanRightsIntelligence'
  };

  try {
    aiServiceInstance = createAIService(aiConfig);
    console.log(`AI Service initialized with provider: ${aiConfig.provider}`);
    return aiServiceInstance;
  } catch (error) {
    console.error("Failed to initialize AI service:", error);
    throw error;
  }
}

// Einfache Methode zum Abrufen der Instanz
export function getAIService(): IAIService {
  if (!aiServiceInstance) {
    return initializeAIService();
  }
  return aiServiceInstance;
}

/**
 * Generiert Inhalt mit KI basierend auf den angegebenen Optionen.
 * Diese Funktion wird vom Content Studio verwendet.
 */
export async function generateAIContentService(options: RequestOptions): Promise<string> {
  try {
    console.log("Generating AI content with options:", JSON.stringify(options, null, 2));

    // Bestimme den Prompt-Typ (Handlebars-Template oder normaler Prompt)
    const isTemplatePrompt = options.promptTemplate && options.promptParameters;
    let processedPrompt = options.prompt || options.promptTemplate || "";

    // Wenn es ein Template-Prompt ist, ersetze die Parameter
    if (isTemplatePrompt && options.promptParameters) {
      // Einfache Implementierung von Handlebars-ähnlicher Syntax
      processedPrompt = processedPrompt.replace(/\{\{([^}]+)\}\}/g, (match: string, key: string) => {
        const trimmedKey = key.trim();
        // Check for simple conditionals (very basic implementation)
        if (trimmedKey.startsWith('#if ')) {
          const condVar = trimmedKey.substring(4).trim();
          return options.promptParameters?.[condVar] ? '' : '{{/if}}';
        } else if (trimmedKey === '/if') {
          return '';
        }

        // Handle simple each loops (very basic implementation)
        if (trimmedKey.startsWith('#each ')) {
          const arrayVar = trimmedKey.substring(6).trim();
          const array = options.promptParameters?.[arrayVar];
          if (Array.isArray(array)) {
            // This is a placeholder, actual implementation would be more complex
            return array.map(item => item).join('\n- ');
          }
          return '';
        } else if (trimmedKey === '/each') {
          return '';
        }

        // Simple variable replacement
        return options.promptParameters?.[trimmedKey]?.toString() || '';
      });
    }

    // Fallback für Demo-Implementierung
    const demoOutput = `Generierter Inhalt für: "${processedPrompt.substring(0, 100)}${processedPrompt.length > 100 ? '...' : ''}"

Hier ist ein Beispiel für generierten Inhalt zu diesem Thema:

${options.systemPrompt ? 'Mit System-Prompt: ' + options.systemPrompt.substring(0, 50) + '...\n\n' : ''}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor. Suspendisse dictum feugiat nisl ut dapibus. Mauris iaculis porttitor posuere. Praesent id metus massa, ut blandit odio.

Proin quis tortor orci. Etiam at risus et justo dignissim congue. Donec congue lacinia dui, a porttitor lectus condimentum laoreet. Nunc eu ullamcorper orci. Quisque eget odio ac lectus vestibulum faucibus eget in metus. In pellentesque faucibus vestibulum. Nulla at nulla justo, eget luctus tortor. Nulla facilisi. Duis aliquet egestas purus in blandit.

Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor. Suspendisse dictum feugiat nisl ut dapibus. Mauris iaculis porttitor posuere.

Erstellt mit ${options.model || 'Standard Model'} bei einer Temperatur von ${options.temperature || 0.7}.`;

    return demoOutput;
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw new Error(`Fehler bei der KI-Inhaltsgenerierung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}