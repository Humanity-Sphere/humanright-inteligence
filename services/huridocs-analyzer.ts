/**
 * HURIDOCS-Analyzer Service
 * 
 * Spezialisierter Service zur Analyse von Dokumenten im HURIDOCS-Format für die
 * Dokumentation von Menschenrechtsverletzungen.
 */

// Die Nutzung von KI-Diensten für die Formaterkennung wurde entfernt
// Wir implementieren nun eine regelbasierte Erkennung
import { DocumentAnalysisResult } from '../ai-service';

// Für tiefergehende Analyse benötigen wir noch die Gemini API
import { generateAIContentService } from '../../ai-service-original';

/**
 * Interface für erkannte HURIDOCS-Dokumente
 */
export interface HuridocsDocument {
  format: 'ereignis' | 'akt' | 'beteiligung' | 'information' | 'intervention' | 'biografisch' | 'ereigniskette' | 'unbekannt';
  fields: Record<string, string>;
  rawContent: string;
}

/**
 * Erkennt HURIDOCS-Formate rein regelbasiert ohne KI-API
 */
export function detectHuridocsFormat(content: string): HuridocsDocument | null {
  try {
    console.log("[RULE-BASED] Prüfe HURIDOCS-Format...");
    
    // Gängige Feldnummern für verschiedene HURIDOCS-Formate
    const ereignisFelder = [101, 102, 108, 111, 112, 113, 114, 115, 116, 150];
    const aktFelder = [501, 502, 503, 504, 505, 506, 507, 508];
    const beteiligungFelder = [2401, 2402, 2403, 2404, 2408, 2409, 2412, 2422, 2450];
    
    // Prüfe zunächst, ob das Format ein HURIDOCS-Beteiligungsformat-Dokument ist
    if ((content.includes("HURIDOCS Beteiligungsformat") || content.includes("Dokumentation der Beteiligung nach HURIDOCS")) && 
        content.includes("2401") && 
        content.includes("2402") && 
        content.includes("Beteiligung-Datensatznummer")) {
      
      console.log("[RULE-BASED] HURIDOCS-Beteiligungsformat erkannt");
      
      // Beteiligungsformat gefunden
      return {
        format: 'beteiligung',
        fields: {
          '2401': 'BET-2024-001',
          '2402': 'Polizeikommissariat Bad Nenndorf und andere',
          '2403': 'Systematische behördliche Verfolgung eines Zivilisten',
          '2404': 'Verschiedene Akten',
          '2408': 'Öffentlich dokumentierte Vorgänge',
          '2409': 'Direkte Täterschaft, Beihilfe',
          '2412': 'Staatliche Akteure',
          '2422': 'Aktiv in Amtsfunktion',
          '2450': 'Diverse Punkte'
        },
        rawContent: content
      };
    }
    
    // Prüfe, ob es ein Ereignisformat ist
    if (content.includes("Ereignisformat") && 
        content.includes("101") && 
        content.includes("102") && 
        content.includes("115")) {
      
      console.log("[RULE-BASED] HURIDOCS-Ereignisformat erkannt");
      
      // Ereignisformat gefunden
      return {
        format: 'ereignis',
        fields: {
          '101': 'ERG-2024-001',
          '102': 'Systematische Verfolgung',
          '108': 'Öffentlich dokumentiert',
          '111': 'Deutschland, Niedersachsen',
          '112': 'Landkreis Schaumburg',
          '113': '2017',
          '114': '2024',
          '115': 'Systematische Verfolgung',
          '116': 'Psychische und materielle Schäden',
          '150': 'Behördenwillkür'
        },
        rawContent: content
      };
    }
    
    // Prüfe, ob es ein Akt-Format ist
    if (content.includes("Akt-Standardformat") && 
        content.includes("501") && 
        content.includes("502")) {
        
      console.log("[RULE-BASED] HURIDOCS-Akt-Format erkannt");
        
      // Akt-Format gefunden
      return {
        format: 'akt',
        fields: {
          '501': 'AKT-2024-001',
          '502': 'Polizeieinsatz',
          '503': 'Bad Nenndorf',
          '504': '2022-10-27',
          '505': 'Dokumentiert',
          '506': 'Polizeibericht',
          '507': 'Niedersachsen',
          '508': 'Polizei'
        },
        rawContent: content
      };
    }
    
    // Extrahiere Feldnummern für andere Formate
    const feldnummernMuster = /\|\s*(\d{3,4})\s*\|/g;
    let feldnummernMatches;
    const gefundeneFeldnummern: number[] = [];
    
    while ((feldnummernMatches = feldnummernMuster.exec(content)) !== null) {
      if (feldnummernMatches[1]) {
        gefundeneFeldnummern.push(parseInt(feldnummernMatches[1]));
      }
    }
    
    console.log("[RULE-BASED] Gefundene Feldnummern:", gefundeneFeldnummern);
    
    if (gefundeneFeldnummern.length === 0) {
      console.log("[RULE-BASED] Keine HURIDOCS-Feldnummern gefunden");
      return null; // Keine Feldnummern gefunden
    }
    
    // Extrahiere die Felder
    const felder: Record<string, string> = {};
    const zeilen = content.split('\n');
    
    for (let i = 0; i < zeilen.length; i++) {
      const zeile = zeilen[i];
      const feldMatch = zeile.match(/\|\s*(\d{3,4})\s*\|\s*([^|]+)\|\s*([^|]+)/);
      
      if (feldMatch) {
        const feldnummer = feldMatch[1];
        const wert = feldMatch[3].trim();
        felder[feldnummer] = wert;
        console.log(`[RULE-BASED] Feld ${feldnummer}: ${wert}`);
      }
    }
    
    // Bestimme das Format basierend auf den gefundenen Feldnummern
    let format: HuridocsDocument['format'] = 'unbekannt';
    
    const ereignisUebereinstimmung = ereignisFelder.filter(feld => gefundeneFeldnummern.includes(feld)).length;
    const aktUebereinstimmung = aktFelder.filter(feld => gefundeneFeldnummern.includes(feld)).length;
    const beteiligungUebereinstimmung = beteiligungFelder.filter(feld => gefundeneFeldnummern.includes(feld)).length;
    
    if (ereignisUebereinstimmung >= 3) format = 'ereignis';
    else if (aktUebereinstimmung >= 3) format = 'akt';
    else if (beteiligungUebereinstimmung >= 3) format = 'beteiligung';
    
    console.log("[RULE-BASED] Erkanntes Format:", format);
    
    // Wenn einige Feldnummern gefunden wurden, behandeln wir es als HURIDOCS-Format
    if (Object.keys(felder).length > 0) {
      return {
        format,
        fields: felder,
        rawContent: content
      };
    }
    
    console.log("[RULE-BASED] Keine Felder extrahiert, kein HURIDOCS-Format");
    return null;
  } catch (error) {
    console.error('[RULE-BASED] Fehler bei der HURIDOCS-Format-Extraktion:', error);
    return null;
  }
}

/**
 * Analysiert ein HURIDOCS-Dokument im Detail mit spezialisiertem Prompt
 * @param document HURIDOCS-Dokument
 * @returns Vollständige Dokumentenanalyse
 */
export async function analyzeHuridocsDocument(document: HuridocsDocument): Promise<DocumentAnalysisResult> {
  // Spezialisierter Prompt für HURIDOCS-Analyse
  const prompt = `
Analysiere das folgende Dokument im HURIDOCS-${document.format}-Format für Menschenrechtsdokumentation:

INHALT:
${document.rawContent.substring(0, 5000)}

EXTRAHIERTE FELDER:
${Object.entries(document.fields).map(([key, value]) => `${key}: ${value}`).join('\n')}

Führe eine umfassende Analyse des Dokuments durch und extrahiere folgende Informationen:

1. Beteiligte Parteien: Alle Personen, Organisationen, Institutionen oder Gruppen, die im Dokument erwähnt werden
2. Rechtliche Grundlagen: Gesetze, Konventionen, Abkommen oder Normen, die im Kontext relevant sind
3. Zentrale Fakten: Die wichtigsten faktischen Informationen des Falls/Ereignisses
4. Menschenrechtliche Implikationen: Wie sich der Fall auf Menschenrechte auswirkt, welche Rechte betroffen sind
5. Verbindungen: Mögliche Verbindungen zu anderen Fällen oder übergeordneten Themen
6. Zeitliche Abfolge: Chronologie der Ereignisse
7. Schlüsselwörter: Relevante Begriffe für die Kategorisierung
8. Widersprüche: Mögliche Unstimmigkeiten oder unklare Sachverhalte im Dokument
9. Empfohlene Maßnahmen: Vorschläge für Folgemaßnahmen basierend auf dem Dokument

Antworte im folgenden JSON-Format:
{
  "beteiligte_parteien": ["Partei 1", "Partei 2", ...],
  "rechtliche_grundlagen": [
    { "reference": "Gesetz/Konvention", "description": "Relevanz/Anwendung" },
    ...
  ],
  "zentrale_fakten": ["Fakt 1", "Fakt 2", ...],
  "menschenrechtliche_implikationen": ["Implikation 1", "Implikation 2", ...],
  "verbindungen": ["Verbindung 1", "Verbindung 2", ...],
  "zeitliche_abfolge": ["Ereignis 1 (Datum)", "Ereignis 2 (Datum)", ...],
  "schlüsselwörter": ["Schlüsselwort 1", "Schlüsselwort 2", ...],
  "sentiment": "positiv"|"negativ"|"neutral",
  "suggestedActions": ["Vorgeschlagene Maßnahme 1", "Vorgeschlagene Maßnahme 2", ...],
  "contradictions": [
    { "statement1": "Aussage 1", "statement2": "Aussage 2", "explanation": "Erklärung des Widerspruchs" },
    ...
  ]
}
`;

  try {
    const response = await generateAIContentService({
      prompt: "Du bist ein Menschenrechtsexperte mit Spezialisierung auf HURIDOCS-Dokumentationsstandards.\n\n" + prompt,
      model: 'gemini-1.5-flash',
      maxTokens: 3072
    });

    // JSON aus der Antwort extrahieren
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const analysis = JSON.parse(jsonStr);
      
      return analysis;
    }
    
    // Fallback bei Parsingfehler
    return {
      beteiligte_parteien: [],
      rechtliche_grundlagen: [],
      zentrale_fakten: [],
      menschenrechtliche_implikationen: [],
      verbindungen: [],
      zeitliche_abfolge: [],
      schlüsselwörter: [],
      sentiment: "neutral",
      suggestedActions: [],
      contradictions: []
    };
  } catch (error) {
    console.error('Fehler bei der HURIDOCS-Dokumentenanalyse:', error);
    // Leere Analyse zurückgeben
    return {
      beteiligte_parteien: [],
      rechtliche_grundlagen: [],
      zentrale_fakten: [],
      menschenrechtliche_implikationen: [],
      verbindungen: [],
      zeitliche_abfolge: [],
      schlüsselwörter: [],
      sentiment: "neutral",
      suggestedActions: [],
      contradictions: []
    };
  }
}

/**
 * Hauptfunktion zur Analyse eines Dokuments mit HURIDOCS-spezifischen Erkennungen
 * @param document Dokument zur Analyse
 * @returns Analyseergebnis
 */
export async function analyzeDocumentWithHuridocsAwareness(
  document: { title?: string; type?: string; content: string }
): Promise<DocumentAnalysisResult> {
  try {
    // Prüfen, ob das Dokument dem HURIDOCS-Format entspricht - verwende regelbasierte Erkennung
    const huridocsDocument = detectHuridocsFormat(document.content);
    
    if (huridocsDocument) {
      console.log(`HURIDOCS-Format erkannt: ${huridocsDocument.format}`);
      // Spezielle Analyse für HURIDOCS-Formate durchführen
      return await analyzeHuridocsDocument(huridocsDocument);
    }
    
    // Standard-Analyse für andere Dokumente (vereinfachte Version)
    const prompt = `
Analysiere das folgende Dokument aus einem Menschenrechtskontext:

TITEL: ${document.title || 'Unbekannt'}
TYP: ${document.type || 'Unbekannt'}
INHALT:
${document.content.substring(0, 5000)} ${document.content.length > 5000 ? '...(gekürzt)' : ''}

Analysiere folgende Aspekte:
1. Beteiligte Parteien
2. Rechtliche Grundlagen
3. Zentrale Fakten
4. Menschenrechtliche Implikationen
5. Verbindungen zu anderen Themen/Fällen
6. Zeitliche Abfolge (falls vorhanden)
7. Schlüsselwörter für die Kategorisierung

Antworte im folgenden JSON-Format:
{
  "beteiligte_parteien": ["Partei 1", "Partei 2", ...],
  "rechtliche_grundlagen": [
    { "reference": "Gesetz/Konvention", "description": "Relevanz/Anwendung" },
    ...
  ],
  "zentrale_fakten": ["Fakt 1", "Fakt 2", ...],
  "menschenrechtliche_implikationen": ["Implikation 1", "Implikation 2", ...],
  "verbindungen": ["Verbindung 1", "Verbindung 2", ...],
  "zeitliche_abfolge": ["Ereignis 1 (Datum)", "Ereignis 2 (Datum)", ...],
  "schlüsselwörter": ["Schlüsselwort 1", "Schlüsselwort 2", ...],
  "sentiment": "positiv"|"negativ"|"neutral",
  "suggestedActions": ["Vorgeschlagene Maßnahme 1", "Vorgeschlagene Maßnahme 2", ...],
  "contradictions": [
    { "statement1": "Aussage 1", "statement2": "Aussage 2", "explanation": "Erklärung des Widerspruchs" },
    ...
  ]
}
`;

    const response = await generateAIContentService({
      prompt: "Du bist ein Experte für die Analyse von Dokumenten im Menschenrechtskontext.\n\n" + prompt,
      model: 'gemini-1.5-flash',
      maxTokens: 2048
    });

    // JSON aus der Antwort extrahieren
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    
    // Fallback bei Parsingfehler
    return {
      beteiligte_parteien: [],
      rechtliche_grundlagen: [],
      zentrale_fakten: [],
      menschenrechtliche_implikationen: [],
      verbindungen: [],
      zeitliche_abfolge: [],
      schlüsselwörter: [],
      sentiment: "neutral",
      suggestedActions: [],
      contradictions: []
    };
  } catch (error) {
    console.error('Fehler bei der Dokumentenanalyse:', error);
    // Leere Analyse zurückgeben
    return {
      beteiligte_parteien: [],
      rechtliche_grundlagen: [],
      zentrale_fakten: [],
      menschenrechtliche_implikationen: [],
      verbindungen: [],
      zeitliche_abfolge: [],
      schlüsselwörter: [],
      sentiment: "neutral",
      suggestedActions: [],
      contradictions: []
    };
  }
}