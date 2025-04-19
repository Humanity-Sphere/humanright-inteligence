/**
 * NLU (Natural Language Understanding) API-Routen
 * 
 * Diese Routen stellen Endpunkte für die Verarbeitung natürlicher Sprache bereit.
 * Sie ermöglichen die Analyse von Texteingaben, Intent-Erkennung und Entity-Extraktion.
 */

import express from 'express';
import { getNLUService } from '../services/nlu-service';

const router = express.Router();
const nluService = getNLUService();

/**
 * Analysiert einen Text und extrahiert Intents und Entities
 * 
 * @route POST /api/nlu/analyze
 * @param {string} text - Der zu analysierende Text
 * @param {object} context - Optionaler Kontext (UI-Zustand, Session, etc.)
 * @returns {object} NLUResult-Objekt mit erkannten Intents und Entities
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text, context } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Es wurde kein Text übermittelt'
      });
    }
    
    // Analysiere den Text
    const result = await nluService.analyzeText(text, context);
    
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('[NLU API] Fehler bei der Textanalyse:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler bei der Verarbeitung der Anfrage'
    });
  }
});

/**
 * Liefert Informationen über die aktuelle NLU-Konfiguration
 * 
 * @route GET /api/nlu/info
 * @returns {object} Informationen über die NLU-Konfiguration
 */
router.get('/info', (req, res) => {
  try {
    // Hier könnte man mehr Informationen bereitstellen, wenn der NLUService
    // entsprechende Methoden anbietet
    return res.json({
      success: true,
      info: {
        service: 'NLU Service',
        status: 'active',
        strategy: 'hybrid', // Diese Information müsste eigentlich aus dem Service kommen
        availableStrategies: ['rule-based', 'ml-based', 'llm-based', 'hybrid']
      }
    });
  } catch (error) {
    console.error('[NLU API] Fehler beim Abrufen der NLU-Informationen:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler bei der Verarbeitung der Anfrage'
    });
  }
});

/**
 * Testet die Aktivierung einer bestimmten Strategie (Rule-based, ML, LLM, hybrid)
 * Nützlich für Evaluierung und Vergleich verschiedener Strategien
 * 
 * @route POST /api/nlu/test-strategy
 * @param {string} text - Der zu analysierende Text
 * @param {string} strategy - Die zu testende Strategie
 * @param {object} context - Optionaler Kontext
 * @returns {object} Analyseergebnis mit der angegebenen Strategie
 */
router.post('/test-strategy', async (req, res) => {
  try {
    const { text, strategy, context } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Es wurde kein Text übermittelt'
      });
    }
    
    if (!strategy || !['rule-based', 'ml-based', 'llm-based', 'hybrid'].includes(strategy)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige oder fehlende Strategie'
      });
    }
    
    // Erstelle eine temporäre Instanz mit der angegebenen Strategie
    // Dies ist nicht ideal, da es die Konfiguration nicht persistent ändert
    // und nur für Tests gedacht ist
    const tempService = getNLUService({
      strategy: strategy as 'rule-based' | 'ml-based' | 'llm-based' | 'hybrid',
      language: 'de-DE'
    });
    
    // Analysiere den Text mit der temporären Instanz
    const result = await tempService.analyzeText(text, context);
    
    return res.json({
      success: true,
      strategy,
      result
    });
  } catch (error) {
    console.error('[NLU API] Fehler beim Testen der Strategie:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler bei der Verarbeitung der Anfrage'
    });
  }
});

export default router;