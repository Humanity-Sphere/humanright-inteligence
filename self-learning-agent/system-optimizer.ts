/**
 * System-Optimizer - Erkennt Optimierungspotenziale und implementiert Verbesserungen
 * 
 * Diese Komponente des selbstlernenden Agenten analysiert die Systemleistung,
 * identifiziert Bereiche für Optimierungen und implementiert automatisch Verbesserungen.
 */

import { generateAIContentService } from '../../../ai-service-original';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { InteractionPattern } from '../self-learning-agent';

// Interface für Optimierungsvorschläge
export interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'code_quality' | 'user_experience' | 'security' | 'accessibility' | 'seo';
  description: string;
  patternId?: string;
  affectedComponents: string[];
  suggestedChanges: {
    filePath: string;
    originalCode?: string;
    optimizedCode?: string;
    description: string;
  }[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 0-1 Schätzung der Auswirkung
  effort: number; // 0-1 Schätzung des Aufwands
  status: 'identified' | 'analyzed' | 'approved' | 'implemented' | 'rejected';
  createdAt: Date;
  implementedAt?: Date;
  metrics?: {
    beforeMetrics?: Record<string, number>;
    afterMetrics?: Record<string, number>;
    improvement?: number;
  };
}

// Interface für die Leistungsmetrik
export interface PerformanceMetric {
  id: string;
  name: string;
  component: string;
  value: number;
  unit: string;
  timestamp: Date;
  threshold?: {
    warning: number;
    critical: number;
  };
}

/**
 * System-Optimizer-Klasse zur Erkennung und Implementierung von Systemverbesserungen
 */
export class SystemOptimizer {
  private static instance: SystemOptimizer;
  private optimizationSuggestions: OptimizationSuggestion[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private isActive = true;
  private testMode = true; // Im Testmodus werden keine tatsächlichen Änderungen vorgenommen
  private basePath = './';
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.loadOptimizationSuggestions();
    this.loadPerformanceMetrics();
    console.log('System Optimizer initialisiert');
    
    // Starte die regelmäßige Sammlung von Leistungsmetriken
    this.startMetricsCollection();
  }

  // Singleton-Pattern
  public static getInstance(): SystemOptimizer {
    if (!SystemOptimizer.instance) {
      SystemOptimizer.instance = new SystemOptimizer();
    }
    return SystemOptimizer.instance;
  }

  /**
   * Aktiviert oder deaktiviert den System-Optimizer
   */
  public setActive(active: boolean): void {
    this.isActive = active;
    console.log(`System Optimizer ${active ? 'aktiviert' : 'deaktiviert'}`);
    
    if (active) {
      this.startMetricsCollection();
    } else if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }
  }

  /**
   * Startet die regelmäßige Sammlung von Leistungsmetriken
   */
  private startMetricsCollection(): void {
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    
    // Sammle alle 15 Minuten Metriken
    this.metricsCollectionInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 15 * 60 * 1000);
    
    // Sammle sofort Metriken beim Start
    this.collectPerformanceMetrics();
  }

  /**
   * Sammelt Leistungsmetriken des Systems
   */
  private async collectPerformanceMetrics(): Promise<void> {
    if (!this.isActive) return;
    
    console.log('Sammle Systemleistungsmetriken...');
    
    try {
      // 1. Sammle Server-Metriken
      this.collectServerMetrics();
      
      // 2. Sammle Frontend-Metriken (könnte über eine spezielle API erfolgen)
      this.collectFrontendMetrics();
      
      // 3. Sammle Datenbankmetriken
      this.collectDatabaseMetrics();
      
      // Speichere die gesammelten Metriken
      this.savePerformanceMetrics();
      
      // Analysiere die Metriken auf Optimierungspotenzial
      this.analyzeMetricsForOptimization();
    } catch (error) {
      console.error('Fehler bei der Sammlung von Leistungsmetriken:', error);
    }
  }

  /**
   * Sammelt Server-Metriken
   */
  private collectServerMetrics(): void {
    try {
      // Speicherauslastung
      const memoryUsage = process.memoryUsage();
      this.recordMetric({
        id: `memory-usage-${Date.now()}`,
        name: 'memory_usage_mb',
        component: 'server',
        value: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        unit: 'MB',
        timestamp: new Date(),
        threshold: {
          warning: 500,
          critical: 1000
        }
      });
      
      // CPU-Auslastung (vereinfacht)
      try {
        const cpuInfo = execSync('ps -p ' + process.pid + ' -o %cpu').toString().trim().split('\n')[1];
        const cpuUsage = parseFloat(cpuInfo);
        
        this.recordMetric({
          id: `cpu-usage-${Date.now()}`,
          name: 'cpu_usage_percent',
          component: 'server',
          value: cpuUsage,
          unit: '%',
          timestamp: new Date(),
          threshold: {
            warning: 50,
            critical: 80
          }
        });
      } catch (e) {
        console.log('CPU-Metrik konnte nicht erfasst werden:', e);
      }
      
      // API-Antwortzeiten könnten hier erfasst werden
    } catch (error) {
      console.error('Fehler bei der Sammlung von Server-Metriken:', error);
    }
  }

  /**
   * Sammelt Frontend-Metriken
   */
  private collectFrontendMetrics(): void {
    // In einer realen Implementierung würden diese Daten über eine API
    // vom Frontend gesendet oder aus Analysediensten abgerufen werden
    console.log('Frontend-Metriken-Sammlung (Platzhalter)');
  }

  /**
   * Sammelt Datenbankmetriken
   */
  private collectDatabaseMetrics(): void {
    // In einer realen Implementierung würden diese Daten aus der Datenbank
    // oder einem Monitoring-Service abgerufen werden
    console.log('Datenbank-Metriken-Sammlung (Platzhalter)');
  }

  /**
   * Zeichnet eine neue Leistungsmetrik auf
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric);
    
    // Prüfe, ob ein Schwellenwert überschritten wurde
    if (metric.threshold) {
      if (metric.value >= metric.threshold.critical) {
        console.warn(`KRITISCH: Metrik ${metric.name} hat kritischen Schwellenwert überschritten: ${metric.value}${metric.unit}`);
        // Hier könnte ein Alert ausgelöst werden
        this.createOptimizationFromMetric(metric, 'critical');
      } else if (metric.value >= metric.threshold.warning) {
        console.warn(`WARNUNG: Metrik ${metric.name} hat Warnschwellenwert überschritten: ${metric.value}${metric.unit}`);
        this.createOptimizationFromMetric(metric, 'warning');
      }
    }
  }

  /**
   * Erstellt einen Optimierungsvorschlag aus einer problematischen Metrik
   */
  private createOptimizationFromMetric(metric: PerformanceMetric, level: 'warning' | 'critical'): void {
    const priority = level === 'critical' ? 'critical' : 'high';
    
    // Prüfe, ob bereits ein ähnlicher Vorschlag existiert
    const existingSuggestion = this.optimizationSuggestions.find(s =>
      s.type === 'performance' &&
      s.affectedComponents.includes(metric.component) &&
      s.status !== 'implemented' &&
      s.status !== 'rejected'
    );
    
    if (existingSuggestion) {
      // Aktualisiere den bestehenden Vorschlag mit den neuen Daten
      existingSuggestion.priority = priority;
      existingSuggestion.description += `\nAktualisiert am ${new Date().toISOString()}: ${metric.name} = ${metric.value}${metric.unit}`;
      
      if (!existingSuggestion.metrics) {
        existingSuggestion.metrics = { beforeMetrics: {} };
      }
      
      if (existingSuggestion.metrics.beforeMetrics) {
        existingSuggestion.metrics.beforeMetrics[metric.name] = metric.value;
      }
      
      console.log(`Bestehenden Optimierungsvorschlag für ${metric.component} aktualisiert`);
    } else {
      // Erstelle einen neuen Optimierungsvorschlag
      const newSuggestion: OptimizationSuggestion = {
        id: `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'performance',
        description: `Leistungsoptimierung für ${metric.component}: ${metric.name} = ${metric.value}${metric.unit}`,
        affectedComponents: [metric.component],
        suggestedChanges: [],
        priority,
        impact: level === 'critical' ? 0.9 : 0.7,
        effort: 0.5, // Standardwert, wird später aktualisiert
        status: 'identified',
        createdAt: new Date(),
        metrics: {
          beforeMetrics: {
            [metric.name]: metric.value
          }
        }
      };
      
      this.optimizationSuggestions.push(newSuggestion);
      console.log(`Neuer Optimierungsvorschlag für ${metric.component} erstellt: ${newSuggestion.id}`);
      
      // Analysiere den Vorschlag detaillierter
      this.analyzeOptimizationSuggestion(newSuggestion);
    }
    
    this.saveOptimizationSuggestions();
  }

  /**
   * Analysiert die gesammelten Metriken auf Optimierungspotenzial
   */
  private analyzeMetricsForOptimization(): void {
    // Diese Methode könnte komplexere Muster in den Metriken erkennen,
    // die nicht direkt durch Schwellenwertüberschreitungen erkannt werden
    
    // Beispiel: Erkennung von langsam ansteigenden Trends
    this.detectTrends();
    
    // Beispiel: Erkennung von wiederkehrenden Lastspitzen
    this.detectLoadPatterns();
  }

  /**
   * Erkennt Trends in den Metriken
   */
  private detectTrends(): void {
    // Hier könnten wir eine einfache lineare Regression auf die letzten N Metriken anwenden
    // um zu erkennen, ob ein langsamer, aber stetiger Anstieg vorliegt
    
    // Vereinfachte Implementierung
    const metricsByName: Record<string, PerformanceMetric[]> = {};
    
    // Gruppiere die letzten 50 Metriken nach Namen
    this.performanceMetrics.slice(-50).forEach(metric => {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = [];
      }
      metricsByName[metric.name].push(metric);
    });
    
    // Analysiere jeden Metrik-Typ
    for (const [name, metrics] of Object.entries(metricsByName)) {
      if (metrics.length < 5) continue; // Zu wenige Datenpunkte
      
      // Sortiere nach Zeitstempel
      metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Einfache Trendanalyse: Vergleiche den Durchschnitt der ersten Hälfte mit dem der zweiten Hälfte
      const midpoint = Math.floor(metrics.length / 2);
      const firstHalf = metrics.slice(0, midpoint);
      const secondHalf = metrics.slice(midpoint);
      
      const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;
      
      const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      // Wenn der Trend signifikant ist und noch kein entsprechender Vorschlag existiert
      if (Math.abs(percentChange) > 15) {
        const latestMetric = metrics[metrics.length - 1];
        const trendType = percentChange > 0 ? 'steigenden' : 'fallenden';
        
        // Prüfe, ob bereits ein ähnlicher Vorschlag existiert
        const existingSuggestion = this.optimizationSuggestions.find(s =>
          s.type === 'performance' &&
          s.affectedComponents.includes(latestMetric.component) &&
          s.description.includes(name) &&
          s.status !== 'implemented' &&
          s.status !== 'rejected'
        );
        
        if (!existingSuggestion) {
          const newSuggestion: OptimizationSuggestion = {
            id: `trend-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'performance',
            description: `${percentChange > 0 ? 'Ansteigender' : 'Fallender'} Trend bei ${name} in ${latestMetric.component}: ${Math.abs(percentChange).toFixed(2)}% Änderung`,
            affectedComponents: [latestMetric.component],
            suggestedChanges: [],
            priority: percentChange > 0 ? 'medium' : 'low',
            impact: percentChange > 0 ? 0.6 : 0.3,
            effort: 0.5,
            status: 'identified',
            createdAt: new Date(),
            metrics: {
              beforeMetrics: {
                [name]: latestMetric.value,
                [`${name}_trend_percent`]: percentChange
              }
            }
          };
          
          this.optimizationSuggestions.push(newSuggestion);
          console.log(`Neuer Trendbasierter Optimierungsvorschlag erstellt: ${trendType} ${name}`);
          
          this.analyzeOptimizationSuggestion(newSuggestion);
          this.saveOptimizationSuggestions();
        }
      }
    }
  }

  /**
   * Erkennt Lastmuster in den Metriken
   */
  private detectLoadPatterns(): void {
    // Diese Methode könnte komplexere Zeitreihenanalysen durchführen
    // Für diesen Prototyp implementieren wir eine vereinfachte Version
    console.log('Lastmuster-Erkennung (Platzhalter)');
  }

  /**
   * Analysiert einen Optimierungsvorschlag und entwickelt eine detaillierte Lösung
   */
  public async analyzeOptimizationSuggestion(suggestion: OptimizationSuggestion): Promise<void> {
    if (!this.isActive) return;
    
    if (suggestion.status !== 'identified') {
      console.log(`Vorschlag ${suggestion.id} hat bereits den Status ${suggestion.status} und wird nicht analysiert`);
      return;
    }
    
    console.log(`Analysiere Optimierungsvorschlag: ${suggestion.id}`);
    
    try {
      suggestion.status = 'analyzed';
      
      // Für Performance-Vorschläge, identifiziere die betroffenen Dateien
      if (suggestion.type === 'performance') {
        await this.identifyAffectedFiles(suggestion);
      }
      
      // Generiere Verbesserungsvorschläge mit KI
      await this.generateOptimizationChanges(suggestion);
      
      this.saveOptimizationSuggestions();
    } catch (error) {
      console.error(`Fehler bei der Analyse des Optimierungsvorschlags ${suggestion.id}:`, error);
      suggestion.status = 'identified'; // Zurücksetzen, um später erneut zu versuchen
    }
  }

  /**
   * Identifiziert die betroffenen Dateien für einen Optimierungsvorschlag
   */
  private async identifyAffectedFiles(suggestion: OptimizationSuggestion): Promise<void> {
    // In einer realen Implementierung würde diese Methode Code-Analyse-Tools verwenden,
    // um die relevanten Dateien zu identifizieren
    
    // Vereinfachte Implementation für den Prototyp
    const component = suggestion.affectedComponents[0];
    
    // Simuliere die Identifikation betroffener Dateien
    let potentialFiles: string[] = [];
    
    switch (component) {
      case 'server':
        potentialFiles = [
          'server/index.ts',
          'server/routes/index.ts',
          'server/services/storage.ts'
        ];
        break;
      case 'frontend':
        potentialFiles = [
          'client/src/components/App.tsx',
          'client/src/pages/Dashboard.tsx',
          'client/src/lib/api.ts'
        ];
        break;
      case 'database':
        potentialFiles = [
          'server/db.ts',
          'shared/schema.ts'
        ];
        break;
      default:
        potentialFiles = [];
    }
    
    // Filtere auf existierende Dateien
    const existingFiles = potentialFiles.filter(file => {
      try {
        return fs.existsSync(path.join(this.basePath, file));
      } catch (e) {
        return false;
      }
    });
    
    // Füge die Dateien zum Vorschlag hinzu
    for (const filePath of existingFiles) {
      try {
        const content = fs.readFileSync(path.join(this.basePath, filePath), 'utf8');
        
        suggestion.suggestedChanges.push({
          filePath,
          originalCode: content,
          description: `Potenzielle Optimierung in ${filePath}`
        });
      } catch (e) {
        console.error(`Fehler beim Lesen der Datei ${filePath}:`, e);
      }
    }
    
    console.log(`${suggestion.suggestedChanges.length} betroffene Dateien für ${suggestion.id} identifiziert`);
  }

  /**
   * Generiert konkrete Änderungsvorschläge mit KI
   */
  private async generateOptimizationChanges(suggestion: OptimizationSuggestion): Promise<void> {
    for (let i = 0; i < suggestion.suggestedChanges.length; i++) {
      const change = suggestion.suggestedChanges[i];
      
      if (!change.originalCode || change.optimizedCode) {
        continue; // Überspringe, wenn kein Originalcode oder bereits optimiert
      }
      
      const prompt = `
Als erfahrener Software-Optimierer, analysiere den folgenden Code und schlage Optimierungen vor:

OPTIMIERUNGSZIEL:
${suggestion.description}

TYP: ${suggestion.type}
BETROFFENE KOMPONENTE: ${suggestion.affectedComponents.join(', ')}

DATEI: ${change.filePath}

ORIGINALCODE:
\`\`\`
${change.originalCode}
\`\`\`

${suggestion.metrics && suggestion.metrics.beforeMetrics 
  ? `AKTUELLE METRIKEN:\n${Object.entries(suggestion.metrics.beforeMetrics)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n')}`
  : ''}

Identifiziere Optimierungsmöglichkeiten und schlage einen verbesserten Code vor. 
Fokussiere auf ${suggestion.type === 'performance' ? 'Leistungsverbesserungen' : 'Codequalität'}.
Behalte die grundlegende Funktionalität bei, ändere aber Code, der verbessert werden kann.

Antworte nur mit dem optimierten Code ohne zusätzliche Erklärungen.
`;
      
      try {
        const response = await generateAIContentService({
          prompt,
          model: 'gpt-4o',
          systemPrompt: 'Du bist ein Experte für Codeoptimierung. Generiere optimierten Code basierend auf dem Originalcode und den angegebenen Optimierungszielen.',
          maxTokens: 3072
        });
        
        // Entferne Code-Block-Markierungen
        let optimizedCode = response.replace(/```(?:\w+)?\n([\s\S]*?)\n```/g, '$1').trim();
        
        // Wenn keine Code-Block-Markierungen gefunden wurden, verwende die gesamte Antwort
        if (optimizedCode === response.trim()) {
          optimizedCode = response.trim();
        }
        
        if (optimizedCode && optimizedCode !== change.originalCode) {
          suggestion.suggestedChanges[i].optimizedCode = optimizedCode;
          suggestion.suggestedChanges[i].description = `Optimierung für ${change.filePath} generiert`;
          console.log(`Optimierter Code für ${change.filePath} generiert`);
        } else {
          suggestion.suggestedChanges[i].description = `Keine signifikanten Optimierungsmöglichkeiten in ${change.filePath} gefunden`;
          console.log(`Keine Optimierungsmöglichkeiten für ${change.filePath} gefunden`);
        }
      } catch (error) {
        console.error(`Fehler bei der Generierung optimierten Codes für ${change.filePath}:`, error);
        suggestion.suggestedChanges[i].description = `Fehler bei der Generierung optimierten Codes: ${error}`;
      }
    }
  }

  /**
   * Implementiert einen Optimierungsvorschlag
   */
  public async implementOptimization(suggestionId: string): Promise<boolean> {
    if (!this.isActive) return false;
    
    const suggestion = this.optimizationSuggestions.find(s => s.id === suggestionId);
    
    if (!suggestion) {
      console.log(`Optimierungsvorschlag mit ID ${suggestionId} nicht gefunden`);
      return false;
    }
    
    if (suggestion.status === 'implemented') {
      console.log(`Optimierungsvorschlag ${suggestion.id} ist bereits implementiert`);
      return true;
    }
    
    if (suggestion.status !== 'analyzed' && suggestion.status !== 'approved') {
      console.log(`Optimierungsvorschlag ${suggestion.id} ist noch nicht analysiert oder genehmigt`);
      return false;
    }
    
    console.log(`Implementiere Optimierungsvorschlag: ${suggestion.id}`);
    
    if (this.testMode) {
      console.log('Testmodus: Keine tatsächliche Implementierung durchgeführt');
      suggestion.status = 'approved';
      this.saveOptimizationSuggestions();
      return true;
    }
    
    try {
      // Implementiere die Änderungen
      for (const change of suggestion.suggestedChanges) {
        if (!change.optimizedCode) continue;
        
        const filePath = path.join(this.basePath, change.filePath);
        
        // Erstelle ein Backup der Originaldatei
        const backupPath = `${filePath}.backup-${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // Schreibe die optimierte Version
        fs.writeFileSync(filePath, change.optimizedCode);
        console.log(`Optimierte Version von ${change.filePath} implementiert (Backup: ${backupPath})`);
      }
      
      // Aktualisiere den Status
      suggestion.status = 'implemented';
      suggestion.implementedAt = new Date();
      this.saveOptimizationSuggestions();
      
      console.log(`Optimierungsvorschlag ${suggestion.id} erfolgreich implementiert`);
      
      // Sammle neue Metriken nach der Implementierung
      setTimeout(() => {
        this.collectPerformanceMetrics();
      }, 5 * 60 * 1000); // Warte 5 Minuten, um die Auswirkungen zu messen
      
      return true;
    } catch (error) {
      console.error(`Fehler bei der Implementierung des Optimierungsvorschlags ${suggestion.id}:`, error);
      return false;
    }
  }

  /**
   * Generiert aus einem bekannten Muster einen Optimierungsvorschlag
   */
  public async generateOptimizationFromPattern(pattern: InteractionPattern): Promise<OptimizationSuggestion | null> {
    if (!this.isActive) return null;
    
    console.log(`Generiere Optimierungsvorschlag aus Muster: "${pattern.pattern}"`);
    
    try {
      const prompt = `
Analysiere das folgende erkannte Nutzungsmuster und schlage eine Systemoptimierung vor:

ERKANNTES MUSTER:
${pattern.pattern}

DETAILLIERTE BESCHREIBUNG:
${pattern.description}

POTENTIELLE LÖSUNG (falls vorhanden):
${pattern.potentialSolution || 'Keine vorgeschlagen'}

Antworte im folgenden JSON-Format:
{
  "type": "Eine der folgenden Kategorien: performance, code_quality, user_experience, security, accessibility, seo",
  "description": "Detaillierte Beschreibung der vorgeschlagenen Optimierung",
  "affectedComponents": ["Liste der betroffenen Komponenten"],
  "priority": "Eine der folgenden Prioritäten: low, medium, high, critical",
  "impact": "Geschätzte Auswirkung (0-1)",
  "effort": "Geschätzter Aufwand (0-1)",
  "potentialChanges": [
    {
      "filePath": "Relativer Pfad zur Datei",
      "description": "Beschreibung der vorgeschlagenen Änderung"
    }
  ]
}
`;
      
      const response = await generateAIContentService({
        prompt,
        model: 'gpt-4o',
        systemPrompt: 'Du bist ein Experte für Systemoptimierung und Code-Qualität.',
        maxTokens: 2048
      });
      
      // Extrahiere JSON aus der Antwort
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const optimizationData = JSON.parse(jsonStr);
        
        // Erstelle einen neuen Optimierungsvorschlag
        const newSuggestion: OptimizationSuggestion = {
          id: `pattern-opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: optimizationData.type,
          description: optimizationData.description,
          patternId: pattern.id,
          affectedComponents: optimizationData.affectedComponents,
          suggestedChanges: optimizationData.potentialChanges.map((change: any) => ({
            filePath: change.filePath,
            description: change.description
          })),
          priority: optimizationData.priority,
          impact: parseFloat(optimizationData.impact),
          effort: parseFloat(optimizationData.effort),
          status: 'identified',
          createdAt: new Date()
        };
        
        this.optimizationSuggestions.push(newSuggestion);
        this.saveOptimizationSuggestions();
        
        console.log(`Neuer Optimierungsvorschlag aus Muster erstellt: ${newSuggestion.id}`);
        
        // Analysiere den Vorschlag detaillierter
        this.analyzeOptimizationSuggestion(newSuggestion);
        
        return newSuggestion;
      } else {
        console.log('Konnte kein valides JSON-Format in der KI-Antwort finden');
        return null;
      }
    } catch (error) {
      console.error('Fehler bei der Generierung eines Optimierungsvorschlags aus Muster:', error);
      return null;
    }
  }

  /**
   * Gibt alle Optimierungsvorschläge zurück
   */
  public getOptimizationSuggestions(): OptimizationSuggestion[] {
    return [...this.optimizationSuggestions];
  }

  /**
   * Gibt einen spezifischen Optimierungsvorschlag zurück
   */
  public getOptimizationById(id: string): OptimizationSuggestion | undefined {
    return this.optimizationSuggestions.find(s => s.id === id);
  }

  /**
   * Gibt die Leistungsmetriken zurück
   */
  public getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  /**
   * Lädt die Optimierungsvorschläge aus dem Speicher
   */
  private loadOptimizationSuggestions(): void {
    try {
      const filePath = path.join(this.basePath, 'data', 'optimization-suggestions.json');
      
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.optimizationSuggestions = JSON.parse(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Optimierungsvorschläge:', error);
      this.optimizationSuggestions = [];
    }
  }
  
  /**
   * Speichert die Optimierungsvorschläge
   */
  private saveOptimizationSuggestions(): void {
    try {
      const dataDir = path.join(this.basePath, 'data');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const filePath = path.join(dataDir, 'optimization-suggestions.json');
      fs.writeFileSync(filePath, JSON.stringify(this.optimizationSuggestions, null, 2));
    } catch (error) {
      console.error('Fehler beim Speichern der Optimierungsvorschläge:', error);
    }
  }
  
  /**
   * Lädt die Leistungsmetriken aus dem Speicher
   */
  private loadPerformanceMetrics(): void {
    try {
      const filePath = path.join(this.basePath, 'data', 'performance-metrics.json');
      
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.performanceMetrics = JSON.parse(data);
        
        // Konvertiere Zeitstempel-Strings zurück in Date-Objekte
        this.performanceMetrics.forEach(metric => {
          metric.timestamp = new Date(metric.timestamp);
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Leistungsmetriken:', error);
      this.performanceMetrics = [];
    }
  }
  
  /**
   * Speichert die Leistungsmetriken
   */
  private savePerformanceMetrics(): void {
    try {
      const dataDir = path.join(this.basePath, 'data');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Begrenze die Anzahl der gespeicherten Metriken auf die letzten 1000
      const recentMetrics = this.performanceMetrics.slice(-1000);
      
      const filePath = path.join(dataDir, 'performance-metrics.json');
      fs.writeFileSync(filePath, JSON.stringify(recentMetrics, null, 2));
    } catch (error) {
      console.error('Fehler beim Speichern der Leistungsmetriken:', error);
    }
  }
}

// Singleton-Instanz
let systemOptimizerInstance: SystemOptimizer | null = null;

/**
 * Gibt die System-Optimizer-Instanz zurück
 */
export function getSystemOptimizer(): SystemOptimizer {
  if (!systemOptimizerInstance) {
    systemOptimizerInstance = SystemOptimizer.getInstance();
  }
  return systemOptimizerInstance;
}