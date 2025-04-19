/**
 * Routen für das Wissensmanagement-System
 * 
 * Diese Routen ermöglichen den Zugriff auf die Wissensdatenbank für KI-Agenten und
 * bieten Funktionen zum Erstellen, Abrufen und Aktualisieren von Wissen.
 */
import express from 'express';
import { z } from 'zod';
import { knowledgeManagement } from '../services/knowledge-management';
import { isAuthenticated, isAdmin } from '../middleware/auth';

// Hilfsfunktion zur sicheren Extraktion der Benutzer-ID
function getUserId(user: any): number | undefined {
  if (user && typeof user === 'object' && 'id' in user) {
    return user.id;
  }
  return undefined;
}

const router = express.Router();

// Validierungsschemas
const createKnowledgeBaseSchema = z.object({
  category: z.string(),
  name: z.string(),
  content: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  usage: z.string().optional(),
  priority: z.number().min(1).max(10).optional(),
  aiAgentType: z.array(z.string()).optional(),
});

const createPromptSchema = z.object({
  type: z.string(),
  name: z.string(),
  prompt: z.string(),
  systemMessage: z.string().optional(),
  description: z.string().optional(),
  parameters: z.any().optional(),
  examples: z.any().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  aiModels: z.array(z.string()).optional(),
});

const createDomainKnowledgeSchema = z.object({
  domain: z.string(),
  concept: z.string(),
  definition: z.string(),
  subDomain: z.string().optional(),
  explanation: z.string().optional(),
  examples: z.any().optional(),
  relatedConcepts: z.array(z.string()).optional(),
  sources: z.any().optional(),
  importance: z.number().min(1).max(10).optional(),
  complexity: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
});

const createKnowledgeContextSchema = z.object({
  title: z.string(),
  type: z.string(),
  content: z.string(),
  keywords: z.array(z.string()).optional(),
  source: z.string().optional(),
  sourceName: z.string().optional(),
  sourceType: z.string().optional(),
  geographicScope: z.string().optional(),
  jurisdiction: z.string().optional(),
  humanRightsDomains: z.array(z.string()).optional(),
  relatedEntities: z.array(z.string()).optional(),
  contentQuality: z.number().min(0).max(100).optional(),
});

// Routen für den KI-Zugriff (ohne Authentifizierung)
router.get('/ai/knowledge/search', async (req, res) => {
  try {
    const { query, agentType } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Suchanfrage ist erforderlich' });
    }

    const results = await knowledgeManagement.searchKnowledgeBase(
      query, 
      typeof agentType === 'string' ? agentType : undefined
    );
    res.json(results);
  } catch (error) {
    console.error('Fehler bei der Wissensbasis-Suche:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.get('/ai/prompts/search', async (req, res) => {
  try {
    const { query, type } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Suchanfrage ist erforderlich' });
    }

    const results = await knowledgeManagement.searchPrompts(
      query, 
      typeof type === 'string' ? type : undefined
    );
    res.json(results);
  } catch (error) {
    console.error('Fehler bei der Prompt-Suche:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.get('/ai/knowledge/domain/search', async (req, res) => {
  try {
    const { query, domain } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Suchanfrage ist erforderlich' });
    }

    const results = await knowledgeManagement.searchDomainKnowledge(
      query, 
      typeof domain === 'string' ? domain : undefined
    );
    res.json(results);
  } catch (error) {
    console.error('Fehler bei der Domänenwissen-Suche:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.get('/ai/prompts/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const results = await knowledgeManagement.getPromptsByType(type);
    res.json(results);
  } catch (error) {
    console.error('Fehler beim Abrufen von Prompts nach Typ:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.get('/ai/knowledge/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const results = await knowledgeManagement.getKnowledgeByCategory(category);
    res.json(results);
  } catch (error) {
    console.error('Fehler beim Abrufen von Wissen nach Kategorie:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.get('/ai/knowledge/domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const results = await knowledgeManagement.getDomainKnowledgeByDomain(domain);
    res.json(results);
  } catch (error) {
    console.error('Fehler beim Abrufen von Domänenwissen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Erfolgsraten und Effektivität aktualisieren (Feedback-Mechanismus)
router.post('/ai/prompts/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { modelName, success } = req.body;

    if (!modelName || typeof success !== 'boolean') {
      return res.status(400).json({ error: 'Modellname und Erfolgsstatus sind erforderlich' });
    }

    await knowledgeManagement.updatePromptSuccessRate(parseInt(id), modelName, success);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Prompt-Erfolgsrate:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.post('/ai/knowledge/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { effectiveness } = req.body;

    if (typeof effectiveness !== 'number' || effectiveness < 0 || effectiveness > 100) {
      return res.status(400).json({ error: 'Effektivität muss eine Zahl zwischen 0 und 100 sein' });
    }

    await knowledgeManagement.updateKnowledgeEffectiveness(parseInt(id), effectiveness);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Wissenseffektivität:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Geschützte Routen (nur für authentifizierte Benutzer)
router.post(
  '/knowledge-base',
  isAuthenticated,
  async (req, res) => {
    try {
      // Validierung manuell durchführen
      const validationResult = createKnowledgeBaseSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Ungültige Daten', details: validationResult.error });
      }
      
      const userId = getUserId(req.user);
      const entry = await knowledgeManagement.createKnowledgeBaseEntry({
        ...req.body,
        userId
      });
      res.status(201).json(entry);
    } catch (error) {
      console.error('Fehler beim Erstellen eines Wissensbankeintrags:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

router.post(
  '/prompts',
  isAuthenticated,
  async (req, res) => {
    try {
      // Validierung manuell durchführen
      const validationResult = createPromptSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Ungültige Daten', details: validationResult.error });
      }
      
      const userId = getUserId(req.user);
      const prompt = await knowledgeManagement.createPrompt({
        ...req.body,
        userId
      });
      res.status(201).json(prompt);
    } catch (error) {
      console.error('Fehler beim Erstellen eines Prompts:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

router.post(
  '/domain-knowledge',
  isAuthenticated,
  async (req, res) => {
    try {
      // Validierung manuell durchführen
      const validationResult = createDomainKnowledgeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Ungültige Daten', details: validationResult.error });
      }
      
      const userId = getUserId(req.user);
      const knowledge = await knowledgeManagement.createDomainKnowledge({
        ...req.body,
        userId
      });
      res.status(201).json(knowledge);
    } catch (error) {
      console.error('Fehler beim Erstellen von Domänenwissen:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

router.post(
  '/knowledge-contexts',
  isAuthenticated,
  async (req, res) => {
    try {
      // Validierung manuell durchführen
      const validationResult = createKnowledgeContextSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Ungültige Daten', details: validationResult.error });
      }
      
      const userId = getUserId(req.user);
      const context = await knowledgeManagement.createKnowledgeContext({
        ...req.body,
        userId
      });
      res.status(201).json(context);
    } catch (error) {
      console.error('Fehler beim Erstellen eines Wissenskontexts:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

// Löschrouten (nur für Admin-Benutzer)
router.delete(
  '/knowledge-base/:id',
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const success = await knowledgeManagement.deleteKnowledgeBaseEntry(parseInt(id));
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Eintrag nicht gefunden' });
      }
    } catch (error) {
      console.error('Fehler beim Löschen eines Wissensbankeintrags:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

router.delete(
  '/prompts/:id',
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const success = await knowledgeManagement.deletePrompt(parseInt(id));
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Prompt nicht gefunden' });
      }
    } catch (error) {
      console.error('Fehler beim Löschen eines Prompts:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

export default router;