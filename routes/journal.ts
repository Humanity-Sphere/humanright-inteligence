/**
 * Journal-Routen für die Human Rights Intelligence App
 * 
 * Diese Routen ermöglichen das Erstellen, Abrufen und Verwalten von verschlüsselten
 * Tagebucheinträgen für Menschenrechtsverteidiger. Die Einträge werden sicher verschlüsselt
 * und sind nur für den erstellenden Benutzer zugänglich.
 */

import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { storage } from '../services/storage-factory';
import { encrypt, decrypt } from '../utils/encryption';

const router = express.Router();

/**
 * GET /api/journal
 * Holt alle Tagebucheinträge des aktuellen Benutzers
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Ihre Tagebucheinträge anzuzeigen'
      });
    }
    
    const entries = await storage.getJournalEntries({ userId });
    
    // Entschlüssele die Einträge, wenn vorhanden
    const decryptedEntries = entries.map(entry => {
      if (entry.encryptedContent) {
        try {
          const content = decrypt(entry.encryptedContent, userId.toString());
          return {
            ...entry,
            content,
            encryptedContent: undefined // Entferne verschlüsselte Version aus der Antwort
          };
        } catch (error) {
          console.error(`Fehler beim Entschlüsseln des Eintrags ${entry.id}:`, error);
          return {
            ...entry,
            content: '[Entschlüsselung fehlgeschlagen]',
            encryptedContent: undefined
          };
        }
      }
      return entry;
    });
    
    return res.status(200).json(decryptedEntries);
  } catch (error) {
    console.error('Fehler beim Abrufen der Tagebucheinträge:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Abrufen der Tagebucheinträge'
    });
  }
});

/**
 * GET /api/journal/:id
 * Holt einen bestimmten Tagebucheintrag des aktuellen Benutzers
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const entryId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Ihre Tagebucheinträge anzuzeigen'
      });
    }
    
    if (isNaN(entryId)) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Ungültige Eintrags-ID'
      });
    }
    
    const entry = await storage.getJournalEntry(entryId);
    
    if (!entry) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: 'Tagebucheintrag nicht gefunden'
      });
    }
    
    // Prüfe, ob der Eintrag dem aktuellen Benutzer gehört
    if (entry.userId !== userId) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert',
        message: 'Sie haben keinen Zugriff auf diesen Tagebucheintrag'
      });
    }
    
    // Entschlüssele den Eintrag
    if (entry.encryptedContent) {
      try {
        const content = decrypt(entry.encryptedContent, userId.toString());
        return res.status(200).json({
          ...entry,
          content,
          encryptedContent: undefined // Entferne verschlüsselte Version aus der Antwort
        });
      } catch (error) {
        console.error(`Fehler beim Entschlüsseln des Eintrags ${entry.id}:`, error);
        return res.status(500).json({ 
          error: 'Entschlüsselungsfehler', 
          message: 'Der Eintrag konnte nicht entschlüsselt werden'
        });
      }
    }
    
    return res.status(200).json(entry);
  } catch (error) {
    console.error('Fehler beim Abrufen des Tagebucheintrags:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Abrufen des Tagebucheintrags'
    });
  }
});

/**
 * POST /api/journal
 * Erstellt einen neuen Tagebucheintrag
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Tagebucheinträge zu erstellen'
      });
    }
    
    const { content, title, tags, moodIndicator } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Der Inhalt des Eintrags fehlt'
      });
    }
    
    // Verschlüssele den Inhalt
    const encryptedContent = encrypt(content, userId.toString());
    
    const newEntry = await storage.createJournalEntry({
      userId,
      title: title || 'Tagebucheintrag',
      encryptedContent,
      tags: tags || [],
      moodIndicator: moodIndicator || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return res.status(201).json({
      ...newEntry,
      content,
      encryptedContent: undefined // Entferne verschlüsselte Version aus der Antwort
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Tagebucheintrags:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Erstellen des Tagebucheintrags'
    });
  }
});

/**
 * PUT /api/journal/:id
 * Aktualisiert einen bestehenden Tagebucheintrag
 */
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const entryId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Tagebucheinträge zu aktualisieren'
      });
    }
    
    if (isNaN(entryId)) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Ungültige Eintrags-ID'
      });
    }
    
    const { content, title, tags, moodIndicator } = req.body;
    
    // Prüfe, ob der Eintrag existiert und dem Benutzer gehört
    const existingEntry = await storage.getJournalEntry(entryId);
    
    if (!existingEntry) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: 'Tagebucheintrag nicht gefunden'
      });
    }
    
    if (existingEntry.userId !== userId) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert',
        message: 'Sie haben keinen Zugriff auf diesen Tagebucheintrag'
      });
    }
    
    // Aktualisiere die Felder
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) {
      updateData.title = title;
    }
    
    if (tags !== undefined) {
      updateData.tags = tags;
    }
    
    if (moodIndicator !== undefined) {
      updateData.moodIndicator = moodIndicator;
    }
    
    if (content !== undefined) {
      updateData.encryptedContent = encrypt(content, userId.toString());
    }
    
    const updatedEntry = await storage.updateJournalEntry(entryId, updateData);
    
    // Entschlüssele den Inhalt für die Antwort
    let decryptedContent = null;
    if (updatedEntry?.encryptedContent) {
      try {
        decryptedContent = decrypt(updatedEntry.encryptedContent, userId.toString());
      } catch (error) {
        console.error(`Fehler beim Entschlüsseln des aktualisierten Eintrags ${entryId}:`, error);
      }
    }
    
    return res.status(200).json({
      ...updatedEntry,
      content: decryptedContent,
      encryptedContent: undefined // Entferne verschlüsselte Version aus der Antwort
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Tagebucheintrags:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Aktualisieren des Tagebucheintrags'
    });
  }
});

/**
 * DELETE /api/journal/:id
 * Löscht einen Tagebucheintrag
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const entryId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Tagebucheinträge zu löschen'
      });
    }
    
    if (isNaN(entryId)) {
      return res.status(400).json({ 
        error: 'Ungültige Anfrage',
        message: 'Ungültige Eintrags-ID'
      });
    }
    
    // Prüfe, ob der Eintrag existiert und dem Benutzer gehört
    const existingEntry = await storage.getJournalEntry(entryId);
    
    if (!existingEntry) {
      return res.status(404).json({ 
        error: 'Nicht gefunden',
        message: 'Tagebucheintrag nicht gefunden'
      });
    }
    
    if (existingEntry.userId !== userId) {
      return res.status(403).json({ 
        error: 'Zugriff verweigert',
        message: 'Sie haben keinen Zugriff auf diesen Tagebucheintrag'
      });
    }
    
    await storage.deleteJournalEntry(entryId);
    
    return res.status(200).json({ 
      success: true,
      message: 'Tagebucheintrag erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Tagebucheintrags:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Löschen des Tagebucheintrags'
    });
  }
});

/**
 * GET /api/journal/stats
 * Gibt Statistiken zu den Tagebucheinträgen des Benutzers zurück (ohne Inhalte)
 */
router.get('/stats/summary', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Nicht autorisiert',
        message: 'Sie müssen angemeldet sein, um Ihre Tagebuchstatistiken anzuzeigen'
      });
    }
    
    const entries = await storage.getJournalEntries({ userId });
    
    // Berechne einfache Statistiken
    const totalEntries = entries.length;
    
    // Gruppiere nach Datum (YYYY-MM-DD)
    const entriesByDate = entries.reduce((acc, entry) => {
      const dateKey = new Date(entry.createdAt as Date).toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Extraktion von Stimmungsdaten (falls vorhanden)
    const moodData = entries
      .filter(entry => entry.moodIndicator !== null && entry.moodIndicator !== undefined)
      .map(entry => ({
        date: new Date(entry.createdAt as Date).toISOString().split('T')[0],
        mood: entry.moodIndicator
      }));
    
    // Extrahiere alle verwendeten Tags
    const allTags = entries.reduce((tags, entry) => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      }
      return tags;
    }, {} as Record<string, number>);
    
    return res.status(200).json({
      totalEntries,
      entriesByDate,
      moodData,
      mostUsedTags: Object.entries(allTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      entryDates: entries.map(entry => ({
        id: entry.id,
        date: new Date(entry.createdAt as Date).toISOString(),
        title: entry.title
      }))
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Tagebuchstatistiken:', error);
    return res.status(500).json({ 
      error: 'Serverfehler', 
      message: 'Fehler beim Abrufen der Tagebuchstatistiken'
    });
  }
});

export default router;