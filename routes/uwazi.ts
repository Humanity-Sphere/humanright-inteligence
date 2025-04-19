import express, { Router, Request, Response, Express } from 'express';
import { getUwaziService, UwaziTenant, UwaziEntity, UwaziTemplate } from '../services/uwazi-service';

// Uwazi-Service Instanz
const uwaziService = getUwaziService();

// Router erstellen
const router = Router();

/**
 * Middleware zur Überprüfung der MongoDB-Verbindung
 */
async function checkMongoConnection(req: Request, res: Response, next: Function) {
  if (!uwaziService.isConnectedToMongo()) {
    try {
      const connected = await uwaziService.connect();
      if (!connected) {
        return res.status(503).json({ error: 'Keine Verbindung zur MongoDB möglich' });
      }
    } catch (error) {
      console.error('Fehler bei der Verbindung zur MongoDB:', error);
      return res.status(503).json({ error: 'Keine Verbindung zur MongoDB möglich' });
    }
  }
  next();
}

/**
 * Middleware zur Überprüfung und Festlegung des Mandanten
 */
async function checkAndSetTenant(req: Request, res: Response, next: Function) {
  try {
    // Mandanten-Header oder Query-Parameter überprüfen
    const tenantName = req.headers['tenant'] as string || req.query.tenant as string;
    
    if (!tenantName) {
      return res.status(400).json({ error: 'Kein Mandant angegeben' });
    }
    
    // Prüfen, ob Mandant existiert
    if (!uwaziService.tenantExists(tenantName)) {
      return res.status(404).json({ error: `Mandant '${tenantName}' nicht gefunden` });
    }
    
    // Mandanten wechseln
    await uwaziService.switchTenant(tenantName);
    next();
  } catch (error) {
    console.error('Fehler beim Wechseln des Mandanten:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}

/**
 * Mandanten auflisten
 * GET /api/uwazi/tenants
 */
router.get('/tenants', checkMongoConnection, async (req: Request, res: Response) => {
  try {
    const tenants = await uwaziService.listTenants();
    res.json({ tenants });
  } catch (error) {
    console.error('Fehler beim Auflisten der Mandanten:', error);
    res.status(500).json({ error: 'Fehler beim Auflisten der Mandanten' });
  }
});

/**
 * Mandanten erstellen
 * POST /api/uwazi/tenants
 */
router.post('/tenants', checkMongoConnection, async (req: Request, res: Response) => {
  try {
    const tenant = req.body as UwaziTenant;
    
    // Pflichtfelder prüfen
    if (!tenant.name || !tenant.dbName || !tenant.indexName) {
      return res.status(400).json({ error: 'Name, dbName und indexName sind erforderlich' });
    }
    
    const createdTenant = await uwaziService.createTenant(tenant);
    res.status(201).json(createdTenant);
  } catch (error: any) {
    console.error('Fehler beim Erstellen des Mandanten:', error);
    res.status(500).json({ error: error.message || 'Fehler beim Erstellen des Mandanten' });
  }
});

/**
 * Entitäten abrufen
 * GET /api/uwazi/entities
 */
router.get('/entities', [checkMongoConnection, checkAndSetTenant], async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
    const query = req.query.query ? JSON.parse(req.query.query as string) : {};
    
    const entities = await uwaziService.getEntities(query, limit, skip);
    const total = await uwaziService.countDocuments('entities', query);
    
    res.json({
      entities,
      total,
      limit,
      skip
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Entitäten:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Entitäten' });
  }
});

/**
 * Entität nach ID abrufen
 * GET /api/uwazi/entities/:id
 */
router.get('/entities/:id', [checkMongoConnection, checkAndSetTenant], async (req: Request, res: Response) => {
  try {
    const entityId = req.params.id;
    const entity = await uwaziService.getDocumentById<UwaziEntity>('entities', entityId);
    
    if (!entity) {
      return res.status(404).json({ error: `Entität mit ID '${entityId}' nicht gefunden` });
    }
    
    res.json(entity);
  } catch (error) {
    console.error(`Fehler beim Abrufen der Entität mit ID '${req.params.id}':`, error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Entität' });
  }
});

/**
 * Entität erstellen
 * POST /api/uwazi/entities
 */
router.post('/entities', [checkMongoConnection, checkAndSetTenant], async (req: Request, res: Response) => {
  try {
    const entity = req.body as UwaziEntity;
    
    // Pflichtfelder prüfen
    if (!entity.title || !entity.type) {
      return res.status(400).json({ error: 'Title und type sind erforderlich' });
    }
    
    // Standardwerte setzen
    if (entity.published === undefined) entity.published = true;
    if (!entity.language) entity.language = 'de';
    
    const createdEntity = await uwaziService.createDocument<UwaziEntity>('entities', entity);
    res.status(201).json(createdEntity);
  } catch (error) {
    console.error('Fehler beim Erstellen der Entität:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Entität' });
  }
});

/**
 * Entität aktualisieren
 * PATCH /api/uwazi/entities/:id
 */
router.patch('/entities/:id', [checkMongoConnection, checkAndSetTenant], async (req: Request, res: Response) => {
  try {
    const entityId = req.params.id;
    const update = req.body as Partial<UwaziEntity>;
    
    // Existenz prüfen
    const entity = await uwaziService.getDocumentById<UwaziEntity>('entities', entityId);
    if (!entity) {
      return res.status(404).json({ error: `Entität mit ID '${entityId}' nicht gefunden` });
    }
    
    const success = await uwaziService.updateDocument<UwaziEntity>('entities', entityId, update);
    
    if (success) {
      const updatedEntity = await uwaziService.getDocumentById<UwaziEntity>('entities', entityId);
      res.json(updatedEntity);
    } else {
      res.status(500).json({ error: 'Fehler beim Aktualisieren der Entität' });
    }
  } catch (error) {
    console.error(`Fehler beim Aktualisieren der Entität mit ID '${req.params.id}':`, error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Entität' });
  }
});

/**
 * Entität löschen
 * DELETE /api/uwazi/entities/:id
 */
router.delete('/entities/:id', [checkMongoConnection, checkAndSetTenant], async (req: Request, res: Response) => {
  try {
    const entityId = req.params.id;
    
    // Existenz prüfen
    const entity = await uwaziService.getDocumentById<UwaziEntity>('entities', entityId);
    if (!entity) {
      return res.status(404).json({ error: `Entität mit ID '${entityId}' nicht gefunden` });
    }
    
    const success = await uwaziService.deleteDocument('entities', entityId);
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Fehler beim Löschen der Entität' });
    }
  } catch (error) {
    console.error(`Fehler beim Löschen der Entität mit ID '${req.params.id}':`, error);
    res.status(500).json({ error: 'Fehler beim Löschen der Entität' });
  }
});

/**
 * Templates abrufen
 * GET /api/uwazi/templates
 */
router.get('/templates', [checkMongoConnection, checkAndSetTenant], async (req: Request, res: Response) => {
  try {
    const templates = await uwaziService.getTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Fehler beim Abrufen der Templates:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Templates' });
  }
});

/**
 * Template nach ID abrufen
 * GET /api/uwazi/templates/:id
 */
router.get('/templates/:id', [checkMongoConnection, checkAndSetTenant], async (req: Request, res: Response) => {
  try {
    const templateId = req.params.id;
    const template = await uwaziService.getDocumentById<UwaziTemplate>('templates', templateId);
    
    if (!template) {
      return res.status(404).json({ error: `Template mit ID '${templateId}' nicht gefunden` });
    }
    
    res.json(template);
  } catch (error) {
    console.error(`Fehler beim Abrufen des Templates mit ID '${req.params.id}':`, error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Templates' });
  }
});

/**
 * Dokumente aus beliebiger Collection abrufen (für fortgeschrittene Anwendungsfälle)
 * GET /api/uwazi/collections/:collection
 */
router.get('/collections/:collection', [checkMongoConnection, checkAndSetTenant], async (req: Request, res: Response) => {
  try {
    const collectionName = req.params.collection;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
    const query = req.query.query ? JSON.parse(req.query.query as string) : {};
    
    const documents = await uwaziService.getDocuments(collectionName, query, limit, skip);
    const total = await uwaziService.countDocuments(collectionName, query);
    
    res.json({
      documents,
      total,
      limit,
      skip
    });
  } catch (error) {
    console.error(`Fehler beim Abrufen der Dokumente aus '${req.params.collection}':`, error);
    res.status(500).json({ error: `Fehler beim Abrufen der Dokumente aus '${req.params.collection}'` });
  }
});

/**
 * Registriere Uwazi-Routen für die Express-App
 * @param app - Express-App
 */
export function registerUwaziRoutes(app: express.Application): void {
  app.use('/api/uwazi', router);
  console.log('Uwazi API-Routen registriert');
}

export default router;