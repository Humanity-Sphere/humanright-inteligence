/**
 * Risikoanalyse-Datenmodell
 * 
 * Dieses Modul definiert das Datenmodell für die prädiktive Risikoanalyse,
 * einschließlich Risikofaktoren, Schwellenwerte und historische Daten.
 */

import { pgTable, serial, text, timestamp, integer, jsonb, boolean, real } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Risikofaktoren-Tabelle
export const risk_factors = pgTable('risk_factors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // z.B. politisch, sozial, umweltbedingt, etc.
  weight: real('weight').notNull().default(1.0), // Gewichtungsfaktor
  indicators: jsonb('indicators').default([]), // Liste von Indikatoren, die diesen Faktor beeinflussen
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by: integer('created_by'), // Benutzer-ID
  is_active: boolean('is_active').default(true).notNull(),
});

// Risikobewertungen-Tabelle
export const risk_assessments = pgTable('risk_assessments', {
  id: serial('id').primaryKey(),
  region_id: text('region_id').notNull(), // Region/Land/Gebiet ID
  region_name: text('region_name').notNull(), // Region/Land/Gebiet Name
  region_code: text('region_code'), // ISO-Code oder ähnliche Kennzeichnung
  assessment_date: timestamp('assessment_date').defaultNow().notNull(),
  risk_level: real('risk_level').notNull(), // Gesamtrisikoniveau (0-1)
  risk_factors: jsonb('risk_factors').default({}), // Mapping von Risikofaktor-IDs zu Werten
  confidence_score: real('confidence_score').notNull().default(0.7), // Konfidenzwert der Vorhersage (0-1)
  data_sources: jsonb('data_sources').default([]), // Quellen, die für die Bewertung verwendet wurden
  created_by: integer('created_by'), // Benutzer-ID
  is_prediction: boolean('is_prediction').default(false).notNull(), // Handelt es sich um eine Vorhersage oder eine verifizierte Bewertung
  validation_status: text('validation_status').default('pending'), // pending, validated, disputed
  notes: text('notes'),
});

// Historische Daten-Tabelle
export const historical_risk_data = pgTable('historical_risk_data', {
  id: serial('id').primaryKey(),
  region_id: text('region_id').notNull(),
  date: timestamp('date').notNull(),
  factor_id: integer('factor_id').notNull(), // Risikofaktor-ID
  value: real('value').notNull(), // Wert des Risikofaktors zu diesem Zeitpunkt
  source: text('source'), // Datenquelle
  confidence: real('confidence').default(1.0), // Konfidenzwert (0-1)
  created_at: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata').default({}),
});

// Regionen-Tabelle für geografische Informationen
export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(), // ISO-Code oder andere eindeutige Kennung
  parent_id: integer('parent_id'), // Übergeordnete Region (für hierarchische Strukturen)
  type: text('type').notNull(), // Land, Bundesland, Stadt, etc.
  geo_data: jsonb('geo_data').default({}), // GeoJSON oder andere geografische Daten
  population: integer('population'), // Bevölkerungszahl (optional)
  metadata: jsonb('metadata').default({}), // Weitere Metadaten
});

// Risikobenachrichtigungen-Tabelle
export const risk_alerts = pgTable('risk_alerts', {
  id: serial('id').primaryKey(),
  assessment_id: integer('assessment_id').notNull(), // Verknüpfung mit der Risikobewertung
  alert_level: text('alert_level').notNull(), // critical, high, medium, low
  title: text('title').notNull(),
  description: text('description').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  expires_at: timestamp('expires_at'),
  is_active: boolean('is_active').default(true).notNull(),
  is_acknowledged: boolean('is_acknowledged').default(false).notNull(),
  acknowledged_by: integer('acknowledged_by'), // Benutzer-ID
  acknowledged_at: timestamp('acknowledged_at'),
  actions_taken: jsonb('actions_taken').default([]),
});

// Risikotrends-Tabelle
export const risk_trends = pgTable('risk_trends', {
  id: serial('id').primaryKey(),
  region_id: text('region_id').notNull(),
  factor_id: integer('factor_id').notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  trend_direction: text('trend_direction').notNull(), // increasing, decreasing, stable
  trend_magnitude: real('trend_magnitude').notNull(), // Stärke der Veränderung
  confidence_score: real('confidence_score').notNull().default(0.7),
  analysis_method: text('analysis_method').notNull(), // Methode, die zur Trendbestimmung verwendet wurde
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Risikofaktor-Schwellenwerte
export const risk_thresholds = pgTable('risk_thresholds', {
  id: serial('id').primaryKey(),
  factor_id: integer('factor_id').notNull(),
  level: text('level').notNull(), // low, medium, high, critical
  min_value: real('min_value').notNull(),
  max_value: real('max_value').notNull(),
  action_required: boolean('action_required').default(false).notNull(),
  recommended_actions: jsonb('recommended_actions').default([]),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Zod Schemas für Validierung

export const insertRiskFactorSchema = createInsertSchema(risk_factors).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertRiskAssessmentSchema = createInsertSchema(risk_assessments).omit({
  id: true,
  assessment_date: true
});

export const insertHistoricalRiskDataSchema = createInsertSchema(historical_risk_data).omit({
  id: true,
  created_at: true
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true
});

export const insertRiskAlertSchema = createInsertSchema(risk_alerts).omit({
  id: true,
  created_at: true,
  acknowledged_at: true
});

export const insertRiskTrendSchema = createInsertSchema(risk_trends).omit({
  id: true,
  created_at: true
});

export const insertRiskThresholdSchema = createInsertSchema(risk_thresholds).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// TypeScript-Typen aus Zod-Schemas ableiten

export type RiskFactor = typeof risk_factors.$inferSelect;
export type InsertRiskFactor = z.infer<typeof insertRiskFactorSchema>;

export type RiskAssessment = typeof risk_assessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;

export type HistoricalRiskData = typeof historical_risk_data.$inferSelect;
export type InsertHistoricalRiskData = z.infer<typeof insertHistoricalRiskDataSchema>;

export type Region = typeof regions.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;

export type RiskAlert = typeof risk_alerts.$inferSelect;
export type InsertRiskAlert = z.infer<typeof insertRiskAlertSchema>;

export type RiskTrend = typeof risk_trends.$inferSelect;
export type InsertRiskTrend = z.infer<typeof insertRiskTrendSchema>;

export type RiskThreshold = typeof risk_thresholds.$inferSelect;
export type InsertRiskThreshold = z.infer<typeof insertRiskThresholdSchema>;

// Export des gesamten Modells für die Verwendung in anderen Modulen
export default {
  risk_factors,
  risk_assessments,
  historical_risk_data,
  regions,
  risk_alerts,
  risk_trends,
  risk_thresholds,
};