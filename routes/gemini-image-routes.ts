/**
 * Gemini Image Generation Routes
 * 
 * API-Endpunkte für die Bildgenerierung mit der Gemini 2.0 Flash Image Generation API
 */

import { Request, Response, Router } from 'express';
import axios from 'axios';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const router = Router();

// Sicherheitseinstellungen für die Gemini-API
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * GET /api/gemini-image/status
 * Prüft, ob der Gemini Image Generation Service verfügbar ist
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Prüfe, ob der API-Key vorhanden ist
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = !!apiKey;
    
    return res.json({
      success: true,
      available: isConfigured,
      message: isConfigured 
        ? 'Gemini Image Generation ist konfiguriert.' 
        : 'Gemini Image Generation ist nicht konfiguriert. API-Key fehlt.'
    });
  } catch (error) {
    console.error('Fehler bei der Prüfung des Gemini Image Generation Status:', error);
    return res.status(500).json({
      success: false,
      available: false,
      message: 'Fehler bei der Statusprüfung.'
    });
  }
});

/**
 * POST /api/gemini-image/generate
 * Generiert ein Bild mit der Gemini 2.0 Flash Image Generation API
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, temperature = 0.7, imageSize = '1024x1024', style = 'natürlich' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Ein Prompt ist erforderlich.'
      });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API Key ist nicht konfiguriert.'
      });
    }
    
    // Modell-ID für Gemini 2.0 Flash Image Generation
    const modelId = 'gemini-2.0-flash-exp-image-generation';
    
    // Erweitere den Prompt basierend auf dem ausgewählten Stil
    let enhancedPrompt = prompt;
    if (style === 'fotorealistisch') {
      enhancedPrompt = `${prompt} Erzeuge ein fotorealistisches Bild, hyperrealistisch, 4K-Auflösung, gestochen scharf.`;
    } else if (style === 'künstlerisch') {
      enhancedPrompt = `${prompt} Erzeuge ein künstlerisches Bild im Stil eines Gemäldes, mit kräftigen Farben und sichtbaren Pinselstrichen.`;
    } else if (style === 'cartoon') {
      enhancedPrompt = `${prompt} Erzeuge ein Cartoon-Bild im Stil von modernen Animationsfilmen, mit klaren Linien und leuchtenden Farben.`;
    } else if (style === 'skizze') {
      enhancedPrompt = `${prompt} Erzeuge eine detaillierte Bleistiftskizze, mit Schattierungen und feinen Linien.`;
    }
    
    // Direkter API-Aufruf an die Gemini API
    const geminiApi = new GoogleGenerativeAI(apiKey);
    
    // API-Aufruf vorbereiten
    const model = geminiApi.getGenerativeModel({
      model: modelId,
      safetySettings
    });
    
    // Bild generieren
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: enhancedPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature
      }
    });
    
    // Antwort verarbeiten
    const response = result.response;
    
    // Prüfen, ob ein Bild generiert wurde
    let imageData = null;
    
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
          imageData = part.inlineData.data; // Base64-kodierte Bilddaten
          break;
        }
      }
    }
    
    if (!imageData) {
      return res.status(500).json({
        success: false,
        message: 'Kein Bild in der API-Antwort gefunden.'
      });
    }
    
    // Base64-String für das Frontend vorbereiten
    const imageUrl = `data:image/png;base64,${imageData}`;
    
    return res.json({
      success: true,
      imageUrl,
      prompt: enhancedPrompt,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fehler bei der Bildgenerierung:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Bildgenerierung'
    });
  }
});

/**
 * POST /api/gemini-image/variation
 * Generiert eine Variation eines bestehenden Bildes
 */
router.post('/variation', async (req: Request, res: Response) => {
  try {
    const { sourceImage, prompt, temperature = 0.7, imageSize = '1024x1024' } = req.body;
    
    if (!sourceImage) {
      return res.status(400).json({
        success: false,
        message: 'Ein Ausgangsbild ist erforderlich.'
      });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API Key ist nicht konfiguriert.'
      });
    }
    
    // Modell-ID für Gemini 2.0 Flash Image Generation
    const modelId = 'gemini-2.0-flash-exp-image-generation';
    
    // Direkter API-Aufruf an die Gemini API
    const geminiApi = new GoogleGenerativeAI(apiKey);
    
    // Extrahiere Base64-Daten aus der Data-URL
    let base64Image = sourceImage;
    if (sourceImage.startsWith('data:')) {
      base64Image = sourceImage.split(',')[1];
    }
    
    // Gemini-Modell initialisieren
    const model = geminiApi.getGenerativeModel({
      model: modelId,
      safetySettings
    });
    
    // Erstelle ein FileObject aus dem Base64-String
    const imageObject = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/png'
      }
    };
    
    // Bild mit Variation generieren
    const variationPrompt = prompt 
      ? `Erzeuge eine Variation dieses Bildes mit den folgenden Änderungen: ${prompt}` 
      : 'Erzeuge eine Variation dieses Bildes mit leicht veränderten Details und Stil.';
    
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: variationPrompt },
            imageObject
          ]
        }
      ],
      generationConfig: {
        temperature: temperature
      }
    });
    
    // Antwort verarbeiten
    const response = result.response;
    
    // Prüfen, ob ein Bild generiert wurde
    let imageData = null;
    
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
          imageData = part.inlineData.data; // Base64-kodierte Bilddaten
          break;
        }
      }
    }
    
    if (!imageData) {
      return res.status(500).json({
        success: false,
        message: 'Kein Bild in der API-Antwort gefunden.'
      });
    }
    
    // Base64-String für das Frontend vorbereiten
    const imageUrl = `data:image/png;base64,${imageData}`;
    
    return res.json({
      success: true,
      imageUrl,
      prompt: variationPrompt,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fehler bei der Generierung einer Bildvariation:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Generierung einer Bildvariation'
    });
  }
});

export default router;