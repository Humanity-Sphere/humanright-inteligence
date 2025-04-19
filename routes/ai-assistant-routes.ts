import { Router, Request, Response } from 'express';
import { RequestOptions, DocumentAnalysisResult, GeminiAIService } from '../services/ai-service';

// Initialisiere den AI Service
const aiService = new GeminiAIService();

const router = Router();

/**
 * AI-Assistent Routen für den Live-Modus, interaktives Brainstorming, Dokumentenverbesserung und Chat-Funktionen
 */

/**
 * POST /ai-assistant/chat
 * Standard-Chatendpunkt für den AI-Assistenten
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { query, context, userId, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Keine Anfrage übermittelt'
      });
    }
    
    // Generiere eine Antwort vom AI-Assistenten
    const response = await aiService.generateContent({
      prompt: query,
      enrichWithResources: true,
      outputFormat: 'markdown'
    });
    
    return res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der AI-Assistent Chat-Anfrage:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten'
    });
  }
});

/**
 * POST /ai-assistant/live-mode
 * Live-Modus Endpunkt mit Echtzeit-Interaktion, Web-Suche und Kontext-Anreicherung
 */
router.post('/live-mode', async (req: Request, res: Response) => {
  try {
    const { query, context, keywords, userId, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Keine Anfrage übermittelt'
      });
    }
    
    // Log für Debugging
    console.log(`Live-Modus Anfrage von ${userId || 'anonymem Benutzer'}: ${query}`);
    
    // Prüfen, ob eine Web-Recherche angefordert wurde
    const shouldPerformWebSearch = 
      query.toLowerCase().includes('suche') || 
      query.toLowerCase().includes('finde') || 
      keywords?.some((k: string) => ['information', 'recherche', 'aktuell', 'news'].includes(k));
    
    let webResults: Array<{
      title: string;
      url: string;
      snippet: string;
      source: string;
      date: string;
    }> = [];
    let hasResearch = false;
    
    // Führe eine Web-Recherche durch, falls angefordert
    if (shouldPerformWebSearch) {
      console.log('Web-Recherche wird durchgeführt...');
      // In einer echten Implementierung würde hier ein API-Aufruf an einen Suchdienst erfolgen
      webResults = [
        {
          title: 'UN-Bericht zur Menschenrechtslage 2024',
          url: 'https://www.un.org/humanrights/report2024',
          snippet: 'Der aktuelle UN-Bericht zeigt Fortschritte und anhaltende Herausforderungen im Bereich der Menschenrechte weltweit...',
          source: 'un.org',
          date: '2024-03-15'
        }
      ];
      hasResearch = true;
    }
    
    // Erstelle einen umfangreicheren Prompt für den Live-Modus
    let enhancedPrompt = query;
    
    if (context) {
      enhancedPrompt = `Kontext der bisherigen Konversation: ${context}\n\nAktuelle Anfrage: ${query}`;
    }
    
    if (keywords && keywords.length > 0) {
      enhancedPrompt += `\n\nRelevante Schlüsselwörter: ${keywords.join(', ')}`;
    }
    
    if (webResults.length > 0) {
      enhancedPrompt += `\n\nErgebnisse der Web-Recherche:\n`;
      webResults.forEach((result, index: number) => {
        enhancedPrompt += `${index + 1}. ${result.title} (${result.source}) - ${result.snippet}\n`;
      });
    }
    
    // Konfiguriere Optionen für die KI-Anfrage
    const options: RequestOptions = {
      prompt: enhancedPrompt,
      systemPrompt: `Du bist ein Assistent für Menschenrechtsverteidiger. Du hilfst bei der Dokumentation, Analyse und Aufbereitung von Informationen zu Menschenrechtsfragen.
Aktuelle Anfrage: ${query}
Aktuelles Datum: ${new Date().toISOString().split('T')[0]}
Antworte in einem hilfreichen, respektvollen und informativen Ton.
Wenn du aktuelle Informationen aus der Web-Recherche hast, beziehe dich darauf und zitiere die Quellen.`,
      temperature: 0.7,
      maxTokens: 1000,
      role: 'hr-defender-coach',
      model: 'gemini-1.5-flash' // Verwende Gemini für schnelle Antworten im Live-Modus
    };
    
    // Generiere eine Antwort vom AI-Assistenten
    const response = await aiService.generateContent({
      prompt: enhancedPrompt,
      enrichWithResources: true,
      outputFormat: 'markdown'
    });
    
    // Aktualisiere den Kontext für die nächste Anfrage
    const updatedContext = context 
      ? `${context}\nBenutzer: ${query}\nAssistent: ${response.slice(0, 200)}...` 
      : `Benutzer: ${query}\nAssistent: ${response.slice(0, 200)}...`;
    
    // Finde relevante Dokumente
    // In einer echten Implementierung würden hier Dokumente aus einer Datenbank abgerufen
    const sourceDocuments = [
      {
        id: 'doc-1',
        title: 'Handbuch zur Dokumentation von Menschenrechtsverletzungen',
        source: 'Interne Wissensdatenbank',
        snippet: 'Dieses Handbuch bietet standardisierte Methoden zur Dokumentation von Menschenrechtsverletzungen...',
        relevanceScore: 0.85
      }
    ];
    
    return res.json({
      success: true,
      response,
      context: updatedContext,
      hasResearch,
      webResults,
      sourceDocuments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Live-Modus Anfrage:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten'
    });
  }
});

/**
 * POST /ai-assistant/improve
 * Endpunkt für Verbesserungsvorschläge bei Dokumenten und Texten
 */
router.post('/improve', async (req: Request, res: Response) => {
  try {
    const { content, type, goal, focusAreas } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Kein Inhalt übermittelt'
      });
    }
    
    // Erstelle einen Prompt für Verbesserungsvorschläge
    let improvePrompt = `Analysiere und verbessere den folgenden ${type || 'Text'}:\n\n${content}\n\n`;
    
    if (goal) {
      improvePrompt += `Ziel der Verbesserung: ${goal}\n`;
    }
    
    if (focusAreas && focusAreas.length > 0) {
      improvePrompt += `Fokussiere besonders auf folgende Bereiche: ${focusAreas.join(', ')}\n`;
    }
    
    // Generiere Verbesserungsvorschläge
    const response = await aiService.generateContent({
      prompt: improvePrompt,
      outputFormat: 'markdown'
    });
    
    return res.json({
      success: true,
      improvements: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Verbesserungsanfrage:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten'
    });
  }
});

/**
 * POST /ai-assistant/brainstorm
 * Endpunkt für interaktives Brainstorming und kreative Ideenfindung
 */
router.post('/brainstorm', async (req: Request, res: Response) => {
  try {
    const { topic, context, constraints, goals, previousIdeas } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Kein Thema übermittelt'
      });
    }
    
    // Erstelle einen Prompt für das Brainstorming
    let brainstormPrompt = `Führe ein Brainstorming zum Thema "${topic}" durch.\n\n`;
    
    if (context) {
      brainstormPrompt += `Kontext: ${context}\n\n`;
    }
    
    if (constraints && constraints.length > 0) {
      brainstormPrompt += `Berücksichtige folgende Einschränkungen: ${constraints.join(', ')}\n\n`;
    }
    
    if (goals && goals.length > 0) {
      brainstormPrompt += `Ziele: ${goals.join(', ')}\n\n`;
    }
    
    if (previousIdeas && previousIdeas.length > 0) {
      brainstormPrompt += `Bisherige Ideen (entwickle diese weiter oder schlage neue vor):\n`;
      previousIdeas.forEach((idea: string, index: number) => {
        brainstormPrompt += `${index + 1}. ${idea}\n`;
      });
    }
    
    // Konfiguriere Optionen für kreativeres Brainstorming
    const options: RequestOptions = {
      prompt: brainstormPrompt,
      systemPrompt: `Du bist ein kreativer Brainstorming-Partner, der innovative Ideen und Lösungen generiert.
Sei kreativ, offen für unkonventionelle Ideen und denke in verschiedene Richtungen.
Strukturiere deine Antwort in klar definierte Kategorien von Ideen.
Für jede Idee gib eine kurze Erklärung und potenzielle Vor- und Nachteile an.`,
      temperature: 0.8, // Höhere Temperatur für mehr Kreativität
      maxTokens: 1500,
      model: 'gemini-1.5-pro' // Verwende Gemini Pro für kreativere Antworten
    };
    
    // Generiere Brainstorming-Ideen
    const response = await aiService.generateContent({
      prompt: brainstormPrompt,
      outputFormat: 'markdown'
    });
    
    return res.json({
      success: true,
      ideas: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Brainstorming-Anfrage:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten'
    });
  }
});

/**
 * POST /ai-assistant/analyze-document
 * Endpunkt zur umfassenden Analyse von Dokumenten
 */
router.post('/analyze-document', async (req: Request, res: Response) => {
  try {
    const { title, content, type } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Kein Dokumentinhalt übermittelt'
      });
    }
    
    // Analysiere das Dokument
    const document = {
      title: title || 'Unbenanntes Dokument',
      type: type || 'text',
      content
    };
    
    const analysisResult: DocumentAnalysisResult = await aiService.analyzeDocument(document);
    
    return res.json({
      success: true,
      analysis: analysisResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Dokumentenanalyse:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten'
    });
  }
});

// Export als default
export default router;