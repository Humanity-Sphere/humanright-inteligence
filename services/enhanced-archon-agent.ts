/**
 * Erweiterter Archon-Agent
 * Kombiniert die fortschrittlichen Funktionen von fagent und Integuru mit unserer bestehenden Archon-Integration
 * 
 * Dieser Agent bietet:
 * - Erweitertes Gedächtnis-Management (kurz- und langfristig)
 * - Fortschrittliche Aufgabenplanung und -ausführung
 * - Verbesserte Problem-Erkennung und Selbstreparatur
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { createId } from '@paralleldrive/cuid2';
import logger from '../utils/logger';
import db from '../utils/db';
import advancedMemory, { MemoryType } from './advanced-memory';
import agentPlanner, { TaskGraph, TaskStatus, TaskType } from './agent-planner';
import { analyzeWithGemini } from './gemini';

// Agent-Typen
export enum AgentType {
  ASSISTANT = 'assistant',       // Allgemeiner Assistent für Benutzerinteraktionen
  SPECIALIST = 'specialist',     // Spezialisierter Agent für bestimmte Aufgaben
  SYSTEM = 'system',             // Systemagent für Überwachung und Wartung
  CURATOR = 'curator',           // Kurator für Inhaltsorganisation
  ANALYZER = 'analyzer'          // Analysator für Datenverarbeitung
}

// Agent-Status
export enum AgentStatus {
  IDLE = 'idle',                 // Bereit, aber nicht aktiv
  ACTIVE = 'active',             // Aktiv und bearbeitet Aufgaben
  PLANNING = 'planning',         // Plant die Ausführung von Aufgaben
  LEARNING = 'learning',         // Lernt aus Erfahrungen
  REPAIRING = 'repairing',       // Behebt Probleme
  ERROR = 'error'                // Fehler aufgetreten
}

// Agent-Konfiguration
export interface AgentConfig {
  name: string;
  description: string;
  type: AgentType;
  capabilities: string[];
  aiModel?: string;
  systemPrompt?: string;
  knowledgeBase?: string[];
  memorySettings?: {
    enableShortTerm: boolean;
    enableLongTerm: boolean;
    contextWindowSize: number;
  };
  autoActivate?: boolean;
  metadata?: Record<string, any>;
}

// Agent-Datenstruktur
export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  aiModel: string;
  systemPrompt: string;
  createdAt: Date;
  lastActiveAt?: Date;
  stats: {
    tasksCompleted: number;
    tasksTotal: number;
    successRate: number;
    learningEvents: number;
    repairEvents: number;
  };
  activeTaskGraphId?: string;
  metadata?: Record<string, any>;
}

// Agent-Ereignistypen
export enum AgentEventType {
  TASK_CREATED = 'task:created',
  TASK_STARTED = 'task:started',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  LEARNING_STARTED = 'learning:started',
  LEARNING_COMPLETED = 'learning:completed',
  REPAIR_STARTED = 'repair:started',
  REPAIR_COMPLETED = 'repair:completed',
  AGENT_ACTIVATED = 'agent:activated',
  AGENT_DEACTIVATED = 'agent:deactivated',
  ERROR = 'error'
}

// Agent-Ereignis
export interface AgentEvent {
  id: string;
  type: AgentEventType;
  agentId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

/**
 * Implementierung des erweiterten Archon-Agenten
 */
export class EnhancedArchonAgent {
  private static instance: EnhancedArchonAgent;
  private eventEmitter: EventEmitter;
  private agents: Map<string, Agent> = new Map();
  private activeAgents: Set<string> = new Set();
  private agentDir: string;
  private useFileSystem: boolean;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.agentDir = path.join(process.cwd(), 'local-data', 'agents');
    this.useFileSystem = process.env.USE_AGENT_FILES === 'true';
    
    // Stellt sicher, dass das Agenten-Verzeichnis existiert
    if (this.useFileSystem) {
      this.ensureAgentDirectory();
    }
    
    // Aktiviere automatisch persistente Agenten beim Start
    this.loadPersistedAgents()
      .then(agents => {
        logger.info(`${agents.length} persistierte Agenten geladen`);
        
        // Aktiviere Agenten mit autoActivate = true
        agents.forEach(agent => {
          if (agent.metadata?.autoActivate) {
            this.activateAgent(agent.userId, agent.id)
              .catch(err => logger.error(`Fehler beim Aktivieren des Agenten ${agent.id}`, err));
          }
        });
      })
      .catch(err => logger.error('Fehler beim Laden persistierter Agenten', err));
  }

  public static getInstance(): EnhancedArchonAgent {
    if (!EnhancedArchonAgent.instance) {
      EnhancedArchonAgent.instance = new EnhancedArchonAgent();
    }
    return EnhancedArchonAgent.instance;
  }

  private ensureAgentDirectory(): void {
    if (!fs.existsSync(this.agentDir)) {
      fs.mkdirSync(this.agentDir, { recursive: true });
      logger.info(`Agenten-Verzeichnis erstellt: ${this.agentDir}`);
    }
  }

  /**
   * Lädt alle persistierten Agenten
   */
  private async loadPersistedAgents(): Promise<Agent[]> {
    const agents: Agent[] = [];
    
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      try {
        if (!fs.existsSync(this.agentDir)) {
          return [];
        }
        
        const files = await fs.promises.readdir(this.agentDir);
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const filePath = path.join(this.agentDir, file);
          const data = await fs.promises.readFile(filePath, 'utf8');
          const agent = JSON.parse(data) as Agent;
          
          this.agents.set(agent.id, agent);
          agents.push(agent);
        }
      } catch (error) {
        logger.error('Fehler beim Laden persistierter Agenten aus dem Dateisystem', error);
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        const query = 'SELECT * FROM agents';
        const result = await db.query(query);
        
        for (const row of result.rows) {
          const agent = this.mapDatabaseRowToAgent(row);
          this.agents.set(agent.id, agent);
          agents.push(agent);
        }
      } catch (error) {
        logger.error('Fehler beim Laden persistierter Agenten aus der Datenbank', error);
      }
    }
    
    return agents;
  }

  /**
   * Erstellt einen neuen Agenten
   */
  public async createAgent(
    userId: string,
    config: AgentConfig
  ): Promise<Agent> {
    const id = createId();
    const now = new Date();
    
    // Standardwerte für optionale Felder setzen
    const aiModel = config.aiModel || 'gemini-1.5-pro';
    const systemPrompt = config.systemPrompt || this.getDefaultSystemPrompt(config.type);
    
    const agent: Agent = {
      id,
      userId,
      name: config.name,
      description: config.description,
      type: config.type,
      status: AgentStatus.IDLE,
      capabilities: config.capabilities,
      aiModel,
      systemPrompt,
      createdAt: now,
      stats: {
        tasksCompleted: 0,
        tasksTotal: 0,
        successRate: 0,
        learningEvents: 0,
        repairEvents: 0
      },
      metadata: {
        ...config.metadata,
        memorySettings: config.memorySettings || {
          enableShortTerm: true,
          enableLongTerm: true,
          contextWindowSize: 10
        },
        autoActivate: config.autoActivate || false
      }
    };
    
    // In Speicher und persistentem Speicher ablegen
    this.agents.set(id, agent);
    await this.saveAgent(agent);
    
    // Füge Wissen aus der Wissensbasis hinzu, falls vorhanden
    if (config.knowledgeBase && config.knowledgeBase.length > 0) {
      for (const knowledge of config.knowledgeBase) {
        await advancedMemory.createMemory(
          userId,
          id,
          knowledge,
          MemoryType.PERMANENT,
          { 
            importance: 8,
            source: 'knowledge_base',
            tags: ['knowledge_base', 'initial_knowledge']
          }
        );
      }
      
      logger.info(`${config.knowledgeBase.length} Wissenselemente für Agenten ${id} hinzugefügt`);
    }
    
    // Auto-Aktivierung, falls gewünscht
    if (config.autoActivate) {
      await this.activateAgent(userId, id);
    }
    
    logger.info(`Neuer Agent erstellt: ${id} (${config.name})`);
    return agent;
  }

  /**
   * Aktiviert einen Agenten
   */
  public async activateAgent(
    userId: string,
    agentId: string
  ): Promise<Agent | null> {
    const agent = await this.getAgent(userId, agentId);
    
    if (!agent) {
      logger.warn(`Agent ${agentId} nicht gefunden`);
      return null;
    }
    
    if (agent.status === AgentStatus.ACTIVE) {
      logger.info(`Agent ${agentId} ist bereits aktiv`);
      return agent;
    }
    
    // Status auf aktiv setzen
    agent.status = AgentStatus.ACTIVE;
    agent.lastActiveAt = new Date();
    
    // In der aktiven Agenten-Liste speichern
    this.activeAgents.add(agentId);
    
    // Persistieren
    await this.saveAgent(agent);
    
    // Ereignis auslösen
    this.emitEvent({
      id: createId(),
      type: AgentEventType.AGENT_ACTIVATED,
      agentId,
      userId,
      timestamp: new Date(),
      data: { agent }
    });
    
    logger.info(`Agent ${agentId} (${agent.name}) aktiviert`);
    return agent;
  }

  /**
   * Deaktiviert einen Agenten
   */
  public async deactivateAgent(
    userId: string,
    agentId: string
  ): Promise<Agent | null> {
    const agent = await this.getAgent(userId, agentId);
    
    if (!agent) {
      logger.warn(`Agent ${agentId} nicht gefunden`);
      return null;
    }
    
    if (agent.status !== AgentStatus.ACTIVE) {
      logger.info(`Agent ${agentId} ist nicht aktiv`);
      return agent;
    }
    
    // Status zurücksetzen
    agent.status = AgentStatus.IDLE;
    
    // Aus der aktiven Agenten-Liste entfernen
    this.activeAgents.delete(agentId);
    
    // Laufende Aufgaben abbrechen
    if (agent.activeTaskGraphId) {
      await agentPlanner.cancelGraph(agent.activeTaskGraphId);
      agent.activeTaskGraphId = undefined;
    }
    
    // Persistieren
    await this.saveAgent(agent);
    
    // Ereignis auslösen
    this.emitEvent({
      id: createId(),
      type: AgentEventType.AGENT_DEACTIVATED,
      agentId,
      userId,
      timestamp: new Date(),
      data: { agent }
    });
    
    logger.info(`Agent ${agentId} (${agent.name}) deaktiviert`);
    return agent;
  }

  /**
   * Führt einen Auftrag mit einem Agenten aus
   */
  public async executeTask(
    userId: string,
    agentId: string,
    task: string,
    inputs: Record<string, any> = {}
  ): Promise<any> {
    const agent = await this.getAgent(userId, agentId);
    
    if (!agent) {
      logger.warn(`Agent ${agentId} nicht gefunden`);
      throw new Error(`Agent ${agentId} nicht gefunden`);
    }
    
    // Aktiviere den Agenten, falls er nicht aktiv ist
    if (agent.status !== AgentStatus.ACTIVE) {
      await this.activateAgent(userId, agentId);
    }
    
    // Erstelle einen Aufgabengraphen
    const graph = await agentPlanner.createTaskGraph(
      userId,
      agentId,
      `Aufgabe: ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}`,
      task,
      [
        {
          name: task,
          description: task,
          type: TaskType.GENERATION,
          priority: 10,
          dependencies: [],
          inputs
        }
      ]
    );
    
    // Speichere den aktiven Graphen im Agenten
    agent.activeTaskGraphId = graph.id;
    await this.saveAgent(agent);
    
    // Starte die Ausführung des Graphen
    const updatedGraph = await agentPlanner.startGraph(graph.id);
    if (!updatedGraph) {
      throw new Error(`Konnte Aufgabengraph ${graph.id} nicht starten`);
    }
    
    // Führe die Aufgaben aus
    return this.continueTaskGraph(userId, agentId, updatedGraph);
  }

  /**
   * Führt einen Task-Graphen weiter aus, bis er vollständig ist
   */
  private async continueTaskGraph(
    userId: string,
    agentId: string,
    graph: TaskGraph
  ): Promise<any> {
    // Prüfen, ob der Graph bereits abgeschlossen oder fehlgeschlagen ist
    if (graph.status === 'COMPLETED') {
      // Sammle Ergebnisse
      const results: Record<string, any> = {};
      for (const taskId in graph.tasks) {
        const task = graph.tasks[taskId];
        if (task.status === TaskStatus.COMPLETED) {
          results[task.id] = task.outputs;
        }
      }
      
      // Aktualisiere Agenten-Statistiken
      const agent = await this.getAgent(userId, agentId);
      if (agent) {
        agent.stats.tasksCompleted += 1;
        agent.stats.tasksTotal += 1;
        agent.stats.successRate = agent.stats.tasksCompleted / agent.stats.tasksTotal;
        agent.activeTaskGraphId = undefined;
        await this.saveAgent(agent);
      }
      
      return results;
    } else if (graph.status === 'FAILED' || graph.status === 'CANCELLED') {
      // Sammle Fehlerinformationen
      const errors: Record<string, string> = {};
      for (const taskId in graph.tasks) {
        const task = graph.tasks[taskId];
        if (task.status === TaskStatus.FAILED && task.error) {
          errors[task.id] = task.error;
        }
      }
      
      // Aktualisiere Agenten-Statistiken
      const agent = await this.getAgent(userId, agentId);
      if (agent) {
        agent.stats.tasksTotal += 1;
        agent.stats.successRate = agent.stats.tasksCompleted / agent.stats.tasksTotal;
        agent.activeTaskGraphId = undefined;
        await this.saveAgent(agent);
      }
      
      throw new Error(`Aufgabenausführung fehlgeschlagen: ${JSON.stringify(errors)}`);
    }
    
    // Hole die nächste auszuführende Aufgabe
    const nextTask = agentPlanner.getNextTask(graph);
    
    if (!nextTask) {
      if (Object.values(graph.tasks).every(task => 
        task.status === TaskStatus.COMPLETED || 
        task.status === TaskStatus.FAILED || 
        task.status === TaskStatus.CANCELLED)) {
        // Alle Aufgaben sind abgeschlossen, fehlgeschlagen oder abgebrochen
        // Aktualisiere den Graph-Status
        const updatedGraph = await agentPlanner.updateTask(
          graph.id, 
          Object.keys(graph.tasks)[0], 
          {}
        );
        
        return this.continueTaskGraph(userId, agentId, updatedGraph!);
      } else {
        // Es gibt keine ausführbare Aufgabe, aber nicht alle sind abgeschlossen
        throw new Error('Keine ausführbaren Aufgaben gefunden, aber der Graph ist nicht vollständig');
      }
    }
    
    // Führe die Aufgabe aus
    try {
      // Markiere die Aufgabe als in Bearbeitung
      const updatedGraph = await agentPlanner.updateTask(
        graph.id,
        nextTask.id,
        { status: TaskStatus.IN_PROGRESS }
      );
      
      if (!updatedGraph) {
        throw new Error(`Konnte Aufgabe ${nextTask.id} nicht aktualisieren`);
      }
      
      // Verarbeite die Aufgabe
      const result = await this.processTask(userId, agentId, nextTask);
      
      // Markiere die Aufgabe als abgeschlossen
      const completedGraph = await agentPlanner.updateTask(
        graph.id,
        nextTask.id,
        { 
          status: TaskStatus.COMPLETED,
          outputs: result
        }
      );
      
      if (!completedGraph) {
        throw new Error(`Konnte Aufgabe ${nextTask.id} nicht als abgeschlossen markieren`);
      }
      
      // Setze die Ausführung des Graphen fort
      return this.continueTaskGraph(userId, agentId, completedGraph);
    } catch (error) {
      // Markiere die Aufgabe als fehlgeschlagen
      const failedGraph = await agentPlanner.updateTask(
        graph.id,
        nextTask.id,
        { 
          status: TaskStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        }
      );
      
      if (!failedGraph) {
        throw new Error(`Konnte Aufgabe ${nextTask.id} nicht als fehlgeschlagen markieren`);
      }
      
      // Setze die Ausführung des Graphen fort, um zu sehen, ob wir weitere Aufgaben ausführen können
      return this.continueTaskGraph(userId, agentId, failedGraph);
    }
  }

  /**
   * Verarbeitet eine einzelne Aufgabe
   */
  private async processTask(
    userId: string,
    agentId: string,
    task: any
  ): Promise<any> {
    const agent = await this.getAgent(userId, agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} nicht gefunden`);
    }
    
    // Bereite den Kontext für die KI vor
    const memories = await advancedMemory.queryMemories({
      userId,
      agentId,
      limit: 20
    });
    
    // Kontextfenster für die KI basierend auf Agenten-Einstellungen
    const contextWindowSize = agent.metadata?.memorySettings?.contextWindowSize || 10;
    
    // Sortiere nach Typ und Wichtigkeit
    const conversationMemories = memories
      .filter(m => m.type === MemoryType.SHORT_TERM)
      .sort((a, b) => b.metadata.importance - a.metadata.importance)
      .slice(0, contextWindowSize);
    
    const knowledgeMemories = memories
      .filter(m => m.type === MemoryType.PERMANENT)
      .sort((a, b) => b.metadata.importance - a.metadata.importance)
      .slice(0, contextWindowSize);
    
    // Baue den Prompt auf
    const prompt = `
Du bist ein KI-Agent namens "${agent.name}". ${agent.systemPrompt}

Deine Aufgabe ist: ${task.description}

${conversationMemories.length > 0 ? `Kürzliche Konversation:
${conversationMemories.map(c => `- ${c.content}`).join('\n')}` : ''}

${knowledgeMemories.length > 0 ? `Relevantes Wissen:
${knowledgeMemories.map(k => `- ${k.content}`).join('\n')}` : ''}

Aufgabeninformationen:
${JSON.stringify(task.inputs, null, 2)}

Bearbeite diese Aufgabe Schritt für Schritt. Gib deine Antwort im JSON-Format zurück.
`;
    
    // Führe die KI-Anfrage aus
    try {
      const response = await analyzeWithGemini(prompt, {
        model: agent.aiModel
      });
      
      // Speichere die Antwort im Gedächtnis
      await advancedMemory.createMemory(
        userId,
        agentId,
        `Aufgabe: ${task.description}\nAntwort: ${response}`,
        MemoryType.SHORT_TERM,
        {
          importance: 7,
          source: 'task_execution',
          tags: ['task', 'response']
        }
      );
      
      // Versuche, die Antwort als JSON zu parsen
      try {
        return JSON.parse(response);
      } catch (error) {
        // Wenn das Parsen fehlschlägt, gib die Antwort als Zeichenkette zurück
        return { result: response };
      }
    } catch (error) {
      logger.error(`Fehler bei der Ausführung der Aufgabe ${task.id}`, error);
      
      // Speichere den Fehler im Gedächtnis
      await advancedMemory.createMemory(
        userId,
        agentId,
        `Fehler bei Aufgabe: ${task.description}\nFehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        MemoryType.SHORT_TERM,
        {
          importance: 9,
          source: 'task_execution',
          tags: ['task', 'error']
        }
      );
      
      throw error;
    }
  }

  /**
   * Ruft einen Agenten ab
   */
  public async getAgent(
    userId: string,
    agentId: string
  ): Promise<Agent | null> {
    // Zuerst im Speicher suchen
    const cachedAgent = this.agents.get(agentId);
    if (cachedAgent && cachedAgent.userId === userId) {
      return cachedAgent;
    }
    
    // Wenn nicht im Speicher, aus dem persistenten Speicher laden
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      const filePath = path.join(this.agentDir, `${agentId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const agent = JSON.parse(data) as Agent;
        
        // Prüfen, ob der Agent dem angegebenen Benutzer gehört
        if (agent.userId !== userId) {
          return null;
        }
        
        // Im Speicher zwischenspeichern
        this.agents.set(agentId, agent);
        
        return agent;
      } catch (error) {
        logger.error(`Fehler beim Laden des Agenten ${agentId}`, error);
        return null;
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        const query = 'SELECT * FROM agents WHERE id = $1 AND user_id = $2';
        const result = await db.query(query, [agentId, userId]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const agent: Agent = {
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          name: result.rows[0].name,
          description: result.rows[0].description,
          type: result.rows[0].type as AgentType,
          status: result.rows[0].status as AgentStatus,
          capabilities: result.rows[0].capabilities,
          aiModel: result.rows[0].ai_model,
          systemPrompt: result.rows[0].system_prompt,
          createdAt: new Date(result.rows[0].created_at),
          lastActiveAt: result.rows[0].last_active_at ? new Date(result.rows[0].last_active_at) : undefined,
          stats: typeof result.rows[0].stats === 'string' 
            ? JSON.parse(result.rows[0].stats) 
            : result.rows[0].stats,
          activeTaskGraphId: result.rows[0].active_task_graph_id,
          metadata: typeof result.rows[0].metadata === 'string' 
            ? JSON.parse(result.rows[0].metadata) 
            : result.rows[0].metadata
        };
        
        // Im Speicher zwischenspeichern
        this.agents.set(agentId, agent);
        
        return agent;
      } catch (error) {
        logger.error(`Fehler beim Abrufen des Agenten ${agentId} aus der Datenbank`, error);
        return null;
      }
    }
  }

  /**
   * Ruft alle Agenten eines Benutzers ab
   */
  public async getUserAgents(userId: string): Promise<Agent[]> {
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      try {
        // Stelle sicher, dass das Verzeichnis existiert
        if (!fs.existsSync(this.agentDir)) {
          return [];
        }
        
        const files = await fs.promises.readdir(this.agentDir);
        const agents: Agent[] = [];
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const filePath = path.join(this.agentDir, file);
          const data = await fs.promises.readFile(filePath, 'utf8');
          const agent = JSON.parse(data) as Agent;
          
          if (agent.userId === userId) {
            // Im Speicher zwischenspeichern
            this.agents.set(agent.id, agent);
            agents.push(agent);
          }
        }
        
        return agents;
      } catch (error) {
        logger.error(`Fehler beim Abrufen der Agenten für Benutzer ${userId}`, error);
        return [];
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        const query = 'SELECT * FROM agents WHERE user_id = $1';
        const result = await db.query(query, [userId]);
        
        const agents: Agent[] = result.rows.map(row => this.mapDatabaseRowToAgent(row));
        
        // Im Speicher zwischenspeichern
        agents.forEach(agent => this.agents.set(agent.id, agent));
        
        return agents;
      } catch (error) {
        logger.error(`Fehler beim Abrufen der Agenten für Benutzer ${userId} aus der Datenbank`, error);
        return [];
      }
    }
  }

  /**
   * Konvertiert eine Datenbankzeile in ein Agent-Objekt
   */
  private mapDatabaseRowToAgent(row: any): Agent {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      type: row.type as AgentType,
      status: row.status as AgentStatus,
      capabilities: row.capabilities,
      aiModel: row.ai_model,
      systemPrompt: row.system_prompt,
      createdAt: new Date(row.created_at),
      lastActiveAt: row.last_active_at ? new Date(row.last_active_at) : undefined,
      stats: typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats,
      activeTaskGraphId: row.active_task_graph_id,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    };
  }

  /**
   * Aktualisiert einen Agenten
   */
  public async updateAgent(
    userId: string,
    agentId: string,
    updates: Partial<AgentConfig>
  ): Promise<Agent | null> {
    const agent = await this.getAgent(userId, agentId);
    
    if (!agent) {
      return null;
    }
    
    // Aktualisiere die Felder
    if (updates.name) agent.name = updates.name;
    if (updates.description) agent.description = updates.description;
    if (updates.capabilities) agent.capabilities = updates.capabilities;
    if (updates.aiModel) agent.aiModel = updates.aiModel;
    if (updates.systemPrompt) agent.systemPrompt = updates.systemPrompt;
    
    // Aktualisiere Metadaten
    if (updates.metadata) {
      agent.metadata = {
        ...agent.metadata,
        ...updates.metadata
      };
    }
    
    // Aktualisiere Gedächtniseinstellungen
    if (updates.memorySettings) {
      agent.metadata = {
        ...agent.metadata,
        memorySettings: {
          ...agent.metadata?.memorySettings,
          ...updates.memorySettings
        }
      };
    }
    
    // Wissensbasis aktualisieren
    if (updates.knowledgeBase && updates.knowledgeBase.length > 0) {
      // Bestehende Wissensbasis löschen
      // TODO: Implementiere eine Methode zum selektiven Löschen von Wissen
      
      // Neue Wissensbasis hinzufügen
      for (const knowledge of updates.knowledgeBase) {
        await advancedMemory.createMemory(
          userId,
          agentId,
          knowledge,
          MemoryType.PERMANENT,
          { 
            importance: 8,
            source: 'knowledge_base',
            tags: ['knowledge_base', 'updated_knowledge']
          }
        );
      }
      
      logger.info(`${updates.knowledgeBase.length} Wissenselemente für Agenten ${agentId} aktualisiert`);
    }
    
    // Speichern
    await this.saveAgent(agent);
    
    return agent;
  }

  /**
   * Löscht einen Agenten
   */
  public async deleteAgent(
    userId: string,
    agentId: string
  ): Promise<boolean> {
    const agent = await this.getAgent(userId, agentId);
    
    if (!agent) {
      return false;
    }
    
    // Deaktiviere den Agenten zuerst
    if (agent.status === AgentStatus.ACTIVE) {
      await this.deactivateAgent(userId, agentId);
    }
    
    // Lösche den Agenten aus dem Speicher
    this.agents.delete(agentId);
    
    // Lösche alle Aufgabengraphen des Agenten
    const graphs = await agentPlanner.getAgentTaskGraphs(userId, agentId);
    for (const graph of graphs) {
      await agentPlanner.deleteGraph(graph.id);
    }
    
    // Lösche alle Erinnerungen des Agenten
    await advancedMemory.deleteAgentMemories(userId, agentId);
    
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      const filePath = path.join(this.agentDir, `${agentId}.json`);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          logger.info(`Agent ${agentId} erfolgreich gelöscht`);
          return true;
        } catch (error) {
          logger.error(`Fehler beim Löschen des Agenten ${agentId}`, error);
          return false;
        }
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        const query = 'DELETE FROM agents WHERE id = $1 AND user_id = $2';
        await db.query(query, [agentId, userId]);
        
        logger.info(`Agent ${agentId} erfolgreich gelöscht`);
        return true;
      } catch (error) {
        logger.error(`Fehler beim Löschen des Agenten ${agentId} aus der Datenbank`, error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Ruft den aktuellen Aufgabengraphen eines Agenten ab
   */
  public async getCurrentTaskGraph(
    userId: string,
    agentId: string
  ): Promise<TaskGraph | null> {
    const agent = await this.getAgent(userId, agentId);
    
    if (!agent || !agent.activeTaskGraphId) {
      return null;
    }
    
    return agentPlanner.getTaskGraph(agent.activeTaskGraphId);
  }

  /**
   * Speichert einen Agenten in der persistenten Speicherung
   */
  private async saveAgent(agent: Agent): Promise<void> {
    // Aktualisiere den Agenten im Speicher
    this.agents.set(agent.id, agent);
    
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      const filePath = path.join(this.agentDir, `${agent.id}.json`);
      
      try {
        await fs.promises.writeFile(filePath, JSON.stringify(agent, null, 2), 'utf8');
      } catch (error) {
        logger.error(`Fehler beim Speichern des Agenten ${agent.id}`, error);
        throw error;
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        const query = `
          INSERT INTO agents (
            id, user_id, name, description, type, status, capabilities, 
            ai_model, system_prompt, created_at, last_active_at, stats, 
            active_task_graph_id, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            capabilities = EXCLUDED.capabilities,
            ai_model = EXCLUDED.ai_model,
            system_prompt = EXCLUDED.system_prompt,
            last_active_at = EXCLUDED.last_active_at,
            stats = EXCLUDED.stats,
            active_task_graph_id = EXCLUDED.active_task_graph_id,
            metadata = EXCLUDED.metadata
        `;
        
        const params = [
          agent.id,
          agent.userId,
          agent.name,
          agent.description,
          agent.type,
          agent.status,
          agent.capabilities,
          agent.aiModel,
          agent.systemPrompt,
          agent.createdAt.toISOString(),
          agent.lastActiveAt ? agent.lastActiveAt.toISOString() : null,
          JSON.stringify(agent.stats),
          agent.activeTaskGraphId,
          JSON.stringify(agent.metadata)
        ];
        
        await db.query(query, params);
      } catch (error) {
        logger.error(`Fehler beim Speichern des Agenten ${agent.id} in der Datenbank`, error);
        throw error;
      }
    }
  }

  /**
   * Registriert einen Ereignis-Listener
   */
  public addEventListener(
    type: AgentEventType | 'all',
    listener: (event: AgentEvent) => void
  ): void {
    this.eventEmitter.on(type, listener);
  }

  /**
   * Entfernt einen Ereignis-Listener
   */
  public removeEventListener(
    type: AgentEventType | 'all',
    listener: (event: AgentEvent) => void
  ): void {
    this.eventEmitter.off(type, listener);
  }

  /**
   * Sendet ein Ereignis
   */
  private emitEvent(event: AgentEvent): void {
    this.eventEmitter.emit(event.type, event);
    this.eventEmitter.emit('all', event);
  }

  /**
   * Erzeugt einen Standard-System-Prompt basierend auf dem Agententyp
   */
  private getDefaultSystemPrompt(type: AgentType): string {
    switch (type) {
      case AgentType.ASSISTANT:
        return `Du bist ein hilfsbereiter Assistent, der Benutzern bei einer Vielzahl von Aufgaben hilft. Du beantwortest Fragen, löst Probleme und gibst nützliche Informationen. Deine Antworten sind freundlich, präzise und hilfreich.`;
      
      case AgentType.SPECIALIST:
        return `Du bist ein Spezialist mit tiefgreifendem Fachwissen in deinem Fachgebiet. Du gibst detaillierte, fundierte Antworten und kannst komplexe Probleme in deinem Spezialgebiet lösen. Deine Antworten sind präzise, technisch korrekt und fundiert.`;
      
      case AgentType.SYSTEM:
        return `Du bist ein System-Agent, der für Überwachung und Wartung verantwortlich ist. Du identifizierst und behebst Probleme proaktiv. Deine Antworten sind klar, präzise und technisch orientiert. Du behältst immer den Systemzustand im Auge.`;
      
      case AgentType.CURATOR:
        return `Du bist ein Kurator, der Informationen und Inhalte organisiert, kategorisiert und präsentiert. Du hilfst Benutzern, relevante Informationen zu finden und stellst sie in sinnvoller, strukturierter Weise dar. Deine Antworten sind gut organisiert und kontextbezogen.`;
      
      case AgentType.ANALYZER:
        return `Du bist ein Analysator, der Daten untersucht, Muster erkennt und Erkenntnisse gewinnt. Du führst gründliche Analysen durch und ziehst fundierte Schlussfolgerungen. Deine Antworten sind analytisch, faktenbasiert und enthalten datengestützte Erkenntnisse.`;
      
      default:
        return `Du bist ein KI-Agent, der Benutzern bei verschiedenen Aufgaben hilft. Du bist freundlich, hilfsbereit und bestrebt, nützliche und genaue Informationen zu liefern.`;
    }
  }
}

export const enhancedArchonAgent = EnhancedArchonAgent.getInstance();
export default enhancedArchonAgent;