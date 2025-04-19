// Filesystem-basierter Speicher für die lokale Verwendung
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standardpfad für lokale Daten
const DEFAULT_DATA_DIR = path.join(__dirname, '../../local-data');
const DATA_DIR = process.env.LOCAL_DATA_DIR || DEFAULT_DATA_DIR;

// Verschlüsselungsschlüssel aus Umgebungsvariablen
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key';

// Stellt sicher, dass das Datenverzeichnis existiert
function ensureDataDirExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Lokales Datenverzeichnis erstellt: ${DATA_DIR}`);
    }
  } catch (err) {
    console.error(`Fehler beim Erstellen des Datenverzeichnisses: ${err.message}`);
    throw err;
  }
}

// Erstellt den Pfad für eine Datei basierend auf dem Entitätstyp und der ID
function getFilePath(entityType, id) {
  const entityDir = path.join(DATA_DIR, entityType);
  
  // Stelle sicher, dass das Verzeichnis für den Entitätstyp existiert
  if (!fs.existsSync(entityDir)) {
    fs.mkdirSync(entityDir, { recursive: true });
  }
  
  return path.join(entityDir, `${id}.json`);
}

// Verschlüsselt Daten
function encryptData(data) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), data: encrypted.toString('hex') };
  } catch (err) {
    console.error(`Verschlüsselungsfehler: ${err.message}`);
    throw err;
  }
}

// Entschlüsselt Daten
function decryptData(encryptedData) {
  try {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const encryptedText = Buffer.from(encryptedData.data, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (err) {
    console.error(`Entschlüsselungsfehler: ${err.message}`);
    throw err;
  }
}

// Speichert Daten in einer Datei
function saveData(entityType, id, data) {
  ensureDataDirExists();
  const filePath = getFilePath(entityType, id);
  
  try {
    // Verschlüssele die Daten vor dem Speichern
    const encryptedData = encryptData(data);
    fs.writeFileSync(filePath, JSON.stringify(encryptedData));
    return data;
  } catch (err) {
    console.error(`Fehler beim Speichern der Datei ${filePath}: ${err.message}`);
    throw err;
  }
}

// Liest Daten aus einer Datei
function loadData(entityType, id) {
  const filePath = getFilePath(entityType, id);
  
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const encryptedData = JSON.parse(fileContent);
    
    // Entschlüssele die Daten
    return decryptData(encryptedData);
  } catch (err) {
    console.error(`Fehler beim Lesen der Datei ${filePath}: ${err.message}`);
    return null;
  }
}

// Löscht Daten
function deleteData(entityType, id) {
  const filePath = getFilePath(entityType, id);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Fehler beim Löschen der Datei ${filePath}: ${err.message}`);
    return false;
  }
}

// Listet alle Einträge eines Entitätstyps auf
function listAllData(entityType, filter = null) {
  const entityDir = path.join(DATA_DIR, entityType);
  
  try {
    ensureDataDirExists();
    
    if (!fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(entityDir).filter(file => file.endsWith('.json'));
    const allData = files.map(file => {
      const id = parseInt(path.basename(file, '.json'));
      return loadData(entityType, id);
    }).filter(Boolean);
    
    // Wenn ein Filter angegeben ist, wende ihn an
    if (filter && typeof filter === 'function') {
      return allData.filter(filter);
    }
    
    return allData;
  } catch (err) {
    console.error(`Fehler beim Auflisten der Daten im Verzeichnis ${entityDir}: ${err.message}`);
    return [];
  }
}

// Generiert eine neue eindeutige ID für einen Entitätstyp
function generateNextId(entityType) {
  const entityDir = path.join(DATA_DIR, entityType);
  
  try {
    ensureDataDirExists();
    
    if (!fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
      return 1;
    }
    
    const files = fs.readdirSync(entityDir).filter(file => file.endsWith('.json'));
    if (files.length === 0) {
      return 1;
    }
    
    const ids = files.map(file => parseInt(path.basename(file, '.json'))).filter(id => !isNaN(id));
    return Math.max(...ids) + 1;
  } catch (err) {
    console.error(`Fehler beim Generieren der nächsten ID: ${err.message}`);
    throw err;
  }
}

export default {
  saveData,
  loadData,
  deleteData,
  listAllData,
  generateNextId,
  ensureDataDirExists
};