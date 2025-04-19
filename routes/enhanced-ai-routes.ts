/**
 * Routen für die erweiterte KI-Integration
 * Stellt Monitoring- und Routing-Funktionalitäten zur Verfügung
 */

import express from 'express';
import { enhancedAI } from '../services/enhanced-ai-integration';
import getKotaemonService from '../services/kotaemon-monitoring';
import { aiRouter, ModelCapability, ModelProvider } from '../services/praison-ai-router';
import logger from '../utils/logger';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

/**
 * Initialisiert den erweiterten KI-Dienst
 * Diese Route ist öffentlich zugänglich (kein isAuthenticated für Testzwecke)
 */
router.get('/status', async (req, res) => {
  try {
    await enhancedAI.initialize();

    const status = {
      initialized: true,
      routerStats: enhancedAI.getRouterStats(),
      availableModels: Object.keys(enhancedAI.getModelDetails())
    };

    res.json(status);
  } catch (error) {
    logger.error(`[EnhancedAIRoutes] Fehler beim Abrufen des Status: ${error}`);
    res.status(500).json({ error: 'Fehler beim Abrufen des Status' });
  }
});

/**
 * Generiert Inhalte mit dem optimalen Modell
 */
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const {
      prompt,
      capability,
      temperature,
      maxTokens,
      preferredModel,
      preferredProvider,
      priority,
      systemPrompt
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt ist erforderlich' });
    }

    // Konvertiere String-Capability in Enum
    let modelCapability: ModelCapability | undefined;
    if (capability) {
      modelCapability = capability as ModelCapability;
    }

    // Konvertiere String-Provider in Enum
    let modelProvider: ModelProvider | undefined;
    if (preferredProvider) {
      modelProvider = preferredProvider as ModelProvider;
    }

    const content = await enhancedAI.generateContent(prompt, {
      userId: req.user?.id,
      sessionId: req.sessionID,
      capability: modelCapability,
      temperature,
      maxTokens,
      preferredModel,
      preferredProvider: modelProvider,
      priority,
      systemPrompt
    });

    res.json({ content });
  } catch (error) {
    logger.error(`[EnhancedAIRoutes] Fehler bei der Inhaltsgeneration: ${error}`);
    res.status(500).json({ error: `Fehler bei der Inhaltsgeneration: ${error}` });
  }
});

/**
 * Ruft Monitoring-Metriken ab
 */
router.get('/monitoring/metrics', isAuthenticated, async (req, res) => {
  try {
    const { 
      metricType, 
      startDate, 
      endDate, 
      model, 
      context 
    } = req.query;
    
    // Parse Datumsangaben
    let timeRange;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }
    
    const kotaemonService = getKotaemonService();
    const kotaemonStatus = kotaemonService.getStatus();
    
    // Einfache Metrikstruktur zurückgeben
    const metrics = {
      status: kotaemonStatus,
      timeRange: timeRange || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      },
      metricType: metricType || 'all',
      model: model || 'all',
      context: context || 'all'
    };
    
    res.json({ metrics });
  } catch (error) {
    logger.error(`[EnhancedAIRoutes] Fehler beim Abrufen der Metriken: ${error}`);
    res.status(500).json({ error: 'Fehler beim Abrufen der Metriken' });
  }
});

/**
 * Ruft einen Leistungsbericht ab
 */
router.get('/monitoring/report', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse Datumsangaben
    let timeRange;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }
    
    const kotaemonService = getKotaemonService();
    const kotaemonStatus = kotaemonService.getStatus();
    
    // Einfachen Bericht zurückgeben
    const report = {
      status: kotaemonStatus,
      timeRange: timeRange || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: 0,
        averageLatency: 0,
        errorRate: 0,
        modelUsage: {}
      }
    };
    res.json(report);
  } catch (error) {
    logger.error(`[EnhancedAIRoutes] Fehler beim Generieren des Berichts: ${error}`);
    res.status(500).json({ error: 'Fehler beim Generieren des Berichts' });
  }
});

/**
 * Gibt Statistiken zum Router zurück
 */
router.get('/router/stats', isAuthenticated, async (req, res) => {
  try {
    const stats = enhancedAI.getRouterStats();
    res.json(stats);
  } catch (error) {
    logger.error(`[EnhancedAIRoutes] Fehler beim Abrufen der Router-Statistiken: ${error}`);
    res.status(500).json({ error: 'Fehler beim Abrufen der Router-Statistiken' });
  }
});

/**
 * Gibt detaillierte Modellinformationen zurück
 */
router.get('/router/models', isAuthenticated, async (req, res) => {
  try {
    const models = enhancedAI.getModelDetails();
    res.json(models);
  } catch (error) {
    logger.error(`[EnhancedAIRoutes] Fehler beim Abrufen der Modellinformationen: ${error}`);
    res.status(500).json({ error: 'Fehler beim Abrufen der Modellinformationen' });
  }
});

/**
 * Aktiviert ein Modell
 */
router.post('/router/models/:modelId/activate', isAuthenticated, (req, res) => {
  const { modelId } = req.params;
  
  try {
    aiRouter.activateModel(modelId);
    res.json({ success: true, message: `Modell ${modelId} aktiviert` });
  } catch (error) {
    logger.error(`[EnhancedAIRoutes] Fehler beim Aktivieren des Modells: ${error}`);
    res.status(500).json({ error: 'Fehler beim Aktivieren des Modells' });
  }
});

/**
 * Deaktiviert ein Modell
 */
router.post('/router/models/:modelId/deactivate', isAuthenticated, (req, res) => {
  const { modelId } = req.params;
  
  try {
    aiRouter.deactivateModel(modelId);
    res.json({ success: true, message: `Modell ${modelId} deaktiviert` });
  } catch (error) {
    logger.error(`[EnhancedAIRoutes] Fehler beim Deaktivieren des Modells: ${error}`);
    res.status(500).json({ error: 'Fehler beim Deaktivieren des Modells' });
  }
});

export default router;