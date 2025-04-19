import { Express, Request, Response } from 'express';
import { createAIService, IAIService } from '../../ai-service-original';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Speicher für aktive Sitzungen
interface CodeSnippet {
  language: string;
  code: string;
  purpose: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface InteractiveSession {
  sessionId: string;
  messages: Message[];
  codeSnippets: CodeSnippet[];
  topic: string;
  context?: any;
  isActive: boolean;
  lastUpdated: Date;
  userId?: number;
}

// In-Memory-Speicher für Sitzungen
const activeSessions: Record<string, InteractiveSession> = {};

// KI-Dienst für Code-Generierung
let aiService: IAIService;

export function registerInteractiveStudioRoutes(app: Express): void {
  // KI-Dienst initialisieren
  // Umgebungsvariablen laden
  dotenv.config();
  
  aiService = createAIService({
    provider: 'gemini',
    apiKey: process.env.RIGHTDOCS_API_KEY || '',
    model: 'gemini-1.5-flash'
  });

  // Neue interaktive Sitzung initialisieren
  app.post('/api/interactive-studio/initialize', async (req: Request, res: Response) => {
    try {
      const { topic, context, sessionId } = req.body;
      
      // Sitzung erstellen oder vorhandene abrufen
      let session = activeSessions[sessionId];
      
      if (!session) {
        session = {
          sessionId,
          messages: [],
          codeSnippets: [],
          topic: topic || 'Interaktive Sitzung',
          context,
          isActive: true,
          lastUpdated: new Date(),
          userId: req.session?.userId
        };
        
        activeSessions[sessionId] = session;
      }
      
      // Wenn Kontext vorhanden, initiale Vorschläge generieren
      let suggestions = null;
      
      if (context) {
        // Systemkontext vorbereiten
        const systemPrompt = `Du bist ein KI-Assistenz-System, das einem Menschenrechtsverteidiger bei der Erstellung von Code und Visualisierungen hilft.
Kontext: ${topic || 'Allgemeine Brainstorming-Sitzung'}
Art des Inhalts: ${context.type || 'Nicht spezifiziert'}

Basierend auf diesem Kontext, schlage einen Startpunkt für ein Brainstorming vor, der zur Generierung von Code für eine Visualisierung oder Präsentation führen könnte.
Deine Antwort sollte eine freundliche Nachricht und initiale Vorschläge enthalten.`;
        
        const initialContent = await aiService.generateContent({
          prompt: systemPrompt,
          max_tokens: 1000,
          temperature: 0.7
        });
        
        // Antwort extrahieren und formatieren
        suggestions = {
          message: initialContent,
          codeSnippets: [] // Initial noch keine Code-Snippets
        };
        
        // Sitzungsnachricht hinzufügen
        session.messages.push({ role: 'assistant', content: initialContent });
      }
      
      res.status(200).json({ 
        success: true, 
        sessionId, 
        suggestions
      });
    } catch (error) {
      console.error('Fehler bei der Initialisierung der interaktiven Sitzung:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Fehler bei der Initialisierung der Sitzung'
      });
    }
  });
  
  // Nachricht in einer interaktiven Sitzung verarbeiten
  app.post('/api/interactive-studio/message', async (req: Request, res: Response) => {
    try {
      const { sessionId, message, history } = req.body;
      
      // Sitzung abrufen
      const session = activeSessions[sessionId];
      
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Sitzung nicht gefunden' 
        });
      }
      
      // Prüfen, ob die Sitzung noch aktiv ist
      if (!session.isActive) {
        return res.status(400).json({ 
          success: false, 
          error: 'Diese Sitzung wurde bereits beendet' 
        });
      }
      
      // Konversationsverlauf vorbereiten
      const conversationHistory = history || session.messages;
      
      // Code-Schnipsel erkennen
      const isCodeGenerationRequest = 
        message.toLowerCase().includes('code') || 
        message.toLowerCase().includes('visualisierung') ||
        message.toLowerCase().includes('dashboard') ||
        message.toLowerCase().includes('karte') ||
        message.toLowerCase().includes('präsentation') ||
        message.toLowerCase().includes('generiere') ||
        message.toLowerCase().includes('erstelle');
      
      // System-Prompt basierend auf der Anfrage zusammenstellen
      let systemPrompt = `Du bist ein KI-Assistenz-System, das einem Menschenrechtsverteidiger bei der Erstellung von Code und Visualisierungen hilft.
Kontext: ${session.topic}`;

      if (isCodeGenerationRequest) {
        systemPrompt += `
Du sollst qualitativ hochwertigen Code generieren, der die Anforderungen des Nutzers erfüllt.

Wenn du Code erzeugst:
1. Verwende Markdown-Codeblöcke mit der entsprechenden Sprachkennung (z.B. \`\`\`html, \`\`\`javascript).
2. Kommentiere den Code ausführlich, um die Funktionsweise zu erklären.
3. Achte auf Best Practices und Sicherheitsaspekte.
4. Sende immer vollständigen, lauffähigen Code.

Achte besonders auf die Anforderungen zum Thema Menschenrechte und liefere passende Visualisierungen.`;
      }
      
      // Anfrage an die KI senden
      const aiResponse = await aiService.generateContent({
        prompt: `${systemPrompt}\n\n${conversationHistory.map((msg: Message) => `${msg.role}: ${msg.content}`).join('\n')}\nuser: ${message}\nassistant:`,
        max_tokens: 2000,
        temperature: 0.7
      });
      
      // Antwort für den Nutzer extrahieren
      let replyMessage = aiResponse;
      let codeSnippets: CodeSnippet[] = [];
      
      // Wenn Code-Anfrage, Code extrahieren
      if (isCodeGenerationRequest) {
        codeSnippets = extractCodeSnippets(aiResponse);
      }
      
      // Nachrichten und Code-Schnipsel zur Sitzung hinzufügen
      session.messages.push({ role: 'user', content: message });
      session.messages.push({ role: 'assistant', content: replyMessage });
      session.lastUpdated = new Date();
      
      if (codeSnippets.length > 0) {
        session.codeSnippets.push(...codeSnippets);
      }
      
      res.status(200).json({
        success: true,
        message: replyMessage,
        codeSnippets
      });
    } catch (error) {
      console.error('Fehler bei der Verarbeitung der Nachricht:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler bei der Verarbeitung der Nachricht'
      });
    }
  });
  
  // Sitzung speichern
  app.post('/api/interactive-studio/save', (req: Request, res: Response) => {
    try {
      const { sessionState } = req.body;
      
      // Sitzungsdaten validieren
      if (!sessionState || !sessionState.sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Ungültige Sitzungsdaten'
        });
      }
      
      // Sitzung im Memory-Storage aktualisieren
      activeSessions[sessionState.sessionId] = {
        ...sessionState,
        userId: req.session?.userId || sessionState.userId,
        lastUpdated: new Date()
      };
      
      // TODO: Persistieren in der Datenbank
      
      res.status(200).json({
        success: true,
        message: 'Sitzung erfolgreich gespeichert'
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Sitzung:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Speichern der Sitzung'
      });
    }
  });
  
  // Sitzung beenden
  app.post('/api/interactive-studio/end', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      
      // Sitzung abrufen
      const session = activeSessions[sessionId];
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Sitzung nicht gefunden'
        });
      }
      
      // Sitzung als inaktiv markieren
      session.isActive = false;
      
      res.status(200).json({
        success: true,
        message: 'Sitzung erfolgreich beendet'
      });
    } catch (error) {
      console.error('Fehler beim Beenden der Sitzung:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Beenden der Sitzung'
      });
    }
  });
  
  // Live-Stream-Endpunkt für interaktive Brainstorming-Sessions
  app.get('/api/interactive-studio/stream', async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string;
      const message = req.query.message as string;
      
      if (!sessionId || !message) {
        return res.status(400).json({
          success: false,
          error: 'Session-ID und Nachricht sind erforderlich'
        });
      }
      
      // Sitzung abrufen
      const session = activeSessions[sessionId];
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Sitzung nicht gefunden'
        });
      }
      
      // SSE-Header konfigurieren
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Gemini-Modell für Streaming initialisieren
      // Wir nutzen hier den RIGHTDOCS_API_KEY (als Ersatz, falls GEMINI_API_KEY nicht konfiguriert ist)
      const geminiApiKey = process.env.RIGHTDOCS_API_KEY || '';
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const streamingModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      });
      
      // System-Prompt für Live-Modus
      const systemPrompt = `Du bist ein interaktiver KI-Partner für Brainstorming und Ideenentwicklung, spezialisiert auf Menschenrechtsthemen. 
Du arbeitest im Live-Modus, bei dem du dem Benutzer hilfst, Ideen zu erkunden und zu entwickeln. 
Beschränke deine Antworten auf 2-3 kurze Absätze, um einen kontinuierlichen Dialog zu erhalten.

WICHTIGE RICHTLINIEN:
- Sei konstruktiv und hilfsbereit, mit Fokus auf kreative Lösungsvorschläge.
- Versuche zu verstehen, was der Benutzer erreichen möchte, und gib konkrete Beispiele oder Vorschläge.
- Wenn die Anfrage mit Code zusammenhängt, generiere prägnante Code-Snippets.
- Du darfst gelegentlich Fragen stellen, um den Gedankengang des Benutzers zu vertiefen.
- Du bist auf Menschenrechtsverteidiger ausgerichtet und kennst dich mit UN-Menschenrechtsmechanismen aus.
- Nutze einen konstruktiven, aber direkten und präzisen Kommunikationsstil.

Aktueller Kontext:
Thema: ${session.topic}
Verlauf: ${JSON.stringify(session.messages.slice(-3))}
`;

      // Konversationskontext aufbauen
      const chatHistory: string[] = [];
      session.messages.slice(-4).forEach(msg => {
        chatHistory.push(msg.role === 'user' ? msg.content : msg.content);
      });
      
      // Code-Extraktion für die Antwort aktivieren
      const codeRegex = /```([a-zA-Z0-9]+)?\s*([\s\S]*?)```/g;
      let fullResponse = '';
      let match;
      
      // Stream initiieren
      const result = await streamingModel.generateContentStream([
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Ich verstehe. Ich werde dir im Live-Modus als Brainstorming-Partner helfen.' }] },
        { role: 'user', parts: [{ text: message }] }
      ]);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        
        // Chunk als Event senden
        res.write(`event: chunk\ndata: ${chunkText}\n\n`);
        
        fullResponse += chunkText;
        
        // Bei jeder Aktualisierung nach Code-Snippets suchen
        while ((match = codeRegex.exec(fullResponse)) !== null) {
          const language = match[1] || 'text';
          const code = match[2];
          
          // Code als separates Event senden
          const codeSnippet = {
            language: language.toLowerCase(),
            code: code,
            purpose: 'Generiert während Live-Brainstorming'
          };
          
          res.write(`event: code\ndata: ${JSON.stringify(codeSnippet)}\n\n`);
          
          // Code zur Sitzung hinzufügen
          session.codeSnippets.push(codeSnippet);
          
          // Von der Vollständigen Antwort entfernen, um doppelte Extraktion zu vermeiden
          fullResponse = fullResponse.replace(match[0], '');
          codeRegex.lastIndex = 0;
        }
      }
      
      // Fertige Nachricht zur Sitzung hinzufügen
      session.messages.push({
        role: 'user',
        content: message
      });
      
      session.messages.push({
        role: 'assistant',
        content: fullResponse
      });
      
      // Vollständige Antwort speichern und Session-Update
      session.lastUpdated = new Date();
      
      // End-Event senden
      res.write('event: end\ndata: complete\n\n');
      res.end();
      
    } catch (error) {
      console.error('Fehler beim Streaming:', error);
      
      // Fehler-Event senden, falls die Verbindung noch offen ist
      try {
        res.write(`event: error\ndata: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\n`);
        res.end();
      } catch (err) {
        console.error('Fehler beim Senden des Fehler-Events:', err);
      }
    }
  });

  // Code exportieren
  app.post('/api/interactive-studio/export', (req: Request, res: Response) => {
    try {
      const { sessionId, format, codeSnippets } = req.body;
      
      if (!codeSnippets || codeSnippets.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Keine Code-Snippets zum Exportieren vorhanden'
        });
      }
      
      // Temporäres Verzeichnis für Exporte
      const tempDir = path.join(__dirname, '../../temp');
      
      // Sicherstellen, dass das Verzeichnis existiert
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Dateinamen generieren
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `export-${sessionId.substring(0, 8)}-${timestamp}.${format}`;
      const filePath = path.join(tempDir, filename);
      
      // Code basierend auf Format exportieren
      let fileContent = '';
      
      switch (format) {
        case 'html':
          fileContent = generateHtmlExport(codeSnippets);
          break;
        case 'js':
          fileContent = generateJsExport(codeSnippets);
          break;
        case 'py':
          fileContent = generatePyExport(codeSnippets);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Nicht unterstütztes Exportformat'
          });
      }
      
      // Datei schreiben
      fs.writeFileSync(filePath, fileContent);
      
      // URL für den Download generieren (in der echten Implementierung würde ein sicherer Download-Link generiert)
      const downloadUrl = `/download/${filename}`;
      
      res.status(200).json({
        success: true,
        downloadUrl,
        filename
      });
    } catch (error) {
      console.error('Fehler beim Exportieren des Codes:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Exportieren des Codes'
      });
    }
  });
  
  // Hilfsfunktion zum Extrahieren von Code-Snippets aus einer AI-Antwort
  function extractCodeSnippets(aiResponse: string): CodeSnippet[] {
    const codeSnippets: CodeSnippet[] = [];
    
    // Regex für Code-Blöcke: ```[Sprache]\n[Code]\n```
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
      const language = match[1].toLowerCase() || 'text';
      const code = match[2].trim();
      
      // Code-Zweck ableiten (einfache Heuristik)
      let purpose = 'Generierter Code';
      
      // Typische Code-Muster erkennen
      if (language === 'html' && code.includes('<html>')) {
        purpose = 'HTML-Dokument';
      } else if (language === 'javascript' && code.includes('chart') || code.includes('plot')) {
        purpose = 'Datenvisualisierung';
      } else if (language === 'python' && (code.includes('matplotlib') || code.includes('seaborn'))) {
        purpose = 'Python-Visualisierung';
      } else if (code.includes('map') || code.includes('geojson')) {
        purpose = 'Kartenvisualisierung';
      } else if (code.includes('reveal.js') || code.includes('slide')) {
        purpose = 'Präsentation';
      }
      
      // Code-Snippet zur Liste hinzufügen
      codeSnippets.push({
        language,
        code,
        purpose
      });
    }
    
    return codeSnippets;
  }
  
  // Generiert eine HTML-Exportdatei
  function generateHtmlExport(codeSnippets: CodeSnippet[]): string {
    // Hauptschnipsel finden (HTML, falls vorhanden)
    const htmlSnippet = codeSnippets.find(snippet => snippet.language === 'html');
    const cssSnippet = codeSnippets.find(snippet => snippet.language === 'css');
    const jsSnippet = codeSnippets.find(snippet => snippet.language === 'javascript');
    
    if (htmlSnippet && htmlSnippet.code.includes('<html>')) {
      // Wenn ein vollständiges HTML-Dokument existiert, dieses als Basis verwenden
      // und ggf. CSS und JS einfügen
      let htmlCode = htmlSnippet.code;
      
      // CSS einfügen, falls vorhanden und noch nicht im Dokument
      if (cssSnippet && !htmlCode.includes('<style>')) {
        htmlCode = htmlCode.replace('</head>', `<style>\n${cssSnippet.code}\n</style>\n</head>`);
      }
      
      // JavaScript einfügen, falls vorhanden und noch nicht im Dokument
      if (jsSnippet && !htmlCode.includes('<script>')) {
        htmlCode = htmlCode.replace('</body>', `<script>\n${jsSnippet.code}\n</script>\n</body>`);
      }
      
      return htmlCode;
    } else {
      // Sonst ein Basisdokument erstellen und alle Snippets einfügen
      let html = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exportierter Code aus HumanRightsIntelligence</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .snippet {
            margin-bottom: 30px;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden;
        }
        .snippet-header {
            background-color: #f5f5f5;
            padding: 10px 15px;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
        }
        .snippet-code {
            padding: 15px;
            overflow-x: auto;
            background-color: #f9f9f9;
        }
        pre {
            margin: 0;
            white-space: pre-wrap;
        }
        ${cssSnippet ? cssSnippet.code : ''}
    </style>
</head>
<body>
    <h1>Exportierte Code-Snippets</h1>
    <p>Erstellt mit HumanRightsIntelligence am ${new Date().toLocaleString()}</p>
    
    <div class="snippets-container">
`;

      // Alle Snippets einfügen
      codeSnippets.forEach((snippet, index) => {
        html += `
        <div class="snippet">
            <div class="snippet-header">Snippet ${index + 1}: ${snippet.purpose} (${snippet.language})</div>
            <div class="snippet-code">
                <pre><code>${snippet.code}</code></pre>
            </div>
        </div>
`;
      });

      // Dokument abschließen
      html += `
    </div>
    
    ${jsSnippet ? `<script>\n${jsSnippet.code}\n</script>` : ''}
</body>
</html>`;

      return html;
    }
  }
  
  // Generiert eine JavaScript-Exportdatei
  function generateJsExport(codeSnippets: CodeSnippet[]): string {
    // JS-Snippets finden
    const jsSnippets = codeSnippets.filter(snippet => 
      snippet.language === 'javascript' || 
      snippet.language === 'js'
    );
    
    let content = `/**
 * Exportierte JavaScript-Snippets aus HumanRightsIntelligence
 * Erstellt am: ${new Date().toLocaleString()}
 */\n\n`;
    
    // JS-Snippets hinzufügen
    if (jsSnippets.length > 0) {
      jsSnippets.forEach((snippet, index) => {
        content += `/**
 * Snippet ${index + 1}: ${snippet.purpose}
 */\n${snippet.code}\n\n`;
      });
    } else {
      // Falls keine spezifischen JS-Snippets gefunden wurden, alle Snippets als Kommentare einfügen
      codeSnippets.forEach((snippet, index) => {
        content += `/**
 * Snippet ${index + 1} (${snippet.language}): ${snippet.purpose}
 * 
 * ${snippet.code.split('\n').map(line => ' * ' + line).join('\n')}
 */\n\n`;
      });
    }
    
    return content;
  }
  
  // Generiert eine Python-Exportdatei
  function generatePyExport(codeSnippets: CodeSnippet[]): string {
    // Python-Snippets finden
    const pySnippets = codeSnippets.filter(snippet => 
      snippet.language === 'python' || 
      snippet.language === 'py'
    );
    
    let content = `#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Exportierte Python-Snippets aus HumanRightsIntelligence
Erstellt am: ${new Date().toLocaleString()}
"""

`;
    
    // Python-Snippets hinzufügen
    if (pySnippets.length > 0) {
      pySnippets.forEach((snippet, index) => {
        content += `# Snippet ${index + 1}: ${snippet.purpose}
${snippet.code}

`;
      });
    } else {
      // Falls keine spezifischen Python-Snippets gefunden wurden, alle Snippets als Kommentare einfügen
      codeSnippets.forEach((snippet, index) => {
        content += `"""
Snippet ${index + 1} (${snippet.language}): ${snippet.purpose}

${snippet.code}
"""

`;
      });
    }
    
    return content;
  }
}