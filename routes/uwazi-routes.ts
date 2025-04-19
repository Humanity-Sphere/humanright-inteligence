import { Router, Request, Response, NextFunction } from 'express';
import { createUwaziService } from '../services/uwazi-integration/uwazi-service';

/**
 * Initialisiert Uwazi API-Routen
 */
export function initUwaziRoutes(app: Router) {
  const uwaziRoutes = Router();
  const uwaziService = createUwaziService();

  // Middleware zur Fehlerbehandlung
  const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };

  // Dokumente abrufen
  uwaziRoutes.get('/documents', asyncHandler(async (req, res) => {
    const result = await uwaziService.fetchDocuments(req.query);
    res.json(result);
  }));

  // Einzelnes Dokument abrufen
  uwaziRoutes.get('/documents/:id', asyncHandler(async (req, res) => {
    const document = await uwaziService.fetchDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Dokument nicht gefunden' });
    }
    res.json(document);
  }));

  // Entitäten abrufen
  uwaziRoutes.get('/entities', asyncHandler(async (req, res) => {
    const result = await uwaziService.fetchEntities(req.query);
    res.json(result);
  }));

  // Entität erstellen
  uwaziRoutes.post('/entities', asyncHandler(async (req, res) => {
    const result = await uwaziService.createEntity(req.body);
    res.json(result);
  }));

  // Entität aktualisieren
  uwaziRoutes.put('/entities/:id', asyncHandler(async (req, res) => {
    const result = await uwaziService.updateEntity(req.params.id, req.body);
    res.json(result);
  }));

  // Entität löschen
  uwaziRoutes.delete('/entities/:id', asyncHandler(async (req, res) => {
    const result = await uwaziService.deleteEntity(req.params.id);
    res.json(result);
  }));

  // Suche
  uwaziRoutes.get('/search', asyncHandler(async (req, res) => {
    const query = req.query.q as string || '';
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
    const result = await uwaziService.search(query, filters);
    res.json(result);
  }));

  // Thesauri abrufen
  uwaziRoutes.get('/thesauri', asyncHandler(async (req, res) => {
    const result = await uwaziService.fetchThesauri();
    res.json(result);
  }));

  // Templates abrufen
  uwaziRoutes.get('/templates', asyncHandler(async (req, res) => {
    const result = await uwaziService.fetchTemplates();
    res.json(result);
  }));

  // Status der Uwazi-Verbindung prüfen
  uwaziRoutes.get('/status', asyncHandler(async (req, res) => {
    try {
      // Einfache Abfrage, um zu sehen, ob der Service erreichbar ist
      await uwaziService.fetchEntities({ limit: 1 });
      res.json({ status: 'ok', message: 'Verbindung zu Uwazi hergestellt' });
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: 'Keine Verbindung zu Uwazi möglich',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }));

  // Datei hochladen
  uwaziRoutes.post('/upload', asyncHandler(async (req, res) => {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }
    
    const file = req.files.file as any;
    const documentId = req.body.documentId;
    
    if (!documentId) {
      return res.status(400).json({ error: 'Keine Dokument-ID angegeben' });
    }
    
    // Temporäre Datei speichern
    const tempFilePath = `/tmp/${file.name}`;
    await file.mv(tempFilePath);
    
    const result = await uwaziService.uploadFile(documentId, tempFilePath, file.mimetype);
    res.json(result);
  }));

  // Routen registrieren
  app.use('/api/uwazi', uwaziRoutes);
  console.log('Uwazi API-Routen registriert');
}