// Storage Factory - erstellt den passenden Speichermechanismus basierend auf Konfiguration
import { MemStorage } from '../storage.js';
import filesystemStorage from './filesystem-storage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard-Datenverzeichnis
const DEFAULT_DATA_DIR = path.join(__dirname, '../../local-data');
const DATA_DIR = process.env.LOCAL_DATA_DIR || DEFAULT_DATA_DIR;

class FilesystemStorage extends MemStorage {
  constructor() {
    super();
    this.initialize();
  }

  // Initialisiert den Speicher
  initialize() {
    console.log(`Initialisiere Dateisystem-Speicher in: ${DATA_DIR}`);
    this.ensureDataDirExists();
    this.loadAllData();
  }

  // Stellt sicher, dass das Datenverzeichnis existiert
  ensureDataDirExists() {
    filesystemStorage.ensureDataDirExists();
  }

  // Lädt alle vorhandenen Daten aus dem Dateisystem
  loadAllData() {
    try {
      this.loadEntities('users', this.users);
      this.loadEntities('documents', this.documents);
      this.loadEntities('campaigns', this.campaigns);
      this.loadEntities('contents', this.contents);
      this.loadEntities('activities', this.activities);
      this.loadEntities('documentAnalyses', this.documentAnalyses);
      this.loadEntities('patterns', this.patterns);
      this.loadEntities('knowledgeContexts', this.knowledgeContexts);
      this.loadEntities('impactMetrics', this.impactMetrics);
      this.loadEntities('evidenceItems', this.evidenceItems);
      this.loadEntities('legalCases', this.legalCases);
      this.loadEntities('caseManagement', this.caseManagementItems);
      this.loadEntities('complaintTracking', this.complaintTrackingItems);
      this.loadEntities('progressAssessment', this.progressAssessments);
      this.loadEntities('collectiveMemory', this.collectiveMemoryItems);
      this.loadEntities('promptLibrary', this.promptLibraryItems);
      this.loadEntities('journalEntries', this.journalEntries);
      this.loadEntities('wellbeingCheckins', this.wellbeingCheckins);
      this.loadEntities('safetyRecommendations', this.safetyRecommendations);
    } catch (err) {
      console.error(`Fehler beim Laden der Daten: ${err.message}`);
    }
  }

  // Lädt Entitäten eines bestimmten Typs aus dem Dateisystem
  loadEntities(entityType, entityMap) {
    const entityDir = path.join(DATA_DIR, entityType);
    
    try {
      if (!fs.existsSync(entityDir)) {
        fs.mkdirSync(entityDir, { recursive: true });
        return;
      }
      
      const files = fs.readdirSync(entityDir).filter(file => file.endsWith('.json'));
      let maxId = 0;
      
      files.forEach(file => {
        const id = parseInt(path.basename(file, '.json'));
        if (isNaN(id)) return;
        
        const data = filesystemStorage.loadData(entityType, id);
        if (data) {
          entityMap.set(id, data);
          maxId = Math.max(maxId, id);
        }
      });
      
      // Aktualisiere die automatisch inkrementierte ID
      this.updateCounter(entityType, maxId);
      
    } catch (err) {
      console.error(`Fehler beim Laden der ${entityType}: ${err.message}`);
    }
  }

  // Aktualisiert den Zähler für den Entitätstyp
  updateCounter(entityType, maxId) {
    switch (entityType) {
      case 'users': this.userId = maxId + 1; break;
      case 'documents': this.documentId = maxId + 1; break;
      case 'campaigns': this.campaignId = maxId + 1; break;
      case 'contents': this.contentId = maxId + 1; break;
      case 'activities': this.activityId = maxId + 1; break;
      case 'documentAnalyses': this.documentAnalysisId = maxId + 1; break;
      case 'patterns': this.patternId = maxId + 1; break;
      case 'knowledgeContexts': this.knowledgeContextId = maxId + 1; break;
      case 'impactMetrics': this.impactMetricId = maxId + 1; break;
      case 'evidenceItems': this.evidenceItemId = maxId + 1; break;
      case 'legalCases': this.legalCaseId = maxId + 1; break;
      case 'caseManagement': this.caseManagementId = maxId + 1; break;
      case 'complaintTracking': this.complaintTrackingId = maxId + 1; break;
      case 'progressAssessment': this.progressAssessmentId = maxId + 1; break;
      case 'collectiveMemory': this.collectiveMemoryId = maxId + 1; break;
      case 'promptLibrary': this.promptLibraryId = maxId + 1; break;
      case 'journalEntries': this.journalEntryId = maxId + 1; break;
      case 'wellbeingCheckins': this.wellbeingCheckinId = maxId + 1; break;
      case 'safetyRecommendations': this.safetyRecommendationId = maxId + 1; break;
    }
  }

  // Überschreibungen der Basis-Methoden für persistente Speicherung

  // Benutzeroperationen mit Persistenz
  async createUser(user) {
    const result = await super.createUser(user);
    filesystemStorage.saveData('users', result.id, result);
    return result;
  }

  async updateUser(id, user) {
    const result = await super.updateUser(id, user);
    if (result) {
      filesystemStorage.saveData('users', id, result);
    }
    return result;
  }

  // Dokumentoperationen mit Persistenz
  async createDocument(document) {
    const result = await super.createDocument(document);
    filesystemStorage.saveData('documents', result.id, result);
    return result;
  }

  async updateDocument(id, document) {
    const result = await super.updateDocument(id, document);
    if (result) {
      filesystemStorage.saveData('documents', id, result);
    }
    return result;
  }

  async deleteDocument(id) {
    const result = await super.deleteDocument(id);
    if (result) {
      filesystemStorage.deleteData('documents', id);
    }
    return result;
  }

  // Weitere Entitätstypen würden hier ähnlich implementiert werden
  // Dies ist nur ein Beispiel für die Implementierung von Benutzern und Dokumenten
}

// Erstellt und liefert den passenden Speicher basierend auf der Konfiguration
export function createStorage() {
  const storageType = process.env.STORAGE_TYPE || 'auto';
  
  console.log(`Initialisiere Speicher vom Typ: ${storageType}`);
  
  switch (storageType.toLowerCase()) {
    case 'filesystem':
      return new FilesystemStorage();
    
    case 'memory':
      return new MemStorage();
    
    case 'auto':
    default:
      // Im Auto-Modus verwenden wir Filesystem, wenn wir lokal sind, 
      // sonst Memory-Storage als Fallback
      try {
        return new FilesystemStorage();
      } catch (err) {
        console.warn(`Konnte Filesystem-Speicher nicht initialisieren: ${err.message}`);
        console.warn('Falle zurück auf In-Memory-Speicher');
        return new MemStorage();
      }
  }
}