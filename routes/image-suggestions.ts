import { Router } from 'express';
import { getImageSuggestionService } from '../services/image-suggestion-service';

const router = Router();
const imageSuggestionService = getImageSuggestionService();

/**
 * API-Endpunkt zum Vorschlagen von Bildern basierend auf Textinhalt
 * POST /api/image-suggestions
 */
router.post('/', async (req, res) => {
  try {
    const { content, context, documentType } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Inhalt (content) ist erforderlich' });
    }
    
    // Optional: Kontext und Dokumenttyp für bessere Vorschläge
    const contextInfo = [
      context || '',
      documentType || ''
    ].filter(Boolean).join(' ');
    
    const suggestions = await imageSuggestionService.suggestImagesForContent(
      content,
      contextInfo || undefined
    );
    
    res.json(suggestions);
  } catch (error) {
    console.error('Fehler bei Bildvorschlägen:', error);
    res.status(500).json({ 
      error: 'Fehler beim Generieren von Bildvorschlägen', 
      message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    });
  }
});

export default router;