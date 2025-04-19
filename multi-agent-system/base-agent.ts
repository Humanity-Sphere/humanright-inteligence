/**
 * Base Agent - Grundklasse für alle Agenten im Multi-Agent-System
 */

import { 
  AgentConfig, 
  AgentInitOptions, 
  AgentStatus,
  AgentStatusInfo,
  TaskResult 
} from './agent-types';

export abstract class BaseAgent {
  protected _id: string;
  protected _name: string;
  protected _role: string;
  protected _capabilities: string[] = [];
  protected _agentStatus: AgentStatusInfo = {
    isActive: false,
    errorCount: 0,
    successCount: 0,
    status: AgentStatus.INITIALIZING
  };
  protected _apiKey: string = '';
  protected _initialized: boolean = false;
  protected _connectedAgents: BaseAgent[] = [];
  protected _runtime: {
    model: string;
    minTokens: number;
    maxTokens: number;
    temperature: number;
  } = {
    model: 'gemini-1.5-flash',
    minTokens: 50,
    maxTokens: 2048,
    temperature: 0.7
  };

  constructor(config: AgentConfig) {
    this._id = config.id;
    this._name = config.name;
    this._role = config.role;
    this._capabilities = config.capabilities || [];
    
    if (config.runtime) {
      this._runtime = {
        ...this._runtime,
        ...config.runtime
      };
    }
  }

  /**
   * Initialisiert den Agenten mit API-Schlüsseln und Konfiguration
   */
  async initialize(options: AgentInitOptions): Promise<boolean> {
    try {
      this._apiKey = options.apiKey;
      this._initialized = true;
      this._agentStatus.isActive = true;
      return true;
    } catch (error) {
      console.error(`Fehler bei der Initialisierung des Agenten ${this._name}:`, error);
      return false;
    }
  }

  /**
   * Stellt eine Verbindung zu einem anderen Agenten her
   */
  connectToAgent(agent: BaseAgent): void {
    if (!this._connectedAgents.some(a => a.id === agent.id)) {
      this._connectedAgents.push(agent);
    }
  }

  /**
   * Sendet eine Nachricht an einen anderen Agenten
   */
  sendMessageToAgent(targetAgentId: string, message: any): void {
    const targetAgent = this._connectedAgents.find(agent => agent.id === targetAgentId);
    
    if (!targetAgent) {
      throw new Error(`Agent ${targetAgentId} ist nicht verbunden`);
    }
    
    targetAgent.receiveMessage(this._id, message);
  }

  /**
   * Empfängt eine Nachricht von einem anderen Agenten
   */
  receiveMessage(senderId: string, message: any): void {
    console.log(`${this._name} hat eine Nachricht von ${senderId} erhalten:`, message);
    // Implementierung in den abgeleiteten Klassen
  }

  /**
   * Führt eine Aufgabe aus
   */
  abstract executeTask(task: any): Promise<TaskResult>;

  /**
   * Aktualisiert den Status des Agenten
   */
  updateStatus(status: string): void {
    this._agentStatus.status = status as AgentStatus;
    this._agentStatus.lastActiveTime = new Date();
    this.log(`Agent Status aktualisiert: ${status}`);
  }

  /**
   * Protokolliert eine Nachricht
   */
  log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this._name}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Gibt den aktuellen Status des Agenten zurück
   */
  getStatus(): AgentStatusInfo {
    return { ...this._agentStatus };
  }

  /**
   * Erstellt ein Ergebnisobjekt für eine Aufgabe
   */
  createTaskResult(success: boolean, response: string, content?: any, error?: string): TaskResult {
    if (success) {
      this._agentStatus.successCount++;
    } else {
      this._agentStatus.errorCount++;
    }
    
    return {
      success,
      response,
      content,
      error
    };
  }

  // Getter für Eigenschaften
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get role(): string {
    return this._role;
  }

  get capabilities(): string[] {
    return [...this._capabilities];
  }

  get connectedAgents(): BaseAgent[] {
    return [...this._connectedAgents];
  }

  get runtime(): any {
    return { ...this._runtime };
  }

  get isInitialized(): boolean {
    return this._initialized;
  }
}