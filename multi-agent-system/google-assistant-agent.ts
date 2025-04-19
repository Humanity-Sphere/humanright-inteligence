/**
 * Google Assistant Agent - Verarbeitet Sprachbefehle und leitet sie an das entsprechende System weiter
 * 
 * Dieser Agent ist für die Verarbeitung von Spracheingaben und deren Interpretation
 * verantwortlich. Er kann Intent erkennen, Parameter extrahieren und die Anfrage
 * an die entsprechenden spezialisierten Agenten weiterleiten.
 */

import { BaseAgent } from './base-agent';
import { v4 as uuidv4 } from 'uuid';
import type {
  AgentRole,
  AgentStatus,
  TaskType,
  TaskResult
} from './agent-types';
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

/**
 * Google Assistant Agent
 * Verarbeitet Spracheingaben und erkennt Intents
 */
export class GoogleAssistantAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private apiKey: string;
  
  constructor(name: string = 'Google Assistant', apiKey: string, model: string = 'gemini-1.5-flash') {
    super(name);
    
    this.apiKey = apiKey;
    this.modelName = model;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  /**
   * Initialisiert den Google Assistant Agenten
   */
  async initialize(): Promise<boolean> {
    try {
      // KI-Dienst für den Google Assistant Agent initialisieren
      if (!this.apiKey) {
        throw new Error('API-Key für Google Assistant Agent fehlt');
      }
      
      this.updateStatus({ isActive: false });
      console.log(`Google Assistant Agent "${this.name}" initialisiert`);
      return true;
    } catch (error) {
      console.error('Fehler bei der Initialisierung des Google Assistant Agenten:', error);
      this.updateStatus({ isActive: false, errorCount: this._status.errorCount + 1 });
      return false;
    }
  }
  
  /**
   * Führt eine Aufgabe aus
   */
  async executeTask(task: any): Promise<TaskResult> {
    this.updateStatus({ isActive: true });
    
    try {
      let result: any;
      
      switch (task.type) {
        case 'voice-command':
          // Spracheingabe verarbeiten
          result = await this.processVoiceCommand(task);
          break;
          
        case 'follow-up-dialog':
          // Follow-up-Dialog verarbeiten
          result = await this.processFollowUp(task);
          break;
          
        default:
          throw new Error(`Unbekannter Aufgabentyp: ${task.type}`);
      }
      
      this.updateStatus({ isActive: false, successCount: this._status.successCount + 1 });
      return this.createTaskResult(
        true,
        `Aufgabe erfolgreich ausgeführt: ${task.type}`,
        result
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error(`Fehler bei der Ausführung der Aufgabe ${task.type}:`, errorMessage);
      
      this.updateStatus({ isActive: false, errorCount: this._status.errorCount + 1 });
      return this.createTaskResult(
        false,
        `Fehler bei der Ausführung: ${task.type}`,
        null,
        errorMessage
      );
    }
  }
  
  /**
   * Verarbeitet eine Spracheingabe und erkennt den Intent
   */
  private async processVoiceCommand(task: any): Promise<any> {
    const { voiceCommand, userId, languageCode } = task.parameters as any;
    
    console.log(`Verarbeite Spracheingabe: "${voiceCommand}" von Benutzer ${userId}`);
    
    // Intent-Erkennung mit Google Gemini durchführen
    const assistantParams = await this.recognizeIntent(
      voiceCommand,
      userId,
      languageCode || 'de-DE'
    );
    
    return assistantParams;
  }
  
  /**
   * Verarbeitet einen Follow-up-Dialog
   */
  private async processFollowUp(task: any): Promise<any> {
    const { initialQuery, userResponse, dialogContext } = task.parameters as any;
    
    console.log(`Verarbeite Follow-up: "${userResponse}" für ursprüngliche Anfrage "${initialQuery}"`);
    
    // Follow-up-Antwort generieren und Intent-Analyse aktualisieren
    const updatedIntentAnalysis = await this.analyzeFollowUp(
      initialQuery,
      userResponse,
      dialogContext
    );
    
    // Erstelle eine natürlichsprachige Antwort basierend auf der aktualisierten Analyse
    const assistantResponse = await this.generateFollowUpResponse(
      updatedIntentAnalysis,
      userResponse
    );
    
    return {
      assistantResponse,
      updatedIntentAnalysis,
      dialogContext: {
        ...dialogContext,
        previousInteractions: [
          ...(dialogContext.previousInteractions || []),
          { userQuery: userResponse, assistantResponse }
        ]
      }
    };
  }
  
  /**
   * Erkennt den Intent einer Spracheingabe
   */
  private async recognizeIntent(
    voiceCommand: string,
    userId: string,
    languageCode: string = 'de-DE'
  ): Promise<any> {
    try {
      // Gemini-Modell zur Intent-Erkennung verwenden
      const intentGenerationPrompt = `
Du bist ein Assistent, der natürliche Spracheingaben analysiert und sie den entsprechenden Intents zuordnet.

Die verfügbaren Intents sind:
- createDocument: Wenn der Benutzer ein Dokument erstellen möchte
- generateLearningPlan: Wenn der Benutzer einen Lernplan erstellen möchte
- analyzeData: Wenn der Benutzer Daten analysieren möchte
- createVisualization: Wenn der Benutzer eine Visualisierung erstellen möchte
- searchInformation: Wenn der Benutzer nach Informationen sucht
- generatePresentation: Wenn der Benutzer eine Präsentation erstellen möchte
- generateHtmlPage: Wenn der Benutzer eine HTML-Seite oder interaktive Webseite erstellen möchte
- generateDashboard: Wenn der Benutzer ein Dashboard für Daten erstellen möchte
- generateMap: Wenn der Benutzer eine interaktive Karte oder geografische Visualisierung erstellen möchte

Analyisiere die folgende Benutzereingabe: "${voiceCommand}"

1. Welcher Intent passt am besten?
2. Welche Parameter können extrahiert werden? (z.B. Thema, Zielgruppe, Datenformat, usw.)
3. Benötigen wir mehr Informationen vom Benutzer? Wenn ja, welche Fragen sollten wir stellen?
4. Was ist der beste Ansatz für diesen Intent? (document, code oder combined)

Antworte nur im folgenden JSON-Format:
{
  "intent": "intentName",
  "parameters": {
    "topic": "extrahiertes Thema",
    "targetAudience": "extrahierte Zielgruppe",
    "complexity": "extrahierte Komplexität (low, medium, high)",
    "dataFormat": "extrahiertes Datenformat (falls vorhanden)"
  },
  "requiresFollowUp": true/false,
  "followUpQuestions": ["Frage 1", "Frage 2"],
  "bestApproach": "document/code/combined"
}
`;
      
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: intentGenerationPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      });
      
      const responseText = result.response.text();
      
      // Extrahiere den JSON-Teil aus der Antwort
      const jsonMatch = responseText.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[0] : '{}';
      
      try {
        const intentAnalysis = JSON.parse(jsonString);
        
        // Erstelle Assistant-Parameter basierend auf der Intent-Analyse
        const assistantParams = {
          intent: intentAnalysis.intent || 'unknown',
          parameters: intentAnalysis.parameters || {},
          rawQuery: voiceCommand,
          context: {
            requiresFollowUp: intentAnalysis.requiresFollowUp || false,
            followUpQuestions: intentAnalysis.followUpQuestions || [],
            bestApproach: intentAnalysis.bestApproach || 'document'
          }
        };
        
        return assistantParams;
      } catch (jsonError) {
        console.error('Fehler beim Parsen der Intent-Analyse:', jsonError);
        
        // Fallback-Analyse zurückgeben
        return {
          intent: 'unknown',
          parameters: {},
          rawQuery: voiceCommand,
          context: {
            requiresFollowUp: true,
            followUpQuestions: ['Könntest du bitte genauer erklären, was du möchtest?'],
            bestApproach: 'document'
          }
        };
      }
    } catch (error) {
      console.error('Fehler bei der Intent-Erkennung:', error);
      throw error;
    }
  }
  
  /**
   * Analysiert eine Follow-up-Antwort und aktualisiert die Intent-Analyse
   */
  private async analyzeFollowUp(
    initialQuery: string,
    userResponse: string,
    dialogContext: any = {}
  ): Promise<any> {
    try {
      // Gemini-Modell zur Follow-up-Analyse verwenden
      const followUpPrompt = `
Du bist ein Assistent, der Follow-up-Antworten analysiert und eine aktualisierte Intent-Analyse erstellt.

Ursprüngliche Anfrage: "${initialQuery}"
Follow-up-Antwort des Benutzers: "${userResponse}"

Bisheriger Kontext:
Intent: ${dialogContext.intent || 'unknown'}
Parameter: ${JSON.stringify(dialogContext.parameters || {})}

Die verfügbaren Intents sind:
- createDocument: Wenn der Benutzer ein Dokument erstellen möchte
- generateLearningPlan: Wenn der Benutzer einen Lernplan erstellen möchte
- analyzeData: Wenn der Benutzer Daten analysieren möchte
- createVisualization: Wenn der Benutzer eine Visualisierung erstellen möchte
- searchInformation: Wenn der Benutzer nach Informationen sucht
- generatePresentation: Wenn der Benutzer eine Präsentation erstellen möchte
- generateHtmlPage: Wenn der Benutzer eine HTML-Seite oder interaktive Webseite erstellen möchte
- generateDashboard: Wenn der Benutzer ein Dashboard für Daten erstellen möchte
- generateMap: Wenn der Benutzer eine interaktive Karte oder geografische Visualisierung erstellen möchte

Basierend auf der ursprünglichen Anfrage und der Follow-up-Antwort:

1. Welcher Intent passt am besten?
2. Welche Parameter können extrahiert werden? (z.B. Thema, Zielgruppe, Datenformat, usw.)
3. Benötigen wir mehr Informationen vom Benutzer? Wenn ja, welche Fragen sollten wir stellen?
4. Was ist der beste Ansatz für diesen Intent? (document, code oder combined)

Antworte nur im folgenden JSON-Format:
{
  "intent": "intentName",
  "parameters": {
    "topic": "extrahiertes Thema",
    "targetAudience": "extrahierte Zielgruppe",
    "complexity": "extrahierte Komplexität (low, medium, high)",
    "dataFormat": "extrahiertes Datenformat (falls vorhanden)"
  },
  "requiresFollowUp": true/false,
  "followUpQuestions": ["Frage 1", "Frage 2"],
  "bestApproach": "document/code/combined"
}
`;
      
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: followUpPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      });
      
      const responseText = result.response.text();
      
      // Extrahiere den JSON-Teil aus der Antwort
      const jsonMatch = responseText.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[0] : '{}';
      
      try {
        return JSON.parse(jsonString);
      } catch (jsonError) {
        console.error('Fehler beim Parsen der Follow-up-Analyse:', jsonError);
        
        // Fallback-Analyse zurückgeben
        return {
          intent: dialogContext.intent || 'unknown',
          parameters: dialogContext.parameters || {},
          requiresFollowUp: true,
          followUpQuestions: ['Könntest du bitte genauer erklären, was du möchtest?'],
          bestApproach: dialogContext.bestApproach || 'document'
        };
      }
    } catch (error) {
      console.error('Fehler bei der Follow-up-Analyse:', error);
      throw error;
    }
  }
  
  /**
   * Generiert eine Antwort auf einen Follow-up
   */
  private async generateFollowUpResponse(
    intentAnalysis: any,
    userResponse: string
  ): Promise<string> {
    try {
      // Gemini-Modell zur Antwortgenerierung verwenden
      const responsePrompt = `
Du bist ein hilfreicher Assistent für Menschenrechtsverteidiger, der Benutzeranfragen versteht und beantwortet.

Benutzeranfrage: "${userResponse}"

Deine Analyse:
Intent: ${intentAnalysis.intent}
Benötigt weitere Informationen: ${intentAnalysis.requiresFollowUp ? 'Ja' : 'Nein'}

Reagiere natürlich und hilfreich auf die Benutzeranfrage. Deine Antwort sollte:
1. Die Anfrage bestätigen oder um weitere Informationen bitten
2. Freundlich und unterstützend sein
3. Präzise sein und nicht zu lang

Antworte nur mit dem Text, den der Assistent sagen soll, ohne Einleitung oder Kennzeichnung.
`;
      
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: responsePrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        }
      });
      
      return result.response.text();
    } catch (error) {
      console.error('Fehler bei der Antwortgenerierung:', error);
      return 'Ich habe deine Anfrage verstanden. Wie kann ich dir weiterhelfen?';
    }
  }
  
  /**
   * Erstellt die Google Assistant Intent-Parameter aus einer Spracheingabe
   * Diese Methode wird vom Multi-Agent-System aufgerufen
   */
  async createGoogleAssistantIntent(
    voiceCommand: string,
    userId: string,
    languageCode: string = 'de-DE'
  ): Promise<any> {
    // Aufgabe für die Intent-Erkennung erstellen
    const task = {
      id: `voice-${uuidv4()}`,
      type: 'voice-command',
      description: 'Spracheingabe verarbeiten',
      priority: 'high',
      parameters: {
        voiceCommand,
        userId,
        languageCode
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Aufgabe ausführen
    const result = await this.executeTask(task);
    
    if (!result.success) {
      throw new Error(result.error || 'Fehler bei der Verarbeitung der Spracheingabe');
    }
    
    return result.content;
  }
}