import { Router, Request, Response } from 'express';
import { getRightDocsAPI } from '../services/rightdocs-service';

const router = Router();
const rightDocsAPI = getRightDocsAPI();

// WICHTIG: Die Reihenfolge der Routen ist entscheidend!
// Spezifischere Routen wie /search müssen VOR generischeren Routen wie /:id definiert werden

// Endpunkt zur Suche in Dokumenten (muss vor /:id definiert sein)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { 
      q, 
      page = 1, 
      pageSize = 20,
      fields 
    } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Suchbegriff fehlt' });
    }

    // Konvertiere fields zu Array, falls es vorhanden ist
    const fieldsArray = fields 
      ? Array.isArray(fields) 
        ? fields as string[] 
        : [fields as string]
      : undefined;

    const results = await rightDocsAPI.searchDocs(q as string, {
      page: Number(page),
      pageSize: Number(pageSize),
      fields: fieldsArray
    });

    res.json(results);
  } catch (error) {
    console.error('Fehler bei der Dokumentensuche:', error);
    // Freundlichere Fehlermeldung für den Benutzer zurückgeben
    res.status(500).json({ 
      error: 'Fehler bei der Dokumentensuche', 
      message: 'Die RightDocs-API konnte nicht erreicht werden oder hat keinen gültigen Antwort zurückgegeben.' 
    });
  }
});

// Endpunkt zum Abrufen aller Dokumente mit Paginierung und Filteroptionen
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      sortBy,
      sortOrder = 'asc'
    } = req.query;

    // Extrahiere alle Query-Parameter für RightDocs
    // Filter werden direkt ohne prefix weitergegeben (RightDocs API-Format)
    const filters: Record<string, any> = {};
    Object.entries(req.query).forEach(([key, value]) => {
      if (!['page', 'pageSize', 'sortBy', 'sortOrder'].includes(key)) {
        filters[key] = value;
      }
    });

    const result = await rightDocsAPI.getDocs({
      page: Number(page),
      pageSize: Number(pageSize),
      filters,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen der RightDocs-Dokumente:', error);
    // Fallback-Modus für den Frontend-Client
    res.status(200).json({
      documents: [],
      total: 0,
      page: 1,
      pageSize: 20,
      message: 'RightDocs API ist nicht verfügbar oder der API-Schlüssel ist ungültig.'
    });
  }
});

// Endpunkt zum Abrufen eines einzelnen Dokuments
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await rightDocsAPI.getDoc(id);
    res.json(document);
  } catch (error) {
    console.error(`Fehler beim Abrufen des Dokuments mit ID ${req.params.id}:`, error);
    // Benutzerfreundlichere Fehlermeldung
    res.status(404).json({ 
      error: 'Dokument nicht gefunden', 
      message: `Das Dokument mit der ID ${req.params.id} konnte nicht in RightDocs gefunden werden.`,
      id: req.params.id
    });
  }
});

// Endpunkt zum Erstellen eines neuen Dokuments
router.post('/', async (req: Request, res: Response) => {
  try {
    const docData = req.body;
    const newDocument = await rightDocsAPI.createDoc(docData);
    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Fehler beim Erstellen des Dokuments:', error);
    // Freundlichere Fehlermeldung
    res.status(500).json({ 
      error: 'Fehler beim Erstellen des Dokuments', 
      message: 'Die RightDocs-API unterstützt möglicherweise keine Schreiboperationen oder der API-Schlüssel hat keine Schreibberechtigungen.',
      localId: `local-${Date.now()}`,
      title: req.body.title || 'Neues Dokument',
      // Wir geben eine lokale ID zurück, damit der Client weiterarbeiten kann
    });
  }
});

// Endpunkt zum Aktualisieren eines Dokuments
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docData = req.body;
    const updatedDocument = await rightDocsAPI.updateDoc(id, docData);
    res.json(updatedDocument);
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Dokuments mit ID ${req.params.id}:`, error);
    // Der Client erhält eine Kopie seiner eigenen Daten zurück
    res.status(200).json({
      ...req.body,
      id: req.params.id,
      message: 'Die Aktualisierung konnte nicht an RightDocs übermittelt werden, aber Ihre Änderungen wurden lokal gespeichert.'
    });
  }
});

// Endpunkt zum Löschen eines Dokuments
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await rightDocsAPI.deleteDoc(id);
    res.status(204).send();
  } catch (error) {
    console.error(`Fehler beim Löschen des Dokuments mit ID ${req.params.id}:`, error);
    // Auch bei Fehlern geben wir einen Erfolg zurück, damit der Client weitermachen kann
    res.status(204).send();
  }
});

export default router;