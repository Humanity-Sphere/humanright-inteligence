/**
 * Archon Agent Factory
 * 
 * Basierend auf dem Archon-Projekt (github.com/coleam00/Archon)
 * Dieser Dienst ermöglicht das dynamische Erstellen und Verwalten von 
 * KI-Agenten mit unterschiedlichen Rollen und Fähigkeiten.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { AIGateway, getAIGateway } from './ai-gateway-integration';
import path from 'path';
import fs from 'fs/promises';

// Agent-Rolle
export enum AgentRole {
  ADVISOR = 'advisor',
  DOCUMENT_ANALYZER = 'document_analyzer',
  CODE_GENERATOR = 'code_generator',
  PROMPTER = 'prompter',
  TOOLS_REFINER = 'tools_refiner',
  SELF_REPAIR = 'self_repair',
  SECURITY_ADVISOR = 'security_advisor',
  INTEGRATION_SPECIALIST = 'integration_specialist',
  DATA_ANALYST = 'data_analyst',
  TESTER = 'tester',
  UX_ADVISOR = 'ux_advisor',
  SYSTEM_MONITOR = 'system_monitor'
}

// Agent-Zustand
export enum AgentState {
  IDLE = 'idle',
  PLANNING = 'planning',
  EXECUTING = 'executing',
  REFINING = 'refining',
  ERROR = 'error',
  COMPLETED = 'completed'
}

// Agent-Konfiguration
export interface AgentConfig {
  role: AgentRole;
  name?: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  tools?: AgentTool[];
  memory?: boolean;
  memoryLimit?: number;
  autonomyLevel?: 'low' | 'medium' | 'high' | 'full';
  createdBy?: string;
}

// Agent-Tool Konfiguration
export interface AgentTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  function: (...args: any[]) => Promise<any>;
}

// Agent-Anfrage
export interface AgentRequest {
  input: string;
  context?: Record<string, any>;
  documents?: string[];
  tools?: string[];
  responseFormat?: 'json' | 'text' | 'markdown';
}

// Agent-Antwort
export interface AgentResponse {
  id: string;
  agentId: string;
  timestamp: Date;
  output: string;
  intermediateSteps?: Array<{
    thought: string;
    action: string;
    actionResult: string;
  }>;
  status: 'success' | 'error' | 'partial';
  error?: string;
  context?: Record<string, any>;
  usedTools?: string[];
  responseFormat: 'json' | 'text' | 'markdown';
  rawResponse?: any;
}

// Agent-Instanz
export interface Agent {
  id: string;
  config: AgentConfig;
  state: AgentState;
  createdAt: Date;
  lastActive: Date;
  requestCount: number;
  successRate: number;
  memory: AgentMemoryManager;
  processingTime: {
    avg: number;
    min: number;
    max: number;
    total: number;
  };
  execute: (request: AgentRequest) => Promise<AgentResponse>;
  getState: () => AgentState;
  getMemory: () => any[];
  resetMemory: () => void;
  updateConfig: (config: Partial<AgentConfig>) => void;
}

// Agent-Memory-Manager
export class AgentMemoryManager {
  private memories: any[] = [];
  private memoryLimit: number;
  
  constructor(memoryLimit: number = 10) {
    this.memoryLimit = memoryLimit;
  }
  
  add(memory: any): void {
    this.memories.push({
      ...memory,
      timestamp: new Date()
    });
    
    // Limit einhalten
    if (this.memories.length > this.memoryLimit) {
      this.memories = this.memories.slice(-this.memoryLimit);
    }
  }
  
  getAll(): any[] {
    return [...this.memories];
  }
  
  clear(): void {
    this.memories = [];
  }
  
  setLimit(limit: number): void {
    this.memoryLimit = limit;
    // Anpassen, falls nötig
    if (this.memories.length > this.memoryLimit) {
      this.memories = this.memories.slice(-this.memoryLimit);
    }
  }
}

/**
 * Archon Agent Factory
 * Erstellt und verwaltet KI-Agenten
 */
export class ArchonAgentFactory {
  private static instance: ArchonAgentFactory;
  private agents: Map<string, Agent> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private aiGateway!: AIGateway;
  private toolLibrary: Map<string, AgentTool> = new Map();
  private systemPromptTemplates: Map<AgentRole, string> = new Map();
  
  /**
   * Private Konstruktor für Singleton-Pattern
   */
  private constructor() {
    try {
      try {
        this.aiGateway = getAIGateway();
      } catch (aiError) {
        console.warn('[ArchonAgentFactory] AIGateway konnte nicht geladen werden, verwende Mock-Implementierung');
        // Mock-Implementierung, wenn AIGateway nicht verfügbar ist
        this.aiGateway = {
          chatCompletion: async (params) => ({ 
            choices: [{ message: { content: 'Mock-Antwort: AIGateway nicht verfügbar' } }] 
          })
        } as any;
      }
      
      this.loadToolLibrary();
      this.loadSystemPromptTemplates();
    } catch (error) {
      console.error('[ArchonAgentFactory] Fehler bei der Initialisierung:', error);
    }
  }
  
  /**
   * Singleton-Instanz erhalten
   */
  public static getInstance(): ArchonAgentFactory {
    if (!ArchonAgentFactory.instance) {
      ArchonAgentFactory.instance = new ArchonAgentFactory();
    }
    return ArchonAgentFactory.instance;
  }
  
  /**
   * Tool-Bibliothek laden
   */
  private async loadToolLibrary(): Promise<void> {
    try {
      // Beispiel-Tools hinzufügen
      this.toolLibrary.set('web_search', {
        name: 'web_search',
        description: 'Führt eine Websuche durch und gibt relevante Ergebnisse zurück',
        parameters: {
          query: 'string',
          limit: 'number'
        },
        function: async (query: string, limit: number = 5) => {
          // Simulierte Websuche (In echt würde hier eine echte Suche stattfinden)
          return {
            results: [
              { title: 'Beispiel 1', url: 'https://example.com/1', snippet: 'Dies ist ein Beispiel-Suchergebnis' },
              { title: 'Beispiel 2', url: 'https://example.com/2', snippet: 'Dies ist ein weiteres Beispiel' }
            ],
            query,
            timestamp: new Date().toISOString()
          };
        }
      });
      
      this.toolLibrary.set('analyze_document', {
        name: 'analyze_document',
        description: 'Analysiert ein Dokument und extrahiert relevante Informationen',
        parameters: {
          documentId: 'string',
          analysisType: 'string'
        },
        function: async (documentId: string, analysisType: string = 'general') => {
          // Simulierte Dokumentenanalyse
          return {
            documentId,
            analysisType,
            result: 'Dies ist eine simulierte Dokumentenanalyse',
            timestamp: new Date().toISOString()
          };
        }
      });
      
      // Weitere Tools können hier hinzugefügt werden
    } catch (error) {
      console.error('[ArchonAgentFactory] Fehler beim Laden der Tool-Bibliothek:', error);
    }
  }
  
  /**
   * System-Prompt-Vorlagen laden
   */
  private loadSystemPromptTemplates(): void {
    // Beispiel-Prompts für verschiedene Rollen
    this.systemPromptTemplates.set(
      AgentRole.ADVISOR,
      `Du bist ein Beratungs-Agent, der Nutzern hilft, die besten Entscheidungen zu treffen.
      Deine Aufgabe ist es, komplexe Informationen zu analysieren und klare, ausgewogene Ratschläge zu geben.
      Berücksichtige dabei immer den Kontext und die spezifischen Anforderungen des Nutzers.`
    );
    
    this.systemPromptTemplates.set(
      AgentRole.DOCUMENT_ANALYZER,
      `Du bist ein Dokumentenanalyse-Agent, spezialisiert auf die Extraktion wichtiger Informationen aus Dokumenten.
      Deine Aufgabe ist es, Texte zu verstehen, relevante Fakten zu identifizieren und Zusammenfassungen zu erstellen.
      Achte besonders auf Menschenrechtsverletzungen, rechtliche Aspekte und Kontext.`
    );
    
    this.systemPromptTemplates.set(
      AgentRole.CODE_GENERATOR,
      `Du bist ein Code-Generierungs-Agent, der qualitativ hochwertigen, fehlerfreien Code erstellt.
      Deine Aufgabe ist es, basierend auf Anforderungen funktionalen Code zu schreiben, der bewährten Praktiken folgt.
      Kommentiere deinen Code gut und erkläre wichtige Entscheidungen.`
    );
    
    this.systemPromptTemplates.set(
      AgentRole.SELF_REPAIR,
      `Du bist ein Selbstreparatur-Agent, der Probleme im System identifiziert und behebt.
      Deine Aufgabe ist es, Fehler zu analysieren, Lösungen zu entwickeln und diese umzusetzen.
      Priorisiere kritische Fehler und dokumentiere alle Änderungen sorgfältig.`
    );
    
    this.systemPromptTemplates.set(
      AgentRole.SYSTEM_MONITOR,
      `Du bist ein System-Überwachungs-Agent, der die Leistung und den Zustand des Systems überwacht.
      Deine Aufgabe ist es, Metriken zu sammeln, Anomalien zu erkennen und Warnungen auszugeben.
      Achte besonders auf Performance-Engpässe und Sicherheitsprobleme.`
    );
    
    // Weitere Vorlagen können hier hinzugefügt werden
  }
  
  /**
   * Agent erstellen
   */
  public createAgent(config: AgentConfig): Agent {
    const agentId = uuidv4();
    const createdAt = new Date();
    
    // System-Prompt aus Vorlage verwenden, falls nicht explizit angegeben
    let systemPrompt = config.systemPrompt;
    if (!systemPrompt && this.systemPromptTemplates.has(config.role)) {
      systemPrompt = this.systemPromptTemplates.get(config.role);
    }
    
    // Agent-Namen aus Rolle generieren, falls nicht angegeben
    const name = config.name || `${config.role}-agent-${agentId.substring(0, 8)}`;
    
    // Agent-Objekt erstellen
    const agent: Agent = {
      id: agentId,
      config: {
        ...config,
        name,
        systemPrompt,
        tools: config.tools || [],
      },
      state: AgentState.IDLE,
      createdAt,
      lastActive: createdAt,
      requestCount: 0,
      successRate: 1.0, // Beginnt mit 100%
      memory: new AgentMemoryManager(config.memoryLimit || 10),
      processingTime: {
        avg: 0,
        min: 0,
        max: 0,
        total: 0
      },
      
      /**
       * Anfrage an den Agenten ausführen
       */
      execute: async (request: AgentRequest): Promise<AgentResponse> => {
        const startTime = Date.now();
        const requestId = uuidv4();
        
        try {
          // Agent-Zustand aktualisieren
          agent.state = AgentState.PLANNING;
          agent.lastActive = new Date();
          agent.requestCount++;
          
          // Event auslösen
          this.eventEmitter.emit('agent:executing', {
            agentId,
            requestId,
            timestamp: new Date()
          });
          
          // Anfrage an KI-Gateway senden
          const toolDescriptions = agent.config.tools?.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          })) || [];
          
          // Prompt zusammenbauen mit Kontext und Tools
          let fullPrompt = request.input;
          
          // Kontext hinzufügen, falls vorhanden
          if (request.context && Object.keys(request.context).length > 0) {
            fullPrompt = `Kontext:\n${JSON.stringify(request.context, null, 2)}\n\nAnfrage:\n${fullPrompt}`;
          }
          
          // Dokumente hinzufügen, falls vorhanden
          if (request.documents && request.documents.length > 0) {
            fullPrompt = `Dokumente:\n${request.documents.join('\n\n')}\n\nAnfrage:\n${fullPrompt}`;
          }
          
          // Verfügbare Tools beschreiben, falls vorhanden
          if (toolDescriptions.length > 0) {
            const toolsDescription = toolDescriptions.map(tool => 
              `${tool.name}: ${tool.description}`
            ).join('\n');
            
            fullPrompt = `Verfügbare Tools:\n${toolsDescription}\n\nAnfrage:\n${fullPrompt}`;
          }
          
          // Zustand aktualisieren
          agent.state = AgentState.EXECUTING;
          
          // Anfrage an das AI-Gateway senden
          const response = await this.aiGateway.chatCompletion({
            messages: [
              // System-Prompt als Rolle des Agenten
              { role: 'system', content: agent.config.systemPrompt || '' },
              // Bisherige Konversation aus dem Speicher einfügen, falls vorhanden
              ...(config.memory ? agent.memory.getAll().map(mem => ({
                role: mem.role,
                content: mem.content
              })) : []),
              // Aktuelle Anfrage
              { role: 'user', content: fullPrompt }
            ],
            model: agent.config.model || 'gemini-1.5-pro', // Standardmodell
            temperature: 0.7,
            max_tokens: 4000
          });
          
          // Zustand aktualisieren
          agent.state = AgentState.COMPLETED;
          
          // Antwort extrahieren
          const aiResponse = response.choices[0].message.content;
          
          // In Speicher hinzufügen, falls aktiviert
          if (config.memory) {
            agent.memory.add({
              role: 'user',
              content: fullPrompt
            });
            
            agent.memory.add({
              role: 'assistant',
              content: aiResponse
            });
          }
          
          // Verarbeitungszeiten aktualisieren
          const processingTime = Date.now() - startTime;
          agent.processingTime.total += processingTime;
          agent.processingTime.avg = agent.processingTime.total / agent.requestCount;
          
          if (agent.processingTime.min === 0 || processingTime < agent.processingTime.min) {
            agent.processingTime.min = processingTime;
          }
          
          if (processingTime > agent.processingTime.max) {
            agent.processingTime.max = processingTime;
          }
          
          // Event auslösen
          this.eventEmitter.emit('agent:completed', {
            agentId,
            requestId,
            timestamp: new Date(),
            processingTime
          });
          
          // Antwort zurückgeben
          return {
            id: requestId,
            agentId,
            timestamp: new Date(),
            output: aiResponse,
            status: 'success',
            responseFormat: request.responseFormat || 'text',
            rawResponse: response
          };
        } catch (error) {
          // Bei Fehler: Zustand aktualisieren und Fehler zurückgeben
          agent.state = AgentState.ERROR;
          agent.successRate = (agent.successRate * (agent.requestCount - 1) + 0) / agent.requestCount;
          
          // Event auslösen
          this.eventEmitter.emit('agent:error', {
            agentId,
            requestId,
            timestamp: new Date(),
            error: error instanceof Error ? error.message : String(error)
          });
          
          return {
            id: requestId,
            agentId,
            timestamp: new Date(),
            output: 'Bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten.',
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            responseFormat: request.responseFormat || 'text'
          };
        }
      },
      
      /**
       * Aktuellen Zustand abrufen
       */
      getState: (): AgentState => {
        return agent.state;
      },
      
      /**
       * Alle gespeicherten Erinnerungen abrufen
       */
      getMemory: (): any[] => {
        return agent.memory.getAll();
      },
      
      /**
       * Speicher zurücksetzen
       */
      resetMemory: (): void => {
        agent.memory.clear();
      },
      
      /**
       * Konfiguration aktualisieren
       */
      updateConfig: (updatedConfig: Partial<AgentConfig>): void => {
        agent.config = {
          ...agent.config,
          ...updatedConfig
        };
        
        // Memory-Limit aktualisieren, falls geändert
        if (updatedConfig.memoryLimit) {
          agent.memory.setLimit(updatedConfig.memoryLimit);
        }
      }
    };
    
    // Agent in der Map speichern
    this.agents.set(agentId, agent);
    
    // Event auslösen
    this.eventEmitter.emit('agent:created', {
      agentId,
      config: { ...config, systemPrompt: '***' }, // Systempromppt ausblenden
      timestamp: new Date()
    });
    
    return agent;
  }
  
  /**
   * Agent abrufen
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Alle Agenten abrufen
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Agenten nach Rolle filtern
   */
  public getAgentsByRole(role: AgentRole): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.config.role === role);
  }
  
  /**
   * Agent löschen
   */
  public deleteAgent(agentId: string): boolean {
    const deleted = this.agents.delete(agentId);
    
    if (deleted) {
      // Event auslösen
      this.eventEmitter.emit('agent:deleted', {
        agentId,
        timestamp: new Date()
      });
    }
    
    return deleted;
  }
  
  /**
   * Tool zur Bibliothek hinzufügen
   */
  public addTool(tool: AgentTool): void {
    this.toolLibrary.set(tool.name, tool);
    
    // Event auslösen
    this.eventEmitter.emit('tool:added', {
      toolName: tool.name,
      timestamp: new Date()
    });
  }
  
  /**
   * Tool aus der Bibliothek abrufen
   */
  public getTool(toolName: string): AgentTool | undefined {
    return this.toolLibrary.get(toolName);
  }
  
  /**
   * Alle verfügbaren Tools abrufen
   */
  public getAllTools(): AgentTool[] {
    return Array.from(this.toolLibrary.values());
  }
  
  /**
   * Event-Listener registrieren
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * Event-Listener entfernen
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
  
  /**
   * Agent-Factory Status abrufen
   */
  public getStatus(): {
    agentCount: number,
    toolCount: number,
    activeAgents: number
  } {
    const agents = this.getAllAgents();
    const activeAgents = agents.filter(agent => 
      agent.state === AgentState.PLANNING || 
      agent.state === AgentState.EXECUTING ||
      agent.state === AgentState.REFINING
    ).length;
    
    return {
      agentCount: agents.length,
      toolCount: this.toolLibrary.size,
      activeAgents
    };
  }
}

// Exportiere eine Singleton-Instanz für einfache Verwendung
export const archonAgentFactory = ArchonAgentFactory.getInstance();