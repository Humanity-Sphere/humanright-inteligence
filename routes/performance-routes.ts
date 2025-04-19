/**
 * Performance-Optimierungs-Routen
 * 
 * API-Endpunkte für das KI-gestützte Performance-Optimierungssystem
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { performanceOptimizer, OptimizationSuggestion } from '../services/performance-optimizer';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

/**
 * Gibt den aktuellen Status des Performance-Optimizers zurück
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    const latestMetrics = performanceOptimizer.getLatestMetrics();
    const activeSuggestions = performanceOptimizer.getActiveSuggestions();
    
    res.json({
      status: 'active',
      metricsCollected: {
        system: !!latestMetrics.system,
        database: !!latestMetrics.database,
        api: !!latestMetrics.api
      },
      activeSuggestions: activeSuggestions.length,
      pendingAnalysis: activeSuggestions.filter(s => !s.aiGenerated).length
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Performance-Optimizer-Status:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Gibt die aktuellen Leistungsmetriken zurück
 */
router.get('/metrics', isAuthenticated, (req: Request, res: Response) => {
  try {
    const metrics = performanceOptimizer.getLatestMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Fehler beim Abrufen der Leistungsmetriken:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Gibt alle Optimierungsvorschläge zurück
 */
router.get('/suggestions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const suggestions = await performanceOptimizer.loadSuggestions();
    
    // Filter basierend auf Abfrageparametern
    const area = req.query.area as string | undefined;
    const status = req.query.status as string | undefined;
    
    let filteredSuggestions = suggestions;
    
    if (area) {
      filteredSuggestions = filteredSuggestions.filter(s => s.area === area);
    }
    
    if (status) {
      switch (status) {
        case 'active':
          filteredSuggestions = filteredSuggestions.filter(s => !s.implementedAt && !s.dismissed);
          break;
        case 'implemented':
          filteredSuggestions = filteredSuggestions.filter(s => !!s.implementedAt);
          break;
        case 'dismissed':
          filteredSuggestions = filteredSuggestions.filter(s => !!s.dismissed);
          break;
      }
    }
    
    res.json(filteredSuggestions);
  } catch (error) {
    console.error('Fehler beim Abrufen der Optimierungsvorschläge:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Gibt einen einzelnen Optimierungsvorschlag zurück
 */
router.get('/suggestions/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const suggestions = await performanceOptimizer.loadSuggestions();
    const suggestion = suggestions.find(s => s.id === id);
    
    if (!suggestion) {
      return res.status(404).json({ error: 'Optimierungsvorschlag nicht gefunden' });
    }
    
    res.json(suggestion);
  } catch (error) {
    console.error('Fehler beim Abrufen des Optimierungsvorschlags:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Markiert einen Optimierungsvorschlag als implementiert
 */
router.post('/suggestions/:id/implement', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await performanceOptimizer.implementSuggestion(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Optimierungsvorschlag nicht gefunden' });
    }
    
    res.json({ success: true, message: 'Optimierungsvorschlag als implementiert markiert' });
  } catch (error) {
    console.error('Fehler beim Implementieren des Optimierungsvorschlags:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Verwirft einen Optimierungsvorschlag
 */
router.post('/suggestions/:id/dismiss', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await performanceOptimizer.dismissSuggestion(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Optimierungsvorschlag nicht gefunden' });
    }
    
    res.json({ success: true, message: 'Optimierungsvorschlag verworfen' });
  } catch (error) {
    console.error('Fehler beim Verwerfen des Optimierungsvorschlags:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Erstellt manuell einen neuen Optimierungsvorschlag (für Testzwecke)
 */
router.post('/suggestions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { area, priority, title, description, suggestedActions } = req.body;
    
    if (!area || !priority || !title) {
      return res.status(400).json({ error: 'Fehlende erforderliche Felder' });
    }
    
    // Erstelle einen neuen Vorschlag
    const newSuggestion: OptimizationSuggestion = {
      id: uuidv4(),
      area,
      priority,
      title,
      description: description || 'Manuell erstellter Vorschlag',
      potentialImpact: 'Manuell festgelegt',
      implementationComplexity: 'mittel',
      suggestedActions: suggestedActions || ['Manuelle Aktion'],
      createdAt: new Date(),
      aiGenerated: false
    };
    
    // In der Realität würde hier der Vorschlag in der Datenbank gespeichert
    // Für dieses Beispiel simulieren wir die Speicherung
    
    res.status(201).json({ 
      success: true, 
      message: 'Optimierungsvorschlag erstellt',
      suggestion: newSuggestion
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Optimierungsvorschlags:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * Löst eine manuelle Analyse der Systemleistung aus
 */
router.post('/analyze', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // In einer realen Anwendung würde hier eine umfassende Analyse gestartet
    // Für dieses Beispiel simulieren wir den Start der Analyse
    
    setTimeout(() => {
      // Performance-Optimizer würde normalerweise Optimierungsvorschläge erstellen
      console.log('[PerformanceRoutes] Manuelle Analyse gestartet');
    }, 100);
    
    res.json({ 
      success: true, 
      message: 'Leistungsanalyse gestartet. Ergebnisse werden in Kürze verfügbar sein.'
    });
  } catch (error) {
    console.error('Fehler beim Starten der Leistungsanalyse:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

export default router;