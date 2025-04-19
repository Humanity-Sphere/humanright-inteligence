/**
 * Risikoanalyse-Routen
 * 
 * API-Endpunkte für die prädiktive Risikoanalyse, einschließlich Risikofaktoren, 
 * Bewertungen, historische Daten und Prognosen.
 */

import express from 'express';
import { z } from 'zod';
import { db } from '../utils/db';
import { 
  risk_factors, 
  risk_assessments, 
  historical_risk_data, 
  regions, 
  risk_alerts, 
  risk_trends,
  risk_thresholds,
  insertRiskFactorSchema,
  insertRiskAssessmentSchema,
  insertHistoricalRiskDataSchema,
  insertRegionSchema,
  insertRiskThresholdSchema
} from '../models/risk-analysis-model';
import { riskPredictionService, RiskPredictionParams } from '../services/risk-prediction-service';
import { and, eq, gte, lte, desc, asc, sql } from 'drizzle-orm';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Schema zur Validierung der Risikovorhersage-Parameter
 */
const riskPredictionParamsSchema = z.object({
  regionId: z.string(),
  regionCode: z.string().optional(),
  startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  factorIds: z.array(z.number()).optional(),
  confidenceThreshold: z.number().min(0).max(1).optional().default(0.5),
  includeHistoricalData: z.boolean().optional().default(false)
});

/**
 * @route GET /api/risk-analysis/factors
 * @desc Ruft alle aktiven Risikofaktoren ab
 * @access Private
 */
router.get('/factors', async (req, res) => {
  try {
    const factors = await db.select().from(risk_factors)
      .where(eq(risk_factors.is_active, true))
      .orderBy(asc(risk_factors.name));
    
    res.json(factors);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Risikofaktoren:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route GET /api/risk-analysis/factors/:id
 * @desc Ruft einen spezifischen Risikofaktor nach ID ab
 * @access Private
 */
router.get('/factors/:id', async (req, res) => {
  try {
    const factorId = parseInt(req.params.id);
    if (isNaN(factorId)) {
      return res.status(400).json({ error: 'Ungültige Faktor-ID' });
    }
    
    const factor = await db.select().from(risk_factors)
      .where(eq(risk_factors.id, factorId))
      .limit(1);
    
    if (factor.length === 0) {
      return res.status(404).json({ error: 'Risikofaktor nicht gefunden' });
    }
    
    res.json(factor[0]);
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Risikofaktors ${req.params.id}:`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route POST /api/risk-analysis/factors
 * @desc Erstellt einen neuen Risikofaktor
 * @access Private/Admin
 */
router.post('/factors', async (req, res) => {
  try {
    const result = insertRiskFactorSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: result.error.format() 
      });
    }
    
    const [createdFactor] = await db.insert(risk_factors)
      .values({
        ...result.data,
        created_by: req.user?.id,
      })
      .returning();
    
    res.status(201).json(createdFactor);
  } catch (error) {
    logger.error('Fehler beim Erstellen des Risikofaktors:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route PUT /api/risk-analysis/factors/:id
 * @desc Aktualisiert einen bestehenden Risikofaktor
 * @access Private/Admin
 */
router.put('/factors/:id', async (req, res) => {
  try {
    const factorId = parseInt(req.params.id);
    if (isNaN(factorId)) {
      return res.status(400).json({ error: 'Ungültige Faktor-ID' });
    }
    
    const result = insertRiskFactorSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: result.error.format() 
      });
    }
    
    const [updatedFactor] = await db.update(risk_factors)
      .set({
        ...result.data,
        updated_at: new Date()
      })
      .where(eq(risk_factors.id, factorId))
      .returning();
    
    if (!updatedFactor) {
      return res.status(404).json({ error: 'Risikofaktor nicht gefunden' });
    }
    
    res.json(updatedFactor);
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren des Risikofaktors ${req.params.id}:`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route GET /api/risk-analysis/regions
 * @desc Ruft alle verfügbaren Regionen ab
 * @access Private
 */
router.get('/regions', async (req, res) => {
  try {
    const regions_list = await db.select().from(regions)
      .orderBy(asc(regions.name));
    
    res.json(regions_list);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Regionen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route GET /api/risk-analysis/assessments
 * @desc Ruft Risikobewertungen mit Filtern ab
 * @access Private
 */
router.get('/assessments', async (req, res) => {
  try {
    const { 
      regionId, 
      isPrediction, 
      startDate, 
      endDate,
      limit = 20,
      offset = 0
    } = req.query;
    
    let query = db.select().from(risk_assessments);
    
    // Filter anwenden
    if (regionId) {
      query = query.where(eq(risk_assessments.region_id, regionId as string));
    }
    
    if (isPrediction !== undefined) {
      query = query.where(eq(risk_assessments.is_prediction, isPrediction === 'true'));
    }
    
    if (startDate) {
      query = query.where(gte(risk_assessments.assessment_date, new Date(startDate as string)));
    }
    
    if (endDate) {
      query = query.where(lte(risk_assessments.assessment_date, new Date(endDate as string)));
    }
    
    // Paginierung
    query = query.limit(Number(limit)).offset(Number(offset));
    
    // Sortierung
    query = query.orderBy(desc(risk_assessments.assessment_date));
    
    const assessments = await query;
    
    // Gesamtzahl für Paginierung
    const countQuery = db.select({ count: sql`count(*)` }).from(risk_assessments);
    
    // Filter für Count-Query anwenden
    if (regionId) {
      countQuery.where(eq(risk_assessments.region_id, regionId as string));
    }
    
    if (isPrediction !== undefined) {
      countQuery.where(eq(risk_assessments.is_prediction, isPrediction === 'true'));
    }
    
    if (startDate) {
      countQuery.where(gte(risk_assessments.assessment_date, new Date(startDate as string)));
    }
    
    if (endDate) {
      countQuery.where(lte(risk_assessments.assessment_date, new Date(endDate as string)));
    }
    
    const [{ count }] = await countQuery;
    
    res.json({
      data: assessments,
      total: Number(count),
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Risikobewertungen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route GET /api/risk-analysis/assessments/:id
 * @desc Ruft eine spezifische Risikobewertung mit zugehörigen Alerts ab
 * @access Private
 */
router.get('/assessments/:id', async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) {
      return res.status(400).json({ error: 'Ungültige Bewertungs-ID' });
    }
    
    const [assessment] = await db.select().from(risk_assessments)
      .where(eq(risk_assessments.id, assessmentId))
      .limit(1);
    
    if (!assessment) {
      return res.status(404).json({ error: 'Risikobewertung nicht gefunden' });
    }
    
    // Zugehörige Alerts abrufen
    const alerts = await db.select().from(risk_alerts)
      .where(eq(risk_alerts.assessment_id, assessmentId));
    
    // Antwort zusammenstellen
    const response = {
      ...assessment,
      alerts
    };
    
    res.json(response);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Risikobewertung ${req.params.id}:`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route GET /api/risk-analysis/historical/:regionId
 * @desc Ruft historische Risikodaten für eine Region ab
 * @access Private
 */
router.get('/historical/:regionId', async (req, res) => {
  try {
    const { regionId } = req.params;
    const { startDate, endDate, factorIds } = req.query;
    
    let query = db.select().from(historical_risk_data)
      .where(eq(historical_risk_data.region_id, regionId));
    
    if (startDate) {
      query = query.where(gte(historical_risk_data.date, new Date(startDate as string)));
    }
    
    if (endDate) {
      query = query.where(lte(historical_risk_data.date, new Date(endDate as string)));
    }
    
    if (factorIds) {
      const factorIdArray = (factorIds as string).split(',').map(id => parseInt(id));
      query = query.where(sql`${historical_risk_data.factor_id} IN (${factorIdArray.join(',')})`);
    }
    
    query = query.orderBy(asc(historical_risk_data.date));
    
    const data = await query;
    
    res.json(data);
  } catch (error) {
    logger.error(`Fehler beim Abrufen historischer Daten für Region ${req.params.regionId}:`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route POST /api/risk-analysis/historical
 * @desc Speichert neue historische Risikodaten
 * @access Private/Admin
 */
router.post('/historical', async (req, res) => {
  try {
    const result = insertHistoricalRiskDataSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: result.error.format() 
      });
    }
    
    const [createdData] = await db.insert(historical_risk_data)
      .values(result.data)
      .returning();
    
    res.status(201).json(createdData);
  } catch (error) {
    logger.error('Fehler beim Speichern historischer Risikodaten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route POST /api/risk-analysis/predict
 * @desc Führt eine prädiktive Risikoanalyse durch
 * @access Private
 */
router.post('/predict', async (req, res) => {
  try {
    const result = riskPredictionParamsSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: result.error.format() 
      });
    }
    
    const predictionParams: RiskPredictionParams = result.data;
    
    const predictionResult = await riskPredictionService.predictRiskLevel(predictionParams);
    
    res.json(predictionResult);
  } catch (error) {
    logger.error('Fehler bei der Risikovorhersage:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ error: 'Fehler bei der Risikovorhersage', message: error.message });
    } else {
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
});

/**
 * @route GET /api/risk-analysis/trends/:regionId
 * @desc Ruft Risikotrends für eine Region ab
 * @access Private
 */
router.get('/trends/:regionId', async (req, res) => {
  try {
    const { regionId } = req.params;
    const { factorIds } = req.query;
    
    let query = db.select().from(risk_trends)
      .where(eq(risk_trends.region_id, regionId));
    
    if (factorIds) {
      const factorIdArray = (factorIds as string).split(',').map(id => parseInt(id));
      query = query.where(sql`${risk_trends.factor_id} IN (${factorIdArray.join(',')})`);
    }
    
    query = query.orderBy(desc(risk_trends.end_date));
    
    const trends = await query;
    
    res.json(trends);
  } catch (error) {
    logger.error(`Fehler beim Abrufen von Risikotrends für Region ${req.params.regionId}:`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route GET /api/risk-analysis/thresholds
 * @desc Ruft Risikoschwellenwerte ab
 * @access Private
 */
router.get('/thresholds', async (req, res) => {
  try {
    const { factorId } = req.query;
    
    let query = db.select().from(risk_thresholds);
    
    if (factorId) {
      query = query.where(eq(risk_thresholds.factor_id, parseInt(factorId as string)));
    }
    
    const thresholds = await query;
    
    res.json(thresholds);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Risikoschwellenwerte:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route POST /api/risk-analysis/thresholds
 * @desc Erstellt einen neuen Risikoschwellenwert
 * @access Private/Admin
 */
router.post('/thresholds', async (req, res) => {
  try {
    const result = insertRiskThresholdSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validierungsfehler', 
        details: result.error.format() 
      });
    }
    
    const [createdThreshold] = await db.insert(risk_thresholds)
      .values(result.data)
      .returning();
    
    res.status(201).json(createdThreshold);
  } catch (error) {
    logger.error('Fehler beim Erstellen des Risikoschwellenwerts:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route POST /api/risk-analysis/alerts/:id/acknowledge
 * @desc Bestätigt einen Risikoalarm
 * @access Private
 */
router.post('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ error: 'Ungültige Alert-ID' });
    }
    
    const [updatedAlert] = await db.update(risk_alerts)
      .set({
        is_acknowledged: true,
        acknowledged_by: req.user?.id,
        acknowledged_at: new Date(),
        actions_taken: req.body.actions || []
      })
      .where(eq(risk_alerts.id, alertId))
      .returning();
    
    if (!updatedAlert) {
      return res.status(404).json({ error: 'Risikoalarm nicht gefunden' });
    }
    
    res.json(updatedAlert);
  } catch (error) {
    logger.error(`Fehler beim Bestätigen des Risikoalarms ${req.params.id}:`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * @route GET /api/risk-analysis/dashboard/:regionId
 * @desc Ruft Dashboard-Daten für eine Region ab
 * @access Private
 */
router.get('/dashboard/:regionId', async (req, res) => {
  try {
    const { regionId } = req.params;
    
    // Neueste Risikobewertung
    const [latestAssessment] = await db.select().from(risk_assessments)
      .where(eq(risk_assessments.region_id, regionId))
      .orderBy(desc(risk_assessments.assessment_date))
      .limit(1);
    
    // Aktive Alerts
    const activeAlerts = latestAssessment 
      ? await db.select().from(risk_alerts)
        .where(and(
          eq(risk_alerts.assessment_id, latestAssessment.id),
          eq(risk_alerts.is_active, true)
        ))
      : [];
    
    // Aktuelle Trends
    const trends = await db.select().from(risk_trends)
      .where(eq(risk_trends.region_id, regionId))
      .orderBy(desc(risk_trends.end_date))
      .limit(10);
    
    // Historische Risikodaten 
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const historicalData = await db.select().from(historical_risk_data)
      .where(and(
        eq(historical_risk_data.region_id, regionId),
        gte(historical_risk_data.date, thirtyDaysAgo)
      ))
      .orderBy(asc(historical_risk_data.date));
    
    // Region abrufen
    const [region] = await db.select().from(regions)
      .where(eq(regions.id, parseInt(regionId)))
      .limit(1);
    
    // Antwort zusammenstellen
    const dashboardData = {
      region,
      currentAssessment: latestAssessment,
      activeAlerts,
      trends,
      historicalData
    };
    
    res.json(dashboardData);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Dashboard-Daten für Region ${req.params.regionId}:`, error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

export default router;