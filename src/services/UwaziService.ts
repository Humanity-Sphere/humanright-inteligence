import axios, { AxiosInstance } from 'axios';
import { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { LocalStorageService } from './LocalStorageService';

/**
 * Konfiguration für den Uwazi-Service
 */
export interface UwaziConfig {
  apiUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  offlineEnabled: boolean;
  syncIntervalMinutes: number;
}

/**
 * Parameter zum Abrufen von Dokumenten
 */
export interface FetchDocumentsParams {
  searchTerm?: string;
  filters?: Record<string, any>;
  types?: string[];
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

/**
 * Parameter zum Abrufen von Entitäten
 */
export interface FetchEntitiesParams {
  searchTerm?: string;
  templates?: string[];
  sharedId?: string;
  publishedStatus?: 'published' | 'unpublished' | 'all';
  limit?: number;
  page?: number;
}

/**
 * Status der Synchronisation
 */
export interface SyncStatus {
  lastSync: Date | null;
  inProgress: boolean;
  pendingChanges: number;
  error: string | null;
}

/**
 * Uwazi-Service für die mobile App
 */
export class UwaziService {
  private api: AxiosInstance;
  private config: UwaziConfig;
  private db: SQLiteDatabase | null = null;
  private localStorage: LocalStorageService;
  private syncStatus: SyncStatus = {
    lastSync: null,
    inProgress: false,
    pendingChanges: 0,
    error: null
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private authToken: string | null = null;
  private authTokenExpiration: number = 0;

  /**
   * Erstellt eine neue Uwazi-Service-Instanz
   */
  constructor(config: UwaziConfig, localStorageService: LocalStorageService) {
    this.config = {
      ...config,
      syncIntervalMinutes: config.syncIntervalMinutes || 15,
    };
    this.localStorage = localStorageService;

    this.api = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request-Interceptor für Authentifizierung
    this.api.interceptors.request.use(async (config) => {
      const token = await this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response-Interceptor für Offline-Modus
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Wenn kein Netzwerk verfügbar ist und Offline-Modus aktiviert ist
        if (
          !error.response &&
          error.request &&
          this.config.offlineEnabled
        ) {
          console.log('Netzwerkfehler, versuche Offline-Daten zu verwenden');
          return this.handleOfflineFallback(error.config);
        }
        return Promise.reject(error);
      }
    );

    // Initialisierung
    this.initialize();
  }

  /**
   * Initialisiert den Service und die lokale Datenbank
   */
  private async initialize() {
    // Nur initialisieren, wenn Offline-Modus aktiviert ist
    if (this.config.offlineEnabled) {
      await this.initializeOfflineDatabase();
      this.startSyncInterval();

      // Letzte Synchronisationszeit laden
      const lastSync = await this.localStorage.getItem('uwazi_last_sync');
      if (lastSync) {
        this.syncStatus.lastSync = new Date(lastSync);
      }

      // Prüfen, ob Änderungen ausstehen
      await this.checkPendingChanges();
    }
  }

  /**
   * Initialisiert die Offline-Datenbank
   */
  private async initializeOfflineDatabase() {
    try {
      const db = await this.openDatabase();

      // Tabellen erstellen, falls sie nicht existieren
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          title TEXT,
          content TEXT,
          document_type TEXT,
          created_at TEXT,
          updated_at TEXT,
          metadata TEXT,
          is_synced INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS entities (
          id TEXT PRIMARY KEY,
          title TEXT,
          entity_type TEXT,
          template TEXT,
          created_at TEXT,
          updated_at TEXT,
          metadata TEXT,
          is_synced INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          object_type TEXT,
          object_id TEXT,
          action TEXT,
          data TEXT,
          created_at TEXT
        );
      `);

      console.log('Offline-Datenbank initialisiert');
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Offline-Datenbank:', error);
    }
  }

  /**
   * Öffnet die SQLite-Datenbank
   */
  private async openDatabase() {
    if (this.db) return this.db;

    try {
      const { openDatabase } = require('expo-sqlite');
      this.db = openDatabase('uwazi_offline.db');
      return this.db;
    } catch (error) {
      console.error('Fehler beim Öffnen der Datenbank:', error);
      throw error;
    }
  }

  /**
   * Startet den Synchronisations-Intervall
   */
  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.synchronize();
    }, this.config.syncIntervalMinutes * 60 * 1000);
  }

  /**
   * Holt ein Authentifizierungstoken von Uwazi
   */
  private async getAuthToken(): Promise<string | null> {
    // Token zurückgeben, wenn es noch gültig ist
    if (this.authToken && Date.now() < this.authTokenExpiration) {
      return this.authToken;
    }

    try {
      // Zuerst prüfen, ob im lokalen Speicher ein Token vorhanden ist
      const cachedToken = await this.localStorage.getItem('uwazi_auth_token');
      const tokenExpiration = await this.localStorage.getItem('uwazi_token_expiration');

      if (cachedToken && tokenExpiration && Date.now() < Number(tokenExpiration)) {
        this.authToken = cachedToken;
        this.authTokenExpiration = Number(tokenExpiration);
        return this.authToken;
      }

      // Authentifizierung mit Benutzername und Passwort
      if (this.config.username && this.config.password) {
        const response = await axios.post(`${this.config.apiUrl}/api/login`, {
          username: this.config.username,
          password: this.config.password,
        });

        if (response.data.token) {
          this.authToken = response.data.token;
          // Token läuft in 24 Stunden ab (typisch für Uwazi)
          this.authTokenExpiration = Date.now() + 24 * 60 * 60 * 1000;

          // Token im lokalen Speicher cachen
          await this.localStorage.setItem('uwazi_auth_token', this.authToken);
          await this.localStorage.setItem('uwazi_token_expiration', String(this.authTokenExpiration));

          return this.authToken;
        }
      }

      // Wenn API-Key angegeben wurde, diesen verwenden
      if (this.config.apiKey) {
        this.authToken = this.config.apiKey;
        this.authTokenExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 Tage

        // Token im lokalen Speicher cachen
        await this.localStorage.setItem('uwazi_auth_token', this.authToken);
        await this.localStorage.setItem('uwazi_token_expiration', String(this.authTokenExpiration));

        return this.authToken;
      }

      console.warn('Keine Authentifizierungsdaten angegeben.');
      return null;
    } catch (error) {
      console.error('Fehler bei der Authentifizierung:', error);
      return null;
    }
  }

  /**
   * Behandelt Fallback für Offline-Zugriff
   */
  private async handleOfflineFallback(config: any) {
    if (!this.config.offlineEnabled || !this.db) {
      throw new Error('Offline-Modus ist nicht aktiviert');
    }

    const url = config.url;
    const method = config.method.toLowerCase();

    // Unterschiedliche Behandlung basierend auf der Anfrage
    if (url.includes('/api/documents') && method === 'get') {
      const params = config.params || {};
      return this.getOfflineDocuments(params);
    }

    if (url.includes('/api/entities') && method === 'get') {
      const params = config.params || {};
      return this.getOfflineEntities(params);
    }

    // Bei Schreiboperationen zur Synchronisationswarteschlange hinzufügen
    if (['post', 'put', 'delete'].includes(method)) {
      await this.addToSyncQueue(url, method, config.data);
      // Mockantwort zurückgeben
      return {
        data: {
          success: true,
          message: 'Operation zur Synchronisationswarteschlange hinzugefügt',
          offline: true
        }
      };
    }

    throw new Error(`Keine Offline-Unterstützung für ${method.toUpperCase()} ${url}`);
  }

  /**
   * Fügt eine Operation zur Synchronisationswarteschlange hinzu
   */
  private async addToSyncQueue(url: string, method: string, data: any) {
    if (!this.db) return;

    const objectType = url.includes('/documents') 
      ? 'document' 
      : url.includes('/entities') 
        ? 'entity' 
        : 'unknown';

    let objectId = '';
    let action = '';

    // Aktion und Objekt-ID bestimmen
    if (method === 'post' && data && !data.id && !data.sharedId) {
      action = 'create';
      objectId = `temp_${Date.now()}`;
    } else if (method === 'post' || method === 'put') {
      action = 'update';
      objectId = data.sharedId || data.id;
    } else if (method === 'delete') {
      action = 'delete';
      objectId = url.split('/').pop() || '';
    }

    // Zur Warteschlange hinzufügen
    try {
      await this.db.execAsync(
        `INSERT INTO sync_queue (id, object_type, object_id, action, data, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `${action}_${objectType}_${objectId}`,
          objectType,
          objectId,
          action,
          JSON.stringify(data),
          new Date().toISOString()
        ]
      );

      // Zähler erhöhen
      this.syncStatus.pendingChanges++;

    } catch (error) {
      console.error('Fehler beim Hinzufügen zur Synchronisationswarteschlange:', error);
    }
  }

  /**
   * Ruft Dokumente aus der Offline-Datenbank ab
   */
  private async getOfflineDocuments(params: any) {
    if (!this.db) throw new Error('Datenbank nicht initialisiert');

    let query = 'SELECT * FROM documents';
    const queryParams: any[] = [];

    // Filter anwenden
    if (params.searchTerm) {
      query += ' WHERE title LIKE ? OR content LIKE ?';
      queryParams.push(`%${params.searchTerm}%`, `%${params.searchTerm}%`);
    }

    // Sortierung
    query += ' ORDER BY updated_at DESC';

    // Paginierung
    const limit = params.limit || 10;
    const page = params.page || 1;
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    try {
      const documents = await this.db.execAsync(query, queryParams);

      // Gesamtzahl der Dokumente abrufen
      const countResult = await this.db.execAsync(
        'SELECT COUNT(*) as total FROM documents',
        []
      );
      const totalRows = countResult.rows?._array?.[0]?.total || 0;

      return {
        data: {
          rows: documents.rows?._array.map(doc => ({
            ...doc,
            metadata: JSON.parse(doc.metadata || '{}'),
            offline: true
          })) || [],
          totalRows,
          totalPages: Math.ceil(totalRows / limit)
        }
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Offline-Dokumente:', error);
      throw error;
    }
  }

  /**
   * Ruft Entitäten aus der Offline-Datenbank ab
   */
  private async getOfflineEntities(params: any) {
    if (!this.db) throw new Error('Datenbank nicht initialisiert');

    let query = 'SELECT * FROM entities';
    const queryParams: any[] = [];

    // Filter anwenden
    if (params.searchTerm) {
      query += ' WHERE title LIKE ?';
      queryParams.push(`%${params.searchTerm}%`);
    }

    if (params.sharedId) {
      query += queryParams.length ? ' AND id = ?' : ' WHERE id = ?';
      queryParams.push(params.sharedId);
    }

    if (params.templates && params.templates.length) {
      query += queryParams.length ? ' AND template IN (?)' : ' WHERE template IN (?)';
      queryParams.push(params.templates.join(','));
    }

    // Sortierung
    query += ' ORDER BY updated_at DESC';

    // Paginierung
    const limit = params.limit || 10;
    const page = params.page || 1;
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    try {
      const entities = await this.db.execAsync(query, queryParams);

      // Gesamtzahl der Entitäten abrufen
      const countResult = await this.db.execAsync(
        'SELECT COUNT(*) as total FROM entities',
        []
      );
      const totalRows = countResult.rows?._array?.[0]?.total || 0;

      return {
        data: {
          rows: entities.rows?._array.map(entity => ({
            ...entity,
            metadata: JSON.parse(entity.metadata || '{}'),
            offline: true
          })) || [],
          totalRows,
          totalPages: Math.ceil(totalRows / limit)
        }
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Offline-Entitäten:', error);
      throw error;
    }
  }

  /**
   * Prüft, ob Änderungen ausstehen
   */
  private async checkPendingChanges() {
    if (!this.db) return;

    try {
      const result = await this.db.execAsync(
        'SELECT COUNT(*) as count FROM sync_queue',
        []
      );

      this.syncStatus.pendingChanges = result.rows?._array?.[0]?.count || 0;
    } catch (error) {
      console.error('Fehler beim Prüfen ausstehender Änderungen:', error);
    }
  }

  /**
   * Synchronisiert lokale Daten mit dem Server
   */
  async synchronize() {
    if (this.syncStatus.inProgress) {
      console.log('Synchronisation läuft bereits');
      return;
    }

    if (!this.config.offlineEnabled || !this.db) {
      console.log('Offline-Modus ist nicht aktiviert');
      return;
    }

    this.syncStatus.inProgress = true;
    this.syncStatus.error = null;

    try {
      console.log('Starte Synchronisation');

      // 1. Ausstehende Änderungen hochladen
      await this.uploadPendingChanges();

      // 2. Neue Daten herunterladen
      await this.downloadNewData();

      // Synchronisationsstatus aktualisieren
      this.syncStatus.lastSync = new Date();
      await this.localStorage.setItem('uwazi_last_sync', this.syncStatus.lastSync.toISOString());
      this.syncStatus.pendingChanges = 0;

      console.log('Synchronisation abgeschlossen', this.syncStatus);
    } catch (error) {
      console.error('Fehler bei der Synchronisation:', error);
      this.syncStatus.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.syncStatus.inProgress = false;
    }
  }

  /**
   * Lädt ausstehende Änderungen zum Server hoch
   */
  private async uploadPendingChanges() {
    if (!this.db) return;

    try {
      // Alle ausstehenden Änderungen abrufen, nach Erstellungszeit sortiert
      const queueResult = await this.db.execAsync(
        'SELECT * FROM sync_queue ORDER BY created_at ASC',
        []
      );

      const queue = queueResult.rows?._array || [];

      for (const item of queue) {
        try {
          // Aktion basierend auf Typ ausführen
          const objectType = item.object_type;
          const action = item.action;
          const data = JSON.parse(item.data || '{}');

          switch (`${objectType}_${action}`) {
            case 'document_create':
              await this.api.post('/api/documents', data);
              break;
            case 'document_update':
              await this.api.post('/api/documents', data);
              break;
            case 'document_delete':
              await this.api.delete(`/api/documents?sharedId=${item.object_id}`);
              break;
            case 'entity_create':
              await this.api.post('/api/entities', data);
              break;
            case 'entity_update':
              await this.api.post('/api/entities', data);
              break;
            case 'entity_delete':
              await this.api.delete(`/api/entities?sharedId=${item.object_id}`);
              break;
          }

          // Nach erfolgreicher Ausführung aus der Warteschlange entfernen
          await this.db.execAsync(
            'DELETE FROM sync_queue WHERE id = ?',
            [item.id]
          );

        } catch (error) {
          console.error(`Fehler beim Verarbeiten von Synchronisationselement ${item.id}:`, error);
          // Fortfahren mit dem nächsten Element
        }
      }
    } catch (error) {
      console.error('Fehler beim Hochladen ausstehender Änderungen:', error);
      throw error;
    }
  }

  /**
   * Lädt neue Daten vom Server herunter
   */
  private async downloadNewData() {
    if (!this.db) return;

    try {
      // Letzte Synchronisationszeit ermitteln
      const lastSync = this.syncStatus.lastSync || new Date(0);
      const lastSyncISO = lastSync.toISOString();

      // Neue Dokumente abrufen
      const documentsResponse = await this.api.get('/api/documents', {
        params: {
          // In Uwazi gibt es keinen direkten Filter für "seit letzter Aktualisierung"
          // Daher rufen wir eine größere Menge ab und filtern lokal
          limit: 100
        }
      });

      // Neue Entitäten abrufen
      const entitiesResponse = await this.api.get('/api/entities', {
        params: {
          limit: 100
        }
      });

      // Dokumente in die lokale Datenbank einfügen oder aktualisieren
      for (const doc of documentsResponse.data.rows) {
        const docUpdatedAt = new Date(doc.updatedAt || doc.createdAt);

        // Nur neuere Dokumente synchronisieren
        if (docUpdatedAt > lastSync) {
          await this.db.execAsync(
            `INSERT OR REPLACE INTO documents
             (id, title, content, document_type, created_at, updated_at, metadata, is_synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              doc.sharedId,
              doc.title,
              doc.fullText || doc.text || '',
              doc.documentType || 'document',
              doc.createdAt,
              doc.updatedAt || doc.createdAt,
              JSON.stringify(doc.metadata || {})
            ]
          );
        }
      }

      // Entitäten in die lokale Datenbank einfügen oder aktualisieren
      for (const entity of entitiesResponse.data.rows) {
        const entityUpdatedAt = new Date(entity.updatedAt || entity.createdAt);

        // Nur neuere Entitäten synchronisieren
        if (entityUpdatedAt > lastSync) {
          await this.db.execAsync(
            `INSERT OR REPLACE INTO entities
             (id, title, entity_type, template, created_at, updated_at, metadata, is_synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              entity.sharedId,
              entity.title,
              entity.type || 'entity',
              entity.template || '',
              entity.createdAt,
              entity.updatedAt || entity.createdAt,
              JSON.stringify(entity.metadata || {})
            ]
          );
        }
      }
    } catch (error) {
      console.error('Fehler beim Herunterladen neuer Daten:', error);
      throw error;
    }
  }

  /**
   * Ruft den aktuellen Synchronisationsstatus ab
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Ruft Dokumente aus Uwazi ab
   */
  async fetchDocuments(params: FetchDocumentsParams = {}) {
    try {
      const response = await this.api.get('/api/documents', { params });
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen von Dokumenten:', error);
      throw error;
    }
  }

  /**
   * Ruft ein einzelnes Dokument anhand seiner ID ab
   */
  async fetchDocumentById(sharedId: string) {
    try {
      const response = await this.api.get('/api/documents', {
        params: { sharedId }
      });
      return response.data.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Dokuments mit ID ${sharedId}:`, error);
      throw error;
    }
  }

  /**
   * Ruft Entitäten aus Uwazi ab
   */
  async fetchEntities(params: FetchEntitiesParams = {}) {
    try {
      const response = await this.api.get('/api/entities', { params });
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen von Entitäten:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine neue Entität in Uwazi
   */
  async createEntity(entity: any) {
    try {
      const response = await this.api.post('/api/entities', entity);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen der Entität:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert eine bestehende Entität in Uwazi
   */
  async updateEntity(sharedId: string, entity: any) {
    try {
      // In Uwazi werden Entitäten über einen POST-Request aktualisiert
      const response = await this.api.post('/api/entities', {
        ...entity,
        sharedId,
      });
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Entität mit ID ${sharedId}:`, error);
      throw error;
    }
  }

  /**
   * Löscht eine Entität in Uwazi
   */
  async deleteEntity(sharedId: string) {
    try {
      const response = await this.api.delete('/api/entities', {
        params: { sharedId },
      });
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Löschen der Entität mit ID ${sharedId}:`, error);
      throw error;
    }
  }

  /**
   * Führt eine Suche in Uwazi durch
   */
  async search(query: string, filters: Record<string, any> = {}) {
    try {
      const response = await this.api.get('/api/search', {
        params: {
          searchTerm: query,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      throw error;
    }
  }

  /**
   * Lädt eine Datei zu einem Dokument hoch
   */
  async uploadFile(documentId: string, uri: string, fileType: string) {
    try {
      const fileName = uri.split('/').pop() || 'file';

      // Formular erstellen
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: fileType
      } as any);
      formData.append('documentId', documentId);

      const response = await this.api.post('/api/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Fehler beim Hochladen der Datei für Dokument ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Löscht lokale Daten und erzwingt eine vollständige Synchronisation
   */
  async resetAndSyncFull() {
    if (!this.db) return;

    try {
      // Lokale Datenbank leeren
      await this.db.execAsync('DELETE FROM documents');
      await this.db.execAsync('DELETE FROM entities');
      await this.db.execAsync('DELETE FROM sync_queue');

      // Synchronisationsstatus zurücksetzen
      this.syncStatus = {
        lastSync: null,
        inProgress: false,
        pendingChanges: 0,
        error: null
      };
      await this.localStorage.removeItem('uwazi_last_sync');

      // Vollständige Synchronisation starten
      await this.synchronize();

    } catch (error) {
      console.error('Fehler beim Zurücksetzen und vollständigen Synchronisieren:', error);
      throw error;
    }
  }

  /**
   * Bereinigt Ressourcen bei der Beendigung des Service
   */
  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}