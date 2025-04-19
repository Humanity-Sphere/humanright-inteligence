/**
 * Archon Integration Routes
 * 
 * Diese Routen bieten Zugang zu der Archon-Integration für
 * selbstlernende und selbstverwaltende KI-Systeme.
 */

import { Router, Request, Response } from 'express';
import { ArchonIntegration } from '../services/archon-integration';
import { selfRepairAgent } from '../services/ai-self-repair-agent';

/**
 * Registriert die Archon-API-Routen
 */
export function registerArchonRoutes(): Router {
  const router = Router();
  // Hole die Archon-Integration aus dem Self-Repair-Agent
  const archonIntegration = selfRepairAgent.getArchonIntegration() || 
                           selfRepairAgent.initArchonIntegration();

  /**
   * GET /api/archon/status
   * Gibt den Status der Archon-Integration zurück
   */
  router.get('/status', (req: Request, res: Response) => {
    try {
      const status = archonIntegration.getStatus();
      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error getting Archon status:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon/config
   * Aktualisiert die Konfiguration der Archon-Integration
   */
  router.post('/config', (req: Request, res: Response) => {
    try {
      const newConfig = req.body;
      
      if (!newConfig || Object.keys(newConfig).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No configuration provided'
        });
      }
      
      archonIntegration.updateConfig(newConfig);
      
      res.json({
        success: true,
        config: archonIntegration.getConfig()
      });
    } catch (error) {
      console.error('Error updating Archon configuration:', error);
      res.status(500).json({
        success: false,
        error: `Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon/activate
   * Aktiviert die Archon-Integration
   */
  router.post('/activate', (req: Request, res: Response) => {
    try {
      archonIntegration.activate();
      
      res.json({
        success: true,
        active: archonIntegration.isActivated()
      });
    } catch (error) {
      console.error('Error activating Archon:', error);
      res.status(500).json({
        success: false,
        error: `Failed to activate: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon/deactivate
   * Deaktiviert die Archon-Integration
   */
  router.post('/deactivate', (req: Request, res: Response) => {
    try {
      archonIntegration.deactivate();
      
      res.json({
        success: true,
        active: archonIntegration.isActivated()
      });
    } catch (error) {
      console.error('Error deactivating Archon:', error);
      res.status(500).json({
        success: false,
        error: `Failed to deactivate: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * GET /api/archon/events
   * Gibt die letzten Ereignisse der Archon-Integration zurück
   */
  router.get('/events', (req: Request, res: Response) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 10;
      const type = req.query.type as string | undefined;
      
      const events = archonIntegration.getRecentEvents(count, type);
      
      res.json({
        success: true,
        events
      });
    } catch (error) {
      console.error('Error getting Archon events:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get events: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon/record-event
   * Zeichnet ein neues Ereignis in der Archon-Integration auf
   */
  router.post('/record-event', (req: Request, res: Response) => {
    try {
      const { type, data, source } = req.body;
      
      if (!type || !data) {
        return res.status(400).json({
          success: false,
          error: 'Event type and data are required'
        });
      }
      
      archonIntegration.recordEvent({
        type,
        data,
        timestamp: new Date(),
        source: source || 'api'
      });
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error recording Archon event:', error);
      res.status(500).json({
        success: false,
        error: `Failed to record event: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * GET /api/archon/self-repair/status
   * Gibt den Status des Self-Repair-Agents zurück
   */
  router.get('/self-repair/status', (req: Request, res: Response) => {
    try {
      const status = selfRepairAgent.getStatus();
      
      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error getting Self-Repair-Agent status:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * GET /api/archon/self-repair/issues
   * Gibt die aktuellen Probleme des Self-Repair-Agents zurück
   */
  router.get('/self-repair/issues', (req: Request, res: Response) => {
    try {
      const issues = selfRepairAgent.getIssues();
      
      res.json({
        success: true,
        issues
      });
    } catch (error) {
      console.error('Error getting Self-Repair-Agent issues:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get issues: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * GET /api/archon/self-repair/history
   * Gibt die Reparaturhistorie des Self-Repair-Agents zurück
   */
  router.get('/self-repair/history', (req: Request, res: Response) => {
    try {
      const history = selfRepairAgent.getRepairHistory();
      
      res.json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting Self-Repair-Agent history:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get history: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon/self-repair/detect-issues
   * Löst die manuelle Erkennung von Problemen aus
   */
  router.post('/self-repair/detect-issues', async (req: Request, res: Response) => {
    try {
      const issues = await selfRepairAgent.detectIssues();
      
      res.json({
        success: true,
        issues
      });
    } catch (error) {
      console.error('Error detecting issues with Self-Repair-Agent:', error);
      res.status(500).json({
        success: false,
        error: `Failed to detect issues: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon/self-repair/analyze-feedback
   * Analysiert Benutzerfeedback nach möglichen Problemen
   */
  router.post('/self-repair/analyze-feedback', async (req: Request, res: Response) => {
    try {
      const { feedback } = req.body;
      
      if (!feedback) {
        return res.status(400).json({
          success: false,
          error: 'Feedback is required'
        });
      }
      
      const issues = await selfRepairAgent.analyzeUserFeedback(feedback);
      
      res.json({
        success: true,
        issues
      });
    } catch (error) {
      console.error('Error analyzing feedback with Self-Repair-Agent:', error);
      res.status(500).json({
        success: false,
        error: `Failed to analyze feedback: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon/self-repair/reset
   * Setzt den Self-Repair-Agent zurück
   */
  router.post('/self-repair/reset', (req: Request, res: Response) => {
    try {
      selfRepairAgent.resetAgent();
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('Error resetting Self-Repair-Agent:', error);
      res.status(500).json({
        success: false,
        error: `Failed to reset agent: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  return router;
}