/**
 * Live-Brainstorming-Routen für die Human Rights Intelligence App
 * 
 * Diese Routen ermöglichen interaktive Brainstorming-Sessions mit Gemini
 * für Menschenrechtsverteidiger. Das System nutzt Konversationskontexte,
 * um qualitativ hochwertige Antworten zu generieren und unterstützt
 * den kreativen Prozess.
 */

import { Router, Request, Response } from 'express';
import { getAIServiceFactory, TaskType } from '../services/ai-service-factory';
import { isAuthenticated } from '../middleware/auth';
import { IStorage } from '../storage';

const router = Router();

// Middleware zur Authentifizierung
router.use(isAuthenticated);

/**
 * POST /api/ai/live-brainstorm
 * Generiert eine Antwort im Rahmen einer Live-Brainstorming-Session.
 * Behält den Konversationskontext bei und optimiert für Kreativität.
 */
router.post('/live-brainstorm', async (req: Request, res: Response) => {
  try {
    const { messages, project } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request format. Messages array is required.'
      });
    }

    // Benutzerspezifischer Kontext
    const userId = req.session.userId;
    let userContext = '';
    
    // Füge projektspezifischen Kontext hinzu, wenn vorhanden
    if (project) {
      try {
        // Hole Projektinformationen aus der Datenbank
        const storage = req.app.locals.storage as IStorage;
        const projectData = await storage.getProjectById(project);
        
        if (projectData) {
          userContext += `\nProjektkontext: ${projectData.name} - ${projectData.description}\n`;
        }
      } catch (error) {
        console.warn('Fehler beim Abrufen von Projektdaten:', error);
      }
    }

    // Formatiere Nachrichtenverlauf für den AI-Service
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // System Prompt für Brainstorming Session
    const systemPrompt = `
      Du bist ein Brainstorming-Partner für Menschenrechtsverteidiger.
      Deine Aufgabe ist es, kreative Ideen zu fördern, kritische Fragen zu stellen,
      und konstruktive Beiträge zu liefern.
      
      Halte deine Antworten:
      - Konstruktiv und unterstützend
      - Kreativ und innovativ
      - Relevant für Menschenrechtsarbeit
      - Konkret und praxisorientiert
      - Ethisch und respektvoll
      
      Stell Fragen zurück, wenn der Gedankengang unklar ist.
      Fasse komplexe Ideen zusammen und schlage Verbesserungen vor.
      ${userContext}
    `;

    // Rufe den KI-Service mit Kontext und Optimierung für Kreativität
    const aiFactory = getAIServiceFactory();
    const aiService = aiFactory.selectOptimalService({
      taskType: TaskType.BRAINSTORMING,
      preferredProvider: 'gemini'
    });
    
    const response = await aiService.generateContent({
      prompt: `
        ${systemPrompt}
        
        Gesprächsverlauf:
        ${formattedMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
        
        Gib nur deine nächste Antwort ohne Einleitung oder Kontext.
      `,
      temperature: 0.75, // Leicht höhere Temperatur für Kreativität
      outputFormat: 'text'
    });

    // Speichere Interaktion in der Datenbank für spätere Analyse
    try {
      const storage = req.app.locals.storage as IStorage;
      
      await storage.addBrainstormingSession({
        userId: userId,
        timestamp: new Date(),
        projectId: project || null,
        messages: JSON.stringify(messages), 
        response
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Brainstorming-Session:', error);
      // Fehler beim Speichern nicht an den Client weitergeben
    }

    return res.json({
      response
    });
  } catch (error) {
    console.error('Fehler in der Live-Brainstorming-API:', error);
    return res.status(500).json({
      error: 'Ein Fehler ist aufgetreten beim Verarbeiten deiner Anfrage.'
    });
  }
});

/**
 * GET /api/ai/brainstorm-sessions
 * Ruft alle gespeicherten Brainstorming-Sessions für den aktuellen Benutzer ab.
 */
router.get('/brainstorm-sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const projectId = req.query.projectId as string | undefined;
    
    const storage = req.app.locals.storage as IStorage;
    let sessions;
    
    if (projectId) {
      sessions = await storage.getBrainstormingSessionsByProject(projectId, userId);
    } else {
      sessions = await storage.getBrainstormingSessionsByUser(userId);
    }
    
    return res.json(sessions);
  } catch (error) {
    console.error('Fehler beim Abrufen der Brainstorming-Sessions:', error);
    return res.status(500).json({
      error: 'Ein Fehler ist aufgetreten beim Abrufen deiner Brainstorming-Sessions.'
    });
  }
});

/**
 * GET /api/ai/brainstorm-sessions/:id
 * Ruft eine spezifische Brainstorming-Session anhand ihrer ID ab.
 */
router.get('/brainstorm-sessions/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const userId = req.session.userId;
    
    const storage = req.app.locals.storage as IStorage;
    const session = await storage.getBrainstormingSessionById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Brainstorming-Session nicht gefunden.'
      });
    }
    
    // Prüfe, ob der Benutzer Zugriff auf diese Session hat
    if (session.userId !== userId) {
      return res.status(403).json({
        error: 'Keine Berechtigung zum Zugriff auf diese Brainstorming-Session.'
      });
    }
    
    return res.json(session);
  } catch (error) {
    console.error('Fehler beim Abrufen der Brainstorming-Session:', error);
    return res.status(500).json({
      error: 'Ein Fehler ist aufgetreten beim Abrufen der Brainstorming-Session.'
    });
  }
});

/**
 * DELETE /api/ai/brainstorm-sessions/:id
 * Löscht eine Brainstorming-Session anhand ihrer ID.
 */
router.delete('/brainstorm-sessions/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const userId = req.session.userId;
    
    const storage = req.app.locals.storage as IStorage;
    const session = await storage.getBrainstormingSessionById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Brainstorming-Session nicht gefunden.'
      });
    }
    
    // Prüfe, ob der Benutzer Berechtigung zum Löschen hat
    if (session.userId !== userId) {
      return res.status(403).json({
        error: 'Keine Berechtigung zum Löschen dieser Brainstorming-Session.'
      });
    }
    
    await storage.deleteBrainstormingSession(sessionId);
    
    return res.json({
      success: true,
      message: 'Brainstorming-Session erfolgreich gelöscht.'
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Brainstorming-Session:', error);
    return res.status(500).json({
      error: 'Ein Fehler ist aufgetreten beim Löschen der Brainstorming-Session.'
    });
  }
});

export default router;