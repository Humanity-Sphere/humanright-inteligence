/**
 * MCP-Routen (Model Context Protocol)
 * 
 * Diese Routen bieten Zugriff auf den MCP-Server über REST-API.
 */

import express from 'express';
import { mcpServer, initializeMCPServer, registerDefaultResources } from '../services/mcp-service';
import { getMultiAgentSystem } from '../services/multi-agent-system/multi-agent-system';

const router = express.Router();

// MCP-Server Status abrufen
router.get('/status', async (_req, res) => {
  try {
    const isRunning = mcpServer.isServerRunning();
    res.json({
      status: isRunning ? 'running' : 'stopped',
      resourceCount: Array.from(mcpServer['resources'].keys()).length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MCP-Server starten
router.post('/start', async (_req, res) => {
  try {
    if (mcpServer.isServerRunning()) {
      return res.json({ status: 'already_running', message: 'MCP-Server läuft bereits' });
    }
    
    await initializeMCPServer();
    // Standardressourcen registrieren
    registerDefaultResources();
    
    res.json({ 
      status: 'started', 
      message: 'MCP-Server erfolgreich gestartet' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MCP-Server stoppen
router.post('/stop', async (_req, res) => {
  try {
    if (!mcpServer.isServerRunning()) {
      return res.json({ status: 'already_stopped', message: 'MCP-Server läuft nicht' });
    }
    
    await mcpServer.stop();
    res.json({ 
      status: 'stopped', 
      message: 'MCP-Server erfolgreich gestoppt' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ressourcen auflisten
router.get('/resources', (_req, res) => {
  try {
    const resources = Array.from(mcpServer['resources'].values()).map(
      ({ id, type, name, description, metadata }) => ({
        id, type, name, description, metadata
      })
    );
    
    res.json({ resources });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ressource abrufen
router.get('/resources/:id', (req, res) => {
  try {
    const resourceId = req.params.id;
    const resource = mcpServer['resources'].get(resourceId);
    
    if (!resource) {
      return res.status(404).json({ error: 'Ressource nicht gefunden' });
    }
    
    res.json(resource);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Neue Ressource erstellen
router.post('/resources', (req, res) => {
  try {
    const { id, type, name, description, metadata, content } = req.body;
    
    if (!id || !type || !name) {
      return res.status(400).json({ error: 'ID, Typ und Name sind erforderlich' });
    }
    
    // Prüfen, ob die Ressource bereits existiert
    if (mcpServer['resources'].has(id)) {
      return res.status(409).json({ error: 'Eine Ressource mit dieser ID existiert bereits' });
    }
    
    mcpServer.registerResource({
      id,
      type: type as any,
      name,
      description: description || '',
      metadata: metadata || {},
      content
    });
    
    res.status(201).json({ 
      status: 'created', 
      message: 'Ressource erfolgreich erstellt',
      resourceId: id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ressource aktualisieren
router.put('/resources/:id', (req, res) => {
  try {
    const resourceId = req.params.id;
    const { name, description, metadata, content } = req.body;
    
    const resource = mcpServer['resources'].get(resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Ressource nicht gefunden' });
    }
    
    // Aktualisiere Ressource
    if (name) resource.name = name;
    if (description) resource.description = description;
    if (metadata) resource.metadata = { ...resource.metadata, ...metadata };
    if (content !== undefined) resource.content = content;
    
    mcpServer['resources'].set(resourceId, resource);
    
    res.json({ 
      status: 'updated', 
      message: 'Ressource erfolgreich aktualisiert' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ressource löschen
router.delete('/resources/:id', (req, res) => {
  try {
    const resourceId = req.params.id;
    
    if (!mcpServer['resources'].has(resourceId)) {
      return res.status(404).json({ error: 'Ressource nicht gefunden' });
    }
    
    const success = mcpServer.unregisterResource(resourceId);
    
    if (success) {
      res.json({ 
        status: 'deleted', 
        message: 'Ressource erfolgreich gelöscht' 
      });
    } else {
      res.status(500).json({ error: 'Fehler beim Löschen der Ressource' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Zugriffsprotokolle abrufen
router.get('/logs', (_req, res) => {
  try {
    const logs = mcpServer.getAccessLogs();
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Funktion registrieren
router.post('/functions', (req, res) => {
  try {
    const { id, name, description, handler } = req.body;
    
    if (!id || !name || !description) {
      return res.status(400).json({ error: 'ID, Name und Beschreibung sind erforderlich' });
    }
    
    // Handler-Code als String auswerten (nicht empfohlen für Produktion)
    let handlerFn;
    try {
      // eslint-disable-next-line no-eval
      handlerFn = eval(`(${handler})`);
      if (typeof handlerFn !== 'function') {
        return res.status(400).json({ error: 'Der Handler muss eine Funktion sein' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Ungültiger Handler-Code: ' + e.message });
    }
    
    mcpServer.registerFunction(id, name, description, handlerFn);
    
    res.status(201).json({ 
      status: 'created', 
      message: 'Funktion erfolgreich registriert',
      functionId: id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ressourcen suchen
router.get('/search', (req, res) => {
  try {
    const query = req.query.q as string;
    const type = req.query.type as string;
    
    if (!query) {
      return res.status(400).json({ error: 'Suchbegriff (q) ist erforderlich' });
    }
    
    // Ressourcen filtern
    const resources = Array.from(mcpServer['resources'].values())
      .filter(resource => {
        // Nach Typ filtern, wenn angegeben
        if (type && resource.type !== type) {
          return false;
        }
        
        // Nach Suchbegriff im Namen oder der Beschreibung suchen
        const q = query.toLowerCase();
        return (
          resource.name.toLowerCase().includes(q) ||
          resource.description.toLowerCase().includes(q)
        );
      })
      .map(({ id, type, name, description, metadata }) => ({
        id, type, name, description, metadata
      }));
    
    res.json({ resources });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MCP-Client-Konfiguration abrufen
router.get('/config', (_req, res) => {
  try {
    // Gib Konfigurationsinformationen für Clients zurück
    res.json({
      serverEndpoint: '/api/mcp',
      websocketEndpoint: 'ws://localhost:3333',
      apiVersion: '1.0.0',
      supportedResourceTypes: ['file', 'database', 'api', 'memory', 'function'],
      supportedActions: ['read', 'write', 'list', 'search', 'execute', 'analyze']
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sprachbefehl an das Multi-Agent-System weiterleiten
router.post('/voice-command', async (req, res) => {
  try {
    const { command, activationKeyword, userId = 'anonymous', languageCode = 'de-DE' } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Sprachbefehl ist erforderlich' });
    }
    
    console.log(`[MCP] Sprachbefehl erhalten: "${command}" (Aktiviert durch: "${activationKeyword}")`);
    
    // Multi-Agent-System abrufen
    const multiAgentSystem = getMultiAgentSystem();
    
    // Sicherstellen, dass das System initialisiert ist
    if (!multiAgentSystem.initialized) {
      return res.status(503).json({ 
        error: 'Multi-Agent-System ist nicht initialisiert',
        message: 'Das MCP-System muss zuerst initialisiert werden'
      });
    }
    
    // Sprachbefehl an das Multi-Agent-System weiterleiten
    const result = await multiAgentSystem.processVoiceCommand(command, userId, languageCode);
    
    res.json({
      status: 'success',
      workflowId: result.workflowId,
      response: result.response || 'Verarbeitung erfolgreich',
      intent: result.intent,
      confidence: result.confidence
    });
  } catch (error: any) {
    console.error('[MCP] Fehler bei der Verarbeitung des Sprachbefehls:', error);
    res.status(500).json({ 
      error: error.message,
      status: 'error',
      message: 'Fehler bei der Verarbeitung des Sprachbefehls'
    });
  }
});

export default router;