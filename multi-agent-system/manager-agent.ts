/**
 * Manager Agent - Koordiniert komplexe Aufgaben zwischen verschiedenen Agenten
 * 
 * Dieser Agent ist verantwortlich für:
 * - Analyse von Benutzeranfragen und Identifikation der benötigten Agentenarten
 * - Verteilung von Teilaufgaben an entsprechende spezialisierte Agenten
 * - Zusammenführung von Teilergebnissen in eine schlüssige Antwort
 * - Priorisierung von Aufgaben und Verwaltung von Abhängigkeiten
 */

import { BaseAgent } from "./base-agent";
import { 
  AgentConfig,
  TaskCoordinationRequest,
  TaskType,
  TaskResult,
  GeneratedDocument,
  GeneratedCode,
  GeneratedLearningPath
} from "./agent-types";

export class ManagerAgent extends BaseAgent {
  private taskQueue: Map<string, any> = new Map();
  private activeTasks: Map<string, any> = new Map();
  private completedTasks: Map<string, any> = new Map();
  private taskDependencies: Map<string, string[]> = new Map();

  constructor(config: AgentConfig) {
    super(config);
    
    // Spezielle Fähigkeiten des Manager-Agenten
    this._capabilities = [
      'workflow-management',
      'task-distribution',
      'intent-analysis',
      'context-management',
      'result-aggregation'
    ];
  }

  /**
   * Koordiniert eine komplexe Aufgabe zwischen mehreren Agenten
   */
  async coordinateTask(request: TaskCoordinationRequest): Promise<any> {
    try {
      this.log(`Koordiniere Aufgabe mit ID ${request.workflowId}`);
      this.log(`Intent: ${request.intent}`);
      this.log(`Parameter: ${JSON.stringify(request.parameters)}`);
      this.log(`Aufgabentyp: ${request.taskType}`);
      
      // Den besten Ansatz für diese Aufgabe basierend auf der Absicht bestimmen
      const bestApproach = this.determineBestApproach(request.intent, request.taskType);
      this.log(`Bester Ansatz: ${bestApproach}`);
      
      let result;
      
      switch (bestApproach) {
        case 'document':
          result = await this.handleDocumentGeneration(request);
          break;
        case 'code':
          result = await this.handleCodeGeneration(request);
          break;
        case 'learning-path':
          result = await this.handleLearningPathCreation(request);
          break;
        default:
          result = await this.handleDefaultTask(request);
      }
      
      // Erfolg protokollieren
      this.log(`Aufgabe ${request.workflowId} erfolgreich abgeschlossen`);
      this._status.successCount++;
      
      return {
        success: true,
        response: result.response,
        generatedContent: result.content,
        requiresFollowUp: result.requiresFollowUp || false,
        followUpQuestions: result.followUpQuestions || [],
        context: {
          intent: request.intent,
          parameters: request.parameters,
          bestApproach
        }
      };
    } catch (error) {
      // Fehler protokollieren
      this.log(`Fehler bei der Koordination der Aufgabe ${request.workflowId}: ${error}`, 'error');
      this._status.errorCount++;
      
      return {
        success: false,
        response: "Bei der Verarbeitung deiner Anfrage ist ein Fehler aufgetreten. Bitte versuche es mit einer anderen Formulierung.",
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        requiresFollowUp: false
      };
    }
  }

  /**
   * Führt eine Aufgabe aus (BaseAgent abstract Methode)
   */
  async executeTask(task: any): Promise<TaskResult> {
    // Diese Methode wird in der Regel nicht direkt aufgerufen, 
    // sondern über coordinateTask, die mehr Kontext bietet
    
    try {
      const result = await this.coordinateTask({
        workflowId: task.id || 'direct-task',
        intent: task.intent || 'default',
        parameters: task.parameters || {},
        taskType: task.type || 'unknown',
        requiredAgents: task.requiredAgents || []
      });
      
      return this.createTaskResult(
        result.success,
        result.response,
        result.generatedContent,
        result.error
      );
    } catch (error) {
      return this.createTaskResult(
        false,
        "Bei der Ausführung der Aufgabe ist ein Fehler aufgetreten.",
        undefined,
        error instanceof Error ? error.message : 'Unbekannter Fehler'
      );
    }
  }

  /**
   * Bestimmt den besten Ansatz für eine Aufgabe
   */
  private determineBestApproach(intent: string, taskType: TaskType): 'document' | 'code' | 'learning-path' | 'default' {
    // Wenn der Tasktyp explizit angegeben ist, diesen verwenden
    switch (taskType) {
      case 'code-generation':
        return 'code';
      case 'learning-path-creation':
        return 'learning-path';
      case 'document-generation':
        return 'document';
    }
    
    // Ansonsten basierend auf der Absicht entscheiden
    const intentLower = intent.toLowerCase();
    
    if (intentLower.includes('code') || 
        intentLower.includes('programm') || 
        intentLower.includes('script') || 
        intentLower.includes('visualisierung') || 
        intentLower.includes('dashboard')) {
      return 'code';
    }
    
    if (intentLower.includes('lernplan') || 
        intentLower.includes('schulung') || 
        intentLower.includes('kurs') || 
        intentLower.includes('training')) {
      return 'learning-path';
    }
    
    // Standard: Dokument generieren
    return 'document';
  }

  /**
   * Verarbeitet eine Dokumentengenerierungsaufgabe
   */
  private async handleDocumentGeneration(request: TaskCoordinationRequest): Promise<any> {
    // Content Generator Agent finden
    const contentGenerator = this._connectedAgents.find(agent => 
      agent.capabilities.includes('content-generation')
    );
    
    if (!contentGenerator) {
      throw new Error('Kein Content Generator Agent verfügbar');
    }
    
    // Aufgabe an Content Generator Agent senden
    const task = {
      id: `${request.workflowId}-document`,
      type: 'document-generation',
      intent: request.intent,
      parameters: request.parameters,
      options: {
        format: 'document',
        language: 'de',
        includeMetadata: true
      }
    };
    
    this.log(`Sende Dokumentengenerierungsaufgabe an ${contentGenerator.name}`);
    
    // Nachricht an Content Generator Agent senden und auf Ergebnis warten
    contentGenerator.receiveMessage(this._id, task);
    
    // In einer echten Implementierung würden wir hier asynchron warten
    // Für dieses Beispiel simulieren wir eine Antwort
    
    const documentResult: GeneratedDocument = {
      title: `Dokument zu ${request.intent}`,
      content: `Hier ist ein ausführliches Dokument zum Thema ${request.intent}.\n\nDieses Dokument enthält detaillierte Informationen und Analysen.`,
      metadata: {
        author: 'KI-Assistent',
        createdAt: new Date(),
        tags: ['automatisch-generiert', 'menschenrechte'],
        targetAudience: 'Menschenrechtsverteidiger',
        language: 'de',
        category: 'Bericht'
      }
    };
    
    return {
      response: `Ich habe ein Dokument mit dem Titel "${documentResult.title}" erstellt. Möchtest du noch etwas Bestimmtes in diesem Dokument hervorheben?`,
      content: documentResult,
      requiresFollowUp: true,
      followUpQuestions: [
        "Kannst du mehr Details zu den rechtlichen Aspekten hinzufügen?",
        "Bitte füge mehr Beispiele aus der Praxis hinzu",
        "Kannst du eine Zusammenfassung am Ende hinzufügen?"
      ]
    };
  }

  /**
   * Verarbeitet eine Codegenerierungsaufgabe
   */
  private async handleCodeGeneration(request: TaskCoordinationRequest): Promise<any> {
    // Code Generator Agent finden
    const codeGenerator = this._connectedAgents.find(agent => 
      agent.capabilities.includes('code-generation')
    );
    
    if (!codeGenerator) {
      throw new Error('Kein Code Generator Agent verfügbar');
    }
    
    // Aufgabe an Code Generator Agent senden
    const task = {
      id: `${request.workflowId}-code`,
      type: 'code-generation',
      intent: request.intent,
      parameters: request.parameters,
      options: {
        language: request.parameters.language || 'python',
        includeComments: true,
        generateVisualization: true
      }
    };
    
    this.log(`Sende Codegenerierungsaufgabe an ${codeGenerator.name}`);
    
    // Nachricht an Code Generator Agent senden und auf Ergebnis warten
    codeGenerator.receiveMessage(this._id, task);
    
    // In einer echten Implementierung würden wir hier asynchron warten
    // Für dieses Beispiel simulieren wir eine Antwort
    
    const codeResult: GeneratedCode = {
      language: task.options.language,
      code: `# Visualisierung für ${request.intent}\n\nimport matplotlib.pyplot as plt\nimport numpy as np\n\n# Daten generieren\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\n# Visualisierung erstellen\nplt.figure(figsize=(10, 6))\nplt.plot(x, y)\nplt.title('${request.intent}')\nplt.xlabel('Zeit')\nplt.ylabel('Wert')\nplt.grid(True)\nplt.show()`,
      title: `Visualisierung für ${request.intent}`,
      metadata: {
        purpose: request.intent,
        dependencies: ['matplotlib', 'numpy'],
        createdAt: new Date(),
        author: 'KI-Assistent',
        instructions: 'Führe diesen Code in einer Python-Umgebung aus, um die Visualisierung anzuzeigen.'
      }
    };
    
    return {
      response: `Ich habe einen ${task.options.language}-Code für "${codeResult.title}" erstellt. Möchtest du Anpassungen an der Visualisierung vornehmen?`,
      content: codeResult,
      requiresFollowUp: true,
      followUpQuestions: [
        "Kannst du die Visualisierung interaktiv machen?",
        "Bitte ändere die Farben des Diagramms",
        "Kannst du mehr Daten in die Visualisierung einbeziehen?"
      ]
    };
  }

  /**
   * Verarbeitet eine Lernpfaderstellungsaufgabe
   */
  private async handleLearningPathCreation(request: TaskCoordinationRequest): Promise<any> {
    // Content Generator Agent finden (dieser erstellt auch Lernpfade)
    const contentGenerator = this._connectedAgents.find(agent => 
      agent.capabilities.includes('content-generation')
    );
    
    if (!contentGenerator) {
      throw new Error('Kein Content Generator Agent verfügbar');
    }
    
    // Aufgabe an Content Generator Agent senden
    const task = {
      id: `${request.workflowId}-learning-path`,
      type: 'learning-path-creation',
      intent: request.intent,
      parameters: request.parameters,
      options: {
        difficulty: request.parameters.difficulty || 'intermediate',
        includeActivities: true,
        includeResources: true
      }
    };
    
    this.log(`Sende Lernpfaderstellungsaufgabe an ${contentGenerator.name}`);
    
    // Nachricht an Content Generator Agent senden und auf Ergebnis warten
    contentGenerator.receiveMessage(this._id, task);
    
    // In einer echten Implementierung würden wir hier asynchron warten
    // Für dieses Beispiel simulieren wir eine Antwort
    
    const learningPathResult: GeneratedLearningPath = {
      title: `Lernpfad: ${request.intent}`,
      description: `Ein umfassender Lernpfad zum Thema ${request.intent}, der Grundlagen und fortgeschrittene Konzepte abdeckt.`,
      modules: [
        {
          title: 'Modul 1: Grundlagen',
          description: 'Einführung in die Grundkonzepte.',
          duration: '2 Stunden',
          resources: ['Online-Artikel', 'Einführungsvideo'],
          activities: ['Quiz', 'Diskussionsfragen']
        },
        {
          title: 'Modul 2: Anwendung',
          description: 'Praktische Anwendung der Konzepte.',
          duration: '3 Stunden',
          resources: ['Fallstudien', 'Beispiele aus der Praxis'],
          activities: ['Gruppenübung', 'Projektarbeit']
        },
        {
          title: 'Modul 3: Fortgeschrittene Themen',
          description: 'Vertiefung der Konzepte und erweiterte Anwendungsfälle.',
          duration: '4 Stunden',
          resources: ['Fachartikel', 'Experteninterviews'],
          activities: ['Fallanalyse', 'Präsentation']
        }
      ],
      metadata: {
        difficulty: task.options.difficulty as 'beginner' | 'intermediate' | 'advanced',
        timeToComplete: '9 Stunden',
        prerequisites: ['Grundwissen zum Thema Menschenrechte'],
        createdAt: new Date(),
        author: 'KI-Assistent'
      }
    };
    
    return {
      response: `Ich habe einen Lernpfad zum Thema "${learningPathResult.title}" mit ${learningPathResult.modules.length} Modulen erstellt. Möchtest du Anpassungen am Lernpfad vornehmen?`,
      content: learningPathResult,
      requiresFollowUp: true,
      followUpQuestions: [
        "Kannst du mehr Übungen in die Module einbauen?",
        "Bitte füge weitere Ressourcen für Anfänger hinzu",
        "Kannst du den Zeitaufwand reduzieren?"
      ]
    };
  }

  /**
   * Verarbeitet eine Standardaufgabe, wenn kein spezifischer Ansatz erkannt wird
   */
  private async handleDefaultTask(request: TaskCoordinationRequest): Promise<any> {
    this.log(`Führe Standardaufgabe für Intent "${request.intent}" aus`);
    
    // Eine einfache Informationsantwort generieren
    return {
      response: `Ich habe deine Anfrage zu "${request.intent}" verstanden. Möchtest du, dass ich dir ein Dokument erstelle, Code für eine Visualisierung generiere oder einen Lernpfad für dieses Thema entwickle?`,
      content: null,
      requiresFollowUp: true,
      followUpQuestions: [
        "Erstelle bitte ein Dokument dazu",
        "Generiere Code für eine Visualisierung",
        "Entwickle einen Lernpfad zu diesem Thema"
      ]
    };
  }
}