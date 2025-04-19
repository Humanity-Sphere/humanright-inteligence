/**
 * Routen für den Gemini Live Service
 * 
 * Diese Routen ermöglichen die Interaktion mit dem Gemini Live API Service,
 * der kontinuierliche Kommunikation und Streaming-Antworten unterstützt.
 */
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { geminiLiveService } from '../services/gemini-live-service';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Status-Endpoint für Gemini Live Service
router.get('/status', (_req: Request, res: Response) => {
  try {
    // Prüfe, ob der API-Key verfügbar ist
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    res.json({
      available: !!apiKey,
      status: 'active',
      model: 'gemini-2.5-flash-latest',
      provider: 'Google',
      streaming: true
    });
    
    console.log('GET /api/gemini-live/status - Service ist verfügbar');
  } catch (error) {
    console.error('Fehler beim Abrufen des Gemini Live Service Status:', error);
    res.status(500).json({ 
      available: false, 
      error: 'Fehler beim Prüfen des Gemini Live Service'
    });
  }
});

// Validierungsschemas
const initSessionSchema = z.object({
  context: z.object({
    role: z.string().optional(),
    document: z.object({
      id: z.number().optional(),
      title: z.string().optional(),
      content: z.string().optional()
    }).optional(),
    task: z.string().optional(),
    topic: z.string().optional()
  }).optional()
});

const sendMessageSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
  stream: z.boolean().optional()
});

// Hilfsfunktion zur sicheren Extraktion der Benutzer-ID
function getUserId(user: any): number | undefined {
  if (user && typeof user === 'object' && 'id' in user) {
    return user.id;
  }
  return undefined;
}

/**
 * Initialisiert eine neue Gemini Live Session
 * Eine Session ermöglicht kontinuierliche Kommunikation mit dem Modell
 */
router.post('/sessions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validiere die Anfrage
    const validationResult = initSessionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Ungültige Anfragedaten', 
        details: validationResult.error 
      });
    }

    // Erstelle eine eindeutige Session-ID mit Benutzer-ID Präfix für Sicherheit
    const userId = getUserId(req.user);
    const sessionId = `${userId || 'anon'}-${uuidv4()}`;

    // Kontext mit Benutzer-ID anreichern
    const context = {
      ...req.body.context,
      userId
    };

    // Session initialisieren
    await geminiLiveService.initializeSession(sessionId, context);

    // Erfolgreiche Antwort
    res.status(201).json({ 
      sessionId,
      message: 'Gemini Live Session erfolgreich erstellt'
    });
  } catch (error) {
    console.error('Fehler beim Erstellen einer Gemini Live Session:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler bei der Session-Erstellung',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Sendet eine Nachricht an eine bestehende Session
 * Unterstützt sowohl normale als auch Streaming-Antworten
 */
router.post('/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validiere die Anfrage
    const validationResult = sendMessageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Ungültige Anfragedaten', 
        details: validationResult.error 
      });
    }

    const { sessionId, message, stream = false } = req.body;

    // Prüfe, ob die Session zum angemeldeten Benutzer gehört
    const userId = getUserId(req.user);
    if (!sessionId.startsWith(`${userId}-`) && userId !== undefined) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert', 
        message: 'Sie haben keinen Zugriff auf diese Session' 
      });
    }

    if (stream) {
      // Streaming-Antwort einrichten
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Erhöhe die Anfrage-Timeout-Zeit für Streaming
      req.socket.setTimeout(120000);

      try {
        // Streamen der Antwort
        const responseStream = await geminiLiveService.sendMessage(sessionId, message, true) as AsyncGenerator<string>;
        
        for await (const chunk of responseStream) {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          
          // Versuche die Antwort zu flushen (falls verfügbar)
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
        
        // Ende des Streams signalisieren
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (error) {
        console.error('Fehler beim Streamen der Antwort:', error);
        res.write(`data: ${JSON.stringify({ error: 'Streaming-Fehler', message: error instanceof Error ? error.message : 'Unbekannter Fehler' })}\n\n`);
        res.end();
      }
    } else {
      // Normale synchrone Antwort
      const response = await geminiLiveService.sendMessage(sessionId, message) as string;
      res.json({ response });
    }
  } catch (error) {
    console.error('Fehler beim Senden einer Nachricht:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler bei der Nachrichtenverarbeitung',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Beendet eine Session
 */
router.delete('/sessions/:sessionId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Prüfe, ob die Session zum angemeldeten Benutzer gehört
    const userId = getUserId(req.user);
    if (!sessionId.startsWith(`${userId}-`) && userId !== undefined) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert', 
        message: 'Sie haben keinen Zugriff auf diese Session' 
      });
    }

    // Session beenden
    const success = geminiLiveService.endSession(sessionId);
    
    if (success) {
      res.json({ 
        success: true,
        message: 'Session erfolgreich beendet'
      });
    } else {
      res.status(404).json({ 
        error: 'Session nicht gefunden',
        message: 'Die angegebene Session existiert nicht oder ist bereits beendet'
      });
    }
  } catch (error) {
    console.error('Fehler beim Beenden einer Session:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler beim Beenden der Session',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

export default router;