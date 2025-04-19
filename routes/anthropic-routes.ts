/**
 * Anthropic API Integration Routes
 * 
 * Diese Routen stellen die Integration mit der Anthropic Claude API bereit.
 */

import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// Prüft, ob der API-Key gesetzt ist und gibt den Status zurück
router.get('/status', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(200).json({
        available: false,
        message: 'Kein Anthropic API-Key konfiguriert.'
      });
    }
    
    // Anthropic Client erstellen
    const anthropic = new Anthropic({
      apiKey,
    });
    
    // Einfache Test-Anfrage
    try {
      const message = await anthropic.messages.create({
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Sag "Hallo Welt"' }],
        model: 'claude-3-7-sonnet-20250219', // der neueste Anthropic model
      });
      
      return res.status(200).json({
        available: true,
        provider: 'anthropic',
        model: 'claude-3-7-sonnet-20250219',
        responsePreview: message.content,
        message: 'Anthropic API ist verfügbar und funktioniert.'
      });
    } catch (testError) {
      console.error('Anthropic API Test-Fehler:', testError);
      return res.status(200).json({
        available: false,
        provider: 'anthropic',
        error: testError instanceof Error ? testError.message : 'Unbekannter Fehler',
        message: 'Anthropic API ist konfiguriert, aber der Test schlug fehl.'
      });
    }
  } catch (error) {
    console.error('Anthropic Status-Fehler:', error);
    return res.status(500).json({
      available: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      message: 'Fehler beim Prüfen des Anthropic API-Status.'
    });
  }
});

// Sendet eine Nachricht an Anthropic Claude
router.post('/message', async (req, res) => {
  try {
    const { prompt, maxTokens = 1024, model = 'claude-3-7-sonnet-20250219' } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Kein Anthropic API-Key konfiguriert.'
      });
    }
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Kein Prompt angegeben.'
      });
    }
    
    // Anthropic Client erstellen
    const anthropic = new Anthropic({
      apiKey,
    });
    
    const message = await anthropic.messages.create({
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      model: model,
    });
    
    return res.status(200).json({
      success: true,
      content: message.content,
      model: model
    });
  } catch (error) {
    console.error('Anthropic Message-Fehler:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      message: 'Fehler beim Senden der Nachricht an Anthropic Claude.'
    });
  }
});

// Analysiert ein Bild mit Anthropic Claude
router.post('/analyze-image', async (req, res) => {
  try {
    const { base64Image, prompt } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Kein Anthropic API-Key konfiguriert.'
      });
    }
    
    if (!base64Image) {
      return res.status(400).json({
        success: false,
        message: 'Kein Bild angegeben.'
      });
    }
    
    // Anthropic Client erstellen
    const anthropic = new Anthropic({
      apiKey,
    });
    
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: prompt || "Analysiere dieses Bild im Detail und beschreibe seine Schlüsselelemente, den Kontext und bemerkenswerte Aspekte."
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    });
    
    return res.status(200).json({
      success: true,
      content: message.content,
      model: "claude-3-7-sonnet-20250219"
    });
  } catch (error) {
    console.error('Anthropic Bildanalyse-Fehler:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      message: 'Fehler bei der Bildanalyse mit Anthropic Claude.'
    });
  }
});

export default router;