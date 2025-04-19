import express, { Request, Response, Router } from 'express';
import { Neo4jService } from '../services/neo4j-service';

/**
 * Router für Neo4j-Datenbankoperationen
 */
const router: Router = express.Router();
const neo4jService = new Neo4jService();

/**
 * Verbindungsstatus mit Neo4j Datenbank prüfen
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConnected = await neo4jService.testConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error checking Neo4j connection status:', error);
    res.status(500).json({ error: 'Fehler bei der Verbindung zur Neo4j-Datenbank' });
  }
});

/**
 * Alle Fälle abrufen
 */
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const cases = await neo4jService.getAllCases();
    res.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Fälle' });
  }
});

/**
 * Einen Fall anhand der ID abrufen
 */
router.get('/case/:id', async (req: Request, res: Response) => {
  try {
    const caseId = req.params.id;
    const caseData = await neo4jService.getCaseById(caseId);
    
    if (!caseData) {
      return res.status(404).json({ error: 'Fall nicht gefunden' });
    }
    
    res.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Falls' });
  }
});

/**
 * Neuen Fall erstellen
 */
router.post('/case', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }
    
    const newCase = await neo4jService.createCase({ name, description, createdAt: new Date().toISOString() });
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Falls' });
  }
});

/**
 * Fall aktualisieren
 */
router.put('/case/:id', async (req: Request, res: Response) => {
  try {
    const caseId = req.params.id;
    const { name, description } = req.body;
    
    const updatedCase = await neo4jService.updateCase(caseId, { name, description });
    
    if (!updatedCase) {
      return res.status(404).json({ error: 'Fall nicht gefunden' });
    }
    
    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Falls' });
  }
});

/**
 * Fall löschen
 */
router.delete('/case/:id', async (req: Request, res: Response) => {
  try {
    const caseId = req.params.id;
    const success = await neo4jService.deleteCase(caseId);
    
    if (!success) {
      return res.status(404).json({ error: 'Fall nicht gefunden' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Falls' });
  }
});

/**
 * Graph-Daten für einen Fall abrufen
 */
router.get('/case-graph/:caseId', async (req: Request, res: Response) => {
  try {
    const caseId = req.params.caseId;
    const graphData = await neo4jService.getCaseGraphData(caseId);
    res.json(graphData);
  } catch (error) {
    console.error('Error fetching case graph data:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Graph-Daten' });
  }
});

/**
 * Knoten-Details abrufen
 */
router.get('/node/:id', async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.id;
    const node = await neo4jService.getNodeById(nodeId);
    
    if (!node) {
      return res.status(404).json({ error: 'Knoten nicht gefunden' });
    }
    
    res.json(node);
  } catch (error) {
    console.error('Error fetching node:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Knotens' });
  }
});

/**
 * Neuen Knoten erstellen
 */
router.post('/node', async (req: Request, res: Response) => {
  try {
    const { caseId, label, properties } = req.body;
    
    if (!caseId || !label) {
      return res.status(400).json({ error: 'CaseId und Label sind erforderlich' });
    }
    
    const newNode = await neo4jService.createNode(caseId, label, properties || {});
    res.status(201).json(newNode);
  } catch (error) {
    console.error('Error creating node:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Knotens' });
  }
});

/**
 * Knoten aktualisieren
 */
router.put('/node/:id', async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.id;
    const { properties } = req.body;
    
    const updatedNode = await neo4jService.updateNode(nodeId, properties || {});
    
    if (!updatedNode) {
      return res.status(404).json({ error: 'Knoten nicht gefunden' });
    }
    
    res.json(updatedNode);
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Knotens' });
  }
});

/**
 * Knoten löschen
 */
router.delete('/node/:id', async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.id;
    const success = await neo4jService.deleteNode(nodeId);
    
    if (!success) {
      return res.status(404).json({ error: 'Knoten nicht gefunden' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Knotens' });
  }
});

/**
 * Neue Beziehung erstellen
 */
router.post('/relationship', async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId, type, properties } = req.body;
    
    if (!sourceId || !targetId || !type) {
      return res.status(400).json({ error: 'SourceId, TargetId und Type sind erforderlich' });
    }
    
    const newRelationship = await neo4jService.createRelationship(sourceId, targetId, type, properties || {});
    res.status(201).json(newRelationship);
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Beziehung' });
  }
});

/**
 * Beziehung löschen
 */
router.delete('/relationship/:id', async (req: Request, res: Response) => {
  try {
    const relationshipId = req.params.id;
    const success = await neo4jService.deleteRelationship(relationshipId);
    
    if (!success) {
      return res.status(404).json({ error: 'Beziehung nicht gefunden' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Beziehung' });
  }
});

/**
 * Ähnliche Entitäten suchen
 */
router.get('/similar-entities/:entityName', async (req: Request, res: Response) => {
  try {
    const entityName = req.params.entityName;
    const minSimilarity = parseFloat(req.query.minSimilarity as string) || 0.7;
    
    const similarEntities = await neo4jService.findSimilarEntities(entityName, minSimilarity);
    res.json(similarEntities);
  } catch (error) {
    console.error('Error finding similar entities:', error);
    res.status(500).json({ error: 'Fehler bei der Suche nach ähnlichen Entitäten' });
  }
});

/**
 * Pfad zwischen zwei Knoten finden
 */
router.get('/path/:sourceId/:targetId', async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId } = req.params;
    const maxDepth = parseInt(req.query.maxDepth as string) || 3;
    
    const path = await neo4jService.findPathBetweenNodes(sourceId, targetId, maxDepth);
    res.json(path);
  } catch (error) {
    console.error('Error finding path between nodes:', error);
    res.status(500).json({ error: 'Fehler bei der Suche nach dem Pfad zwischen Knoten' });
  }
});

/**
 * Statistiken für einen Fall abrufen
 */
router.get('/statistics/:caseId', async (req: Request, res: Response) => {
  try {
    const caseId = req.params.caseId;
    const statistics = await neo4jService.getCaseStatistics(caseId);
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching case statistics:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Fallstatistiken' });
  }
});

export default router;