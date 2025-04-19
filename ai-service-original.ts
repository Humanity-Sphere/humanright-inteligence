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

// Funktion für den Content Studio AI Generator
export async function generateAIContentService(options: RequestOptions): Promise<string> {
  try {
    console.log("Generating AI content with options:", JSON.stringify(options, null, 2));
    
    // Bestimme den Prompt-Typ (Handlebars-Template oder normaler Prompt)
    const isTemplatePrompt = options.promptTemplate && options.promptParameters;
    let processedPrompt = options.prompt || options.promptTemplate || "";
    
    // Wenn es ein Template-Prompt ist, ersetze die Parameter
    if (isTemplatePrompt && options.promptParameters) {
      // Einfache Implementierung von Handlebars-ähnlicher Syntax
      processedPrompt = processedPrompt.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
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
    
    // Erstelle einen GeminiService wenn nicht vorhanden
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Kein GEMINI_API_KEY gefunden, generiere Dummy-Inhalt");
      return `{"isHuridocsFormat": false, "format": "unbekannt", "fields": {}, "confidence": 0}`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: options.model || "gemini-1.5-flash",
      safetySettings
    });

    // Konfiguration erstellen
    const generationConfig: GenerationConfig = {};
    if (options.maxTokens) generationConfig.maxOutputTokens = options.maxTokens;
    if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
    if (options.topP !== undefined) generationConfig.topP = options.topP;
    if (options.topK !== undefined) generationConfig.topK = options.topK;
    
    // Generiere Inhalt direkt ohne separate Parts
    const result = await model.generateContent(processedPrompt, generationConfig);
    
    return result.response.text();
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw new Error(`Fehler bei der KI-Inhaltsgenerierung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig } from "@google/generative-ai";
import fetch from 'node-fetch';
// Placeholder für fehlendes Modul
const contextEnrichmentService = {
  enrichPromptWithResources: (prompt: string, options: {
    limit?: number,
    format?: string,
    addToBeginning?: boolean
  } = {}): string => {
    // Dummy-Implementierung
    return prompt + "\n\nHinweis: Hier würden normalerweise relevante Ressourcen angereichert.";
  }
};

// Placeholder für fehlendes Modul
enum TaskType {
  CREATIVE_WRITING = "CREATIVE_WRITING",
  DOCUMENT_ANALYSIS = "DOCUMENT_ANALYSIS",
  CODE_GENERATION = "CODE_GENERATION",
  TRANSLATION = "TRANSLATION",
  SUMMARIZATION = "SUMMARIZATION",
  QUESTION_ANSWERING = "QUESTION_ANSWERING"
}

const aiOptimizer = {
  selectOptimalModel: (taskType: TaskType, options: { 
    preferLowCost?: boolean, 
    requireMultimodal?: boolean,
    preferredProvider?: string 
  }) => {
    // Dummy-Implementierung
    return {
      provider: 'gemini',
      modelId: 'gemini-1.5-pro',
      parameters: {}
    };
  },
  optimizePrompt: (prompt: string, taskType: TaskType, options: {
    enrichWithResources?: boolean,
    modelId?: string,
    useStructuredOutput?: boolean,
    outputFormat?: string
  }) => {
    // Dummy-Implementierung
    return prompt + "\n\nOptimierter Prompt für " + taskType;
  }
};

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
  provider: 'gemini' | 'openrouter';
  apiKey: string;
  model?: string; // Wird für beide benötigt, aber spezifisch pro Provider
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
}

// ----- Gemini Implementierung -----

// Sicherheitseinstellungen für Gemini
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

class GeminiService implements IAIService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private jsonGenerationConfig: GenerationConfig;

  constructor(apiKey: string, model: string = "gemini-1.5-flash") {
    if (!apiKey) {
      throw new Error("Gemini API Key is required for GeminiService.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
    // Konfiguration für JSON-Ausgabe
    this.jsonGenerationConfig = {
      responseMimeType: "application/json",
    };
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
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        safetySettings,
        generationConfig: this.jsonGenerationConfig // JSON Modus aktivieren
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
    enrichWithResources?: boolean;
    taskType?: TaskType;
    preferLowCost?: boolean;
    outputFormat?: 'json' | 'markdown' | 'html' | 'text';
  }): Promise<string> {
    try {
      // Intelligente Modellauswahl basierend auf Aufgabentyp, wenn verfügbar
      let selectedModel = this.modelName;
      let optimizedParams: RequestOptions = { prompt: params.prompt };
      
      if (params.taskType) {
        // Optimale Modellauswahl nur für Gemini-Modelle in dieser Implementation
        const modelOptimization = aiOptimizer.selectOptimalModel(params.taskType, {
          preferLowCost: params.preferLowCost,
          requireMultimodal: false,
          preferredProvider: 'gemini'
        });
        
        // Nur wenn ein Gemini-Modell empfohlen wird, verwenden wir es
        if (modelOptimization.provider === 'gemini') {
          selectedModel = modelOptimization.modelId;
          optimizedParams = modelOptimization.parameters;
          console.log(`Optimiertes Modell für ${params.taskType}: ${selectedModel}`);
        }
      }
      
      const model = this.genAI.getGenerativeModel({
        model: selectedModel,
        safetySettings
      });

      // Parameter-Konfiguration mit Priorität für explizite Parameter
      const generationConfig: GenerationConfig = {};
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
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        safetySettings,
        generationConfig: this.jsonGenerationConfig
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
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        safetySettings,
        generationConfig: this.jsonGenerationConfig
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
    this.model = config.model || 'anthropic/claude-3.5-sonnet'; // Standardmodell für OpenRouter
    this.siteUrl = config.siteUrl || 'http://localhost:5000'; // Oder Ihre Produktions-URL
    this.appName = config.appName || 'HumanRightsIntelligence';
  }

  // Prompt-Erstellung ist identisch zu Gemini
  private _createDocumentAnalysisPrompt(document: { title?: string; type?: string; content: string }): string {
    // Gleiche Implementierung wie in GeminiService
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

  // Parser ist identisch zu Gemini
  private _parseAnalysisResult(content: string): DocumentAnalysisResult {
    try {
      const result = JSON.parse(content);
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
      const prompt = this._createDocumentAnalysisPrompt(document);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl, // Wichtig für OpenRouter
          'X-Title': this.appName       // Wichtig für OpenRouter
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            // System Prompt optional, hängt vom Modell ab
            { role: 'system', content: "Du bist ein spezialisierter Assistent für Menschenrechtsanalyse. Extrahiere präzise die angeforderten Informationen als JSON." },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }, // JSON-Modus anfordern
          max_tokens: 4000 // Ggf. anpassen
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const result = await response.json();

      if (!result.choices || result.choices.length === 0 || !result.choices[0].message?.content) {
        console.error("Invalid response structure from OpenRouter:", result);
        throw new Error("Unerwartete Antwortstruktur von OpenRouter erhalten.");
      }

      return this._parseAnalysisResult(result.choices[0].message.content);

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
      // Intelligente Modellauswahl basierend auf Aufgabentyp, wenn verfügbar
      let selectedModel = this.model;
      let optimizedParams: RequestOptions = { prompt: params.prompt };
      
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
        console.log(`Prompt für ${params.taskType} optimiert (OpenRouter)`);
      }
      // Ansonsten nur Anreicherung mit Ressourcen, wenn gewünscht
      else if (params.enrichWithResources) {
        finalPrompt = contextEnrichmentService.enrichPromptWithResources(params.prompt, {
          limit: 3,
          format: 'text',
          addToBeginning: false
        });
        console.log('Prompt wurde mit OHCHR-Ressourcen angereichert (OpenRouter)');
      }
      
      // Parameter-Optimierung
      const temperature = params.temperature !== undefined ? params.temperature : 
                         (optimizedParams.temperature !== undefined ? optimizedParams.temperature : 0.7);
      const maxTokens = params.max_tokens || optimizedParams.maxTokens || 2000;
      const topP = optimizedParams.topP || undefined;
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: "Du bist ein Assistent für Menschenrechtsverteidiger. Generiere präzise und professionelle Inhalte basierend auf der Anfrage." },
            { role: 'user', content: finalPrompt }
          ],
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: topP
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const result = await response.json();

      if (!result.choices || result.choices.length === 0 || !result.choices[0].message?.content) {
        console.error("Invalid response structure from OpenRouter:", result);
        throw new Error("Unerwartete Antwortstruktur von OpenRouter erhalten.");
      }

      return result.choices[0].message.content;

    } catch (error: any) {
      console.error('Error generating content with OpenRouter:', error);
      throw new Error(`Fehler bei der OpenRouter-Inhaltsgenerierung: ${error.message}`);
    }
  }

  async detectPatterns(documents: Array<{ id: number; content: string }>): Promise<any> {
    try {
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

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: "Du bist ein spezialisierter Assistent für Menschenrechtsanalyse. Erkenne Muster und Trends über mehrere Dokumente hinweg." },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const result = await response.json();

      if (!result.choices || result.choices.length === 0 || !result.choices[0].message?.content) {
        console.error("Invalid response structure from OpenRouter:", result);
        throw new Error("Unerwartete Antwortstruktur von OpenRouter erhalten.");
      }

      try {
        return JSON.parse(result.choices[0].message.content);
      } catch (error) {
        console.error('Error parsing JSON from OpenRouter pattern detection:', error);
        throw new Error('Ungültiges JSON-Format in der Mustererkennungsantwort');
      }
    } catch (error: any) {
      console.error('Error detecting patterns with OpenRouter:', error);
      throw new Error(`Fehler bei der Mustererkennung: ${error.message}`);
    }
  }

  async suggestLegalStrategy(caseData: any): Promise<any> {
    try {
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

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: "Du bist ein Experte für Menschenrechtsgesetzgebung und -strategien. Schlage fundierte juristische Vorgehensweisen vor." },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const result = await response.json();

      if (!result.choices || result.choices.length === 0 || !result.choices[0].message?.content) {
        console.error("Invalid response structure from OpenRouter:", result);
        throw new Error("Unerwartete Antwortstruktur von OpenRouter erhalten.");
      }

      try {
        return JSON.parse(result.choices[0].message.content);
      } catch (error) {
        console.error('Error parsing JSON from OpenRouter legal strategy suggestion:', error);
        throw new Error('Ungültiges JSON-Format in der Strategieempfehlung');
      }
    } catch (error: any) {
      console.error('Error suggesting legal strategy with OpenRouter:', error);
      throw new Error(`Fehler bei der Strategieempfehlung: ${error.message}`);
    }
  }
}

// ----- Factory Funktion -----

export function createAIService(config: AIServiceConfig): IAIService {
  if (!config.apiKey) {
    console.warn("AI Service created without API key. API calls will likely fail.");
  }

  switch (config.provider) {
    case 'gemini':
      return new GeminiService(config.apiKey, config.model);
    case 'openrouter':
      return new OpenRouterService({
        ...config,
        apiUrl: config.apiUrl || 'https://openrouter.ai/api/v1' // Standard OpenRouter URL
      });
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

// ----- Singleton-Instanz für die Anwendung -----

let aiServiceInstance: IAIService | null = null;

export function initializeAIService(): IAIService {
  if (aiServiceInstance) {
    return aiServiceInstance;
  }

  // Konfiguration aus Umgebungsvariablen
  const aiConfig: AIServiceConfig = {
    provider: (process.env.AI_PROVIDER || 'gemini') as 'gemini' | 'openrouter',
    apiKey: process.env.AI_PROVIDER === 'openrouter' 
      ? (process.env.OPENROUTER_API_KEY || '')
      : (process.env.GEMINI_API_KEY || ''),
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
 * Diese Funktion wird vom Content Studio verwendet (interne Version).
 */
export async function generateAIContentInternal(options: RequestOptions): Promise<string> {
  const aiService = getAIService();
  
  try {
    // Default Werte festlegen
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 4096;
    const model = options.model || 'gemini-2.5-pro';
    const systemPrompt = options.systemPrompt || '';
    
    // Parameter für verschiedene Rollen anpassen
    let finalPrompt = options.prompt;
    
    // Prompt mit Parametern anreichern, falls vorhanden
    if (options.promptParameters && Object.keys(options.promptParameters).length > 0) {
      // Handlebars-ähnliche Ersetzung
      const params = options.promptParameters;
      
      // {{variableName}} ersetzen
      finalPrompt = finalPrompt.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        if (params[trimmedKey] !== undefined) {
          return params[trimmedKey];
        }
        return match; // Wenn der Parameter nicht gefunden wurde, lasse den Platzhalter stehen
      });
      
      // {{#each arrayName}}...{{/each}} ersetzen
      finalPrompt = finalPrompt.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, template) => {
        const array = params[arrayName.trim()];
        if (Array.isArray(array)) {
          return array.map(item => {
            // {{item}} durch den aktuellen Wert ersetzen
            return template.replace(/\{\{item\}\}/g, item);
          }).join('\n');
        }
        return ''; // Wenn das Array nicht gefunden wurde oder kein Array ist, gib einen leeren String zurück
      });
      
      // {{#if condition}}...{{/if}} ersetzen
      finalPrompt = finalPrompt.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
        const condValue = params[condition.trim()];
        return condValue ? content : '';
      });
    }
    
    // KI-Inhalte generieren
    const result = await aiService.generateContent({
      prompt: finalPrompt,
      temperature: temperature,
      max_tokens: maxTokens,
      enrichWithResources: true,  // OHCHR-Ressourcen automatisch einbeziehen
    });
    
    return result;
  } catch (error) {
    console.error('Fehler bei der KI-Inhaltsgenerierung:', error);
    throw new Error(`Fehler bei der Inhaltsgenerierung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}