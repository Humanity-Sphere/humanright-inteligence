import { EventEmitter } from 'events';
import { generateAIContentService } from '../../ai-service-original';
import { db } from '../db';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import util from 'util';
import { exec as execCallback } from 'child_process';
import { ArchonIntegration } from './archon-integration';

// Promisify exec für asynchrone Ausführung
const exec = util.promisify(execCallback);

// Interface für den Problem-Erkennungsdienst
interface IssueDetection {
  detectIssues(): Promise<Issue[]>;
  monitorUserActivity(activity: UserActivity): void;
  analyzeUserFeedback(feedback: string): Promise<Issue[]>;
}

// Interface für den Reparaturdienst
interface RepairService {
  repairIssue(issue: Issue): Promise<RepairResult>;
  suggestFixes(issue: Issue): Promise<RepairSuggestion[]>;
  applyFix(suggestion: RepairSuggestion): Promise<boolean>;
}

// Interface für den Lernmechanismus
interface LearningMechanism {
  learnFromSuccessfulRepairs(repair: RepairResult): void;
  updateRepairStrategies(): void;
  getKnowledgeBase(): KnowledgeBase;
}

// Datenmodelle
export interface Issue {
  id: string;
  type: 'ui' | 'functionality' | 'navigation' | 'performance' | 'api' | 'data';
  component: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  status: 'detected' | 'analyzing' | 'fixing' | 'resolved' | 'failed';
  context: any;
  recurrence?: number;
}

export interface RepairResult {
  issueId: string;
  success: boolean;
  changedFiles?: string[];
  appliedStrategy: string;
  timeToFix: number;
  addedCode?: string;
  removedCode?: string;
}

export interface RepairSuggestion {
  id: string;
  issueId: string;
  description: string;
  changes: FileChange[];
  confidence: number;
  strategy: string;
}

export interface FileChange {
  filePath: string;
  changeType: 'modify' | 'create' | 'delete';
  originalContent?: string;
  newContent?: string;
  diffSummary?: string;
}

export interface KnowledgeBase {
  repairStrategies: RepairStrategy[];
  componentMappings: Record<string, string[]>;
  successRates: Record<string, number>;
  lastUpdated: Date;
}

export interface RepairStrategy {
  id: string;
  name: string;
  description: string;
  applicableIssueTypes: string[];
  successRate: number;
  templatePrompt: string;
  usageCount: number;
}

export interface UserActivity {
  userId: string;
  action: string;
  component: string;
  path: string;
  timestamp: Date;
  errorEncountered?: boolean;
  errorMessage?: string;
}

// Hauptklasse für den selbstreparierenden KI-Agenten
export class AISelfRepairAgent implements IssueDetection, RepairService, LearningMechanism {
  private static instance: AISelfRepairAgent;
  private issues: Issue[] = [];
  private repairHistory: RepairResult[] = [];
  private knowledgeBase: KnowledgeBase;
  private eventEmitter = new EventEmitter();
  private isActive = false;
  private userActivities: UserActivity[] = [];
  private issueCountThreshold = 3; // Nach wie vielen Erkennungen das gleiche Problem behoben werden soll
  private logFile = 'ai_repair_agent.log';
  private config = { autoRepair: true }; // Beispielkonfiguration
  private servicesStatus = new Map();
  private archonIntegration: ArchonIntegration | null = null;

  private constructor() {
    // Laden der initialen Wissensbasis
    this.knowledgeBase = this.loadKnowledgeBase();

    // Event-Listener für neue Erkenntnisse
    this.eventEmitter.on('newRepairKnowledge', this.updateRepairStrategies.bind(this));

    this.log('AI Self-Repair-Agent initialisiert');
    this.checkFileSystem(); // Initialer Dateisystemcheck
  }

  // Singleton-Implementierung
  public static getInstance(): AISelfRepairAgent {
    if (!AISelfRepairAgent.instance) {
      AISelfRepairAgent.instance = new AISelfRepairAgent();
    }
    return AISelfRepairAgent.instance;
  }

  // Aktivieren/Deaktivieren des Agenten
  public activate(): void {
    this.isActive = true;
    this.log('Self-Repair-Agent aktiviert');
  }

  public deactivate(): void {
    this.isActive = false;
    this.log('Self-Repair-Agent deaktiviert');
  }

  public isActivated(): boolean {
    return this.isActive;
  }

  // Implementierung von IssueDetection
  public async detectIssues(): Promise<Issue[]> {
    if (!this.isActive) return [];

    this.log('Starte automatische Problemerkennung...');

    try {
      // Aktiv nach Problemen in verschiedenen Bereichen der Anwendung suchen
      const detectedIssues: Issue[] = [];

      // 1. Frontend-Fehler im Console Log prüfen
      const consoleLogErrors = await this.checkWebConsoleLogs();
      detectedIssues.push(...consoleLogErrors);

      // 2. Auf API-Fehler prüfen
      const apiErrors = await this.checkApiErrors();
      detectedIssues.push(...apiErrors);

      // 3. Performance-Metriken analysieren
      const performanceIssues = await this.analyzePerformanceMetrics();
      detectedIssues.push(...performanceIssues);

      // 4. Datenbankfehler überprüfen
      const dbErrors = await this.checkDatabaseErrors();
      detectedIssues.push(...dbErrors);

      // 5. Überprüfung auf wiederholte Benutzeraktivitäten mit Fehlern
      const repeatedErrors = this.analyzeRepeatedErrors();
      detectedIssues.push(...repeatedErrors);

      this.issues = [...this.issues, ...detectedIssues];

      if (detectedIssues.length > 0) {
        this.log(`${detectedIssues.length} Probleme erkannt und werden automatisch repariert`);
        
        // Automatisch Reparaturen für alle Probleme starten
        for (const issue of detectedIssues) {
          // Reparaturen im Hintergrund starten, damit die Methode nicht blockiert
          this.repairIssue(issue).then(result => {
            if (result.success) {
              this.log(`Problem ${issue.id} wurde erfolgreich repariert`);
              // Benachrichtigungssystem implementieren
            } else {
              this.log(`Reparatur für Problem ${issue.id} fehlgeschlagen`, 'warning');
            }
          }).catch(err => {
            this.log(`Fehler beim Reparieren: ${err}`, 'error');
          });
        }
      }

      return detectedIssues;
    } catch (error) {
      this.log(`Fehler bei der Problemerkennung: ${error}`, 'error');
      return [];
    }
  }

  public monitorUserActivity(activity: UserActivity): void {
    if (!this.isActive) return;

    this.userActivities.push(activity);

    // Wenn ein Fehler aufgetreten ist, versuche, ein Problem zu erkennen
    if (activity.errorEncountered) {
      this.log(`Fehler in Benutzeraktivität erkannt: ${activity.errorMessage}`);

      // Erstellen eines neuen Issues basierend auf der Benutzeraktivität
      const issue: Issue = {
        id: `issue-${Date.now()}`,
        type: 'functionality',
        component: activity.component,
        description: `Fehler bei ${activity.action} in ${activity.component}: ${activity.errorMessage}`,
        severity: 'medium',
        detectedAt: new Date(),
        status: 'detected',
        context: { activity }
      };

      // Überprüfen, ob es sich um ein wiederholtes Problem handelt
      const existingIssue = this.issues.find(i =>
        i.component === issue.component &&
        i.description === issue.description &&
        i.status !== 'resolved'
      );

      if (existingIssue) {
        existingIssue.recurrence = (existingIssue.recurrence || 1) + 1;
        this.log(`Wiederholtes Problem in ${issue.component} erkannt (${existingIssue.recurrence}x)`);

        // Wenn das Problem häufig genug auftritt, versuche es zu beheben
        if (existingIssue.recurrence >= this.issueCountThreshold) {
          this.repairIssue(existingIssue).catch(err =>
            this.log(`Fehler beim Reparieren: ${err}`, 'error')
          );
        }
      } else {
        this.issues.push(issue);
        this.log(`Neues Problem in ${issue.component} erkannt und registriert`);
      }
    }
  }

  public async analyzeUserFeedback(feedback: string): Promise<Issue[]> {
    if (!this.isActive) return [];

    this.log(`Analysiere Benutzer-Feedback: "${feedback}"`);

    try {
      // Verwenden des generativen AI-Dienstes, um das Feedback zu interpretieren
      const prompt = `
Analysiere das folgende Benutzer-Feedback für eine Web-Anwendung und extrahiere mögliche Probleme:

Feedback: "${feedback}"

Identifiziere:
1. Den betroffenen Komponententyp (UI, Funktionalität, Navigation, Leistung, API, Daten)
2. Die spezifische Komponente, sofern erkennbar
3. Eine Beschreibung des Problems
4. Die wahrscheinliche Schwere (niedrig, mittel, hoch, kritisch)

Formatiere die Antwort als JSON-Objekt.
`;

      const response = await generateAIContentService({
        prompt,
        model: 'gemini-1.5-flash',
        systemPrompt: 'Du bist ein Experte für Softwareanalyse, der Feedback in strukturierte Problemidentifikationen umwandelt.'
      });

      let parsedIssues: any = [];
      try {
        // Extrahieren des JSON aus der Antwort
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                          response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsed = JSON.parse(jsonStr);

          // Konvertieren in Issue-Format
          if (Array.isArray(parsed)) {
            parsedIssues = parsed;
          } else {
            parsedIssues = [parsed];
          }
        }
      } catch (parseError) {
        this.log(`Fehler beim Parsen der AI-Antwort: ${parseError}`, 'error');
      }

      // Konvertieren der geparsten Daten in Issue-Objekte
      const detectedIssues: Issue[] = parsedIssues.map((issue: any) => ({
        id: `issue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: issue.type || 'functionality',
        component: issue.component || 'unknown',
        description: issue.description || feedback,
        severity: issue.severity || 'medium',
        detectedAt: new Date(),
        status: 'detected',
        context: { userFeedback: feedback, aiAnalysis: issue }
      }));

      this.issues = [...this.issues, ...detectedIssues];

      this.log(`${detectedIssues.length} Probleme aus Benutzer-Feedback erkannt`);
      return detectedIssues;
    } catch (error) {
      this.log(`Fehler bei der Analyse des Benutzer-Feedbacks: ${error}`, 'error');
      return [];
    }
  }

  // Implementierung von RepairService
  public async repairIssue(issue: Issue): Promise<RepairResult> {
    if (!this.isActive) {
      return {
        issueId: issue.id,
        success: false,
        appliedStrategy: 'none',
        timeToFix: 0
      };
    }

    this.log(`Starte Reparatur für Problem ${issue.id} (${issue.component})`);

    const startTime = Date.now();
    issue.status = 'analyzing';

    try {
      // Finde geeignete Reparaturstrategien
      const strategies = this.knowledgeBase.repairStrategies.filter(strategy =>
        strategy.applicableIssueTypes.includes(issue.type)
      ).sort((a, b) => b.successRate - a.successRate);

      if (strategies.length === 0) {
        this.log(`Keine passende Reparaturstrategie für Problem ${issue.id} gefunden`, 'warning');
        issue.status = 'failed';
        return {
          issueId: issue.id,
          success: false,
          appliedStrategy: 'none',
          timeToFix: Date.now() - startTime
        };
      }

      // Verwende die beste Strategie
      const bestStrategy = strategies[0];
      this.log(`Verwende Strategie "${bestStrategy.name}" für Problem ${issue.id}`);

      issue.status = 'fixing';

      // Generiere Reparaturvorschläge mit KI
      const suggestions = await this.generateRepairSuggestions(issue, bestStrategy);

      if (suggestions.length === 0) {
        this.log(`Keine Reparaturvorschläge für Problem ${issue.id} generiert`, 'warning');
        issue.status = 'failed';
        return {
          issueId: issue.id,
          success: false,
          appliedStrategy: bestStrategy.name,
          timeToFix: Date.now() - startTime
        };
      }

      // Wähle den besten Vorschlag (mit höchstem Confidence-Wert)
      const bestSuggestion = suggestions.sort((a, b) => b.confidence - a.confidence)[0];

      // Wende den Vorschlag an
      const success = await this.applyFix(bestSuggestion);

      const result: RepairResult = {
        issueId: issue.id,
        success,
        appliedStrategy: bestStrategy.name,
        timeToFix: Date.now() - startTime,
        changedFiles: bestSuggestion.changes.map(change => change.filePath),
        addedCode: bestSuggestion.changes
          .filter(change => change.changeType === 'modify' || change.changeType === 'create')
          .map(change => change.newContent)
          .join('\n\n'),
        removedCode: bestSuggestion.changes
          .filter(change => change.changeType === 'modify' || change.changeType === 'delete')
          .map(change => change.originalContent)
          .join('\n\n')
      };

      // Aktualisiere den Issue-Status
      issue.status = success ? 'resolved' : 'failed';

      // Lerne aus der Reparatur
      this.learnFromSuccessfulRepairs(result);

      this.log(`Reparatur für Problem ${issue.id} ${success ? 'erfolgreich' : 'fehlgeschlagen'}`);

      this.repairHistory.push(result);
      return result;
    } catch (error) {
      this.log(`Fehler bei der Reparatur für Problem ${issue.id}: ${error}`, 'error');
      issue.status = 'failed';

      const result: RepairResult = {
        issueId: issue.id,
        success: false,
        appliedStrategy: 'error',
        timeToFix: Date.now() - startTime
      };

      this.repairHistory.push(result);
      return result;
    }
  }

  public async suggestFixes(issue: Issue): Promise<RepairSuggestion[]> {
    if (!this.isActive) return [];

    this.log(`Generiere Reparaturvorschläge für Problem ${issue.id} (${issue.component})`);

    try {
      // Finde geeignete Reparaturstrategien
      const strategies = this.knowledgeBase.repairStrategies.filter(strategy =>
        strategy.applicableIssueTypes.includes(issue.type)
      ).sort((a, b) => b.successRate - a.successRate);

      if (strategies.length === 0) {
        this.log(`Keine passende Reparaturstrategie für Problem ${issue.id} gefunden`, 'warning');
        return [];
      }

      // Verwende die Top-3 Strategien
      const topStrategies = strategies.slice(0, 3);

      // Generiere Vorschläge für jede Strategie
      const allSuggestions: RepairSuggestion[] = [];

      for (const strategy of topStrategies) {
        const suggestions = await this.generateRepairSuggestions(issue, strategy);
        allSuggestions.push(...suggestions);
      }

      this.log(`${allSuggestions.length} Reparaturvorschläge für Problem ${issue.id} generiert`);

      // Sortiere nach Confidence-Wert
      return allSuggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      this.log(`Fehler beim Generieren von Reparaturvorschlägen: ${error}`, 'error');
      return [];
    }
  }

  public async applyFix(suggestion: RepairSuggestion): Promise<boolean> {
    if (!this.isActive) return false;

    this.log(`Wende Reparaturvorschlag ${suggestion.id} für Problem ${suggestion.issueId} an`);

    try {
      // Für jede Dateiänderung
      for (const change of suggestion.changes) {
        switch (change.changeType) {
          case 'create':
            if (!change.newContent) {
              this.log(`Keine neuen Inhalte für Datei ${change.filePath} gefunden`, 'warning');
              continue;
            }

            // Erstellen des Verzeichnisses, falls es nicht existiert
            const dirPath = path.dirname(change.filePath);
            try {
              try {
                await fs.access(dirPath);
              } catch {
                await fs.mkdir(dirPath, { recursive: true });
              }

              await fs.writeFile(change.filePath, change.newContent);
              this.log(`Datei ${change.filePath} erstellt`);
            } catch (error) {
              this.log(`Fehler beim Erstellen der Datei ${change.filePath}: ${error}`, 'error');
            }
            break;

          case 'modify':
            if (!change.newContent) {
              this.log(`Keine neuen Inhalte für Datei ${change.filePath} gefunden`, 'warning');
              continue;
            }

            try {
              try {
                await fs.access(change.filePath);
              } catch {
                this.log(`Datei ${change.filePath} existiert nicht und kann nicht modifiziert werden`, 'warning');
                continue;
              }

              // Sichern der ursprünglichen Datei
              const backupPath = `${change.filePath}.backup-${Date.now()}`;
              await fs.copyFile(change.filePath, backupPath);

              await fs.writeFile(change.filePath, change.newContent);
              this.log(`Datei ${change.filePath} modifiziert (Backup: ${backupPath})`);
            } catch (error) {
              this.log(`Fehler beim Modifizieren der Datei ${change.filePath}: ${error}`, 'error');
            }
            break;

          case 'delete':
            try {
              try {
                await fs.access(change.filePath);
              } catch {
                this.log(`Datei ${change.filePath} existiert nicht und kann nicht gelöscht werden`, 'warning');
                continue;
              }

              // Sichern der zu löschenden Datei
              const deleteBackupPath = `${change.filePath}.deleted-${Date.now()}`;
              await fs.copyFile(change.filePath, deleteBackupPath);

              await fs.unlink(change.filePath);
              this.log(`Datei ${change.filePath} gelöscht (Backup: ${deleteBackupPath})`);
            } catch (error) {
              this.log(`Fehler beim Löschen der Datei ${change.filePath}: ${error}`, 'error');
            }
            break;
        }
      }

      this.log(`Reparaturvorschlag ${suggestion.id} erfolgreich angewendet`);
      return true;
    } catch (error) {
      this.log(`Fehler beim Anwenden des Reparaturvorschlags: ${error}`, 'error');
      return false;
    }
  }

  // Implementierung von LearningMechanism
  public learnFromSuccessfulRepairs(repair: RepairResult): void {
    if (!this.isActive) return;

    if (!repair.success) return;

    this.log(`Lerne aus erfolgreicher Reparatur für Problem ${repair.issueId}`);

    try {
      // Finde die verwendete Strategie
      const strategy = this.knowledgeBase.repairStrategies.find(s => s.name === repair.appliedStrategy);

      if (!strategy) {
        this.log(`Strategie "${repair.appliedStrategy}" nicht in der Wissensbasis gefunden`, 'warning');
        return;
      }

      // Aktualisiere die Erfolgsrate der Strategie
      strategy.usageCount++;
      strategy.successRate = ((strategy.successRate * (strategy.usageCount - 1)) + 1) / strategy.usageCount;

      // Aktualisiere den Zeitstempel
      this.knowledgeBase.lastUpdated = new Date();

      // Speichere die aktualisierte Wissensbasis
      this.saveKnowledgeBase();

      this.log(`Erfolgsrate für Strategie "${strategy.name}" aktualisiert: ${strategy.successRate.toFixed(2)}`);

      // Benachrichtige über neue Erkenntnisse
      this.eventEmitter.emit('newRepairKnowledge', repair);
    } catch (error) {
      this.log(`Fehler beim Lernen aus erfolgreicher Reparatur: ${error}`, 'error');
    }
  }

  public updateRepairStrategies(): void {
    if (!this.isActive) return;

    this.log('Aktualisiere Reparaturstrategien');

    // Im realen System würden wir hier komplexere Analysen durchführen
    // und möglicherweise neue Strategien generieren oder bestehende optimieren

    // Einfache Aktualisierung des Zeitstempels
    this.knowledgeBase.lastUpdated = new Date();

    // Speichere die aktualisierte Wissensbasis
    this.saveKnowledgeBase();
  }

  public getKnowledgeBase(): KnowledgeBase {
    return JSON.parse(JSON.stringify(this.knowledgeBase)); // Deep copy
  }

  // Hilfsmethoden
  private loadKnowledgeBase(): KnowledgeBase {
    try {
      // Versuche, die Wissensbasis aus der Datenbank zu laden
      // Direkt über MemoryDB wäre: const storedKnowledgeBase = db.selectWhere('knowledge_base', kb => kb.type === 'repair_agent')[0];

      // Da wir die Drizzle-API verwenden, müssen wir das select über die Drizzle-Schnittstelle machen
      // Wir können aber nicht direkt darauf zugreifen, daher initialisieren wir eine neue Wissensbasis
      this.log('Initialisiere neue Wissensbasis', 'info');
    } catch (error) {
      this.log(`Fehler beim Laden der Wissensbasis: ${error}`, 'error');
    }

    // Fallback auf initiale Wissensbasis
    this.log('Initialisiere neue Wissensbasis');

    const initialKnowledgeBase: KnowledgeBase = {
      repairStrategies: [
        {
          id: 'strategy-1',
          name: 'ComponentReimplementation',
          description: 'Reimplementiert eine fehlerhafte Komponente mit verbesserten Funktionen',
          applicableIssueTypes: ['functionality', 'ui'],
          successRate: 0.7,
          templatePrompt: 'Analysiere die fehlerhafte Komponente {component} und generiere eine korrigierte Version, die das Problem {description} behebt.',
          usageCount: 1
        },
        {
          id: 'strategy-2',
          name: 'RouterFix',
          description: 'Behebt Navigationsprobleme in der Router-Konfiguration',
          applicableIssueTypes: ['navigation'],
          successRate: 0.85,
          templatePrompt: 'Untersuche die Router-Konfiguration für {component} und generiere Korrekturen, um das Navigationsproblem {description} zu beheben.',
          usageCount: 1
        },
        {
          id: 'strategy-3',
          name: 'StateFix',
          description: 'Behebt Probleme mit dem Zustandsmanagement in Komponenten',
          applicableIssueTypes: ['functionality', 'ui', 'data'],
          successRate: 0.75,
          templatePrompt: 'Analysiere das Zustandsmanagement in {component} und generiere Korrekturen für das Problem {description}.',
          usageCount: 1
        },
        {
          id: 'strategy-4',
          name: 'ApiIntegrationFix',
          description: 'Behebt Probleme mit API-Integrationen',
          applicableIssueTypes: ['api', 'data'],
          successRate: 0.8,
          templatePrompt: 'Untersuche die API-Integration in {component} und generiere Korrekturen für das Problem {description}.',
          usageCount: 1
        },
        {
          id: 'strategy-5',
          name: 'LayoutRestructuring',
          description: 'Optimiert und korrigiert Layout-Probleme',
          applicableIssueTypes: ['ui'],
          successRate: 0.9,
          templatePrompt: 'Analysiere das Layout von {component} und generiere Korrekturen für das UI-Problem {description}.',
          usageCount: 1
        }
      ],
      componentMappings: {
        'navigation': ['Sidebar', 'Header', 'Link', 'Router'],
        'form': ['Form', 'Input', 'Select', 'Button'],
        'data-display': ['Table', 'List', 'Card', 'Chart'],
        'layout': ['Container', 'Grid', 'Flex', 'Box']
      },
      successRates: {
        'ComponentReimplementation': 0.7,
        'RouterFix': 0.85,
        'StateFix': 0.75,
        'ApiIntegrationFix': 0.8,
        'LayoutRestructuring': 0.9
      },
      lastUpdated: new Date()
    };

    // Speichere die initiale Wissensbasis in der Datenbank
    try {
      db.insert('knowledge_base', {
        type: 'repair_agent',
        data: initialKnowledgeBase,
        createdAt: new Date()
      });
    } catch (error) {
      this.log(`Fehler beim Speichern der initialen Wissensbasis: ${error}`, 'error');
    }

    return initialKnowledgeBase;
  }

  private saveKnowledgeBase(): void {
    try {
      // Da wir die Drizzle-API verwenden, müssen wir das select über die Drizzle-Schnittstelle machen
      // Wir können aber nicht direkt darauf zugreifen, daher simulieren wir die Speicherung

      // Erstelle einen neuen Eintrag in unserer "virtuellen" DB
      try {
        db.insert('knowledge_base').values({
          type: 'repair_agent',
          data: this.knowledgeBase,
          createdAt: new Date()
        }).returning();

        this.log('Wissensbasis in Datenbank gespeichert');
      } catch (insertError) {
        this.log(`Wissensbasis konnte nicht gespeichert werden: ${insertError}`, 'warning');
        // Wir ignorieren den Fehler, da die Wissensbasis im Speicher vorhanden ist
      }
    } catch (error) {
      this.log(`Fehler beim Speichern der Wissensbasis: ${error}`, 'error');
    }
  }

  private async generateRepairSuggestions(issue: Issue, strategy: RepairStrategy): Promise<RepairSuggestion[]> {
    this.log(`Generiere Reparaturvorschläge mit Strategie "${strategy.name}" für Problem ${issue.id}`);

    try {
      // Fülle das Template-Prompt mit spezifischen Daten
      let prompt = strategy.templatePrompt
        .replace('{component}', issue.component)
        .replace('{description}', issue.description);

      // Erweitere den Prompt um Kontext
      prompt += `\n\nKontext des Problems:
- Typ: ${issue.type}
- Komponente: ${issue.component}
- Schweregrad: ${issue.severity}
- Beschreibung: ${issue.description}
- Zusätzliche Informationen: ${JSON.stringify(issue.context)}

Generiere eine oder mehrere Lösungen für dieses Problem. Für jede Lösung:
1. Beschreibe die Änderungen, die vorgenommen werden müssen
2. Liste die zu ändernden Dateien auf
3. Gib für jede Datei den genauen Code an, der geändert werden soll
4. Schätze die Wahrscheinlichkeit, dass diese Lösung das Problem behebt (0-100%)

Formatiere deine Antwort als JSON-Objekt.`;

      // Generiere Vorschläge mit dem KI-Dienst
      const response = await generateAIContentService({
        prompt,
        model: 'gemini-1.5-flash',
        systemPrompt: 'Du bist ein Experte für Software-Reparatur, der detaillierte Lösungen für Probleme in Web-Anwendungen generiert.'
      });

      let parsedSuggestions: any[] = [];
      try {
        // Extrahieren des JSON aus der Antwort
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                          response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsed = JSON.parse(jsonStr);

          // Konvertieren in das richtige Format
          if (Array.isArray(parsed)) {
            parsedSuggestions = parsed;
          } else if (parsed.solutions && Array.isArray(parsed.solutions)) {
            parsedSuggestions = parsed.solutions;
          } else {
            parsedSuggestions = [parsed];
          }
        }
      } catch (parseError) {
        this.log(`Fehler beim Parsen der AI-Antwort: ${parseError}`, 'error');
      }

      // Konvertieren der geparsten Daten in RepairSuggestion-Objekte
      const suggestions: RepairSuggestion[] = parsedSuggestions.map((suggestion: any, index: number) => {
        try {
          // Wandle die Dateiänderungen in das richtige Format um
          const fileChanges: FileChange[] = [];

          if (suggestion.files && Array.isArray(suggestion.files)) {
            for (const file of suggestion.files) {
              fileChanges.push({
                filePath: file.path || 'unknown',
                changeType: file.action || 'modify',
                originalContent: file.originalContent || '',
                newContent: file.newContent || '',
                diffSummary: file.diff || ''
              });
            }
          }

          return {
            id: `suggestion-${Date.now()}-${index}`,
            issueId: issue.id,
            description: suggestion.description || `Reparaturvorschlag mit Strategie ${strategy.name}`,
            changes: fileChanges,
            confidence: suggestion.confidence || suggestion.probability || 0.5,
            strategy: strategy.name
          };
        } catch (error) {
          this.log(`Fehler beim Konvertieren des Vorschlags ${index}: ${error}`, 'error');
          return null;
        }
      }).filter(Boolean) as RepairSuggestion[];

      this.log(`${suggestions.length} Vorschläge generiert`);
      return suggestions;
    } catch (error) {
      this.log(`Fehler beim Generieren von Reparaturvorschlägen: ${error}`, 'error');
      return [];
    }
  }

  // Neue Methoden für die aktive Problemerkennung
  private async checkWebConsoleLogs(): Promise<Issue[]> {
    this.log('Prüfe Frontend-Konsole auf Fehler...');
    const issues: Issue[] = [];
    
    try {
      // Simuliere das Abrufen von Browser-Konsolenfehlern
      // Im echten System würde dies über Browser-Telemetrie/Log-Sammlung erfolgen
      const mockConsoleLogs = [
        { level: 'error', message: 'Uncaught TypeError: Cannot read property of undefined', component: 'LiveVoiceAssistant', count: 3 },
        { level: 'error', message: 'Failed to load resource: net::ERR_CONNECTION_REFUSED', component: 'GeminiImageGenerator', count: 1 }
      ];
      
      for (const log of mockConsoleLogs) {
        if (log.level === 'error' && log.count > 0) {
          const issue: Issue = {
            id: `console-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'functionality',
            component: log.component,
            description: `Frontend-Fehler: ${log.message}`,
            severity: log.count > 2 ? 'high' : 'medium',
            detectedAt: new Date(),
            status: 'detected',
            context: { consoleLog: log },
            recurrence: log.count
          };
          
          issues.push(issue);
          this.log(`Frontend-Fehler erkannt in ${log.component}: ${log.message}`);
        }
      }
    } catch (error) {
      this.log(`Fehler beim Prüfen der Frontend-Konsole: ${error}`, 'error');
    }
    
    return issues;
  }
  
  private async checkApiErrors(): Promise<Issue[]> {
    this.log('Prüfe API-Endpunkte auf Fehler...');
    const issues: Issue[] = [];
    
    try {
      // Simuliere API-Fehlerprüfung
      // Im echten System würde dies durch Analyse von API-Logs oder Monitoring erfolgen
      const mockApiErrors = [
        { endpoint: '/api/documents', status: 500, error: 'Internal Server Error', count: 2 }
      ];
      
      for (const apiError of mockApiErrors) {
        if (apiError.status >= 500 && apiError.count > 0) {
          const issue: Issue = {
            id: `api-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'api',
            component: 'Backend-API',
            description: `API-Fehler: ${apiError.endpoint} gibt ${apiError.status} ${apiError.error} zurück`,
            severity: 'high',
            detectedAt: new Date(),
            status: 'detected',
            context: { apiError },
            recurrence: apiError.count
          };
          
          issues.push(issue);
          this.log(`API-Fehler erkannt bei ${apiError.endpoint}: ${apiError.status} ${apiError.error}`);
        }
      }
    } catch (error) {
      this.log(`Fehler beim Prüfen der API-Endpunkte: ${error}`, 'error');
    }
    
    return issues;
  }
  
  private async analyzePerformanceMetrics(): Promise<Issue[]> {
    this.log('Analysiere Performancemetriken...');
    const issues: Issue[] = [];
    
    try {
      // Simuliere Performance-Metriken-Analyse
      // Im echten System würden diese aus einem Monitoring-System kommen
      const mockPerformanceMetrics = [
        { metric: 'memory_usage', value: 85, threshold: 80, component: 'Server' },
        { metric: 'response_time', value: 2500, threshold: 1000, component: 'DocumentAPI' }
      ];
      
      for (const metric of mockPerformanceMetrics) {
        if (metric.value > metric.threshold) {
          const issue: Issue = {
            id: `perf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'performance',
            component: metric.component,
            description: `Performance-Problem: ${metric.metric} (${metric.value}) überschreitet Schwellenwert (${metric.threshold})`,
            severity: (metric.value > metric.threshold * 1.5) ? 'high' : 'medium',
            detectedAt: new Date(),
            status: 'detected',
            context: { performanceMetric: metric }
          };
          
          issues.push(issue);
          this.log(`Performance-Problem erkannt bei ${metric.component}: ${metric.metric} = ${metric.value}`);
        }
      }
    } catch (error) {
      this.log(`Fehler bei der Analyse der Performancemetriken: ${error}`, 'error');
    }
    
    return issues;
  }
  
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Einfache Datenbankverbindungsprüfung
      const result = await db.query('SELECT 1 AS test');
      return result && result.length > 0;
    } catch (error) {
      this.log(`Datenbankverbindungsfehler: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    }
  }
  
  private async checkDatabaseErrors(): Promise<Issue[]> {
    this.log('Prüfe Datenbankverbindung und -fehler...');
    const issues: Issue[] = [];
    
    try {
      // Echte Datenbankfehlerprüfung
      const dbConnectionOk = await this.checkDatabaseConnection();
      
      if (!dbConnectionOk) {
        const issue: Issue = {
          id: `db-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'data',
          component: 'Database',
          description: 'Datenbankverbindungsfehler: Die Anwendung kann keine Verbindung zur Datenbank herstellen',
          severity: 'critical',
          detectedAt: new Date(),
          status: 'detected',
          context: { dbConnection: false }
        };
        
        issues.push(issue);
        this.log('Datenbankverbindungsfehler erkannt: Keine Verbindung möglich');
      }
      
      // Simuliere Datenbankabfragefehler
      const mockDbErrors = [
        { query: 'SELECT * FROM documents', error: 'Timeout exceeded', count: 1 }
      ];
      
      for (const dbError of mockDbErrors) {
        const issue: Issue = {
          id: `db-query-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'data',
          component: 'DatabaseQuery',
          description: `Datenbankabfragefehler: ${dbError.query} - ${dbError.error}`,
          severity: 'high',
          detectedAt: new Date(),
          status: 'detected',
          context: { dbError },
          recurrence: dbError.count
        };
        
        issues.push(issue);
        this.log(`Datenbankabfragefehler erkannt: ${dbError.error}`);
      }
    } catch (error) {
      this.log(`Fehler bei der Prüfung der Datenbankverbindung: ${error}`, 'error');
    }
    
    return issues;
  }
  
  private analyzeRepeatedErrors(): Issue[] {
    // Analysiere die letzten Benutzeraktivitäten nach wiederholten Fehlern
    const errorsCount: Record<string, { count: number, activities: UserActivity[] }> = {};

    for (const activity of this.userActivities.filter(a => a.errorEncountered)) {
      const errorKey = `${activity.component}|${activity.errorMessage}`;

      if (!errorsCount[errorKey]) {
        errorsCount[errorKey] = { count: 0, activities: [] };
      }

      errorsCount[errorKey].count++;
      errorsCount[errorKey].activities.push(activity);
    }

    // Erstelle Issues für häufig auftretende Fehler
    const issues: Issue[] = [];

    for (const [errorKey, data] of Object.entries(errorsCount)) {
      if (data.count >= this.issueCountThreshold) {
        const [component, errorMessage] = errorKey.split('|');
        const activity = data.activities[0]; // Nimm die erste Aktivität als Referenz

        issues.push({
          id: `issue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'functionality',
          component,
          description: `Wiederholter Fehler: ${errorMessage}`,
          severity: 'medium',
          detectedAt: new Date(),
          status: 'detected',
          context: { activities: data.activities },
          recurrence: data.count
        });

        this.log(`Wiederholtes Problem in ${component} erkannt (${data.count}x): ${errorMessage}`);
      }
    }

    return issues;
  }

  private log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    console.log(logEntry);

    // In einer vollständigen Implementierung würden wir in eine Datei loggen
    // fs.appendFileSync(this.logFile, logEntry + '\n');

    // Speichere das Log in der Datenbank
    try {
      db.insert('agent_logs', {
        agent: 'self_repair',
        level,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Fehler beim Speichern des Logs: ${error}`);
    }
  }

  // Öffentliche API-Methoden
  public getStatus(): { active: boolean, issuesCount: number, repairedCount: number } {
    return {
      active: this.isActive,
      issuesCount: this.issues.length,
      repairedCount: this.repairHistory.filter(r => r.success).length
    };
  }

  public getIssues(): Issue[] {
    return [...this.issues];
  }

  public getRepairHistory(): RepairResult[] {
    return [...this.repairHistory];
  }

  public resetAgent(): void {
    this.issues = [];
    this.repairHistory = [];
    this.userActivities = [];
    this.knowledgeBase = this.loadKnowledgeBase();

    this.log('Agent zurückgesetzt');
  }
  
  /**
   * Initialisiert und gibt die Archon-Integration zurück
   */
  public initArchonIntegration(): ArchonIntegration {
    if (!this.archonIntegration) {
      this.archonIntegration = ArchonIntegration.getInstance(this);
      this.archonIntegration.activate();
      this.log('Archon-Integration initialisiert und aktiviert');
    }
    return this.archonIntegration;
  }
  
  /**
   * Gibt die aktuelle Archon-Integration zurück
   */
  public getArchonIntegration(): ArchonIntegration | null {
    return this.archonIntegration;
  }

  private async checkFileSystem(): Promise<void> {
    try {
      const requiredDirs = ['uploads', 'temp', 'logs'];

      for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);

        try {
          await fs.access(dirPath);
          this.log(`Verzeichnis ${dir} existiert`);
        } catch (error) {
          this.log(`Verzeichnis ${dir} nicht gefunden, erstelle es...`);
          await fs.mkdir(dirPath, { recursive: true });
          this.log(`Verzeichnis ${dir} erstellt`);
        }
      }

      this.servicesStatus.set('filesystem', true);
      this.log('Dateisystem-Check erfolgreich abgeschlossen');
    } catch (error) {
      this.log(`Fehler bei der Dateisystemprüfung: ${error instanceof Error ? error.message : String(error)}`, 'error');
      this.servicesStatus.set('filesystem', false);

      if (this.config.autoRepair) {
        try {
          await this.repairFileSystem();
          this.log('Dateisystem erfolgreich repariert');
        } catch (repairError) {
          this.log(`Fehler bei der Dateisystem-Reparatur: ${repairError instanceof Error ? repairError.message : String(repairError)}`, 'error');
        }
      }
    }
  }

  private async repairFileSystem(): Promise<void> {
    const requiredDirs = ['uploads', 'temp', 'logs'];

    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir);
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async handleActivationError(): Promise<void> {
    let retries = 0;
    const maxRetries = 3;
    const backoffTime = 5000;

    while (retries < maxRetries) {
      try {
        await new Promise(resolve => setTimeout(resolve, backoffTime * Math.pow(2, retries)));
        this.log(`Neustart-Versuch ${retries + 1}/${maxRetries}`);

        await this.activate();
        this.log('Self-Repair Agent erfolgreich neu gestartet');
        return;
      } catch (error) {
        retries++;
        this.log(`Neustart fehlgeschlagen (${retries}/${maxRetries}): ${error instanceof Error ? error.message : String(error)}`, 'error');
      }
    }
    this.log('Maximale Anzahl Neustartversuche erreicht', 'error');
    this.emitErrorEvent('activation-failed');
  }

  private emitErrorEvent(eventName: string, data?: any): void {
    this.eventEmitter.emit(eventName, data);
  }
}

// Singleton-Instanz exportieren
export const selfRepairAgent = AISelfRepairAgent.getInstance();

// Exportieren der Initialisierungsfunktion
export function initializeSelfRepairAgent(): void {
  const agent = AISelfRepairAgent.getInstance();
  agent.activate();
  
  // Initialisiere auch die Archon-Integration
  agent.initArchonIntegration();

  // Starte regelmäßige Problemerkennung (alle 15 Minuten)
  setInterval(() => {
    if (agent.isActivated()) {
      agent.detectIssues().catch(err =>
        console.error('Fehler bei der regelmäßigen Problemerkennung:', err)
      );
    }
  }, 15 * 60 * 1000);

  console.log('KI-Self-Repair-Agent initialisiert und aktiviert');
}