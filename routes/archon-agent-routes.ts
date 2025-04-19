/**
 * Archon Agent Routes
 * 
 * Diese Routen bieten Zugang zu den Archon Agenten, die mit dem ArchonAgentFactory
 * erstellt und verwaltet werden.
 */

import { Router, Request, Response } from 'express';
import { archonAgentFactory, AgentRole, AgentRequest } from '../services/archon-agent-factory';

/**
 * Registriert die Archon Agent API-Routen
 */
export function registerArchonAgentRoutes(): Router {
  const router = Router();

  /**
   * GET /api/archon-agents
   * Gibt eine Liste aller Archon Agenten zurück
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const agents = archonAgentFactory.getAllAgents();
      
      // Sensible Informationen ausblenden
      const sanitizedAgents = agents.map(agent => ({
        id: agent.id,
        name: agent.config.name,
        role: agent.config.role,
        description: agent.config.description,
        state: agent.state,
        createdAt: agent.createdAt,
        lastActive: agent.lastActive,
        requestCount: agent.requestCount,
        successRate: agent.successRate,
        toolCount: agent.config.tools?.length || 0,
        processingTime: agent.processingTime
      }));
      
      res.json({
        success: true,
        agents: sanitizedAgents
      });
    } catch (error) {
      console.error('Error getting Archon agents:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get agents: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * GET /api/archon-agents/:id
   * Gibt einen bestimmten Archon Agenten zurück
   */
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const agent = archonAgentFactory.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: `Agent with ID ${id} not found`
        });
      }
      
      // Sensible Informationen ausblenden
      const sanitizedAgent = {
        id: agent.id,
        name: agent.config.name,
        role: agent.config.role,
        description: agent.config.description,
        state: agent.state,
        createdAt: agent.createdAt,
        lastActive: agent.lastActive,
        requestCount: agent.requestCount,
        successRate: agent.successRate,
        tools: agent.config.tools?.map(tool => ({
          name: tool.name,
          description: tool.description
        })) || [],
        memoryCount: agent.getMemory().length,
        processingTime: agent.processingTime,
        autonomyLevel: agent.config.autonomyLevel || 'medium'
      };
      
      res.json({
        success: true,
        agent: sanitizedAgent
      });
    } catch (error) {
      console.error('Error getting Archon agent:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get agent: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon-agents
   * Erstellt einen neuen Archon Agenten
   */
  router.post('/', (req: Request, res: Response) => {
    try {
      const agentConfig = req.body;
      
      if (!agentConfig || !agentConfig.role) {
        return res.status(400).json({
          success: false,
          error: 'Agent role is required'
        });
      }
      
      // Validiere, dass die Rolle gültig ist
      if (!Object.values(AgentRole).includes(agentConfig.role)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent role: ${agentConfig.role}. Valid roles: ${Object.values(AgentRole).join(', ')}`
        });
      }
      
      const agent = archonAgentFactory.createAgent(agentConfig);
      
      // Sensible Informationen ausblenden
      const sanitizedAgent = {
        id: agent.id,
        name: agent.config.name,
        role: agent.config.role,
        description: agent.config.description,
        state: agent.state,
        createdAt: agent.createdAt
      };
      
      res.status(201).json({
        success: true,
        agent: sanitizedAgent
      });
    } catch (error) {
      console.error('Error creating Archon agent:', error);
      res.status(500).json({
        success: false,
        error: `Failed to create agent: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * DELETE /api/archon-agents/:id
   * Löscht einen Archon Agenten
   */
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = archonAgentFactory.deleteAgent(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: `Agent with ID ${id} not found`
        });
      }
      
      res.json({
        success: true,
        message: `Agent with ID ${id} deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting Archon agent:', error);
      res.status(500).json({
        success: false,
        error: `Failed to delete agent: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon-agents/:id/execute
   * Führt eine Anfrage an einen Archon Agenten aus
   */
  router.post('/:id/execute', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request: AgentRequest = req.body;
      
      if (!request || !request.input) {
        return res.status(400).json({
          success: false,
          error: 'Request input is required'
        });
      }
      
      const agent = archonAgentFactory.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: `Agent with ID ${id} not found`
        });
      }
      
      const response = await agent.execute(request);
      
      res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Error executing Archon agent:', error);
      res.status(500).json({
        success: false,
        error: `Failed to execute agent: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * GET /api/archon-agents/:id/memory
   * Gibt die Erinnerungen eines Archon Agenten zurück
   */
  router.get('/:id/memory', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const agent = archonAgentFactory.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: `Agent with ID ${id} not found`
        });
      }
      
      const memory = agent.getMemory();
      
      res.json({
        success: true,
        memory
      });
    } catch (error) {
      console.error('Error getting Archon agent memory:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get agent memory: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * POST /api/archon-agents/:id/memory/reset
   * Setzt die Erinnerungen eines Archon Agenten zurück
   */
  router.post('/:id/memory/reset', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const agent = archonAgentFactory.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: `Agent with ID ${id} not found`
        });
      }
      
      agent.resetMemory();
      
      res.json({
        success: true,
        message: `Memory of agent with ID ${id} reset successfully`
      });
    } catch (error) {
      console.error('Error resetting Archon agent memory:', error);
      res.status(500).json({
        success: false,
        error: `Failed to reset agent memory: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * GET /api/archon-agents/by-role/:role
   * Gibt alle Archon Agenten mit einer bestimmten Rolle zurück
   */
  router.get('/by-role/:role', (req: Request, res: Response) => {
    try {
      const { role } = req.params;
      
      // Validiere, dass die Rolle gültig ist
      if (!Object.values(AgentRole).includes(role as AgentRole)) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent role: ${role}. Valid roles: ${Object.values(AgentRole).join(', ')}`
        });
      }
      
      const agents = archonAgentFactory.getAgentsByRole(role as AgentRole);
      
      // Sensible Informationen ausblenden
      const sanitizedAgents = agents.map(agent => ({
        id: agent.id,
        name: agent.config.name,
        description: agent.config.description,
        state: agent.state,
        createdAt: agent.createdAt,
        lastActive: agent.lastActive,
        requestCount: agent.requestCount,
        successRate: agent.successRate
      }));
      
      res.json({
        success: true,
        agents: sanitizedAgents
      });
    } catch (error) {
      console.error('Error getting Archon agents by role:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get agents by role: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * PATCH /api/archon-agents/:id
   * Aktualisiert die Konfiguration eines Archon Agenten
   */
  router.patch('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedConfig = req.body;
      
      const agent = archonAgentFactory.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: `Agent with ID ${id} not found`
        });
      }
      
      agent.updateConfig(updatedConfig);
      
      // Sensible Informationen ausblenden
      const sanitizedAgent = {
        id: agent.id,
        name: agent.config.name,
        role: agent.config.role,
        description: agent.config.description,
        state: agent.state,
        toolCount: agent.config.tools?.length || 0,
        autonomyLevel: agent.config.autonomyLevel || 'medium'
      };
      
      res.json({
        success: true,
        agent: sanitizedAgent
      });
    } catch (error) {
      console.error('Error updating Archon agent:', error);
      res.status(500).json({
        success: false,
        error: `Failed to update agent: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  /**
   * GET /api/archon-agents/status
   * Gibt den Status der Archon Agent Factory zurück
   */
  router.get('/status/info', (req: Request, res: Response) => {
    try {
      const status = archonAgentFactory.getStatus();
      
      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error getting Archon agent factory status:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  return router;
}

// Exportiere die Router-Funktion
export default registerArchonAgentRoutes;