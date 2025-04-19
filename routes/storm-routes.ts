/**
 * STORM Routes - API-Endpunkte für synthetische Konversationsdaten
 */

import { Router } from 'express';
import StormService, { getMockConversationData } from '../services/storm-service';
import StormAdapter from '../services/storm-service/adapter';
// Import Hilfsfunktion für den AI-Service
import { aiService } from '../services/aiService';
import { storage } from '../storage';

// Router erstellen
const router = Router();

// STORM-Service initialisieren (mit Mock-Storage für bessere Kompatibilität)
const stormService = new StormService(storage as any);

// Adapter mit dem KI-Service verbinden (mit Cast für bessere Kompatibilität)
const stormAdapter = new StormAdapter(stormService, aiService as any);

// Statusendpunkt - prüft, ob der STORM-Service verfügbar ist
router.get('/status', async (req, res) => {
  try {
    const initialized = await stormService.initialize();
    
    res.json({
      available: initialized,
      status: initialized ? 'ready' : 'unavailable',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des STORM-Status:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler bei der Überprüfung des STORM-Status'
    });
  }
});

// Endpunkt zur Generierung synthetischer Konversationsdaten
router.post('/generate-conversation', async (req, res) => {
  try {
    const { 
      topic, 
      numTurns = 10, 
      numPersonas = 2, 
      language = 'de',
      perspectives = [],
      useRealData = false
    } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Thema (topic) ist erforderlich'
      });
    }
    
    // Werte validieren
    if (numTurns < 2 || numTurns > 30) {
      return res.status(400).json({
        success: false,
        error: 'Anzahl der Gesprächsrunden (numTurns) muss zwischen 2 und 30 liegen'
      });
    }
    
    if (numPersonas < 2 || numPersonas > 5) {
      return res.status(400).json({
        success: false,
        error: 'Anzahl der Personas (numPersonas) muss zwischen 2 und 5 liegen'
      });
    }
    
    // Wenn useRealData false ist oder der Service nicht initialisiert werden konnte,
    // verwende Mock-Daten
    let result;
    
    if (!useRealData) {
      result = getMockConversationData(topic, numTurns);
    } else {
      // Versuche, echte Daten zu generieren
      try {
        result = await stormAdapter.generateSyntheticConversation({
          topic,
          numTurns,
          numPersonas,
          language,
          perspectives,
          useRealData
        });
      } catch (error) {
        console.error('Fehler bei der Erzeugung synthetischer Konversationsdaten:', error);
        
        // Bei einem Fehler zurückfallen auf Mock-Daten
        result = getMockConversationData(topic, numTurns);
      }
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Fehler beim Generieren von Konversationsdaten:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler bei der Konversationsgenerierung'
    });
  }
});

// Endpunkt zum Abrufen aller Konversationen
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await stormService.getAllConversations();
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Konversationen:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler beim Abrufen der Konversationen'
    });
  }
});

// Endpunkt zum Abrufen einer bestimmten Konversation
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await stormService.getConversationById(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: `Konversation mit ID ${id} nicht gefunden`
      });
    }
    
    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error(`Fehler beim Abrufen der Konversation mit ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler beim Abrufen der Konversation'
    });
  }
});

// Endpunkt zur Analyse einer Konversation
router.post('/analyze-conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prüfen, ob die Konversation existiert
    const conversation = await stormService.getConversationById(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: `Konversation mit ID ${id} nicht gefunden`
      });
    }
    
    // Konversation analysieren
    const analysis = await stormAdapter.analyzeConversation(id);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error(`Fehler bei der Analyse der Konversation mit ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler bei der Konversationsanalyse'
    });
  }
});

// Endpunkt zur Extraktion von Trainingsmustern aus mehreren Konversationen
router.post('/extract-patterns', async (req, res) => {
  try {
    const { conversationIds } = req.body;
    
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Eine Liste von Konversations-IDs ist erforderlich'
      });
    }
    
    // Muster aus den Konversationen extrahieren
    const patterns = await stormAdapter.extractTrainingPatterns(conversationIds);
    
    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Fehler bei der Extraktion von Trainingsmustern:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler bei der Musterextraktion'
    });
  }
});

// Endpunkt zum Erstellen eines Trainingsdatensatzes
router.post('/create-dataset', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      topics, 
      conversationsPerTopic = 3 
    } = req.body;
    
    if (!name || !description || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, Beschreibung und eine Liste von Themen sind erforderlich'
      });
    }
    
    // Trainingsdatensatz erstellen
    const dataset = await stormAdapter.createTrainingDataset(
      name,
      description,
      topics,
      conversationsPerTopic
    );
    
    res.json({
      success: true,
      data: dataset
    });
  } catch (error) {
    console.error('Fehler beim Erstellen eines Trainingsdatensatzes:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler beim Erstellen des Trainingsdatensatzes'
    });
  }
});

// Generiert ein Beispiel-Python-Skript
router.get('/generate-example-script', async (req, res) => {
  try {
    const scriptPath = await stormService.generateExampleScript();
    
    res.json({
      success: true,
      data: {
        scriptPath,
        message: 'Beispiel-Skript erfolgreich generiert'
      }
    });
  } catch (error) {
    console.error('Fehler beim Generieren des Beispiel-Skripts:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler beim Generieren des Beispiel-Skripts'
    });
  }
});

export default router;