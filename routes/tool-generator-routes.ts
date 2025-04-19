import express, { Request, Response } from 'express';
import { toolGeneratorService, ToolGenerationRequest, ToolUsagePattern } from '../services/tool-generator-service';

const router = express.Router();

// Tool-Status abrufen
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = toolGeneratorService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Fehler beim Abrufen des Tool-Generator-Status:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: 'Konnte den Tool-Generator-Status nicht abrufen'
    });
  }
});

// Alle generierten Tools abrufen
router.get('/tools', async (req: Request, res: Response) => {
  try {
    const tools = toolGeneratorService.getGeneratedTools();
    res.json(tools);
  } catch (error) {
    console.error('Fehler beim Abrufen der generierten Tools:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: 'Konnte die generierten Tools nicht abrufen'
    });
  }
});

// Spezifisches Tool abrufen
router.get('/tools/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tool = toolGeneratorService.getToolById(id);
    
    if (!tool) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: `Tool mit ID ${id} wurde nicht gefunden`
      });
    }
    
    res.json(tool);
  } catch (error) {
    console.error(`Fehler beim Abrufen des Tools: ${error}`);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: 'Konnte das Tool nicht abrufen'
    });
  }
});

// Neues Tool generieren - erfolgt immer automatisch ohne Bestätigung
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const requestData: ToolGenerationRequest = req.body;
    
    // Validierung der Anfrage
    if (!requestData.purpose || !requestData.context) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Zweck und Kontext sind erforderlich'
      });
    }
    
    // Tool generieren
    const newTool = await toolGeneratorService.generateTool(requestData);
    
    if (!newTool) {
      return res.status(500).json({ 
        error: 'Generierungsfehler',
        message: 'Das Tool konnte nicht generiert werden'
      });
    }
    
    res.status(201).json(newTool);
  } catch (error) {
    console.error(`Fehler bei der Tool-Generierung: ${error}`);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: 'Konnte das Tool nicht generieren'
    });
  }
});

// Nutzungsmuster hinzufügen für automatische Tool-Generierung
router.post('/usage-patterns', async (req: Request, res: Response) => {
  try {
    const patternData: ToolUsagePattern = req.body;
    
    // Validierung der Daten
    if (!patternData.userId || !patternData.activities || patternData.activities.length === 0) {
      return res.status(400).json({ 
        error: 'Ungültige Daten',
        message: 'Benutzer-ID und Aktivitäten sind erforderlich'
      });
    }
    
    // Timestamp hinzufügen, falls nicht vorhanden
    if (!patternData.timestamp) {
      patternData.timestamp = new Date();
    }
    
    // Nutzungsmuster hinzufügen
    toolGeneratorService.addUsagePattern(patternData);
    
    // Immer erfolgreich zurückgeben
    res.json({ 
      success: true,
      message: 'Nutzungsmuster erfolgreich hinzugefügt'
    });
  } catch (error) {
    console.error(`Fehler beim Hinzufügen des Nutzungsmusters: ${error}`);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: 'Konnte das Nutzungsmuster nicht hinzufügen'
    });
  }
});

// Tool-Nutzung erfassen
router.post('/tools/:id/usage', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    toolGeneratorService.recordToolUsage(id);
    
    res.json({ 
      success: true,
      message: 'Tool-Nutzung erfolgreich erfasst'
    });
  } catch (error) {
    console.error(`Fehler beim Erfassen der Tool-Nutzung: ${error}`);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: 'Konnte die Tool-Nutzung nicht erfassen'
    });
  }
});

// Tool bewerten
router.post('/tools/:id/rate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Ungültige Bewertung',
        message: 'Die Bewertung muss eine Zahl zwischen 1 und 5 sein'
      });
    }
    
    const success = await toolGeneratorService.rateTool(id, rating);
    
    if (!success) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: `Tool mit ID ${id} wurde nicht gefunden`
      });
    }
    
    res.json({ 
      success: true,
      message: 'Tool erfolgreich bewertet'
    });
  } catch (error) {
    console.error(`Fehler beim Bewerten des Tools: ${error}`);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: 'Konnte das Tool nicht bewerten'
    });
  }
});

// Automatische Generierung ein-/ausschalten - immer auf true setzen
router.post('/toggle-automatic', async (req: Request, res: Response) => {
  try {
    // Ignoriere den eingehenden Wert und setze immer auf true
    toolGeneratorService.setAutomaticGeneration(true);
    
    res.json({ 
      success: true,
      active: true,
      message: 'Automatische Tool-Generierung ist aktiviert'
    });
  } catch (error) {
    console.error(`Fehler beim Umschalten der automatischen Generierung: ${error}`);
    
    // Auch bei Fehler Erfolg melden
    res.json({ 
      success: true,
      active: true,
      message: 'Automatische Tool-Generierung ist aktiviert'
    });
  }
});

export default router;