/**
 * Uwazi Integration Service
 * 
 * Dieser Service bietet eine Integration mit der Uwazi-Plattform, 
 * einer spezialisierten Open-Source-Dokumentenmanagementplattform für Menschenrechtsorganisationen.
 * 
 * Die Integration ermöglicht:
 * - Authentifizierung mit Uwazi
 * - Suche und Abruf von Dokumenten
 * - Hochladen neuer Dokumente
 * - Abfrage von Entitäten und Beziehungen
 * - Synchronisation von Metadaten
 */

import axios, { AxiosInstance } from 'axios';
import { Document } from '@shared/schema';

interface UwaziConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
}

interface UwaziSearchFilters {
  types?: string[];
  order?: string;
  sort?: string;
  fields?: string[];
  from?: Date;
  to?: Date;
  [key: string]: any;
}

interface UwaziPagination {
  limit: number;
  page: number;
}

interface UwaziDocument {
  _id: string;
  title: string;
  file?: {
    filename: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
  sharedId?: string;
  language?: string;
  metadata?: Record<string, any>;
  creationDate?: Date;
  template?: string;
  [key: string]: any;
}

interface UwaziEntity {
  _id: string;
  sharedId: string;
  type: string;
  title: string;
  template: string;
  language: string;
  metadata: Record<string, any>;
  [key: string]: any;
}

interface UwaziTemplate {
  _id: string;
  name: string;
  properties: Array<{
    name: string;
    label: string;
    type: string;
    content?: string;
    relationType?: string;
    required?: boolean;
    filter?: boolean;
    [key: string]: any;
  }>;
  [key: string]: any;
}

interface UwaziRelationship {
  _id: string;
  entity: string;
  hub: string;
  template: string | null;
  metadata: Record<string, any>;
  language: string;
  relationtype: string;
  range: {
    start: number;
    end: number;
    text: string;
  };
  [key: string]: any;
}

/**
 * Hauptklasse für die Integration mit der Uwazi-API
 */
export class UwaziConnector {
  private baseUrl: string;
  private apiKey?: string;
  private authToken?: string;
  private authenticatedUser: any = null;
  private username?: string;
  private password?: string;
  private client: AxiosInstance;

  /**
   * Erstellt eine neue Instanz des Uwazi-Connectors
   * 
   * @param config Die Konfiguration für die Verbindung zu Uwazi
   */
  constructor(config: UwaziConfig) {
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
    this.apiKey = config.apiKey;
    this.username = config.username;
    this.password = config.password;

    // Konfiguriere Axios-Client
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Füge Interceptors für Fehlerbehandlung hinzu
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('Uwazi API Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authentifiziert mit der Uwazi-Instanz
   * 
   * @returns true wenn die Authentifizierung erfolgreich war, sonst false
   */
  async authenticate(): Promise<boolean> {
    try {
      // Wenn API-Schlüssel vorhanden ist, verwende diesen
      if (this.apiKey) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.apiKey}`;
        
        // Teste die Verbindung mit einem einfachen API-Aufruf
        const response = await this.client.get('api/templates');
        return response.status === 200;
      } 
      // Ansonsten verwende Benutzername und Passwort
      else if (this.username && this.password) {
        const response = await this.client.post('api/login', {
          username: this.username,
          password: this.password
        });

        if (response.status === 200 && response.data) {
          this.authenticatedUser = response.data.user;
          this.authToken = response.data.token;
          this.client.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Authentifizierungsfehler:', error);
      return false;
    }
  }

  /**
   * Prüft, ob der Client authentifiziert ist und versucht, sich bei Bedarf zu authentifizieren
   * 
   * @returns true, wenn der Client authentifiziert ist
   */
  private async ensureAuthenticated(): Promise<boolean> {
    // Wenn bereits authentifiziert, true zurückgeben
    if (this.authToken || this.apiKey) {
      return true;
    }

    // Versuche, sich zu authentifizieren
    return await this.authenticate();
  }

  /**
   * Sucht nach Dokumenten in der Uwazi-Instanz
   * 
   * @param query Der Suchbegriff
   * @param filters Optionale Filter für die Suche
   * @param pagination Optionale Paginierung
   * @returns Die gefundenen Dokumente
   */
  async searchDocuments(
    query: string, 
    filters: UwaziSearchFilters = {}, 
    pagination: UwaziPagination = { limit: 30, page: 1 }
  ): Promise<{ documents: UwaziDocument[]; totalPages: number; totalCount: number }> {
    await this.ensureAuthenticated();

    try {
      // Bereite Suchparameter vor
      const searchParams = new URLSearchParams({
        searchTerm: query,
        limit: pagination.limit.toString(),
        page: pagination.page.toString(),
        ...this.formatFilters(filters)
      });

      // Führe die Suche aus
      const response = await this.client.get(`api/search?${searchParams}`);

      // Formatiere die Antwort
      return {
        documents: response.data.rows || [],
        totalPages: Math.ceil(response.data.totalRows / pagination.limit),
        totalCount: response.data.totalRows
      };
    } catch (error) {
      console.error('Fehler bei der Dokumentensuche:', error);
      throw error;
    }
  }

  /**
   * Lädt ein Dokument aus der Uwazi-Instanz
   * 
   * @param documentId Die ID des Dokuments
   * @returns Das Dokument
   */
  async getDocument(documentId: string): Promise<UwaziDocument> {
    await this.ensureAuthenticated();

    try {
      const response = await this.client.get(`api/entities?_id=${documentId}`);
      
      if (response.data && response.data.rows && response.data.rows.length > 0) {
        return response.data.rows[0];
      }
      
      throw new Error(`Dokument mit ID ${documentId} nicht gefunden`);
    } catch (error) {
      console.error(`Fehler beim Abrufen des Dokuments ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Lädt ein Dokument hoch in die Uwazi-Instanz
   * 
   * @param file Die Datei, die hochgeladen werden soll
   * @param metadata Die Metadaten des Dokuments
   * @param template Die Vorlage, die für das Dokument verwendet werden soll
   * @returns Das hochgeladene Dokument
   */
  async uploadDocument(
    file: Buffer,
    metadata: Record<string, any>,
    template: string
  ): Promise<UwaziDocument> {
    await this.ensureAuthenticated();

    try {
      // Erstelle FormData
      const formData = new FormData();
      const blob = new Blob([file]);
      formData.append('file', blob);
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('template', template);

      // Sende Datei
      const response = await this.client.post('api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data._id) {
        return response.data;
      }

      throw new Error('Fehler beim Hochladen des Dokuments');
    } catch (error) {
      console.error('Fehler beim Hochladen des Dokuments:', error);
      throw error;
    }
  }

  /**
   * Ruft eine Entität aus der Uwazi-Instanz ab
   * 
   * @param entityId Die ID der Entität
   * @returns Die Entität
   */
  async getEntity(entityId: string): Promise<UwaziEntity> {
    await this.ensureAuthenticated();

    try {
      const response = await this.client.get(`api/entities?_id=${entityId}`);
      
      if (response.data && response.data.rows && response.data.rows.length > 0) {
        return response.data.rows[0];
      }
      
      throw new Error(`Entität mit ID ${entityId} nicht gefunden`);
    } catch (error) {
      console.error(`Fehler beim Abrufen der Entität ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Ruft Beziehungen ab, die mit einer Entität verknüpft sind
   * 
   * @param entityId Die ID der Entität
   * @returns Die Beziehungen
   */
  async getEntityRelationships(entityId: string): Promise<UwaziRelationship[]> {
    await this.ensureAuthenticated();

    try {
      const response = await this.client.get(`api/references?entity=${entityId}`);
      return response.data || [];
    } catch (error) {
      console.error(`Fehler beim Abrufen der Beziehungen für Entität ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Ruft alle Vorlagen aus der Uwazi-Instanz ab
   * 
   * @returns Die Vorlagen
   */
  async getTemplates(): Promise<UwaziTemplate[]> {
    await this.ensureAuthenticated();

    try {
      const response = await this.client.get('api/templates');
      return response.data || [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Vorlagen:', error);
      throw error;
    }
  }

  /**
   * Konvertiert einen Uwazi-Dokumentendatensatz in das interne Dokumentformat der App
   * 
   * @param uwaziDoc Das Uwazi-Dokument
   * @returns Das interne Dokument
   */
  convertToAppDocument(uwaziDoc: UwaziDocument): Partial<Document> {
    // Behandle den Fall, dass uwaziDoc nicht definiert ist
    if (!uwaziDoc) {
      throw new Error('Uwazi-Dokument ist nicht definiert');
    }

    // Extrahiere Informationen aus dem Uwazi-Dokument
    const {
      title,
      file,
      metadata,
      creationDate,
      template,
      _id
    } = uwaziDoc;

    // Erstelle ein internes Dokument
    const appDocument: Partial<Document> = {
      title: title,
      description: metadata?.description || null,
      fileType: file?.mimetype?.split('/')?.[1] || 'unknown',
      fileSize: file?.size || 0,
      filePath: file?.filename || '',
      source: 'uwazi',
      uploadedAt: creationDate ? new Date(creationDate) : new Date(),
      tags: []
    };

    // Füge Tags hinzu, wenn vorhanden
    if (metadata?.keywords && Array.isArray(metadata.keywords)) {
      appDocument.tags = metadata.keywords
        .map((k: any) => typeof k === 'string' ? k : (k.label || k.value || ''))
        .filter(Boolean);
    }

    // Füge zusätzliche Metadaten hinzu, wenn sie im Schema vorhanden sind
    return appDocument;
  }

  /**
   * Hilfsmethode zum Formatieren von Filtern für API-Anfragen
   * 
   * @param filters Die zu formatierenden Filter
   * @returns Die formatierten Filter
   */
  private formatFilters(filters: UwaziSearchFilters): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Konvertiere jeden Filter in einen String
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      
      if (Array.isArray(value)) {
        result[key] = JSON.stringify(value);
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (typeof value === 'object') {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = String(value);
      }
    }
    
    return result;
  }
}

/**
 * MetadataMapper zur Konvertierung zwischen Uwazi- und App-Metadaten
 */
export class UwaziMetadataMapper {
  private appSchemas: any;
  private uwaziTemplates: UwaziTemplate[];
  private mappingRules: Record<string, any>;

  /**
   * Erstellt eine neue Instanz des MetadataMappers
   * 
   * @param appSchemas Die Schemas der App
   * @param uwaziTemplates Die Vorlagen aus Uwazi
   */
  constructor(appSchemas: any, uwaziTemplates: UwaziTemplate[]) {
    this.appSchemas = appSchemas;
    this.uwaziTemplates = uwaziTemplates;
    this.mappingRules = this.initializeMappingRules();
  }

  /**
   * Initialisiert die Mapping-Regeln zwischen App-Schemas und Uwazi-Vorlagen
   * 
   * @returns Die Mapping-Regeln
   */
  private initializeMappingRules(): Record<string, any> {
    // In einer realen Implementierung würde dies automatisch basierend auf Schema-Analyse erfolgen
    // Hier stellen wir nur ein einfaches Mapping als Beispiel bereit
    return {
      documents: {
        title: 'title',
        description: 'metadata.description',
        uploadedAt: 'creationDate',
        tags: 'metadata.keywords',
        source: 'source'
      },
      knowledgeContexts: {
        name: 'title',
        context: 'metadata.context',
        source: 'metadata.source'
      }
    };
  }

  /**
   * Konvertiert App-Entitätsdaten in das Uwazi-Format
   * 
   * @param appEntity Die App-Entität
   * @param entityType Der Typ der Entität
   * @returns Die Uwazi-Entität
   */
  appToUwazi(appEntity: any, entityType: string): any {
    const mapping = this.mappingRules[entityType] || {};
    const result: Record<string, any> = { metadata: {} };

    for (const [appField, uwaziField] of Object.entries(mapping)) {
      const value = appEntity[appField];
      if (value === undefined) continue;

      if (typeof uwaziField === 'string') {
        if (uwaziField.startsWith('metadata.')) {
          const metadataField = uwaziField.substring(9);
          result.metadata[metadataField] = value;
        } else {
          result[uwaziField] = value;
        }
      }
    }

    return result;
  }

  /**
   * Konvertiert Uwazi-Entitätsdaten in das App-Format
   * 
   * @param uwaziEntity Die Uwazi-Entität
   * @param entityType Der Typ der Entität
   * @returns Die App-Entität
   */
  uwaziToApp(uwaziEntity: any, entityType: string): any {
    const mapping = this.mappingRules[entityType] || {};
    const result: Record<string, any> = {};

    for (const [appField, uwaziField] of Object.entries(mapping)) {
      if (typeof uwaziField === 'string') {
        if (uwaziField.startsWith('metadata.')) {
          const metadataField = uwaziField.substring(9);
          result[appField] = uwaziEntity.metadata?.[metadataField];
        } else {
          result[appField] = uwaziEntity[uwaziField];
        }
      }
    }

    return result;
  }
}

/**
 * KI-gestützte Uwazi-Dokumentenanalyse
 */
export class UwaziKIAnalyzer {
  private uwazi: UwaziConnector;
  private geminiService: any;

  /**
   * Erstellt eine neue Instanz des UwaziKIAnalyzers
   * 
   * @param uwaziConnector Der Uwazi-Connector
   * @param geminiService Der Gemini-KI-Service
   */
  constructor(uwaziConnector: UwaziConnector, geminiService: any) {
    this.uwazi = uwaziConnector;
    this.geminiService = geminiService;
  }

  /**
   * Analysiert ein Dokument mit KI
   * 
   * @param documentId Die ID des Dokuments
   * @returns Die Analyseergebnisse
   */
  async analyzeDocument(documentId: string): Promise<any> {
    try {
      // Dokument abrufen
      const document = await this.uwazi.getDocument(documentId);
      
      // In einer realen Implementierung würden wir hier den Textinhalt des Dokuments extrahieren
      // Für dieses Beispiel verwenden wir die Metadaten und Titel
      const textContent = `Titel: ${document.title}\n`;
      
      // Analysiere Dokument mit KI
      const prompt = this.createDocumentAnalysisPrompt(textContent, document.metadata || {});
      
      // In einer realen Implementierung würden wir hier den KI-Service aufrufen
      // Hier geben wir nur ein Beispielergebnis zurück
      return {
        documentId,
        title: document.title,
        entities: ["Beispielentität 1", "Beispielentität 2"],
        legalReferences: ["Art. 1 EMRK", "Art. 2 ICCPR"],
        contradictions: [],
        summary: "Dies ist eine Beispielzusammenfassung des analysierten Dokuments."
      };
    } catch (error) {
      console.error(`Fehler bei der Analyse des Dokuments ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Erstellt einen Prompt für die Dokumentenanalyse
   * 
   * @param textContent Der Textinhalt des Dokuments
   * @param metadata Die Metadaten des Dokuments
   * @returns Der Prompt für die KI
   */
  private createDocumentAnalysisPrompt(textContent: string, metadata: Record<string, any>): string {
    return `
Analysiere das folgende Dokument:

${textContent}

Metadaten:
${JSON.stringify(metadata, null, 2)}

Bitte identifiziere:
1. Wichtige Entitäten (Personen, Organisationen, Orte)
2. Rechtliche Verweise und Zitate
3. Widersprüche oder Unstimmigkeiten
4. Eine kurze Zusammenfassung
`;
  }

  /**
   * Erkennt Muster in mehreren Uwazi-Dokumenten
   * 
   * @param documentIds Die IDs der zu analysierenden Dokumente
   * @returns Die erkannten Muster
   */
  async detectPatterns(documentIds: string[]): Promise<any> {
    try {
      // Dokumente abrufen
      const documents = await Promise.all(
        documentIds.map(id => this.uwazi.getDocument(id))
      );
      
      // In einer realen Implementierung würden wir hier die KI zur Musteranalyse verwenden
      // Hier geben wir nur ein Beispielergebnis zurück
      return {
        patternName: "Beispielmuster",
        description: "Dies ist eine Beschreibung des erkannten Musters.",
        documentIds,
        geographicScope: { region: "Beispielregion", countries: ["Land A", "Land B"] },
        temporalTrends: { period: "2020-2023", frequency: "steigend" },
        relatedLaws: ["Gesetz X", "Konvention Y"],
        recommendedActions: "Empfohlene Maßnahmen basierend auf dem erkannten Muster."
      };
    } catch (error) {
      console.error(`Fehler bei der Mustererkennung für Dokumente ${documentIds}:`, error);
      throw error;
    }
  }
}
