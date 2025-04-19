/**
 * Text-to-Speech API-Routen
 * 
 * Diese Routen bieten Endpunkte für die serverseitige Sprachsynthese,
 * die als Fallback für die Web Speech API dient oder wenn höhere Qualität benötigt wird.
 */

import express, { Request, Response } from 'express';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import util from 'util';

// Router-Instanz erstellen
const router = express.Router();

// Google Cloud TTS-Client initialisieren
let ttsClient: TextToSpeechClient | null = null;
let isTtsAvailable = false;

// Initialisiere TTS-Client
async function initTtsClient() {
  try {
    // Prüfe, ob API-Key vorhanden ist
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (apiKey) {
      // In dieser Umgebung können wir die Google-Client-Bibliothek 
      // nicht direkt mit API-Keys verwenden, da sie eine Service-Account-Authentifizierung erwartet.
      // Da wir aber nur API-Keys haben, initialisieren wir den Client
      // und markieren ihn als verfügbar - wir werden die API-Aufrufe direkt
      // mit fetch/axios implementieren.
      
      ttsClient = {} as TextToSpeechClient; // Typ-Casting für Kompatibilität
      isTtsAvailable = true;
      
      console.log('[TTS] Text-to-Speech-Dienst mit API-Key-Authentifizierung initialisiert');
      
      // Wir markieren den Dienst als verfügbar, werden aber direkte REST-API-Aufrufe verwenden
      return;
    } else {
      console.warn('[TTS] Kein Google API-Key gefunden. Text-to-Speech-Funktion ist nicht verfügbar.');
      isTtsAvailable = false;
    }
  } catch (error) {
    console.error('[TTS] Fehler bei der Initialisierung des Text-to-Speech-Dienstes:', error);
    isTtsAvailable = false;
  }
}

// Initialisiere beim Serverstart
initTtsClient();

/**
 * GET /api/tts/status
 * 
 * Gibt den Status des TTS-Services zurück
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    available: isTtsAvailable,
    provider: 'google'
  });
});

/**
 * POST /api/tts/speak
 * 
 * Generiert Sprachausgabe und gibt MP3-Audio zurück
 */
router.post('/speak', async (req: Request, res: Response) => {
  try {
    if (!ttsClient || !isTtsAvailable) {
      return res.status(503).json({
        error: 'Text-to-Speech-Dienst ist nicht verfügbar'
      });
    }

    const { text, options = {} } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text ist erforderlich'
      });
    }

    // Optionen verarbeiten
    const lang = options.lang || 'de-DE';
    const voiceName = options.voice || (lang.startsWith('de') ? 'de-DE-Wavenet-F' : 'en-US-Wavenet-D');
    const rate = options.rate ? Math.max(0.25, Math.min(4.0, options.rate)) : 1.0; // Begrenzen zwischen 0.25 und 4.0
    const pitch = options.pitch ? Math.max(-20.0, Math.min(20.0, options.pitch)) : 0.0; // Begrenzen zwischen -20 und 20
    const volume = options.volume ? Math.max(-96.0, Math.min(16.0, options.volume)) : 0.0; // Begrenzen zwischen -96 und 16

    // Request an Google Cloud TTS
    const request = {
      input: { text },
      voice: {
        languageCode: lang.substring(0, 5), // Konvertiere z.B. de-DE zu de-DE
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3' as any, // Typzuweisung zur Behebung des Typfehlers
        speakingRate: rate,
        pitch: pitch,
        volumeGainDb: volume
      },
    };

    try {
      // Direkter HTTP-Aufruf der Google Cloud TTS API mit dem API-Key
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Kein API-Key verfügbar');
      }
      
      // Google Text-to-Speech REST API direkt aufrufen
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`Google TTS API Fehler: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.audioContent) {
        throw new Error('Keine Audio-Daten in der Antwort von Google TTS');
      }
      
      // Die API gibt bereits einen Base64-String zurück
      const audio = data.audioContent;
      
      // Antwort senden
      res.json({
        audio,
        format: 'mp3',
        language: lang,
        voice: voiceName
      });
    } catch (ttsError) {
      console.error('Fehler bei Google TTS:', ttsError);
      
      // Fallback auf Standard-Audio-Generator im Fehlerfall
      res.status(500).json({
        error: 'Fehler bei der Sprachgenerierung',
        details: (ttsError as Error).message
      });
    }
  } catch (error) {
    console.error('[TTS] Fehler bei der Sprachgenerierung:', error);
    res.status(500).json({
      error: 'Fehler bei der Sprachgenerierung',
      details: (error as Error).message
    });
  }
});

/**
 * GET /api/tts/voices
 * 
 * Gibt verfügbare Stimmen zurück
 */
router.get('/voices', async (req: Request, res: Response) => {
  try {
    if (!ttsClient || !isTtsAvailable) {
      return res.status(503).json({
        error: 'Text-to-Speech-Dienst ist nicht verfügbar'
      });
    }

    try {
      // API-Key abrufen
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Kein API-Key verfügbar');
      }
      
      // Google TTS API direkt aufrufen, um Stimmen abzurufen
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`Google TTS API Fehler: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.voices || result.voices.length === 0) {
        throw new Error('Keine Stimmen von der API erhalten');
      }
      
      const voices = result.voices.map((voice: { name?: string; languageCodes?: string[]; ssmlGender?: string }) => ({
        name: voice.name || '',
        languageCode: voice.languageCodes?.[0] || '',
        ssmlGender: voice.ssmlGender || 'NEUTRAL'
      }));
      
      // Bevorzugt deutsche und englische Stimmen zuerst anzeigen
      const sortedVoices = [...voices].sort((a, b) => {
        // Deutsche und englische Stimmen bevorzugen
        const isAGerman = a.languageCode.startsWith('de');
        const isBGerman = b.languageCode.startsWith('de');
        const isAEnglish = a.languageCode.startsWith('en');
        const isBEnglish = b.languageCode.startsWith('en');
        
        if (isAGerman && !isBGerman) return -1;
        if (!isAGerman && isBGerman) return 1;
        if (isAEnglish && !isBEnglish) return -1;
        if (!isAEnglish && isBEnglish) return 1;
        
        return a.name.localeCompare(b.name);
      });
      
      console.log(`[TTS] ${sortedVoices.length} Stimmen von Google TTS API abgerufen`);
      
      res.json({ voices: sortedVoices });
    } catch (voiceError) {
      console.error('[TTS] Fehler beim Abrufen der Stimmen von der API:', voiceError);
      
      // Fallback auf eine kleine Auswahl, wenn die API-Abfrage fehlschlägt
      const fallbackVoices = [
        { name: 'de-DE-Neural2-A', languageCode: 'de-DE', ssmlGender: 'FEMALE' },
        { name: 'de-DE-Neural2-B', languageCode: 'de-DE', ssmlGender: 'MALE' },
        { name: 'de-DE-Neural2-C', languageCode: 'de-DE', ssmlGender: 'FEMALE' },
        { name: 'de-DE-Neural2-D', languageCode: 'de-DE', ssmlGender: 'MALE' },
        { name: 'de-DE-Wavenet-A', languageCode: 'de-DE', ssmlGender: 'FEMALE' },
        { name: 'de-DE-Wavenet-B', languageCode: 'de-DE', ssmlGender: 'MALE' }
      ];
      
      res.json({ voices: fallbackVoices });
    }
  } catch (error) {
    console.error('[TTS] Fehler beim Abrufen der Stimmen:', error);
    res.status(500).json({
      error: 'Fehler beim Abrufen der verfügbaren Stimmen',
      details: (error as Error).message
    });
  }
});

export default router;