// server/routes/ohchr-routes.ts
import { Request, Response, Router } from 'express';
import { ohchrService } from '../services/ohchr-service';

const router = Router();

// Alle OHCHR-Ressourcen abrufen
router.get("/resources", async (_req: Request, res: Response) => {
  try {
    const resources = await ohchrService.getAllResources();
    res.status(200).json(resources);
  } catch (error) {
    console.error("[OHCHR Routes] Fehler beim Abrufen der Ressourcen:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der OHCHR-Ressourcen" });
  }
});

// Eine bestimmte OHCHR-Ressource nach ID abrufen
router.get("/resources/:id", async (req: Request, res: Response) => {
  try {
    const resource = await ohchrService.getResourceById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: `Ressource mit ID ${req.params.id} nicht gefunden` });
    }
    
    res.status(200).json(resource);
  } catch (error) {
    console.error(`[OHCHR Routes] Fehler beim Abrufen der Ressource ${req.params.id}:`, error);
    res.status(500).json({ error: "Fehler beim Abrufen der OHCHR-Ressource" });
  }
});

// Dokumente in OHCHR-Ressourcen suchen
router.get("/search", async (req: Request, res: Response) => {
  try {
    const {
      q = '',             // Suchanfrage
      resourceId,         // Optional: ID einer bestimmten Ressource
      limit = 20,         // Standardmäßig maximal 20 Ergebnisse
      offset = 0,         // Standardmäßig vom Anfang beginnen
      language,           // Optional: Sprachfilter
      dateFrom,           // Optional: Datum von
      dateTo              // Optional: Datum bis
    } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Suchanfrage (q) ist erforderlich" });
    }
    
    const documents = await ohchrService.searchDocuments({
      query: q as string,
      resourceId: resourceId as string | undefined,
      limit: Number(limit),
      offset: Number(offset),
      language: language as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined
    });
    
    res.status(200).json({
      total: documents.length,
      offset: Number(offset),
      limit: Number(limit),
      results: documents
    });
  } catch (error) {
    console.error("[OHCHR Routes] Fehler bei der Dokumentensuche:", error);
    res.status(500).json({ error: "Fehler bei der Suche in OHCHR-Dokumenten" });
  }
});

// Ein bestimmtes Dokument nach ID abrufen
router.get("/documents/:id", async (req: Request, res: Response) => {
  try {
    const document = await ohchrService.getDocumentById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: `Dokument mit ID ${req.params.id} nicht gefunden` });
    }
    
    res.status(200).json(document);
  } catch (error) {
    console.error(`[OHCHR Routes] Fehler beim Abrufen des Dokuments ${req.params.id}:`, error);
    res.status(500).json({ error: "Fehler beim Abrufen des OHCHR-Dokuments" });
  }
});

export default router;