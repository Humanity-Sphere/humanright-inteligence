
import { Router } from 'express';

const router = Router();

/**
 * Gibt den Status des API-Servers zurück
 */
router.get('/status', (req, res) => {
  try {
    // Grundlegende Serverinformationen zurückgeben
    res.json({
      success: true,
      status: 'online',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      apiVersion: '1.0.0',
      services: {
        tts: {
          available: process.env.GOOGLE_AI_API_KEY ? true : false,
          provider: 'Google Cloud TTS'
        },
        authentication: {
          available: true,
          sessionActive: req.session && req.session.user ? true : false
        }
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Systemstatus:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    });
  }
});

/**
 * Registriert die System-Status-Routen
 */
export function registerSystemStatusRoutes(app: Router): void {
  app.use('/api/system', router);
  console.log('System-Status-Routen registriert');
}

export default router;
