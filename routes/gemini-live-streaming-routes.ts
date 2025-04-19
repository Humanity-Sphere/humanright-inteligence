
import express, { Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { geminiLiveService } from '../services/gemini-live-service';

const router = express.Router();

/**
 * Stream-Endpunkt für Gemini Live Nachrichten
 * Verwendet Server-Sent Events (SSE) für Echtzeit-Streaming der Antworten
 */
router.get('/messages/stream', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { sessionId, message, requestId } = req.query;
    
    if (!sessionId || !message) {
      return res.status(400).json({ 
        error: 'Fehlende Parameter', 
        message: 'sessionId und message sind erforderlich' 
      });
    }

    // Prüfen, ob die Session zum angemeldeten Benutzer gehört
    const userId = req.user?.id;
    if (typeof sessionId === 'string' && userId !== undefined && !sessionId.startsWith(`${userId}-`)) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert', 
        message: 'Sie haben keinen Zugriff auf diese Session' 
      });
    }

    // SSE-Header setzen
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Für Nginx
    
    // Erhöhe Timeout für lange Verbindungen
    req.socket.setTimeout(300000);

    try {
      // Stream der Antwort anfordern
      const responseStream = await geminiLiveService.sendMessage(
        sessionId as string, 
        message as string, 
        true
      ) as AsyncGenerator<string>;
      
      for await (const chunk of responseStream) {
        if (req.socket.destroyed) {
          console.log('Client-Verbindung geschlossen - beende Stream');
          break;
        }

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
      res.write(`data: ${JSON.stringify({ 
        error: 'Streaming-Fehler', 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Allgemeiner Fehler im Streaming-Endpunkt:', error);
    // Wenn hier ein Fehler auftritt, ist der Header möglicherweise noch nicht gesetzt
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Interner Serverfehler', 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      });
    } else {
      res.write(`data: ${JSON.stringify({ 
        error: 'Interner Fehler', 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      })}\n\n`);
      res.end();
    }
  }
});

export default router;
