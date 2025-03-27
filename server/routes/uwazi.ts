import { Request, Response } from 'express';
import { Express } from 'express';
import { UwaziConnector } from '../services/uwazi';
import { storage } from '../storage';

// Uwazi-Konfiguration im Speicher
let uwaziConfig: {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  connected: boolean;
} = {
  baseUrl: '',
  connected: false
};

// Uwazi-Connector-Instanz
let uwaziConnector: UwaziConnector | null = null;

/**
 * Initialisiert den Uwazi-Connector mit der gespeicherten Konfiguration
 * 
 * @returns Eine Instanz des UwaziConnectors oder null bei fehlender Konfiguration
 */
async function initializeUwaziConnector(): Promise<UwaziConnector | null> {
  if (!uwaziConfig.baseUrl) {
    return null;
  }

  const connector = new UwaziConnector({
    baseUrl: uwaziConfig.baseUrl,
    apiKey: uwaziConfig.apiKey,
    username: uwaziConfig.username,
    password: uwaziConfig.password
  });

  try {
    const isAuthenticated = await connector.authenticate();
    if (isAuthenticated) {
      uwaziConfig.connected = true;
      return connector;
    }
  } catch (error) {
    console.error('Fehler bei der Initialisierung des Uwazi-Connectors:', error);
  }

  uwaziConfig.connected = false;
  return null;
}

/**
 * Registriert die Uwazi-Integrationsrouten in der Express-App
 * 
 * @param app Die Express-App
 */
export function registerUwaziRoutes(app: Express): void {
  // Uwazi-Konfigurationsstatus abrufen
  app.get('/api/integrations/uwazi/status', (req: Request, res: Response) => {
    res.json({
      baseUrl: uwaziConfig.baseUrl,
      connected: uwaziConfig.connected,
      hasApiKey: !!uwaziConfig.apiKey,
      hasCredentials: !!(uwaziConfig.username && uwaziConfig.password)
    });
  });

  // Uwazi-Verbindung konfigurieren
  app.post('/api/integrations/uwazi/configure', async (req: Request, res: Response) => {
    try {
      const { baseUrl, apiKey, username, password } = req.body;

      if (!baseUrl) {
        return res.status(400).json({ error: 'Die Basis-URL ist erforderlich' });
      }

      // Speichere die Konfiguration
      uwaziConfig = {
        baseUrl,
        apiKey,
        username,
        password,
        connected: false
      };

      // Initialisiere den Connector mit der neuen Konfiguration
      uwaziConnector = await initializeUwaziConnector();

      if (uwaziConnector && uwaziConfig.connected) {
        res.status(200).json({ success: true, message: 'Uwazi-Integration erfolgreich konfiguriert' });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Uwazi-Integration konnte nicht konfiguriert werden. Authentifizierung fehlgeschlagen.' 
        });
      }
    } catch (error) {
      console.error('Fehler bei der Konfiguration der Uwazi-Integration:', error);
      res.status(500).json({ 
        error: 'Fehler bei der Konfiguration der Uwazi-Integration',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // Uwazi-Verbindung testen
  app.post('/api/integrations/uwazi/test', async (req: Request, res: Response) => {
    try {
      const { baseUrl, apiKey, username, password } = req.body;

      if (!baseUrl) {
        return res.status(400).json({ error: 'Die Basis-URL ist erforderlich' });
      }

      // Erstelle einen temporären Connector für den Test
      const testConnector = new UwaziConnector({
        baseUrl,
        apiKey,
        username,
        password
      });

      const isAuthenticated = await testConnector.authenticate();

      if (isAuthenticated) {
        res.status(200).json({ success: true, message: 'Verbindung erfolgreich hergestellt' });
      } else {
        res.status(400).json({ success: false, message: 'Authentifizierung fehlgeschlagen' });
      }
    } catch (error) {
      console.error('Fehler beim Testen der Uwazi-Verbindung:', error);
      res.status(500).json({ 
        error: 'Fehler beim Testen der Uwazi-Verbindung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // Dokumente in Uwazi suchen
  app.get('/api/integrations/uwazi/search', async (req: Request, res: Response) => {
    try {
      // Prüfe, ob der Connector initialisiert ist
      if (!uwaziConnector || !uwaziConfig.connected) {
        uwaziConnector = await initializeUwaziConnector();
        if (!uwaziConnector) {
          return res.status(400).json({ error: 'Uwazi-Integration nicht konfiguriert' });
        }
      }

      const searchTerm = req.query.q as string || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Zusätzliche Filter extrahieren (wenn vorhanden)
      const filters: Record<string, any> = {};
      
      if (req.query.types) {
        try {
          filters.types = JSON.parse(req.query.types as string);
        } catch (e) {
          console.warn('Ungültiges types-Format:', req.query.types);
        }
      }
      
      // Suche durchführen
      const result = await uwaziConnector.searchDocuments(
        searchTerm,
        filters,
        { page, limit }
      );

      res.json(result);
    } catch (error) {
      console.error('Fehler bei der Uwazi-Dokumentensuche:', error);
      res.status(500).json({ 
        error: 'Fehler bei der Uwazi-Dokumentensuche',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // Dokumente aus Uwazi importieren
  app.post('/api/integrations/uwazi/import', async (req: Request, res: Response) => {
    try {
      // Prüfe, ob der Connector initialisiert ist
      if (!uwaziConnector || !uwaziConfig.connected) {
        uwaziConnector = await initializeUwaziConnector();
        if (!uwaziConnector) {
          return res.status(400).json({ error: 'Uwazi-Integration nicht konfiguriert' });
        }
      }

      const { documentIds } = req.body;
      
      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({ error: 'Keine Dokument-IDs angegeben' });
      }

      // In einer realen App sollten wir den authentifizierten Benutzer verwenden
      const userId = req.session.userId || 1;

      // Dokumente abrufen und konvertieren
      const importedDocuments = [];
      
      for (const documentId of documentIds) {
        try {
          const uwaziDoc = await uwaziConnector.getDocument(documentId);
          
          // Konvertiere Uwazi-Dokument in das App-Format
          const appDocument = uwaziConnector.convertToAppDocument(uwaziDoc);
          
          // Prüfe, ob alle erforderlichen Felder vorhanden sind
          if (!appDocument.title || !appDocument.fileType || !appDocument.fileSize || !appDocument.filePath) {
            console.warn(`Dokument ${documentId} hat nicht alle erforderlichen Felder, wird übersprungen`);
            continue;
          }

          // Füge Benutzer-ID hinzu
          const documentWithUserId = {
            ...appDocument,
            userId
          } as {
            userId: number;
            title: string;
            fileType: string;
            fileSize: number;
            filePath: string;
            description?: string | null;
            source?: string;
            tags?: string[] | null;
          };
          
          // Speichere das Dokument in der App
          const savedDocument = await storage.createDocument(documentWithUserId);
          importedDocuments.push(savedDocument);

          // Erstelle eine Aktivität für den Import
          await storage.createActivity({
            userId,
            type: 'document_import',
            description: `Dokument "${savedDocument.title}" aus Uwazi importiert`,
            metadata: {
              documentId: savedDocument.id,
              source: 'uwazi',
              uwaziId: documentId // Verwende uwaziId statt sourceId
            }
          });
        } catch (docError) {
          console.error(`Fehler beim Importieren des Dokuments ${documentId}:`, docError);
        }
      }

      res.json(importedDocuments);
    } catch (error) {
      console.error('Fehler beim Importieren von Uwazi-Dokumenten:', error);
      res.status(500).json({ 
        error: 'Fehler beim Importieren von Uwazi-Dokumenten',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // Muster in Uwazi-Dokumenten analysieren
  app.post('/api/integrations/uwazi/analyze-patterns', async (req: Request, res: Response) => {
    try {
      // Prüfe, ob der Connector initialisiert ist
      if (!uwaziConnector || !uwaziConfig.connected) {
        uwaziConnector = await initializeUwaziConnector();
        if (!uwaziConnector) {
          return res.status(400).json({ error: 'Uwazi-Integration nicht konfiguriert' });
        }
      }

      const { documentIds } = req.body;
      
      if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
        return res.status(400).json({ 
          error: 'Mindestens zwei Dokument-IDs sind für die Mustererkennung erforderlich' 
        });
      }

      // Hier würden wir den UwaziKIAnalyzer verwenden, um Muster zu erkennen
      // Da dies komplex ist und Abhängigkeiten vom Gemini-Service hat, 
      // implementieren wir hier zunächst eine einfache Version ohne KI

      // Dokumente abrufen
      const documents = await Promise.all(
        documentIds.map(id => uwaziConnector!.getDocument(id))
      );

      // Einfache Mustererkennung basierend auf gemeinsamen Metadaten
      const commonMetadata: Record<string, any> = {};
      const metadataFrequency: Record<string, Record<string, number>> = {};

      // Sammle Metadaten-Schlüssel und Werte
      for (const doc of documents) {
        if (!doc.metadata) continue;

        for (const [key, value] of Object.entries(doc.metadata)) {
          if (!metadataFrequency[key]) {
            metadataFrequency[key] = {};
          }

          const strValue = JSON.stringify(value);
          metadataFrequency[key][strValue] = (metadataFrequency[key][strValue] || 0) + 1;
        }
      }

      // Finde gemeinsame Metadaten (wenn sie in mehr als 70% der Dokumente vorkommen)
      const threshold = Math.ceil(documents.length * 0.7);
      
      for (const [key, values] of Object.entries(metadataFrequency)) {
        for (const [value, count] of Object.entries(values)) {
          if (count >= threshold) {
            try {
              commonMetadata[key] = JSON.parse(value);
            } catch {
              commonMetadata[key] = value;
            }
          }
        }
      }

      // Erstelle eine einfache Antwort
      const result = {
        patternName: "Gemeinsame Metadaten-Muster",
        patternType: "Metadaten-Analyse",
        description: `Gemeinsame Metadatenelemente in ${documents.length} Dokumenten gefunden.`,
        documentIds: documentIds,
        geographicScope: commonMetadata.country || commonMetadata.location || {},
        temporalTrends: commonMetadata.date || {},
        relatedLaws: commonMetadata.legal_reference || "",
        recommendedActions: "Weitere manuelle Analyse empfohlen, um tiefere Zusammenhänge zu erkennen."
      };

      res.json(result);
    } catch (error) {
      console.error('Fehler bei der Uwazi-Mustererkennung:', error);
      res.status(500).json({ 
        error: 'Fehler bei der Uwazi-Mustererkennung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });
}
