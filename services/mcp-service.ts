/**
 * MCP-Service (Model Context Protocol)
 * 
 * Dieser Service implementiert den Model Context Protocol (MCP) Server, der es KI-Modellen ermöglicht,
 * sicher mit lokalen und entfernten Ressourcen zu interagieren.
 * 
 * Basierend auf: https://github.com/punkpeye/awesome-mcp-servers
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { Server } from 'socket.io';
import http from 'http';
import { compareTwoStrings } from 'string-similarity';

// MCP Typdefinitionen
export interface MCPResource {
  id: string;
  type: 'file' | 'database' | 'api' | 'memory' | 'function';
  name: string;
  description: string;
  metadata: Record<string, any>;
  content?: any;
}

export interface MCPRequestContext {
  requestId: string;
  sessionId: string;
  userId?: string;
  timestamp: number;
  modelId?: string;
  maxTokens?: number;
}

export interface MCPRequest {
  context: MCPRequestContext;
  action: 'read' | 'write' | 'list' | 'search' | 'execute' | 'analyze';
  resourceType: string;
  resourceId?: string;
  query?: string;
  content?: any;
}

export interface MCPResponse {
  requestId: string;
  status: 'success' | 'error' | 'pending';
  resourceType?: string;
  resourceId?: string;
  content?: any;
  error?: {
    code: string;
    message: string;
  };
}

export class MCPServer {
  private static instance: MCPServer;
  private resources: Map<string, MCPResource> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private httpServer?: http.Server;
  private socketServer?: Server;
  private functionHandlers: Map<string, Function> = new Map();
  private isRunning: boolean = false;
  private resourceAccessLog: Array<{
    timestamp: number;
    resourceId: string;
    action: string;
    userId?: string;
  }> = [];

  private constructor() {
    // Private Konstruktor für Singleton
  }

  public static getInstance(): MCPServer {
    if (!MCPServer.instance) {
      MCPServer.instance = new MCPServer();
    }
    return MCPServer.instance;
  }

  /**
   * Startet den MCP-Server
   * @param port Der Port für den Socket.IO-Server
   * @param httpServer Optionaler HTTP-Server, der für Socket.IO verwendet werden soll
   */
  public async start(port: number = 3333, httpServer?: http.Server): Promise<void> {
    if (this.isRunning) {
      console.log('MCP-Server läuft bereits');
      return;
    }

    try {
      // HTTP-Server verwenden oder einen neuen erstellen
      this.httpServer = httpServer || http.createServer();
      
      // Socket.IO-Server initialisieren
      this.socketServer = new Server(this.httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        }
      });

      // Ereignisbehandlung einrichten
      this.setupEventHandlers();

      // Wenn kein externer HTTP-Server übergeben wurde, starten wir unseren eigenen
      if (!httpServer) {
        this.httpServer.listen(port, () => {
          console.log(`MCP-Server gestartet auf Port ${port}`);
        });
      }

      this.isRunning = true;
      console.log('MCP-Server erfolgreich initialisiert');
    } catch (error) {
      console.error('Fehler beim Starten des MCP-Servers:', error);
      throw error;
    }
  }

  /**
   * Stoppt den MCP-Server
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Socket.IO-Server schließen, wenn vorhanden
      if (this.socketServer) {
        this.socketServer.close();
      }
      
      // HTTP-Server schließen, wenn er von uns gestartet wurde
      if (this.httpServer) {
        this.httpServer.close();
      }

      this.isRunning = false;
      console.log('MCP-Server wurde gestoppt');
    } catch (error) {
      console.error('Fehler beim Stoppen des MCP-Servers:', error);
      throw error;
    }
  }

  /**
   * Socket.IO-Ereignisbehandlung einrichten
   */
  private setupEventHandlers(): void {
    if (!this.socketServer) {
      console.error('Socket.IO-Server wurde nicht initialisiert');
      return;
    }

    this.socketServer.on('connection', (socket) => {
      console.log(`Neue MCP-Verbindung: ${socket.id}`);

      // Anfrage vom Client empfangen
      socket.on('mcp:request', async (request: MCPRequest) => {
        try {
          const response = await this.handleRequest(request);
          socket.emit('mcp:response', response);
        } catch (error: any) {
          // Fehlerbehandlung
          socket.emit('mcp:response', {
            requestId: request.context.requestId,
            status: 'error',
            error: {
              code: 'INTERNAL_ERROR',
              message: error.message || 'Unbekannter Fehler bei der Anfrageverarbeitung'
            }
          });
        }
      });

      // Client-Trennung verarbeiten
      socket.on('disconnect', () => {
        console.log(`MCP-Verbindung geschlossen: ${socket.id}`);
      });
    });
  }

  /**
   * Verarbeitet eine eingehende MCP-Anfrage
   */
  private async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    console.log(`Verarbeite MCP-Anfrage: ${request.action} für ${request.resourceType}`);

    // Anfrage im Zugriffslog protokollieren
    this.logResourceAccess(request);

    try {
      switch (request.action) {
        case 'list':
          return this.handleListRequest(request);
        case 'read':
          return this.handleReadRequest(request);
        case 'write':
          return this.handleWriteRequest(request);
        case 'search':
          return this.handleSearchRequest(request);
        case 'execute':
          return this.handleExecuteRequest(request);
        case 'analyze':
          return this.handleAnalyzeRequest(request);
        default:
          return {
            requestId: request.context.requestId,
            status: 'error',
            error: {
              code: 'INVALID_ACTION',
              message: `Unbekannte Aktion: ${request.action}`
            }
          };
      }
    } catch (error: any) {
      console.error('Fehler bei der Anfrageverarbeitung:', error);
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'REQUEST_PROCESSING_ERROR',
          message: error.message || 'Fehler bei der Anfrageverarbeitung'
        }
      };
    }
  }

  /**
   * Verarbeitet eine 'list'-Anfrage, um verfügbare Ressourcen aufzulisten
   */
  private handleListRequest(request: MCPRequest): MCPResponse {
    const resourcesArray = Array.from(this.resources.values())
      .filter(resource => !request.resourceType || resource.type === request.resourceType)
      .map(({ id, type, name, description, metadata }) => ({
        id, type, name, description, metadata
      }));

    return {
      requestId: request.context.requestId,
      status: 'success',
      resourceType: request.resourceType,
      content: resourcesArray
    };
  }

  /**
   * Verarbeitet eine 'read'-Anfrage, um den Inhalt einer Ressource zu lesen
   */
  private handleReadRequest(request: MCPRequest): MCPResponse {
    if (!request.resourceId) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'MISSING_RESOURCE_ID',
          message: 'Die Ressourcen-ID fehlt in der Anfrage'
        }
      };
    }

    const resource = this.resources.get(request.resourceId);
    if (!resource) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: `Ressource mit ID ${request.resourceId} nicht gefunden`
        }
      };
    }

    return {
      requestId: request.context.requestId,
      status: 'success',
      resourceType: resource.type,
      resourceId: resource.id,
      content: resource.content
    };
  }

  /**
   * Verarbeitet eine 'write'-Anfrage, um den Inhalt einer Ressource zu schreiben/aktualisieren
   */
  private handleWriteRequest(request: MCPRequest): MCPResponse {
    if (!request.resourceId) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'MISSING_RESOURCE_ID',
          message: 'Die Ressourcen-ID fehlt in der Anfrage'
        }
      };
    }

    if (request.content === undefined) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'MISSING_CONTENT',
          message: 'Der zu schreibende Inhalt fehlt in der Anfrage'
        }
      };
    }

    // Existierende Ressource aktualisieren oder neue erstellen
    const existingResource = this.resources.get(request.resourceId);
    
    if (existingResource) {
      // Ressource aktualisieren
      existingResource.content = request.content;
      this.resources.set(request.resourceId, existingResource);
    } else {
      // Neue Ressource erstellen
      const newResource: MCPResource = {
        id: request.resourceId,
        type: request.resourceType as any, // Cast zu richtigem Typ
        name: request.resourceId,
        description: `Automatisch erstellte Ressource für ${request.resourceType}`,
        metadata: {},
        content: request.content
      };
      this.resources.set(request.resourceId, newResource);
    }

    return {
      requestId: request.context.requestId,
      status: 'success',
      resourceType: request.resourceType,
      resourceId: request.resourceId
    };
  }

  /**
   * Verarbeitet eine 'search'-Anfrage, um nach Ressourcen zu suchen
   */
  private handleSearchRequest(request: MCPRequest): MCPResponse {
    if (!request.query) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'MISSING_QUERY',
          message: 'Die Suchanfrage fehlt'
        }
      };
    }

    // Ressourcen filtern nach Typ und Name/Beschreibung
    const matchingResources = Array.from(this.resources.values())
      .filter(resource => {
        // Nach Ressourcentyp filtern, wenn angegeben
        if (request.resourceType && resource.type !== request.resourceType) {
          return false;
        }

        // Nach Suchbegriff im Namen, der Beschreibung oder Metadaten suchen
        const query = request.query?.toLowerCase() || '';
        const nameMatch = resource.name.toLowerCase().includes(query);
        const descMatch = resource.description.toLowerCase().includes(query);

        // Ähnlichkeit zum Namen und zur Beschreibung berechnen
        const nameSimilarity = compareTwoStrings(resource.name.toLowerCase(), query);
        const descSimilarity = compareTwoStrings(resource.description.toLowerCase(), query);

        // Entweder direkte Übereinstimmung oder hohe Ähnlichkeit
        return nameMatch || descMatch || nameSimilarity > 0.6 || descSimilarity > 0.6;
      })
      .map(({ id, type, name, description, metadata }) => ({
        id, type, name, description, metadata
      }));

    return {
      requestId: request.context.requestId,
      status: 'success',
      resourceType: request.resourceType,
      content: matchingResources
    };
  }

  /**
   * Verarbeitet eine 'execute'-Anfrage, um eine Funktion auszuführen
   */
  private async handleExecuteRequest(request: MCPRequest): Promise<MCPResponse> {
    if (!request.resourceId) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'MISSING_RESOURCE_ID',
          message: 'Die Funktions-ID fehlt in der Anfrage'
        }
      };
    }

    const handler = this.functionHandlers.get(request.resourceId);
    if (!handler) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'FUNCTION_NOT_FOUND',
          message: `Funktion mit ID ${request.resourceId} nicht gefunden`
        }
      };
    }

    try {
      // Funktion mit dem übergebenen Inhalt als Parameter ausführen
      const result = await handler(request.content);
      
      return {
        requestId: request.context.requestId,
        status: 'success',
        resourceType: 'function',
        resourceId: request.resourceId,
        content: result
      };
    } catch (error: any) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'FUNCTION_EXECUTION_ERROR',
          message: error.message || 'Fehler bei der Funktionsausführung'
        }
      };
    }
  }

  /**
   * Verarbeitet eine 'analyze'-Anfrage, um Daten zu analysieren (spezielle Funktion)
   */
  private async handleAnalyzeRequest(request: MCPRequest): Promise<MCPResponse> {
    if (!request.content) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'MISSING_CONTENT',
          message: 'Zu analysierende Daten fehlen in der Anfrage'
        }
      };
    }

    try {
      // Einfache Beispielanalyse - in der Praxis würde hier eine echte Analyse durchgeführt
      const analysisResult = {
        analyzedAt: new Date().toISOString(),
        contentType: typeof request.content,
        contentSize: JSON.stringify(request.content).length,
        summary: `Analyse des Inhalts vom Typ ${typeof request.content}`,
        // Hier könnten weitere spezifische Analyseergebnisse hinzugefügt werden
      };
      
      return {
        requestId: request.context.requestId,
        status: 'success',
        resourceType: 'analysis',
        content: analysisResult
      };
    } catch (error: any) {
      return {
        requestId: request.context.requestId,
        status: 'error',
        error: {
          code: 'ANALYSIS_ERROR',
          message: error.message || 'Fehler bei der Datenanalyse'
        }
      };
    }
  }

  /**
   * Registriert eine neue Ressource im MCP-Server
   */
  public registerResource(resource: MCPResource): void {
    this.resources.set(resource.id, resource);
    console.log(`Ressource registriert: ${resource.id} (${resource.type})`);
    
    // Ereignis auslösen
    this.eventEmitter.emit('resource:added', resource);
  }

  /**
   * Entfernt eine Ressource aus dem MCP-Server
   */
  public unregisterResource(resourceId: string): boolean {
    const exists = this.resources.has(resourceId);
    if (exists) {
      const resource = this.resources.get(resourceId);
      this.resources.delete(resourceId);
      console.log(`Ressource entfernt: ${resourceId}`);
      
      // Ereignis auslösen
      if (resource) {
        this.eventEmitter.emit('resource:removed', resource);
      }
    }
    return exists;
  }

  /**
   * Registriert eine ausführbare Funktion
   */
  public registerFunction(id: string, name: string, description: string, handler: Function): void {
    // Funktionsressource registrieren
    this.registerResource({
      id,
      type: 'function',
      name,
      description,
      metadata: {}
    });
    
    // Funktionshandler speichern
    this.functionHandlers.set(id, handler);
    console.log(`Funktion registriert: ${id} (${name})`);
  }

  /**
   * Aktualisiert den Inhalt einer bestehenden Ressource
   */
  public updateResourceContent(resourceId: string, content: any): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      return false;
    }

    resource.content = content;
    this.resources.set(resourceId, resource);
    
    // Ereignis auslösen
    this.eventEmitter.emit('resource:updated', resource);
    
    return true;
  }

  /**
   * Protokolliert einen Ressourcenzugriff
   */
  private logResourceAccess(request: MCPRequest): void {
    this.resourceAccessLog.push({
      timestamp: Date.now(),
      resourceId: request.resourceId || 'unknown',
      action: request.action,
      userId: request.context.userId
    });
  }

  /**
   * Gibt die Zugriffsprotokolle zurück
   */
  public getAccessLogs(): Array<{
    timestamp: number;
    resourceId: string;
    action: string;
    userId?: string;
  }> {
    return this.resourceAccessLog;
  }

  /**
   * Registriert einen Event-Listener
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Entfernt einen Event-Listener
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Prüft, ob der MCP-Server läuft
   */
  public isServerRunning(): boolean {
    return this.isRunning;
  }
}

// Singleton-Instanz exportieren
export const mcpServer = MCPServer.getInstance();

// Hilfsfunktion zum Initialisieren des MCP-Servers
export async function initializeMCPServer(port?: number, httpServer?: http.Server): Promise<MCPServer> {
  try {
    await mcpServer.start(port, httpServer);
    return mcpServer;
  } catch (error) {
    console.error('Fehler beim Initialisieren des MCP-Servers:', error);
    throw error;
  }
}

// Standardressourcen registrieren
export function registerDefaultResources(): void {
  // Beispiel für eine Dateiressource
  mcpServer.registerResource({
    id: 'system-info',
    type: 'memory',
    name: 'Systeminformationen',
    description: 'Grundlegende Informationen über das System',
    metadata: {
      category: 'system',
      readOnly: true
    },
    content: {
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
      startTime: new Date().toISOString()
    }
  });

  // Beispiel für eine Funktionsressource
  mcpServer.registerFunction(
    'echo-function',
    'Echo-Funktion',
    'Gibt die übergebenen Daten unverändert zurück',
    (data: any) => data
  );
  
  // Selbstreparatur-Ressource registrieren
  mcpServer.registerFunction(
    'self-repair-check',
    'Selbstreparatur-Prüfung',
    'Prüft das System auf Probleme und repariert diese automatisch',
    async () => {
      try {
        // Versuche den Self-Repair-Agent zu importieren und zu verwenden
        const { selfRepairAgent } = await import('./ai-self-repair-agent');
        if (selfRepairAgent && selfRepairAgent.isActivated()) {
          const issues = await selfRepairAgent.detectIssues();
          return {
            status: 'success',
            message: `Selbstreparatur-Prüfung abgeschlossen. ${issues.length} Problem(e) erkannt.`,
            issuesDetected: issues.length,
            issues: issues.map(issue => ({
              id: issue.id,
              type: issue.type,
              component: issue.component,
              description: issue.description,
              severity: issue.severity,
              status: issue.status
            }))
          };
        } else {
          return {
            status: 'warning',
            message: 'Selbstreparatur-Agent ist nicht aktiviert oder nicht verfügbar.'
          };
        }
      } catch (error) {
        console.error('Fehler bei der Selbstreparatur-Prüfung:', error);
        return {
          status: 'error',
          message: `Fehler bei der Selbstreparatur-Prüfung: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  );

  // Beispiel für eine komplexere Funktion
  mcpServer.registerFunction(
    'system-stats',
    'Systemstatistiken',
    'Liefert aktuelle Systemstatistiken',
    () => {
      return {
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    }
  );
}