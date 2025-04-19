import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';

/**
 * Konfiguration für den Uwazi-Service
 */
export interface UwaziConfig {
  apiUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  useAuth: boolean;
  cacheEnabled: boolean;
  cacheTTL: number; // in Sekunden
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
 * Uwazi-Service für die Integration mit Uwazi-Instanzen
 */
export class UwaziService {
  private api: AxiosInstance;
  private config: UwaziConfig;
  private redisClient: any;
  private authToken: string | null = null;
  private authTokenExpiration: number = 0;

  /**
   * Erstellt eine neue Uwazi-Service-Instanz
   */
  constructor(config: UwaziConfig) {
    this.config = {
      ...config,
      cacheTTL: config.cacheTTL || 3600, // Standard: 1 Stunde
    };

    this.api = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Redis-Client für Caching initialisieren, falls aktiviert
    if (this.config.cacheEnabled) {
      try {
        this.initializeRedisClient();
      } catch (error) {
        console.warn('Redis-Client konnte nicht initialisiert werden. Caching ist deaktiviert.', error);
        this.config.cacheEnabled = false;
      }
    }

    // Request-Interceptor für Authentifizierung
    this.api.interceptors.request.use(async (config) => {
      if (this.config.useAuth) {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    console.log(`UwaziService: Verbindung zu ${this.config.apiUrl} hergestellt.`);
  }

  /**
   * Initialisiert den Redis-Client für das Caching
   */
  private async initializeRedisClient() {
    try {
      this.redisClient = createClient();
      this.redisClient.on('error', (err: any) => {
        console.error('Redis-Client-Fehler:', err);
        this.config.cacheEnabled = false;
      });
      await this.redisClient.connect();
    } catch (error) {
      console.error('Fehler beim Initialisieren des Redis-Clients:', error);
      this.config.cacheEnabled = false;
    }
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
          return this.authToken;
        }
      }
      
      // Wenn API-Key angegeben wurde, diesen verwenden
      if (this.config.apiKey) {
        this.authToken = this.config.apiKey;
        this.authTokenExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 Tage
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
   * Hilfsmethode zum Cachen und Abrufen von Daten
   */
  private async withCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    if (!this.config.cacheEnabled || !this.redisClient) {
      return fetchFn();
    }

    try {
      const cachedData = await this.redisClient.get(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const data = await fetchFn();
      await this.redisClient.set(key, JSON.stringify(data), {
        EX: this.config.cacheTTL,
      });
      return data;
    } catch (error) {
      console.error('Cache-Fehler:', error);
      return fetchFn();
    }
  }

  /**
   * Ruft Dokumente aus Uwazi ab
   */
  async fetchDocuments(params: FetchDocumentsParams = {}) {
    const cacheKey = `documents:${JSON.stringify(params)}`;
    return this.withCache(cacheKey, async () => {
      try {
        const response = await this.api.get('/api/documents', { params });
        return response.data;
      } catch (error) {
        console.error('Fehler beim Abrufen von Dokumenten:', error);
        throw error;
      }
    });
  }

  /**
   * Ruft ein einzelnes Dokument anhand seiner ID ab
   */
  async fetchDocumentById(sharedId: string) {
    const cacheKey = `document:${sharedId}`;
    return this.withCache(cacheKey, async () => {
      try {
        const response = await this.api.get(`/api/documents`, {
          params: { sharedId }
        });
        return response.data.rows[0] || null;
      } catch (error) {
        console.error(`Fehler beim Abrufen des Dokuments mit ID ${sharedId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Ruft Entitäten aus Uwazi ab
   */
  async fetchEntities(params: FetchEntitiesParams = {}) {
    const cacheKey = `entities:${JSON.stringify(params)}`;
    return this.withCache(cacheKey, async () => {
      try {
        const response = await this.api.get('/api/entities', { params });
        return response.data;
      } catch (error) {
        console.error('Fehler beim Abrufen von Entitäten:', error);
        throw error;
      }
    });
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
   * Ruft Thesauri (kontrollierte Vokabulare) aus Uwazi ab
   */
  async fetchThesauri() {
    const cacheKey = 'thesauri';
    return this.withCache(cacheKey, async () => {
      try {
        const response = await this.api.get('/api/thesauris');
        return response.data;
      } catch (error) {
        console.error('Fehler beim Abrufen der Thesauri:', error);
        throw error;
      }
    });
  }

  /**
   * Ruft Templates aus Uwazi ab
   */
  async fetchTemplates() {
    const cacheKey = 'templates';
    return this.withCache(cacheKey, async () => {
      try {
        const response = await this.api.get('/api/templates');
        return response.data;
      } catch (error) {
        console.error('Fehler beim Abrufen der Templates:', error);
        throw error;
      }
    });
  }

  /**
   * Führt eine Suche in Uwazi durch
   */
  async search(query: string, filters: Record<string, any> = {}) {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
    return this.withCache(cacheKey, async () => {
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
    });
  }

  /**
   * Lädt eine Datei zu einem Dokument hoch
   */
  async uploadFile(documentId: string, filePath: string, fileType: string) {
    try {
      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath);
      
      const formData = new FormData();
      const blob = new Blob([fileContent], { type: fileType });
      formData.append('file', blob, fileName);
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
}

// In-Memory-Fallback für Umgebungen ohne MongoDB-Verbindung
export class UwaziInMemoryService {
  private documents: any[] = [];
  private entities: any[] = [];
  private counter = 1;

  constructor() {
    console.log('UwaziService: Keine MongoDB URI gefunden, verwende In-Memory-Modus');
  }

  async fetchDocuments(params: FetchDocumentsParams = {}) {
    let results = [...this.documents];
    
    if (params.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      results = results.filter(doc => 
        doc.title?.toLowerCase().includes(term) || 
        doc.content?.toLowerCase().includes(term)
      );
    }
    
    const limit = params.limit || 10;
    const page = params.page || 1;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      rows: results.slice(start, end),
      totalRows: results.length,
      totalPages: Math.ceil(results.length / limit)
    };
  }
  
  async fetchDocumentById(sharedId: string) {
    return this.documents.find(doc => doc.sharedId === sharedId) || null;
  }
  
  async fetchEntities(params: FetchEntitiesParams = {}) {
    let results = [...this.entities];
    
    if (params.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      results = results.filter(entity => 
        entity.title?.toLowerCase().includes(term)
      );
    }
    
    if (params.templates && params.templates.length > 0) {
      results = results.filter(entity => 
        params.templates?.includes(entity.template)
      );
    }
    
    if (params.sharedId) {
      results = results.filter(entity => entity.sharedId === params.sharedId);
    }
    
    const limit = params.limit || 10;
    const page = params.page || 1;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      rows: results.slice(start, end),
      totalRows: results.length,
      totalPages: Math.ceil(results.length / limit)
    };
  }
  
  async createEntity(entity: any) {
    const newEntity = {
      ...entity,
      _id: String(this.counter++),
      sharedId: String(Date.now()),
      creationDate: new Date().toISOString()
    };
    
    this.entities.push(newEntity);
    return newEntity;
  }
  
  async updateEntity(sharedId: string, entity: any) {
    const index = this.entities.findIndex(e => e.sharedId === sharedId);
    if (index === -1) {
      throw new Error(`Entität mit ID ${sharedId} nicht gefunden`);
    }
    
    this.entities[index] = {
      ...this.entities[index],
      ...entity,
      sharedId
    };
    
    return this.entities[index];
  }
  
  async deleteEntity(sharedId: string) {
    const initialLength = this.entities.length;
    this.entities = this.entities.filter(e => e.sharedId !== sharedId);
    
    return {
      success: initialLength > this.entities.length
    };
  }
  
  async fetchThesauri() {
    return { rows: [] };
  }
  
  async fetchTemplates() {
    return { rows: [] };
  }
  
  async search(query: string, filters: Record<string, any> = {}) {
    // Kombinierte Suche in Dokumenten und Entitäten
    const term = query.toLowerCase();
    
    const matchingDocuments = this.documents.filter(doc => 
      doc.title?.toLowerCase().includes(term) || 
      doc.content?.toLowerCase().includes(term)
    );
    
    const matchingEntities = this.entities.filter(entity => 
      entity.title?.toLowerCase().includes(term)
    );
    
    return {
      documents: {
        rows: matchingDocuments,
        totalRows: matchingDocuments.length
      },
      entities: {
        rows: matchingEntities,
        totalRows: matchingEntities.length
      }
    };
  }
}

// Factory-Methode für die Erstellung des richtigen Services
export function createUwaziService() {
  // Prüfen, ob MongoDB-Verbindung existiert
  const mongoUri = process.env.MONGODB_URI;
  
  if (mongoUri) {
    // Echter Service mit MongoDB-Verbindung
    return new UwaziService({
      apiUrl: process.env.UWAZI_API_URL || 'http://localhost:3000',
      username: process.env.UWAZI_USERNAME,
      password: process.env.UWAZI_PASSWORD,
      apiKey: process.env.UWAZI_API_KEY,
      useAuth: Boolean(process.env.UWAZI_USE_AUTH || false),
      cacheEnabled: Boolean(process.env.UWAZI_CACHE_ENABLED || false),
      cacheTTL: Number(process.env.UWAZI_CACHE_TTL || 3600)
    });
  } else {
    // In-Memory-Fallback
    return new UwaziInMemoryService();
  }
}