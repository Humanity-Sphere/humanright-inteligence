import { relations, sql } from "drizzle-orm";
import { integer, pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { ContentType } from "./content-studio";
import { z } from "zod";

// Typdefinition für BrainstormingSession
export type BrainstormingSession = {
  id: number;
  userId: number;
  timestamp: Date;
  projectId: number | null;
  messages: string; // JSON-String der Nachrichtenhistorie
  response: string;
};

// Brainstorming Sessions Tabelle
export const brainstormingSessions = pgTable("brainstorming_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  timestamp: timestamp("timestamp").default(sql`NOW()`),
  messages: text("messages").notNull(), // JSON-String der Nachrichtenhistorie
  response: text("response").notNull(),
});

export const brainstormingSessionsRelations = relations(brainstormingSessions, ({ one }) => ({
  user: one(users, {
    fields: [brainstormingSessions.userId],
    references: [users.id]
  }),
}));

export type InsertBrainstormingSession = typeof brainstormingSessions.$inferInsert;
export type SelectBrainstormingSession = typeof brainstormingSessions.$inferSelect;

// Benutzer Tabelle
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password"),
  fullName: text("full_name"),
  role: text("role").default("user").notNull(),
  profileImage: text("profile_image"),
  googleId: text("google_id"),
  authProvider: text("auth_provider").default("local"),
  organization: text("organization"),
  country: text("country"),
  language: text("language").default("de"),
  expertise: text("expertise").array(),
  bio: text("bio"),
  securitySettings: jsonb("security_settings").default({}),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  campaigns: many(campaigns),
  contents: many(contents),
}));

// User Typ-Definition exportieren
export type User = typeof users.$inferSelect;

// Dokument Tabelle
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  documentType: text("document_type").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  source: text("source").default("manual"),
  category: text("category"),
  author: text("author"),
  tags: text("tags").array(),
  language: text("language").default("de"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id]
  }),
}));

// Kampagnen Tabelle
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goal: text("goal"),
  targetAudience: text("target_audience"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("draft"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id]
  }),
}));

// Inhalts Tabelle
export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  text: text("text").notNull(),
  tone: text("tone").default("neutral"),
  dataSources: text("data_sources").array(),
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const contentsRelations = relations(contents, ({ one }) => ({
  user: one(users, {
    fields: [contents.userId],
    references: [users.id]
  }),
}));

// Aktivitäten Tabelle
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id]
  }),
}));

// Dokumentenanalyse Tabelle
export const documentAnalyses = pgTable("document_analyses", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id"),
  status: text("status").default("completed"),
  beteiligte_parteien: text("beteiligte_parteien").array(),
  rechtliche_grundlagen: jsonb("rechtliche_grundlagen"),
  zentrale_fakten: text("zentrale_fakten").array(),
  menschenrechtliche_implikationen: text("menschenrechtliche_implikationen").array(),
  verbindungen: text("verbindungen").array(),
  zeitliche_abfolge: text("zeitliche_abfolge").array(),
  schluesselwoerter: text("schluesselwoerter").array(),
  sentiment: text("sentiment"),
  suggestedActions: text("suggested_actions").array(),
  contradictions: jsonb("contradictions"),
  // Neue Felder für erweiterte NLP-Analyse
  entities: jsonb("entities"), // Strukturierte Entitäten mit Typen (Personen, Orte, Organisationen)
  topics: text("topics").array(), // Erkannte Themen
  keyFindings: text("key_findings").array(), // Haupterkenntnisse
  semanticEmbedding: jsonb("semantic_embedding"), // Vektordarstellung für Ähnlichkeitssuche
  confidenceScore: integer("confidence_score"), // Konfidenzwert der Analyse
  contextEnriched: boolean("context_enriched").default(false), // Wurde die Analyse mit Kontext angereichert?
  relatedCases: text("related_cases").array(), // Verwandte Rechtsfälle
  relatedPatterns: integer("related_patterns").array(), // IDs verwandter Muster
  humanRightsCategories: text("human_rights_categories").array(), // Kategorien von Menschenrechten
  geographicContext: text("geographic_context"), // Geografischer Kontext
  temporalContext: jsonb("temporal_context"), // Zeitlicher Kontext (strukturiert)
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const documentAnalysesRelations = relations(documentAnalyses, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentAnalyses.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [documentAnalyses.userId],
    references: [users.id]
  }),
  // Neue Beziehungen zu Mustern hinzufügen
  relatedPatternsList: many(patterns, { relationName: "analysis_patterns" })
}));

// Muster Tabelle
export const patterns = pgTable("patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Verbindung zum Benutzer, der das Muster erstellt hat
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  indicators: text("indicators").array(),
  relatedDocuments: integer("related_documents").array(),
  severity: text("severity"),
  frequency: integer("frequency"),
  // Neue Felder für erweiterte Mustererkennung
  patternType: text("pattern_type"), // Typ des Musters (z.B. "violation", "trend", "methodology")
  confidence: integer("confidence"), // Konfidenzwert der Mustererkennung (0-100)
  geographicScope: text("geographic_scope"), // Geographischer Bereich des Musters
  temporalScope: text("temporal_scope"), // Zeitlicher Bereich des Musters
  humanRightsDomains: text("human_rights_domains").array(), // Betroffene Menschenrechtsbereiche
  patternSignature: jsonb("pattern_signature"), // Eindeutige Merkmale des Musters für schnelle Erkennung
  semanticEmbedding: jsonb("semantic_embedding"), // Vektorrepräsentation für Ähnlichkeitssuche
  relatedPatterns: integer("related_patterns").array(), // IDs verwandter Muster
  autoDetected: boolean("auto_detected").default(false), // Wurde das Muster automatisch erkannt?
  verificationStatus: text("verification_status").default("pending"), // Status der Verifizierung
  impactAssessment: jsonb("impact_assessment"), // Bewertung der Auswirkungen
  mitigationStrategies: text("mitigation_strategies").array(), // Strategien zur Minderung
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Wissenskontext Tabelle - Basis für unser Wissensmanagement-System
export const knowledgeContexts = pgTable("knowledge_contexts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Verbindung zum Benutzer, der den Kontext erstellt hat
  title: text("title").notNull(),
  type: text("type").notNull(), // z.B. "legal", "case_law", "news", "report", "treaty", "definition"
  content: text("content").notNull(),
  keywords: text("keywords").array(),
  source: text("source"),
  sourceName: text("source_name"),
  sourceType: text("source_type"),
  // Felder für Wissensgraph und semantische Suche
  semanticEmbedding: jsonb("semantic_embedding"), // Vektorrepräsentation für Ähnlichkeitssuche
  relevanceScore: integer("relevance_score"), // Relevanz des Kontexts (0-100)
  validityPeriod: jsonb("validity_period"), // Zeitraum, in dem der Kontext gültig ist
  geographicScope: text("geographic_scope"), // Geographischer Bereich des Kontexts
  jurisdiction: text("jurisdiction"), // Rechtliche Zuständigkeit
  humanRightsDomains: text("human_rights_domains").array(), // Betroffene Menschenrechtsbereiche
  relatedEntities: text("related_entities").array(), // Verwandte Entitäten (Namen)
  relatedDocuments: integer("related_documents").array(), // IDs verwandter Dokumente
  relatedCases: integer("related_cases").array(), // IDs verwandter Rechtsfälle
  relatedPatterns: integer("related_patterns").array(), // IDs verwandter Muster
  contentQuality: integer("content_quality"), // Qualität des Inhalts (0-100)
  machineGenerated: boolean("machine_generated").default(false), // Wurde der Kontext maschinell generiert?
  verificationStatus: text("verification_status").default("unverified"), // Status der Verifizierung
  lastAccessedAt: timestamp("last_accessed_at"), // Wann wurde der Kontext zuletzt abgerufen
  accessCount: integer("access_count").default(0), // Wie oft wurde der Kontext abgerufen
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Beziehungen für die Wissensdatenbank
export const knowledgeContextsRelations = relations(knowledgeContexts, ({ one, many }) => ({
  user: one(users, {
    fields: [knowledgeContexts.userId],
    references: [users.id]
  }),
  relatedDocs: many(documents), // Verknüpfung zu Dokumenten
  relatedLegalCases: many(legalCases), // Verknüpfung zu Rechtsfällen
  relatedPatternsList: many(patterns) // Verknüpfung zu Mustern
}));

// KI-Wissensbank - Speziell für KI-Agenten
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Optional: Wer hat diesen Eintrag erstellt?
  category: text("category").notNull(), // z.B. "prompt", "system_message", "example", "fact", "rule", "protocol"
  name: text("name").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  tags: text("tags").array(),
  usage: text("usage"), // Verwendungszweck/Kontext
  priority: integer("priority").default(5), // Priorität (1-10)
  aiAgentType: text("ai_agent_type").array(), // Welche KI-Agenten verwenden diese Wissensbasis
  version: text("version").default("1.0"),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  usageCount: integer("usage_count").default(0),
  effectiveness: integer("effectiveness"), // Effektivitätsbewertung (0-100)
  metadata: jsonb("metadata").default({}),
  relatedPromptIds: integer("related_prompt_ids").array(), // Verknüpfte Prompts
  relatedDomainKnowledgeIds: integer("related_domain_knowledge_ids").array(), // Verknüpftes Domänenwissen
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Beziehungen für KI-Wissensbank
export const aiKnowledgeBaseRelations = relations(aiKnowledgeBase, ({ one, many }) => ({
  user: one(users, {
    fields: [aiKnowledgeBase.userId],
    references: [users.id]
  }),
  relatedPrompts: many(promptLibrary), // Verknüpfung zu Prompts
  relatedDomainKnowledge: many(domainKnowledge) // Verknüpfung zu Domänenwissen
}));

// Prompt-Bibliothek - Sammlung von Prompts für verschiedene Anwendungsfälle
export const promptLibrary = pgTable("prompt_library", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Optional: Wer hat diesen Prompt erstellt?
  type: text("type").notNull(), // z.B. "content_generation", "analysis", "repair_agent", "self_learning"
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  systemMessage: text("system_message"),
  parameters: jsonb("parameters"), // Parameter, die in den Prompt eingesetzt werden können
  examples: jsonb("examples"), // Beispiele für erfolgreiche Anwendungen
  data: jsonb("data").default({}), // Flexible Datenstruktur für verschiedene Anwendungsfälle
  category: text("category"), // Kategorisierung
  tags: text("tags").array(),
  aiModels: text("ai_models").array(), // Mit welchen Modellen der Prompt kompatibel ist
  successRate: jsonb("success_rate"), // Erfolgsrate bei verschiedenen Modellen
  relatedDomainKnowledgeIds: integer("related_domain_knowledge_ids").array(), // Verbindung zu relevanten Wissensdomänen
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Beziehungen für die Prompt-Bibliothek
export const promptLibraryRelations = relations(promptLibrary, ({ one, many }) => ({
  user: one(users, {
    fields: [promptLibrary.userId],
    references: [users.id]
  }),
  relatedDomainKnowledge: many(domainKnowledge) // Verknüpfung zu Domänenwissen
}));

// Domänenspezifisches Wissen - Fachspezifisches Wissen für bestimmte Bereiche
export const domainKnowledge = pgTable("domain_knowledge", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Optional: Wer hat diesen Eintrag erstellt?
  domain: text("domain").notNull(), // z.B. "human_rights", "legal", "humanitarian", "security"
  subDomain: text("sub_domain"), // Unterkategorie
  concept: text("concept").notNull(), // Konzept/Begriff
  definition: text("definition").notNull(),
  explanation: text("explanation"),
  examples: jsonb("examples"),
  relatedConcepts: text("related_concepts").array(),
  sources: jsonb("sources"),
  importance: integer("importance").default(5), // Wichtigkeit (1-10)
  complexity: integer("complexity").default(3), // Komplexität (1-5)
  tags: text("tags").array(),
  metadata: jsonb("metadata").default({}),
  relatedKnowledgeContextIds: integer("related_knowledge_context_ids").array(), // Verbindung zu relevanten Wissenskontexten
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Beziehungen für domänenspezifisches Wissen
export const domainKnowledgeRelations = relations(domainKnowledge, ({ one, many }) => ({
  user: one(users, {
    fields: [domainKnowledge.userId],
    references: [users.id]
  }),
  relatedContexts: many(knowledgeContexts) // Verknüpfung zu Wissensdatenbank
}));

// Wirkungsmetriken Tabelle
export const impactMetrics = pgTable("impact_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  metricType: text("metric_type").notNull(),
  name: text("name").notNull(),
  value: integer("value").notNull(),
  goal: integer("goal"),
  unit: text("unit"),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const impactMetricsRelations = relations(impactMetrics, ({ one }) => ({
  user: one(users, {
    fields: [impactMetrics.userId],
    references: [users.id]
  }),
}));

// Beweisdaten Tabelle
export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(),
  evidenceType: text("evidence_type").notNull(),
  fileUrl: text("file_url"),
  content: text("content"),
  date: timestamp("date"),
  location: text("location"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: integer("verified_by"),
  verificationDate: timestamp("verification_date"),
  metadata: jsonb("metadata"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const evidenceRelations = relations(evidence, ({ one }) => ({
  user: one(users, {
    fields: [evidence.userId],
    references: [users.id]
  }),
}));

// Rechtsfälle Tabelle
export const legalCases = pgTable("legal_cases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  caseType: text("case_type").notNull(),
  status: text("status").default("active"),
  jurisdiction: text("jurisdiction"),
  court: text("court"),
  fileNumber: text("file_number"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  plaintiffs: text("plaintiffs").array(),
  defendants: text("defendants").array(),
  legalBasis: text("legal_basis").array(),
  relatedDocuments: integer("related_documents").array(),
  tags: text("tags").array(),
  outcome: text("outcome"),
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const legalCasesRelations = relations(legalCases, ({ one }) => ({
  user: one(users, {
    fields: [legalCases.userId],
    references: [users.id]
  }),
}));

// Content Studio: Template Tabelle
export const contentTemplates = pgTable("content_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  contentType: text("content_type").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  parameterSchema: jsonb("parameter_schema"),
  defaultRole: text("default_role"),
  systemPrompt: text("system_prompt"),
  aiModels: text("ai_models").array(),
  defaultModel: text("default_model"),
  isPublic: boolean("is_public").default(true),
  examples: jsonb("examples"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Content Studio: Content Tabelle
export const studioContent = pgTable("studio_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(),
  content: text("content").notNull(),
  promptTemplate: text("prompt_template"),
  promptParameters: jsonb("prompt_parameters"),
  modelUsed: text("model_used"),
  status: text("status").default("draft"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Content Studio: Rollen Tabelle
export const contentStudioRoles = pgTable("content_studio_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Zod Schemas für die Eingabevalidierung

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentSchema = createInsertSchema(contents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentAnalysisSchema = createInsertSchema(documentAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatternSchema = createInsertSchema(patterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeContextSchema = createInsertSchema(knowledgeContexts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImpactMetricSchema = createInsertSchema(impactMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvidenceSchema = createInsertSchema(evidence).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  verifiedBy: true,
  verificationDate: true,
});

export const insertLegalCaseSchema = createInsertSchema(legalCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentTemplateSchema = createInsertSchema(contentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudioContentSchema = createInsertSchema(studioContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentStudioRoleSchema = createInsertSchema(contentStudioRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Typen für Insert und Select
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type SelectDocument = typeof documents.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type SelectCampaign = typeof campaigns.$inferSelect;

export type InsertContent = z.infer<typeof insertContentSchema>;
export type SelectContent = typeof contents.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type SelectActivity = typeof activities.$inferSelect;

export type InsertDocumentAnalysis = z.infer<typeof insertDocumentAnalysisSchema>;
export type SelectDocumentAnalysis = typeof documentAnalyses.$inferSelect;

export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type SelectPattern = typeof patterns.$inferSelect;

export type InsertKnowledgeContext = z.infer<typeof insertKnowledgeContextSchema>;
export type SelectKnowledgeContext = typeof knowledgeContexts.$inferSelect;

export type InsertImpactMetric = z.infer<typeof insertImpactMetricSchema>;
export type SelectImpactMetric = typeof impactMetrics.$inferSelect;

export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type SelectEvidence = typeof evidence.$inferSelect;

export type InsertLegalCase = z.infer<typeof insertLegalCaseSchema>;
export type SelectLegalCase = typeof legalCases.$inferSelect;

export type InsertContentTemplate = z.infer<typeof insertContentTemplateSchema>;
export type SelectContentTemplate = typeof contentTemplates.$inferSelect;

export type InsertStudioContent = z.infer<typeof insertStudioContentSchema>;
export type SelectStudioContent = typeof studioContent.$inferSelect;

export type InsertContentStudioRole = z.infer<typeof insertContentStudioRoleSchema>;
export type SelectContentStudioRole = typeof contentStudioRoles.$inferSelect;

// Persönliches Tagebuch / Journal Tabelle
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  encryptedContent: text("encrypted_content").notNull(),
  mood: text("mood"),
  tags: text("tags").array(),
  isPrivate: boolean("is_private").default(true),
  hasAiAnalysis: boolean("has_ai_analysis").default(false),
  aiAnalysisResult: jsonb("ai_analysis_result"),
  entryType: text("entry_type").default("manual").notNull(), // manual, auto-generated, reflection
  relatedDocuments: text("related_documents").array(), // Verknüpfte Dokumente
  relatedActivities: text("related_activities").array(), // Verknüpfte Aktivitäten
  reminderDate: timestamp("reminder_date"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id]
  }),
}));

// Wohlbefinden-Tracking Tabelle für Mental Health Coach
export const wellbeingCheckins = pgTable("wellbeing_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  checkInData: jsonb("check_in_data").notNull(),
  analysis: text("analysis"),
  mood: text("mood"),
  stressLevel: integer("stress_level"),
  restLevel: integer("rest_level"),
  sleepQuality: text("sleep_quality"),
  focusRating: integer("focus_rating"),
  wellbeingScore: integer("wellbeing_score"),
  suggestions: text("suggestions").array(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const wellbeingCheckinsRelations = relations(wellbeingCheckins, ({ one }) => ({
  user: one(users, {
    fields: [wellbeingCheckins.userId],
    references: [users.id]
  }),
}));

// Die promptLibrary-Tabelle wurde durch eine umfassendere Version ersetzt, siehe oben
// (Mit mehr Feldern und Funktionen für das Wissensmanagement-System)

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  aiAnalysisResult: true
});

export const insertWellbeingCheckinSchema = createInsertSchema(wellbeingCheckins).omit({
  id: true,
  createdAt: true,
  analysis: true,
  suggestions: true,
  wellbeingScore: true
});

// Schema-Definitionen für die Wissensdatenbank-Tabellen
export const insertAiKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
  usageCount: true,
});

export const insertPromptLibrarySchema = createInsertSchema(promptLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDomainKnowledgeSchema = createInsertSchema(domainKnowledge).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Typen für die Wissensdatenbank
export type InsertAiKnowledgeBase = z.infer<typeof insertAiKnowledgeBaseSchema>;
export type SelectAiKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;

export type InsertPromptLibrary = z.infer<typeof insertPromptLibrarySchema>;
export type SelectPromptLibrary = typeof promptLibrary.$inferSelect;

export type InsertDomainKnowledge = z.infer<typeof insertDomainKnowledgeSchema>;
export type SelectDomainKnowledge = typeof domainKnowledge.$inferSelect;

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type SelectJournalEntry = typeof journalEntries.$inferSelect;

export type InsertWellbeingCheckin = z.infer<typeof insertWellbeingCheckinSchema>;
export type SelectWellbeingCheckin = typeof wellbeingCheckins.$inferSelect;

// Sicherheitsempfehlungen Tabelle
export const safetyRecommendations = pgTable("safety_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  riskLevel: text("risk_level").notNull(), // z.B. niedrig, mittel, hoch
  context: jsonb("context").notNull(), // Context-Daten (Standort, Aktivität, bekannte Bedrohungen)
  recommendationType: text("recommendation_type").notNull(), // z.B. digital, physisch, reise, kommunikation
  recommendations: text("recommendations").array(),
  resources: jsonb("resources"), // Links, Kontakte, Tools etc.
  implementationSteps: jsonb("implementation_steps"),
  isImplemented: boolean("is_implemented").default(false),
  implementationDate: timestamp("implementation_date"),
  reminderDate: timestamp("reminder_date"),
  locationData: jsonb("location_data"), // Geographische Daten, falls zutreffend
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const safetyRecommendationsRelations = relations(safetyRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [safetyRecommendations.userId],
    references: [users.id]
  }),
}));

export const insertSafetyRecommendationSchema = createInsertSchema(safetyRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isImplemented: true,
  implementationDate: true,
});

export type InsertSafetyRecommendation = z.infer<typeof insertSafetyRecommendationSchema>;
export type SelectSafetyRecommendation = typeof safetyRecommendations.$inferSelect;

// Import der Typen für die Content-Trigger
import { 
  ContextType, 
  RecommendationPriority, 
  RecommendationType
} from './types/trigger-recommendations';

// Content-Trigger Tabellen

// Content-Trigger Tabelle
export const contentTriggers = pgTable("content_triggers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  active: boolean("active").default(true),
  conditions: jsonb("conditions").notNull(), // TriggerCondition[]
  userGroups: integer("user_groups").array(),
  minSecurityLevel: integer("min_security_level"),
  aiGenerated: boolean("ai_generated").default(false),
  createdBy: integer("created_by"),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").default(0),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Content-Empfehlungen Tabelle
export const contentRecommendations = pgTable("content_recommendations", {
  id: serial("id").primaryKey(),
  triggerId: integer("trigger_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // RecommendationType als String
  priority: text("priority").notNull(), // RecommendationPriority als String
  contentId: integer("content_id"),
  contentType: text("content_type"),
  url: text("url"),
  actionText: text("action_text"),
  dismissible: boolean("dismissible").default(true),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Beziehung zwischen Content-Trigger und Content-Recommendations
export const contentTriggersRelations = relations(contentTriggers, ({ many }) => ({
  recommendations: many(contentRecommendations),
}));

export const contentRecommendationsRelations = relations(contentRecommendations, ({ one }) => ({
  trigger: one(contentTriggers, {
    fields: [contentRecommendations.triggerId],
    references: [contentTriggers.id]
  }),
}));

// User-Trigger-Historie Tabelle
export const userTriggerHistory = pgTable("user_trigger_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  triggerId: integer("trigger_id").notNull(),
  triggeredAt: timestamp("triggered_at").default(sql`NOW()`),
  dismissed: boolean("dismissed").default(false),
  clicked: boolean("clicked").default(false),
  contextData: jsonb("context_data"),
});

export const userTriggerHistoryRelations = relations(userTriggerHistory, ({ one }) => ({
  user: one(users, {
    fields: [userTriggerHistory.userId],
    references: [users.id]
  }),
  trigger: one(contentTriggers, {
    fields: [userTriggerHistory.triggerId],
    references: [contentTriggers.id]
  }),
}));

// Trigger-Präferenzen der Benutzer
export const triggerPreferences = pgTable("trigger_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  enableTriggers: boolean("enable_triggers").default(true),
  priorityThreshold: text("priority_threshold").default("low"), // RecommendationPriority als String
  maxTriggersPerHour: integer("max_triggers_per_hour"),
  disabledTriggerIds: integer("disabled_trigger_ids").array(),
  disabledContextTypes: text("disabled_context_types").array(), // ContextType[] als String-Array
  preferredRecommendationTypes: text("preferred_recommendation_types").array(), // RecommendationType[] als String-Array
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const triggerPreferencesRelations = relations(triggerPreferences, ({ one }) => ({
  user: one(users, {
    fields: [triggerPreferences.userId],
    references: [users.id]
  }),
}));

// Zod Schemas für die Eingabevalidierung
export const insertContentTriggerSchema = createInsertSchema(contentTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggeredAt: true,
  triggerCount: true,
});

export const insertContentRecommendationSchema = createInsertSchema(contentRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserTriggerHistorySchema = createInsertSchema(userTriggerHistory).omit({
  id: true,
  triggeredAt: true,
});

export const insertTriggerPreferencesSchema = createInsertSchema(triggerPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Typen für Insert und Select
export type InsertContentTrigger = z.infer<typeof insertContentTriggerSchema>;
export type SelectContentTrigger = typeof contentTriggers.$inferSelect;

export type InsertContentRecommendation = z.infer<typeof insertContentRecommendationSchema>;
export type SelectContentRecommendation = typeof contentRecommendations.$inferSelect;

export type InsertUserTriggerHistory = z.infer<typeof insertUserTriggerHistorySchema>;
export type SelectUserTriggerHistory = typeof userTriggerHistory.$inferSelect;

export type InsertTriggerPreferences = z.infer<typeof insertTriggerPreferencesSchema>;
export type SelectTriggerPreferences = typeof triggerPreferences.$inferSelect;

// Aktivitätsprotokoll-Tabelle für die automatische Dokumentation und Reflexion
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(), // document_view, document_edit, search, analysis, etc.
  activityData: jsonb("activity_data").notNull(), // Zusätzliche Informationen zur Aktivität
  resourceType: text("resource_type"), // document, evidence, journal, etc.
  resourceId: text("resource_id"), // ID der betroffenen Ressource
  importance: integer("importance").default(1), // 1-5, wie wichtig diese Aktivität für Reflexion ist
  processed: boolean("processed").default(false), // Wurde für Reflektion verwendet?
  timestamp: timestamp("timestamp").default(sql`NOW()`),
});

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id]
  }),
}));

// Reflexionsberichte-Tabelle - speichert automatisch generierte Zusammenfassungen
export const reflectionReports = pgTable("reflection_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // daily, weekly, project, focus_area
  encryptedContent: text("encrypted_content").notNull(), // Verschlüsselter Bericht
  timeFrame: jsonb("time_frame").notNull(), // { start: Date, end: Date }
  includedActivities: integer("included_activities").array(), // IDs der einbezogenen Aktivitäten
  relatedJournalEntries: integer("related_journal_entries").array(), // Verknüpfte Journal-Einträge
  tags: text("tags").array(),
  insights: jsonb("insights"), // Automatisch extrahierte Erkenntnisse
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const reflectionReportsRelations = relations(reflectionReports, ({ one }) => ({
  user: one(users, {
    fields: [reflectionReports.userId],
    references: [users.id]
  }),
}));

// Zod Schemas für die Eingabevalidierung
export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({
  id: true,
  timestamp: true,
  processed: true
});

export const insertReflectionReportSchema = createInsertSchema(reflectionReports).omit({
  id: true,
  createdAt: true,
});

export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type SelectUserActivityLog = typeof userActivityLogs.$inferSelect;

export type InsertReflectionReport = z.infer<typeof insertReflectionReportSchema>;
export type SelectReflectionReport = typeof reflectionReports.$inferSelect;