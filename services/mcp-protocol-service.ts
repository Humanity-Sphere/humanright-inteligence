import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * Klasse für die Implementierung des MCP-Protokolls (Monitoring, Communication, Protocol)
 * Ermöglicht automatische Fehlerbehebung und Selbstreparatur
 */
class McpProtocolService extends EventEmitter {
  private static instance: McpProtocolService;
  private isActive = false;
  private errorLog: Array<{timestamp: Date, type: string, message: string, path?: string}> = [];
  private missingPathsQueue: Set<string> = new Set();
  private handlerMap: Map<string, Array<(data: any) => Promise<void>>> = new Map();

  private constructor() {
    super();
    
    // Ereignisbehandlung für nicht behandelte Fehler einrichten
    this.on('error', (err) => {
      console.error('MCP-Protokoll Fehler:', err);
    });
  }

  public static getInstance(): McpProtocolService {
    if (!McpProtocolService.instance) {
      McpProtocolService.instance = new McpProtocolService();
    }
    return McpProtocolService.instance;
  }

  /**
   * Aktiviert das MCP-Protokoll
   */
  public activate(): void {
    try {
      this.isActive = true;
      this.startMonitoring();
      console.log('[MCP] Protokoll aktiviert');
      this.emit('info', { type: 'info', message: 'MCP-Protokoll aktiviert' });
    } catch (error) {
      console.error('[MCP] Aktivierungsfehler:', error);
      this.emit('error', { 
        type: 'error', 
        message: `Fehler beim Aktivieren des MCP-Protokolls: ${error instanceof Error ? error.message : String(error)}` 
      });
      this.handleActivationError();
    }
  }

  private handleActivationError(): void {
    setTimeout(() => {
      this.log('Versuche MCP-Protokoll neu zu starten...');
      this.activate();
    }, 5000);
  }

  private startMonitoring(): void {
    setInterval(() => {
      if (this.isActive) {
        this.checkSystemHealth(); // Changed to checkSystemHealth
      }
    }, 60000);
  }

  private async checkSystemHealth(): Promise<void> {
    try {
      this.log('Starte Systemzustandsprüfung...');

      const checks = [
        this.checkApiEndpoints(),
        this.checkDatabaseConnection(), 
        this.checkFileSystem()
      ];

      const results = await Promise.allSettled(checks);

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        failed.forEach(f => {
          if (f.status === 'rejected') {
            this.log(`Fehler bei Systemcheck: ${f.reason}`, 'error');
          }
        });
      }

      await this.checkAgents();

      this.log('Systemzustandsprüfung abgeschlossen');
    } catch (error) {
      this.log(`Kritischer Fehler bei Systemprüfung: ${error instanceof Error ? error.message : String(error)}`, 'error');
      this.emitErrorEvent('system-check-failed');
    }
  }

  private checkApiEndpoints(): Promise<void> {
    // Add your API endpoint check logic here. This is a placeholder.
    return Promise.resolve();
  }

  private checkDatabaseConnection(): Promise<void> {
    // Add your database connection check logic here. This is a placeholder.
    return Promise.resolve();
  }

  private checkFileSystem(): Promise<void> {
    // Add your file system check logic here. This is a placeholder.
    return Promise.resolve();
  }

  private async checkAgents(): Promise<void> {
    //Placeholder: Add your agent check logic here.
    return Promise.resolve();
  }


  private repairSystem(): void {
    // Add your system repair logic here. This is a placeholder.
    this.log('Systemreparatur abgeschlossen (Placeholder)', 'info');
  }

  /**
   * Registriert einen Handler für einen bestimmten Event-Typ
   */
  public registerHandler(type: string, handler: (data: any) => Promise<void>): void {
    if (!this.handlerMap.has(type)) {
      this.handlerMap.set(type, []);
    }

    this.handlerMap.get(type)!.push(handler);
  }

  /**
   * Meldet einen fehlenden Pfad
   */
  public reportMissingPath(filePath: string): void {
    if (!this.isActive) return;

    console.log(`MCP: Fehlender Pfad gemeldet: ${filePath}`);

    // Protokollieren
    this.errorLog.push({
      timestamp: new Date(),
      type: 'missing-path',
      message: `Pfad nicht gefunden: ${filePath}`,
      path: filePath
    });

    // Zur Warteschlange hinzufügen
    this.missingPathsQueue.add(filePath);

    // Event auslösen
    this.emit('missing-path', { path: filePath });

    // Handler aufrufen
    this.triggerHandlers('missing-path', { path: filePath }).catch(error => {
      console.error('Fehler beim Aufruf der Missing-Path-Handler:', error);
    });
  }

  /**
   * Ruft alle Handler für einen bestimmten Event-Typ auf
   */
  private async triggerHandlers(type: string, data: any): Promise<void> {
    const handlers = this.handlerMap.get(type) || [];

    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Fehler beim Ausführen des Handlers für ${type}:`, error);
      }
    }
  }

  /**
   * Behandelt fehlende Pfade
   */
  private async handleMissingPath(data: { path: string }): Promise<void> {
    try {
      const filePath = data.path;
      const fileDir = path.dirname(filePath);

      // Prüfen, ob das Verzeichnis existiert
      try {
        await fs.access(fileDir);
      } catch (dirError) {
        // Verzeichnis erstellen, wenn es nicht existiert
        console.log(`MCP: Erstelle Verzeichnis: ${fileDir}`);
        await fs.mkdir(fileDir, { recursive: true });
      }

      // Je nach Dateityp eine Standarddatei erstellen
      const ext = path.extname(filePath).toLowerCase();

      let content = '';

      switch (ext) {
        case '.json':
          content = '{}';
          break;
        case '.ts':
        case '.js':
          content = '// Automatisch generierte Datei durch MCP-Protokoll\n\n';

          if (filePath.includes('route') || filePath.includes('api')) {
            content += `import { Router } from 'express';\n\nconst router = Router();\n\n// TODO: Implementiere Routen\n\nexport default router;\n`;
          } else if (filePath.includes('service')) {
            content += `// Service-Klasse\nexport default class Service {\n  constructor() {}\n  \n  // TODO: Implementiere Service-Methoden\n}\n`;
          } else if (filePath.includes('model') || filePath.includes('schema')) {
            content += `// Datenmodell\n\nexport interface Model {\n  id: string;\n  // TODO: Füge weitere Eigenschaften hinzu\n}\n`;
          } else {
            content += `// Modul\n\nexport default {\n  // TODO: Implementiere Module\n};\n`;
          }
          break;
        case '.html':
          content = '<!DOCTYPE html>\n<html>\n<head>\n  <title>MCP Generated</title>\n</head>\n<body>\n  <h1>Automatisch generierte Seite</h1>\n  <p>Diese Seite wurde vom MCP-Protokoll erstellt.</p>\n</body>\n</html>';
          break;
        case '.css':
          content = '/* Automatisch generierte CSS-Datei */\n\nbody {\n  font-family: Arial, sans-serif;\n}\n';
          break;
        default:
          content = '# Automatisch generierte Datei durch MCP-Protokoll\n';
          break;
      }

      // Datei schreiben
      console.log(`MCP: Erstelle Datei: ${filePath}`);
      await fs.writeFile(filePath, content, 'utf-8');

      console.log(`MCP: Datei erfolgreich erstellt: ${filePath}`);

      // Aus der Warteschlange entfernen
      this.missingPathsQueue.delete(filePath);
    } catch (error) {
      console.error(`MCP: Fehler bei der Behandlung des fehlenden Pfades ${data.path}:`, error);
    }
  }

  /**
   * Verarbeitet fehlende Pfade in der Warteschlange
   */
  private processMissingPaths(): void {
    setInterval(() => {
      if (this.missingPathsQueue.size > 0) {
        console.log(`MCP: Verarbeite ${this.missingPathsQueue.size} fehlende Pfade...`);

        const paths = Array.from(this.missingPathsQueue);

        for (const filePath of paths) {
          this.triggerHandlers('missing-path', { path: filePath }).catch(error => {
            console.error(`Fehler bei der Verarbeitung des fehlenden Pfades ${filePath}:`, error);
          });
        }
      }
    }, 5000); // Alle 5 Sekunden
  }

  /**
   * Protokolliert einen Fehler
   */
  public logError(type: string, message: string, path?: string): void {
    if (!this.isActive) return;

    this.errorLog.push({
      timestamp: new Date(),
      type,
      message,
      path
    });

    // Event auslösen
    this.emit('error', { type, message, path });

    // Handler aufrufen
    this.triggerHandlers('error', { type, message, path }).catch(error => {
      console.error('Fehler beim Aufruf der Error-Handler:', error);
    });
  }

    public log(message: string, type: 'error' | 'warning' | 'info' = 'info'): void {
    if (!this.isActive) return;
    
    console.log(`[MCP-${type.toUpperCase()}] ${message}`);
    
    if (type === 'error') {
      this.logError(type, message);
    } else {
      // Für nicht-Fehler verwenden wir direkt emit statt logError
      this.emit(type, { type, message });
    }
  }


  /**
   * Gibt das Fehlerprotokoll zurück
   */
  public getErrorLog(): Array<{timestamp: Date, type: string, message: string, path?: string}> {
    return [...this.errorLog];
  }

  private emitErrorEvent(type: string): void {
    this.emit('error', { type });
  }
}

export default McpProtocolService;