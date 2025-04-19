import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import SQLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptionService from './EncryptionService';
import { v4 as uuidv4 } from 'uuid';

// Typen für das Offline-Management
interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: string;
  body: any;
  timestamp: number;
  retries: number;
}

interface OfflineData {
  documentCache: Record<string, any>;
  learningPathsCache: Record<string, any>;
  evidenceCache: Record<string, any>;
  legalCasesCache: Record<string, any>;
  journalEntriesCache: Record<string, any>;
}

// Journal-Eintrag-Struktur
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
  mood?: string;
  tags?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    description?: string;
  };
  isEncrypted: boolean;
}

/**
 * Offline-Manager für die App
 * Verwaltet:
 * 1. Lokale SQLite-Datenbank für komplexe Daten
 * 2. AsyncStorage für einfachere Daten und Einstellungen
 * 3. Synchronisationswarteschlange für Operationen im Offline-Modus
 * 4. Netzwerkstatusüberwachung
 */
class OfflineManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private isOnline: boolean = true;
  private syncQueue: SyncQueueItem[] = [];
  private syncInProgress: boolean = false;
  private netInfoUnsubscribe: (() => void) | null = null;
  
  /**
   * Initialisiert den Offline-Manager
   */
  public async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      console.warn('SQLite ist nicht für Web verfügbar');
      return;
    }
    
    try {
      // SQLite-Datenbank öffnen
      SQLite.enablePromise(true);
      this.db = await SQLite.openDatabase({
        name: 'hrdefender.db',
        location: 'default'
      });
      
      // Tabellen erstellen, falls sie nicht existieren
      await this.initDatabase();
      
      // Warteschlange aus dem AsyncStorage laden
      await this.loadSyncQueue();
      
      // Netzwerkstatus-Listener einrichten
      this.setupNetworkListener();
      
      console.log('Offline-Manager erfolgreich initialisiert');
    } catch (error) {
      console.error('Fehler beim Initialisieren des Offline-Managers:', error);
    }
  }
  
  /**
   * Erstellt die erforderlichen Datenbanktabellen
   */
  private async initDatabase(): Promise<void> {
    if (!this.db) return;
    
    try {
      // Tabelle für Dokumente
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          tags TEXT,
          metadata TEXT,
          sync_status TEXT
        );
      `);
      
      // Tabelle für Lernpfade
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS learning_paths (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          modules TEXT,
          progress REAL,
          sync_status TEXT
        );
      `);
      
      // Tabelle für Beweise
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS evidence (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          media_urls TEXT,
          created_at INTEGER NOT NULL,
          location TEXT,
          verified INTEGER,
          case_ids TEXT,
          sync_status TEXT
        );
      `);
      
      // Tabelle für Rechtsfälle
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS legal_cases (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          status TEXT,
          evidence_ids TEXT,
          related_documents TEXT,
          sync_status TEXT
        );
      `);
      
      // Tabelle für Journal-Einträge (Tagebuch)
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          mood TEXT,
          tags TEXT,
          location TEXT,
          is_encrypted INTEGER DEFAULT 1,
          sync_status TEXT
        );
      `);
      
      // Tabelle für die Synchronisationswarteschlange
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          body TEXT,
          timestamp INTEGER NOT NULL,
          retries INTEGER DEFAULT 0
        );
      `);
      
      console.log('Datenbanktabellen erfolgreich erstellt/überprüft');
    } catch (error) {
      console.error('Fehler beim Erstellen der Datenbanktabellen:', error);
    }
  }
  
  /**
   * Richtet einen Listener für Netzwerkänderungen ein
   */
  private setupNetworkListener(): void {
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true;
      
      // Wenn die Verbindung wiederhergestellt wurde, Synchronisation starten
      if (!wasOnline && this.isOnline) {
        console.log('Netzwerkverbindung wiederhergestellt, starte Synchronisation');
        this.syncData();
      }
    });
  }
  
  /**
   * Lädt die Synchronisationswarteschlange aus dem AsyncStorage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueString = await AsyncStorage.getItem('syncQueue');
      if (queueString) {
        this.syncQueue = JSON.parse(queueString);
        console.log(`Synchronisationswarteschlange geladen: ${this.syncQueue.length} Einträge`);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Synchronisationswarteschlange:', error);
    }
  }
  
  /**
   * Speichert die Synchronisationswarteschlange im AsyncStorage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Fehler beim Speichern der Synchronisationswarteschlange:', error);
    }
  }
  
  /**
   * Fügt eine Operation zur Synchronisationswarteschlange hinzu
   */
  public async addToSyncQueue(endpoint: string, method: string, body: any): Promise<string> {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 9);
    const queueItem: SyncQueueItem = {
      id,
      endpoint,
      method,
      body,
      timestamp: Date.now(),
      retries: 0
    };
    
    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();
    
    if (this.isOnline && !this.syncInProgress) {
      this.syncData();
    }
    
    return id;
  }
  
  /**
   * Synchronisiert Daten mit dem Backend, wenn online
   */
  public async syncData(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      const queue = [...this.syncQueue];
      let successCount = 0;
      
      for (const item of queue) {
        try {
          const response = await fetch(item.endpoint, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: item.method !== 'GET' ? JSON.stringify(item.body) : undefined,
          });
          
          if (response.ok) {
            // Bei Erfolg aus der Warteschlange entfernen
            this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
            successCount++;
          } else {
            // Bei Fehler Retries erhöhen
            const queueItem = this.syncQueue.find(i => i.id === item.id);
            if (queueItem) {
              queueItem.retries += 1;
              
              // Nach 5 Versuchen aufgeben
              if (queueItem.retries > 5) {
                this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
                console.warn(`Synchronisation für ${item.endpoint} nach 5 Versuchen abgebrochen`);
              }
            }
          }
        } catch (error) {
          console.error(`Fehler bei der Synchronisation für ${item.endpoint}:`, error);
        }
      }
      
      await this.saveSyncQueue();
      console.log(`Synchronisation abgeschlossen: ${successCount}/${queue.length} erfolgreich`);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Lädt Daten aus der SQLite-Datenbank
   */
  public async getDataFromDatabase<T>(table: string, id?: string): Promise<T | T[] | null> {
    if (!this.db) return null;
    
    try {
      let query: string;
      let params: any[] = [];
      
      if (id) {
        query = `SELECT * FROM ${table} WHERE id = ?`;
        params = [id];
      } else {
        query = `SELECT * FROM ${table} ORDER BY updated_at DESC`;
      }
      
      const [results] = await this.db.executeSql(query, params);
      
      if (id) {
        return results.rows.length > 0 ? results.rows.item(0) : null;
      } else {
        const items: T[] = [];
        for (let i = 0; i < results.rows.length; i++) {
          items.push(results.rows.item(i));
        }
        return items;
      }
    } catch (error) {
      console.error(`Fehler beim Laden von Daten aus ${table}:`, error);
      return null;
    }
  }
  
  /**
   * Speichert Daten in der SQLite-Datenbank
   */
  public async saveDataToDatabase(table: string, data: any): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      // Einfache Implementierung für Insert/Update
      const now = Date.now();
      
      // Je nach Tabelle unterschiedliche Felder
      if (table === 'documents') {
        const { id, title, content, tags = [], metadata = {} } = data;
        
        await this.db.executeSql(
          `INSERT OR REPLACE INTO documents 
           (id, title, content, created_at, updated_at, tags, metadata, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            title, 
            content, 
            data.created_at || now, 
            now,
            JSON.stringify(tags),
            JSON.stringify(metadata),
            this.isOnline ? 'synced' : 'pending'
          ]
        );
      } else if (table === 'learning_paths') {
        const { id, title, description = '', modules = [] } = data;
        
        await this.db.executeSql(
          `INSERT OR REPLACE INTO learning_paths 
           (id, title, description, created_at, updated_at, modules, progress, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            title, 
            description, 
            data.created_at || now,
            now,
            JSON.stringify(modules),
            data.progress || 0,
            this.isOnline ? 'synced' : 'pending'
          ]
        );
      } else if (table === 'journal_entries') {
        const { 
          id = uuidv4(), 
          title, 
          content, 
          mood = null, 
          tags = [], 
          location = null,
          isEncrypted = true
        } = data;

        // Verschlüssele den Inhalt, wenn isEncrypted auf true gesetzt ist
        let finalContent = content;
        if (isEncrypted) {
          try {
            finalContent = EncryptionService.encrypt(content);
          } catch (encryptError) {
            console.error('Fehler bei der Verschlüsselung des Journal-Eintrags:', encryptError);
            return false;
          }
        }
        
        await this.db.executeSql(
          `INSERT OR REPLACE INTO journal_entries 
           (id, title, content, created_at, updated_at, mood, tags, location, is_encrypted, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            isEncrypted ? EncryptionService.encrypt(title) : title, 
            finalContent, 
            data.created_at || now,
            now,
            mood,
            JSON.stringify(tags),
            location ? JSON.stringify(location) : null,
            isEncrypted ? 1 : 0,
            this.isOnline ? 'synced' : 'pending'
          ]
        );

        // Gib die ID zurück, wenn es sich um einen neuen Eintrag handelt
        if (!data.id) {
          return id;
        }
      }
      
      // Wenn offline, zur Synchronisationswarteschlange hinzufügen
      if (!this.isOnline) {
        await this.addToSyncQueue(`/api/${table}`, data.id ? 'PUT' : 'POST', data);
      }
      
      return true;
    } catch (error) {
      console.error(`Fehler beim Speichern von Daten in ${table}:`, error);
      return false;
    }
  }
  
  /**
   * Lädt Journal-Einträge mit optionaler Entschlüsselung
   */
  public async getJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) return [];
    
    try {
      const query = `SELECT * FROM journal_entries ORDER BY created_at DESC`;
      const [results] = await this.db.executeSql(query, []);
      
      const entries: JournalEntry[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const item = results.rows.item(i);
        
        // Entschlüssele den Inhalt, wenn der Eintrag verschlüsselt ist
        const isEncrypted = item.is_encrypted === 1;
        let title = item.title;
        let content = item.content;
        
        if (isEncrypted) {
          try {
            title = EncryptionService.decrypt(item.title);
            content = EncryptionService.decrypt(item.content);
          } catch (decryptError) {
            console.error(`Fehler bei der Entschlüsselung des Journal-Eintrags ${item.id}:`, decryptError);
            // Fallback für den Fall, dass die Entschlüsselung fehlschlägt
            title = '[Verschlüsselter Titel]';
            content = '[Verschlüsselter Inhalt - Entschlüsselung fehlgeschlagen]';
          }
        }
        
        entries.push({
          id: item.id,
          title: title,
          content: content,
          created_at: item.created_at,
          updated_at: item.updated_at,
          mood: item.mood,
          tags: item.tags ? JSON.parse(item.tags) : [],
          location: item.location ? JSON.parse(item.location) : null,
          isEncrypted: isEncrypted
        });
      }
      
      return entries;
    } catch (error) {
      console.error('Fehler beim Laden der Journal-Einträge:', error);
      return [];
    }
  }
  
  /**
   * Lädt einen einzelnen Journal-Eintrag nach ID
   */
  public async getJournalEntry(id: string): Promise<JournalEntry | null> {
    if (!this.db) return null;
    
    try {
      const query = `SELECT * FROM journal_entries WHERE id = ?`;
      const [results] = await this.db.executeSql(query, [id]);
      
      if (results.rows.length === 0) {
        return null;
      }
      
      const item = results.rows.item(0);
      const isEncrypted = item.is_encrypted === 1;
      let title = item.title;
      let content = item.content;
      
      if (isEncrypted) {
        try {
          title = EncryptionService.decrypt(item.title);
          content = EncryptionService.decrypt(item.content);
        } catch (decryptError) {
          console.error(`Fehler bei der Entschlüsselung des Journal-Eintrags ${id}:`, decryptError);
          title = '[Verschlüsselter Titel]';
          content = '[Verschlüsselter Inhalt - Entschlüsselung fehlgeschlagen]';
        }
      }
      
      return {
        id: item.id,
        title: title,
        content: content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        mood: item.mood,
        tags: item.tags ? JSON.parse(item.tags) : [],
        location: item.location ? JSON.parse(item.location) : null,
        isEncrypted: isEncrypted
      };
    } catch (error) {
      console.error(`Fehler beim Laden des Journal-Eintrags ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Löscht einen Journal-Eintrag
   */
  public async deleteJournalEntry(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      await this.db.executeSql('DELETE FROM journal_entries WHERE id = ?', [id]);
      
      // Wenn online, auch am Server löschen
      if (this.isOnline) {
        try {
          await fetch(`/api/journal_entries/${id}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.error(`Fehler beim Löschen des Journal-Eintrags ${id} am Server:`, error);
          // Füge DELETE zur Synchronisationswarteschlange hinzu
          await this.addToSyncQueue(`/api/journal_entries/${id}`, 'DELETE', {});
        }
      } else {
        // Wenn offline, zur Synchronisationswarteschlange hinzufügen
        await this.addToSyncQueue(`/api/journal_entries/${id}`, 'DELETE', {});
      }
      
      return true;
    } catch (error) {
      console.error(`Fehler beim Löschen des Journal-Eintrags ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Bereinigt Ressourcen bei Beendigung
   */
  public async cleanup(): Promise<void> {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
    
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
  
  /**
   * Prüft, ob die App online ist
   */
  public isNetworkConnected(): boolean {
    return this.isOnline;
  }
  
  /**
   * Löscht alle Offline-Daten (für Logout/Reset)
   */
  public async clearAllData(): Promise<void> {
    if (!this.db) return;
    
    try {
      await this.db.executeSql('DELETE FROM documents');
      await this.db.executeSql('DELETE FROM learning_paths');
      await this.db.executeSql('DELETE FROM evidence');
      await this.db.executeSql('DELETE FROM legal_cases');
      await this.db.executeSql('DELETE FROM journal_entries');
      await this.db.executeSql('DELETE FROM sync_queue');
      
      this.syncQueue = [];
      await this.saveSyncQueue();
      
      // Auch den Verschlüsselungsschlüssel zurücksetzen
      await EncryptionService.resetEncryptionKey();
      
      console.log('Alle Offline-Daten gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen aller Daten:', error);
    }
  }
}

// Singleton-Instanz
export default new OfflineManager();