import { 
  users, type User, type InsertUser, 
  documents, type Document, type InsertDocument, 
  campaigns, type Campaign, type InsertCampaign, 
  content, type Content, type InsertContent, 
  activities, type Activity, type InsertActivity,
  documentAnalyses, type DocumentAnalysis, type InsertDocumentAnalysis,
  patterns, type Pattern, type InsertPattern,
  knowledgeContexts, type KnowledgeContext, type InsertKnowledgeContext,
  impactMetrics, type ImpactMetric, type InsertImpactMetric
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  authenticateUser(username: string, password: string): Promise<User | undefined>;
  
  // Document operations
  getDocuments(userId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Campaign operations
  getCampaigns(userId: number): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  
  // Content operations
  getContents(userId: number): Promise<Content[]>;
  getContent(id: number): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<Content>): Promise<Content | undefined>;
  
  // Activity operations
  getActivities(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Document Analysis operations
  getDocumentAnalyses(userId: number): Promise<DocumentAnalysis[]>;
  getDocumentAnalysisByDocumentId(documentId: number): Promise<DocumentAnalysis | undefined>;
  getDocumentAnalysis(id: number): Promise<DocumentAnalysis | undefined>;
  createDocumentAnalysis(analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis>;
  updateDocumentAnalysis(id: number, analysis: Partial<DocumentAnalysis>): Promise<DocumentAnalysis | undefined>;
  
  // Pattern Recognition operations
  getPatterns(userId: number): Promise<Pattern[]>;
  getPattern(id: number): Promise<Pattern | undefined>;
  createPattern(pattern: InsertPattern): Promise<Pattern>;
  updatePattern(id: number, pattern: Partial<Pattern>): Promise<Pattern | undefined>;
  getRelatedPatterns(patternId: number): Promise<Pattern[]>;
  getPatternsByDocumentId(documentId: number): Promise<Pattern[]>;
  
  // Knowledge Context operations
  getKnowledgeContexts(userId: number): Promise<KnowledgeContext[]>;
  getKnowledgeContext(id: number): Promise<KnowledgeContext | undefined>;
  createKnowledgeContext(context: InsertKnowledgeContext): Promise<KnowledgeContext>;
  updateKnowledgeContext(id: number, context: Partial<KnowledgeContext>): Promise<KnowledgeContext | undefined>;
  getRelatedKnowledgeContexts(documentId: number): Promise<KnowledgeContext[]>;
  searchKnowledgeContexts(query: string, userId: number): Promise<KnowledgeContext[]>;
  
  // Impact Metrics operations
  getImpactMetrics(userId: number): Promise<ImpactMetric[]>;
  getImpactMetricsByType(userId: number, metricType: string): Promise<ImpactMetric[]>;
  getImpactMetric(id: number): Promise<ImpactMetric | undefined>;
  createImpactMetric(metric: InsertImpactMetric): Promise<ImpactMetric>;
  updateImpactMetric(id: number, metric: Partial<ImpactMetric>): Promise<ImpactMetric | undefined>;
  deleteImpactMetric(id: number): Promise<boolean>;
  getImpactMetricsSummary(userId: number): Promise<{ 
    metricType: string, 
    totalValue: number, 
    changePercentage: number, 
    recentMetrics: ImpactMetric[] 
  }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private campaigns: Map<number, Campaign>;
  private contents: Map<number, Content>;
  private activities: Map<number, Activity>;
  private documentAnalyses: Map<number, DocumentAnalysis>;
  private patterns: Map<number, Pattern>;
  private knowledgeContexts: Map<number, KnowledgeContext>;
  private impactMetrics: Map<number, ImpactMetric>;
  
  private userId: number;
  private documentId: number;
  private campaignId: number;
  private contentId: number;
  private activityId: number;
  private documentAnalysisId: number;
  private patternId: number;
  private knowledgeContextId: number;
  private impactMetricId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.campaigns = new Map();
    this.contents = new Map();
    this.activities = new Map();
    this.documentAnalyses = new Map();
    this.patterns = new Map();
    this.knowledgeContexts = new Map();
    this.impactMetrics = new Map();
    
    this.userId = 1;
    this.documentId = 1;
    this.campaignId = 1;
    this.contentId = 1;
    this.activityId = 1;
    this.documentAnalysisId = 1;
    this.patternId = 1;
    this.knowledgeContextId = 1;
    this.impactMetricId = 1;

    // Demo-Benutzer 1: Menschenrechtsanwältin
    this.createUser({
      username: "sarah",
      email: "sarah.mueller@example.org",
      password: "Passwort123",
      fullName: "Sarah Müller",
      role: "lawyer",
      profileImage: "",
      organization: "Menschenrechte Deutschland e.V.",
      country: "Germany",
      language: "de",
      expertise: ["freedom of speech", "digital rights"],
      bio: "Menschenrechtsanwältin mit 10 Jahren Erfahrung in digitalen Rechten und Meinungsfreiheit."
    });
    
    // Demo-Benutzer 2: Aktivist
    this.createUser({
      username: "markus",
      email: "markus.schmidt@example.org",
      password: "Passwort123",
      fullName: "Markus Schmidt",
      role: "activist",
      profileImage: "",
      organization: "Amnesty International",
      country: "Austria",
      language: "de",
      expertise: ["campaigning", "protest coordination"],
      bio: "Aktivist mit Schwerpunkt auf Organisation von Kampagnen für Meinungsfreiheit."
    });

    // Add some sample demo documents
    this.createDocument({
      userId: 1,
      title: "Witness_Statements_May2023.pdf",
      description: "Witness statements from the May 2023 investigation",
      fileType: "pdf",
      fileSize: 3200000, // 3.2MB
      filePath: "/uploads/Witness_Statements_May2023.pdf",
      source: "local",
      tags: ["witnesses", "may2023", "investigation"]
    });
    
    this.createDocument({
      userId: 1,
      title: "Legal_Brief_CaseXYZ.docx",
      description: "Legal brief for Case XYZ",
      fileType: "docx",
      fileSize: 1800000, // 1.8MB
      filePath: "/uploads/Legal_Brief_CaseXYZ.docx",
      source: "local",
      tags: ["legal", "brief", "caseXYZ"]
    });

    // Add demo campaigns
    this.createCampaign({
      userId: 1,
      title: "Clean Water Initiative",
      description: "Campaign focused on access to clean water",
      status: "active",
      progress: 68,
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      participants: 12
    });
    
    this.createCampaign({
      userId: 1,
      title: "Freedom of Expression",
      description: "Campaign advocating for freedom of expression",
      status: "planning",
      progress: 25,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      participants: 8
    });
    
    this.createCampaign({
      userId: 1,
      title: "Education for All",
      description: "Campaign for universal education access",
      status: "drafting",
      progress: 42,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      participants: 5
    });

    // Add demo activities
    this.createActivity({
      userId: 1,
      type: "analysis",
      description: "AI Analysis Complete on Human Rights Report 2023",
      metadata: {
        detailText: "Found 24 key topics and 8 potential action items",
        documentId: 1,
        timestamp: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      }
    });
    
    this.createActivity({
      userId: 1,
      type: "campaign",
      description: "Campaign \"Clean Water Initiative\" launched",
      metadata: {
        detailText: "Generated 5 social media posts and 1 press release",
        campaignId: 1,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    });
    
    this.createActivity({
      userId: 1,
      type: "share",
      description: "Elena Rodriguez shared documents with you",
      metadata: {
        detailText: "3 legal documents related to Case #45678",
        documentIds: [1, 2],
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    });
    
    this.createActivity({
      userId: 1,
      type: "alert",
      description: "Alert: New legislation identified",
      metadata: {
        detailText: "Found new legal framework that may impact ongoing cases",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    });
    
    // Beispiel-Impact-Metriken für Demo-Dashboard
    this.createImpactMetric({
      userId: 1,
      metricType: "advocacy",
      metricName: "Pressemitteilungen",
      value: 12,
      previousValue: 8,
      unit: "count",
      color: "blue",
      icon: "newspaper",
      description: "Anzahl der veröffentlichten Pressemitteilungen",
      goal: 20,
      region: "Deutschland",
      tags: ["presse", "advocacy"],
      impactStory: "Unsere Pressemitteilungen haben zu 3 Interviews in nationalen Medien geführt.",
      visualType: "bar"
    });
    
    this.createImpactMetric({
      userId: 1,
      metricType: "advocacy",
      metricName: "Social Media Reichweite",
      value: 45000,
      previousValue: 32000,
      unit: "people",
      color: "green",
      icon: "users",
      description: "Geschätzte Reichweite unserer Social-Media-Kampagnen",
      goal: 100000,
      tags: ["social", "reichweite"],
      impactStory: "Die Kampagne #MenschenrechteJetzt erreichte über 45.000 Menschen auf verschiedenen Plattformen.",
      visualType: "line"
    });
    
    this.createImpactMetric({
      userId: 1,
      metricType: "legal",
      metricName: "Bearbeitete Fälle",
      value: 24,
      previousValue: 18,
      unit: "count",
      color: "yellow",
      icon: "file-text",
      description: "Anzahl der bearbeiteten Rechtsfälle",
      tags: ["legal", "cases"],
      visualType: "bar"
    });
    
    this.createImpactMetric({
      userId: 1,
      metricType: "legal",
      metricName: "Erfolgreiche Klagen",
      value: 7,
      previousValue: 4,
      unit: "count",
      color: "purple",
      icon: "award",
      description: "Anzahl der erfolgreich abgeschlossenen Klagen",
      tags: ["legal", "success"],
      impactStory: "In diesem Jahr haben wir bereits 7 erfolgreiche Klagen abgeschlossen, darunter den wichtigen Fall XYZ.",
      visualType: "bar"
    });
    
    this.createImpactMetric({
      userId: 1,
      metricType: "education",
      metricName: "Workshop-Teilnehmer",
      value: 350,
      previousValue: 290,
      unit: "people",
      color: "orange",
      icon: "users",
      description: "Anzahl der Workshop-Teilnehmer*innen",
      goal: 500,
      region: "DACH",
      tags: ["bildung", "workshops"],
      impactStory: "Unsere Workshops zum Thema digitale Rechte erreichten 350 Menschen in Deutschland, Österreich und der Schweiz.",
      visualType: "pie"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const newUser: User = { 
      id,
      username: user.username,
      password: user.password !== undefined ? user.password : null,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      profileImage: user.profileImage || null,
      organization: user.organization || null,
      country: user.country || null,
      language: user.language || "de",
      expertise: user.expertise || null,
      bio: user.bio || null,
      securitySettings: user.securitySettings || {},
      googleId: user.googleId || null,
      authProvider: user.authProvider || "local",
      createdAt
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async authenticateUser(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return undefined;
    }
    
    // Wenn der Benutzer über Google authentifiziert ist und kein Passwort hat
    if (user.authProvider === 'google' && !user.password) {
      return undefined; // Sollte die Google-Authentifizierung verwenden
    }
    
    // Standard-Passwortüberprüfung für lokale Benutzer
    if (user.password !== password) {
      return undefined;
    }
    
    return user;
  }

  // Document operations
  async getDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.userId === userId
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const uploadedAt = new Date();
    const newDocument: Document = { 
      ...document, 
      id, 
      uploadedAt,
      source: document.source || "local",
      description: document.description || null,
      tags: document.tags || null
    };
    this.documents.set(id, newDocument);
    
    // Create an activity for document upload
    this.createActivity({
      userId: document.userId,
      type: "upload",
      description: `Document "${document.title}" uploaded`,
      metadata: {
        documentId: id,
        fileType: document.fileType,
        fileSize: document.fileSize,
        source: document.source || "local"
      }
    });
    
    return newDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Campaign operations
  async getCampaigns(userId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.userId === userId
    );
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.campaignId++;
    const newCampaign: Campaign = { 
      ...campaign, 
      id,
      status: campaign.status || "draft",
      description: campaign.description || null,
      progress: campaign.progress || 0,
      startDate: campaign.startDate || null,
      endDate: campaign.endDate || null,
      participants: campaign.participants || 0
    };
    this.campaigns.set(id, newCampaign);
    
    // Create an activity for campaign creation
    this.createActivity({
      userId: campaign.userId,
      type: "campaign",
      description: `Campaign "${campaign.title}" created`,
      metadata: {
        campaignId: id,
        status: campaign.status || "draft"
      }
    });
    
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined> {
    const existingCampaign = this.campaigns.get(id);
    if (!existingCampaign) {
      return undefined;
    }
    
    const updatedCampaign = { ...existingCampaign, ...campaign };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  // Content operations
  async getContents(userId: number): Promise<Content[]> {
    return Array.from(this.contents.values()).filter(
      (content) => content.userId === userId
    );
  }

  async getContent(id: number): Promise<Content | undefined> {
    return this.contents.get(id);
  }

  async createContent(content: InsertContent): Promise<Content> {
    const id = this.contentId++;
    const createdAt = new Date();
    const newContent: Content = { 
      ...content, 
      id, 
      createdAt,
      dataSources: content.dataSources || null,
      isSaved: content.isSaved || false
    };
    this.contents.set(id, newContent);
    
    // Create an activity for content generation
    this.createActivity({
      userId: content.userId,
      type: "content",
      description: `Content "${content.title}" generated`,
      metadata: {
        contentId: id,
        contentType: content.type,
        isSaved: content.isSaved || false
      }
    });
    
    return newContent;
  }

  async updateContent(id: number, content: Partial<Content>): Promise<Content | undefined> {
    const existingContent = this.contents.get(id);
    if (!existingContent) {
      return undefined;
    }
    
    const updatedContent = { ...existingContent, ...content };
    this.contents.set(id, updatedContent);
    return updatedContent;
  }

  // Activity operations
  async getActivities(userId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const createdAt = new Date();
    const newActivity: Activity = { 
      ...activity, 
      id, 
      createdAt,
      metadata: activity.metadata || {} 
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Document Analysis operations
  async getDocumentAnalyses(userId: number): Promise<DocumentAnalysis[]> {
    return Array.from(this.documentAnalyses.values()).filter(
      (analysis) => analysis.userId === userId
    );
  }

  async getDocumentAnalysisByDocumentId(documentId: number): Promise<DocumentAnalysis | undefined> {
    return Array.from(this.documentAnalyses.values()).find(
      (analysis) => analysis.documentId === documentId
    );
  }

  async getDocumentAnalysis(id: number): Promise<DocumentAnalysis | undefined> {
    return this.documentAnalyses.get(id);
  }

  async createDocumentAnalysis(analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis> {
    const id = this.documentAnalysisId++;
    const analysisDate = new Date();
    const newAnalysis: DocumentAnalysis = {
      ...analysis,
      id,
      analysisDate,
      status: analysis.status || "pending",
      topics: analysis.topics || null,
      entities: analysis.entities || [],
      sentiment: analysis.sentiment || null,
      keyFindings: analysis.keyFindings || null,
      legalReferences: analysis.legalReferences || [],
      suggestedActions: analysis.suggestedActions || null,
      contradictions: analysis.contradictions || [],
      confidence: analysis.confidence || 0,
      metadata: analysis.metadata || {}
    };
    this.documentAnalyses.set(id, newAnalysis);

    // Create an activity for analysis completion
    this.createActivity({
      userId: analysis.userId,
      type: "analysis",
      description: `Document analysis completed for document #${analysis.documentId}`,
      metadata: {
        documentId: analysis.documentId,
        analysisId: id,
        topics: analysis.topics || [],
        keyFindings: (analysis.keyFindings || []).length
      }
    });

    return newAnalysis;
  }

  async updateDocumentAnalysis(id: number, analysis: Partial<DocumentAnalysis>): Promise<DocumentAnalysis | undefined> {
    const existingAnalysis = this.documentAnalyses.get(id);
    if (!existingAnalysis) {
      return undefined;
    }

    const updatedAnalysis = { ...existingAnalysis, ...analysis };
    this.documentAnalyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  // Pattern Recognition operations
  async getPatterns(userId: number): Promise<Pattern[]> {
    return Array.from(this.patterns.values()).filter(
      (pattern) => pattern.userId === userId
    );
  }

  async getPattern(id: number): Promise<Pattern | undefined> {
    return this.patterns.get(id);
  }

  async createPattern(pattern: InsertPattern): Promise<Pattern> {
    const id = this.patternId++;
    const firstDetected = new Date();
    
    // Create a new Pattern object with defaults for optional fields
    const newPattern: Pattern = {
      id,
      userId: pattern.userId,
      name: pattern.name,
      description: pattern.description || null,
      patternType: pattern.patternType,
      criteria: pattern.criteria,
      documentIds: pattern.documentIds || null,
      detectedCount: pattern.detectedCount || 1,
      firstDetected,
      lastDetected: null,
      status: pattern.status || "active",
      priority: pattern.priority || "medium",
      geographicScope: pattern.geographicScope || {},
      temporalTrends: pattern.temporalTrends || {},
      relatedPatternIds: pattern.relatedPatternIds || null,
      notes: pattern.notes || null
    };
    
    this.patterns.set(id, newPattern);

    // Create an activity for pattern detection
    this.createActivity({
      userId: pattern.userId,
      type: "pattern",
      description: `New pattern detected: ${pattern.name}`,
      metadata: {
        patternId: id,
        patternType: pattern.patternType,
        priority: pattern.priority || "medium",
        documentCount: (pattern.documentIds || []).length
      }
    });

    return newPattern;
  }

  async updatePattern(id: number, pattern: Partial<Pattern>): Promise<Pattern | undefined> {
    const existingPattern = this.patterns.get(id);
    if (!existingPattern) {
      return undefined;
    }
    
    const updatedPattern = { ...existingPattern, ...pattern };
    
    // If lastDetected is being updated automatically when detectedCount increases
    if (pattern.detectedCount !== undefined && pattern.detectedCount > existingPattern.detectedCount) {
      updatedPattern.lastDetected = new Date();
    }
    
    this.patterns.set(id, updatedPattern);
    return updatedPattern;
  }

  async getRelatedPatterns(patternId: number): Promise<Pattern[]> {
    const pattern = this.patterns.get(patternId);
    if (!pattern || !pattern.relatedPatternIds || pattern.relatedPatternIds.length === 0) {
      return [];
    }
    
    return Array.from(this.patterns.values()).filter(
      (p) => pattern.relatedPatternIds && pattern.relatedPatternIds.includes(p.id)
    );
  }

  async getPatternsByDocumentId(documentId: number): Promise<Pattern[]> {
    return Array.from(this.patterns.values()).filter(
      (pattern) => pattern.documentIds && pattern.documentIds.includes(documentId)
    );
  }

  // Knowledge Context operations
  async getKnowledgeContexts(userId: number): Promise<KnowledgeContext[]> {
    return Array.from(this.knowledgeContexts.values()).filter(
      (context) => context.userId === userId && context.isActive
    );
  }

  async getKnowledgeContext(id: number): Promise<KnowledgeContext | undefined> {
    const context = this.knowledgeContexts.get(id);
    if (!context || !context.isActive) {
      return undefined;
    }
    return context;
  }

  async createKnowledgeContext(context: InsertKnowledgeContext): Promise<KnowledgeContext> {
    const id = this.knowledgeContextId++;
    const createdAt = new Date();
    
    const newContext: KnowledgeContext = {
      id,
      userId: context.userId,
      title: context.title,
      source: context.source,
      sourceId: context.sourceId || null,
      contentType: context.contentType,
      content: context.content || null,
      metadata: context.metadata || {},
      tags: context.tags || null,
      relatedDocumentIds: context.relatedDocumentIds || null,
      relationStrength: context.relationStrength || 0,
      createdAt,
      updatedAt: null,
      isActive: context.isActive ?? true
    };
    
    this.knowledgeContexts.set(id, newContext);
    
    // Create an activity for knowledge context creation
    this.createActivity({
      userId: context.userId,
      type: "knowledge",
      description: `Knowledge context "${context.title}" created`,
      metadata: {
        contextId: id,
        source: context.source,
        contentType: context.contentType
      }
    });
    
    return newContext;
  }

  async updateKnowledgeContext(id: number, context: Partial<KnowledgeContext>): Promise<KnowledgeContext | undefined> {
    const existingContext = this.knowledgeContexts.get(id);
    if (!existingContext || !existingContext.isActive) {
      return undefined;
    }
    
    const updatedContext = { 
      ...existingContext, 
      ...context,
      updatedAt: new Date()
    };
    
    this.knowledgeContexts.set(id, updatedContext);
    return updatedContext;
  }

  async getRelatedKnowledgeContexts(documentId: number): Promise<KnowledgeContext[]> {
    return Array.from(this.knowledgeContexts.values()).filter(
      (context) => 
        context.isActive && 
        context.relatedDocumentIds && 
        context.relatedDocumentIds.includes(documentId)
    );
  }

  async searchKnowledgeContexts(query: string, userId: number): Promise<KnowledgeContext[]> {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.knowledgeContexts.values()).filter(
      (context) => {
        if (context.userId !== userId || !context.isActive) {
          return false;
        }
        
        // Simple text search in title and content
        return context.title.toLowerCase().includes(lowercaseQuery) || 
              (context.content && context.content.toLowerCase().includes(lowercaseQuery));
      }
    );
  }
  
  // Impact Metrics operations
  async getImpactMetrics(userId: number): Promise<ImpactMetric[]> {
    return Array.from(this.impactMetrics.values()).filter(
      (metric) => metric.userId === userId
    );
  }

  async getImpactMetricsByType(userId: number, metricType: string): Promise<ImpactMetric[]> {
    return Array.from(this.impactMetrics.values()).filter(
      (metric) => metric.userId === userId && metric.metricType === metricType
    );
  }

  async getImpactMetric(id: number): Promise<ImpactMetric | undefined> {
    return this.impactMetrics.get(id);
  }

  async createImpactMetric(metric: InsertImpactMetric): Promise<ImpactMetric> {
    const id = this.impactMetricId++;
    const timestamp = new Date();
    
    // Create a new ImpactMetric object with defaults for optional fields
    const newMetric: ImpactMetric = {
      id,
      userId: metric.userId,
      metricType: metric.metricType,
      metricName: metric.metricName,
      value: metric.value,
      previousValue: metric.previousValue || null,
      unit: metric.unit || "count",
      color: metric.color || "primary",
      icon: metric.icon || "trending_up",
      description: metric.description || null,
      goal: metric.goal || null,
      timestamp,
      region: metric.region || null,
      tags: metric.tags || null,
      impactStory: metric.impactStory || null,
      dataSource: metric.dataSource || null,
      visualType: metric.visualType || "bar"
    };
    
    this.impactMetrics.set(id, newMetric);

    // Create an activity for metric creation
    this.createActivity({
      userId: metric.userId,
      type: "impact",
      description: `Impact metric "${metric.metricName}" created`,
      metadata: {
        metricId: id,
        metricType: metric.metricType,
        value: metric.value,
        unit: metric.unit || "count"
      }
    });

    return newMetric;
  }

  async updateImpactMetric(id: number, metric: Partial<ImpactMetric>): Promise<ImpactMetric | undefined> {
    const existingMetric = this.impactMetrics.get(id);
    if (!existingMetric) {
      return undefined;
    }

    const updatedMetric = { ...existingMetric, ...metric };
    this.impactMetrics.set(id, updatedMetric);
    
    // Create an activity for metric update if value changed
    if (metric.value !== undefined && metric.value !== existingMetric.value) {
      this.createActivity({
        userId: existingMetric.userId,
        type: "impact",
        description: `Impact metric "${existingMetric.metricName}" updated`,
        metadata: {
          metricId: id,
          metricType: existingMetric.metricType,
          previousValue: existingMetric.value,
          newValue: metric.value,
          unit: existingMetric.unit
        }
      });
    }
    
    return updatedMetric;
  }

  async deleteImpactMetric(id: number): Promise<boolean> {
    return this.impactMetrics.delete(id);
  }

  async getImpactMetricsSummary(userId: number): Promise<{ 
    metricType: string, 
    totalValue: number, 
    changePercentage: number, 
    recentMetrics: ImpactMetric[] 
  }[]> {
    const metrics = await this.getImpactMetrics(userId);
    
    // Group metrics by type
    const metricsByType = metrics.reduce((groups, metric) => {
      const type = metric.metricType;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(metric);
      return groups;
    }, {} as Record<string, ImpactMetric[]>);
    
    // Calculate summary for each metric type
    return Object.entries(metricsByType).map(([type, typeMetrics]) => {
      // Sort by timestamp, newest first
      const sortedMetrics = [...typeMetrics].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      // Get recent metrics (last 5)
      const recentMetrics = sortedMetrics.slice(0, 5);
      
      // Calculate total value (sum of current values)
      const totalValue = typeMetrics.reduce((sum, metric) => sum + metric.value, 0);
      
      // Calculate change percentage (based on previous values where available)
      const metricsWithPrevious = typeMetrics.filter(m => m.previousValue !== null);
      
      let changePercentage = 0;
      if (metricsWithPrevious.length > 0) {
        const totalPrevious = metricsWithPrevious.reduce((sum, metric) => {
          return sum + (metric.previousValue || 0);
        }, 0);
        
        const totalCurrent = metricsWithPrevious.reduce((sum, metric) => sum + metric.value, 0);
        
        if (totalPrevious > 0) {
          changePercentage = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
        }
      }
      
      return {
        metricType: type,
        totalValue,
        changePercentage,
        recentMetrics
      };
    });
  }
}

export const storage = new MemStorage();
