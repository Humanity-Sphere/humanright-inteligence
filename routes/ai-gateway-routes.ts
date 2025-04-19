/**
 * AI Gateway Routes
 * 
 * Diese Routen bieten Zugang zu der AI Gateway für optimierte KI-Anfragen
 * mit Multi-Provider-Unterstützung, Failover und Load-Balancing.
 */

import { Router, Request, Response } from 'express';
import { AIGateway, AIServiceProvider, initializeAIGateway, getAIGateway } from '../services/ai-gateway-integration';

/**
 * Konfiguriert und registriert die AI Gateway Routen
 */
export function registerAIGatewayRoutes(): Router {
  const router = Router();

  // Initialisiere die AIGateway mit Umgebungsvariablen
  try {
    // Konfiguration aus Umgebungsvariablen laden
    initializeAIGateway({
      providers: [
        // OpenAI-Provider
        process.env.OPENAI_API_KEY ? {
          name: AIServiceProvider.OPENAI,
          apiKey: process.env.OPENAI_API_KEY,
          defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
          weight: 2
        } : null,
        
        // Google Gemini-Provider
        process.env.GEMINI_API_KEY ? {
          name: AIServiceProvider.GOOGLE_GEMINI,
          apiKey: process.env.GEMINI_API_KEY,
          defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-pro',
          weight: 3
        } : null,
        
        // Anthropic-Provider (optional)
        process.env.ANTHROPIC_API_KEY ? {
          name: AIServiceProvider.ANTHROPIC,
          apiKey: process.env.ANTHROPIC_API_KEY,
          defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-haiku',
          weight: 1
        } : null,
        
        // Mistral-Provider (optional)
        process.env.MISTRAL_API_KEY ? {
          name: AIServiceProvider.MISTRAL,
          apiKey: process.env.MISTRAL_API_KEY,
          defaultModel: process.env.MISTRAL_DEFAULT_MODEL || 'mistral-large',
          weight: 1
        } : null
      ].filter(Boolean) as any, // Entferne null-Einträge
      cachingEnabled: true,
      cacheTTLSeconds: parseInt(process.env.AI_GATEWAY_CACHE_TTL || '3600'),
      failoverStrategy: (process.env.AI_GATEWAY_FAILOVER_STRATEGY || 'sequential') as 'sequential' | 'random',
      loadBalancingStrategy: (process.env.AI_GATEWAY_LOAD_BALANCING || 'weighted') as 'round-robin' | 'weighted' | 'least-load',
      requestLogging: true
    });

    console.log('[AIGateway] AI Gateway erfolgreich initialisiert');
  } catch (error) {
    console.error('[AIGateway] Fehler bei der Initialisierung der AI Gateway:', error);
  }

  /**
   * GET /status
   * Gibt den Status der AI Gateway zurück
   */
  router.get('/status', (req: Request, res: Response) => {
    try {
      const gateway = getAIGateway();
      const status = gateway.getStatus();
      const providerStats = gateway.getProviderStats();
      const cacheStats = gateway.getCacheStats();
      
      res.json({
        success: true,
        status,
        providerStats,
        cacheStats
      });
    } catch (error) {
      console.error('[AIGateway] Fehler beim Abrufen des Status:', error);
      res.status(500).json({
        success: false,
        error: `Fehler beim Abrufen des Status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /chat/completions
   * Chat-Completion-Anfrage über die AI Gateway
   */
  router.post('/chat/completions', async (req: Request, res: Response) => {
    try {
      const gateway = getAIGateway();
      const params = req.body;
      
      // Streaming-Unterstützung
      if (params.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Streaming-Implementierung kommt hier
        // Diese würde die Stream-Events vom Gateway abonnieren und an den Client weiterleiten
        
        // Vorübergehend: Streaming nicht unterstützt
        res.status(400).json({
          success: false,
          error: 'Streaming wird derzeit nicht unterstützt'
        });
        return;
      }
      
      // Standard-Anfrage (nicht-streaming)
      const response = await gateway.chatCompletion(params);
      res.json(response);
    } catch (error) {
      console.error('[AIGateway] Fehler bei Chat-Completion:', error);
      res.status(500).json({
        success: false,
        error: `Fehler bei der Chat-Completion: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /completions
   * Text-Completion-Anfrage über die AI Gateway
   */
  router.post('/completions', async (req: Request, res: Response) => {
    try {
      const gateway = getAIGateway();
      const params = req.body;
      
      // Streaming nicht unterstützt (vorerst)
      if (params.stream) {
        res.status(400).json({
          success: false,
          error: 'Streaming wird derzeit nicht unterstützt'
        });
        return;
      }
      
      const response = await gateway.completion(params);
      res.json(response);
    } catch (error) {
      console.error('[AIGateway] Fehler bei Text-Completion:', error);
      res.status(500).json({
        success: false,
        error: `Fehler bei der Text-Completion: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /embeddings
   * Embeddings-Anfrage über die AI Gateway
   */
  router.post('/embeddings', async (req: Request, res: Response) => {
    try {
      const gateway = getAIGateway();
      const params = req.body;
      
      const response = await gateway.embeddings(params);
      res.json(response);
    } catch (error) {
      console.error('[AIGateway] Fehler bei Embeddings:', error);
      res.status(500).json({
        success: false,
        error: `Fehler bei den Embeddings: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /request
   * Allgemeine API-Anfrage über die AI Gateway
   */
  router.post('/request', async (req: Request, res: Response) => {
    try {
      const gateway = getAIGateway();
      const { endpoint, ...params } = req.body;
      
      if (!endpoint) {
        res.status(400).json({
          success: false,
          error: 'Endpoint-Parameter ist erforderlich'
        });
        return;
      }
      
      // Streaming nicht unterstützt (vorerst)
      if (params.stream) {
        res.status(400).json({
          success: false,
          error: 'Streaming wird derzeit nicht unterstützt'
        });
        return;
      }
      
      const response = await gateway.request(endpoint, params);
      res.json(response);
    } catch (error) {
      console.error('[AIGateway] Fehler bei allgemeiner Anfrage:', error);
      res.status(500).json({
        success: false,
        error: `Fehler bei der Anfrage: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /config
   * Aktualisiert die Konfiguration der AI Gateway
   */
  router.post('/config', (req: Request, res: Response) => {
    try {
      const gateway = getAIGateway();
      const newConfig = req.body;
      
      if (!newConfig || Object.keys(newConfig).length === 0) {
        res.status(400).json({
          success: false,
          error: 'Keine Konfiguration angegeben'
        });
        return;
      }
      
      // Sensible API-Schlüssel maskieren
      if (newConfig.providers) {
        for (const provider of newConfig.providers) {
          if (provider.apiKey) {
            // Nur speichern, wenn ein neuer Schlüssel angegeben wurde
            // Ansonsten den vorhandenen beibehalten
          }
        }
      }
      
      gateway.updateConfig(newConfig);
      
      // Maskierte Konfiguration zurückgeben
      const status = gateway.getStatus();
      
      res.json({
        success: true,
        config: status.config
      });
    } catch (error) {
      console.error('[AIGateway] Fehler beim Aktualisieren der Konfiguration:', error);
      res.status(500).json({
        success: false,
        error: `Fehler beim Aktualisieren der Konfiguration: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /cache/clear
   * Leert den Cache der AI Gateway
   */
  router.post('/cache/clear', (req: Request, res: Response) => {
    try {
      const gateway = getAIGateway();
      gateway.clearCache();
      
      res.json({
        success: true,
        message: 'Cache erfolgreich geleert'
      });
    } catch (error) {
      console.error('[AIGateway] Fehler beim Leeren des Caches:', error);
      res.status(500).json({
        success: false,
        error: `Fehler beim Leeren des Caches: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  return router;
}

// Exportiere die Router-Funktion
export default registerAIGatewayRoutes;