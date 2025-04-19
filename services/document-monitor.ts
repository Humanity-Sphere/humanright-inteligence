
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { documents } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Service zur Überwachung und automatischen Reparatur von Dokumentenproblemen
 */
class DocumentMonitorService {
  private static instance: DocumentMonitorService;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): DocumentMonitorService {
    if (!DocumentMonitorService.instance) {
      DocumentMonitorService.instance = new DocumentMonitorService();
    }
    return DocumentMonitorService.instance;
  }

  /**
   * Startet die Überwachung der Dokumente
   */
  public async startMonitoring(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Dokumenten-Überwachung gestartet');
    
    // Erste Prüfung sofort ausführen
    await this.checkAndRepairDocuments();
    
    // Regelmäßige Prüfung alle 10 Minuten
    setInterval(() => {
      this.checkAndRepairDocuments().catch(err => {
        console.error('Fehler bei der Dokumentenprüfung:', err);
      });
    }, 10 * 60 * 1000);
  }

  /**
   * Prüft und repariert Dokumente mit fehlenden Dateien
   */
  private async checkAndRepairDocuments(): Promise<void> {
    try {
      // Alle Dokumente abrufen
      let allDocuments;
      try {
        allDocuments = await db.select().from(documents);
      } catch (error) {
        console.log("Keine Dokumente gefunden oder Fehler beim Abrufen der Dokumente");
        allDocuments = []; // Leeres Array, falls keine Dokumente gefunden wurden
      }
      
      // Uploads-Verzeichnis sicherstellen
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      if (!Array.isArray(allDocuments)) {
        console.log("allDocuments ist kein Array, konvertiere zu leerem Array");
        allDocuments = [];
      }
      
      for (const doc of allDocuments) {
        if (!doc.filePath) continue;
        
        const filePath = doc.filePath.startsWith('/') 
          ? doc.filePath 
          : path.join(process.cwd(), doc.filePath);
        
        try {
          // Prüfen, ob Datei existiert
          await fs.access(filePath, fs.constants.R_OK);
        } catch (error) {
          console.warn(`Fehlende Datei gefunden: ${filePath}`);
          
          if (doc.content) {
            // Wenn Inhalt in der Datenbank vorhanden ist, Datei wiederherstellen
            try {
              await fs.writeFile(filePath, doc.content, 'utf-8');
              console.log(`Datei wiederhergestellt: ${filePath}`);
            } catch (writeError) {
              console.error(`Fehler beim Wiederherstellen der Datei ${filePath}:`, writeError);
            }
          } else {
            // Wenn kein Inhalt vorhanden ist, als fehlend markieren
            await db.update(documents)
              .set({ 
                filePath: null,
                metadata: { 
                  ...doc.metadata as object,
                  fileStatus: 'missing',
                  originalPath: doc.filePath 
                }
              })
              .where(eq(documents.id, doc.id));
            console.log(`Dokument ${doc.id} als fehlend markiert`);
          }
        }
      }
    } catch (error) {
      console.error('Fehler bei der Dokumentenprüfung:', error);
    }
  }
}

export default DocumentMonitorService;
