/**
 * Content Generator Agent - Erstellt Dokumente, Berichte und Lernmaterialien
 * 
 * Verantwortlich für:
 * - Generierung von informativen und gut strukturierten Dokumenten
 * - Erstellung von Lernplänen und Bildungsmaterialien
 * - Auswahl geeigneter Formate basierend auf Anforderungen
 * - Integration von Referenzmaterial und Quellen
 */

import { BaseAgent } from "./base-agent";
import { 
  AgentConfig,
  TaskType,
  TaskResult,
  GeneratedDocument,
  GeneratedLearningPath
} from "./agent-types";

export class ContentGeneratorAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
    
    // Spezielle Fähigkeiten des Content-Generators
    this._capabilities = [
      'content-generation',
      'document-creation',
      'learning-path-design',
      'multilingual-content',
      'context-aware-writing'
    ];
    
    // Runtime-Konfiguration anpassen 
    this._runtime = {
      ...this._runtime,
      model: 'gemini-1.5-pro',  // Umfangreicheres Modell für längere Inhalte
      maxTokens: 6144,          // Mehr Tokens für ausführlichere Dokumente
      temperature: 0.7          // Moderate Kreativität
    };
  }

  /**
   * Führt eine Aufgabe aus (BaseAgent abstract Methode)
   */
  async executeTask(task: any): Promise<TaskResult> {
    this.log(`Starte Aufgabe: ${task.id}`);
    
    try {
      let result;
      
      // Aufgabentyp bestimmen und entsprechende Funktion aufrufen
      switch (task.type as TaskType) {
        case 'document-generation':
          result = await this.generateDocument(task);
          break;
        case 'learning-path-creation':
          result = await this.createLearningPath(task);
          break;
        default:
          throw new Error(`Unbekannter Aufgabentyp: ${task.type}`);
      }
      
      this.log(`Aufgabe ${task.id} erfolgreich abgeschlossen`);
      this._status.successCount++;
      
      return this.createTaskResult(true, "Inhalt erfolgreich generiert", result);
    } catch (error) {
      this.log(`Fehler bei der Ausführung der Aufgabe ${task.id}: ${error}`, 'error');
      this._status.errorCount++;
      
      return this.createTaskResult(
        false,
        "Bei der Generierung des Inhalts ist ein Fehler aufgetreten.",
        undefined,
        error instanceof Error ? error.message : 'Unbekannter Fehler'
      );
    }
  }

  /**
   * Generiert ein Dokument basierend auf der Anfrage
   */
  private async generateDocument(task: any): Promise<GeneratedDocument> {
    this.log(`Generiere Dokument für Intent: ${task.intent}`);
    
    // In einer echten Implementierung würde hier die API aufgerufen werden
    // Für dieses Beispiel erstellen wir ein simuliertes Dokument
    
    return {
      title: `Dokument zu ${task.intent}`,
      content: `# ${task.intent}

## Einleitung
Dies ist ein ausführliches Dokument zum Thema ${task.intent}, das wichtige Informationen und Analysen enthält.

## Hintergrund
Die Hintergründe zu diesem Thema sind vielfältig und komplex.

## Hauptteil
In diesem Abschnitt werden die wichtigsten Aspekte des Themas behandelt:
- Erster wichtiger Punkt
- Zweiter wichtiger Punkt
- Dritter wichtiger Punkt

## Rechtliche Grundlagen
Hier werden die relevanten rechtlichen Grundlagen erläutert.

## Empfehlungen
Basierend auf der Analyse werden folgende Empfehlungen ausgesprochen:
1. Erste Empfehlung
2. Zweite Empfehlung
3. Dritte Empfehlung

## Fazit
Zusammenfassend lässt sich sagen, dass das Thema ${task.intent} von großer Bedeutung ist und weitere Beachtung verdient.

## Quellen
- Relevante Quelle 1
- Relevante Quelle 2
- Relevante Quelle 3`,
      metadata: {
        author: 'Content Generator Agent',
        createdAt: new Date(),
        tags: ['automatisch-generiert', 'menschenrechte', task.intent.toLowerCase()],
        targetAudience: 'Menschenrechtsverteidiger',
        language: task.options?.language || 'de',
        category: 'Bericht',
        format: 'markdown'
      }
    };
  }

  /**
   * Erstellt einen Lernpfad basierend auf der Anfrage
   */
  private async createLearningPath(task: any): Promise<GeneratedLearningPath> {
    this.log(`Erstelle Lernpfad für Intent: ${task.intent}`);
    
    // In einer echten Implementierung würde hier die API aufgerufen werden
    // Für dieses Beispiel erstellen wir einen simulierten Lernpfad
    
    const difficulty = task.options?.difficulty || 'intermediate';
    
    return {
      title: `Lernpfad: ${task.intent}`,
      description: `Ein umfassender Lernpfad zum Thema ${task.intent}, der Grundlagen und fortgeschrittene Konzepte abdeckt.`,
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
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        timeToComplete: '9 Stunden',
        prerequisites: ['Grundwissen zum Thema Menschenrechte'],
        createdAt: new Date(),
        author: 'Content Generator Agent'
      }
    };
  }

  /**
   * Empfängt eine Nachricht von einem anderen Agenten
   */
  receiveMessage(senderId: string, message: any): void {
    // Implementierung der abstrakten Methode aus BaseAgent
    this.log(`Nachricht von ${senderId} erhalten: ${JSON.stringify(message)}`);
    
    // Aufgabe ausführen und Ergebnis an den Sender zurücksenden
    this.executeTask(message)
      .then(result => {
        const targetAgent = this._connectedAgents.find(agent => agent.id === senderId);
        if (targetAgent) {
          targetAgent.receiveMessage(this._id, {
            taskId: message.id,
            result
          });
        } else {
          this.log(`Agent ${senderId} ist nicht verbunden, kann Ergebnis nicht senden`, 'warn');
        }
      })
      .catch(error => {
        this.log(`Fehler bei der Verarbeitung der Nachricht: ${error}`, 'error');
      });
  }
}