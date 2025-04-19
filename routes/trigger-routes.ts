import express from "express";
import { TriggerController } from "../controllers/trigger-controller";
import { z } from "zod";
import {
  insertContentTriggerSchema,
  insertContentRecommendationSchema,
} from "../../shared/schema";
import {
  ContextEvent,
  RecommendationPriority,
  RecommendationType,
  ContextType
} from "../../shared/types/trigger-recommendations";

const router = express.Router();
const triggerController = new TriggerController();

/**
 * GET /api/triggers
 * Holt alle Trigger
 */
router.get("/", async (req, res) => {
  try {
    const triggers = await triggerController.getAllTriggers();
    res.json(triggers);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Abrufen aller Trigger:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Trigger" });
  }
});

/**
 * GET /api/triggers/:id
 * Holt einen Trigger mit seinen Empfehlungen
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Ungültige Trigger-ID" });
    }

    const result = await triggerController.getTriggerWithRecommendations(id);
    if (!result.trigger) {
      return res.status(404).json({ error: "Trigger nicht gefunden" });
    }

    res.json(result);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Abrufen des Triggers:", error);
    res.status(500).json({ error: "Fehler beim Abrufen des Triggers" });
  }
});

/**
 * POST /api/triggers
 * Erstellt einen neuen Trigger
 */
router.post("/", async (req, res) => {
  try {
    // Validiere die Anfrage
    const validationResult = insertContentTriggerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Ungültige Daten für den Trigger",
        details: validationResult.error.format(),
      });
    }

    // Authentifizierter Benutzer
    const userId = req.user?.id || null;

    // Erstelle den Trigger
    const data = validationResult.data;
    
    // Optional: Setze createdBy auf aktuelle Benutzer-ID wenn nicht angegeben
    if (!data.createdBy && userId) {
      data.createdBy = userId;
    }

    const trigger = await triggerController.createTrigger(data);
    if (!trigger) {
      return res.status(500).json({ error: "Fehler beim Erstellen des Triggers" });
    }

    res.status(201).json(trigger);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Erstellen des Triggers:", error);
    res.status(500).json({ error: "Fehler beim Erstellen des Triggers" });
  }
});

/**
 * PUT /api/triggers/:id
 * Aktualisiert einen Trigger
 */
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Ungültige Trigger-ID" });
    }

    // Validiere die Anfrage (erlaubt partielle Updates)
    const updateSchema = insertContentTriggerSchema.partial();
    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Ungültige Daten für den Trigger",
        details: validationResult.error.format(),
      });
    }

    const success = await triggerController.updateTrigger(id, validationResult.data);
    if (!success) {
      return res.status(404).json({ error: "Trigger nicht gefunden" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Aktualisieren des Triggers:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren des Triggers" });
  }
});

/**
 * DELETE /api/triggers/:id
 * Löscht einen Trigger
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Ungültige Trigger-ID" });
    }

    const success = await triggerController.deleteTrigger(id);
    if (!success) {
      return res.status(404).json({ error: "Trigger nicht gefunden" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Löschen des Triggers:", error);
    res.status(500).json({ error: "Fehler beim Löschen des Triggers" });
  }
});

/**
 * POST /api/triggers/:id/recommendations
 * Erstellt eine neue Empfehlung für einen Trigger
 */
router.post("/:id/recommendations", async (req, res) => {
  try {
    const triggerId = parseInt(req.params.id);
    if (isNaN(triggerId)) {
      return res.status(400).json({ error: "Ungültige Trigger-ID" });
    }

    // Validiere die Anfrage
    const validationResult = insertContentRecommendationSchema.safeParse({
      ...req.body,
      triggerId,
    });

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Ungültige Daten für die Empfehlung",
        details: validationResult.error.format(),
      });
    }

    const recommendation = await triggerController.createRecommendation(validationResult.data);
    if (!recommendation) {
      return res.status(500).json({ error: "Fehler beim Erstellen der Empfehlung" });
    }

    res.status(201).json(recommendation);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Erstellen der Empfehlung:", error);
    res.status(500).json({ error: "Fehler beim Erstellen der Empfehlung" });
  }
});

/**
 * PUT /api/triggers/recommendations/:id
 * Aktualisiert eine Empfehlung
 */
router.put("/recommendations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Ungültige Empfehlungs-ID" });
    }

    // Validiere die Anfrage (erlaubt partielle Updates)
    const updateSchema = insertContentRecommendationSchema.partial();
    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Ungültige Daten für die Empfehlung",
        details: validationResult.error.format(),
      });
    }

    const success = await triggerController.updateRecommendation(id, validationResult.data);
    if (!success) {
      return res.status(404).json({ error: "Empfehlung nicht gefunden" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Aktualisieren der Empfehlung:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren der Empfehlung" });
  }
});

/**
 * DELETE /api/triggers/recommendations/:id
 * Löscht eine Empfehlung
 */
router.delete("/recommendations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Ungültige Empfehlungs-ID" });
    }

    const success = await triggerController.deleteRecommendation(id);
    if (!success) {
      return res.status(404).json({ error: "Empfehlung nicht gefunden" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Löschen der Empfehlung:", error);
    res.status(500).json({ error: "Fehler beim Löschen der Empfehlung" });
  }
});

/**
 * POST /api/triggers/check-context
 * Prüft den aktuellen Kontext auf passende Empfehlungen
 */
router.post("/check-context", async (req, res) => {
  try {
    // Validiere die Anfrage
    // Unterstützung für beide Formate: direktes Objekt oder eingebettet in 'context'
    const contextSchema = z.object({
      context: z.object({
        contextType: z.string(),
        data: z.record(z.any()).optional()
      }).optional(),
      userId: z.number().optional(),
      contextType: z.string().optional(),
      contextData: z.record(z.any()).optional(),
    });

    const validationResult = contextSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Ungültiger Kontext",
        details: validationResult.error.format(),
      });
    }

    // Extrahiere die Daten aus dem Clientformat oder dem Direktformat
    let userId = 1; // Standardbenutzer für Demo
    let contextType: string;
    let contextData: Record<string, any> = {};

    if (validationResult.data.context) {
      // Neues Format vom Client: { context: { contextType, data } }
      contextType = validationResult.data.context.contextType;
      contextData = validationResult.data.context.data || {};
    } else {
      // Direktes Format: { userId, contextType, contextData }
      if (validationResult.data.userId) {
        userId = validationResult.data.userId;
      }
      if (!validationResult.data.contextType) {
        return res.status(400).json({
          error: "contextType ist erforderlich"
        });
      }
      contextType = validationResult.data.contextType;
      contextData = validationResult.data.contextData || {};
    }
    
    // Erstelle ein ContextEvent Objekt
    const contextEvent: ContextEvent = {
      timestamp: new Date(),
      contextType: contextType as ContextType,
      contextData: contextData || {},
    };

    const recommendations = await triggerController.checkContextForRecommendations(
      userId,
      contextEvent
    );

    res.json(recommendations);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Prüfen des Kontexts:", error);
    res.status(500).json({ error: "Fehler beim Prüfen des Kontexts" });
  }
});

/**
 * POST /api/triggers/ai-generated
 * Erstellt automatisch einen Trigger mit zugehörigen Empfehlungen basierend auf einer Inhaltsanalyse
 * Diese Endpunkt wird von der KI verwendet, um proaktiv hilfreiche Empfehlungen zu generieren
 */
router.post("/ai-generated", async (req, res) => {
  try {
    // Validiere die Anfrage
    const aiGeneratedTriggerSchema = z.object({
      name: z.string(),
      description: z.string(),
      conditions: z.array(z.any()),
      createdBy: z.number().optional(),
      recommendations: z.array(z.object({
        title: z.string(),
        description: z.string(),
        type: z.string(),
        priority: z.string(),
        contentId: z.number().optional(),
        contentType: z.string().optional(),
        url: z.string().optional(),
        actionText: z.string().optional(),
        imageUrl: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })),
    });

    const validationResult = aiGeneratedTriggerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Ungültige Daten für den KI-generierten Trigger",
        details: validationResult.error.format(),
      });
    }

    const result = await triggerController.createAIGeneratedTrigger(validationResult.data);
    if (!result.success) {
      return res.status(500).json({ error: "Fehler beim Erstellen des KI-generierten Triggers" });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Erstellen des KI-generierten Triggers:", error);
    res.status(500).json({ error: "Fehler beim Erstellen des KI-generierten Triggers" });
  }
});

/**
 * POST /api/triggers/recommendation-status
 * Aktualisiert den Status einer Empfehlung (z.B. als gesehen oder angeklickt markieren)
 */
router.post("/recommendation-status", async (req, res) => {
  try {
    const statusSchema = z.object({
      userId: z.number(),
      triggerId: z.number(),
      wasDismissed: z.boolean().optional(),
      wasClicked: z.boolean().optional(),
    });

    const validationResult = statusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Ungültige Daten für den Status",
        details: validationResult.error.format(),
      });
    }

    const { userId, triggerId, wasDismissed, wasClicked } = validationResult.data;
    
    const success = await triggerController.updateRecommendationStatus(
      userId,
      triggerId,
      wasDismissed || false,
      wasClicked || false
    );

    if (!success) {
      return res.status(404).json({ error: "Empfehlung nicht gefunden" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Aktualisieren des Empfehlungsstatus:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren des Empfehlungsstatus" });
  }
});

/**
 * GET /api/triggers/preferences/:userId
 * Holt die Benutzereinstellungen für Trigger
 */
router.get("/preferences/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Ungültige Benutzer-ID" });
    }

    const preferences = await triggerController.getUserPreferences(userId);
    
    // Wenn keine Einstellungen gefunden wurden, sende Standardeinstellungen
    if (!preferences) {
      return res.json({
        userId,
        enableTriggers: true,
        priorityThreshold: "low",
        maxTriggersPerHour: null,
        disabledTriggerIds: [],
        disabledContextTypes: [],
        preferredRecommendationTypes: [],
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Abrufen der Benutzereinstellungen:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Benutzereinstellungen" });
  }
});

/**
 * PUT /api/triggers/preferences/:userId
 * Aktualisiert die Benutzereinstellungen für Trigger
 */
router.put("/preferences/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Ungültige Benutzer-ID" });
    }

    // Validiere die Anfrage
    const preferencesSchema = z.object({
      enableTriggers: z.boolean().optional(),
      priorityThreshold: z.string().optional(),
      maxTriggersPerHour: z.number().nullable().optional(),
      disabledTriggerIds: z.array(z.number()).optional(),
      disabledContextTypes: z.array(z.string()).optional(),
      preferredRecommendationTypes: z.array(z.string()).optional(),
    });

    const validationResult = preferencesSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Ungültige Daten für die Einstellungen",
        details: validationResult.error.format(),
      });
    }

    const success = await triggerController.updateUserPreferences(userId, validationResult.data);
    if (!success) {
      return res.status(500).json({ error: "Fehler beim Aktualisieren der Benutzereinstellungen" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Aktualisieren der Benutzereinstellungen:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren der Benutzereinstellungen" });
  }
});

/**
 * GET /api/triggers/history/:userId
 * Holt die Trigger-Historie eines Benutzers
 */
router.get("/history/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Ungültige Benutzer-ID" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ error: "Ungültiges Limit" });
    }

    const history = await triggerController.getUserTriggerHistory(userId, limit);
    res.json(history);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Abrufen der Trigger-Historie:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Trigger-Historie" });
  }
});

/**
 * GET /api/triggers/statistics/:id
 * Holt die Statistiken für einen Trigger
 */
router.get("/statistics/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Ungültige Trigger-ID" });
    }

    const statistics = await triggerController.getTriggerStatistics(id);
    res.json(statistics);
  } catch (error) {
    console.error("[TriggerRoutes] Fehler beim Abrufen der Trigger-Statistiken:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Trigger-Statistiken" });
  }
});

export default router;