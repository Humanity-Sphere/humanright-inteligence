/**
 * Routen für die Verwaltung von KI-Agenten
 * Ermöglicht das Erstellen, Abrufen, Aktualisieren und Löschen von Agenten sowie deren Gedächtnis und Aufgaben
 */

import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import enhancedArchonAgent, { AgentConfig, AgentType } from '../services/enhanced-archon-agent';
import advancedMemory, { MemoryType } from '../services/advanced-memory';
import agentPlanner from '../services/agent-planner';
import logger from '../utils/logger';

const router = express.Router();

// Alle Agenten eines Benutzers abrufen
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agents = await enhancedArchonAgent.getUserAgents(userId);
    res.json(agents);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Agenten', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einen bestimmten Agenten abrufen
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    
    const agent = await enhancedArchonAgent.getAgent(userId, agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent nicht gefunden' });
    }
    
    res.json(agent);
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Agenten ${req.params.id}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einen neuen Agenten erstellen
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const config: AgentConfig = req.body;
    
    // Grundlegende Validierung
    if (!config.name || !config.type) {
      return res.status(400).json({ error: 'Name und Typ sind erforderlich' });
    }
    
    // Prüfen, ob der Typ gültig ist
    if (!Object.values(AgentType).includes(config.type)) {
      return res.status(400).json({ error: 'Ungültiger Agententyp' });
    }
    
    const agent = await enhancedArchonAgent.createAgent(userId, config);
    res.status(201).json(agent);
  } catch (error) {
    logger.error('Fehler beim Erstellen des Agenten', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einen Agenten aktualisieren
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    const updates: Partial<AgentConfig> = req.body;
    
    const updatedAgent = await enhancedArchonAgent.updateAgent(userId, agentId, updates);
    
    if (!updatedAgent) {
      return res.status(404).json({ error: 'Agent nicht gefunden' });
    }
    
    res.json(updatedAgent);
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren des Agenten ${req.params.id}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einen Agenten löschen
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    
    const success = await enhancedArchonAgent.deleteAgent(userId, agentId);
    
    if (!success) {
      return res.status(404).json({ error: 'Agent nicht gefunden' });
    }
    
    res.status(204).end();
  } catch (error) {
    logger.error(`Fehler beim Löschen des Agenten ${req.params.id}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einen Agenten aktivieren
router.post('/:id/activate', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    
    const agent = await enhancedArchonAgent.activateAgent(userId, agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent nicht gefunden' });
    }
    
    res.json(agent);
  } catch (error) {
    logger.error(`Fehler beim Aktivieren des Agenten ${req.params.id}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einen Agenten deaktivieren
router.post('/:id/deactivate', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    
    const agent = await enhancedArchonAgent.deactivateAgent(userId, agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent nicht gefunden' });
    }
    
    res.json(agent);
  } catch (error) {
    logger.error(`Fehler beim Deaktivieren des Agenten ${req.params.id}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Eine Aufgabe mit einem Agenten ausführen
router.post('/:id/execute', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    const { task, inputs = {} } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Aufgabe ist erforderlich' });
    }
    
    const result = await enhancedArchonAgent.executeTask(userId, agentId, task, inputs);
    res.json(result);
  } catch (error) {
    logger.error(`Fehler bei der Ausführung der Aufgabe für Agenten ${req.params.id}`, error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Interner Serverfehler' });
  }
});

// Gedächtnis eines Agenten abrufen
router.get('/:id/memory', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    const { query, type, tags, minImportance, limit } = req.query;
    
    // Prüfen, ob der Agent existiert
    const agent = await enhancedArchonAgent.getAgent(userId, agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent nicht gefunden' });
    }
    
    const memories = await advancedMemory.queryMemories({
      userId,
      agentId,
      query: query as string,
      type: type as MemoryType,
      tags: tags ? (tags as string).split(',') : undefined,
      minImportance: minImportance ? parseInt(minImportance as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(memories);
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Gedächtnisses für Agenten ${req.params.id}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Eine Erinnerung zum Gedächtnis eines Agenten hinzufügen
router.post('/:id/memory', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    const { content, type = MemoryType.SHORT_TERM, metadata = {} } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Inhalt ist erforderlich' });
    }
    
    // Prüfen, ob der Agent existiert
    const agent = await enhancedArchonAgent.getAgent(userId, agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent nicht gefunden' });
    }
    
    const memory = await advancedMemory.createMemory(userId, agentId, content, type as MemoryType, metadata);
    res.status(201).json(memory);
  } catch (error) {
    logger.error(`Fehler beim Hinzufügen einer Erinnerung für Agenten ${req.params.id}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Eine Erinnerung aus dem Gedächtnis eines Agenten löschen
router.delete('/:id/memory/:memoryId', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const memoryId = req.params.memoryId;
    
    const success = await advancedMemory.deleteMemory(userId, memoryId);
    
    if (!success) {
      return res.status(404).json({ error: 'Erinnerung nicht gefunden' });
    }
    
    res.status(204).end();
  } catch (error) {
    logger.error(`Fehler beim Löschen der Erinnerung ${req.params.memoryId}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Aktuelle Aufgaben eines Agenten abrufen
router.get('/:id/tasks', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const agentId = req.params.id;
    
    // Prüfen, ob der Agent existiert
    const agent = await enhancedArchonAgent.getAgent(userId, agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent nicht gefunden' });
    }
    
    // Hole den aktuellen Aufgabengraphen, falls vorhanden
    const currentGraph = agent.activeTaskGraphId 
      ? await enhancedArchonAgent.getCurrentTaskGraph(userId, agentId)
      : null;
    
    // Hole alle Aufgabengraphen des Agenten
    const allGraphs = await agentPlanner.getAgentTaskGraphs(userId, agentId);
    
    res.json({
      currentGraph,
      allGraphs
    });
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Aufgaben für Agenten ${req.params.id}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einen Aufgabengraphen für die Visualisierung abrufen
router.get('/:id/tasks/:graphId/visualization', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const graphId = req.params.graphId;
    
    const graph = await agentPlanner.getTaskGraph(graphId);
    
    if (!graph || graph.userId !== userId) {
      return res.status(404).json({ error: 'Aufgabengraph nicht gefunden' });
    }
    
    const visualization = agentPlanner.getGraphVisualization(graph);
    res.json(visualization);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Visualisierung für Aufgabengraph ${req.params.graphId}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einen Aufgabengraphen abbrechen
router.post('/:id/tasks/:graphId/cancel', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const graphId = req.params.graphId;
    
    const graph = await agentPlanner.getTaskGraph(graphId);
    
    if (!graph || graph.userId !== userId) {
      return res.status(404).json({ error: 'Aufgabengraph nicht gefunden' });
    }
    
    const cancelledGraph = await agentPlanner.cancelGraph(graphId);
    
    if (!cancelledGraph) {
      return res.status(400).json({ error: 'Aufgabengraph konnte nicht abgebrochen werden' });
    }
    
    res.json(cancelledGraph);
  } catch (error) {
    logger.error(`Fehler beim Abbrechen des Aufgabengraphen ${req.params.graphId}`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

export default router;