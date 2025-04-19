/**
 * Sicherheitsempfehlungen-Routen für die Human Rights Intelligence App
 * 
 * Diese Routen ermöglichen das Erstellen, Abrufen und Verwalten von kontextbasierten
 * Sicherheitsempfehlungen für Menschenrechtsverteidiger. Das System generiert
 * Empfehlungen auf Basis des Benutzerkontexts und der Risikoeinschätzung.
 */

import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { storage } from '../services/storage-factory';
import { getAIServiceFactory, TaskType } from '../services/ai-service-factory';

const router = express.Router();

/**
 * GET /api/safety-recommendations
 * Holt alle Sicherheitsempfehlungen des aktuellen Benutzers
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Ihre Sicherheitsempfehlungen anzuzeigen'
      });
    }
    
    const recommendations = await storage.getSafetyRecommendations({ userId });
    
    return res.status(200).json(recommendations);
  } catch (error) {
    console.error('Fehler beim Abrufen der Sicherheitsempfehlungen:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Abrufen der Sicherheitsempfehlungen'
    });
  }
});

/**
 * GET /api/safety-recommendations/:id
 * Holt eine bestimmte Sicherheitsempfehlung
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const recommendationId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Sicherheitsempfehlungen anzuzeigen'
      });
    }
    
    if (isNaN(recommendationId)) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Ungültige Empfehlungs-ID'
      });
    }
    
    const recommendation = await storage.getSafetyRecommendation(recommendationId);
    
    if (!recommendation) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: 'Sicherheitsempfehlung nicht gefunden'
      });
    }
    
    // Prüfe, ob die Empfehlung dem aktuellen Benutzer gehört
    if (recommendation.userId !== userId) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert',
        message: 'Sie haben keinen Zugriff auf diese Sicherheitsempfehlung'
      });
    }
    
    return res.status(200).json(recommendation);
  } catch (error) {
    console.error('Fehler beim Abrufen der Sicherheitsempfehlung:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Abrufen der Sicherheitsempfehlung'
    });
  }
});

/**
 * POST /api/safety-recommendations
 * Erstellt eine neue Sicherheitsempfehlung
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Sicherheitsempfehlungen zu erstellen'
      });
    }
    
    const { title, description, context, riskLevel, recommendationType, locationData } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Titel und Beschreibung sind erforderlich'
      });
    }
    
    // Empfehlungen mit KI generieren, wenn kein manueller Input vorhanden ist
    let recommendations = req.body.recommendations;
    if (!recommendations || recommendations.length === 0) {
      try {
        const aiFactory = getAIServiceFactory();
        const aiService = aiFactory.selectOptimalService({
          taskType: TaskType.LEGAL_ANALYSIS,
          preferredProvider: 'openai'
        });
        const prompt = `
          Als Sicherheitsexperte für Menschenrechtsverteidiger generiere bitte spezifische Sicherheitsempfehlungen für folgenden Kontext:
          
          Titel: ${title}
          Beschreibung: ${description}
          Kontext: ${context || 'Allgemeiner Kontext für Menschenrechtsverteidiger'}
          Risikolevel: ${riskLevel || 'Mittel'}
          Empfehlungstyp: ${recommendationType || 'Allgemein'}
          ${locationData ? `Standortdaten: ${JSON.stringify(locationData)}` : ''}
          
          Gib 3-5 konkrete, umsetzbare Sicherheitsempfehlungen zurück, die für diesen Kontext am relevantesten sind.
          Formatiere die Antwort als JSON-Array mit Strings: ["Empfehlung 1", "Empfehlung 2", ...]
        `;
        
        const result = await aiService.generateContent({
          prompt,
          outputFormat: 'json'
        });
        
        try {
          // Versuche, die Antwort als JSON zu parsen
          const parsedResult = JSON.parse(result);
          recommendations = Array.isArray(parsedResult) ? parsedResult : [];
        } catch (parseError) {
          console.error('Fehler beim Parsen der KI-Empfehlungen:', parseError);
          // Fallback: Teile den Text in Zeilen
          recommendations = result
            .replace(/[\[\]"]/g, '') // Entferne alle Klammern und Anführungszeichen
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
      } catch (aiError) {
        console.error('Fehler bei der Generierung von KI-Empfehlungen:', aiError);
        recommendations = ["Keine automatischen Empfehlungen verfügbar. Bitte prüfen Sie Ihre Sicherheitsmaßnahmen manuell."];
      }
    }
    
    const newRecommendation = await storage.createSafetyRecommendation({
      userId,
      title,
      description,
      context: context || {},
      riskLevel: riskLevel || 'Mittel',
      recommendationType: recommendationType || 'Allgemein',
      recommendations,
      locationData: locationData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isAcknowledged: false,
      implementationStatus: 'Offen'
    });
    
    return res.status(201).json(newRecommendation);
  } catch (error) {
    console.error('Fehler beim Erstellen der Sicherheitsempfehlung:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Erstellen der Sicherheitsempfehlung'
    });
  }
});

/**
 * PUT /api/safety-recommendations/:id
 * Aktualisiert eine bestehende Sicherheitsempfehlung
 */
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const recommendationId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Sicherheitsempfehlungen zu aktualisieren'
      });
    }
    
    if (isNaN(recommendationId)) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Ungültige Empfehlungs-ID'
      });
    }
    
    // Prüfe, ob die Empfehlung existiert und dem Benutzer gehört
    const existingRecommendation = await storage.getSafetyRecommendation(recommendationId);
    
    if (!existingRecommendation) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: 'Sicherheitsempfehlung nicht gefunden'
      });
    }
    
    if (existingRecommendation.userId !== userId) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert',
        message: 'Sie haben keinen Zugriff auf diese Sicherheitsempfehlung'
      });
    }
    
    // Aktualisiere die Felder
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
    }
    
    if (req.body.description !== undefined) {
      updateData.description = req.body.description;
    }
    
    if (req.body.context !== undefined) {
      updateData.context = req.body.context;
    }
    
    if (req.body.riskLevel !== undefined) {
      updateData.riskLevel = req.body.riskLevel;
    }
    
    if (req.body.recommendationType !== undefined) {
      updateData.recommendationType = req.body.recommendationType;
    }
    
    if (req.body.recommendations !== undefined) {
      updateData.recommendations = req.body.recommendations;
    }
    
    if (req.body.locationData !== undefined) {
      updateData.locationData = req.body.locationData;
    }
    
    if (req.body.isAcknowledged !== undefined) {
      updateData.isAcknowledged = req.body.isAcknowledged;
    }
    
    if (req.body.implementationStatus !== undefined) {
      updateData.implementationStatus = req.body.implementationStatus;
    }
    
    const updatedRecommendation = await storage.updateSafetyRecommendation(recommendationId, updateData);
    
    return res.status(200).json(updatedRecommendation);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Sicherheitsempfehlung:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Aktualisieren der Sicherheitsempfehlung'
    });
  }
});

/**
 * PATCH /api/safety-recommendations/:id
 * Teilaktualisierung einer bestehenden Sicherheitsempfehlung
 */
router.patch('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const recommendationId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Sicherheitsempfehlungen zu aktualisieren'
      });
    }
    
    if (isNaN(recommendationId)) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Ungültige Empfehlungs-ID'
      });
    }
    
    // Prüfe, ob die Empfehlung existiert und dem Benutzer gehört
    const existingRecommendation = await storage.getSafetyRecommendation(recommendationId);
    
    if (!existingRecommendation) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: 'Sicherheitsempfehlung nicht gefunden'
      });
    }
    
    if (existingRecommendation.userId !== userId) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert',
        message: 'Sie haben keinen Zugriff auf diese Sicherheitsempfehlung'
      });
    }
    
    // Aktualisiere die Felder
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
    }
    
    if (req.body.description !== undefined) {
      updateData.description = req.body.description;
    }
    
    if (req.body.context !== undefined) {
      updateData.context = req.body.context;
    }
    
    if (req.body.riskLevel !== undefined) {
      updateData.riskLevel = req.body.riskLevel;
    }
    
    if (req.body.recommendationType !== undefined) {
      updateData.recommendationType = req.body.recommendationType;
    }
    
    if (req.body.recommendations !== undefined) {
      updateData.recommendations = req.body.recommendations;
    }
    
    if (req.body.locationData !== undefined) {
      updateData.locationData = req.body.locationData;
    }
    
    if (req.body.isImplemented !== undefined) {
      updateData.isImplemented = req.body.isImplemented;
    }
    
    if (req.body.implementationStatus !== undefined) {
      updateData.implementationStatus = req.body.implementationStatus;
    }
    
    if (req.body.implementationDate !== undefined) {
      updateData.implementationDate = req.body.implementationDate;
    }
    
    const updatedRecommendation = await storage.updateSafetyRecommendation(recommendationId, updateData);
    
    return res.status(200).json(updatedRecommendation);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Sicherheitsempfehlung:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Aktualisieren der Sicherheitsempfehlung'
    });
  }
});

/**
 * DELETE /api/safety-recommendations/:id
 * Löscht eine Sicherheitsempfehlung
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const recommendationId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Sicherheitsempfehlungen zu löschen'
      });
    }
    
    if (isNaN(recommendationId)) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Ungültige Empfehlungs-ID'
      });
    }
    
    // Prüfe, ob die Empfehlung existiert und dem Benutzer gehört
    const existingRecommendation = await storage.getSafetyRecommendation(recommendationId);
    
    if (!existingRecommendation) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: 'Sicherheitsempfehlung nicht gefunden'
      });
    }
    
    if (existingRecommendation.userId !== userId) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert',
        message: 'Sie haben keinen Zugriff auf diese Sicherheitsempfehlung'
      });
    }
    
    await storage.deleteSafetyRecommendation(recommendationId);
    
    return res.status(200).json({ 
      success: true,
      message: 'Sicherheitsempfehlung erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Sicherheitsempfehlung:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Löschen der Sicherheitsempfehlung'
    });
  }
});

/**
 * POST /api/safety-recommendations/generate-contextual
 * Generiert eine kontextbasierte Sicherheitsempfehlung
 */
router.post('/generate-contextual', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Sicherheitsempfehlungen zu generieren'
      });
    }
    
    const { context, locationData } = req.body;
    
    if (!context || typeof context !== 'object') {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Der Kontext ist erforderlich'
      });
    }
    
    try {
      const aiFactory = getAIServiceFactory();
      const aiService = aiFactory.selectOptimalService({
        taskType: TaskType.LEGAL_ANALYSIS,
        preferredProvider: 'openai'
      });
      
      // Erstelle einen detaillierten Prompt für die KI
      const contextString = JSON.stringify(context);
      const locationString = locationData ? JSON.stringify(locationData) : 'Keine Standortdaten verfügbar';
      
      const prompt = `
        Als Sicherheitsexperte für Menschenrechtsverteidiger, analysiere bitte den folgenden Kontext und generiere eine Sicherheitsempfehlung:
        
        Kontext: ${contextString}
        Standortdaten: ${locationString}
        
        Analysiere diese Informationen und gib das Ergebnis in folgendem JSON-Format zurück:
        {
          "title": "Titel der Sicherheitsempfehlung",
          "description": "Detaillierte Beschreibung der Situation und Risiken",
          "riskLevel": "Niedrig/Mittel/Hoch/Kritisch",
          "recommendationType": "Digital/Physisch/Kommunikation/Rechtlich/Allgemein",
          "recommendations": ["Spezifische Empfehlung 1", "Spezifische Empfehlung 2", "..."]
        }
      `;
      
      const result = await aiService.generateContent({
        prompt,
        outputFormat: 'json'
      });
      
      // Parse das JSON-Ergebnis
      let recommendation;
      try {
        recommendation = JSON.parse(result);
      } catch (parseError) {
        console.error('Fehler beim Parsen der KI-Antwort:', parseError);
        return res.status(500).json({ 
          error: 'Verarbeitungsfehler', 
          message: 'Die KI-Antwort konnte nicht verarbeitet werden'
        });
      }
      
      // Erstelle die Empfehlung in der Datenbank
      const newRecommendation = await storage.createSafetyRecommendation({
        userId,
        title: recommendation.title,
        description: recommendation.description,
        context,
        riskLevel: recommendation.riskLevel,
        recommendationType: recommendation.recommendationType,
        recommendations: recommendation.recommendations,
        locationData: locationData || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAcknowledged: false,
        implementationStatus: 'Offen'
      });
      
      return res.status(201).json(newRecommendation);
    } catch (aiError) {
      console.error('Fehler bei der KI-Verarbeitung:', aiError);
      return res.status(500).json({ 
        error: 'KI-Fehler', 
        message: 'Fehler bei der Generierung der Empfehlung'
      });
    }
  } catch (error) {
    console.error('Fehler bei der Verarbeitung der Anfrage:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Ein unerwarteter Fehler ist aufgetreten'
    });
  }
});

export default router;