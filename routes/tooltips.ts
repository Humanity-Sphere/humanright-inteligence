/**
 * Tooltip System Routen
 * 
 * Endpunkte für das intelligente kontextbezogene Tooltip-System.
 */

import express from 'express';
import { getPerplexityService } from '../services/perplexity-service';
import tooltipService, { TooltipHelpLevel } from '../services/tooltip-service';
import { MCPServer } from '../services/mcp-service';

const router = express.Router();
const perplexityService = getPerplexityService();

// Initialisiere MCP-Integration
try {
  const mcpServer = MCPServer.getInstance();
  tooltipService.setMCPServer(mcpServer);
  console.log('[TooltipRoutes] MCP-Integration aktiviert');
} catch (error) {
  console.warn('[TooltipRoutes] MCP-Integration nicht verfügbar:', error);
}

// Endpoint zum Abrufen von Tooltip-Informationen (neue Version mit erweiterten Optionen)
router.post('/info', tooltipService.createMiddleware());

// Legacy-Endpoint für Tooltip-Informationen (für Kompatibilität mit älteren Anwendungsteilen)
router.post('/legacy-info', perplexityService.middleware());

// Endpoint zum Abrufen von Tooltip-Inhalten (verwendet in TooltipContext)
router.post('/content', async (req, res) => {
  try {
    const { contextId, params = {}, aiMode, userPreferences = {} } = req.body;

    if (!contextId) {
      return res.status(400).json({ 
        error: "Context ID wird benötigt" 
      });
    }

    // Konfiguration vorbereiten
    const helpLevel: TooltipHelpLevel = aiMode === 'enhanced' ? 'detailed' : 'basic';
    const includeReferences = !!userPreferences.showReferences;
    
    // Tooltip über neuen Service abrufen
    const tooltipInfo = await tooltipService.getTooltipInfo({
      context: contextId,
      elementType: params.elementType || 'concept',
      userLevel: userPreferences.userLevel || 'intermediate',
      language: userPreferences.language || 'de',
      includeReferences,
      helpLevel
    });

    return res.json({
      content: tooltipInfo.text,
      citations: tooltipInfo.citations || [],
      contextType: tooltipInfo.contextType
    });
  } catch (error) {
    console.error('Fehler im Tooltip Content Endpoint:', error);
    return res.status(500).json({ 
      error: "Fehler beim Abrufen des Tooltip-Inhalts"
    });
  }
});

// Endpoint zum Prüfen des Status des Tooltip-Systems
router.get('/status', (req, res) => {
  const perplexityApiKeyAvailable = !!process.env.PERPLEXITY_API_KEY;
  const openaiApiKeyAvailable = !!process.env.OPENAI_API_KEY;
  
  res.json({
    available: perplexityApiKeyAvailable || openaiApiKeyAvailable,
    provider: perplexityApiKeyAvailable ? 'perplexity' : 'openai',
    fallbackAvailable: openaiApiKeyAvailable && perplexityApiKeyAvailable,
    mcpIntegrated: !!tooltipService['mcpServer']
  });
});

// Endpoint zum Leeren des Tooltip-Caches
router.post('/clear-cache', (req, res) => {
  tooltipService.clearCache();
  res.json({
    success: true,
    message: 'Tooltip-Cache erfolgreich geleert'
  });
});

// Endpoint zum Abrufen aller verfügbaren Kontextkategorien
router.get('/context-types', (req, res) => {
  res.json({
    contextTypes: [
      'ui-element', 'field', 'function', 'concept', 
      'legal', 'error', 'security', 'process'
    ]
  });
});

export default router;