/**
 * Archon Integration Service
 * 
 * Diese Klasse dient als Integration mit dem Archon-Framework für selbstlernende
 * und selbstverwaltende KI-Systeme. Sie stellt die Brücke zwischen der Human Rights 
 * Intelligence App und der Archon-Funktionalität dar.
 * 
 * Basierend auf: https://github.com/coleam00/Archon
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { AISelfRepairAgent } from './ai-self-repair-agent';

/**
 * Interface für Archon-Events
 */
interface ArchonEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
}

/**
 * Konfigurations-Interface für Archon
 */
interface ArchonConfig {
  active: boolean;
  learningRate: number;
  autonomyLevel: 'low' | 'medium' | 'high' | 'full';
  safetyMechanisms: boolean;
  logEventsToDatabase: boolean;
  allowSystemModification: boolean;
}

/**
 * Hauptklasse für die Archon-Integration
 */
export class ArchonIntegration {
  private static instance: ArchonIntegration;
  private eventEmitter: EventEmitter = new EventEmitter();
  private eventHistory: ArchonEvent[] = [];
  private isActive: boolean = false;
  private selfRepairAgent: AISelfRepairAgent;
  private config: ArchonConfig = {
    active: true,
    learningRate: 0.5,
    autonomyLevel: 'medium',
    safetyMechanisms: true,
    logEventsToDatabase: true,
    allowSystemModification: true
  };
  private logFile: string = 'archon_integration.log';

  /**
   * Private Konstruktor (Singleton-Pattern)
   */
  private constructor(selfRepairAgent: AISelfRepairAgent) {
    this.selfRepairAgent = selfRepairAgent;
    
    // Lade Konfiguration aus Datei oder verwende Standardwerte
    this.loadConfig().catch(err => {
      console.error('[ArchonIntegration] Fehler beim Laden der Konfiguration:', err);
      this.saveConfig().catch(console.error);
    });

    // Initialisiere Event-Listener
    this.setupEventListeners();

    console.log('[ArchonIntegration] Archon Integration Service initialisiert');
    this.log('Archon Integration Service initialisiert');
  }

  /**
   * Singleton-Instanz erhalten
   */
  public static getInstance(selfRepairAgent: AISelfRepairAgent): ArchonIntegration {
    if (!ArchonIntegration.instance) {
      ArchonIntegration.instance = new ArchonIntegration(selfRepairAgent);
    }
    return ArchonIntegration.instance;
  }

  /**
   * Aktiviert die Archon-Integration
   */
  public activate(): void {
    this.isActive = true;
    this.config.active = true;
    this.saveConfig().catch(console.error);
    this.log('Archon Integration aktiviert');
    
    // System-Event für die Aktivierung
    this.recordEvent({
      type: 'system',
      data: { action: 'activate', status: 'success' },
      timestamp: new Date(),
      source: 'archon_integration'
    });
  }

  /**
   * Deaktiviert die Archon-Integration
   */
  public deactivate(): void {
    this.isActive = false;
    this.config.active = false;
    this.saveConfig().catch(console.error);
    this.log('Archon Integration deaktiviert');
    
    // System-Event für die Deaktivierung
    this.recordEvent({
      type: 'system',
      data: { action: 'deactivate', status: 'success' },
      timestamp: new Date(),
      source: 'archon_integration'
    });
  }

  /**
   * Gibt an, ob die Archon-Integration aktiv ist
   */
  public isActivated(): boolean {
    return this.isActive;
  }

  /**
   * Konfiguration der Archon-Integration aktualisieren
   */
  public updateConfig(newConfig: Partial<ArchonConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig().catch(console.error);
    
    this.log(`Konfiguration aktualisiert: ${JSON.stringify(newConfig)}`);
    
    // Event für Konfigurationsänderung
    this.recordEvent({
      type: 'config',
      data: { action: 'update', newConfig },
      timestamp: new Date(),
      source: 'archon_integration'
    });
  }

  /**
   * Gibt die aktuelle Konfiguration zurück
   */
  public getConfig(): ArchonConfig {
    return { ...this.config };
  }

  /**
   * Aufzeichnen eines neuen Archon-Events
   */
  public recordEvent(event: ArchonEvent): void {
    if (!this.isActive) return;

    // Füge das Event zur Historie hinzu
    this.eventHistory.push(event);
    
    // Begrenze die Historie auf die letzten 1000 Ereignisse
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }
    
    // Protokolliere das Event
    this.log(`Event: ${event.type} - ${JSON.stringify(event.data)}`);
    
    // Sende das Event an alle Listener
    this.emit('event', event);
    this.emit(`event:${event.type}`, event);
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
   * Event auslösen
   */
  public emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }

  /**
   * Gibt die letzten Events zurück
   */
  public getRecentEvents(count: number = 10, type?: string): ArchonEvent[] {
    let events = [...this.eventHistory];
    
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    return events.slice(-count);
  }

  /**
   * Initialen Event-Listener Setup
   */
  private setupEventListeners(): void {
    // Listener für Selbstreparatur-Agent-Events
    this.on('event:repair', (event: ArchonEvent) => {
      if (event.data.success) {
        this.log(`Selbstreparatur erfolgreich: ${event.data.issueId}`);
      } else {
        this.log(`Selbstreparatur fehlgeschlagen: ${event.data.issueId}`, 'warning');
      }
    });
    
    // Listener für System-Events
    this.on('event:system', (event: ArchonEvent) => {
      this.log(`System-Event: ${JSON.stringify(event.data)}`);
    });
    
    // Verbindung zum Self-Repair-Agent herstellen
    // Hier nutzen wir das normale Event-System, da der Self-Repair-Agent keine eigene 'on' Methode hat
    // Stattdessen können wir in Zukunft ein Event-System implementieren, wenn nötig
    
    // Beispiel für ein manuell erzeugtes Reparatur-Event
    this.recordEvent({
      type: 'repair',
      data: { message: 'Self-Repair-Agent erfolgreich mit Archon verbunden' },
      timestamp: new Date(),
      source: 'self_repair_agent'
    });
  }

  /**
   * Logging-Funktion
   */
  private log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(`[ArchonIntegration] ${message}`);
    
    // Schreibe in Logdatei
    fs.appendFile(this.logFile, logEntry).catch(err => {
      console.error('[ArchonIntegration] Fehler beim Schreiben in Logdatei:', err);
    });
  }

  /**
   * Konfiguration laden
   */
  private async loadConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'archon_config.json');
      const data = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(data);
      
      this.config = { ...this.config, ...config };
      this.isActive = this.config.active;
      
      this.log('Konfiguration geladen');
    } catch (error) {
      // Wenn die Datei nicht existiert, erstelle eine neue mit Standardwerten
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.saveConfig();
        this.log('Standardkonfiguration erstellt');
      } else {
        throw error;
      }
    }
  }

  /**
   * Konfiguration speichern
   */
  private async saveConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'archon_config.json');
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (error) {
      console.error('[ArchonIntegration] Fehler beim Speichern der Konfiguration:', error);
    }
  }

  /**
   * System-Status abrufen
   */
  public getStatus(): { active: boolean, config: ArchonConfig, eventCount: number } {
    return {
      active: this.isActive,
      config: this.config,
      eventCount: this.eventHistory.length
    };
  }

  /**
   * Self-Repair-Agent zurückgeben
   */
  public getSelfRepairAgent(): AISelfRepairAgent {
    return this.selfRepairAgent;
  }
}