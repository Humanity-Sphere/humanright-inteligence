/**
 * Agent-Planner
 * Verwaltet Aufgaben und deren Abhängigkeiten für KI-Agenten
 */

import fs from 'fs';
import path from 'path';
import { createId } from '@paralleldrive/cuid2';
import logger from '../utils/logger';

// Typen für Aufgaben und Graphen
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskType {
  ANALYSIS = 'analysis',
  EXTRACTION = 'extraction',
  GENERATION = 'generation',
  TRANSFORMATION = 'transformation',
  INTEGRATION = 'integration',
  MONITORING = 'monitoring',
  NOTIFICATION = 'notification',
  REPAIR = 'repair',
  LEARNING = 'learning'
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type?: TaskType;
  status: TaskStatus;
  priority: number; // 1-10, höher = wichtiger
  dependencies: string[]; // IDs der Aufgaben, von denen diese abhängt
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeout?: number; // Timeout in Millisekunden
}

export enum TaskGraphStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface TaskGraph {
  id: string;
  userId: string;
  agentId: string;
  name: string;
  description: string;
  tasks: Record<string, Task>;
  status: TaskGraphStatus;
  progress: number; // 0-100%
  currentTaskId?: string;
  createdAt: Date;
  completedAt?: Date;
  context: Record<string, any>; // Gemeinsamer Kontext für alle Aufgaben
}

export class AgentPlanner {
  private static instance: AgentPlanner;
  private graphsDir: string;
  private useFileSystem: boolean;
  private activeGraphs: Map<string, TaskGraph>;

  private constructor() {
    this.graphsDir = path.join(process.cwd(), 'local-data', 'task-graphs');
    this.useFileSystem = process.env.USE_GRAPH_FILES === 'true';
    this.activeGraphs = new Map();
    
    // Stellt sicher, dass das Verzeichnis existiert
    if (this.useFileSystem) {
      this.ensureGraphsDirectory();
    }
  }

  public static getInstance(): AgentPlanner {
    if (!AgentPlanner.instance) {
      AgentPlanner.instance = new AgentPlanner();
    }
    return AgentPlanner.instance;
  }

  private ensureGraphsDirectory(): void {
    if (!fs.existsSync(this.graphsDir)) {
      fs.mkdirSync(this.graphsDir, { recursive: true });
      logger.info(`Aufgabengraphen-Verzeichnis erstellt: ${this.graphsDir}`);
    }
  }

  /**
   * Erstellt einen neuen Aufgabengraphen
   */
  public createTaskGraph(
    userId: string,
    agentId: string,
    name: string,
    description: string,
    initialTasks: Omit<Task, 'id' | 'status' | 'createdAt' | 'outputs'>[] = [],
    context: Record<string, any> = {}
  ): TaskGraph {
    const id = createId();
    const now = new Date();
    
    // Aufgaben erstellen und in ein Record-Objekt umwandeln
    const tasks: Record<string, Task> = {};
    
    for (const taskData of initialTasks) {
      const taskId = createId();
      tasks[taskId] = {
        id: taskId,
        name: taskData.name,
        description: taskData.description,
        type: taskData.type,
        status: TaskStatus.PENDING,
        priority: taskData.priority,
        dependencies: taskData.dependencies,
        inputs: taskData.inputs || {},
        outputs: {},
        createdAt: now,
        timeout: taskData.timeout
      };
    }
    
    const graph: TaskGraph = {
      id,
      userId,
      agentId,
      name,
      description,
      tasks,
      status: TaskGraphStatus.PENDING,
      progress: 0,
      createdAt: now,
      context
    };
    
    // Speichern des Graphen
    this.saveGraph(graph);
    
    // Im Speicher halten
    this.activeGraphs.set(id, graph);
    
    logger.info(`Neuer Aufgabengraph erstellt: ${id} (${name})`);
    return graph;
  }

  /**
   * Speichert einen Aufgabengraphen
   */
  private async saveGraph(graph: TaskGraph): Promise<void> {
    if (this.useFileSystem) {
      // Dateisystem-basierte Speicherung
      const filePath = path.join(this.graphsDir, `${graph.id}.json`);
      
      try {
        await fs.promises.writeFile(filePath, JSON.stringify(graph, null, 2), 'utf8');
      } catch (error) {
        logger.error(`Fehler beim Speichern des Aufgabengraphen ${graph.id}`, error);
        throw error;
      }
    } else {
      // Hier könnte Datenbanklogik implementiert werden
      // Fürs Erste stellen wir sicher, dass der Graph im Speicher ist
      this.activeGraphs.set(graph.id, graph);
    }
  }

  /**
   * Lädt einen Aufgabengraphen
   */
  public async getTaskGraph(graphId: string): Promise<TaskGraph | null> {
    // Zuerst im Speicher suchen
    if (this.activeGraphs.has(graphId)) {
      return this.activeGraphs.get(graphId) || null;
    }
    
    if (this.useFileSystem) {
      // Dateisystem-basierte Ladung
      const filePath = path.join(this.graphsDir, `${graphId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const graph = JSON.parse(data) as TaskGraph;
        
        // In den aktiven Graphen speichern
        this.activeGraphs.set(graphId, graph);
        
        return graph;
      } catch (error) {
        logger.error(`Fehler beim Laden des Aufgabengraphen ${graphId}`, error);
        return null;
      }
    } else {
      // Hier könnte Datenbanklogik implementiert werden
      return null;
    }
  }

  /**
   * Ruft alle Aufgabengraphen eines Agenten ab
   */
  public async getAgentTaskGraphs(userId: string, agentId: string): Promise<TaskGraph[]> {
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      try {
        // Stelle sicher, dass das Verzeichnis existiert
        if (!fs.existsSync(this.graphsDir)) {
          return [];
        }
        
        const files = await fs.promises.readdir(this.graphsDir);
        const graphs: TaskGraph[] = [];
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const filePath = path.join(this.graphsDir, file);
          const data = await fs.promises.readFile(filePath, 'utf8');
          const graph = JSON.parse(data) as TaskGraph;
          
          if (graph.userId === userId && graph.agentId === agentId) {
            graphs.push(graph);
          }
        }
        
        return graphs;
      } catch (error) {
        logger.error(`Fehler beim Abrufen der Aufgabengraphen für Agenten ${agentId}`, error);
        return [];
      }
    } else {
      // Hier könnte Datenbanklogik implementiert werden
      // Für jetzt geben wir nur die im Speicher befindlichen Graphen zurück
      return Array.from(this.activeGraphs.values())
        .filter(graph => graph.userId === userId && graph.agentId === agentId);
    }
  }

  /**
   * Erstellt einen Aufgabenplanungsgraphen
   */
  public async createTaskPlanningGraph(
    userId: string,
    agentId: string,
    goal: string
  ): Promise<TaskGraph> {
    // Einfacher Planungsgraph mit einer einzigen "Planungsaufgabe"
    const planningTask: Omit<Task, 'id' | 'status' | 'createdAt' | 'outputs'> = {
      name: 'Aufgabe planen',
      description: `Erstelle einen Plan, um das Ziel "${goal}" zu erreichen`,
      type: 'TASK_PLANNING' as any, // Da wir TaskType verwenden
      priority: 10, // Höchste Priorität
      dependencies: [],
      inputs: { goal }
    };
    
    return this.createTaskGraph(
      userId,
      agentId,
      `Plan für: ${goal}`,
      `Aufgabenplanung für das Ziel: ${goal}`,
      [planningTask],
      { originalGoal: goal }
    );
  }

  /**
   * Erstellt einen neuen Aufgabengraphen basierend auf einem Plan
   */
  public async createTaskExecutionGraphFromPlan(
    userId: string,
    agentId: string,
    plan: any, // Der Plan enthält Aufgaben und deren Abhängigkeiten
    context: Record<string, any> = {}
  ): Promise<TaskGraph> {
    const tasks: Omit<Task, 'id' | 'status' | 'createdAt' | 'outputs'>[] = [];
    
    // Zuerst Aufgaben ohne die Abhängigkeiten erstellen
    const taskIdMap: Record<string, string> = {};
    
    for (const planTask of plan.tasks) {
      const tempId = createId();
      taskIdMap[planTask.id] = tempId;
      
      tasks.push({
        name: planTask.name,
        description: planTask.description,
        type: planTask.type,
        priority: planTask.priority || 5,
        dependencies: [], // Wir fügen die Abhängigkeiten später hinzu
        inputs: planTask.inputs || {},
        timeout: planTask.timeout
      });
    }
    
    // Jetzt die Abhängigkeiten aktualisieren
    for (let i = 0; i < plan.tasks.length; i++) {
      const planTask = plan.tasks[i];
      if (planTask.dependsOn && planTask.dependsOn.length > 0) {
        for (const depId of planTask.dependsOn) {
          const mappedDepId = taskIdMap[depId];
          if (mappedDepId) {
            tasks[i].dependencies.push(mappedDepId);
          }
        }
      }
    }
    
    return this.createTaskGraph(
      userId,
      agentId,
      plan.name || 'Ausführungsplan',
      plan.description || 'Automatisch generierter Ausführungsplan',
      tasks,
      { ...context, originalPlan: plan }
    );
  }

  /**
   * Aktualisiert eine Aufgabe in einem Graphen
   */
  public async updateTask(
    graphId: string,
    taskId: string,
    updates: Partial<Omit<Task, 'id'>>
  ): Promise<TaskGraph | null> {
    const graph = await this.getTaskGraph(graphId);
    
    if (!graph || !graph.tasks[taskId]) {
      return null;
    }
    
    // Aktualisiere die Aufgabe
    graph.tasks[taskId] = {
      ...graph.tasks[taskId],
      ...updates
    };
    
    // Wenn die Aufgabe abgeschlossen oder fehlgeschlagen ist, setzen wir das Datum
    if (updates.status === TaskStatus.COMPLETED || updates.status === TaskStatus.FAILED) {
      graph.tasks[taskId].completedAt = new Date();
    }
    
    // Wenn die Aufgabe gestartet wird, setzen wir das Startdatum
    if (updates.status === TaskStatus.IN_PROGRESS && !graph.tasks[taskId].startedAt) {
      graph.tasks[taskId].startedAt = new Date();
    }
    
    // Aktualisiere den Graphenstatus und -fortschritt
    this.updateGraphStatus(graph);
    
    // Speichern und zurückgeben
    await this.saveGraph(graph);
    return graph;
  }

  /**
   * Aktualisiert den Status und Fortschritt eines Graphen
   */
  private updateGraphStatus(graph: TaskGraph): void {
    const totalTasks = Object.keys(graph.tasks).length;
    
    if (totalTasks === 0) {
      graph.status = TaskGraphStatus.COMPLETED;
      graph.progress = 100;
      graph.completedAt = new Date();
      return;
    }
    
    // Zähle Aufgaben nach Status
    let completed = 0;
    let failed = 0;
    let inProgress = 0;
    
    for (const taskId in graph.tasks) {
      const task = graph.tasks[taskId];
      
      if (task.status === TaskStatus.COMPLETED) {
        completed++;
      } else if (task.status === TaskStatus.FAILED) {
        failed++;
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        inProgress++;
      }
    }
    
    // Aktualisiere Fortschritt
    graph.progress = Math.round((completed / totalTasks) * 100);
    
    // Aktualisiere Status
    if (completed === totalTasks) {
      graph.status = TaskGraphStatus.COMPLETED;
      graph.completedAt = new Date();
    } else if (failed > 0 && completed + failed === totalTasks) {
      graph.status = TaskGraphStatus.FAILED;
      graph.completedAt = new Date();
    } else if (inProgress > 0) {
      graph.status = TaskGraphStatus.IN_PROGRESS;
    }
  }

  /**
   * Gibt die nächste auszuführende Aufgabe zurück
   */
  public getNextTask(graph: TaskGraph): Task | null {
    // Wenn der Graph nicht ausstehend oder in Bearbeitung ist, gibt es keine nächste Aufgabe
    if (graph.status !== TaskGraphStatus.PENDING && graph.status !== TaskGraphStatus.IN_PROGRESS) {
      return null;
    }
    
    // Liste der Aufgaben nach Priorität sortiert
    const sortedTasks = Object.values(graph.tasks)
      .filter(task => task.status === TaskStatus.PENDING)
      .sort((a, b) => b.priority - a.priority);
    
    for (const task of sortedTasks) {
      // Überprüfe, ob alle Abhängigkeiten erfüllt sind
      const allDependenciesMet = task.dependencies.every(depId => {
        const depTask = graph.tasks[depId];
        return depTask && depTask.status === TaskStatus.COMPLETED;
      });
      
      if (allDependenciesMet) {
        return task;
      }
    }
    
    return null;
  }

  /**
   * Startet die Ausführung eines Graphen
   */
  public async startGraph(graphId: string): Promise<TaskGraph | null> {
    const graph = await this.getTaskGraph(graphId);
    
    if (!graph || graph.status !== TaskGraphStatus.PENDING) {
      return null;
    }
    
    // Setze den Status auf "In Bearbeitung"
    graph.status = TaskGraphStatus.IN_PROGRESS;
    
    // Speichern und zurückgeben
    await this.saveGraph(graph);
    return graph;
  }

  /**
   * Bricht die Ausführung eines Graphen ab
   */
  public async cancelGraph(graphId: string): Promise<TaskGraph | null> {
    const graph = await this.getTaskGraph(graphId);
    
    if (!graph || (graph.status !== TaskGraphStatus.PENDING && graph.status !== TaskGraphStatus.IN_PROGRESS)) {
      return null;
    }
    
    // Setze den Status auf "Abgebrochen"
    graph.status = TaskGraphStatus.CANCELLED;
    graph.completedAt = new Date();
    
    // Setze alle ausstehenden und in Bearbeitung befindlichen Aufgaben auf "Abgebrochen"
    for (const taskId in graph.tasks) {
      const task = graph.tasks[taskId];
      if (task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS) {
        task.status = TaskStatus.CANCELLED;
      }
    }
    
    // Speichern und zurückgeben
    await this.saveGraph(graph);
    return graph;
  }

  /**
   * Gibt eine visualisierbare Darstellung des Graphen zurück
   */
  public getGraphVisualization(graph: TaskGraph): any {
    const nodes = Object.values(graph.tasks).map(task => ({
      id: task.id,
      label: task.name,
      description: task.description,
      status: task.status,
      type: task.type,
      priority: task.priority
    }));
    
    let edges = [];
    
    for (const taskId in graph.tasks) {
      const task = graph.tasks[taskId];
      
      for (const depId of task.dependencies) {
        edges.push({
          source: depId,
          target: taskId
        });
      }
    }
    
    return {
      nodes,
      edges,
      id: graph.id,
      name: graph.name,
      description: graph.description,
      status: graph.status,
      progress: graph.progress
    };
  }

  /**
   * Löscht einen Aufgabengraphen
   */
  public async deleteGraph(graphId: string): Promise<boolean> {
    // Aus dem Speicher entfernen
    this.activeGraphs.delete(graphId);
    
    if (this.useFileSystem) {
      // Dateisystem-basierte Löschung
      const filePath = path.join(this.graphsDir, `${graphId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      try {
        await fs.promises.unlink(filePath);
        return true;
      } catch (error) {
        logger.error(`Fehler beim Löschen des Aufgabengraphen ${graphId}`, error);
        return false;
      }
    } else {
      // Hier könnte Datenbanklogik implementiert werden
      return true;
    }
  }
}

export const agentPlanner = AgentPlanner.getInstance();
export default agentPlanner;