import OfflineManager, { JournalEntry } from './OfflineManager';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service zur Verwaltung von Journal-Einträgen
 * Bietet eine hohe Ebene der Abstraktion über dem OfflineManager
 */
class JournalService {
  /**
   * Holt alle Journal-Einträge
   */
  public async getJournalEntries(): Promise<JournalEntry[]> {
    return await OfflineManager.getJournalEntries();
  }
  
  /**
   * Holt einen einzelnen Journal-Eintrag nach ID
   */
  public async getJournalEntry(id: string): Promise<JournalEntry | null> {
    return await OfflineManager.getJournalEntry(id);
  }
  
  /**
   * Erstellt einen neuen Journal-Eintrag
   */
  public async createJournalEntry(data: {
    title: string;
    content: string;
    mood?: string;
    tags?: string[];
    location?: {
      latitude?: number;
      longitude?: number;
      description?: string;
    };
    isEncrypted?: boolean;
  }): Promise<string> {
    const id = uuidv4();
    const now = Date.now();
    
    const result = await OfflineManager.saveDataToDatabase('journal_entries', {
      id,
      title: data.title,
      content: data.content,
      created_at: now,
      updated_at: now,
      mood: data.mood || null,
      tags: data.tags || [],
      location: data.location || null,
      isEncrypted: data.isEncrypted !== false // Standardmäßig verschlüsselt, außer explizit deaktiviert
    });
    
    if (typeof result === 'string') {
      return result; // Erfolg, ID wurde zurückgegeben
    } else if (result === true) {
      return id;
    }
    
    throw new Error('Fehler beim Erstellen des Journal-Eintrags');
  }
  
  /**
   * Aktualisiert einen vorhandenen Journal-Eintrag
   */
  public async updateJournalEntry(id: string, data: {
    title?: string;
    content?: string;
    mood?: string;
    tags?: string[];
    location?: {
      latitude?: number;
      longitude?: number;
      description?: string;
    };
    isEncrypted?: boolean;
  }): Promise<boolean> {
    // Zuerst den vorhandenen Eintrag laden
    const existingEntry = await this.getJournalEntry(id);
    if (!existingEntry) {
      throw new Error(`Journal-Eintrag mit ID ${id} wurde nicht gefunden`);
    }
    
    // Aktualisierte Daten zusammenstellen
    const updatedEntry = {
      ...existingEntry,
      ...data,
      id, // ID beibehalten
      updated_at: Date.now(),
      // Wenn isEncrypted nicht explizit gesetzt wurde, behalte den vorherigen Wert bei
      isEncrypted: data.isEncrypted !== undefined ? data.isEncrypted : existingEntry.isEncrypted
    };
    
    // Speichern
    return await OfflineManager.saveDataToDatabase('journal_entries', updatedEntry) as boolean;
  }
  
  /**
   * Löscht einen Journal-Eintrag
   */
  public async deleteJournalEntry(id: string): Promise<boolean> {
    return await OfflineManager.deleteJournalEntry(id);
  }
  
  /**
   * Sucht nach Journal-Einträgen basierend auf Suchkriterien
   */
  public async searchJournalEntries(criteria: {
    searchText?: string;
    tags?: string[];
    fromDate?: number;
    toDate?: number;
    mood?: string;
  }): Promise<JournalEntry[]> {
    const entries = await this.getJournalEntries();
    
    return entries.filter(entry => {
      // Textsuche
      if (criteria.searchText) {
        const searchLower = criteria.searchText.toLowerCase();
        if (!entry.title.toLowerCase().includes(searchLower) && 
            !entry.content.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Tags-Suche
      if (criteria.tags && criteria.tags.length > 0) {
        if (!entry.tags || !criteria.tags.some(tag => entry.tags?.includes(tag))) {
          return false;
        }
      }
      
      // Datumsbereich
      if (criteria.fromDate && entry.created_at < criteria.fromDate) {
        return false;
      }
      if (criteria.toDate && entry.created_at > criteria.toDate) {
        return false;
      }
      
      // Stimmungsfilter
      if (criteria.mood && entry.mood !== criteria.mood) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Synchronisiert lokale Journal-Einträge mit dem Server
   * (Wird automatisch vom OfflineManager aufgerufen)
   */
  public async syncJournalEntries(): Promise<void> {
    // Trigger für die Synchronisation
    await OfflineManager.syncData();
  }
}

// Singleton-Instanz
export default new JournalService();