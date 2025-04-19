
import { Document } from '@shared/schema';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { analyzeWithGemini } from './gemini';

// Promisified Funktion zum Lesen von Dateien
const readFile = promisify(fs.readFile);

// Verschiedene Analysetypen
export enum AnalysisType {
  BASIC = 'basic',
  DETAILED = 'detailed',
  LEGAL = 'legal',
  HUMAN_RIGHTS = 'human_rights',
  PATTERN_DETECTION = 'pattern_detection'
}

// Interface für Analyseoptionen
export interface AnalysisOptions {
  type: AnalysisType;
  includeEntities?: boolean;
  detectPatterns?: boolean;
  extractTimeline?: boolean;
  identifyRisks?: boolean;
  suggestActions?: boolean;
}

/**
 * Analysiert ein Dokument mit KI und speichert die Ergebnisse
 */
export async function analyzeDocument(
  documentId: number, 
  options: AnalysisOptions = { type: AnalysisType.BASIC }
): Promise<void> {
  try {
    // Dokument aus dem Speicher abrufen
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error(`Dokument mit ID ${documentId} nicht gefunden`);
    }
    
    console.log(`Analysiere Dokument: ${document.title} (ID: ${documentId})`);
    
    // Dokument-Inhalt extrahieren
    const content = await extractDocumentContent(document);
    if (!content) {
      throw new Error(`Konnte Inhalt des Dokuments ${documentId} nicht extrahieren`);
    }
    
    // Analyseprompt basierend auf dem Dokumenttyp und den Optionen erstellen
    const prompt = createAnalysisPrompt(document, content, options);
    
    // KI-Analyse mit Gemini durchführen
    const analysisResult = await analyzeWithGemini(prompt);
    
    // Analyseergebnis parsen und strukturieren
    const structuredAnalysis = parseAnalysisResult(analysisResult, options);
    
    // Analyseergebnis in der Datenbank speichern
    await saveAnalysisResult(document, structuredAnalysis, options);
    
    console.log(`Analyse für Dokument ${documentId} abgeschlossen`);
  } catch (error) {
    console.error(`Fehler bei der Dokumentanalyse für ID ${documentId}:`, error);
    throw error;
  }
}

/**
 * Extrahiert den Inhalt eines Dokuments
 */
async function extractDocumentContent(document: Document): Promise<string | null> {
  // Wenn das Dokument bereits Inhalt hat, diesen zurückgeben
  if (document.content) {
    return document.content;
  }
  
  // Sonst versuchen, die Datei zu lesen
  try {
    const filePath = path.join(__dirname, '..', '..', document.filePath);
    if (!fs.existsSync(filePath)) {
      console.error(`Datei nicht gefunden: ${filePath}`);
      return null;
    }
    
    // Einfache Textextraktion für Textdateien
    if (['txt', 'csv', 'md'].includes(document.fileType)) {
      const content = await readFile(filePath, 'utf-8');
      return content;
    }
    
    // Für andere Dateitypen müssten hier entsprechende Parser eingebunden werden
    // TODO: Extraktion für PDF, DOCX, etc. implementieren
    
    return `[Inhalt der Datei ${document.title} konnte nicht extrahiert werden]`;
  } catch (error) {
    console.error(`Fehler beim Extrahieren des Dokumentinhalts:`, error);
    return null;
  }
}

/**
 * Erstellt einen Analyseprompt basierend auf Dokumenttyp und Optionen
 */
function createAnalysisPrompt(document: Document, content: string, options: AnalysisOptions): string {
  let prompt = '';
  
  // Basisprompt
  prompt += `Analysiere folgendes Dokument im Kontext der Menschenrechte:\n\n`;
  prompt += `Titel: ${document.title}\n`;
  prompt += `Typ: ${document.fileType}\n`;
  if (document.description) {
    prompt += `Beschreibung: ${document.description}\n`;
  }
  prompt += `Inhalt:\n${content}\n\n`;
  
  // Je nach Analysetyp spezifische Anweisungen hinzufügen
  switch (options.type) {
    case AnalysisType.DETAILED:
      prompt += `Führe eine detaillierte Analyse durch und identifiziere:\n`;
      prompt += `- Hauptthemen und Schlüsselbegriffe\n`;
      prompt += `- Beteiligte Personen und Organisationen\n`;
      prompt += `- Wichtige Fakten und Behauptungen\n`;
      prompt += `- Emotionale Tonalität des Textes\n`;
      prompt += `- Mögliche Widersprüche oder Unstimmigkeiten\n`;
      break;
      
    case AnalysisType.LEGAL:
      prompt += `Führe eine rechtliche Analyse durch und identifiziere:\n`;
      prompt += `- Relevante Rechtsnormen und -grundlagen\n`;
      prompt += `- Rechtliche Argumentationslinien\n`;
      prompt += `- Präzedenzfälle oder Referenzen\n`;
      prompt += `- Rechtliche Stärken und Schwächen\n`;
      prompt += `- Empfehlungen für weitere rechtliche Schritte\n`;
      break;
      
    case AnalysisType.HUMAN_RIGHTS:
      prompt += `Analysiere den Text im Hinblick auf Menschenrechtsaspekte:\n`;
      prompt += `- Betroffene Menschenrechte und Grundfreiheiten\n`;
      prompt += `- Art und Schwere möglicher Verletzungen\n`;
      prompt += `- Relevante internationale Menschenrechtsstandards\n`;
      prompt += `- Verantwortliche Akteure und ihre Pflichten\n`;
      prompt += `- Empfehlungen für Menschenrechtsverteidiger\n`;
      break;
      
    case AnalysisType.PATTERN_DETECTION:
      prompt += `Analysiere dieses Dokument im Zusammenhang mit bekannten Mustern:\n`;
      prompt += `- Ähnlichkeiten zu bekannten Menschenrechtsverletzungsfällen\n`;
      prompt += `- Systematische oder strukturelle Aspekte\n`;
      prompt += `- Geografische oder zeitliche Muster\n`;
      prompt += `- Verbindungen zu anderen bekannten Fällen\n`;
      break;
      
    default: // BASIC
      prompt += `Führe eine grundlegende Analyse durch und identifiziere:\n`;
      prompt += `- Hauptthema und Schlüsselpunkte\n`;
      prompt += `- Beteiligte Akteure\n`;
      prompt += `- Relevanz für Menschenrechte\n`;
      prompt += `- Empfohlene nächste Schritte\n`;
  }
  
  // Zusätzliche Optionen
  if (options.includeEntities) {
    prompt += `\nIdentifiziere alle relevanten Entitäten (Personen, Organisationen, Orte, Daten) im Text.\n`;
  }
  
  if (options.extractTimeline) {
    prompt += `\nErstelle eine chronologische Zeitleiste der Ereignisse aus dem Dokument.\n`;
  }
  
  if (options.identifyRisks) {
    prompt += `\nBewerte potenzielle Risiken für betroffene Personen und Menschenrechtsverteidiger.\n`;
  }
  
  if (options.suggestActions) {
    prompt += `\nSchlage konkrete Maßnahmen vor, die Menschenrechtsverteidiger ergreifen könnten.\n`;
  }
  
  prompt += `\nStrukturiere deine Analyse in einem klar gegliederten JSON-Format ohne Einleitung oder Erklärung.`;
  
  return prompt;
}

/**
 * Parst das Analyseergebnis in eine strukturierte Form
 */
function parseAnalysisResult(analysisResult: string, options: AnalysisOptions): any {
  try {
    // Versuchen, das Ergebnis als JSON zu parsen
    return JSON.parse(analysisResult);
  } catch (error) {
    console.warn('Konnte Analyseergebnis nicht als JSON parsen, verwende Rohtext');
    
    // Fallback: Einfache Textanalyse
    return {
      rawText: analysisResult,
      type: options.type,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Speichert das Analyseergebnis in der Datenbank
 */
async function saveAnalysisResult(document: Document, structuredAnalysis: any, options: AnalysisOptions): Promise<void> {
  try {
    // Prüfen, ob bereits eine Analyse existiert
    const existingAnalysis = await storage.getDocumentAnalysisByDocumentId(document.id);
    
    // Analyse-Daten vorbereiten
    const analysisData = {
      userId: document.userId,
      documentId: document.id,
      status: 'completed',
      analysisType: options.type,
      topics: structuredAnalysis.topics || [],
      entities: structuredAnalysis.entities || [],
      sentiment: structuredAnalysis.sentiment || null,
      keyFindings: structuredAnalysis.keyFindings || [],
      legalReferences: structuredAnalysis.legalReferences || [],
      suggestedActions: structuredAnalysis.suggestedActions || [],
      contradictions: structuredAnalysis.contradictions || [],
      confidence: structuredAnalysis.confidence || 0.8,
      extractedPeople: structuredAnalysis.extractedPeople || [],
      extractedOrganizations: structuredAnalysis.extractedOrganizations || [],
      extractedLocations: structuredAnalysis.extractedLocations || [],
      extractedEvents: structuredAnalysis.extractedEvents || [],
      riskLevel: structuredAnalysis.riskLevel || null,
      securityRisks: structuredAnalysis.securityRisks || null,
      humanRightsImplications: structuredAnalysis.humanRightsImplications || null,
      timeline: structuredAnalysis.timeline || null,
      metadata: {
        analyzerVersion: '1.0',
        analysisOptions: options,
        rawResult: structuredAnalysis.rawText || null
      }
    };
    
    // Analyse in der Datenbank speichern oder aktualisieren
    if (existingAnalysis) {
      await storage.updateDocumentAnalysis(existingAnalysis.id, analysisData);
    } else {
      await storage.createDocumentAnalysis(analysisData);
    }
    
    // Aktivität zur Analyse protokollieren
    await storage.createActivity({
      userId: document.userId,
      type: 'analysis',
      description: `Dokumentenanalyse für "${document.title}" abgeschlossen`,
      metadata: {
        documentId: document.id,
        analysisType: options.type,
        timestamp: new Date()
      }
    });
    
    // Muster erkennen (falls konfiguriert)
    if (options.detectPatterns) {
      detectPatterns(document, structuredAnalysis);
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Analyseergebnisse:', error);
    throw error;
  }
}

/**
 * Erkennt Muster basierend auf der Dokumentenanalyse
 */
async function detectPatterns(document: Document, analysisResult: any): Promise<void> {
  try {
    // Implementierung für Mustererkennung
    console.log(`Muster-Erkennung für Dokument ${document.id} gestartet`);
    
    // TODO: Implementieren Sie hier die Mustererkennung
  } catch (error) {
    console.error('Fehler bei der Mustererkennung:', error);
  }
}

// Exportiert die Hauptfunktion
export default {
  analyzeDocument,
  AnalysisType
};
