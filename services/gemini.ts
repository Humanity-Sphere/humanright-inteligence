/**
 * Gemini API Wrapper
 * Bietet eine einfache Schnittstelle für die Kommunikation mit Gemini-Modellen
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import logger from '../utils/logger';

// Initialisiere die Google Generative AI mit dem API-Schlüssel
const apiKey = process.env.GEMINI_API_KEY || '';
export const genAI = new GoogleGenerativeAI(apiKey);

interface GeminiOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
  systemPrompt?: string;
  safetySettings?: any[];
}

/**
 * Analysiert Text mit Gemini und gibt eine Antwort zurück
 * @param text Der zu analysierende Text
 * @param options Optionen für die Gemini-API-Anfrage
 * @returns Die Antwort von Gemini
 */
export async function analyzeWithGemini(
  text: string,
  options: GeminiOptions = {}
): Promise<string> {
  try {
    // Default-Optionen setzen
    const modelName = options.model || 'gemini-1.5-pro';
    const model = genAI.getGenerativeModel({ model: modelName });

    const generationConfig = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      topK: options.topK ?? 40,
      topP: options.topP ?? 0.95,
    };

    // Safety Settings für Gemini
    const safetySettings = options.safetySettings || [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // Chat starten, wenn ein Systemprompt vorhanden ist
    let result;
    if (options.systemPrompt) {
      const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: [
          {
            role: 'user',
            parts: [{ text: options.systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'Ich verstehe und befolge diese Anweisungen.' }],
          },
        ],
      });

      result = await chat.sendMessage(text);
    } else {
      // Einfache Textgenerierung ohne Chat
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig,
        safetySettings,
      });
    }

    const response = result.response;
    return response.text();
  } catch (error) {
    logger.error('Fehler bei der Gemini API-Anfrage:', error);
    throw new Error(`Gemini API-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Analysiert ein Bild mit Gemini und gibt eine Antwort zurück
 * @param imageData Die Bilddaten (Inhalt oder URL)
 * @param prompt Der Prompttext für die Analyse
 * @param options Optionen für die Gemini-API-Anfrage
 * @returns Die Antwort von Gemini
 */
export async function analyzeImageWithGemini(
  imageData: string | Buffer,
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  try {
    // Wenn imageData eine URL ist, hole das Bild als Base64
    let imageContent: string;
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      imageContent = await fetchImageAsBase64(imageData);
    } else if (Buffer.isBuffer(imageData)) {
      imageContent = imageData.toString('base64');
    } else {
      // Wir nehmen an, dass es bereits ein Base64-String ist
      imageContent = imageData as string;
    }

    // Default-Optionen setzen 
    // Für Bildanalyse Gemini Pro Vision verwenden
    const modelName = options.model || 'gemini-1.5-pro-vision';
    const model = genAI.getGenerativeModel({ model: modelName });

    const generationConfig = {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      topK: options.topK ?? 32,
      topP: options.topP ?? 1,
    };

    // Safety Settings für Gemini
    const safetySettings = options.safetySettings || [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // Anfrage an Gemini mit Bild und Text
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: imageContent, mimeType: 'image/jpeg' } },
          ],
        },
      ],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    logger.error('Fehler bei der Gemini Bildanalyse-API-Anfrage:', error);
    throw new Error(`Gemini Bildanalyse-API-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Hilfsfunktion zum Abrufen eines Bildes von einer URL und Konvertieren in Base64
 * @param url Die URL des Bildes
 * @returns Das Bild im Base64-Format
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    logger.error('Fehler beim Abrufen des Bildes:', error);
    throw new Error(`Fehler beim Abrufen des Bildes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Gemini Service Klasse
 * Bietet eine Schnittstelle zum Gemini-Modell mit erweiterten Funktionen
 */
export class GeminiService {
  private modelName: string;
  private defaultOptions: GeminiOptions;

  constructor(options: GeminiOptions = {}) {
    this.modelName = options.model || 'gemini-1.5-pro';
    this.defaultOptions = {
      ...options,
      model: this.modelName,
    };
  }

  /**
   * Sendet eine Anfrage an Gemini
   * @param text Der zu analysierende Text
   * @param customOptions Benutzerdefinierte Optionen für diese Anfrage
   * @returns Die Antwort von Gemini
   */
  async query(text: string, customOptions: GeminiOptions = {}): Promise<string> {
    const options = {
      ...this.defaultOptions,
      ...customOptions,
    };
    return analyzeWithGemini(text, options);
  }

  /**
   * Analysiert ein Bild mit Gemini
   * @param imageData Die Bilddaten
   * @param prompt Der Prompttext für die Analyse
   * @param customOptions Benutzerdefinierte Optionen für diese Anfrage
   * @returns Die Antwort von Gemini
   */
  async analyzeImage(
    imageData: string | Buffer,
    prompt: string,
    customOptions: GeminiOptions = {}
  ): Promise<string> {
    const options = {
      ...this.defaultOptions,
      ...customOptions,
      model: customOptions.model || 'gemini-1.5-pro-vision',
    };
    return analyzeImageWithGemini(imageData, prompt, options);
  }

  /**
   * Analysiert ein Dokument mit Gemini
   * @param document Das zu analysierende Dokument
   * @param customOptions Benutzerdefinierte Optionen für diese Anfrage
   * @returns Die Antwort von Gemini
   */
  async analyzeDocument(
    document: { title: string; content: string },
    customOptions: GeminiOptions = {}
  ): Promise<string> {
    const { title, content } = document;
    const prompt = `
      Analysiere das folgende Dokument und extrahiere die wichtigsten Informationen:
      
      Titel: ${title}
      
      Inhalt:
      ${content}
      
      Bitte identifiziere:
      1. Hauptthema des Dokuments
      2. Wichtige Fakten und Informationen
      3. Beteiligte Parteien oder Personen
      4. Zeitliche Einordnung der Ereignisse
      5. Relevante rechtliche oder menschenrechtliche Aspekte
    `;
    
    return this.query(prompt, customOptions);
  }
  
  /**
   * Erkennt Muster in einem Dokument mit Gemini
   * @param document Das zu analysierende Dokument
   * @param customOptions Benutzerdefinierte Optionen für diese Anfrage
   * @returns Die Antwort von Gemini
   */
  async detectPatterns(
    document: { title: string; content: string },
    customOptions: GeminiOptions = {}
  ): Promise<string> {
    const { title, content } = document;
    const prompt = `
      Analysiere das folgende Dokument und identifiziere wiederkehrende Muster oder Zusammenhänge:
      
      Titel: ${title}
      
      Inhalt:
      ${content}
      
      Bitte identifiziere:
      1. Wiederkehrende Themen oder Konzepte
      2. Zusammenhänge zwischen verschiedenen Ereignissen
      3. Potenzielle systematische Probleme oder Herausforderungen
      4. Mögliche Ursache-Wirkungs-Beziehungen
      5. Strukturelle Muster, die auf tieferliegende Probleme hindeuten könnten
    `;
    
    return this.query(prompt, customOptions);
  }
}

export default GeminiService;