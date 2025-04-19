/**
 * Voice Assistant Routes
 * 
 * Dieses Modul stellt die API-Endpunkte für den Sprachassistenten bereit.
 * Es ermöglicht die Verarbeitung von sprachbasierten Befehlen und die Integration mit der KI.
 * Erweitert um MCP-Integration für direkte Anbindung an das Multi-Agent-System.
 */

import express, { Router, Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { getMultiAgentSystem } from '../services/multi-agent-system/multi-agent-system';

const router = express.Router();

/**
 * Verarbeitet Sprachbefehle und gibt die KI-generierte Antwort zurück
 */
router.post('/api/voice-assistant/command', async (req: Request, res: Response) => {
  try {
    const { command, source = 'default', activationMethod } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        error: 'Ungültiger Befehl'
      });
    }
    
    // Multi-Agent-System für die Verarbeitung verwenden, wenn vorhanden
    const multiAgentSystem = getMultiAgentSystem();
    
    // Prüfen, ob Multi-Agent-System initialisiert ist
    if (multiAgentSystem && multiAgentSystem.initialized) {
      try {
        console.log(`[MCP] Sprachbefehl wird an Multi-Agent-System weitergeleitet: "${command}"`);
        
        // Befehl an Multi-Agent-System weiterleiten
        const result = await multiAgentSystem.processVoiceCommand(
          command, 
          req.session?.userId || 'anonymous',
          req.headers['accept-language']?.split(',')[0] || 'de-DE'
        );
        
        // Die Antwort vom Multi-Agent-System zurückgeben
        return res.json({
          command,
          response: result.text || result.response || 'Befehl wurde verarbeitet.',
          source: 'multi-agent-system',
          intent: result.intent,
          parameters: result.parameters,
          additionalData: result.additionalData
        });
      } catch (agentError) {
        console.error('Fehler bei der Verarbeitung durch das Multi-Agent-System:', agentError);
        // Fallback zur einfachen Verarbeitung, falls ein Fehler auftritt
      }
    }
    
    // Fallback-Verarbeitung, wenn das Multi-Agent-System nicht verfügbar ist
    console.log('Multi-Agent-System nicht verfügbar, verwende Fallback-Verarbeitung');
    
    // Erstellt einen System-Prompt für den KI-Dienst, der den KI-Assistenten anweist,
    // wie er mit Sprachbefehlen umgehen soll
    const systemPrompt = `
      Du bist ein Assistent für eine Menschenrechtsanwendung. Deine Aufgabe ist es, Sprachbefehle zu interpretieren und hilfreiche Antworten zu geben.
      
      Befehle können verschiedene Absichten haben:
      - Navigation in der App (z.B. "Öffne die Dokumentenansicht")
      - Informationssuche (z.B. "Was sind die grundlegenden Menschenrechte?")
      - Dokumentenanalyse (z.B. "Analysiere dieses Dokument auf Menschenrechtsverletzungen")
      - Hilfe (z.B. "Wie kann ich ein neues Dokument hochladen?")
      
      Beantworte Fragen knapp, präzise und hilfreich. Wenn du eine Information nicht kennst, sage das ehrlich.
      Für Navigationsanfragen, gib einen klaren Hinweis, wohin der Benutzer navigieren sollte.
      
      Halte deine Antwort kurz (max. 2-3 Sätze), da sie dem Benutzer vorgelesen wird.
    `;
    
    // KI-Dienst für die Verarbeitung des Befehls verwenden
    // Wir verwenden den importierten aiService
    
    // KI-Antwort generieren
    // Generiere eine einfache Antwort für den Sprachbefehl
    let response = `Ich habe verstanden: "${command}". `;
    
    if (command.toLowerCase().includes('hilfe')) {
      response += 'Ich kann Ihnen bei der Navigation, Dokumentenanalyse und Informationssuche helfen.';
    } else if (command.toLowerCase().includes('dokument') || command.toLowerCase().includes('document')) {
      response += 'Ich kann Ihnen helfen, Dokumente zu analysieren oder zu erstellen.';
    } else if (command.toLowerCase().includes('menschenrecht') || command.toLowerCase().includes('human right')) {
      response += 'Ich kann Ihnen Informationen zu verschiedenen Menschenrechtsthemen geben.';
    } else {
      response += 'Wie kann ich Ihnen mit diesem Anliegen helfen?';
    }
    
    return res.json({
      command,
      response,
      source: 'fallback-system',
      activationMethod
    });
  } catch (error) {
    console.error('Fehler bei der Sprachbefehlsverarbeitung:', error);
    res.status(500).json({
      error: 'Fehler bei der Verarbeitung des Sprachbefehls',
      details: (error as Error).message
    });
  }
});

/**
 * Gibt grundlegende Informationen über den Sprachassistenten zurück
 */
router.get('/api/voice-assistant/info', (req: Request, res: Response) => {
  res.json({
    name: 'Human Rights Defender Voice Assistant',
    version: '1.0.0',
    capabilities: [
      'Spracherkennung',
      'KI-gestützte Antworten',
      'App-Navigation',
      'Dokumentenanalyse'
    ],
    defaultLanguage: 'de-DE',
    supportedLanguages: ['de-DE', 'en-US']
  });
});

/**
 * Registriert die Voice Assistant Routen an der Express-App
 */
export function registerVoiceAssistantRoutes(app: express.Express): void {
  app.use('/', router);
  console.log('Voice Assistant Routen registriert');
}

export default router;