/**
 * Gemini Service Implementation
 * 
 * Diese Klasse implementiert das IAIService Interface mit Google Gemini API.
 */

import { GoogleGenerativeAI, GenerationConfig, Content, Part } from "@google/generative-ai";
import { IAIService, DocumentAnalysisResult } from "../ai-service";
import { TaskType } from "./ai-service-factory";
import fs from 'fs';

/**
 * Gemini Service Implementierung
 */
export class GeminiService implements IAIService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private jsonGenerationConfig: GenerationConfig;
  private standardGenerationConfig: GenerationConfig;
  
  constructor(apiKey: string, model: string = "gemini-1.5-flash") {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
    
    // Konfiguration für JSON-Ausgaben (niedriger Temperature)
    this.jsonGenerationConfig = {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
    
    // Standard-Konfiguration
    this.standardGenerationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
  }
  
  /**
   * Erstellt einen Prompt für die Dokumentenanalyse
   */
  private _createDocumentAnalysisPrompt(document: { title?: string; type?: string; content: string }): string {
    return `
    ## AUFGABE: MENSCHENRECHTLICHE DOKUMENTENANALYSE
    
    Analysiere das folgende Dokument aus menschenrechtlicher Perspektive:
    
    ${document.title ? `TITEL: ${document.title}` : ''}
    ${document.type ? `DOKUMENTTYP: ${document.type}` : ''}
    
    INHALT:
    ${document.content}
    
    ## ANALYSIERE FOLGENDE ASPEKTE:
    
    1. BETEILIGTE PARTEIEN (Individuen, Gruppen, Institutionen)
    2. RECHTLICHE GRUNDLAGEN (relevante Gesetze, Normen, internationale Abkommen)
    3. ZENTRALE FAKTEN (wichtigste Ereignisse und Informationen)
    4. MENSCHENRECHTLICHE IMPLIKATIONEN (betroffene Rechte, potenzielle Verletzungen)
    5. VERBINDUNGEN (Zusammenhänge mit anderen Fällen, Mustern oder Trends)
    6. ZEITLICHE ABFOLGE (chronologische Ereignisabfolge, wenn erkennbar)
    7. SCHLÜSSELWÖRTER (für Kategorisierung und Suche)
    8. SENTIMENT (Tonalität des Dokuments)
    9. EMPFOHLENE MASSNAHMEN (basierend auf der Analyse)
    10. WIDERSPRÜCHE (identifizierte Unstimmigkeiten im Dokument)
    
    Liefere die Ergebnisse in einem strukturierten JSON-Format, mit Feldern für jeden der oben genannten Aspekte. Halte die Antworten präzise und relevant für Menschenrechtsverteidiger. Bei Unsicherheiten gib "unbekannt" an, statt zu spekulieren.
    
    Das JSON sollte folgende Struktur haben:
    {
      "beteiligte_parteien": ["Person/Gruppe 1", "Person/Gruppe 2"],
      "rechtliche_grundlagen": [
        { "reference": "Gesetz/Abkommen", "description": "Relevante Aspekte" }
      ],
      "zentrale_fakten": ["Fakt 1", "Fakt 2"],
      "menschenrechtliche_implikationen": ["Implikation 1", "Implikation 2"],
      "verbindungen": ["Verbindung 1", "Verbindung 2"],
      "zeitliche_abfolge": ["Ereignis 1", "Ereignis 2"],
      "schlüsselwörter": ["Keyword 1", "Keyword 2"],
      "sentiment": "Positive/Neutral/Negative",
      "suggestedActions": ["Aktion 1", "Aktion 2"],
      "contradictions": [
        { "statement1": "Aussage 1", "statement2": "Aussage 2", "explanation": "Erklärung des Widerspruchs" }
      ]
    }
    `;
  }
  
  /**
   * Parst das Ergebnis der Dokumentenanalyse
   */
  private _parseAnalysisResult(content: string): DocumentAnalysisResult {
    try {
      // Versuch, JSON direkt zu parsen
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonContent = jsonMatch[0].replace(/```json|```/g, '').trim();
        return JSON.parse(jsonContent);
      }
      
      // Fallback: Einfache Textanalyse
      return {
        beteiligte_parteien: this._extractListItemsFromSection(content, "BETEILIGTE PARTEIEN"),
        rechtliche_grundlagen: this._extractLegalBases(content),
        zentrale_fakten: this._extractListItemsFromSection(content, "ZENTRALE FAKTEN"),
        menschenrechtliche_implikationen: this._extractListItemsFromSection(content, "MENSCHENRECHTLICHE IMPLIKATIONEN"),
        verbindungen: this._extractListItemsFromSection(content, "VERBINDUNGEN"),
        zeitliche_abfolge: this._extractListItemsFromSection(content, "ZEITLICHE ABFOLGE"),
        schlüsselwörter: this._extractListItemsFromSection(content, "SCHLÜSSELWÖRTER"),
        sentiment: this._extractSingleValue(content, "SENTIMENT"),
        suggestedActions: this._extractListItemsFromSection(content, "EMPFOHLENE MASSNAHMEN"),
        contradictions: this._extractContradictions(content)
      };
    } catch (error) {
      console.error("Fehler beim Parsen des Analyseergebnisses:", error);
      
      // Rückgabe einer leeren Struktur im Fehlerfall
      return {
        beteiligte_parteien: [],
        rechtliche_grundlagen: [],
        zentrale_fakten: [],
        menschenrechtliche_implikationen: [],
        verbindungen: [],
        zeitliche_abfolge: [],
        schlüsselwörter: [],
        sentiment: "Fehler bei der Analyse",
        suggestedActions: [],
        contradictions: []
      };
    }
  }
  
  /**
   * Hilfsmethode zum Extrahieren von Listenelementen aus dem Text (Variante 1)
   */
  private _extractListItemsFromSection(content: string, section: string): string[] {
    const regex = new RegExp(`${section}[:\\s]*((?:.*\\n)*?)(?:\\n\\s*\\d+\\.|\\n\\s*[A-Z]|$)`, "i");
    const match = content.match(regex);
    
    if (!match) return [];
    
    return match[1]
      .split(/\n/)
      .map(line => line.replace(/^[-*•\s\d.]+/, "").trim())
      .filter(line => line.length > 0);
  }
  
  /**
   * Hilfsmethode zum Extrahieren von rechtlichen Grundlagen
   */
  private _extractLegalBases(content: string): { reference: string; description: string }[] {
    const listItems = this._extractListItemsWithLabels(content, ["RECHTLICHE GRUNDLAGEN"]);
    
    return listItems.map(item => {
      const parts = item.split(/:\s*/);
      if (parts.length > 1) {
        return { reference: parts[0].trim(), description: parts[1].trim() };
      } else {
        return { reference: item, description: "" };
      }
    });
  }
  
  /**
   * Hilfsmethode zum Extrahieren eines einzelnen Wertes
   */
  private _extractSingleValue(content: string, section: string): string {
    const regex = new RegExp(`${section}[:\\s]*(.*?)(?:\\n\\s*\\d+\\.|\\n\\s*[A-Z]|$)`, "i");
    const match = content.match(regex);
    
    return match ? match[1].trim() : "";
  }
  
  /**
   * Hilfsmethode zum Extrahieren von Widersprüchen
   */
  private _extractContradictions(content: string): { statement1: string; statement2: string; explanation: string }[] {
    const regex = /WIDERSPRÜCHE[:\\s]*((?:.*\n)*?)(?:\n\s*\d+\.|\n\s*[A-Z]|$)/i;
    const match = content.match(regex);
    
    if (!match) return [];
    
    const contradictionsText = match[1];
    const contradictionEntries = contradictionsText.split(/\n/).filter(line => line.trim().length > 0);
    
    return contradictionEntries.map(entry => {
      const parts = entry.split(" vs. ");
      if (parts.length >= 2) {
        const statement1 = parts[0].replace(/^[-*•\s\d.]+/, "").trim();
        const remainingParts = parts.slice(1).join(" vs. ").split(":");
        let statement2 = remainingParts[0].trim();
        let explanation = remainingParts.length > 1 ? remainingParts.slice(1).join(":").trim() : "";
        
        return { statement1, statement2, explanation };
      } else {
        // Fallback
        return { 
          statement1: entry, 
          statement2: "", 
          explanation: ""
        };
      }
    });
  }

  /**
   * Analysiert ein Dokument und gibt die Ergebnisse zurück
   */
  async analyzeDocument(document: { title?: string; type?: string; content: string }): Promise<DocumentAnalysisResult> {
    try {
      const prompt = this._createDocumentAnalysisPrompt(document);
      
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: this.jsonGenerationConfig,
        systemInstruction: "Du bist ein spezialisierter Assistent für Menschenrechtsverteidiger, der Dokumente analysiert und relevante Informationen aus menschenrechtlicher Perspektive extrahiert."
      });
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      
      return this._parseAnalysisResult(content);
    } catch (error) {
      console.error("Fehler bei der Dokumentenanalyse:", error);
      throw new Error(`Gemini Dokumentenanalyse fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generiert Inhalte basierend auf einem Prompt
   */
  async generateContent(params: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    enrichWithResources?: boolean;
    taskType?: string;
    preferLowCost?: boolean;
    outputFormat?: 'json' | 'markdown' | 'html' | 'text';
    documentType?: string;
    useMenschenrechtsStandards?: boolean;
  }): Promise<string> {
    try {
      // Generierung-Konfiguration anpassen
      const generationConfig: GenerationConfig = { ...this.standardGenerationConfig };
      
      if (params.max_tokens) {
        generationConfig.maxOutputTokens = params.max_tokens;
      }
      
      if (params.temperature !== undefined) {
        generationConfig.temperature = params.temperature;
      } else if (params.outputFormat === 'json') {
        // Für JSON-Ausgabe niedrigere Temperature verwenden
        generationConfig.temperature = 0.2;
      }
      
      // Systemanweisung basierend auf Aufgabentyp und Ausgabeformat
      let systemInstruction = "Du bist ein hilfreicher Assistent für Menschenrechtsverteidiger.";
      
      // Wenn Menschenrechtsstandards verwendet werden sollen, importiere diese
      if (params.useMenschenrechtsStandards) {
        try {
          const humanRightsModule = require('../services/human-rights-standards');
          const standards = humanRightsModule.getHumanRightsStandards();
          
          // Systemanweisung ergänzen
          if (params.documentType && typeof params.documentType === 'string') {
            const documentTypeEnum = params.documentType as any;
            const standardsInstructions = standards.getSystemInstructions(documentTypeEnum);
            
            if (standardsInstructions) {
              systemInstruction = `${systemInstruction}\n\n${standardsInstructions}`;
              console.log('Menschenrechtsstandards in KI-Prompt integriert');
            }
            
            // Ergänze den Prompt mit relevanten Dokumentformaten und Richtlinien
            if (params.prompt.includes('analysiere') || params.prompt.includes('extrahiere') || 
                params.prompt.includes('verstehe') || params.prompt.includes('examine')) {
              params.prompt = standards.generateAnalysisPrompt(documentTypeEnum, params.prompt);
            } else if (params.prompt.includes('erstelle') || params.prompt.includes('generiere') || 
                      params.prompt.includes('schreibe') || params.prompt.includes('formuliere')) {
              params.prompt = standards.generateCreationPrompt(documentTypeEnum, { originalPrompt: params.prompt });
            }
          }
        } catch (err) {
          console.warn('Fehler beim Laden der Menschenrechtsstandards:', err);
        }
      }
      
      if (params.taskType) {
        switch (params.taskType) {
          case "CREATIVE_WRITING":
            systemInstruction = "Du bist ein kreativer Schreibassistent, der einzigartige und ansprechende Inhalte erstellt.";
            break;
          case "DOCUMENT_ANALYSIS":
            systemInstruction = "Du bist ein Dokumentanalyst, der Texte gründlich untersucht und die relevantesten Informationen extrahiert.";
            break;
          case "CODE_GENERATION":
            systemInstruction = "Du bist ein Programmierassistent, der effizienten, gut kommentierten Code nach Best Practices erstellt.";
            break;
          case "TRANSLATION":
            systemInstruction = "Du bist ein Übersetzungsexperte, der präzise Übersetzungen liefert und dabei kulturelle Nuancen berücksichtigt.";
            break;
          case "SUMMARIZATION":
            systemInstruction = "Du bist ein Experte für Zusammenfassungen, der komplexe Inhalte prägnant und verständlich komprimiert.";
            break;
          case "QUESTION_ANSWERING":
            systemInstruction = "Du bist ein Experte für Frage-Antwort-Interaktionen und lieferst präzise, faktisch korrekte Antworten.";
            break;
          case "BRAINSTORMING":
            systemInstruction = "Du bist ein Kreativitätscoach, der vielfältige und innovative Ideen generiert.";
            break;
          case "LEGAL_ANALYSIS":
            systemInstruction = "Du bist ein Rechtsexperte, der juristische Analysen mit Bezug auf relevante Gesetze, Präzedenzfälle und Rechtsprinzipien durchführt.";
            break;
        }
      }
      
      // Ausgabeformat-Anweisungen hinzufügen
      if (params.outputFormat) {
        switch (params.outputFormat) {
          case 'json':
            systemInstruction += " Gib deine Antworten als gültiges JSON zurück.";
            break;
          case 'markdown':
            systemInstruction += " Formatiere deine Antworten in Markdown mit geeigneten Überschriften, Listen und Hervorhebungen.";
            break;
          case 'html':
            systemInstruction += " Formatiere deine Antworten als HTML mit geeigneten Elementen für Struktur und Formatierung.";
            break;
        }
      }
      
      // Modell initialisieren
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig,
        systemInstruction
      });
      
      // Inhalt generieren
      const result = await model.generateContent(params.prompt);
      const response = result.response;
      
      return response.text();
    } catch (error) {
      console.error("Fehler bei der Inhaltsgenerierung:", error);
      throw new Error(`Gemini Inhaltsgenerierung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Multimodale Inhalte generieren
   */
  async generateMultimodalContent(params: {
    prompt: string;
    images?: string[];  // Base64-codierte Bilder
    max_tokens?: number;
    temperature?: number;
    outputFormat?: 'json' | 'markdown' | 'html' | 'text';
  }): Promise<string> {
    try {
      // Generierung-Konfiguration anpassen
      const generationConfig: GenerationConfig = { ...this.standardGenerationConfig };
      
      if (params.max_tokens) {
        generationConfig.maxOutputTokens = params.max_tokens;
      }
      
      if (params.temperature !== undefined) {
        generationConfig.temperature = params.temperature;
      } else if (params.outputFormat === 'json') {
        generationConfig.temperature = 0.2;
      }
      
      // Systemanweisung
      const systemInstruction = "Du bist ein hilfreicher Assistent für Menschenrechtsverteidiger, der sowohl Text als auch Bilder analysieren kann.";
      
      // Modell initialisieren
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-pro", // Use Gemini Pro for multimodal
        generationConfig,
        systemInstruction
      });
      
      // Multimodalen Inhalt erstellen
      const parts: Part[] = [{ text: params.prompt }];
      
      // Bilder hinzufügen, falls vorhanden
      if (params.images && params.images.length > 0) {
        for (const imageBase64 of params.images) {
          parts.push({
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg"
            }
          });
        }
      }
      
      // Inhalt generieren mit dem korrekten Request-Format
      const result = await model.generateContent(parts);
      const response = result.response;
      
      return response.text();
    } catch (error) {
      console.error("Fehler bei der multimodalen Inhaltsgenerierung:", error);
      throw new Error(`Gemini multimodale Inhaltsgenerierung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Erkennt Muster in einer Sammlung von Dokumenten
   */
  async detectPatterns(documents: Array<{ id: number; content: string; context?: string }>): Promise<any> {
    try {
      // Begrenzen der Dokumentlänge, um Tokenüberschreitungen zu vermeiden
      const truncateContent = (content: string, maxChars = 2000) => {
        if (content.length <= maxChars) return content;
        return content.substring(0, maxChars) + "...";
      };
      
      // Vorverarbeitung der Dokumente mit Längenbegrenzung
      const processedDocs = documents.map(doc => ({
        id: doc.id,
        content: truncateContent(doc.content),
        context: doc.context ? truncateContent(doc.context, 500) : undefined
      }));
      
      // Erstellen eines strukturierten Prompts
      let promptText = `## AUFGABE: MENSCHENRECHTLICHE MUSTERERKENNUNG\n\n`;
      promptText += `Analysiere die folgenden Dokumente und identifiziere wiederkehrende Muster, Zusammenhänge und Trends, die für Menschenrechtsverteidiger relevant sein könnten.\n\n`;
      
      // Dokumente zum Prompt hinzufügen
      promptText += `## DOKUMENTE ZUR ANALYSE:\n\n`;
      processedDocs.forEach(doc => {
        promptText += `### DOKUMENT ${doc.id}:\n${doc.content}\n\n`;
        
        // Kontext hinzufügen, falls vorhanden
        if (doc.context) {
          promptText += `ZUSÄTZLICHER KONTEXT FÜR DOKUMENT ${doc.id}:\n${doc.context}\n\n`;
        }
      });
      
      // Klare Anweisungen für die Ausgabe
      promptText += `## AUSGABEFORMAT (JSON):\n
{
  "patterns": [
    {
      "name": "Name des erkannten Musters",
      "description": "Detaillierte Beschreibung des Musters",
      "documentIds": [Dokument-IDs, in denen das Muster auftritt],
      "evidence": ["Textpassage 1", "Textpassage 2"],
      "humanRightsDomains": ["Betroffener Menschenrechtsbereich 1", "Bereich 2"],
      "confidence": Konfidenzwert (0.0-1.0),
      "geographicScope": {
        "regions": ["Region 1", "Region 2"],
        "countries": ["Land 1", "Land 2"]
      },
      "temporalTrends": {
        "timeframe": "Zeitraum des Musters",
        "frequency": "Häufigkeit oder Trend"
      },
      "recommendations": ["Empfohlene Maßnahme 1", "Empfohlene Maßnahme 2"]
    }
  ],
  "themes": ["Hauptthema 1", "Hauptthema 2"],
  "connections": [
    {
      "type": "Art der Verbindung",
      "description": "Beschreibung der Verbindung",
      "documentIds": [Betroffene Dokument-IDs]
    }
  ],
  "anomalies": [
    {
      "description": "Beschreibung der Anomalie",
      "documentIds": [Betroffene Dokument-IDs],
      "significance": "Bedeutung der Anomalie"
    }
  ]
}`;
      
      console.log("Sende Anfrage an Gemini API für Mustererkennung...");
      
      // Optimierte Konfiguration für JSON-Ausgabe
      const jsonConfig = {
        ...this.jsonGenerationConfig,
        temperature: 0.2, // Niedrigere Temperatur für konsistentere JSON-Ausgabe
        maxOutputTokens: 4096 // Mehr Tokens für umfangreichere Analysen
      };
      
      // Modell mit geeigneter Systemanweisung initialisieren
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-pro", // Besseres Modell für komplexe Analysen
        generationConfig: jsonConfig,
        systemInstruction: "Du bist ein spezialisierter Analyst für Menschenrechtsverteidiger, der komplexe Informationen auswertet und Muster identifiziert. Deine Aufgabe ist es, strukturierte JSON-Ausgaben zu erstellen, die präzise und gut formatiert sind."
      });
      
      // Anfrage senden
      const result = await model.generateContent(promptText);
      const response = result.response;
      const content = response.text();
      
      console.log("Antwort von Gemini API erhalten, verarbeite...");
      
      // Robuste JSON-Extraktion mit mehreren Fallbacks
      try {
        // Versuch 1: JSON direkt parsen
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.log("Direktes Parsen fehlgeschlagen, versuche JSON-Block zu extrahieren...");
        }
        
        // Versuch 2: Markdown JSON-Block extrahieren
        const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          try {
            return JSON.parse(jsonBlockMatch[1]);
          } catch (blockParseError) {
            console.log("Markdown-Block-Parsing fehlgeschlagen, versuche regulären Ausdruck...");
          }
        }
        
        // Versuch 3: JSON-Objekt mit regulärem Ausdruck extrahieren
        const jsonMatch = content.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1]);
          } catch (regexParseError) {
            console.log("Regex-JSON-Extraktion fehlgeschlagen, erstelle strukturierte Antwort...");
          }
        }
        
        // Fallback: Strukturierte Antwort aus dem Inhalt extrahieren
        return {
          patterns: this._extractPatterns(content),
          themes: this._extractListSection(content, "Hauptthemen", "themes"),
          connections: this._extractConnections(content),
          anomalies: this._extractAnomalies(content)
        };
      } catch (error) {
        console.error("Fehler bei der Verarbeitung der Gemini-Antwort:", error);
        
        // Letzter Fallback: Minimal strukturierte Antwort
        return {
          patterns: [{
            name: "Nicht spezifiziertes Muster",
            description: "Aufgrund eines Fehlers bei der Verarbeitung konnte kein genaues Muster identifiziert werden.",
            documentIds: documents.map(d => d.id),
            confidence: 0.1,
            rawResponse: content.substring(0, 2000) + "..."
          }],
          error: `Fehler bei der Verarbeitung: ${error.message}`
        };
      }
    } catch (error) {
      console.error("Kritischer Fehler bei der Mustererkennung:", error);
      throw new Error(`Gemini Mustererkennung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hilfsmethode zum Extrahieren von Mustern aus Text
   */
  private _extractPatterns(content: string): any[] {
    try {
      // Versuche, den Pattern-Abschnitt zu identifizieren
      const patternSection = this._extractSection(content, "Muster", "patterns");
      if (!patternSection) return [];
      
      // Identifiziere einzelne Muster (normalerweise durch Nummerierung oder Überschriften getrennt)
      const patternBlocks = patternSection.split(/(?:\n\s*\d+\.|\n\s*-|\n\s*\*|\n\s*#{1,3})/g)
        .filter(block => block.trim().length > 10);
      
      return patternBlocks.map(block => {
        const name = this._extractValue(block, ["Name", "Titel", "Bezeichnung"]) || "Unbenanntes Muster";
        const description = this._extractValue(block, ["Beschreibung", "Details"]) || block.trim();
        
        // Versuche, Dokument-IDs zu extrahieren
        let documentIds: number[] = [];
        const idsMatch = block.match(/Dokumente?(?:\s*IDs?)?:?\s*((?:\d+(?:\s*,\s*)?)+)/i);
        if (idsMatch && idsMatch[1]) {
          documentIds = idsMatch[1].split(/\s*,\s*/).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        }
        
        // Extrahiere Konfidenzwert
        let confidence = 0.5;
        const confidenceMatch = block.match(/Konfidenz:?\s*(0\.\d+|[01])/i);
        if (confidenceMatch && confidenceMatch[1]) {
          confidence = parseFloat(confidenceMatch[1]);
        }
        
        return {
          name,
          description,
          documentIds,
          confidence,
          // Weitere Felder nach Bedarf extrahieren
          evidence: this._extractListItemsWithLabels(block, ["Belege", "Beweise", "Evidenz"]),
          recommendations: this._extractListItemsWithLabels(block, ["Empfehlungen", "Maßnahmen"])
        };
      });
    } catch (error) {
      console.error("Fehler beim Extrahieren der Muster:", error);
      return [];
    }
  }
  
  /**
   * Hilfsmethode zum Extrahieren von Verbindungen
   */
  private _extractConnections(content: string): any[] {
    const connectionSection = this._extractSection(content, "Verbindungen", "connections");
    if (!connectionSection) return [];
    
    const connectionBlocks = connectionSection.split(/(?:\n\s*\d+\.|\n\s*-|\n\s*\*)/g)
      .filter(block => block.trim().length > 10);
    
    return connectionBlocks.map(block => {
      const type = this._extractValue(block, ["Typ", "Art"]) || "Unspezifizierte Verbindung";
      const description = this._extractValue(block, ["Beschreibung", "Details"]) || block.trim();
      
      // Dokument-IDs extrahieren
      const documentIds: number[] = [];
      const idsMatch = block.match(/Dokumente?(?:\s*IDs?)?:?\s*((?:\d+(?:\s*,\s*)?)+)/i);
      if (idsMatch && idsMatch[1]) {
        idsMatch[1].split(/\s*,\s*/).forEach(idStr => {
          const id = parseInt(idStr, 10);
          if (!isNaN(id)) documentIds.push(id);
        });
      }
      
      return { type, description, documentIds };
    });
  }
  
  /**
   * Hilfsmethode zum Extrahieren von Anomalien
   */
  private _extractAnomalies(content: string): any[] {
    const anomalySection = this._extractSection(content, "Anomalien", "anomalies");
    if (!anomalySection) return [];
    
    const anomalyBlocks = anomalySection.split(/(?:\n\s*\d+\.|\n\s*-|\n\s*\*)/g)
      .filter(block => block.trim().length > 10);
    
    return anomalyBlocks.map(block => {
      const description = block.trim();
      
      // Dokument-IDs extrahieren
      const documentIds: number[] = [];
      const idsMatch = block.match(/Dokumente?(?:\s*IDs?)?:?\s*((?:\d+(?:\s*,\s*)?)+)/i);
      if (idsMatch && idsMatch[1]) {
        idsMatch[1].split(/\s*,\s*/).forEach(idStr => {
          const id = parseInt(idStr, 10);
          if (!isNaN(id)) documentIds.push(id);
        });
      }
      
      // Bedeutung extrahieren
      const significance = this._extractValue(block, ["Bedeutung", "Signifikanz"]) || "";
      
      return { description, documentIds, significance };
    });
  }
  
  /**
   * Hilfsmethode zum Extrahieren eines Abschnitts aus dem Text
   */
  private _extractSection(content: string, sectionName: string, alternativeName: string): string | null {
    const regexPattern = new RegExp(`(?:#+\\s*${sectionName}|${sectionName}:?|"${alternativeName}"\\s*:)\\s*([\\s\\S]*?)(?=\\n\\s*#+\\s*|$)`, 'i');
    const match = content.match(regexPattern);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Hilfsmethode zum Extrahieren von Listenelementen (Variante 2 mit mehreren Labels)
   */
  private _extractListItemsWithLabels(content: string, possibleLabels: string[]): string[] {
    for (const label of possibleLabels) {
      const regexPattern = new RegExp(`${label}:?\\s*([\\s\\S]*?)(?=\\n\\s*[A-Z]|$)`, 'i');
      const match = content.match(regexPattern);
      
      if (match && match[1]) {
        return match[1]
          .split(/\n/)
          .map(line => line.replace(/^[-*•\s\d.]+/, "").trim())
          .filter(line => line.length > 0);
      }
    }
    
    return [];
  }
  
  /**
   * Hilfsmethode zum Extrahieren eines Listenabschnitts
   */
  private _extractListSection(content: string, sectionName: string, alternativeName: string): string[] {
    const section = this._extractSection(content, sectionName, alternativeName);
    if (!section) return [];
    
    return section
      .split(/\n/)
      .map(line => line.replace(/^[-*•\s\d.]+/, "").trim())
      .filter(line => line.length > 0);
  }
  
  /**
   * Hilfsmethode zum Extrahieren eines Wertes
   */
  private _extractValue(content: string, possibleLabels: string[]): string | null {
    for (const label of possibleLabels) {
      const regexPattern = new RegExp(`${label}:?\\s*([^\\n]+)`, 'i');
      const match = content.match(regexPattern);
      
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  /**
   * Schlägt rechtliche Strategien basierend auf Falldaten vor
   */
  async suggestLegalStrategy(caseData: any): Promise<any> {
    try {
      const caseDescription = JSON.stringify(caseData, null, 2);
      
      const prompt = `Entwickle eine rechtliche Strategie für folgenden Fall:\n\n${caseDescription}\n\nGib das Ergebnis als JSON-Objekt zurück mit den folgenden Eigenschaften:
      - legalAssessment: Rechtliche Einschätzung des Falls
      - applicableLaws: Anwendbare Gesetze und Normen
      - potentialArguments: Mögliche rechtliche Argumentationslinien
      - risksAndChallenges: Risiken und Herausforderungen
      - recommendedActions: Empfohlene rechtliche Schritte
      - alternatives: Alternative Ansätze
      - timeline: Vorgeschlagener Zeitplan für Maßnahmen`;
      
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: this.jsonGenerationConfig,
        systemInstruction: "Du bist ein Rechtsexperte für Menschenrechtsverteidiger, der fundierte rechtliche Strategien und Handlungsempfehlungen entwickelt."
      });
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      
      // Versuch, JSON zu extrahieren und zu parsen
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonContent = jsonMatch[0].replace(/```json|```/g, '').trim();
        return JSON.parse(jsonContent);
      }
      
      // Fallback, wenn kein JSON erkannt wurde
      return { rawOutput: content };
    } catch (error) {
      console.error("Fehler bei der Strategieempfehlung:", error);
      throw new Error(`Gemini Strategieempfehlung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}