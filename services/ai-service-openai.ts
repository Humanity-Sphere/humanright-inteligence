/**
 * OpenAI Service Implementierung für die HumanRightsIntelligence App
 * 
 * Diese Datei enthält die Implementierung des OpenAI-Dienstes, der die neuesten
 * OpenAI Modelle zur Verfügung stellt und für Textgenerierung, Dokumentenanalyse
 * und andere AI-Funktionen verwendet werden kann.
 */

import OpenAI from "openai";
import { AIServiceConfig, DocumentAnalysisResult, IAIService, RequestOptions, TaskType } from "./ai-service-factory";

/**
 * OpenAI Service Klasse, die die IAIService Schnittstelle implementiert
 */
export class OpenAIService implements IAIService {
  private client: OpenAI;
  private model: string;

  /**
   * Konstruktor für den OpenAI Service
   * 
   * @param config Die Konfiguration für den OpenAI-Dienst
   */
  constructor(config: AIServiceConfig) {
    this.client = new OpenAI({ 
      apiKey: config.apiKey 
    });
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.model = config.model || "gpt-4o";
  }

  /**
   * Generiert Inhalt basierend auf einem Prompt und optionalen Parametern
   * 
   * @param params Parameter für die Inhaltsgenerierung
   * @returns Der generierte Inhalt als String
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
      // Ermittle das optimale Modell basierend auf dem Task und den Präferenzen
      const model = this._selectOptimalModel(params.taskType, {
        preferLowCost: params.preferLowCost || false
      });

      // Bereite den Prompt vor
      let systemPrompt = "Du bist ein Assistent für Menschenrechtsverteidiger, der präzise und faktentreue Informationen liefert.";

      // Prompt-Optimierung basierend auf dem Aufgabentyp
      const optimizedPrompt = this._optimizePrompt(params.prompt, params.taskType, {
        outputFormat: params.outputFormat
      });
      
      // Konfiguriere die Antwortformatierung
      const responseFormat = params.outputFormat === 'json' ? 
        { type: "json_object" as const } : undefined;

      // Anfrage an die OpenAI API senden
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: optimizedPrompt }
        ],
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens,
        response_format: responseFormat
      });

      // Rückgabe des generierten Inhalts
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Fehler bei der Inhaltsgenerierung mit OpenAI:", error);
      throw new Error(`Fehler bei der Inhaltsgenerierung: ${error.message}`);
    }
  }

  /**
   * Analysiert ein Dokument mit OpenAI
   * 
   * @param document Das zu analysierende Dokument
   * @returns Analyseresultat als dokumentstrukturiertes Objekt
   */
  async analyzeDocument(document: { title?: string; type?: string; content: string }): Promise<DocumentAnalysisResult> {
    try {
      // Erstelle einen Prompt für die Dokumentenanalyse
      const prompt = this._createDocumentAnalysisPrompt(document);
      
      // Anfrage an die OpenAI API senden
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "Du bist ein Experte für juristische Dokumente und Menschenrechtsanalysen. Analysiere das folgende Dokument und gib die Ergebnisse im angeforderten JSON-Format zurück."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      // Parse die Antwort und gib die strukturierten Daten zurück
      const content = response.choices[0].message.content || "{}";
      return this._parseAnalysisResult(content);
    } catch (error) {
      console.error("Fehler bei der Dokumentenanalyse mit OpenAI:", error);
      throw new Error(`Fehler bei der Dokumentenanalyse: ${error.message}`);
    }
  }

  /**
   * Erkennt Muster in einer Sammlung von Dokumenten
   * 
   * @param documents Array von Dokumenten zur Musteranalyse
   * @returns Erkannte Muster und Zusammenhänge
   */
  async detectPatterns(documents: Array<{ id: number; content: string }>): Promise<any> {
    try {
      // Bereite die Dokumente für die Analyse vor
      const documentTexts = documents.map(doc => `Dokument ID ${doc.id}: ${doc.content.substring(0, 1500)}...`).join("\n\n");
      
      const prompt = `
        Analysiere die folgenden Dokumentauszüge und identifiziere Muster, Zusammenhänge und mögliche Verbindungen 
        zwischen ihnen im Kontext von Menschenrechtsverletzungen. Berücksichtige wiederholte Ereignisse, 
        ähnliche Taktiken, geographische Zusammenhänge und zeitliche Muster.
        
        ${documentTexts}
        
        Antworte im folgenden JSON-Format:
        {
          "identifiedPatterns": [
            {
              "description": "Beschreibung des Musters",
              "relatedDocuments": [Liste von Dokument-IDs],
              "confidence": Konfidenzwert (0.0-1.0),
              "patternType": "Art des Musters (z.B. 'geographic', 'temporal', 'tactical')",
              "significance": "Bedeutung für Menschenrechtsarbeit",
              "relatedLaws": ["Relevante Gesetze oder Normen"],
              "recommendedActions": ["Empfohlene Maßnahmen"]
            }
          ],
          "geographicScope": "Geographischer Bereich der identifizierten Muster",
          "temporalTrends": "Zeitliche Trends und Entwicklungen"
        }
      `;
      
      // Anfrage an die OpenAI API senden
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "Du bist ein Experte für Musteranalyse in Menschenrechtsdokumenten. Deine Aufgabe ist es, subtile Verbindungen und Muster zu erkennen."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      });

      // Parse und gib die Antwort zurück
      const content = response.choices[0].message.content || "{}";
      return JSON.parse(content);
    } catch (error) {
      console.error("Fehler bei der Mustererkennung mit OpenAI:", error);
      throw new Error(`Fehler bei der Mustererkennung: ${error.message}`);
    }
  }

  /**
   * Schlägt eine rechtliche Strategie basierend auf Falldaten vor
   * 
   * @param caseData Die Falldaten für die Strategieentwicklung
   * @returns Vorgeschlagene rechtliche Strategie
   */
  async suggestLegalStrategy(caseData: any): Promise<any> {
    try {
      const prompt = `
        Entwickle eine rechtliche Strategie für den folgenden Fall im Bereich der Menschenrechte:
        
        ${JSON.stringify(caseData, null, 2)}
        
        Berücksichtige dabei internationale Menschenrechtsstandards, relevante Präzedenzfälle und 
        praktische Überlegungen. Die Strategie sollte sowohl kurzfristige als auch langfristige Ziele umfassen.
        
        Antworte im folgenden JSON-Format:
        {
          "legalApproach": "Allgemeiner rechtlicher Ansatz",
          "applicableLaws": ["Liste anwendbarer Gesetze und Standards"],
          "keyArguments": ["Hauptargumente"],
          "evidenceNeeded": ["Benötigte Beweise"],
          "potentialChallenges": ["Mögliche Herausforderungen"],
          "recommendedActions": {
            "immediate": ["Sofortige Maßnahmen"],
            "shortTerm": ["Kurzfristige Maßnahmen"],
            "longTerm": ["Langfristige Maßnahmen"]
          },
          "alternativeApproaches": ["Alternative Ansätze"],
          "successProbability": Erfolgswahrscheinlichkeit (0.0-1.0),
          "resourcesRequired": "Benötigte Ressourcen"
        }
      `;
      
      // Anfrage an die OpenAI API senden
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "Du bist ein erfahrener Rechtsexperte für Menschenrechte mit einem tiefen Verständnis internationaler Rechtssysteme und Menschenrechtsstandards."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      });

      // Parse und gib die Antwort zurück
      const content = response.choices[0].message.content || "{}";
      return JSON.parse(content);
    } catch (error) {
      console.error("Fehler bei der Rechtsstrategie-Generierung mit OpenAI:", error);
      throw new Error(`Fehler bei der Rechtsstrategie-Generierung: ${error.message}`);
    }
  }

  /**
   * Erstellt einen Prompt für die Dokumentenanalyse
   * 
   * @param document Das zu analysierende Dokument
   * @returns Prompt für die Analyse
   * @private
   */
  private _createDocumentAnalysisPrompt(document: { title?: string; type?: string; content: string }): string {
    return `
      Analysiere das folgende Dokument ${document.title ? `mit dem Titel "${document.title}"` : ""} 
      ${document.type ? `vom Typ "${document.type}"` : ""}:

      ${document.content}

      Extrahiere die folgenden Informationen und formatiere deine Antwort als JSON-Objekt:
      {
        "beteiligte_parteien": ["Liste aller beteiligten Personen, Organisationen, Behörden"],
        "rechtliche_grundlagen": [{"reference": "Referenz", "description": "Beschreibung"}],
        "zentrale_fakten": ["Liste der wichtigsten Fakten"],
        "menschenrechtliche_implikationen": ["Liste der Menschenrechtsimplikationen"],
        "verbindungen": ["Mögliche Verbindungen zu anderen Fällen oder Mustern"],
        "zeitliche_abfolge": ["Chronologische Ereignisliste"],
        "schlüsselwörter": ["Relevante Schlüsselwörter"],
        "sentiment": "Allgemeine Stimmung des Dokuments (neutral, negativ, positiv)",
        "suggestedActions": ["Empfohlene Maßnahmen"],
        "contradictions": [{"statement1": "Aussage 1", "statement2": "Widersprüchliche Aussage", "explanation": "Erklärung"}]
      }
    `;
  }

  /**
   * Parst das Ergebnis der Dokumentenanalyse
   * 
   * @param content Der Antwortinhalt als JSON-String
   * @returns Strukturiertes Analyseergebnis
   * @private
   */
  private _parseAnalysisResult(content: string): DocumentAnalysisResult {
    try {
      return JSON.parse(content) as DocumentAnalysisResult;
    } catch (error) {
      console.error("Fehler beim Parsen des Analyseergebnisses:", error);
      return {
        beteiligte_parteien: [],
        rechtliche_grundlagen: [],
        zentrale_fakten: [],
        menschenrechtliche_implikationen: [],
        verbindungen: [],
        zeitliche_abfolge: [],
        schlüsselwörter: [],
        sentiment: "unbekannt",
        suggestedActions: [],
        contradictions: []
      };
    }
  }

  /**
   * Wählt das optimale Modell basierend auf dem Task und den Präferenzen
   * 
   * @param taskType Art der Aufgabe
   * @param options Optionen zur Modellauswahl
   * @returns Name des ausgewählten Modells
   * @private
   */
  private _selectOptimalModel(taskType?: TaskType, options?: { preferLowCost?: boolean }): string {
    const { preferLowCost } = options || {};
    
    // Standard-Modell, wenn keine spezifischen Anforderungen
    let selectedModel = this.model;
    
    if (preferLowCost) {
      // Cost-optimized Modell
      selectedModel = "gpt-3.5-turbo";
      return selectedModel;
    }
    
    if (taskType) {
      switch (taskType) {
        case TaskType.CREATIVE_WRITING:
          // Kreatives Schreiben braucht mehr Expressivität
          selectedModel = "gpt-4o"; 
          break;
        case TaskType.DOCUMENT_ANALYSIS:
          // Dokumentenanalyse braucht die besten Fähigkeiten
          selectedModel = "gpt-4o";
          break;
        case TaskType.CODE_GENERATION:
          // Code-Generierung benötigt spezialisierte Fähigkeiten
          selectedModel = "gpt-4o";
          break;
        case TaskType.TRANSLATION:
          // Übersetzungen können mit günstigeren Modellen erfolgen
          selectedModel = preferLowCost ? "gpt-3.5-turbo" : "gpt-4o";
          break;
        case TaskType.SUMMARIZATION:
          // Zusammenfassungen können mit günstigeren Modellen erfolgen
          selectedModel = preferLowCost ? "gpt-3.5-turbo" : "gpt-4o";
          break;
        case TaskType.QUESTION_ANSWERING:
          // Frage-Antwort kann variieren je nach Komplexität
          selectedModel = preferLowCost ? "gpt-3.5-turbo" : "gpt-4o";
          break;
        default:
          // Standardmodell wenn kein spezifischer Task
          selectedModel = "gpt-4o";
      }
    }
    
    return selectedModel;
  }

  /**
   * Optimiert den Prompt basierend auf dem Task und den Optionen
   * 
   * @param prompt Der ursprüngliche Prompt
   * @param taskType Art der Aufgabe
   * @param options Zusätzliche Optionen
   * @returns Optimierter Prompt
   * @private
   */
  private _optimizePrompt(prompt: string, taskType?: TaskType, options?: {
    outputFormat?: 'json' | 'markdown' | 'html' | 'text'
  }): string {
    const { outputFormat } = options || {};
    let optimizedPrompt = prompt;
    
    // Füge formatierungsspezifische Anweisungen hinzu
    if (outputFormat) {
      let formatInstruction = "";
      
      switch (outputFormat) {
        case 'json':
          formatInstruction = "Antworte im validen JSON-Format.";
          break;
        case 'markdown':
          formatInstruction = "Formatiere deine Antwort in Markdown mit entsprechenden Überschriften, Listen und Hervorhebungen.";
          break;
        case 'html':
          formatInstruction = "Antworte mit gut strukturiertem HTML-Code, der direkt in eine Webseite eingebettet werden kann.";
          break;
        case 'text':
          formatInstruction = "Antworte in klarem, einfachem Text ohne besondere Formatierung.";
          break;
      }
      
      if (formatInstruction) {
        optimizedPrompt = `${optimizedPrompt}\n\n${formatInstruction}`;
      }
    }
    
    // Aufgabenspezifische Optimierungen
    if (taskType) {
      let taskInstruction = "";
      
      switch (taskType) {
        case TaskType.CREATIVE_WRITING:
          taskInstruction = "Sei kreativ und ausdrucksstark in deiner Antwort.";
          break;
        case TaskType.DOCUMENT_ANALYSIS:
          taskInstruction = "Analysiere das Dokument objektiv und identifiziere die wichtigsten Aspekte.";
          break;
        case TaskType.CODE_GENERATION:
          taskInstruction = "Erstelle fehlerfreien, gut kommentierten und effizienten Code.";
          break;
        case TaskType.TRANSLATION:
          taskInstruction = "Übersetze präzise unter Berücksichtigung kultureller Nuancen.";
          break;
        case TaskType.SUMMARIZATION:
          taskInstruction = "Fasse die wichtigsten Punkte klar und prägnant zusammen.";
          break;
        case TaskType.QUESTION_ANSWERING:
          taskInstruction = "Beantworte die Frage direkt und präzise mit relevanten Informationen.";
          break;
      }
      
      if (taskInstruction) {
        optimizedPrompt = `${optimizedPrompt}\n\n${taskInstruction}`;
      }
    }
    
    return optimizedPrompt;
  }
}