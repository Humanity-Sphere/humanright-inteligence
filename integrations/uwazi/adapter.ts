/**
 * Uwazi Integration Adapter
 * 
 * Dieser Adapter ermöglicht die Integration zwischen unserer Anwendung und der Uwazi-Plattform,
 * die ein MongoDB-Schema verwendet. Der Adapter ist für die Konvertierung und Synchronisierung
 * von Daten zwischen den beiden Systemen verantwortlich.
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { db } from '../../db';
import { documents, patterns, knowledgeContexts, evidence, legalCases } from '../../../shared/schema';
import { and, eq } from 'drizzle-orm';

// Typen für Uwazi-Entitäten
export interface UwaziEntity {
  _id: ObjectId;
  title: string;
  template: string;
  metadata: Record<string, any>;
  sharedId?: string;
  language?: string;
  creationDate: Date;
  published?: boolean;
  user?: ObjectId;
}

export interface UwaziTemplate {
  _id: ObjectId;
  name: string;
  properties: Array<{
    name: string;
    label: string;
    type: string;
    content?: string;
    required?: boolean;
  }>;
}

export interface UwaziFile {
  _id: ObjectId;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  entity: string; // sharedId of the entity
  type: string;
  creationDate: Date;
}

// Konfiguration für die Uwazi-Verbindung
interface UwaziConfig {
  url: string;
  dbName: string;
  username?: string;
  password?: string;
}

export class UwaziAdapter {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: UwaziConfig;

  constructor(config: UwaziConfig) {
    this.config = config;
  }

  /**
   * Verbindung zur Uwazi MongoDB-Instanz herstellen
   */
  async connect(): Promise<boolean> {
    try {
      const authPart = this.config.username && this.config.password
        ? `${encodeURIComponent(this.config.username)}:${encodeURIComponent(this.config.password)}@`
        : '';
      const uri = `mongodb://${authPart}${this.config.url}/${this.config.dbName}`;
      
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(this.config.dbName);
      
      console.log('Erfolgreich mit Uwazi MongoDB verbunden');
      return true;
    } catch (error) {
      console.error('Fehler beim Verbinden mit Uwazi MongoDB:', error);
      return false;
    }
  }

  /**
   * Verbindung zur Uwazi MongoDB-Instanz trennen
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Verbindung zu Uwazi MongoDB getrennt');
    }
  }

  /**
   * Prüft, ob eine Verbindung zur Uwazi-Datenbank besteht
   */
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }

  /**
   * Abrufen aller Entitäten eines bestimmten Templates aus Uwazi
   */
  async getEntitiesByTemplate(templateName: string): Promise<UwaziEntity[]> {
    if (!this.isConnected()) {
      throw new Error('Keine Verbindung zur Uwazi-Datenbank');
    }

    try {
      const collection = this.db!.collection<UwaziEntity>('entities');
      const entities = await collection.find({ template: templateName }).toArray();
      return entities;
    } catch (error) {
      console.error(`Fehler beim Abrufen von Entitäten für Template ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Abrufen der verfügbaren Templates aus Uwazi
   */
  async getTemplates(): Promise<UwaziTemplate[]> {
    if (!this.isConnected()) {
      throw new Error('Keine Verbindung zur Uwazi-Datenbank');
    }

    try {
      const collection = this.db!.collection<UwaziTemplate>('templates');
      const templates = await collection.find().toArray();
      return templates;
    } catch (error) {
      console.error('Fehler beim Abrufen der Templates:', error);
      throw error;
    }
  }

  /**
   * Abrufen der mit einer Entität verknüpften Dateien
   */
  async getFilesForEntity(entitySharedId: string): Promise<UwaziFile[]> {
    if (!this.isConnected()) {
      throw new Error('Keine Verbindung zur Uwazi-Datenbank');
    }

    try {
      const collection = this.db!.collection<UwaziFile>('files');
      const files = await collection.find({ entity: entitySharedId }).toArray();
      return files;
    } catch (error) {
      console.error(`Fehler beim Abrufen von Dateien für Entität ${entitySharedId}:`, error);
      throw error;
    }
  }

  /**
   * Konvertieren einer Uwazi-Entität in ein Dokument für unsere Anwendung
   */
  async convertEntityToDocument(entity: UwaziEntity): Promise<typeof documents.$inferInsert> {
    const files = entity.sharedId 
      ? await this.getFilesForEntity(entity.sharedId)
      : [];
    
    const mainFile = files.find(file => file.type === 'document');
    
    return {
      userId: 1, // Default-Benutzer, sollte angepasst werden
      title: entity.title,
      content: '', // Inhalte müssen separat extrahiert werden
      contentType: 'text',
      sourceUrl: mainFile ? `/api/uwazi/files/${mainFile._id.toString()}` : null,
      sourceType: 'uwazi',
      sourceId: entity._id.toString(),
      metadata: {
        uwaziMetadata: entity.metadata,
        uwaziTemplate: entity.template,
        uwaziLanguage: entity.language,
        uwaziSharedId: entity.sharedId,
      },
      createdAt: entity.creationDate,
      updatedAt: new Date(),
      status: entity.published ? 'published' : 'draft',
      tags: this.extractTagsFromEntity(entity),
      confidentiality: 'public',
    };
  }

  /**
   * Extrahiert Tags aus einer Uwazi-Entität
   */
  private extractTagsFromEntity(entity: UwaziEntity): string[] {
    const tags: string[] = [];
    
    // Extrahiere Tags aus den Metadaten
    if (entity.metadata) {
      // Suche nach Metadaten-Feldern, die als Tags verwendet werden können
      for (const [key, value] of Object.entries(entity.metadata)) {
        if (Array.isArray(value) && value.length > 0 && value[0].label) {
          // Typische Struktur für Thesaurus-basierte Felder in Uwazi
          tags.push(...value.map((item: any) => item.label));
        }
      }
    }
    
    // Template-Name als Tag hinzufügen
    if (entity.template) {
      tags.push(entity.template);
    }
    
    return tags;
  }

  /**
   * Synchronisiert Uwazi-Entitäten mit unserer Dokumenten-Tabelle
   */
  async syncEntitiesToDocuments(templateName: string): Promise<number> {
    try {
      // Uwazi-Entitäten abrufen
      const entities = await this.getEntitiesByTemplate(templateName);
      let importedCount = 0;
      
      // Jede Entität in unsere Datenbank importieren
      for (const entity of entities) {
        // Prüfen, ob das Dokument bereits existiert
        const existingDocs = await db.select()
          .from(documents)
          .where(
            and(
              eq(documents.sourceType, 'uwazi'),
              eq(documents.sourceId, entity._id.toString())
            )
          );
        
        if (existingDocs.length === 0) {
          // Dokument existiert noch nicht, also erstellen
          const documentData = await this.convertEntityToDocument(entity);
          await db.insert(documents).values(documentData);
          importedCount++;
        } else {
          // Dokument existiert bereits, hier könnte ein Update erfolgen
          // TODO: Update-Logik implementieren
        }
      }
      
      return importedCount;
    } catch (error) {
      console.error(`Fehler bei der Synchronisierung von Template ${templateName}:`, error);
      throw error;
    }
  }
  
  /**
   * Extrahiert Wissen aus Uwazi-Entitäten und erstellt Knowledge Contexts
   */
  async extractKnowledgeFromEntities(templateName: string): Promise<number> {
    try {
      const entities = await this.getEntitiesByTemplate(templateName);
      let createdCount = 0;
      
      for (const entity of entities) {
        // Prüfen, ob bereits ein Knowledge Context existiert
        const existingContexts = await db.select()
          .from(knowledgeContexts)
          .where(
            and(
              eq(knowledgeContexts.sourceType, 'uwazi'),
              eq(knowledgeContexts.sourceId, entity._id.toString())
            )
          );
        
        if (existingContexts.length === 0) {
          // Knowledge Context erstellen
          const contextData = {
            userId: 1, // Default-Benutzer
            title: entity.title,
            content: JSON.stringify(entity.metadata, null, 2),
            contextType: 'reference',
            source: 'uwazi',
            sourceId: entity._id.toString(),
            sourceType: 'uwazi',
            createdAt: new Date(),
            updatedAt: new Date(),
            relevanceScore: 0.8, // Standard-Relevanzbewertung
            tags: this.extractTagsFromEntity(entity),
            metadata: {
              uwaziTemplate: entity.template,
              uwaziLanguage: entity.language,
              uwaziSharedId: entity.sharedId,
            },
          };
          
          await db.insert(knowledgeContexts).values(contextData);
          createdCount++;
        }
      }
      
      return createdCount;
    } catch (error) {
      console.error(`Fehler beim Extrahieren von Wissen aus Template ${templateName}:`, error);
      throw error;
    }
  }
}

// Singleton-Instanz für den Adapter
let uwaziAdapter: UwaziAdapter | null = null;

/**
 * Initialisiert den Uwazi-Adapter mit der angegebenen Konfiguration
 */
export const initUwaziAdapter = async (config: UwaziConfig): Promise<UwaziAdapter> => {
  if (!uwaziAdapter) {
    uwaziAdapter = new UwaziAdapter(config);
  }
  
  // Verbindung herstellen, falls noch nicht geschehen
  if (!uwaziAdapter.isConnected()) {
    await uwaziAdapter.connect();
  }
  
  return uwaziAdapter;
};

/**
 * Gibt den initialisierten Uwazi-Adapter zurück
 */
export const getUwaziAdapter = (): UwaziAdapter => {
  if (!uwaziAdapter) {
    throw new Error('Uwazi-Adapter wurde nicht initialisiert. Bitte initUwaziAdapter() aufrufen.');
  }
  return uwaziAdapter;
};