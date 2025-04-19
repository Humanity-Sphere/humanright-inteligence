/**
 * Uwazi Integration API Routes
 * 
 * Diese Datei definiert die API-Endpunkte für die Integration mit dem Uwazi-System.
 * Die Endpunkte ermöglichen das Abrufen von Daten aus Uwazi, die Synchronisierung von
 * Uwazi-Entitäten mit unserer Anwendung und das Extrahieren von Wissen aus Uwazi-Dokumenten.
 */

import { Express, Request, Response } from 'express';
import { 
  UwaziAdapter, 
  initUwaziAdapter, 
  getUwaziAdapter 
} from './adapter';
import { z } from 'zod';

// Schema für die Initialisierungsdaten der Uwazi-Verbindung
const uwaziConnectionSchema = z.object({
  url: z.string().min(1, 'URL ist erforderlich'),
  dbName: z.string().min(1, 'Datenbankname ist erforderlich'),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Schema für den Template-Namen
const templateNameSchema = z.object({
  templateName: z.string().min(1, 'Template-Name ist erforderlich'),
});

/**
 * Registriert alle Uwazi-bezogenen API-Routen
 */
export function registerUwaziRoutes(app: Express): void {
  /**
   * Initialisieren der Verbindung zur Uwazi-Instanz
   */
  app.post('/api/uwazi/connect', async (req: Request, res: Response) => {
    try {
      const validatedData = uwaziConnectionSchema.parse(req.body);
      
      const adapter = await initUwaziAdapter(validatedData);
      const isConnected = adapter.isConnected();
      
      if (isConnected) {
        res.status(200).json({ 
          success: true, 
          message: 'Verbindung zur Uwazi-Instanz erfolgreich hergestellt' 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Verbindung zur Uwazi-Instanz konnte nicht hergestellt werden' 
        });
      }
    } catch (error) {
      console.error('Fehler beim Verbinden mit Uwazi:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: 'Ungültige Verbindungsdaten', 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Fehler beim Verbinden mit Uwazi', 
          error: (error as Error).message 
        });
      }
    }
  });

  /**
   * Abrufen aller Templates aus der Uwazi-Instanz
   */
  app.get('/api/uwazi/templates', async (req: Request, res: Response) => {
    try {
      const adapter = getUwaziAdapter();
      const templates = await adapter.getTemplates();
      
      res.status(200).json({
        success: true,
        data: templates.map(template => ({
          id: template._id.toString(),
          name: template.name,
          propertiesCount: template.properties.length,
        })),
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Uwazi-Templates:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Abrufen der Uwazi-Templates', 
        error: (error as Error).message 
      });
    }
  });

  /**
   * Abrufen aller Entitäten eines bestimmten Templates
   */
  app.get('/api/uwazi/entities/:templateName', async (req: Request, res: Response) => {
    try {
      const templateName = req.params.templateName;
      
      if (!templateName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Template-Name ist erforderlich' 
        });
      }
      
      const adapter = getUwaziAdapter();
      const entities = await adapter.getEntitiesByTemplate(templateName);
      
      res.status(200).json({
        success: true,
        count: entities.length,
        data: entities.map(entity => ({
          id: entity._id.toString(),
          title: entity.title,
          template: entity.template,
          sharedId: entity.sharedId,
          language: entity.language,
          published: entity.published,
          creationDate: entity.creationDate,
        })),
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Uwazi-Entitäten:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Abrufen der Uwazi-Entitäten', 
        error: (error as Error).message 
      });
    }
  });

  /**
   * Synchronisieren von Uwazi-Entitäten mit unserer Dokumenten-Tabelle
   */
  app.post('/api/uwazi/sync/documents', async (req: Request, res: Response) => {
    try {
      const validatedData = templateNameSchema.parse(req.body);
      const { templateName } = validatedData;
      
      const adapter = getUwaziAdapter();
      const importedCount = await adapter.syncEntitiesToDocuments(templateName);
      
      res.status(200).json({
        success: true,
        message: `${importedCount} Entitäten wurden erfolgreich synchronisiert`,
        count: importedCount,
      });
    } catch (error) {
      console.error('Fehler bei der Synchronisierung von Uwazi-Entitäten:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: 'Ungültige Anfragedaten', 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Fehler bei der Synchronisierung von Uwazi-Entitäten', 
          error: (error as Error).message 
        });
      }
    }
  });

  /**
   * Extrahieren von Wissen aus Uwazi-Entitäten und Erstellen von Knowledge Contexts
   */
  app.post('/api/uwazi/extract/knowledge', async (req: Request, res: Response) => {
    try {
      const validatedData = templateNameSchema.parse(req.body);
      const { templateName } = validatedData;
      
      const adapter = getUwaziAdapter();
      const createdCount = await adapter.extractKnowledgeFromEntities(templateName);
      
      res.status(200).json({
        success: true,
        message: `Wissen aus ${createdCount} Entitäten wurde erfolgreich extrahiert`,
        count: createdCount,
      });
    } catch (error) {
      console.error('Fehler beim Extrahieren von Wissen aus Uwazi-Entitäten:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: 'Ungültige Anfragedaten', 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Fehler beim Extrahieren von Wissen aus Uwazi-Entitäten', 
          error: (error as Error).message 
        });
      }
    }
  });

  /**
   * Status der Uwazi-Verbindung abfragen
   */
  app.get('/api/uwazi/status', (req: Request, res: Response) => {
    try {
      // Versuchen, den Adapter zu bekommen, ohne einen Fehler zu werfen, wenn er nicht initialisiert ist
      let adapter: UwaziAdapter | null = null;
      try {
        adapter = getUwaziAdapter();
      } catch (e) {
        // Adapter ist nicht initialisiert
      }
      
      const isConnected = adapter?.isConnected() || false;
      
      res.status(200).json({
        success: true,
        connected: isConnected,
        initialized: adapter !== null,
      });
    } catch (error) {
      console.error('Fehler beim Abrufen des Uwazi-Status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Abrufen des Uwazi-Status', 
        error: (error as Error).message 
      });
    }
  });
}