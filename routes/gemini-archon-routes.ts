/**
 * Gemini Archon Routes
 * 
 * Diese Routen bieten Zugang zu der erweiterten Gemini-Integration
 * mit Archon für fortgeschrittene KI-Agenten-Funktionen.
 */

import { Router, Request, Response } from 'express';
import { ArchonIntegration } from '../services/archon-integration';
import { GeminiArchonIntegrationService, getGeminiArchonService } from '../services/gemini-archon-integration';

/**
 * Registriert die Gemini-Archon-API-Routen
 */
export function registerGeminiArchonRoutes(archonIntegration: ArchonIntegration): Router {
  const router = Router();
  const geminiArchonService = getGeminiArchonService(archonIntegration);

  /**
   * POST /api/gemini-archon/session
   * Erstellt eine neue Gemini-Session mit Archon-Integration
   */
  router.post('/session', async (req: Request, res: Response) => {
    try {
      const { model, systemPrompt, userId, context } = req.body;
      
      const sessionId = await geminiArchonService.createSession({
        model: model || 'gemini-1.5-pro',
        systemPrompt: systemPrompt,
        userId: userId || req.session.userId?.toString(),
        contextData: context
      });
      
      res.json({ success: true, sessionId });
    } catch (error) {
      console.error('Error creating Gemini Archon session:', error);
      res.status(500).json({
        success: false,
        error: `Failed to create session: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/gemini-archon/message
   * Sendet eine Nachricht an eine bestehende Gemini-Session
   */
  router.post('/message', async (req: Request, res: Response) => {
    try {
      const { sessionId, message } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'SessionId is required' });
      }
      
      if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }
      
      const response = await geminiArchonService.sendMessage(sessionId, message);
      
      res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Error sending message to Gemini Archon session:', error);
      res.status(500).json({
        success: false,
        error: `Failed to send message: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/gemini-archon/audio-stream/start
   * Startet einen Audio-Stream für die Gemini-Live-API
   */
  router.post('/audio-stream/start', async (req: Request, res: Response) => {
    try {
      const { sessionId, config } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'SessionId is required' });
      }
      
      const streamId = await geminiArchonService.startAudioStream(sessionId, config);
      
      res.json({
        success: true,
        streamId
      });
    } catch (error) {
      console.error('Error starting audio stream:', error);
      res.status(500).json({
        success: false,
        error: `Failed to start audio stream: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/gemini-archon/audio-stream/stop
   * Stoppt einen laufenden Audio-Stream
   */
  router.post('/audio-stream/stop', async (req: Request, res: Response) => {
    try {
      const { sessionId, streamId } = req.body;
      
      if (!sessionId || !streamId) {
        return res.status(400).json({ success: false, error: 'SessionId and streamId are required' });
      }
      
      const result = await geminiArchonService.stopAudioStream(sessionId, streamId);
      
      res.json({
        success: result
      });
    } catch (error) {
      console.error('Error stopping audio stream:', error);
      res.status(500).json({
        success: false,
        error: `Failed to stop audio stream: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/gemini-archon/session/end
   * Beendet eine Gemini-Session
   */
  router.post('/session/end', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'SessionId is required' });
      }
      
      const result = await geminiArchonService.endSession(sessionId);
      
      res.json({
        success: result
      });
    } catch (error) {
      console.error('Error ending Gemini Archon session:', error);
      res.status(500).json({
        success: false,
        error: `Failed to end session: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  return router;
}