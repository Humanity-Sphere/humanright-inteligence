import { EventEmitter } from 'events';
import { generateAIContentService } from '../../ai-service-original';
import { db } from '../db';
import fs from 'fs/promises';
import path from 'path';
import glob from 'glob';
import util from 'util';
import { exec as execCallback } from 'child_process';

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
      // Hier würden wir Logs, Error-Berichte, Performance-Metriken etc. analysieren
      // Für diesen Prototyp geben wir ein leeres Array zurück
      const detectedIssues: Issue[] = [];

      // Überprüfung auf wiederholte Benutzeraktivitäten mit Fehlern
      const repeatedErrors = this.analyzeRepeatedErrors();
      detectedIssues.push(...repeatedErrors);

      this.issues = [...this.issues, ...detectedIssues];

      this.log(`${detectedIssues.length} Probleme erkannt`);
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

              // Sichern der ursprünglichen Datei
              const backupPath = `${change.filePath}.backup-${Date.now()}`;
              await fs.copyFile(change.filePath, backupPath);

              await fs.unlink(change.filePath);
              this.log(`Datei ${change.filePath} gelöscht (Backup: ${backupPath})`);
            } catch (error) {
              this.log(`Fehler beim Löschen der Datei ${change.filePath}: ${error}`, 'error');
            }
            break;
        }
      }

      return true; // Erfolgreich, wenn keine Exception geworfen wurde
    } catch (error) {
      this.log(`Fehler beim Anwenden des Reparaturvorschlags: ${error}`, 'error');
      return false;
    }
  }

  // Implementierung von LearningMechanism
  public learnFromSuccessfulRepairs(repair: RepairResult): void {
    if (!this.isActive || !repair.success) return;

    this.log(`Lerne aus erfolgreicher Reparatur mit Strategie "${repair.appliedStrategy}"`);

    try {
      // Finde die verwendete Strategie
      const usedStrategy = this.knowledgeBase.repairStrategies.find(s => s.name === repair.appliedStrategy);

      if (usedStrategy) {
        // Aktualisiere die Erfolgsrate der Strategie
        usedStrategy.usageCount++;
        this.knowledgeBase.successRates[usedStrategy.id] = 
          (this.knowledgeBase.successRates[usedStrategy.id] || 0) + 1;
        
        const totalUsage = usedStrategy.usageCount;
        const successCount = this.knowledgeBase.successRates[usedStrategy.id];
        
        usedStrategy.successRate = successCount / totalUsage;
        
        this.log(`Strategie "${usedStrategy.name}" aktualisiert (Erfolgsrate: ${(usedStrategy.successRate * 100).toFixed(1)}%)`);
      }

      // Benachrichtige über neue Erkenntnisse
      this.eventEmitter.emit('newRepairKnowledge', repair);

      // Speichere die aktualisierte Wissensbasis
      this.saveKnowledgeBase();
    } catch (error) {
      this.log(`Fehler beim Lernen aus Reparatur: ${error}`, 'error');
    }
  }

  public updateRepairStrategies(): void {
    if (!this.isActive) return;

    this.log('Aktualisiere Reparaturstrategien basierend auf bisherigen Erfahrungen');

    try {
      // Sortiere die Strategien nach Erfolgsrate
      this.knowledgeBase.repairStrategies.sort((a, b) => b.successRate - a.successRate);

      // Speichere die aktualisierte Wissensbasis
      this.saveKnowledgeBase();
    } catch (error) {
      this.log(`Fehler bei der Aktualisierung der Reparaturstrategien: ${error}`, 'error');
    }
  }

  public getKnowledgeBase(): KnowledgeBase {
    return { ...this.knowledgeBase }; // Kopie zurückgeben, um unbeabsichtigte Änderungen zu vermeiden
  }

  // Zusätzliche Methoden
  public getDetectedIssues(): Issue[] {
    return [...this.issues]; // Kopie zurückgeben
  }

  public getRepairHistory(): RepairResult[] {
    return [...this.repairHistory]; // Kopie zurückgeben
  }

  public async performHealthCheck(): Promise<boolean> {
    if (!this.isActive) return false;

    this.log('Führe Integritätscheck durch...');

    try {
      // Überprüfe den Dateisystemzugriff
      await this.checkFileSystem();

      // Überprüfe die Datenbank
      try {
        const dbStatus = await this.checkDatabaseConnection();
        this.servicesStatus.set('database', dbStatus);
      } catch (dbError) {
        this.log(`Fehler bei der Datenbankverbindungsprüfung: ${dbError}`, 'error');
        this.servicesStatus.set('database', false);
      }

      // Überprüfe die Umgebungsvariablen
      this.servicesStatus.set('environment', this.checkEnvironmentVariables());

      // Überprüfe die AI-Dienstverfügbarkeit
      try {
        const aiStatus = await this.checkAIServiceAvailability();
        this.servicesStatus.set('aiService', aiStatus);
      } catch (aiError) {
        this.log(`Fehler bei der AI-Dienstverfügbarkeitsprüfung: ${aiError}`, 'error');
        this.servicesStatus.set('aiService', false);
      }

      // Gesamtstatus: Alle Dienste müssen verfügbar sein
      const allServicesOk = Array.from(this.servicesStatus.values()).every(status => status === true);

      this.log(`Integritätscheck abgeschlossen: ${allServicesOk ? 'OK' : 'FEHLGESCHLAGEN'}`);
      return allServicesOk;
    } catch (error) {
      this.log(`Fehler beim Integritätscheck: ${error}`, 'error');
      return false;
    }
  }

  // Implementierung der Methoden
  private async generateRepairSuggestions(issue: Issue, strategy: RepairStrategy): Promise<RepairSuggestion[]> {
    try {
      this.log(`Generiere Reparaturvorschläge mit Strategie ${strategy.name} für Problem ${issue.id}`);
      
      // Komponenten-relevante Dateien finden
      const relevantFiles = await this.findRelevantFiles(issue.component);
      
      if (relevantFiles.length === 0) {
        this.log(`Keine relevanten Dateien für Komponente ${issue.component} gefunden`, 'warning');
        return [];
      }
      
      // Dateien einlesen
      const fileContents: Record<string, string> = {};
      for (const filePath of relevantFiles) {
        try {
          fileContents[filePath] = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
          this.log(`Fehler beim Lesen von ${filePath}: ${error}`, 'warning');
        }
      }
      
      // Prompt basierend auf Strategie-Template erstellen
      const prompt = strategy.templatePrompt
        .replace('{{ISSUE_DESCRIPTION}}', issue.description)
        .replace('{{ISSUE_COMPONENT}}', issue.component)
        .replace('{{ISSUE_TYPE}}', issue.type)
        .replace('{{ISSUE_SEVERITY}}', issue.severity)
        .replace('{{ISSUE_CONTEXT}}', JSON.stringify(issue.context, null, 2))
        .replace('{{RELEVANT_FILES}}', Object.entries(fileContents)
          .map(([path, content]) => `Datei: ${path}\n\n${content}`)
          .join('\n\n---\n\n')
        );
      
      // KI-Antwort generieren
      const response = await generateAIContentService({
        prompt,
        model: 'gemini-1.5-flash',
        systemPrompt: 'Du bist ein Experte für Softwareentwicklung und Code-Reparatur, der praktische Lösungen für konkrete Softwareprobleme bereitstellt.',
        maxTokens: 4096
      });
      
      // Parsen der Antwort
      const suggestions = this.parseAIResponseForSuggestions(response, issue.id, strategy.name);
      
      // Anwenden zusätzlicher Informationen
      const enhancedSuggestions = await this.enhanceSuggestions(suggestions, fileContents);
      
      return enhancedSuggestions;
    } catch (error) {
      this.log(`Fehler bei der Generierung von Reparaturvorschlägen: ${error}`, 'error');
      return [];
    }
  }
  
  private parseAIResponseForSuggestions(response: string, issueId: string, strategy: string): RepairSuggestion[] {
    try {
      // Versuche, JSON aus der Antwort zu extrahieren
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        if (Array.isArray(parsed)) {
          return parsed.map((suggestion, index) => this.createSuggestionFromAIResponse(suggestion, issueId, strategy, index));
        } else {
          return [this.createSuggestionFromAIResponse(parsed, issueId, strategy, 0)];
        }
      }
      
      // Alternativer Ansatz: Extrahiere Codeblöcke
      const codeBlocks = response.match(/```([\s\S]*?)```/g);
      
      if (codeBlocks && codeBlocks.length > 0) {
        const filePathMatches = response.match(/(?:Datei|File):\s*(.*?)(?:\n|$)/g);
        
        if (filePathMatches && filePathMatches.length > 0) {
          const suggestion: RepairSuggestion = {
            id: `suggestion-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            issueId,
            description: `Automatisch generierte Lösung für Problem ${issueId}`,
            changes: [],
            confidence: 0.7,
            strategy
          };
          
          for (let i = 0; i < Math.min(filePathMatches.length, codeBlocks.length); i++) {
            const filePath = filePathMatches[i].replace(/(?:Datei|File):\s*/, '').trim();
            const code = codeBlocks[i].replace(/```(.*?)\n/, '').replace(/```$/, '');
            
            suggestion.changes.push({
              filePath,
              changeType: 'modify',
              newContent: code,
              diffSummary: `Änderungen in ${filePath}`
            });
          }
          
          return [suggestion];
        }
      }
      
      // Fallback: Einfachen Textvorschlag erstellen
      const simpleDescription = response.substr(0, 1000);
      
      return [{
        id: `suggestion-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        issueId,
        description: simpleDescription,
        changes: [],
        confidence: 0.5,
        strategy
      }];
    } catch (error) {
      this.log(`Fehler beim Parsen der AI-Antwort: ${error}`, 'error');
      return [];
    }
  }
  
  private createSuggestionFromAIResponse(data: any, issueId: string, strategy: string, index: number): RepairSuggestion {
    const id = `suggestion-${Date.now()}-${index}`;
    
    const suggestion: RepairSuggestion = {
      id,
      issueId,
      description: data.description || `Lösung für Problem ${issueId}`,
      changes: [],
      confidence: data.confidence || 0.7,
      strategy
    };
    
    if (data.changes && Array.isArray(data.changes)) {
      suggestion.changes = data.changes.map((change: any) => ({
        filePath: change.filePath,
        changeType: change.changeType || 'modify',
        originalContent: change.originalContent,
        newContent: change.newContent,
        diffSummary: change.diffSummary || `Änderungen in ${change.filePath}`
      }));
    }
    
    return suggestion;
  }
  
  private async enhanceSuggestions(
    suggestions: RepairSuggestion[], 
    fileContents: Record<string, string>
  ): Promise<RepairSuggestion[]> {
    return Promise.all(suggestions.map(async (suggestion) => {
      // Ergänze fehlende originalContent für Änderungen
      for (const change of suggestion.changes) {
        if (change.changeType === 'modify' && !change.originalContent) {
          if (fileContents[change.filePath]) {
            change.originalContent = fileContents[change.filePath];
          } else {
            try {
              change.originalContent = await fs.readFile(change.filePath, 'utf-8');
            } catch (error) {
              // Ignoriere Fehler, wenn die Datei nicht gelesen werden kann
            }
          }
        }
      }
      
      return suggestion;
    }));
  }
  
  private async findRelevantFiles(component: string): Promise<string[]> {
    try {
      // Prüfe, ob eine direkte Zuordnung in der Wissensbasis existiert
      if (this.knowledgeBase.componentMappings[component]) {
        return this.knowledgeBase.componentMappings[component];
      }
      
      // Suche nach Dateien, die möglicherweise zum Komponentennamen passen
      const componentName = component.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const searchPattern = path.join(
        process.cwd(),
        '{client,server,shared}/**/*' + componentName + '*.{ts,tsx,js,jsx}'
      );
      
      const globPromise = (pattern: string) => {
        return new Promise<string[]>((resolve, reject) => {
          glob(pattern, (err, matches) => {
            if (err) return reject(err);
            resolve(matches);
          });
        });
      };
      
      const files = await globPromise(searchPattern);
      
      // Falls keine direkten Treffer, versuche eine breitere Suche
      if (files.length === 0) {
        const words = component.toLowerCase().split(/[^a-z0-9]+/);
        
        if (words.length > 1) {
          const patterns = words
            .filter(word => word.length > 3)
            .map(word => 
              path.join(process.cwd(), '{client,server,shared}/**/*' + word + '*.{ts,tsx,js,jsx}')
            );
          
          for (const pattern of patterns) {
            const matches = await globPromise(pattern);
            files.push(...matches);
          }
        }
      }
      
      // Speichere das Ergebnis für zukünftige Anfragen
      this.knowledgeBase.componentMappings[component] = Array.from(new Set(files));
      
      return this.knowledgeBase.componentMappings[component];
    } catch (error) {
      this.log(`Fehler beim Suchen relevanter Dateien: ${error}`, 'error');
      return [];
    }
  }

  private analyzeRepeatedErrors(): Issue[] {
    this.log('Analysiere wiederkehrende Fehler...');

    // Gruppiere Aktivitäten nach Fehlermeldungen
    const errorGroups: Record<string, UserActivity[]> = {};
    
    for (const activity of this.userActivities.filter(a => a.errorEncountered && a.errorMessage)) {
      const normalizedError = this.normalizeErrorMessage(activity.errorMessage || '');
      
      if (!errorGroups[normalizedError]) {
        errorGroups[normalizedError] = [];
      }
      
      errorGroups[normalizedError].push(activity);
    }

    const detectedIssues: Issue[] = [];
    
    // Analysiere jede Fehlergruppe
    for (const [errorMessage, activities] of Object.entries(errorGroups)) {
      if (activities.length < this.issueCountThreshold) {
        continue; // Ignoriere Fehler, die nicht häufig genug auftreten
      }
      
      // Suche nach einem existierenden Problem mit dieser Fehlermeldung
      const existingIssue = this.issues.find(issue => 
        issue.context?.errorMessage === errorMessage &&
        issue.status !== 'resolved'
      );
      
      if (existingIssue) {
        existingIssue.recurrence = (existingIssue.recurrence || 0) + activities.length;
        continue; // Überspringe die Erstellung eines neuen Problems
      }
      
      // Bestimme die betroffene Komponente (nimm die häufigste)
      const componentCounts: Record<string, number> = {};
      for (const activity of activities) {
        componentCounts[activity.component] = (componentCounts[activity.component] || 0) + 1;
      }
      
      const component = Object.entries(componentCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Erstelle ein neues Issue
      const newIssue: Issue = {
        id: `issue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'functionality',
        component,
        description: `Wiederholter Fehler in ${component}: ${errorMessage}`,
        severity: activities.length > 5 ? 'high' : 'medium',
        detectedAt: new Date(),
        status: 'detected',
        context: { 
          errorMessage,
          activities: activities.map(a => ({
            userId: a.userId,
            action: a.action,
            path: a.path,
            timestamp: a.timestamp
          }))
        },
        recurrence: activities.length
      };
      
      detectedIssues.push(newIssue);
      this.log(`Neues Problem durch wiederholten Fehler erkannt: ${newIssue.description}`);
    }
    
    return detectedIssues;
  }
  
  private normalizeErrorMessage(error: string): string {
    // Entferne variable Teile aus der Fehlermeldung
    return error
      .replace(/[0-9]+/g, 'X') // Ersetze Zahlen
      .replace(/'[^']+'/g, 'VALUE') // Ersetze Strings in Anführungszeichen
      .replace(/"[^"]+"/g, 'VALUE') // Ersetze Strings in doppelten Anführungszeichen
      .replace(/\[[^\]]+\]/g, 'ARRAY') // Ersetze Arrays
      .replace(/\{[^}]+\}/g, 'OBJECT') // Ersetze Objekte
      .replace(/\s+/g, ' ') // Normalisiere Leerzeichen
      .trim()
      .toLowerCase()
      .slice(0, 100); // Begrenze die Länge
  }

  private async checkFileSystem(): Promise<void> {
    this.log('Überprüfe Dateisystem...');
    
    // Liste der kritischen Verzeichnisse, die vorhanden sein sollten
    const criticalDirectories = [
      'uploads',
      'temp',
      'logs'
    ];
    
    // Überprüfe jedes Verzeichnis
    for (const dir of criticalDirectories) {
      try {
        await fs.access(dir);
        this.log(`Verzeichnis ${dir} existiert`);
      } catch (error) {
        this.log(`Verzeichnis ${dir} existiert nicht, erstelle es...`, 'warning');
        
        try {
          await fs.mkdir(dir, { recursive: true });
          this.log(`Verzeichnis ${dir} erstellt`);
        } catch (mkdirError) {
          this.log(`Fehler beim Erstellen von Verzeichnis ${dir}: ${mkdirError}`, 'error');
        }
      }
    }
    
    this.log('Dateisystem-Check erfolgreich abgeschlossen');
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Einfacher Datenbank-Check (Beispiel)
      const result = await db.query('SELECT 1 AS check_db', []);
      
      return result && result.length > 0 && result[0].check_db === 1;
    } catch (error) {
      this.log(`Datenbankverbindungsfehler: ${error}`, 'error');
      return false;
    }
  }

  private checkEnvironmentVariables(): boolean {
    // Überprüfe, ob wichtige Umgebungsvariablen gesetzt sind
    const requiredVars = ['NODE_ENV'];
    let allVarsPresent = true;
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.log(`Erforderliche Umgebungsvariable ${varName} fehlt`, 'warning');
        allVarsPresent = false;
      }
    }
    
    return allVarsPresent;
  }

  private async checkAIServiceAvailability(): Promise<boolean> {
    try {
      // Einfacher Test des AI-Dienstes
      const testResponse = await generateAIContentService({
        prompt: 'Teste die Verbindung: Gib "OK" zurück.',
        model: 'gemini-1.5-flash'
      });
      
      return testResponse && testResponse.toLowerCase().includes('ok');
    } catch (error) {
      this.log(`AI-Dienstverbindungsfehler: ${error}`, 'error');
      return false;
    }
  }

  private loadKnowledgeBase(): KnowledgeBase {
    this.log('Initialisiere neue Wissensbasis');
    
    // Hier würde normalerweise aus einer Datenbank geladen werden
    // Für den Anfang erstellen wir eine statische Wissensbasis
    return {
      repairStrategies: [
        {
          id: 'strategy-import-fix',
          name: 'Import-Fix-Strategie',
          description: 'Repariert fehlerhafte Import-Anweisungen, insbesondere nach Refactoring',
          applicableIssueTypes: ['functionality', 'api'],
          successRate: 0.8,
          usageCount: 5,
          templatePrompt: `
Du bist ein Experte für die Reparatur von JavaScript/TypeScript-Dateien.

Zu lösendes Problem:
- Komponente: {{ISSUE_COMPONENT}}
- Beschreibung: {{ISSUE_DESCRIPTION}}
- Schweregrad: {{ISSUE_SEVERITY}}
- Kontextinformationen: {{ISSUE_CONTEXT}}

Relevante Dateien:
{{RELEVANT_FILES}}

Analysiere das Problem und erstelle einen Reparaturvorschlag. Der häufigste Fehler bei diesem Problem sind falsche Import-Pfade nach Refactoring.

Antworte mit JSON im folgenden Format:
\`\`\`json
{
  "description": "Beschreibe die Reparatur",
  "changes": [
    {
      "filePath": "Pfad zur zu ändernden Datei",
      "changeType": "modify",
      "newContent": "Der vollständige neue Inhalt der Datei"
    }
  ],
  "confidence": 0.8
}
\`\`\`
`
        },
        {
          id: 'strategy-typescript-fix',
          name: 'TypeScript-Interface-Anpassung',
          description: 'Passt TypeScript-Schnittstellen und -Typen an, wenn diese nicht übereinstimmen',
          applicableIssueTypes: ['functionality', 'data'],
          successRate: 0.75,
          usageCount: 3,
          templatePrompt: `
Du bist ein Experte für TypeScript-Typsicherheit und Schnittstellenanpassung.

Zu lösendes Problem:
- Komponente: {{ISSUE_COMPONENT}}
- Beschreibung: {{ISSUE_DESCRIPTION}}
- Schweregrad: {{ISSUE_SEVERITY}}
- Kontextinformationen: {{ISSUE_CONTEXT}}

Relevante Dateien:
{{RELEVANT_FILES}}

Analysiere das Problem und erstelle einen Reparaturvorschlag. Achte besonders auf TypeScript-Typprobleme:
1. Fehlende Eigenschaften in Interfaces
2. Typinkonsistenzen zwischen Dateien
3. Nicht übereinstimmende Typ-Parameter

Antworte mit JSON im folgenden Format:
\`\`\`json
{
  "description": "Beschreibe die Reparatur",
  "changes": [
    {
      "filePath": "Pfad zur zu ändernden Datei",
      "changeType": "modify",
      "newContent": "Der vollständige neue Inhalt der Datei"
    }
  ],
  "confidence": 0.8
}
\`\`\`
`
        },
        {
          id: 'strategy-api-endpoint',
          name: 'API-Endpunkt-Reparatur',
          description: 'Behebt Probleme mit API-Endpunkten, die nicht mehr erreichbar sind oder deren Format sich geändert hat',
          applicableIssueTypes: ['api', 'functionality'],
          successRate: 0.7,
          usageCount: 2,
          templatePrompt: `
Du bist ein Experte für API-Integrationen und Backend-Kommunikation.

Zu lösendes Problem:
- Komponente: {{ISSUE_COMPONENT}}
- Beschreibung: {{ISSUE_DESCRIPTION}}
- Schweregrad: {{ISSUE_SEVERITY}}
- Kontextinformationen: {{ISSUE_CONTEXT}}

Relevante Dateien:
{{RELEVANT_FILES}}

Analysiere das Problem und erstelle einen Reparaturvorschlag. Achte besonders auf folgende Probleme:
1. Geänderte API-Endpunkte
2. Neue/geänderte Anfrageparameter
3. Geänderte Antwortformate
4. Fehlerbehandlung für API-Anfragen

Antworte mit JSON im folgenden Format:
\`\`\`json
{
  "description": "Beschreibe die Reparatur",
  "changes": [
    {
      "filePath": "Pfad zur zu ändernden Datei",
      "changeType": "modify",
      "newContent": "Der vollständige neue Inhalt der Datei"
    }
  ],
  "confidence": 0.8
}
\`\`\`
`
        }
      ],
      componentMappings: {}, // Wird dynamisch gefüllt
      successRates: {
        'strategy-import-fix': 4,  // 4 erfolgreiche Reparaturen von 5 Versuchen
        'strategy-typescript-fix': 2, // 2 erfolgreiche Reparaturen von 3 Versuchen
        'strategy-api-endpoint': 1  // 1 erfolgreiche Reparatur von 2 Versuchen
      },
      lastUpdated: new Date()
    };
  }

  private saveKnowledgeBase(): void {
    try {
      // Hier würde normalerweise in einer Datenbank gespeichert werden
      this.knowledgeBase.lastUpdated = new Date();
      
      // Für Debugging-Zwecke speichern wir einen Teil als JSON-Datei
      const knowledgeBaseSnapshot = {
        strategies: this.knowledgeBase.repairStrategies.map(s => ({
          id: s.id,
          name: s.name,
          successRate: s.successRate,
          usageCount: s.usageCount
        })),
        lastUpdated: this.knowledgeBase.lastUpdated
      };
      
      // Asynchrones Speichern, Fehler werden ignoriert
      fs.writeFile('self_repair_knowledge.json', JSON.stringify(knowledgeBaseSnapshot, null, 2))
        .catch(err => this.log(`Fehler beim Speichern der Wissensbasis: ${err}`, 'warning'));
    } catch (error) {
      this.log(`Fehler beim Speichern der Wissensbasis: ${error}`, 'error');
    }
  }

  private log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Konsolenausgabe
    console.log(formattedMessage);
    
    // Asynchrones Schreiben in die Logdatei, Fehler werden ignoriert
    fs.appendFile(this.logFile, formattedMessage + '\n')
      .catch(() => {}); // Ignoriere Fehler beim Schreiben der Logdatei
  }
}

// Hilfsfunktion für die einfache Erstellung und Zugriff
export function getAISelfRepairAgent(): AISelfRepairAgent {
  return AISelfRepairAgent.getInstance();
}

// Initialisierungsfunktion
export function initializeAISelfRepairAgent(): void {
  const agent = getAISelfRepairAgent();
  agent.activate();
  console.log('KI-Self-Repair-Agent initialisiert und aktiviert');
}