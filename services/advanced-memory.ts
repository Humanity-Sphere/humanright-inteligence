/**
 * Erweitertes Gedächtnissystem für KI-Agenten
 * Bietet kurz- und langfristige Speicherung und Abruf von Informationen
 */

import fs from 'fs';
import path from 'path';
import { createId } from '@paralleldrive/cuid2';
import logger from '../utils/logger';
import db from '../utils/db';

// Typen für Gedächtnisoperationen
export enum MemoryType {
  SHORT_TERM = 'short_term', // Kürzer, Konversationskontext (TTL: 24 Stunden)
  LONG_TERM = 'long_term',   // Länger, wichtigere Informationen (TTL: 30 Tage)
  PERMANENT = 'permanent'    // Dauerhafte Informationen (keine TTL)
}

export interface Memory {
  id: string;
  userId: string;
  agentId: string;
  type: MemoryType;
  content: string;
  metadata: {
    importance: number;      // 1-10, höhere Werte bedeuten wichtigere Erinnerungen
    context?: string;        // Kontext, in dem die Erinnerung erstellt wurde
    relatedMemories?: string[]; // IDs verwandter Erinnerungen
    source?: string;         // Quelle der Information (Benutzer, System, etc.)
    tags?: string[];         // Tags für bessere Suche
  };
  createdAt: Date;
  expiresAt?: Date;         // Ablaufzeit für nicht permanente Erinnerungen
}

export interface MemoryQuery {
  userId: string;
  agentId?: string;
  type?: MemoryType;
  query?: string;           // Für semantische Ähnlichkeitssuche
  tags?: string[];          // Für Tag-basierte Filterung
  minImportance?: number;   // Filter nach Wichtigkeit
  limit?: number;           // Maximale Anzahl zurückzugebender Erinnerungen
}

export class AdvancedMemory {
  private static instance: AdvancedMemory;
  private memoryDir: string;
  private useFileSystem: boolean;

  private constructor() {
    this.memoryDir = path.join(process.cwd(), 'local-data', 'memory');
    this.useFileSystem = process.env.USE_MEMORY_FILES === 'true';
    
    // Stelle sicher, dass das Verzeichnis existiert, wenn Dateisystem verwendet wird
    if (this.useFileSystem) {
      this.ensureMemoryDirectory();
    }
    
    // Starte den Erinnerungs-Ablauf-Prozess
    this.scheduleExpirationCheck();
  }

  public static getInstance(): AdvancedMemory {
    if (!AdvancedMemory.instance) {
      AdvancedMemory.instance = new AdvancedMemory();
    }
    return AdvancedMemory.instance;
  }

  private ensureMemoryDirectory(): void {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
      logger.info(`Speicherverzeichnis erstellt: ${this.memoryDir}`);
    }
  }

  /**
   * Plant regelmäßige Überprüfungen abgelaufener Erinnerungen
   */
  private scheduleExpirationCheck(): void {
    // Überprüfe alle 6 Stunden auf abgelaufene Erinnerungen
    setInterval(() => {
      this.cleanupExpiredMemories()
        .catch(err => logger.error('Fehler beim Bereinigen abgelaufener Erinnerungen', err));
    }, 6 * 60 * 60 * 1000);
    
    logger.info('Regelmäßige Speicherbereinigung geplant');
  }

  /**
   * Entfernt abgelaufene Erinnerungen
   */
  private async cleanupExpiredMemories(): Promise<void> {
    logger.info('Starte Bereinigung abgelaufener Erinnerungen');
    const now = new Date();
    
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      try {
        const files = fs.readdirSync(this.memoryDir);
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const filePath = path.join(this.memoryDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Memory;
          
          if (data.expiresAt && new Date(data.expiresAt) <= now) {
            fs.unlinkSync(filePath);
            logger.debug(`Abgelaufene Erinnerung gelöscht: ${data.id}`);
          }
        }
      } catch (error) {
        logger.error('Fehler beim Bereinigen dateisystembasierter Erinnerungen', error);
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        const deleteQuery = `
          DELETE FROM agent_memories
          WHERE expires_at IS NOT NULL AND expires_at <= $1
        `;
        
        const result = await db.query(deleteQuery, [now.toISOString()]);
        logger.info(`${result.rowCount} abgelaufene Erinnerungen gelöscht`);
      } catch (error) {
        logger.error('Fehler beim Bereinigen datenbankbasierter Erinnerungen', error);
      }
    }
  }

  /**
   * Erstellt eine neue Erinnerung
   */
  public async createMemory(
    userId: string,
    agentId: string,
    content: string,
    type: MemoryType = MemoryType.SHORT_TERM,
    metadata: Partial<Memory['metadata']> = {}
  ): Promise<Memory> {
    const id = createId();
    const now = new Date();
    
    // Bestimme die Ablaufzeit basierend auf dem Typ
    let expiresAt: Date | undefined;
    
    if (type === MemoryType.SHORT_TERM) {
      // 24 Stunden TTL
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (type === MemoryType.LONG_TERM) {
      // 30 Tage TTL
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    // Stelle sicher, dass Metadaten definiert sind
    const fullMetadata: Memory['metadata'] = {
      importance: metadata.importance || 5,
      context: metadata.context,
      relatedMemories: metadata.relatedMemories || [],
      source: metadata.source || 'system',
      tags: metadata.tags || []
    };
    
    const memory: Memory = {
      id,
      userId,
      agentId,
      type,
      content,
      metadata: fullMetadata,
      createdAt: now,
      expiresAt
    };
    
    if (this.useFileSystem) {
      // Speichere im Dateisystem
      await this.saveMemoryToFile(memory);
    } else {
      // Speichere in der Datenbank
      await this.saveMemoryToDatabase(memory);
    }
    
    logger.debug(`Neue Erinnerung erstellt: ${id} (Typ: ${type})`);
    return memory;
  }

  /**
   * Speichert eine Erinnerung in einer Datei
   */
  private async saveMemoryToFile(memory: Memory): Promise<void> {
    const filePath = path.join(this.memoryDir, `${memory.id}.json`);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, JSON.stringify(memory, null, 2), 'utf8', (err) => {
        if (err) {
          logger.error(`Fehler beim Speichern der Erinnerung ${memory.id}`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Speichert eine Erinnerung in der Datenbank
   */
  private async saveMemoryToDatabase(memory: Memory): Promise<void> {
    const query = `
      INSERT INTO agent_memories (
        id, user_id, agent_id, memory_type, content, metadata, created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    const params = [
      memory.id,
      memory.userId,
      memory.agentId,
      memory.type,
      memory.content,
      JSON.stringify(memory.metadata),
      memory.createdAt.toISOString(),
      memory.expiresAt ? memory.expiresAt.toISOString() : null
    ];
    
    try {
      await db.query(query, params);
    } catch (error) {
      logger.error(`Fehler beim Speichern der Erinnerung ${memory.id} in der Datenbank`, error);
      throw error;
    }
  }

  /**
   * Ruft eine Erinnerung nach ID ab
   */
  public async getMemory(userId: string, memoryId: string): Promise<Memory | null> {
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      const filePath = path.join(this.memoryDir, `${memoryId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Memory;
        
        // Überprüfe, ob die Erinnerung dem angegebenen Benutzer gehört
        if (data.userId !== userId) {
          return null;
        }
        
        return data;
      } catch (error) {
        logger.error(`Fehler beim Lesen der Erinnerung ${memoryId}`, error);
        return null;
      }
    } else {
      // Datenbankbasierte Implementierung
      const query = `
        SELECT * FROM agent_memories
        WHERE id = $1 AND user_id = $2
      `;
      
      try {
        const result = await db.query(query, [memoryId, userId]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return this.mapDatabaseRowToMemory(result.rows[0]);
      } catch (error) {
        logger.error(`Fehler beim Abrufen der Erinnerung ${memoryId} aus der Datenbank`, error);
        return null;
      }
    }
  }

  /**
   * Konvertiert eine Datenbankzeile in ein Memory-Objekt
   */
  private mapDatabaseRowToMemory(row: any): Memory {
    return {
      id: row.id,
      userId: row.user_id,
      agentId: row.agent_id,
      type: row.memory_type as MemoryType,
      content: row.content,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: new Date(row.created_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
    };
  }

  /**
   * Ruft Erinnerungen basierend auf der Abfrage ab
   */
  public async queryMemories(query: MemoryQuery): Promise<Memory[]> {
    const { userId, agentId, type, tags, minImportance, limit = 10 } = query;
    
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      try {
        const files = fs.readdirSync(this.memoryDir);
        let memories: Memory[] = [];
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const filePath = path.join(this.memoryDir, file);
          const memory = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Memory;
          
          // Filtere nach Benutzer-ID
          if (memory.userId !== userId) continue;
          
          // Filtere nach Agenten-ID (falls angegeben)
          if (agentId && memory.agentId !== agentId) continue;
          
          // Filtere nach Typ (falls angegeben)
          if (type && memory.type !== type) continue;
          
          // Filtere nach Wichtigkeit (falls angegeben)
          if (minImportance && memory.metadata.importance < minImportance) continue;
          
          // Filtere nach Tags (falls angegeben)
          if (tags && tags.length > 0) {
            if (!memory.metadata.tags || !memory.metadata.tags.some(tag => tags.includes(tag))) {
              continue;
            }
          }
          
          memories.push(memory);
        }
        
        // Einfache Textsuche, wenn ein Query-String angegeben ist
        if (query.query) {
          const lowerQuery = query.query.toLowerCase();
          memories = memories.filter(memory => 
            memory.content.toLowerCase().includes(lowerQuery) ||
            (memory.metadata.context && memory.metadata.context.toLowerCase().includes(lowerQuery))
          );
        }
        
        // Sortiere nach Wichtigkeit und Erstellungsdatum
        memories = memories.sort((a, b) => {
          // Primär nach Wichtigkeit (absteigend)
          if (b.metadata.importance !== a.metadata.importance) {
            return b.metadata.importance - a.metadata.importance;
          }
          // Sekundär nach Erstellungsdatum (neuere zuerst)
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        // Begrenzt die Anzahl der zurückgegebenen Erinnerungen
        return memories.slice(0, limit);
      } catch (error) {
        logger.error('Fehler beim Abfragen von Erinnerungen aus dem Dateisystem', error);
        return [];
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        let queryStr = `
          SELECT * FROM agent_memories
          WHERE user_id = $1
        `;
        
        const queryParams: any[] = [userId];
        let paramIndex = 2; // Nächster Parameter-Index
        
        // Filtere nach Agenten-ID
        if (agentId) {
          queryStr += ` AND agent_id = $${paramIndex++}`;
          queryParams.push(agentId);
        }
        
        // Filtere nach Typ
        if (type) {
          queryStr += ` AND memory_type = $${paramIndex++}`;
          queryParams.push(type);
        }
        
        // Filtere nach Wichtigkeit
        if (minImportance) {
          queryStr += ` AND (metadata->>'importance')::int >= $${paramIndex++}`;
          queryParams.push(minImportance);
        }
        
        // Textsuche
        if (query.query) {
          queryStr += ` AND (content ILIKE $${paramIndex} OR metadata->>'context' ILIKE $${paramIndex})`;
          queryParams.push(`%${query.query}%`);
          paramIndex++;
        }
        
        // Tag-Filterung (einfache Implementierung)
        if (tags && tags.length > 0) {
          const tagConditions = tags.map((_, idx) => `metadata->'tags' ? $${paramIndex + idx}`);
          queryStr += ` AND (${tagConditions.join(' OR ')})`;
          queryParams.push(...tags);
          paramIndex += tags.length;
        }
        
        // Sortierung und Limit
        queryStr += ` ORDER BY (metadata->>'importance')::int DESC, created_at DESC LIMIT $${paramIndex}`;
        queryParams.push(limit);
        
        const result = await db.query(queryStr, queryParams);
        return result.rows.map(row => this.mapDatabaseRowToMemory(row));
      } catch (error) {
        logger.error('Fehler beim Abfragen von Erinnerungen aus der Datenbank', error);
        return [];
      }
    }
  }

  /**
   * Aktualisiert eine bestehende Erinnerung
   */
  public async updateMemory(
    userId: string,
    memoryId: string,
    updates: Partial<Pick<Memory, 'content' | 'metadata' | 'type' | 'expiresAt'>>
  ): Promise<Memory | null> {
    // Zuerst die Erinnerung abrufen
    const memory = await this.getMemory(userId, memoryId);
    
    if (!memory) {
      return null;
    }
    
    // Aktualisiere die Erinnerung mit den neuen Werten
    const updatedMemory: Memory = {
      ...memory,
      content: updates.content ?? memory.content,
      type: updates.type ?? memory.type,
      metadata: {
        ...memory.metadata,
        ...(updates.metadata || {})
      },
      expiresAt: updates.expiresAt ?? memory.expiresAt
    };
    
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      await this.saveMemoryToFile(updatedMemory);
    } else {
      // Datenbankbasierte Implementierung
      const query = `
        UPDATE agent_memories
        SET content = $1, memory_type = $2, metadata = $3, expires_at = $4
        WHERE id = $5 AND user_id = $6
      `;
      
      const params = [
        updatedMemory.content,
        updatedMemory.type,
        JSON.stringify(updatedMemory.metadata),
        updatedMemory.expiresAt?.toISOString() || null,
        memoryId,
        userId
      ];
      
      await db.query(query, params);
    }
    
    logger.debug(`Erinnerung aktualisiert: ${memoryId}`);
    return updatedMemory;
  }

  /**
   * Löscht eine Erinnerung
   */
  public async deleteMemory(userId: string, memoryId: string): Promise<boolean> {
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      const filePath = path.join(this.memoryDir, `${memoryId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      try {
        // Überprüfe zuerst, ob die Erinnerung dem Benutzer gehört
        const memory = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Memory;
        
        if (memory.userId !== userId) {
          return false;
        }
        
        fs.unlinkSync(filePath);
        logger.debug(`Erinnerung gelöscht: ${memoryId}`);
        return true;
      } catch (error) {
        logger.error(`Fehler beim Löschen der Erinnerung ${memoryId}`, error);
        return false;
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        const query = `
          DELETE FROM agent_memories
          WHERE id = $1 AND user_id = $2
        `;
        
        const result = await db.query(query, [memoryId, userId]);
        
        if (result.rowCount === 0) {
          return false;
        }
        
        logger.debug(`Erinnerung gelöscht: ${memoryId}`);
        return true;
      } catch (error) {
        logger.error(`Fehler beim Löschen der Erinnerung ${memoryId} aus der Datenbank`, error);
        return false;
      }
    }
  }

  /**
   * Löscht alle Erinnerungen eines Agenten
   */
  public async deleteAgentMemories(userId: string, agentId: string): Promise<boolean> {
    if (this.useFileSystem) {
      // Dateisystem-basierte Implementierung
      try {
        const files = fs.readdirSync(this.memoryDir);
        let deletedCount = 0;
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const filePath = path.join(this.memoryDir, file);
          const memory = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Memory;
          
          if (memory.userId === userId && memory.agentId === agentId) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
        
        logger.info(`${deletedCount} Erinnerungen für Agenten ${agentId} gelöscht`);
        return true;
      } catch (error) {
        logger.error(`Fehler beim Löschen der Erinnerungen für Agenten ${agentId}`, error);
        return false;
      }
    } else {
      // Datenbankbasierte Implementierung
      try {
        const query = `
          DELETE FROM agent_memories
          WHERE user_id = $1 AND agent_id = $2
        `;
        
        const result = await db.query(query, [userId, agentId]);
        logger.info(`${result.rowCount} Erinnerungen für Agenten ${agentId} gelöscht`);
        return true;
      } catch (error) {
        logger.error(`Fehler beim Löschen der Erinnerungen für Agenten ${agentId} aus der Datenbank`, error);
        return false;
      }
    }
  }
}

export const advancedMemory = AdvancedMemory.getInstance();
export default advancedMemory;