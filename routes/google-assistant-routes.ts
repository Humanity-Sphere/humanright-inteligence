/**
 * Google Assistant Routes für die Integration mit dem HR-Defender Coach
 * 
 * Diese Routen ermöglichen die Verarbeitung von Sprachbefehlen und die Integration
 * mit dem Google Gemini AI-Service.
 */

import { Request, Response, Router } from 'express';
import { GoogleAssistantAgent } from '../services/multi-agent-system/google-assistant-integration';
import { getAIService } from '../services/ai-service';
import { HRDefenderCoach } from '../services/hr-defender-coach';
import { TaskPriority } from '../services/multi-agent-system/agent-types';

// Interface für die Historie einer Konversation
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Interface für die Antwort des Assistenten
interface AssistantResponse {
  content: string;
  type: 'text' | 'code' | 'learning' | 'visualization';
  title?: string;
  metadata?: {
    createdAt: string;
    source?: string;
    confidence?: number;
  };
  code?: string;
}

// Router für die Google Assistant Integration
const router = Router();

// Instanz des Google Assistant Agenten
let googleAssistantAgent: GoogleAssistantAgent | null = null;

// Initialisierung des Google Assistant Agenten
const initializeGoogleAssistantAgent = async () => {
  try {
    // API-Schlüssel aus Umgebungsvariablen oder Konfiguration
    const apiKey = process.env.GOOGLE_AI_API_KEY || '';
    
    if (!apiKey) {
      console.error('Kein API-Schlüssel für Google Gemini gefunden. Bitte GOOGLE_AI_API_KEY in der .env-Datei festlegen.');
      return null;
    }
    
    // Erstelle und initialisiere den Agent
    const agent = new GoogleAssistantAgent('Google Assistant', apiKey, 'gemini-1.5-flash');
    const initialized = await agent.initialize();
    
    if (initialized) {
      console.log('Google Assistant Agent erfolgreich initialisiert');
      return agent;
    } else {
      console.error('Fehler bei der Initialisierung des Google Assistant Agenten');
      return null;
    }
  } catch (error) {
    console.error('Fehler bei der Initialisierung des Google Assistant Agenten:', error);
    return null;
  }
};

// Konvertiere den Intent und die Parameter in einen passenden Antworttyp
const determineResponseType = (intent: string, parameters: any): 'text' | 'code' | 'learning' | 'visualization' => {
  switch (intent) {
    case 'generateLearningPlan':
      return 'learning';
    case 'createVisualization':
      return 'visualization';
    case 'generateCode':
      return 'code';
    default:
      return 'text';
  }
};

// Generiere einen passenden Titel basierend auf Intent und Parametern
const generateTitle = (intent: string, parameters: any): string => {
  switch (intent) {
    case 'generateLearningPlan':
      return `Lernplan: ${parameters.topic || 'Personalisierter Lernplan'}`;
    case 'createVisualization':
      return `Visualisierung: ${parameters.topic || 'Datenvisualisierung'}`;
    case 'analyzeData':
      return `Analyse: ${parameters.topic || 'Datenanalyse'}`;
    case 'searchInformation':
      return `Recherche: ${parameters.topic || 'Informationssuche'}`;
    default:
      return parameters.topic ? `${parameters.topic}` : 'HR-Defender Coach Antwort';
  }
};

/**
 * POST /api/google-assistant/process
 * Verarbeitet einen Sprachbefehl und gibt eine Antwort zurück
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { command, conversationHistory = [], userId } = req.body;
    
    if (!command) {
      return res.status(400).json({ 
        error: 'Kein Sprachbefehl angegeben'
      });
    }
    
    // Stelle sicher, dass der Google Assistant Agent initialisiert ist
    if (!googleAssistantAgent) {
      googleAssistantAgent = await initializeGoogleAssistantAgent();
      
      if (!googleAssistantAgent) {
        return res.status(500).json({ 
          error: 'Google Assistant Agent konnte nicht initialisiert werden' 
        });
      }
    }

    // Analysiere den Intent des Benutzerbefehls
    const intentParams = await googleAssistantAgent.createGoogleAssistantIntent(
      command,
      userId.toString(),
      'de-DE'
    );
    
    console.log('Erkannter Intent:', intentParams.intent);
    console.log('Parameter:', intentParams.parameters);

    let responseContent: string;
    let responseType: 'text' | 'code' | 'learning' | 'visualization';
    let title: string;
    let code: string | undefined;
    
    // Wähle den Ansatz basierend auf dem Intent und den Parametern
    const approach = intentParams.context.bestApproach || 'document';
    
    // Hole den AI-Service für die Inhaltsgeneration
    const aiService = getAIService();
    
    if (intentParams.intent === 'generateLearningPlan') {
      // Erstelle einen HR-Defender Coach für Lernpläne
      const userProfile = {
        userId: parseInt(userId.toString()),
        role: 'Menschenrechtsverteidiger'
      };
      
      const coach = new HRDefenderCoach(
        aiService,
        userProfile,
        {
          includeOhchrResources: true,
          focusArea: [intentParams.parameters.topic || '']
        }
      );
      
      // Generiere einen personalisierten Lernplan
      try {
        const plan = await coach.generatePersonalizedLearningPlan({
          goal: intentParams.parameters.topic || 'Menschenrechte',
          durationDays: 14,
          includeExercises: true
        });
        
        // Formatiere den Lernplan als HTML
        responseContent = `
          <div class="learning-plan">
            <h2>Personalisierter Lernplan: ${plan.title || intentParams.parameters.topic || 'Menschenrechte'}</h2>
            
            <h3>Zielsetzung</h3>
            <p>${plan.goal || 'Verbesserung der Kenntnisse und Fähigkeiten im gewählten Bereich'}</p>
            
            <h3>Empfohlene Module</h3>
            <ul>
              ${plan.modules.map(module => `
                <li>
                  <strong>${module.title}</strong> (${module.type}, ca. ${module.estimatedTime} Min.)
                  <p>${module.description}</p>
                </li>
              `).join('')}
            </ul>
            
            <h3>Praktische Übungen</h3>
            <ul>
              ${plan.practicalExercises.map(exercise => `
                <li>
                  <p>${exercise.description}</p>
                </li>
              `).join('')}
            </ul>
            
            <p><em>Geschätzte Gesamtzeit: ${plan.estimatedTimeInvestment} Stunden</em></p>
          </div>
        `;
        
        responseType = 'learning';
        title = `Lernplan: ${plan.title || intentParams.parameters.topic || 'Menschenrechte'}`;
      } catch (error) {
        console.error('Fehler bei der Erstellung des Lernplans:', error);
        
        // Fallback: Generiere einen einfachen Lernplan über den AI-Service
        responseContent = await aiService.generateContent({
          prompt: `Erstelle einen Lernplan zum Thema "${intentParams.parameters.topic || 'Menschenrechte'}" für Menschenrechtsverteidiger. Der Lernplan sollte Module, Übungen und Ressourcen enthalten. Gib das Ergebnis als formatiertes HTML zurück.`,
          max_tokens: 1000
        });
        
        responseType = 'learning';
        title = `Lernplan: ${intentParams.parameters.topic || 'Menschenrechte'}`;
      }
    } else {
      // Generiere den Inhalt über den AI-Service
      let prompt = '';
      
      // Erstelle einen geeigneten Prompt basierend auf dem Intent
      switch (intentParams.intent) {
        case 'createDocument':
          prompt = `Erstelle ein Dokument zum Thema "${intentParams.parameters.topic || 'Menschenrechte'}" für ${intentParams.parameters.targetAudience || 'Menschenrechtsverteidiger'}. Format: ${intentParams.parameters.format || 'Bericht'}. Komplexität: ${intentParams.parameters.complexity || 'mittel'}.`;
          break;
        
        case 'analyzeData':
          prompt = `Analysiere folgende Daten zum Thema "${intentParams.parameters.topic || 'Menschenrechtsverletzungen'}". Berücksichtige dabei rechtliche und historische Kontexte. Gib eine detaillierte Analyse zurück.`;
          break;
        
        case 'createVisualization':
          if (approach === 'code') {
            prompt = `Generiere JavaScript-Code für eine Datenvisualisierung zum Thema "${intentParams.parameters.topic || 'Menschenrechtsverletzungen weltweit'}". Verwende D3.js oder Chart.js.`;
          } else {
            prompt = `Beschreibe eine Visualisierung zum Thema "${intentParams.parameters.topic || 'Menschenrechtsverletzungen weltweit'}". Erkläre, welche Datentypen dargestellt werden sollten und welche Visualisierungsform am besten geeignet wäre.`;
          }
          break;
        
        case 'searchInformation':
          prompt = `Suche und präsentiere Informationen zum Thema "${intentParams.parameters.topic || 'Menschenrechte'}". Fasse die wichtigsten Punkte zusammen und gib Quellen an, wo möglich.`;
          break;
        
        default:
          // Direkter Befehl oder Frage
          prompt = `Als HR-Defender Coach für Menschenrechtsverteidiger, beantworte die folgende Anfrage: "${command}". Gib eine vollständige, hilfreiche und gut strukturierte Antwort.`;
      }
      
      // Berücksichtige den Konversationsverlauf
      if (conversationHistory && conversationHistory.length > 0) {
        prompt += `\n\nBerücksichtige den bisherigen Konversationsverlauf:\n`;
        conversationHistory.slice(-5).forEach((msg: ConversationMessage) => {
          prompt += `${msg.role === 'user' ? 'Benutzer' : 'Assistent'}: ${msg.content}\n`;
        });
      }
      
      // Generiere den Inhalt
      responseContent = await aiService.generateContent({
        prompt,
        max_tokens: 1500
      });
      
      // Prüfe auf Code-Generierung
      if (approach === 'code' || intentParams.intent === 'generateCode') {
        // Extrahiere Code-Blöcke, wenn vorhanden
        const codeBlockRegex = /```(?:javascript|js|html|css)?\s*([\s\S]+?)```/;
        const match = responseContent.match(codeBlockRegex);
        
        if (match && match[1]) {
          code = match[1].trim();
          // Entferne Code-Blöcke aus dem Text
          responseContent = responseContent.replace(codeBlockRegex, '');
        }
      }
      
      // Bestimme den Antworttyp und Titel
      responseType = determineResponseType(intentParams.intent, intentParams.parameters);
      title = generateTitle(intentParams.intent, intentParams.parameters);
    }

    // Erstelle die Antwort des Assistenten
    const assistantResponse: AssistantResponse = {
      content: responseContent,
      type: responseType,
      title,
      code,
      metadata: {
        createdAt: new Date().toISOString(),
        confidence: intentParams.context.confidence || 0.9
      }
    };

    // Sende die Antwort zurück
    res.json(assistantResponse);
  } catch (error) {
    console.error('Fehler bei der Verarbeitung des Sprachbefehls:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler bei der Verarbeitung des Sprachbefehls',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/google-assistant/follow-up
 * Verarbeitet eine Follow-up-Anfrage für mehr Details oder Klarstellungen
 */
router.post('/follow-up', async (req: Request, res: Response) => {
  try {
    const { initialQuery, userResponse, dialogContext, userId } = req.body;
    
    if (!initialQuery || !userResponse) {
      return res.status(400).json({ 
        error: 'Anfrage und Antwort müssen angegeben werden'
      });
    }
    
    // Stelle sicher, dass der Google Assistant Agent initialisiert ist
    if (!googleAssistantAgent) {
      googleAssistantAgent = await initializeGoogleAssistantAgent();
      
      if (!googleAssistantAgent) {
        return res.status(500).json({ 
          error: 'Google Assistant Agent konnte nicht initialisiert werden' 
        });
      }
    }
    
    // Erstelle eine Aufgabe für das Follow-up
    const task = googleAssistantAgent.createTask(
      'follow-up-dialog',
      `Follow-up für: ${initialQuery}`,
      {
        initialQuery,
        userResponse,
        dialogContext: dialogContext || {}
      },
      TaskPriority.HIGH
    );
    
    // Führe die Aufgabe aus
    const result = await googleAssistantAgent.executeTask(task);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Fehler beim Follow-up',
        details: result.error
      });
    }
    
    // Sende die Antwort zurück
    res.json(result.data);
  } catch (error) {
    console.error('Fehler beim Follow-up:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler beim Follow-up',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/google-assistant/status
 * Prüft den Status des Google Assistant Agenten
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Wenn der Agent noch nicht initialisiert wurde, initialisiere ihn
    if (!googleAssistantAgent) {
      googleAssistantAgent = await initializeGoogleAssistantAgent();
    }
    
    // Sende den Status zurück
    res.json({
      status: googleAssistantAgent ? 'active' : 'inactive',
      model: googleAssistantAgent ? 'gemini-1.5-flash' : null,
      initialized: !!googleAssistantAgent
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Status:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler beim Abrufen des Status'
    });
  }
});

export const registerGoogleAssistantRoutes = (app: any) => {
  app.use('/api/google-assistant', router);
  console.log('Google Assistant Routen registriert');
};

export default router;