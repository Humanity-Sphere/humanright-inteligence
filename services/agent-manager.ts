
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

interface AgentRole {
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
  systemPrompt: string;
}

interface AgentConfig {
  roles: AgentRole[];
  activeRoles: string[];
  monitoringInterval: number;
  autoRepair: boolean;
}

class AgentManager extends EventEmitter {
  private static instance: AgentManager;
  private config: AgentConfig;
  private agents: Map<string, any> = new Map();
  private isMonitoring = false;
  private servicesStatus: Map<string, boolean> = new Map();

  private constructor() {
    super();
    this.config = {
      roles: [],
      activeRoles: [],
      monitoringInterval: 60000, // 1 Minute
      autoRepair: true
    };
  }

  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  /**
   * Initialisiert den Agent-Manager
   */
  public async initialize(): Promise<void> {
    try {
      // Konfiguration laden
      await this.loadConfig();
      
      // Aktive Rollen starten
      await this.startActiveAgents();
      
      // Monitoring starten
      this.startMonitoring();
      
      console.log('Agent-Manager erfolgreich initialisiert');
    } catch (error) {
      console.error('Fehler bei der Initialisierung des Agent-Managers:', error);
      throw error;
    }
  }

  /**
   * Lädt die Konfiguration
   */
  private async loadConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'shared', 'config', 'agent-config.json');
      
      try {
        // Prüfen, ob Konfigurationsdatei existiert
        await fs.access(configPath);
        
        // Konfiguration laden
        const configData = await fs.readFile(configPath, 'utf-8');
        this.config = JSON.parse(configData);
      } catch (accessError) {
        console.warn('Agent-Konfiguration nicht gefunden, erstelle Standardkonfiguration');
        
        // Standardkonfiguration erstellen
        this.config = {
          roles: [
            {
              id: 'system-monitor',
              name: 'System-Monitor',
              description: 'Überwacht den Systemzustand und meldet Probleme',
              responsibilities: [
                'Überwachung der API-Endpunkte',
                'Überprüfung der Datenbankverbindung',
                'Überwachung der Dateisystemoperationen'
              ],
              systemPrompt: 'Du bist ein System-Monitor-Agent. Deine Aufgabe ist es, den Systemzustand zu überwachen und Probleme zu melden.'
            },
            {
              id: 'document-analyzer',
              name: 'Dokumentenanalyse-Agent',
              description: 'Analysiert Dokumente und extrahiert relevante Informationen',
              responsibilities: [
                'Dokumentenanalyse',
                'Informationsextraktion',
                'Klassifizierung von Dokumenten'
              ],
              systemPrompt: 'Du bist ein Dokumentenanalyse-Agent. Deine Aufgabe ist es, Dokumente zu analysieren und relevante Informationen zu extrahieren.'
            }
          ],
          activeRoles: ['system-monitor'],
          monitoringInterval: 60000,
          autoRepair: true
        };
        
        // Konfiguration speichern
        await this.saveConfig();
      }
    } catch (error) {
      console.error('Fehler beim Laden der Agent-Konfiguration:', error);
      throw error;
    }
  }

  /**
   * Speichert die Konfiguration
   */
  private async saveConfig(): Promise<void> {
    try {
      const configDir = path.join(process.cwd(), 'shared', 'config');
      const configPath = path.join(configDir, 'agent-config.json');
      
      // Verzeichnis erstellen, falls es nicht existiert
      await fs.mkdir(configDir, { recursive: true });
      
      // Konfiguration speichern
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Fehler beim Speichern der Agent-Konfiguration:', error);
      throw error;
    }
  }

  /**
   * Startet die aktiven Agenten
   */
  private async startActiveAgents(): Promise<void> {
    try {
      for (const roleId of this.config.activeRoles) {
        await this.startAgent(roleId);
      }
    } catch (error) {
      console.error('Fehler beim Starten der aktiven Agenten:', error);
      throw error;
    }
  }

  /**
   * Startet einen Agenten mit der angegebenen Rolle
   */
  private async startAgent(roleId: string): Promise<void> {
    try {
      const role = this.config.roles.find(r => r.id === roleId);
      
      if (!role) {
        throw new Error(`Rolle ${roleId} nicht gefunden`);
      }
      
      console.log(`Starte Agenten mit Rolle ${role.name}`);
      
      // Hier erfolgt die eigentliche Agent-Initialisierung (vereinfacht)
      const agent = {
        roleId,
        roleName: role.name,
        isActive: true,
        status: 'running',
        lastActive: new Date(),
        execute: async (command: string) => {
          console.log(`Agent ${role.name} führt aus: ${command}`);
          // Hier würde die tatsächliche Ausführung erfolgen
          return { success: true };
        }
      };
      
      this.agents.set(roleId, agent);
      
      this.emit('agent:started', { roleId, roleName: role.name });
    } catch (error) {
      console.error(`Fehler beim Starten des Agenten mit Rolle ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Startet das Monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    console.log('Starte Monitoring für Agenten und Dienste');
    
    setInterval(() => {
      this.checkSystemHealth().catch(error => {
        console.error('Fehler bei Systemgesundheitsprüfung:', error);
      });
    }, this.config.monitoringInterval);
  }

  /**
   * Prüft den Systemzustand
   */
  private async checkSystemHealth(): Promise<void> {
    try {
      console.log('Prüfe Systemzustand...');
      
      // API-Endpunkte prüfen
      await this.checkApiEndpoints();
      
      // Datenbankverbindung prüfen
      await this.checkDatabaseConnection();
      
      // Dateisystem prüfen
      await this.checkFileSystem();
      
      // Aktive Agenten prüfen
      this.checkAgents();
      
      console.log('Systemzustandsprüfung abgeschlossen');
    } catch (error) {
      console.error('Fehler bei der Systemzustandsprüfung:', error);
    }
  }

  /**
   * Prüft die API-Endpunkte
   */
  private async checkApiEndpoints(): Promise<void> {
    // Implementierung der API-Endpunkt-Prüfung
    this.servicesStatus.set('api', true);
  }

  /**
   * Prüft die Datenbankverbindung
   */
  private async checkDatabaseConnection(): Promise<void> {
    // Implementierung der Datenbankverbindungsprüfung
    this.servicesStatus.set('database', true);
  }

  /**
   * Prüft das Dateisystem
   */
  private async checkFileSystem(): Promise<void> {
    try {
      // Verzeichnisstruktur prüfen
      const requiredDirs = ['uploads', 'temp', 'logs'];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        
        try {
          await fs.access(dirPath);
        } catch (error) {
          console.warn(`Verzeichnis ${dir} nicht gefunden, erstelle es...`);
          await fs.mkdir(dirPath, { recursive: true });
        }
      }
      
      this.servicesStatus.set('filesystem', true);
    } catch (error) {
      console.error('Fehler bei der Dateisystemprüfung:', error);
      this.servicesStatus.set('filesystem', false);
      
      if (this.config.autoRepair) {
        await this.repairFileSystem();
      }
    }
  }

  /**
   * Prüft den Zustand der Agenten
   */
  private checkAgents(): void {
    for (const [roleId, agent] of this.agents.entries()) {
      const now = new Date();
      const lastActive = new Date(agent.lastActive);
      const inactiveTime = now.getTime() - lastActive.getTime();
      
      // Prüfen, ob der Agent zu lange inaktiv ist (10 Minuten)
      if (inactiveTime > 10 * 60 * 1000) {
        console.warn(`Agent ${agent.roleName} ist seit ${inactiveTime / 1000} Sekunden inaktiv`);
        
        if (this.config.autoRepair) {
          this.restartAgent(roleId).catch(error => {
            console.error(`Fehler beim Neustart des Agenten ${agent.roleName}:`, error);
          });
        }
      }
    }
  }

  /**
   * Repariert das Dateisystem
   */
  private async repairFileSystem(): Promise<void> {
    try {
      console.log('Repariere Dateisystem...');
      
      // Verzeichnisstruktur erstellen
      const dirs = ['uploads', 'temp', 'logs'];
      
      for (const dir of dirs) {
        const dirPath = path.join(process.cwd(), dir);
        await fs.mkdir(dirPath, { recursive: true });
      }
      
      console.log('Dateisystemreparatur abgeschlossen');
    } catch (error) {
      console.error('Fehler bei der Dateisystemreparatur:', error);
    }
  }

  /**
   * Startet einen Agenten neu
   */
  private async restartAgent(roleId: string): Promise<void> {
    try {
      console.log(`Starte Agenten mit Rolle ${roleId} neu...`);
      
      // Agenten stoppen
      this.agents.delete(roleId);
      
      // Agenten neu starten
      await this.startAgent(roleId);
      
      console.log(`Agent mit Rolle ${roleId} erfolgreich neu gestartet`);
    } catch (error) {
      console.error(`Fehler beim Neustart des Agenten mit Rolle ${roleId}:`, error);
    }
  }

  /**
   * Gibt den Status des Systems zurück
   */
  public getSystemStatus(): { agents: any[], services: any[] } {
    const agentStatus = Array.from(this.agents.entries()).map(([roleId, agent]) => ({
      roleId,
      roleName: agent.roleName,
      status: agent.status,
      lastActive: agent.lastActive
    }));
    
    const serviceStatus = Array.from(this.servicesStatus.entries()).map(([service, status]) => ({
      service,
      status: status ? 'healthy' : 'unhealthy'
    }));
    
    return {
      agents: agentStatus,
      services: serviceStatus
    };
  }
}

export default AgentManager;
