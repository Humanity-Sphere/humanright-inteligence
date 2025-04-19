/**
 * Google Assistant Integration - Bindet den Google Voice Assistant an das Multi-Agent-System an
 * 
 * Diese Komponente ermöglicht die Kommunikation mit dem Google Voice Assistant (Gemini)
 * und übersetzt Sprachbefehle in Aufgaben für das Multi-Agent-System.
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { AgentStatus, ITask, ITaskResult, TaskPriority, GoogleAssistantParams, TaskResult } from './agent-types';
import { BaseAgent } from './base-agent';

/**
 * Google Assistant Integrationsagent
 * Verantwortlich für die Kommunikation mit dem Google Voice Assistant
 */
export class GoogleAssistantAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private geminiModelName: string;
  private assistantModel: GenerativeModel;
  private apiKey: string;
  private intentRecognitionPrompt: string;
  
  constructor(
    name: string = 'Google Assistant',
    apiKey: string,
    modelName: string = 'gemini-1.5-flash'
  ) {
    super({
      id: `google-assistant-${Date.now()}`,
      name: name,
      role: 'voice-assistant',
      capabilities: ['voice-recognition', 'intent-detection', 'dialog-management']
    });
    
    this.apiKey = apiKey;
    this.geminiModelName = modelName;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.assistantModel = this.genAI.getGenerativeModel({ model: this.geminiModelName });
    
    // Standard-Prompt für die Intent-Erkennung
    this.intentRecognitionPrompt = `
Du bist der HR-Defender Coach, ein Assistent für Menschenrechtsverteidiger. 
Analysiere die folgende Sprachbefehle und erkenne den Intent, die Parameter und die Art des gewünschten Inhalts.

Mögliche Intents:
1. createDocument - Erstellen eines Dokuments oder Schriftstücks
2. generateLearningPlan - Erstellen eines Lernplans
3. analyzeData - Analyse von Daten oder Dokumenten
4. createVisualization - Erstellen einer Visualisierung oder Grafik
5. searchInformation - Suche nach Informationen
6. saveContent - Speichern von Inhalten
7. shareContent - Teilen von Inhalten

Gib das Ergebnis als JSON mit den folgenden Feldern zurück:
{
  "intent": "Der erkannte Intent aus der Liste oben",
  "parameters": {
    "contentType": "Dokument, Präsentation, Infografik, etc.",
    "topic": "Das Hauptthema",
    "targetAudience": "Die Zielgruppe",
    "format": "Format oder Stil",
    "complexity": "einfach, mittel, komplex"
  },
  "bestApproach": "document | code | combined",
  "confidence": 0.95,
  "requiresFollowUp": true | false,
  "followUpQuestions": ["Frage 1", "Frage 2"]
}

Wenn "bestApproach" "document" ist, sollte ein einfaches Dokument erstellt werden.
Wenn "bestApproach" "code" ist, sollte spezieller Code für komplexe Visualisierungen generiert werden.
Wenn "bestApproach" "combined" ist, sollten beides parallel erstellt werden.
`;
  }
  
  /**
   * Initialisiert den Google Assistant Agenten
   */
  async initialize(): Promise<boolean> {
    try {
      // Teste die Gemini-Verbindung
      const result = await this.assistantModel.generateContent('Hallo, bist du online?');
      const text = result.response.text();
      this.log(`Gemini-Modell erfolgreich initialisiert und getestet: ${text}`);
      
      this.updateStatus(AgentStatus.IDLE);
      return true;
    } catch (error) {
      this.log(`Fehler bei der Initialisierung des Gemini-Modells: ${error}`, 'error');
      return false;
    }
  }
  
  /**
   * Führt eine Aufgabe aus
   */
  async executeTask(task: any): Promise<TaskResult> {
    this.log(`Führe Aufgabe aus: ${task.type || 'Unbekannte Aufgabe'}`);
    
    switch (task.type) {
      case 'process-voice-command':
        return this.processVoiceCommand(task);
      
      case 'follow-up-dialog':
        return this.handleFollowUpDialog(task);
      
      default:
        return {
          taskId: task.id,
          success: false,
          response: `Unbekannter Aufgabentyp: ${task.type}`,
          error: `Unbekannter Aufgabentyp: ${task.type}`,
          completedAt: new Date()
        };
    }
  }
  
  /**
   * Verarbeitet einen Sprachbefehl und erkennt die Intent
   */
  private async processVoiceCommand(task: any): Promise<TaskResult> {
    try {
      const { voiceCommand, languageCode, userId } = task.parameters;
      
      if (!voiceCommand) {
        return {
          taskId: task.id,
          success: false,
          response: 'Kein Sprachbefehl in den Parametern gefunden',
          error: 'Kein Sprachbefehl in den Parametern gefunden',
          completedAt: new Date()
        };
      }
      
      this.log(`Verarbeite Sprachbefehl: ${voiceCommand}`);
      
      // Intent mit Gemini erkennen
      const intentResult = await this.recognizeIntent(voiceCommand);
      
      // Ergebnis zurückgeben
      return {
        taskId: task.id,
        success: true,
        response: "Sprachbefehl erfolgreich verarbeitet",
        data: {
          originalCommand: voiceCommand,
          intentAnalysis: intentResult,
          userId,
          timestamp: new Date(),
          languageCode: languageCode || 'de-DE'
        },
        completedAt: new Date()
      };
    } catch (error) {
      this.log(`Fehler bei der Verarbeitung des Sprachbefehls: ${error}`, 'error');
      return {
        taskId: task.id,
        success: false,
        response: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date()
      };
    }
  }
  
  /**
   * Erkennt Intent und Parameter aus einem Sprachbefehl
   */
  private async recognizeIntent(voiceCommand: string): Promise<any> {
    try {
      // Erstelle einen Prompt zur Intent-Erkennung
      const prompt = `${this.intentRecognitionPrompt}\n\nSprachbefehl: "${voiceCommand}"`;
      
      // Konfiguration für die Textgenerierung
      const generationConfig: GenerationConfig = {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      };
      
      // Gemini-Modell zur Intent-Erkennung verwenden
      const result = await this.assistantModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const responseText = result.response.text();
      
      // Extrahiere das JSON-Objekt aus der Antwort
      let intentData;
      try {
        // Suche nach JSON-Objekt in der Antwort
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          intentData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: Einfacher Parser für strukturierte Antwort, wenn kein valides JSON gefunden wurde
          intentData = this.parseStructuredResponse(responseText);
        }
      } catch (parseError) {
        this.log(`Fehler beim Parsen der Intent-Antwort: ${parseError}`, 'error');
        intentData = {
          intent: 'unknown',
          confidence: 0,
          requiresFollowUp: true,
          followUpQuestions: ['Was genau möchtest du erstellen?']
        };
      }
      
      return intentData;
    } catch (error) {
      this.log(`Fehler bei der Intent-Erkennung: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Parst eine strukturierte Antwort, wenn kein valides JSON zurückgegeben wurde
   */
  private parseStructuredResponse(text: string): any {
    // Einfacher Parser für Schlüssel-Wert-Paare
    const result: any = {
      intent: 'unknown',
      parameters: {},
      bestApproach: 'document',
      confidence: 0.5,
      requiresFollowUp: true,
      followUpQuestions: []
    };
    
    // Versuche Intent zu extrahieren
    const intentMatch = text.match(/intent:?\s*"?([a-zA-Z]+)"?/i);
    if (intentMatch) {
      result.intent = intentMatch[1].toLowerCase();
    }
    
    // Versuche Content-Typ zu extrahieren
    const contentTypeMatch = text.match(/contentType:?\s*"?([a-zA-Z]+)"?/i);
    if (contentTypeMatch) {
      result.parameters.contentType = contentTypeMatch[1];
    }
    
    // Extrahiere Topic
    const topicMatch = text.match(/topic:?\s*"([^"]+)"/i);
    if (topicMatch) {
      result.parameters.topic = topicMatch[1];
    }
    
    // Extrahiere Approach
    const approachMatch = text.match(/bestApproach:?\s*"?([a-zA-Z]+)"?/i);
    if (approachMatch) {
      result.bestApproach = approachMatch[1].toLowerCase();
    }
    
    return result;
  }
  
  /**
   * Handhabt Dialog-Follow-ups für genauere Informationen
   */
  private async handleFollowUpDialog(task: any): Promise<TaskResult> {
    try {
      const { initialQuery, userResponse, dialogContext } = task.parameters;
      
      if (!initialQuery || !userResponse) {
        return {
          taskId: task.id,
          success: false,
          response: 'Fehlende Parameter für Dialog-Follow-up',
          error: 'Fehlende Parameter für Dialog-Follow-up',
          completedAt: new Date()
        };
      }
      
      this.log(`Verarbeite Follow-up-Dialog für: ${initialQuery}`);
      
      // Kontext aus vorherigem Dialog
      const context = dialogContext || {};
      
      // Prompt mit Dialoghistorie erstellen
      let prompt = `
Du bist der HR-Defender Coach, ein Assistent für Menschenrechtsverteidiger.
Du führst einen Dialog, um Details für eine Anfrage zu klären.

Bisheriger Dialog:
Benutzer: "${initialQuery}"
HR-Defender Coach: "${context.lastAssistantMessage || 'Kannst du mir mehr Details geben?'}"
Benutzer: "${userResponse}"

Basierend auf dem bisherigen Dialog, erstelle eine aktualisierte Einschätzung mit allen Details:
`;
      
      // Konfiguration für die Textgenerierung
      const generationConfig: GenerationConfig = {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      };
      
      // Gemini-Modell verwenden
      const result = await this.assistantModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const responseText = result.response.text();
      
      // Aktualisiere Intent-Analyse
      const updatedAnalysis = await this.recognizeIntent(`${initialQuery} ${userResponse}`);
      
      // Speichere die letzte Assistentenantwort im Kontext
      context.lastAssistantMessage = responseText;
      
      return {
        taskId: task.id,
        success: true,
        response: "Follow-up Dialog erfolgreich verarbeitet",
        data: {
          originalQuery: initialQuery,
          userResponse,
          assistantResponse: responseText,
          updatedIntentAnalysis: updatedAnalysis,
          dialogContext: {
            ...context,
            turns: (context.turns || 0) + 1
          }
        },
        completedAt: new Date()
      };
    } catch (error) {
      this.log(`Fehler beim Dialog-Follow-up: ${error}`, 'error');
      return {
        taskId: task.id,
        success: false,
        response: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date()
      };
    }
  }
  
  /**
   * Erstellt einen Benutzer-Intent aus einem Sprachbefehl
   */
  async createGoogleAssistantIntent(
    voiceCommand: string,
    userId: string,
    languageCode: string = 'de-DE'
  ): Promise<GoogleAssistantParams> {
    // Aufgabe erstellen
    const task = {
      id: `voice-task-${Date.now()}`,
      type: 'process-voice-command',
      priority: TaskPriority.HIGH,
      parameters: {
        voiceCommand,
        userId,
        languageCode
      },
      createdAt: new Date()
    };
    
    // Aufgabe ausführen
    const result = await this.executeTask(task);
    
    if (!result.success) {
      throw new Error(`Fehler bei der Verarbeitung des Sprachbefehls: ${result.error}`);
    }
    
    // Intent und Parameter erstellen
    const intentAnalysis = result.data.intentAnalysis;
    return {
      command: voiceCommand,
      intent: intentAnalysis.intent,
      parameters: intentAnalysis.parameters || {},
      rawQuery: voiceCommand,
      context: {
        bestApproach: intentAnalysis.bestApproach,
        requiresFollowUp: intentAnalysis.requiresFollowUp,
        followUpQuestions: intentAnalysis.followUpQuestions
      }
    };
  }
}