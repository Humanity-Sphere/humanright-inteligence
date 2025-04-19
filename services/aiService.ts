import { GoogleGenerativeAI } from "@google/generative-ai";

// Prüfe, ob API-Key vorhanden ist
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNUNG: GEMINI_API_KEY nicht gefunden. KI-Funktionen werden nicht verfügbar sein.");
}

// Google Generative AI initialisieren
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Dokumententypen, die für die Analyse unterstützt werden
 */
export type DocumentType = 'text' | 'image' | 'pdf';

/**
 * Struktur der extrahierten Fakten aus einem Dokument
 */
export interface ExtractedFacts {
  events: Array<{
    description: string;
    date?: string;
    location?: string;
    actors?: string[];
  }>;
  people: string[];
  organizations: string[];
  locations: string[];
  dates: string[];
  keyClaims: string[];
  relevantLaws: Array<{
    name: string;
    articles: string[];
    relevance: string;
  }>;
}

/**
 * Struktur für das Ergebnis einer Dokumentenanalyse
 */
export interface DocumentAnalysisResult {
  extractedFacts: ExtractedFacts;
  possibleContradictions?: string[];
  recommendedActions?: string[];
  relatedCases?: string[];
  summary: string;
  sentimentAnalysis?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidenceScore: number;
  };
  riskAnalysis?: {
    securityRisks: string[];
    dataPrivacyRisks: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
}

/**
 * Struktur für das Ergebnis einer Mustererkennungsanalyse
 */
export interface PatternAnalysisResult {
  patternName: string;
  patternDescription: string;
  geographicScope?: string;
  temporalTrends?: string;
  relatedLaws?: string;
  recommendedActions?: string;
  confidence: number;
  involvedActors?: string[];
  similarCases?: string[];
}

/**
 * Strukturierter Prompt für Dokumentenanalyse
 */
function createDocumentAnalysisPrompt(documentContent: string, documentType: string, documentTitle?: string) {
  return `
@Claude-3.7-Sonnet Du bist ein Experte für Dokumentenanalyse im Bereich Menschenrechtsarbeit.

AUFGABE:
Analysiere folgendes Dokument aus einer Menschenrechtsperspektive.

DOKUMENTTYP: ${documentType}
DOKUMENTTITEL: ${documentTitle || 'Unbekannt'}

DOKUMENTINHALT:
\`\`\`
${documentContent}
\`\`\`

ANFORDERUNGEN:
1. Erstelle eine strukturierte Analyse des Dokuments
2. Extrahiere relevante Fakten, Ereignisse, Personen, Organisationen und Orte
3. Identifiziere relevante Menschenrechtsgesetze und -bestimmungen
4. Hebe mögliche Widersprüche oder Unstimmigkeiten hervor
5. Fasse die Hauptpunkte zusammen

ANTWORTFORMAT:
Gib deine Antwort als gut formatiertes JSON zurück, das folgende Struktur hat:
{
  "extractedFacts": {
    "events": [
      {
        "description": "Beschreibung des Ereignisses",
        "date": "Datum (wenn bekannt)",
        "location": "Ort (wenn bekannt)",
        "actors": ["Beteiligte Personen/Organisationen"]
      }
    ],
    "people": ["Liste identifizierter Personen"],
    "organizations": ["Liste identifizierter Organisationen"],
    "locations": ["Liste identifizierter Orte"],
    "dates": ["Liste identifizierter Daten"],
    "keyClaims": ["Liste wichtiger Behauptungen"],
    "relevantLaws": [
      {
        "name": "Name des Gesetzes",
        "articles": ["Relevante Artikel"],
        "relevance": "Erklärung der Relevanz"
      }
    ]
  },
  "possibleContradictions": ["Liste potentieller Widersprüche"],
  "recommendedActions": ["Empfohlene Maßnahmen"],
  "summary": "Zusammenfassung des Dokuments",
  "sentimentAnalysis": {
    "sentiment": "positive/negative/neutral",
    "confidenceScore": 0.0-1.0
  }
}
`;
}

/**
 * Strukturierter Prompt für die Mustererkennung über mehrere Dokumente hinweg
 */
function createPatternDetectionPrompt(documentsContent: { id: number; title?: string; content: string }[]) {
  return `
@Claude-3.7-Sonnet Du bist ein Experte für Mustererkennung in Menschenrechtsdokumenten.

AUFGABE:
Analysiere die folgenden Dokumente und identifiziere Muster oder systematische Probleme im Bereich der Menschenrechte.

DOKUMENTE:
${documentsContent.map((doc, index) => `
DOKUMENT ${index + 1}${doc.title ? ` - ${doc.title}` : ''}:
\`\`\`
${doc.content}
\`\`\``).join('\n')}

ANFORDERUNGEN:
1. Identifiziere gemeinsame Muster oder systematische Probleme in den Dokumenten
2. Bestimme die geografische Verteilung, falls erkennbar
3. Analysiere zeitliche Trends, falls erkennbar
4. Identifiziere beteiligte Akteure (Einzelpersonen, Organisationen, Staaten)
5. Verknüpfe das Muster mit relevanten Menschenrechtsgesetzen
6. Schlage angemessene Maßnahmen vor

ANTWORTFORMAT:
Gib deine Antwort als gut formatiertes JSON zurück, das folgende Struktur hat:
{
  "patternName": "Name des erkannten Musters",
  "patternDescription": "Detaillierte Beschreibung des Musters",
  "geographicScope": "Geografischer Bereich des Musters",
  "temporalTrends": "Zeitliche Entwicklung des Musters",
  "relatedLaws": "Relevante Gesetze und Bestimmungen",
  "recommendedActions": "Empfohlene Maßnahmen",
  "confidence": 0.0-1.0,
  "involvedActors": ["Liste beteiligter Akteure"],
  "similarCases": ["Ähnliche bekannte Fälle"]
}
`;
}

// STORM Framework TaskType für verschiedene Arten von Inhaltstypen
export enum TaskType {
  CREATIVE_WRITING = "CREATIVE_WRITING",
  DOCUMENT_ANALYSIS = "DOCUMENT_ANALYSIS",
  CODE_GENERATION = "CODE_GENERATION",
  TRANSLATION = "TRANSLATION",
  SUMMARIZATION = "SUMMARIZATION",
  QUESTION_ANSWERING = "QUESTION_ANSWERING"
}

// Storm Framework DocumentAnalysisResult für die synthetischen Konversationen
export interface StormDocumentAnalysisResult {
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

/**
 * Hauptservice für die KI-gestützte Dokumentenanalyse
 */
export class AIService {
  /**
   * Analysiert ein einzelnes Dokument und extrahiert relevante Informationen
   */
  async analyzeDocument(
    documentContent: string, 
    documentType: DocumentType = 'text',
    documentTitle?: string
  ): Promise<DocumentAnalysisResult> {
    try {
      // Gemini-Modell initialisieren
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Prompt erstellen
      const prompt = createDocumentAnalysisPrompt(documentContent, documentType, documentTitle);
      
      // Anfrage an die KI senden
      console.log("Sending request to Gemini API for document analysis...");
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Versuche, die JSON-Antwort zu parsen
      try {
        // Extrahiere nur den JSON-Teil aus der Antwort (falls die KI mehr zurückgibt)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Keine gültige JSON-Antwort von der KI erhalten");
        }
        
        const analysisResult = JSON.parse(jsonMatch[0]) as DocumentAnalysisResult;
        return analysisResult;
      } catch (parseError) {
        console.error("Fehler beim Parsen der KI-Antwort:", parseError);
        console.log("Raw Response:", responseText);
        
        // Fallback-Ergebnis mit Fehlermeldung
        return {
          extractedFacts: {
            events: [],
            people: [],
            organizations: [],
            locations: [],
            dates: [],
            keyClaims: [],
            relevantLaws: []
          },
          summary: "Fehler bei der Analyse: " + (parseError instanceof Error ? parseError.message : String(parseError)),
        };
      }
    } catch (error) {
      console.error("Fehler bei der Dokumentenanalyse:", error);
      throw new Error(`Dokumentenanalyse fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
    }
  }

  /**
   * STORM Framework-kompatible Dokumentenanalyse-Methode
   * Für die Integration mit dem synthetischen Konversationsframework
   */
  async analyzeDocumentForStorm(document: { title?: string; type?: string; content: string }): Promise<StormDocumentAnalysisResult> {
    try {
      // Gemini-Modell initialisieren
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Prompt erstellen
      const prompt = `
Du bist ein Experte für Menschenrechtsanalyse. Analysiere den folgenden Text:

"${document.title || "Unbekanntes Dokument"}"

Text: """
${document.content}
"""

Extrahiere folgende Informationen in einem strukturierten Format:
1. Beteiligte Parteien
2. Relevante rechtliche Grundlagen (mit Referenz und Beschreibung)
3. Zentrale Fakten
4. Menschenrechtliche Implikationen
5. Verbindungen zwischen Fakten und Parteien
6. Zeitliche Abfolge der Ereignisse
7. Schlüsselwörter

Gib deine Antwort in folgendem JSON-Format zurück:
{
  "beteiligte_parteien": ["Partei 1", "Partei 2"],
  "rechtliche_grundlagen": [
    {"reference": "Art. 1 EMRK", "description": "Recht auf Leben"}
  ],
  "zentrale_fakten": ["Fakt 1", "Fakt 2"],
  "menschenrechtliche_implikationen": ["Implikation 1", "Implikation 2"],
  "verbindungen": ["Verbindung 1", "Verbindung 2"],
  "zeitliche_abfolge": ["Ereignis 1", "Ereignis 2"],
  "schlüsselwörter": ["Schlüsselwort 1", "Schlüsselwort 2"],
  "sentiment": "positiv/negativ/neutral",
  "suggestedActions": ["Aktion 1", "Aktion 2"],
  "contradictions": [
    {"statement1": "Aussage 1", "statement2": "Aussage 2", "explanation": "Erklärung"}
  ]
}
`;
      
      // Anfrage an die KI senden
      console.log("Sending request to Gemini API for STORM document analysis...");
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Versuche, die JSON-Antwort zu parsen
      try {
        // Extrahiere nur den JSON-Teil aus der Antwort (falls die KI mehr zurückgibt)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Keine gültige JSON-Antwort von der KI erhalten");
        }
        
        const analysisResult = JSON.parse(jsonMatch[0]) as StormDocumentAnalysisResult;
        return analysisResult;
      } catch (parseError) {
        console.error("Fehler beim Parsen der KI-Antwort:", parseError);
        console.log("Raw Response:", responseText);
        
        // Fallback-Ergebnis mit Fehlermeldung
        return {
          beteiligte_parteien: [],
          rechtliche_grundlagen: [],
          zentrale_fakten: [],
          menschenrechtliche_implikationen: [],
          verbindungen: [],
          zeitliche_abfolge: [],
          schlüsselwörter: [],
          sentiment: "neutral",
          suggestedActions: [`Fehler bei der Analyse: ${parseError instanceof Error ? parseError.message : String(parseError)}`],
          contradictions: []
        };
      }
    } catch (error) {
      console.error("Fehler bei der STORM-Dokumentenanalyse:", error);
      return {
        beteiligte_parteien: [],
        rechtliche_grundlagen: [],
        zentrale_fakten: [],
        menschenrechtliche_implikationen: [],
        verbindungen: [],
        zeitliche_abfolge: [],
        schlüsselwörter: [],
        sentiment: "neutral",
        suggestedActions: [`Fehler bei der Analyse: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`],
        contradictions: []
      };
    }
  }

  /**
   * STORM Framework-kompatible Content-Generierung-Methode
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
      // Gemini-Modell initialisieren
      const modelName = params.preferLowCost ? "gemini-1.5-flash" : "gemini-1.5-pro";
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Generierungsparameter definieren
      const generationConfig = {
        temperature: params.temperature || 0.7,
        maxOutputTokens: params.max_tokens || 2048,
      };
      
      // Anweisungen basierend auf dem Aufgabentyp ergänzen
      let enhancedPrompt = params.prompt;
      
      if (params.taskType) {
        const taskInstructions = {
          [TaskType.CREATIVE_WRITING]: "Sei kreativ und originell in deiner Antwort. Erzeuge einzigartige Inhalte.",
          [TaskType.DOCUMENT_ANALYSIS]: "Analysiere das Dokument strukturiert und detailliert. Identifiziere Hauptpunkte, Akteure und Implikationen.",
          [TaskType.CODE_GENERATION]: "Erzeuge gut dokumentierten, lesbaren Code mit präzisen Kommentaren. Stellen Sie die Funktionalität in den Mittelpunkt.",
          [TaskType.TRANSLATION]: "Übersetze präzise und erhalte dabei den Sinn und Kontext des Originaltexts.",
          [TaskType.SUMMARIZATION]: "Fasse die Hauptpunkte zusammen, ohne wichtige Informationen auszulassen. Sei prägnant.",
          [TaskType.QUESTION_ANSWERING]: "Beantworte die Frage direkt und präzise. Stelle relevante Kontextinformationen bereit."
        };
        
        enhancedPrompt = `${taskInstructions[params.taskType]}\n\n${enhancedPrompt}`;
      }
      
      // Format-Anweisungen hinzufügen
      if (params.outputFormat) {
        const formatInstructions = {
          'json': "Gib deine Antwort als gültiges JSON zurück.",
          'markdown': "Gib deine Antwort in Markdown-Formatierung zurück.",
          'html': "Gib deine Antwort als HTML zurück.",
          'text': "Gib deine Antwort als Klartext zurück."
        };
        
        enhancedPrompt = `${enhancedPrompt}\n\n${formatInstructions[params.outputFormat]}`;
      }
      
      // Anfrage an die KI senden
      console.log(`Sending request to Gemini API for content generation (${params.taskType || 'general'})...`);
      const result = await model.generateContent(enhancedPrompt, { generationConfig });
      const responseText = result.response.text();
      
      return responseText;
    } catch (error) {
      console.error("Fehler bei der Inhaltsgeneration:", error);
      return `Fehler bei der Inhaltsgeneration: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`;
    }
  }

  /**
   * Erkennt Muster über mehrere Dokumente hinweg
   */
  async detectPatterns(
    documents: Array<{ id: number; title?: string; content: string }>
  ): Promise<PatternAnalysisResult> {
    try {
      // Gemini-Modell initialisieren
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Prompt erstellen
      const prompt = createPatternDetectionPrompt(documents);
      
      // Anfrage an die KI senden
      console.log("Sending request to Gemini API for pattern detection...");
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Versuche, die JSON-Antwort zu parsen
      try {
        // Extrahiere nur den JSON-Teil aus der Antwort (falls die KI mehr zurückgibt)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Keine gültige JSON-Antwort von der KI erhalten");
        }
        
        const patternResult = JSON.parse(jsonMatch[0]) as PatternAnalysisResult;
        return patternResult;
      } catch (parseError) {
        console.error("Fehler beim Parsen der KI-Antwort:", parseError);
        console.log("Raw Response:", responseText);
        
        // Fallback-Ergebnis mit Fehlermeldung
        return {
          patternName: "Analyse fehlgeschlagen",
          patternDescription: "Es ist ein Fehler bei der Analyse aufgetreten: " + 
            (parseError instanceof Error ? parseError.message : String(parseError)),
          confidence: 0
        };
      }
    } catch (error) {
      console.error("Fehler bei der Mustererkennung:", error);
      throw new Error(`Mustererkennung fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
    }
  }
  
  /**
   * STORM Framework-kompatible Methode zur Erstellung von Rechtsstrategien
   */
  async suggestLegalStrategy(caseData: any): Promise<any> {
    try {
      // Gemini-Modell initialisieren
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Fallbeschreibung für den Prompt extrahieren
      const caseDescription = typeof caseData === 'string' 
        ? caseData 
        : JSON.stringify(caseData, null, 2);
      
      // Prompt erstellen
      const prompt = `
Du bist ein Experte für Menschenrechtsrecht und juristische Strategien. 
Erstelle eine Rechtsstrategie basierend auf folgenden Falldaten:

"""
${caseDescription}
"""

Berücksichtige dabei:
1. Relevante Menschenrechtsgesetze und -konventionen
2. Mögliche rechtliche Schritte
3. Beweisanforderungen
4. Erfolgsaussichten
5. Zeitlicher Rahmen
6. Ressourcenbedarf

Gib deine Antwort in folgendem JSON-Format zurück:
{
  "strategyName": "Name der Strategie",
  "description": "Kurze Beschreibung der Strategie",
  "recommendedSteps": [
    "Schritt 1", 
    "Schritt 2"
  ],
  "legalFramework": [
    {
      "name": "Name des Gesetzes",
      "articles": ["Art. 1", "Art. 2"]
    }
  ],
  "successRate": "Niedrig/Mittel/Hoch",
  "timeEstimate": "Geschätzte Dauer",
  "resourceRequirements": "Niedrig/Mittel/Hoch"
}
`;
      
      // Anfrage an die KI senden
      console.log("Sending request to Gemini API for legal strategy suggestion...");
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Versuche, die JSON-Antwort zu parsen
      try {
        // Extrahiere nur den JSON-Teil aus der Antwort (falls die KI mehr zurückgibt)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Keine gültige JSON-Antwort von der KI erhalten");
        }
        
        const strategyResult = JSON.parse(jsonMatch[0]);
        return strategyResult;
      } catch (parseError) {
        console.error("Fehler beim Parsen der KI-Antwort:", parseError);
        console.log("Raw Response:", responseText);
        
        // Fallback-Ergebnis mit Fehlermeldung
        return {
          strategyName: "Strategie-Erstellung fehlgeschlagen",
          description: "Es ist ein Fehler bei der Analyse aufgetreten: " + 
            (parseError instanceof Error ? parseError.message : String(parseError)),
          recommendedSteps: ["Konsultieren Sie einen Rechtsexperten für eine detaillierte Analyse"],
          legalFramework: [],
          successRate: "Unbekannt",
          timeEstimate: "Unbekannt",
          resourceRequirements: "Unbekannt"
        };
      }
    } catch (error) {
      console.error("Fehler bei der Strategieerstellung:", error);
      return {
        strategyName: "Strategie-Erstellung fehlgeschlagen",
        description: `Fehler: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        recommendedSteps: ["Konsultieren Sie einen Rechtsexperten für eine detaillierte Analyse"],
        legalFramework: [],
        successRate: "Unbekannt",
        timeEstimate: "Unbekannt",
        resourceRequirements: "Unbekannt"
      };
    }
  }
}

// Singleton-Instanz exportieren
export const aiService = new AIService();