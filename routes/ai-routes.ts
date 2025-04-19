/**
 * Zentrale KI-Service-Routen
 * 
 * Diese Routen bieten Zugriff auf KI-Funktionen wie Inhaltsgeneration, Dokumentenanalyse,
 * Brainstorming und mehr. Sie dienen als zentrale Schnittstelle für alle KI-bezogenen
 * Funktionen der Anwendung.
 */

import express, { Request, Response } from 'express';
import { getDefaultAIService } from '../services/ai-service-factory';
import { isAuthenticated } from '../middleware/auth';
import { TaskType } from '../services/ai-service-factory';
import aiCombinedRoutes from './ai-combined-routes';

const router = express.Router();

// Kombinierte Agenten-Routen einbinden
router.use(aiCombinedRoutes);

/**
 * POST /api/ai/generate-content
 * 
 * Generiert Inhalte basierend auf einem Prompt und zusätzlichen Parametern
 */
router.post('/generate-content', async (req: Request, res: Response) => {
  try {
    const { 
      prompt, 
      max_tokens, 
      temperature, 
      taskType, 
      preferLowCost, 
      outputFormat,
      documentType,
      useMenschenrechtsStandards
    } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Ein Prompt wird benötigt'
      });
    }
    
    const aiService = getDefaultAIService();
    
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'KI-Service ist nicht verfügbar'
      });
    }
    
    const result = await aiService.generateContent({
      prompt,
      max_tokens,
      temperature,
      taskType: taskType as TaskType,
      preferLowCost,
      outputFormat,
      documentType,
      useMenschenrechtsStandards
    });
    
    return res.json({
      success: true,
      content: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Inhaltsgenerierung:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/ai/analyze-document
 * 
 * Analysiert ein Dokument und extrahiert relevante Informationen
 */
router.post('/analyze-document', async (req: Request, res: Response) => {
  try {
    const { title, content, type } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Kein Dokumentinhalt übermittelt'
      });
    }
    
    // Menschenrechtsstandards laden, um Dokumenttyp zu erkennen
    let detectedType = type || 'text';
    let useStandards = false;
    
    try {
      const { getHumanRightsStandards } = require('../services/human-rights-standards');
      const standards = getHumanRightsStandards();
      const detectedDocType = standards.detectDocumentType(content);
      
      if (detectedDocType) {
        detectedType = detectedDocType;
        useStandards = true;
        console.log(`Erkannter Dokumenttyp: ${detectedType}`);
      }
    } catch (e) {
      console.warn('Dokumenttyp konnte nicht automatisch erkannt werden:', e);
    }
    
    // Analysiere das Dokument
    const document = {
      title: title || 'Unbenanntes Dokument',
      type: detectedType,
      content
    };
    
    const aiService = getDefaultAIService();
    
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'KI-Service ist nicht verfügbar'
      });
    }
    
    const analysisResult = await aiService.analyzeDocument(document);
    
    return res.json({
      success: true,
      analysis: analysisResult,
      detectedDocumentType: detectedType,
      usedStandards: useStandards,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Dokumentenanalyse:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/ai/brainstorming
 * 
 * Unterstützt bei Brainstorming zu einem bestimmten Thema
 */
router.post('/brainstorming', async (req: Request, res: Response) => {
  try {
    const { topic, context, max_ideas, temperature } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Ein Thema wird benötigt'
      });
    }
    
    const prompt = `
      ## BRAINSTORMING ZU MENSCHENRECHTSTHEMEN
      
      THEMA: ${topic}
      
      ${context ? `KONTEXT: ${context}` : ''}
      
      Bitte generiere kreative und praktische Ideen zu diesem Thema. Die Ideen sollten:
      - Innovativ und durchführbar sein
      - Auf die spezifischen Herausforderungen im Menschenrechtskontext eingehen
      - Wo möglich, auf bewährten Praktiken aufbauen
      - Verschiedene Perspektiven und Ansätze berücksichtigen
      
      Strukturiere die Antwort in klaren Kategorien und liste für jede Kategorie mehrere spezifische Ideen auf.
    `;
    
    const aiService = getDefaultAIService();
    
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'KI-Service ist nicht verfügbar'
      });
    }
    
    const result = await aiService.generateContent({
      prompt,
      max_tokens: 2048,
      temperature: temperature || 0.8,
      taskType: TaskType.BRAINSTORMING,
      outputFormat: 'markdown'
    });
    
    return res.json({
      success: true,
      ideas: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler beim Brainstorming:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/ai/help
 * 
 * Bietet Hilfe und Antworten auf Fragen
 */
router.post('/help', async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Eine Frage wird benötigt'
      });
    }
    
    const prompt = `
      ## HILFEANFRAGE
      
      FRAGE: ${question}
      
      ${context ? `KONTEXT: ${context}` : ''}
      
      Bitte beantworte diese Frage im Kontext der Menschenrechtsarbeit. 
      Gib präzise, hilfreiche Informationen und, wo angemessen, konkrete nächste Schritte.
    `;
    
    const aiService = getDefaultAIService();
    
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'KI-Service ist nicht verfügbar'
      });
    }
    
    const result = await aiService.generateContent({
      prompt,
      max_tokens: 1024,
      temperature: 0.3,
      taskType: TaskType.QUESTION_ANSWERING
    });
    
    return res.json({
      success: true,
      answer: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Hilfeanfrage:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Gibt den Status der KI-Services zurück
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Einfache Überpüfung der KI-Service-Verfügbarkeit
    const aiService = getDefaultAIService();
    
    if (!aiService) {
      return res.json({
        success: false,
        available: false,
        message: 'KI-Service ist nicht verfügbar',
        timestamp: new Date().toISOString()
      });
    }
    
    const testResponse = await aiService.generateContent({
      prompt: "Antworte mit 'verfügbar' wenn die KI funktioniert.",
      max_tokens: 20,
      temperature: 0.1
    });
    
    const isAvailable = testResponse.toLowerCase().includes('verfügbar');
    
    return res.json({
      success: true,
      available: isAvailable,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Statusabfrage:', error);
    return res.json({
      success: false,
      available: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ai/document-templates
 * 
 * Gibt verfügbare Dokumentvorlagen zurück
 */
router.get('/document-templates', async (req: Request, res: Response) => {
  try {
    const { getHumanRightsStandards } = require('../services/human-rights-standards');
    const standards = getHumanRightsStandards();
    
    const templates = standards.getAllDocumentTemplates();
    
    return res.json({
      success: true,
      templates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Dokumentvorlagen:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/ai/generate-document
 * 
 * Generiert ein Dokument basierend auf einer Vorlage
 */
router.post('/generate-document', async (req: Request, res: Response) => {
  try {
    const { documentType, additionalInfo } = req.body;
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Kein Dokumenttyp angegeben'
      });
    }
    
    const { getHumanRightsStandards } = require('../services/human-rights-standards');
    const standards = getHumanRightsStandards();
    
    // Generiere Prompt für die Dokumenterstellung
    const prompt = standards.generateCreationPrompt(documentType, additionalInfo || {});
    
    const aiService = getDefaultAIService();
    
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'KI-Service ist nicht verfügbar'
      });
    }
    
    const content = await aiService.generateContent({
      prompt,
      max_tokens: 2048,
      temperature: 0.2,
      taskType: TaskType.CREATIVE_WRITING,
      outputFormat: 'markdown',
      useMenschenrechtsStandards: true,
      documentType
    });
    
    return res.json({
      success: true,
      content,
      documentType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler bei der Dokumenterstellung:', error);
    return res.status(500).json({
      success: false,
      message: 'Ein Fehler ist bei der Verarbeitung der Anfrage aufgetreten',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;