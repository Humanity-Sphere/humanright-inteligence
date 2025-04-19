/**
 * Multi-Agent System - Koordiniert verschiedene KI-Agenten für komplexe Aufgaben
 * 
 * Dieses System verwaltet spezialisierte Agenten für unterschiedliche Aufgabentypen:
 * - ManagerAgent: Zentrale Steuerung und Aufgabenverteilung
 * - ContentGeneratorAgent: Erstellung von Dokumenten und Inhalten
 * - CodeGeneratorAgent: Generierung von Code für Visualisierungen und Dashboards
 * - GoogleAssistantAgent: Verarbeitung von Sprachbefehlen über Google Assistant
 * - SelfLearningAgent: Erkennt Muster in Benutzerinteraktionen und programmiert neue Lösungen
 * - SelfRepairAgent: Identifiziert und repariert Probleme im System automatisch
 */

import { ManagerAgent } from './manager-agent';
import { ContentGeneratorAgent } from './content-generator-agent';
import { CodeGeneratorAgent } from './code-generator-agent';
import { GoogleAssistantAgent } from './google-assistant-integration';
import { BaseAgent } from './base-agent';
import { v4 as uuidv4 } from 'uuid';

// Singleton-Instanz des Multi-Agent-Systems
let multiAgentSystemInstance: MultiAgentSystem | null = null;

class MultiAgentSystem {
  private managerAgent: ManagerAgent;
  private contentGenerator: ContentGeneratorAgent;
  private codeGenerator: CodeGeneratorAgent;
  private googleAssistant: GoogleAssistantAgent;
  private _agents: BaseAgent[] = [];
  private _initialized: boolean = false;
  private activeWorkflows: Map<string, any> = new Map();
  
  // Selbstlern- und Selbstreparatur-Service Referenzen
  private selfRepairAgent: any = null; // Wird in initialize gesetzt
  private selfLearningAgent: any = null; // Wird in initialize gesetzt

  constructor() {
    // Agenten initialisieren
    this.managerAgent = new ManagerAgent({
      id: 'manager-1',
      name: 'Workflow Manager',
      role: 'Koordiniert Aufgaben zwischen den spezialisierten Agenten'
    });
    
    this.contentGenerator = new ContentGeneratorAgent({
      id: 'content-gen-1',
      name: 'Content Generator',
      role: 'Erstellt informative Dokumente, Berichte und Lernmaterialien'
    });
    
    this.codeGenerator = new CodeGeneratorAgent({
      id: 'code-gen-1',
      name: 'Code Generator',
      role: 'Erstellt Code für Datenvisualisierungen und Dashboards'
    });
    
    this.googleAssistant = new GoogleAssistantAgent({
      id: 'voice-assistant-1',
      name: 'Google Assistant Integration',
      role: 'Verarbeitet Sprachbefehle und wandelt sie in strukturierte Aufgaben um'
    });
    
    // Agenten zum System hinzufügen
    this._agents.push(this.managerAgent);
    this._agents.push(this.contentGenerator);
    this._agents.push(this.codeGenerator);
    this._agents.push(this.googleAssistant);
  }

  /**
   * Initialisiert das Multi-Agent-System mit dem API-Key
   */
  async initialize(apiKey: string): Promise<boolean> {
    try {
      // API-Key für alle Agenten setzen
      for (const agent of this._agents) {
        await agent.initialize({ apiKey });
      }
      
      // Verbindungen zwischen den Agenten herstellen
      this.managerAgent.connectToAgent(this.contentGenerator);
      this.managerAgent.connectToAgent(this.codeGenerator);
      this.googleAssistant.connectToAgent(this.managerAgent);
      
      // Selbstreparatur- und Selbstlern-Agent Referenzen abrufen
      try {
        // Dynamisches Importieren, damit die Agenten nachgeladen werden können
        const selfRepairModule = await import('../ai-self-repair-agent');
        this.selfRepairAgent = selfRepairModule.getAISelfRepairAgent();
        
        const selfLearningModule = await import('../self-learning-agent');
        this.selfLearningAgent = selfLearningModule.getSelfLearningAgent();
        
        console.log('[MCP] Self-Repair und Self-Learning Agenten erfolgreich verbunden');
      } catch (agentError) {
        console.warn('[MCP] Warnung: Selbstreparatur- oder Selbstlern-Agent konnte nicht geladen werden:', agentError);
      }
      
      this._initialized = true;
      console.log('Multi-Agent-System erfolgreich initialisiert');
      return true;
    } catch (error) {
      console.error('Fehler bei der Initialisierung des Multi-Agent-Systems:', error);
      return false;
    }
  }

  /**
   * Verarbeitet einen Sprachbefehl und koordiniert die Agenten zur Ausführung
   */
  async processVoiceCommand(
    command: string, 
    userId: string = 'anonymous',
    languageCode: string = 'de-DE'
  ) {
    if (!this._initialized) {
      throw new Error('Multi-Agent-System ist nicht initialisiert');
    }
    
    // Workflow-ID für diese Verarbeitung erstellen
    const workflowId = uuidv4();
    
    try {
      // Protokollieren des eingehenden Sprachbefehls für die Selbstlern- und Selbstreparaturfunktionen
      await this.logVoiceCommandForLearning(command, userId);
      
      // Sprachbefehl an Google Assistant Agent weiterleiten
      const voiceCommandResult = await this.googleAssistant.processVoiceCommand(command, {
        workflowId,
        userId,
        languageCode
      });
      
      // Ermittelte Absicht und Parameter an den Manager Agent weiterleiten
      let finalResult;
      
      if (voiceCommandResult.needsManagerCoordination) {
        // Manager koordiniert die Aufgabe mit anderen Agenten
        finalResult = await this.managerAgent.coordinateTask({
          workflowId,
          intent: voiceCommandResult.intent,
          parameters: voiceCommandResult.parameters,
          taskType: voiceCommandResult.taskType,
          requiredAgents: voiceCommandResult.requiredAgents || []
        });
      } else {
        // Direktes Ergebnis vom Google Assistant Agent
        finalResult = voiceCommandResult;
      }
      
      // Aktiven Workflow speichern
      this.activeWorkflows.set(workflowId, {
        id: workflowId,
        userId,
        command,
        status: 'completed',
        result: finalResult,
        startedAt: new Date(),
        completedAt: new Date()
      });
      
      return {
        ...finalResult,
        workflowId
      };
    } catch (error) {
      console.error('Fehler bei der Verarbeitung des Sprachbefehls:', error);
      
      // Fehlgeschlagenen Workflow speichern
      this.activeWorkflows.set(workflowId, {
        id: workflowId,
        userId,
        command,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        startedAt: new Date(),
        completedAt: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Verarbeitet einen Follow-up-Dialog zu einer vorherigen Anfrage
   */
  async processFollowUpDialog(
    initialQuery: string,
    userResponse: string,
    dialogContext: any = {}
  ) {
    if (!this._initialized) {
      throw new Error('Multi-Agent-System ist nicht initialisiert');
    }
    
    // Workflow-ID für diese Verarbeitung erstellen
    const workflowId = uuidv4();
    
    try {
      // Follow-up an Google Assistant Agent weiterleiten
      const followUpResult = await this.googleAssistant.processFollowUp(
        initialQuery,
        userResponse, 
        dialogContext
      );
      
      // Entscheiden, ob Manager weitere Koordination durchführen soll
      let finalResult;
      
      if (followUpResult.needsManagerCoordination) {
        // Manager koordiniert die Aufgabe mit anderen Agenten
        finalResult = await this.managerAgent.coordinateTask({
          workflowId,
          intent: followUpResult.updatedIntent || dialogContext.intent,
          parameters: followUpResult.updatedParameters || dialogContext.parameters,
          taskType: followUpResult.taskType,
          requiredAgents: followUpResult.requiredAgents || []
        });
      } else {
        // Direktes Ergebnis vom Google Assistant Agent
        finalResult = followUpResult;
      }
      
      // Aktiven Workflow speichern
      this.activeWorkflows.set(workflowId, {
        id: workflowId,
        initialQuery,
        userResponse,
        status: 'completed',
        result: finalResult,
        startedAt: new Date(),
        completedAt: new Date()
      });
      
      return {
        ...finalResult,
        workflowId
      };
    } catch (error) {
      console.error('Fehler bei der Verarbeitung des Follow-up-Dialogs:', error);
      
      // Fehlgeschlagenen Workflow speichern
      this.activeWorkflows.set(workflowId, {
        id: workflowId,
        initialQuery,
        userResponse,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        startedAt: new Date(),
        completedAt: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Gibt den aktuellen Status aller Workflows zurück
   */
  getWorkflowStatus() {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Gibt alle registrierten Agenten zurück
   */
  getAgents() {
    return this._agents;
  }

  /**
   * Protokolliert einen Sprachbefehl für das Selbstlernen und die Selbstreparatur
   * Diese Funktion sendet den Befehl an beide Agenten zur Analyse und Verarbeitung
   */
  private async logVoiceCommandForLearning(command: string, userId: string): Promise<void> {
    try {
      // Nur ausführen, wenn die Agenten initialisiert wurden
      if (this.selfLearningAgent && typeof this.selfLearningAgent.learnFromUserInteraction === 'function') {
        await this.selfLearningAgent.learnFromUserInteraction({
          userId,
          type: 'voice_command',
          content: command,
          timestamp: new Date(),
          context: { source: 'voice_interface' }
        });
        console.log('[MCP] Sprachbefehl an Selbstlern-Agent weitergeleitet:', command.substring(0, 30) + '...');
      }
      
      // Aktivität an den Selbstreparatur-Agent weitergeben zur Überwachung
      if (this.selfRepairAgent && typeof this.selfRepairAgent.monitorUserActivity === 'function') {
        this.selfRepairAgent.monitorUserActivity({
          userId,
          action: 'voice_command',
          component: 'voice_interface',
          path: '/voice',
          timestamp: new Date(),
          errorEncountered: false
        });
        console.log('[MCP] Sprachbefehl für Selbstreparatur-Überwachung registriert');
      }
    } catch (error) {
      console.error('[MCP] Fehler bei der Protokollierung des Sprachbefehls für Selbstlern/Selbstreparatur:', error);
      // Fehler nicht werfen, um Hauptfunktionalität nicht zu beeinträchtigen
    }
  }

  /**
   * Prüft, ob das System initialisiert wurde
   */
  get initialized() {
    return this._initialized;
  }
}

/**
 * Gibt die Singleton-Instanz des Multi-Agent-Systems zurück
 */
export function getMultiAgentSystem(): MultiAgentSystem {
  if (!multiAgentSystemInstance) {
    multiAgentSystemInstance = new MultiAgentSystem();
  }
  return multiAgentSystemInstance;
}