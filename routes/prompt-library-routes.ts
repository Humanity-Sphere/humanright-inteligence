/**
 * Prompt-Bibliothek API-Routen
 * 
 * Diese Routen ermöglichen den Zugriff auf die Prompt-Bibliothek und
 * bieten Endpunkte zum Abrufen, Erstellen, Aktualisieren und Löschen
 * von Prompts.
 */

import { Router, Request, Response } from 'express';
import { getPromptLibraryService } from '../services/prompt-library-service';
import { insertPromptLibrarySchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();
const promptLibraryService = getPromptLibraryService();

// Schema für das Filtern von Prompts
const promptFilterSchema = z.object({
  query: z.string().optional(),
  roleType: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Schema für das Aktualisieren von Prompts
const updatePromptSchema = insertPromptLibrarySchema.partial();

// ---------- WICHTIG: Spezifische Routen vor den dynamischen Parameterrouten definieren ----------

// Alle Prompts abrufen
router.get('/', async (_req: Request, res: Response) => {
  try {
    console.log('Abrufen aller Prompts aus der Bibliothek...');
    const prompts = await promptLibraryService.getAllPrompts();
    if (!prompts || prompts.length === undefined) {
      console.log('Keine Prompts gefunden oder Fehler beim Abrufen');
      res.json([]);
    } else {
      console.log(`${prompts.length} Prompts erfolgreich abgerufen`);
      res.json(prompts);
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Prompts:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Prompts' });
  }
});

// Kategorien abrufen (muss vor /:id definiert werden)
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    console.log('Kategorien werden abgerufen...');
    const categories = await promptLibraryService.getCategories();
    console.log(`${categories.length} Kategorien gefunden`);
    res.json(categories);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kategorien:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kategorien' });
  }
});

// Rollen abrufen (muss vor /:id definiert werden)
router.get('/roles', async (_req: Request, res: Response) => {
  try {
    console.log('Rollen werden abgerufen...');
    const roles = await promptLibraryService.getRoles();
    console.log(`${roles.length} Rollen gefunden`);
    res.json(roles);
  } catch (error) {
    console.error('Fehler beim Abrufen der Rollen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Rollen' });
  }
});

// Prompts suchen (muss vor /:id definiert werden)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, roleType, category, tags } = promptFilterSchema.parse(req.query);
    
    const prompts = await promptLibraryService.searchPrompts({
      query,
      roleType,
      category,
      tags: tags || [],
    });

    res.json(prompts);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Suchparameter', details: error.errors });
    }

    console.error('Fehler bei der Suche nach Prompts:', error);
    res.status(500).json({ error: 'Fehler bei der Suche nach Prompts' });
  }
});

// Standardprompts initialisieren (muss vor /:id definiert werden)
router.post('/initialize', async (_req: Request, res: Response) => {
  try {
    await promptLibraryService.initializeDefaultPrompts();
    res.status(200).json({ message: 'Prompt-Bibliothek wurde erfolgreich initialisiert' });
  } catch (error) {
    console.error('Fehler bei der Initialisierung der Prompt-Bibliothek:', error);
    res.status(500).json({ error: 'Fehler bei der Initialisierung der Prompt-Bibliothek' });
  }
});

// ---------- Dynamische Parameterrouten nach den spezifischen Routen definieren ----------

// Einen neuen Prompt erstellen
router.post('/', async (req: Request, res: Response) => {
  try {
    const promptData = insertPromptLibrarySchema.parse(req.body);
    const newPrompt = await promptLibraryService.createPrompt(promptData);
    res.status(201).json(newPrompt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Prompt-Daten', details: error.errors });
    }

    console.error('Fehler beim Erstellen des Prompts:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Prompts' });
  }
});

// Einen Prompt nach ID abrufen - DIESE ROUTE MUSS NACH ALLEN SPEZIFISCHEN PFADEN KOMMEN
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }

    const prompt = await promptLibraryService.getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt nicht gefunden' });
    }

    res.json(prompt);
  } catch (error) {
    console.error('Fehler beim Abrufen des Prompts:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Prompts' });
  }
});

// Einen Prompt aktualisieren
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }

    const updateData = updatePromptSchema.parse(req.body);
    const updatedPrompt = await promptLibraryService.updatePrompt(id, updateData);

    if (!updatedPrompt) {
      return res.status(404).json({ error: 'Prompt nicht gefunden' });
    }

    res.json(updatedPrompt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Aktualisierungsdaten', details: error.errors });
    }

    console.error('Fehler beim Aktualisieren des Prompts:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Prompts' });
  }
});

// Einen Prompt löschen
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Ungültige ID' });
    }

    const success = await promptLibraryService.deletePrompt(id);
    if (!success) {
      return res.status(404).json({ error: 'Prompt nicht gefunden' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Fehler beim Löschen des Prompts:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Prompts' });
  }
});

export const promptLibraryRoutes = router;