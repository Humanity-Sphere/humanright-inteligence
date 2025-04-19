/**
 * Tooltip System Routen
 * 
 * Endpunkte für das intelligente kontextbezogene Tooltip-System.
 */

import express from 'express';
import { getPerplexityService } from '../services/perplexity-service';

const router = express.Router();
const perplexityService = getPerplexityService();

// Endpoint zum Abrufen von Tooltip-Informationen
router.post('/info', perplexityService.middleware());

// Endpoint zum Prüfen des Status des Tooltip-Systems
router.get('/status', (req, res) => {
  const apiKeyAvailable = !!process.env.PERPLEXITY_API_KEY;
  
  res.json({
    available: apiKeyAvailable,
    provider: 'perplexity'
  });
});

export default router;