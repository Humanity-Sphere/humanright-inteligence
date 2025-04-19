/**
 * Groq AI Service für die Menschenrechtsverteidiger-App
 * 
 * Dieser Service implementiert die IAIService-Schnittstelle mit Groq als Anbieter.
 * Nutzt groq-sdk für optimale Integration mit den Groq-API-Endpoints.
 */

import Groq from 'groq-sdk';
import { IAIService, DocumentAnalysisResult, RequestOptions } from './ai-service';
import { aiOptimizer, TaskType } from './ai-optimizer';
import { createSystemPrompt } from '../utils/prompt-utils';
import dotenv from 'dotenv';

// Umgebungsvariablen laden
dotenv.config();

// Optimierungsparameter für verschiedene Groq-Modelle
const groqModelOptimizationParams: Record<string, any> = {
  'llama3-8b-8192': { temperature: 0.6, maxTokens: 4096, topP: 0.9 },
  'llama3-70b-8192': { temperature: 0.3, maxTokens: 8192, topP: 0.95 },
  'mixtral-8x7b-32768': { temperature: 0.5, maxTokens: 8192, topP: 0.9 },
  'gemma-7b-it': { temperature: 0.7, maxTokens: 4096, topP: 0.9 }
};

/**
 * Implementierung des IAIService mit Groq
 */
export class GroqAIService implements IAIService {
  private groq: Groq;
  private defaultModel: string = 'llama3-70b-8192'; // Standard-Modell

  constructor(apiKey?: string) {
    // Verwende entweder den übergebenen API-Key oder den aus den Umgebungsvariablen
    const key = apiKey || process.env.GROQ_API_KEY;
    
    if (!key) {
      console.warn("WARNUNG: GROQ_API_KEY nicht gefunden. KI-Funktionen werden nicht verfügbar sein.");
      throw new Error("GROQ_API_KEY ist erforderlich für den GroqAIService");
    }

    this.groq = new Groq({ apiKey: key });
  }

  /**
   * Generiert Text basierend auf einem Prompt
   * @param prompt Der Eingabeprompt
   * @param options Zusätzliche Optionen
   * @returns Generierter Text
   */
  async generateText(prompt: string, options: RequestOptions = {}): Promise<string> {
    try {
      const modelName = options.model || this.defaultModel;
      
      // System-Prompt einfügen, wenn vorhanden
      const systemPrompt = options.systemPrompt || createSystemPrompt(options.role || 'default', options.context);
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt
        });
      }
      
      messages.push({
        role: "user",
        content: prompt
      });

      const completion = await this.groq.chat.completions.create({
        messages,
        model: modelName,
        temperature: options.temperature || groqModelOptimizationParams[modelName]?.temperature || 0.5,
        max_tokens: options.maxTokens || options.maxOutputTokens || groqModelOptimizationParams[modelName]?.maxTokens || 1024,
        top_p: options.topP || groqModelOptimizationParams[modelName]?.topP || 0.9,
        stream: false
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Fehler bei der Textgenerierung mit Groq:", error);
      throw new Error(`Fehler bei der Textgenerierung mit Groq: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analysiert ein Dokument
   * @param document Das zu analysierende Dokument
   * @param options Zusätzliche Optionen
   * @returns Analyseergebnisse als strukturiertes Objekt
   */
  async analyzeDocument(document: string | { title?: string; type?: string; content: string }, options: RequestOptions = {}): Promise<any> {
    try {
      // Verarbeite verschiedene Dokumentenformate
      let documentContent: string;
      let documentTitle: string = '';
      let documentType: string = '';

      if (typeof document === 'string') {
        documentContent = document;
      } else {
        documentContent = document.content;
        documentTitle = document.title || '';
        documentType = document.type || '';
      }

      const prompt = this._createDocumentAnalysisPrompt({
        title: documentTitle,
        type: documentType,
        content: documentContent
      });

      const modelName = options.model || 'llama3-70b-8192'; // Für komplexe Analysen verwenden wir das leistungsstärkste Modell

      const messages = [
        {
          role: "system",
          content: "Du bist ein Experte für Menschenrechtsdokumentation und juristische Analyse. Extrahiere relevante Informationen in einem präzisen JSON-Format."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const completion = await this.groq.chat.completions.create({
        messages,
        model: modelName,
        temperature: options.temperature || 0.2, // Niedrigere Temperatur für konsistentere Analysen
        max_tokens: options.maxTokens || options.maxOutputTokens || 4096,
        top_p: 0.95,
        response_format: { type: "json_object" }, // Strukturierte Antwort als JSON
        stream: false
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Fehler beim Parsen der JSON-Antwort von Groq:", parseError);
        return { rawResponse: responseText };
      }
    } catch (error) {
      console.error("Fehler bei der Dokumentenanalyse mit Groq:", error);
      throw new Error(`Fehler bei der Dokumentenanalyse mit Groq: ${error instanceof Error ? error.message : String(error)}`);
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
      const modelName = options.model || 'llama3-70b-8192';
      
      const systemPrompt = options.systemPrompt || createSystemPrompt(options.role || 'advocate', options.context);
      const recommendationPrompt = `
${systemPrompt}

Basierend auf dem folgenden Kontext, generiere eine Liste von mindestens 3 und höchstens 5 konkreten Empfehlungen. 
Die Empfehlungen sollten spezifisch, umsetzbar und relevant sein.

Kontext:
${context}

Antworte mit einem JSON-Array, das nur die Empfehlungen enthält, ohne zusätzlichen Text.
Beispiel: ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"]
`;

      const messages = [
        {
          role: "system",
          content: "Du bist ein spezialisierter Berater für Menschenrechtsaktivisten. Generiere präzise, handlungsorientierte Empfehlungen."
        },
        {
          role: "user",
          content: recommendationPrompt
        }
      ];

      const completion = await this.groq.chat.completions.create({
        messages,
        model: modelName,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || options.maxOutputTokens || 2048,
        top_p: 0.95,
        response_format: { type: "json_object" },
        stream: false
      });

      const responseText = completion.choices[0]?.message?.content || "[]";
      
      try {
        const parsed = JSON.parse(responseText);
        // Wenn die Antwort ein JSON-Objekt ist, versuche "recommendations" zu extrahieren
        if (Array.isArray(parsed)) {
          return parsed;
        } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          return parsed.recommendations;
        } else {
          // Fallback: Versuche andere Felder oder konvertiere zu Array
          const possibleArrays = Object.values(parsed).find(value => Array.isArray(value));
          if (possibleArrays) return possibleArrays as string[];
          
          // Letzter Ausweg: Teile die Antwort nach Zeilenumbrüchen
          return [responseText];
        }
      } catch (parseError) {
        console.error("Fehler beim Parsen der JSON-Antwort von Groq:", parseError);
        // Fallback: Teile den Text in Zeilen auf
        return responseText.split('\n').filter(line => line.trim() !== '');
      }
    } catch (error) {
      console.error("Fehler bei der Generierung von Empfehlungen mit Groq:", error);
      throw new Error(`Fehler bei der Generierung von Empfehlungen mit Groq: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generiert Inhalte basierend auf den übergebenen Parametern
   */
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
      // Modellauswahl basierend auf dem Aufgabentyp
      let selectedModel = 'llama3-70b-8192'; // Standardmodell
      let optimizedParams: RequestOptions = { prompt: params.prompt };

      if (params.taskType) {
        try {
          // Optimale Modellauswahl für Groq-Modelle
          const modelRecommendation = aiOptimizer.selectOptimalModel(params.taskType, {
            preferLowCost: params.preferLowCost,
            requireMultimodal: false,
            preferredProvider: 'groq'
          });

          if (modelRecommendation && modelRecommendation.modelName.includes('llama') || 
              modelRecommendation.modelName.includes('mixtral') ||
              modelRecommendation.modelName.includes('gemma')) {
            selectedModel = modelRecommendation.modelName;
            // Optimierte Parameter aus der Empfehlung übernehmen
            Object.assign(optimizedParams, modelRecommendation.parameters);
          }
        } catch (optimizerError) {
          console.warn("Fehler bei der Modelloptimierung, verwende Standard-Modell:", optimizerError);
        }
      }

      // Ausgabeformat festlegen (z.B. JSON)
      const responseFormat = params.outputFormat === 'json' 
        ? { type: "json_object" } 
        : undefined;

      // Optionale Kontextanreicherung
      if (params.enrichWithResources) {
        const enrichedContext = await contextEnrichmentService.enrichPromptWithResources(params.prompt);
        optimizedParams.prompt = enrichedContext;
      }

      // Prompt optimieren (falls Aufgabentyp bekannt)
      if (params.taskType) {
        try {
          const optimizedPrompt = aiOptimizer.optimizePrompt(params.prompt, params.taskType, {
            targetModel: selectedModel,
            outputFormat: params.outputFormat
          });
          
          if (optimizedPrompt) {
            optimizedParams.prompt = optimizedPrompt;
          }
        } catch (promptOptimizationError) {
          console.warn("Fehler bei der Prompt-Optimierung:", promptOptimizationError);
        }
      }

      // Anfrage an Groq API senden
      const messages = [
        {
          role: "system",
          content: "Du bist ein Experte für Menschenrechtsdokumentation und -analyse. Liefere detaillierte, gut strukturierte und fundierte Antworten."
        },
        {
          role: "user",
          content: optimizedParams.prompt
        }
      ];

      const completion = await this.groq.chat.completions.create({
        messages,
        model: selectedModel,
        temperature: params.temperature || groqModelOptimizationParams[selectedModel]?.temperature || 0.7,
        max_tokens: params.max_tokens || groqModelOptimizationParams[selectedModel]?.maxTokens || 2048,
        top_p: optimizedParams.topP || groqModelOptimizationParams[selectedModel]?.topP || 0.95,
        response_format: responseFormat,
        stream: false
      });

      return completion.choices[0]?.message?.content || "";
      
    } catch (error) {
      console.error("Fehler bei der Inhaltsgenerierung mit Groq:", error);
      throw new Error(`Fehler bei der Inhaltsgenerierung mit Groq: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Muster in mehreren Dokumenten erkennen
   */
  async detectPatterns(documents: Array<{ id: number; content: string }>): Promise<any> {
    try {
      const documentsFormatted = documents.map(doc => 
        `Dokument ${doc.id}:\n${doc.content.substring(0, 2000)}${doc.content.length > 2000 ? '...' : ''}`
      ).join('\n\n');

      const prompt = `
Analysiere die folgenden Dokumente und identifiziere gemeinsame Muster, Trends, Widersprüche und Zusammenhänge zwischen ihnen:

${documentsFormatted}

Format der Antwort:
{
  "patterns": [
    {
      "name": "Name des Musters",
      "description": "Beschreibung des Musters",
      "documents": [Dokument-IDs, die das Muster enthalten],
      "relevance": "Relevanz des Musters für Menschenrechtsanalysen (hoch/mittel/niedrig)"
    }
  ],
  "connections": [
    {
      "description": "Beschreibung der Verbindung",
      "documents": [Dokument-IDs, die verbunden sind],
      "type": "Typ der Verbindung (kausal/temporal/räumlich/thematisch)"
    }
  ],
  "contradictions": [
    {
      "description": "Beschreibung des Widerspruchs",
      "documents": [Dokument-IDs mit widersprüchlichen Informationen],
      "resolution": "Mögliche Erklärung oder Auflösung des Widerspruchs"
    }
  ],
  "summary": "Zusammenfassende Analyse aller Dokumente"
}
`;

      const messages = [
        {
          role: "system",
          content: "Du bist ein Experte für Dokumentenanalyse und Musterkennung im Kontext von Menschenrechtsarbeit."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const completion = await this.groq.chat.completions.create({
        messages,
        model: 'llama3-70b-8192', // Komplexe Analyse erfordert das stärkste Modell
        temperature: 0.2,
        max_tokens: 4096,
        top_p: 0.95,
        response_format: { type: "json_object" },
        stream: false
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Fehler beim Parsen der JSON-Antwort von Groq:", parseError);
        return { error: "Ungültiges Antwortformat", rawResponse: responseText };
      }
    } catch (error) {
      console.error("Fehler bei der Mustererkennung mit Groq:", error);
      throw new Error(`Fehler bei der Mustererkennung mit Groq: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Rechtliche Strategien vorschlagen
   */
  async suggestLegalStrategy(caseData: any): Promise<any> {
    try {
      const caseDataFormatted = JSON.stringify(caseData, null, 2);

      const prompt = `
Analysiere den folgenden Fall und schlage menschenrechtliche und rechtliche Strategien vor:

${caseDataFormatted}

Format der Antwort:
{
  "legalFrameworks": [
    {
      "name": "Name des rechtlichen Rahmens",
      "relevance": "Relevanz für den Fall",
      "applicableArticles": ["Artikel X", "Artikel Y"],
      "precedents": ["Relevante Präzedenzfälle"]
    }
  ],
  "actionableStrategies": [
    {
      "name": "Name der Strategie",
      "description": "Detaillierte Beschreibung",
      "requiredResources": ["Ressource 1", "Ressource 2"],
      "expectedOutcomes": ["Ergebnis 1", "Ergebnis 2"],
      "timeline": "Geschätzter Zeitrahmen",
      "risks": ["Risiko 1", "Risiko 2"],
      "priority": "Hoch/Mittel/Niedrig"
    }
  ],
  "recommendations": [
    "Empfehlung 1",
    "Empfehlung 2"
  ],
  "summary": "Zusammenfassende Bewertung der Situation und der vorgeschlagenen Strategien"
}
`;

      const messages = [
        {
          role: "system",
          content: "Du bist ein Experte für Menschenrechtsrecht und strategische Prozessführung. Analysiere den Fall und schlage konkrete, umsetzbare rechtliche Strategien vor."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const completion = await this.groq.chat.completions.create({
        messages,
        model: 'llama3-70b-8192',
        temperature: 0.3,
        max_tokens: 4096,
        top_p: 0.95,
        response_format: { type: "json_object" },
        stream: false
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Fehler beim Parsen der JSON-Antwort von Groq:", parseError);
        return { error: "Ungültiges Antwortformat", rawResponse: responseText };
      }
    } catch (error) {
      console.error("Fehler bei der Strategieberatung mit Groq:", error);
      throw new Error(`Fehler bei der Strategieberatung mit Groq: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Private Helper-Methoden

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

      Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.
      Stelle sicher, dass das JSON valide ist. Verwende null für Felder, wenn keine Informationen gefunden wurden.
    `;
  }
}