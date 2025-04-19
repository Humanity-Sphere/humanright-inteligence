/**
 * TangoFlux Routes
 * 
 * Diese Datei definiert die API-Routen für die TangoFlux-Integration,
 * die multimodale Prompt-Generierung und Audio-Generierung ermöglicht.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { getTangoFluxIntegration, initializeTangoFluxIntegration, PromptGenerationOptions, AudioGenerationOptions } from '../services/tangoflux-integration';
import { isAuthenticated } from '../middleware/auth';
import { log } from '../utils/logging';

const router = express.Router();
const AUDIO_PUBLIC_PATH = '/audio/generated';

// Initialisieren der TangoFlux-Integration beim Start
(async () => {
  try {
    const success = await initializeTangoFluxIntegration();
    if (success) {
      log('TangoFlux-Integration erfolgreich initialisiert', 'info');
    } else {
      log('Fehler bei der Initialisierung der TangoFlux-Integration', 'error');
    }
  } catch (error) {
    log(`Unerwarteter Fehler bei der Initialisierung der TangoFlux-Integration: ${error}`, 'error');
  }
})();

/**
 * GET /api/tangoflux/status
 * Ruft den aktuellen Status der TangoFlux-Integration ab
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const tangoFluxIntegration = getTangoFluxIntegration();
    const status = tangoFluxIntegration.getStatus();
    
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des TangoFlux-Status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Fehler beim Abrufen des TangoFlux-Status',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/tangoflux/generate-prompt
 * Generiert einen optimierten Prompt basierend auf dem Basisprompt und den Parametern
 */
router.post('/generate-prompt', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const {
      basePrompt,
      targetModality,
      complexity,
      creativityLevel,
      contextElements,
      preferredStyle
    } = req.body;
    
    // Validierung
    if (!basePrompt || !targetModality) {
      return res.status(400).json({
        status: 'error',
        message: 'Basisprompt und Modalität sind erforderlich'
      });
    }
    
    // Optionen für die Prompt-Generierung
    const options: PromptGenerationOptions = {
      basePrompt,
      targetModality,
      complexity,
      creativityLevel,
      contextElements,
      preferredStyle
    };
    
    // TangoFlux-Integration aufrufen
    const tangoFluxIntegration = getTangoFluxIntegration();
    const result = await tangoFluxIntegration.generatePrompt(options);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Fehler bei der Prompt-Generierung:', error);
    res.status(500).json({
      status: 'error',
      message: 'Fehler bei der Prompt-Generierung',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/tangoflux/generate-audio
 * Generiert eine Audiodatei basierend auf dem gegebenen Prompt
 */
router.post('/generate-audio', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      duration,
      steps,
      guidanceScale
    } = req.body;
    
    // Validierung
    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt ist erforderlich'
      });
    }
    
    // Optionen für die Audio-Generierung
    const options: AudioGenerationOptions = {
      prompt,
      duration,
      steps,
      guidanceScale
    };
    
    // TangoFlux-Integration aufrufen
    const tangoFluxIntegration = getTangoFluxIntegration();
    const result = await tangoFluxIntegration.generateAudio(options);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Fehler bei der Audio-Generierung:', error);
    res.status(500).json({
      status: 'error',
      message: 'Fehler bei der Audio-Generierung',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /audio/generated/:filename
 * Stellt generierte Audiodateien zur Verfügung
 */
router.get(`${AUDIO_PUBLIC_PATH}/:filename`, async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'temp', 'tts-cache', filename);
    
    // Prüfen, ob die Datei existiert
    if (!(await fileExists(filePath))) {
      return res.status(404).json({
        status: 'error',
        message: 'Audiodatei nicht gefunden'
      });
    }
    
    // Datei streamen
    res.sendFile(filePath);
  } catch (error) {
    console.error('Fehler beim Streamen der Audiodatei:', error);
    res.status(500).json({
      status: 'error',
      message: 'Fehler beim Streamen der Audiodatei',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Hilfsfunktion zum Überprüfen, ob eine Datei existiert
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export default router;