import express from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertSafetyRecommendationSchema } from "@shared/schema";

const router = express.Router();

// GET: Erhalten aller Sicherheitsempfehlungen für einen Benutzer
router.get("/", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Gültige Benutzer-ID erforderlich" });
    }
    
    const recommendations = await storage.getSafetyRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Fehler beim Abrufen der Sicherheitsempfehlungen:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Sicherheitsempfehlungen" });
  }
});

// GET: Einzelne Sicherheitsempfehlung anhand der ID abrufen
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Gültige ID erforderlich" });
    }
    
    const recommendation = await storage.getSafetyRecommendation(id);
    if (!recommendation) {
      return res.status(404).json({ error: "Sicherheitsempfehlung nicht gefunden" });
    }
    
    res.json(recommendation);
  } catch (error) {
    console.error("Fehler beim Abrufen der Sicherheitsempfehlung:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Sicherheitsempfehlung" });
  }
});

// POST: Neue Sicherheitsempfehlung erstellen
router.post("/", async (req, res) => {
  try {
    const validatedData = insertSafetyRecommendationSchema.parse(req.body);
    const newRecommendation = await storage.createSafetyRecommendation(validatedData);
    res.status(201).json(newRecommendation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Ungültige Eingabedaten", details: error.errors });
    }
    console.error("Fehler beim Erstellen der Sicherheitsempfehlung:", error);
    res.status(500).json({ error: "Fehler beim Erstellen der Sicherheitsempfehlung" });
  }
});

// PUT: Sicherheitsempfehlung aktualisieren
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Gültige ID erforderlich" });
    }
    
    const existingRecommendation = await storage.getSafetyRecommendation(id);
    if (!existingRecommendation) {
      return res.status(404).json({ error: "Sicherheitsempfehlung nicht gefunden" });
    }
    
    const updatedRecommendation = await storage.updateSafetyRecommendation(id, req.body);
    res.json(updatedRecommendation);
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Sicherheitsempfehlung:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren der Sicherheitsempfehlung" });
  }
});

// DELETE: Sicherheitsempfehlung löschen
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Gültige ID erforderlich" });
    }
    
    const success = await storage.deleteSafetyRecommendation(id);
    if (!success) {
      return res.status(404).json({ error: "Sicherheitsempfehlung nicht gefunden" });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error("Fehler beim Löschen der Sicherheitsempfehlung:", error);
    res.status(500).json({ error: "Fehler beim Löschen der Sicherheitsempfehlung" });
  }
});

// POST: Sicherheitsempfehlung als implementiert markieren
router.post("/:id/implemented", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Gültige ID erforderlich" });
    }
    
    const updatedRecommendation = await storage.markSafetyRecommendationAsImplemented(id);
    if (!updatedRecommendation) {
      return res.status(404).json({ error: "Sicherheitsempfehlung nicht gefunden" });
    }
    
    res.json(updatedRecommendation);
  } catch (error) {
    console.error("Fehler beim Markieren der Sicherheitsempfehlung als implementiert:", error);
    res.status(500).json({ error: "Fehler beim Markieren der Sicherheitsempfehlung als implementiert" });
  }
});

// GET: Sicherheitsempfehlungen nach Kontext abrufen
router.get("/context/:context", async (req, res) => {
  try {
    const context = req.params.context;
    const recommendations = await storage.getSafetyRecommendationsByContext(context);
    res.json(recommendations);
  } catch (error) {
    console.error("Fehler beim Abrufen der Sicherheitsempfehlungen nach Kontext:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Sicherheitsempfehlungen nach Kontext" });
  }
});

// GET: Sicherheitsempfehlungen nach Risikolevel abrufen
router.get("/risk-level/:riskLevel", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Gültige Benutzer-ID erforderlich" });
    }
    
    const riskLevel = req.params.riskLevel;
    const recommendations = await storage.getSafetyRecommendationsByRiskLevel(userId, riskLevel);
    res.json(recommendations);
  } catch (error) {
    console.error("Fehler beim Abrufen der Sicherheitsempfehlungen nach Risikolevel:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Sicherheitsempfehlungen nach Risikolevel" });
  }
});

// GET: Sicherheitsempfehlungen nach Typ abrufen
router.get("/type/:recommendationType", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Gültige Benutzer-ID erforderlich" });
    }
    
    const recommendationType = req.params.recommendationType;
    const recommendations = await storage.getSafetyRecommendationsByType(userId, recommendationType);
    res.json(recommendations);
  } catch (error) {
    console.error("Fehler beim Abrufen der Sicherheitsempfehlungen nach Typ:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Sicherheitsempfehlungen nach Typ" });
  }
});

// POST: Kontextbasierte Sicherheitsempfehlungen generieren
router.post("/generate-contextual", async (req, res) => {
  try {
    const { userId, location, activities, threats } = req.body;
    
    if (!userId || !location || !Array.isArray(activities) || !Array.isArray(threats)) {
      return res.status(400).json({ 
        error: "Ungültige Eingabedaten", 
        details: "userId, location, activities (Array) und threats (Array) sind erforderlich" 
      });
    }
    
    const recommendations = await storage.generateContextualSafetyRecommendations(
      userId, 
      location, 
      activities, 
      threats
    );
    
    res.status(201).json(recommendations);
  } catch (error) {
    console.error("Fehler beim Generieren kontextbasierter Sicherheitsempfehlungen:", error);
    res.status(500).json({ error: "Fehler beim Generieren kontextbasierter Sicherheitsempfehlungen" });
  }
});

export default router;