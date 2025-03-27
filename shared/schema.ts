import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  profileImage: text("profile_image"),
  organization: text("organization"),
  country: text("country"),
  language: text("language").default("de"),
  expertise: text("expertise").array(),
  bio: text("bio"),
  securitySettings: json("security_settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // OAuth Fields
  googleId: text("google_id").unique(),
  authProvider: text("auth_provider"), // 'local', 'google', etc.
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  profileImage: true,
  organization: true,
  country: true,
  language: true,
  expertise: true,
  bio: true,
  securitySettings: true,
  googleId: true,
  authProvider: true,
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  source: text("source").notNull().default("local"),
  tags: text("tags").array(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  userId: true,
  title: true,
  description: true,
  fileType: true,
  fileSize: true,
  filePath: true,
  source: true,
  tags: true,
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planning"),
  progress: integer("progress").notNull().default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  participants: integer("participants").notNull().default(0),
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  userId: true,
  title: true,
  description: true,
  status: true,
  progress: true,
  startDate: true,
  endDate: true,
  participants: true,
});

// Content
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  tone: text("tone").notNull(),
  text: text("text").notNull(),
  dataSources: text("data_sources").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isSaved: boolean("is_saved").notNull().default(false),
});

export const insertContentSchema = createInsertSchema(content).pick({
  userId: true,
  title: true,
  type: true,
  tone: true,
  text: true,
  dataSources: true,
  isSaved: true,
});

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  type: true,
  description: true,
  metadata: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;

// Document Analysis
export const documentAnalyses = pgTable("document_analyses", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  analysisDate: timestamp("analysis_date").notNull().defaultNow(),
  topics: text("topics").array(),
  entities: jsonb("entities").default([]),
  sentiment: text("sentiment"),
  keyFindings: text("key_findings").array(),
  legalReferences: jsonb("legal_references").default([]),
  suggestedActions: text("suggested_actions").array(),
  contradictions: jsonb("contradictions").default([]),
  confidence: integer("confidence").default(0),
  metadata: json("metadata").default({}),
});

export const insertDocumentAnalysisSchema = createInsertSchema(documentAnalyses).pick({
  documentId: true,
  userId: true,
  status: true,
  topics: true,
  entities: true,
  sentiment: true,
  keyFindings: true,
  legalReferences: true,
  suggestedActions: true,
  contradictions: true,
  confidence: true,
  metadata: true,
});

// Patterns - for tracking pattern recognition across documents/cases
export const patterns = pgTable("patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  patternType: text("pattern_type").notNull(),
  criteria: jsonb("criteria").notNull(),
  documentIds: integer("document_ids").array(),
  detectedCount: integer("detected_count").notNull().default(0),
  firstDetected: timestamp("first_detected").notNull().defaultNow(),
  lastDetected: timestamp("last_detected"),
  status: text("status").default("active"),
  priority: text("priority").default("medium"),
  geographicScope: jsonb("geographic_scope").default({}),
  temporalTrends: jsonb("temporal_trends").default({}),
  relatedPatternIds: integer("related_pattern_ids").array(),
  notes: text("notes"),
});

export const insertPatternSchema = createInsertSchema(patterns).pick({
  userId: true,
  name: true,
  description: true,
  patternType: true,
  criteria: true,
  documentIds: true,
  detectedCount: true,
  status: true,
  priority: true,
  geographicScope: true,
  temporalTrends: true,
  relatedPatternIds: true,
  notes: true,
});

// Knowledge Context - for integrations with external knowledge bases
export const knowledgeContexts = pgTable("knowledge_contexts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  contentType: text("content_type").notNull(),
  content: text("content"),
  metadata: jsonb("metadata").default({}),
  tags: text("tags").array(),
  relatedDocumentIds: integer("related_document_ids").array(),
  relationStrength: integer("relation_strength").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  isActive: boolean("is_active").default(true),
});

export const insertKnowledgeContextSchema = createInsertSchema(knowledgeContexts).pick({
  userId: true,
  title: true,
  source: true,
  sourceId: true,
  contentType: true,
  content: true,
  metadata: true,
  tags: true,
  relatedDocumentIds: true,
  relationStrength: true,
  isActive: true,
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type DocumentAnalysis = typeof documentAnalyses.$inferSelect;
export type InsertDocumentAnalysis = z.infer<typeof insertDocumentAnalysisSchema>;

export type Pattern = typeof patterns.$inferSelect;
export type InsertPattern = z.infer<typeof insertPatternSchema>;

export type KnowledgeContext = typeof knowledgeContexts.$inferSelect;
export type InsertKnowledgeContext = z.infer<typeof insertKnowledgeContextSchema>;

// Impact Metrics Schema
export const impactMetrics = pgTable("impact_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  metricType: text("metric_type").notNull(), // Typ der Metrik (advocacy, legal, education, etc.)
  metricName: text("metric_name").notNull(), // Name der Metrik
  value: integer("value").notNull(), // Numerischer Wert
  previousValue: integer("previous_value"), // Vorheriger Wert für Vergleiche
  unit: text("unit").default("count"), // Einheit der Metrik (count, percentage, etc.)
  color: text("color").default("primary"), // Farbe für UI-Darstellung
  icon: text("icon").default("trending_up"), // Icon für UI-Darstellung
  description: text("description"), // Beschreibung der Metrik
  goal: integer("goal"), // Zielwert (optional)
  timestamp: timestamp("timestamp").defaultNow().notNull(), // Zeitstempel
  region: text("region"), // Geografische Region, falls zutreffend
  tags: text("tags").array(), // Tags für Filterung
  impactStory: text("impact_story"), // Narrative über die Wirkung
  dataSource: text("data_source"), // Quelle der Daten
  visualType: text("visual_type").default("bar"), // Art der Visualisierung (bar, line, pie, etc.)
});

export const insertImpactMetricSchema = createInsertSchema(impactMetrics).pick({
  userId: true,
  metricType: true,
  metricName: true,
  value: true,
  previousValue: true,
  unit: true,
  color: true,
  icon: true,
  description: true,
  goal: true,
  region: true,
  tags: true,
  impactStory: true,
  dataSource: true,
  visualType: true,
});

export type ImpactMetric = typeof impactMetrics.$inferSelect;
export type InsertImpactMetric = z.infer<typeof insertImpactMetricSchema>;
