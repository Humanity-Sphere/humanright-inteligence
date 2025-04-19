import fs from 'fs';
import path from 'path';
import { IStorage } from '../storage';
import { SelectUser, SelectDocument, SelectCampaign, SelectSafetyRecommendation } from '@shared/schema';

/**
 * FileSystemStorage - Eine Storage-Implementierung, die Daten im lokalen Dateisystem speichert
 * Diese Implementierung ist für lokale Ausführung gedacht
 */
export class FileSystemStorage implements Partial<IStorage> {
  private baseDir: string;
  private dataCache: Record<string, any[]> = {};
  private initialized: Record<string, boolean> = {};

  constructor(baseDir?: string) {
    // Wenn kein Basisverzeichnis angegeben ist, verwenden wir einen Standard-Pfad
    this.baseDir = baseDir || path.join(process.cwd(), 'local-data');
    
    // Stelle sicher, dass das Basisverzeichnis existiert
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
      console.log(`[LocalStorage] Basisverzeichnis erstellt: ${this.baseDir}`);
    }
  }

  /**
   * Initialisiert das Speicherverzeichnis für einen bestimmten Datentyp
   */
  private initializeDataType(dataType: string): void {
    if (this.initialized[dataType]) return;

    const dataDir = path.join(this.baseDir, dataType);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const indexFile = path.join(dataDir, 'index.json');
    if (!fs.existsSync(indexFile)) {
      fs.writeFileSync(indexFile, JSON.stringify([]));
    }

    const rawData = fs.readFileSync(indexFile, 'utf-8');
    this.dataCache[dataType] = JSON.parse(rawData);
    this.initialized[dataType] = true;
    console.log(`[LocalStorage] Datentyp initialisiert: ${dataType} mit ${this.dataCache[dataType].length} Einträgen`);
  }

  /**
   * Speichert die aktualisierten Daten eines bestimmten Typs im Dateisystem
   */
  private persistData(dataType: string): void {
    if (!this.initialized[dataType]) this.initializeDataType(dataType);
    
    const indexFile = path.join(this.baseDir, dataType, 'index.json');
    fs.writeFileSync(indexFile, JSON.stringify(this.dataCache[dataType], null, 2));
  }

  /**
   * Speichert große Dateien separat im Dateisystem
   */
  private persistLargeContent(dataType: string, id: number, content: string): void {
    const dataFile = path.join(this.baseDir, dataType, `${id}.json`);
    fs.writeFileSync(dataFile, JSON.stringify({ content }, null, 2));
  }

  /**
   * Liest große Dateien aus dem Dateisystem
   */
  private readLargeContent(dataType: string, id: number): string | null {
    const dataFile = path.join(this.baseDir, dataType, `${id}.json`);
    
    if (!fs.existsSync(dataFile)) {
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    return data.content || null;
  }

  // ==== Benutzer-Funktionen ====
  
  /**
   * Gibt alle Benutzer zurück
   */
  async getUsers(): Promise<SelectUser[]> {
    this.initializeDataType('users');
    return this.dataCache['users'];
  }

  /**
   * Gibt einen bestimmten Benutzer zurück
   */
  async getUser(id: number): Promise<SelectUser | null> {
    this.initializeDataType('users');
    return this.dataCache['users'].find(user => user.id === id) || null;
  }

  /**
   * Erstellt einen neuen Benutzer
   */
  async createUser(userData: any): Promise<SelectUser> {
    this.initializeDataType('users');
    
    const newId = this.dataCache['users'].length > 0 
      ? Math.max(...this.dataCache['users'].map(u => u.id)) + 1 
      : 1;
    
    const newUser = {
      ...userData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.dataCache['users'].push(newUser);
    this.persistData('users');
    return newUser;
  }

  // ==== Dokument-Funktionen ====
  
  /**
   * Gibt alle Dokumente eines Benutzers zurück
   */
  async getDocuments(userId: number): Promise<SelectDocument[]> {
    this.initializeDataType('documents');
    return this.dataCache['documents'].filter(doc => doc.userId === userId);
  }

  /**
   * Gibt ein bestimmtes Dokument zurück
   */
  async getDocument(id: number): Promise<SelectDocument | null> {
    this.initializeDataType('documents');
    const document = this.dataCache['documents'].find(doc => doc.id === id);
    
    if (!document) return null;
    
    // Wenn der Inhalt ausgelagert wurde, füge ihn wieder hinzu
    if (document.content === '[Stored separately]') {
      const content = this.readLargeContent('documents', id);
      if (content) {
        document.content = content;
      }
    }
    
    return document;
  }

  /**
   * Erstellt ein neues Dokument
   */
  async createDocument(documentData: any): Promise<SelectDocument> {
    this.initializeDataType('documents');
    
    const newId = this.dataCache['documents'].length > 0 
      ? Math.max(...this.dataCache['documents'].map(d => d.id)) + 1 
      : 1;
    
    const newDocument = {
      ...documentData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Für größere Dokumente, speichere den Inhalt separat
    if (documentData.content && documentData.content.length > 1000) {
      this.persistLargeContent('documents', newId, documentData.content);
      // Ersetze den Inhalt im Index-Objekt
      newDocument.content = '[Stored separately]';
    }
    
    this.dataCache['documents'].push(newDocument);
    this.persistData('documents');
    return {
      ...newDocument,
      content: documentData.content // Original-Inhalt zurückgeben
    };
  }

  /**
   * Löscht ein Dokument
   */
  async deleteDocument(id: number): Promise<boolean> {
    this.initializeDataType('documents');
    
    const initialLength = this.dataCache['documents'].length;
    this.dataCache['documents'] = this.dataCache['documents'].filter(doc => doc.id !== id);
    
    // Lösche auch die separate Inhaltsdatei, falls vorhanden
    const contentFile = path.join(this.baseDir, 'documents', `${id}.json`);
    if (fs.existsSync(contentFile)) {
      fs.unlinkSync(contentFile);
    }
    
    this.persistData('documents');
    return initialLength > this.dataCache['documents'].length;
  }

  // ==== Sicherheitsempfehlungs-Funktionen ====
  
  /**
   * Gibt alle Sicherheitsempfehlungen zurück
   */
  async getSafetyRecommendations(): Promise<SelectSafetyRecommendation[]> {
    this.initializeDataType('safetyRecommendations');
    return this.dataCache['safetyRecommendations'];
  }

  /**
   * Gibt eine bestimmte Sicherheitsempfehlung zurück
   */
  async getSafetyRecommendation(id: number): Promise<SelectSafetyRecommendation | null> {
    this.initializeDataType('safetyRecommendations');
    return this.dataCache['safetyRecommendations'].find(rec => rec.id === id) || null;
  }

  /**
   * Erstellt eine neue Sicherheitsempfehlung
   */
  async createSafetyRecommendation(data: any): Promise<SelectSafetyRecommendation> {
    this.initializeDataType('safetyRecommendations');
    
    const newId = this.dataCache['safetyRecommendations'].length > 0 
      ? Math.max(...this.dataCache['safetyRecommendations'].map(r => r.id)) + 1 
      : 1;
    
    const newRecommendation = {
      ...data,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isImplemented: false
    };
    
    this.dataCache['safetyRecommendations'].push(newRecommendation);
    this.persistData('safetyRecommendations');
    return newRecommendation;
  }

  /**
   * Aktualisiert eine Sicherheitsempfehlung
   */
  async updateSafetyRecommendation(id: number, data: any): Promise<SelectSafetyRecommendation | null> {
    this.initializeDataType('safetyRecommendations');
    
    const index = this.dataCache['safetyRecommendations'].findIndex(rec => rec.id === id);
    if (index === -1) return null;
    
    const updatedRecommendation = {
      ...this.dataCache['safetyRecommendations'][index],
      ...data,
      updatedAt: new Date()
    };
    
    this.dataCache['safetyRecommendations'][index] = updatedRecommendation;
    this.persistData('safetyRecommendations');
    return updatedRecommendation;
  }

  /**
   * Löscht eine Sicherheitsempfehlung
   */
  async deleteSafetyRecommendation(id: number): Promise<boolean> {
    this.initializeDataType('safetyRecommendations');
    
    const initialLength = this.dataCache['safetyRecommendations'].length;
    this.dataCache['safetyRecommendations'] = this.dataCache['safetyRecommendations'].filter(rec => rec.id !== id);
    
    this.persistData('safetyRecommendations');
    return initialLength > this.dataCache['safetyRecommendations'].length;
  }

  /**
   * Gibt alle Sicherheitsempfehlungen eines Benutzers zurück
   */
  async getSafetyRecommendationsByUser(userId: number): Promise<SelectSafetyRecommendation[]> {
    this.initializeDataType('safetyRecommendations');
    return this.dataCache['safetyRecommendations'].filter(rec => rec.userId === userId);
  }
}

// Singleton-Export für einfache Verwendung
export const fileSystemStorage = new FileSystemStorage();