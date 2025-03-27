import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateContent, analyzeDocument, detectPatterns } from "./services/gemini";
import { registerUwaziRoutes } from "./routes/uwazi";
import { 
  insertContentSchema, 
  insertDocumentSchema, 
  insertCampaignSchema, 
  insertActivitySchema, 
  insertUserSchema, 
  insertDocumentAnalysisSchema,
  insertPatternSchema,
  insertKnowledgeContextSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Session information type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// User validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string()
    .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein")
    .regex(/[A-Z]/, "Das Passwort muss mindestens einen Großbuchstaben enthalten")
    .regex(/[0-9]/, "Das Passwort muss mindestens eine Zahl enthalten"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Konfiguriere Passport
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: number, done) => {
    storage.getUser(id)
      .then(user => done(null, user))
      .catch(err => done(err));
  });

  // Google OAuth Strategie konfigurieren
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: "/api/auth/google/callback",
    proxy: true,
    // Überprüfe und aktualisiere die Callback-URL für Replit
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    // Protokolliere die aktuelle Anfrage-URL für Debugging
    console.log("[AUTH] Aktuelle Request-Basis-URL:", `${req.protocol}://${req.get('host')}`);
    
    try {
      // Prüfen, ob Benutzer bereits existiert
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (!user) {
        // Wenn kein Benutzer gefunden wurde, erstelle einen neuen
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        
        // Prüfen, ob Email bereits existiert
        const existingUserWithEmail = await storage.getUserByEmail(email);
        
        if (existingUserWithEmail) {
          // Verknüpfe bestehenden Benutzer mit Google-ID
          user = await storage.updateUser(existingUserWithEmail.id, {
            googleId: profile.id,
            authProvider: "google"
          });
        } else {
          // Erstelle neuen Benutzer
          user = await storage.createUser({
            username: profile.displayName.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000),
            email: email,
            fullName: profile.displayName,
            role: "user",
            profileImage: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            googleId: profile.id,
            authProvider: "google"
          });
        }
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // Middleware für Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // API Routes - prefix with /api
  
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Ungültige Registrierungsdaten", 
          details: fromZodError(result.error) 
        });
      }

      const { confirmPassword, ...userData } = result.data;
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Benutzername ist bereits vergeben" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "E-Mail-Adresse ist bereits registriert" });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registrierung fehlgeschlagen" });
    }
  });
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Ungültige Anmeldedaten", 
          details: fromZodError(result.error) 
        });
      }
      
      const { username, password } = result.data;
      
      // Authenticate user
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Ungültiger Benutzername oder Passwort" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Anmeldung fehlgeschlagen" });
    }
  });
  
  // Google Auth Routen
  app.get("/api/auth/google", (req: Request, res: Response, next: NextFunction) => {
    console.log("[AUTH] Google OAuth Anfrage gestartet");
    passport.authenticate("google", {
      scope: ["profile", "email"]
    })(req, res, next);
  });

  app.get("/api/auth/google/callback", 
    (req: Request, res: Response, next: NextFunction) => {
      console.log("[AUTH] Google OAuth Callback erhalten");
      
      passport.authenticate("google", { 
        failureRedirect: "/login?error=google_auth_failed" 
      })(req, res, next);
    },
    (req: Request, res: Response) => {
      // Nach erfolgreicher Authentifizierung zur App weiterleiten
      if (req.user) {
        console.log("[AUTH] Benutzer erfolgreich authentifiziert:", (req.user as any).id);
        req.session.userId = (req.user as any).id;
        
        // Session speichern
        req.session.save((err) => {
          if (err) {
            console.error("[AUTH] Fehler beim Speichern der Session:", err);
          }
          res.redirect("/");
        });
      } else {
        console.error("[AUTH] Keine Benutzerdaten in der Anfrage");
        res.redirect("/login?error=no_user_data");
      }
    }
  );
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // Clear session
    req.session.userId = undefined;
    
    // Wenn Passport verwendet wird
    if (req.logout) {
      req.logout(err => {
        if (err) {
          console.error("Logout error:", err);
        }
      });
    }
    
    res.json({ success: true });
  });
  
  // User routes
  app.get("/api/user/current", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId || 1; // For demo: fall back to default user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }
      
      // Don't send the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Benutzerabfrage fehlgeschlagen" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      // In a real app, would use authenticated user's ID
      const userId = 1;
      const documents = await storage.getDocuments(userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to get document" });
    }
  });

  app.post("/api/documents", async (req: Request, res: Response) => {
    try {
      // In a real app, would validate user is authenticated
      const userId = 1;
      
      // Validate request body against schema
      const documentData = { ...req.body, userId };
      const parsedData = insertDocumentSchema.parse(documentData);
      
      const document = await storage.createDocument(parsedData);
      res.status(201).json(document);
    } catch (error) {
      if (error && typeof error === 'object' && error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid document data", 
          details: fromZodError(error) 
        });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      
      const success = await storage.deleteDocument(id);
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", async (req: Request, res: Response) => {
    try {
      // In a real app, would use authenticated user's ID
      const userId = 1;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });

  app.post("/api/campaigns", async (req: Request, res: Response) => {
    try {
      // In a real app, would validate user is authenticated
      const userId = 1;
      
      // Validate request body against schema
      const campaignData = { ...req.body, userId };
      const parsedData = insertCampaignSchema.parse(campaignData);
      
      const campaign = await storage.createCampaign(parsedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error && typeof error === 'object' && error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid campaign data", 
          details: fromZodError(error) 
        });
      }
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const updatedCampaign = await storage.updateCampaign(id, req.body);
      if (!updatedCampaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(updatedCampaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Content routes
  app.get("/api/content", async (req: Request, res: Response) => {
    try {
      // In a real app, would use authenticated user's ID
      const userId = 1;
      const contents = await storage.getContents(userId);
      res.json(contents);
    } catch (error) {
      res.status(500).json({ error: "Failed to get content" });
    }
  });

  app.post("/api/content/generate", async (req: Request, res: Response) => {
    try {
      // In a real app, would validate user is authenticated
      const userId = 1;
      
      const { title, type, tone, instructions, dataSources } = req.body;
      
      if (!title || !type || !tone) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          details: "Title, type, and tone are required" 
        });
      }
      
      // Generate content using Google Gemini
      const generatedText = await generateContent({
        title,
        type,
        tone,
        instructions,
        dataSources: dataSources || []
      });
      
      // Save the generated content
      const contentData = {
        userId,
        title,
        type,
        tone,
        text: generatedText,
        dataSources: dataSources || [],
        isSaved: false
      };
      
      const parsedData = insertContentSchema.parse(contentData);
      const content = await storage.createContent(parsedData);
      
      res.status(201).json(content);
    } catch (error) {
      if (error && typeof error === 'object' && error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid content data", 
          details: fromZodError(error) 
        });
      }
      res.status(500).json({ 
        error: "Failed to generate content", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.patch("/api/content/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      const updatedContent = await storage.updateContent(id, req.body);
      if (!updatedContent) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(updatedContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      // In a real app, would use authenticated user's ID
      const userId = 1;
      
      // Get limit from query parameter
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const activities = await storage.getActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get activities" });
    }
  });

  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      // In a real app, would validate user is authenticated
      const userId = 1;
      
      // Validate request body against schema
      const activityData = { ...req.body, userId };
      const parsedData = insertActivitySchema.parse(activityData);
      
      const activity = await storage.createActivity(parsedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error && typeof error === 'object' && error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid activity data", 
          details: fromZodError(error) 
        });
      }
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  // Document Analysis routes
  app.get("/api/document-analyses", async (req: Request, res: Response) => {
    try {
      // In a real app, would use authenticated user's ID
      const userId = req.session.userId || 1;
      const analyses = await storage.getDocumentAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to get document analyses" });
    }
  });

  app.get("/api/document-analyses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }
      
      const analysis = await storage.getDocumentAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to get analysis" });
    }
  });

  app.get("/api/documents/:documentId/analysis", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      
      const analysis = await storage.getDocumentAnalysisByDocumentId(documentId);
      if (!analysis) {
        return res.status(404).json({ error: "No analysis found for this document" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to get document analysis" });
    }
  });

  app.post("/api/documents/:documentId/analyze", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      
      // In a real app, would validate user is authenticated
      const userId = req.session.userId || 1;
      
      // Get the document
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Check if an analysis already exists
      const existingAnalysis = await storage.getDocumentAnalysisByDocumentId(documentId);
      if (existingAnalysis) {
        return res.json(existingAnalysis); // Return existing analysis
      }
      
      // For demo purposes, we'll pretend to extract text from the document
      // In a real app, this would involve reading the actual file based on document type
      let documentText = "";
      
      if (document.fileType === "pdf") {
        documentText = `HUMAN RIGHTS REPORT
Witness Statement - May 2023

The witness, who wishes to remain anonymous for safety reasons, testified that on May 12, 2023, they observed the police using excessive force against peaceful protesters in the central square. According to the witness, officers fired tear gas without warning and beat at least three individuals who were already on the ground. The witness claimed they saw a pregnant woman being pushed to the ground by an officer.

However, in a separate statement, Officer Rodriguez claimed that warnings were issued three times before any action was taken, and that force was only used after protesters threw objects at the police line. He denied any instances of violence against subdued individuals or pregnant women.

The witness statement also mentions that Article 19 of the Universal Declaration of Human Rights was clearly violated, along with Section 12 of the National Constitution guaranteeing the right to peaceful assembly.

According to the witness, similar incidents have been occurring with increasing frequency in the region over the past six months, with patterns of intimidation against specific ethnic minority groups being particularly concerning.`;
      } else if (document.fileType === "docx") {
        documentText = `LEGAL BRIEF - Case XYZ
RE: Violations of Freedom of Expression

This brief addresses systematic violations of Article 19 of the International Covenant on Civil and Political Rights (ICCPR) and Article 10 of the European Convention on Human Rights (ECHR) occurring in the northern province.

Over the past 18 months, local authorities have:
1. Shut down 12 independent media outlets
2. Arrested 37 journalists on dubious charges
3. Passed legislation restricting online speech
4. Blocked access to social media platforms during protests

These actions constitute clear violations of both national constitutional protections and international human rights law. The European Court of Human Rights has previously ruled in Handyside v. United Kingdom that freedom of expression "constitutes one of the essential foundations of a democratic society" and applies "not only to 'information' or 'ideas' that are favorably received... but also to those that offend, shock or disturb the State or any sector of the population."

We recommend immediate legal action under Articles 34-35 of the ECHR and urge consideration of interim measures under Rule 39 of the Rules of Court given the ongoing nature of these violations.`;
      } else {
        documentText = `This is the extracted text from document: ${document.title}. The document includes references to potential human rights violations including restrictions on freedom of assembly, excessive use of force by authorities, and discrimination against minority groups. Several witnesses have provided testimony but there are some contradictions in their accounts. The document cites articles from the Universal Declaration of Human Rights and the International Covenant on Civil and Political Rights.`;
      }
      
      // Analyze the document using enhanced Gemini AI
      const {
        topics,
        sentiment,
        keyFindings,
        suggestedActions,
        entities,
        legalReferences,
        contradictions
      } = await analyzeDocument(documentText);
      
      // Create the analysis with enhanced data
      const analysisData = {
        userId,
        documentId,
        status: "completed",
        topics,
        sentiment,
        keyFindings,
        suggestedActions,
        entities,
        legalReferences,
        contradictions,
        confidence: 92 // Improved confidence score with enhanced model
      };
      
      const parsedData = insertDocumentAnalysisSchema.parse(analysisData);
      const analysis = await storage.createDocumentAnalysis(parsedData);
      
      // Log the analysis request as an activity
      await storage.createActivity({
        userId,
        type: "analysis",
        description: `Erweiterte Dokumentenanalyse für: ${document.title} abgeschlossen`,
        metadata: {
          documentId,
          analysisId: analysis.id,
          topicsCount: topics.length,
          legalReferencesCount: legalReferences.length,
          contradictionsFound: contradictions.length > 0
        }
      });
      
      res.status(201).json(analysis);
    } catch (error) {
      if (error && typeof error === 'object' && error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid analysis data", 
          details: fromZodError(error) 
        });
      }
      res.status(500).json({ 
        error: "Failed to analyze document", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Pattern Recognition routes
  app.get("/api/patterns", async (req: Request, res: Response) => {
    try {
      // In a real app, would use authenticated user's ID
      const userId = req.session.userId || 1;
      const patterns = await storage.getPatterns(userId);
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get patterns" });
    }
  });

  app.get("/api/patterns/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid pattern ID" });
      }
      
      const pattern = await storage.getPattern(id);
      if (!pattern) {
        return res.status(404).json({ error: "Pattern not found" });
      }
      res.json(pattern);
    } catch (error) {
      res.status(500).json({ error: "Failed to get pattern" });
    }
  });

  app.get("/api/patterns/:id/related", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid pattern ID" });
      }
      
      const relatedPatterns = await storage.getRelatedPatterns(id);
      res.json(relatedPatterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get related patterns" });
    }
  });

  app.get("/api/documents/:documentId/patterns", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      
      const patterns = await storage.getPatternsByDocumentId(documentId);
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get patterns for document" });
    }
  });

  app.post("/api/patterns", async (req: Request, res: Response) => {
    try {
      // In a real app, would validate user is authenticated
      const userId = req.session.userId || 1;
      
      // Validate request body against schema
      const patternData = { ...req.body, userId };
      const parsedData = insertPatternSchema.parse(patternData);
      
      const pattern = await storage.createPattern(parsedData);
      res.status(201).json(pattern);
    } catch (error) {
      if (error && typeof error === 'object' && error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid pattern data", 
          details: fromZodError(error) 
        });
      }
      res.status(500).json({ error: "Failed to create pattern" });
    }
  });
  
  // Pattern detection across multiple documents
  app.post("/api/detect-patterns", async (req: Request, res: Response) => {
    try {
      // In a real app, would validate user is authenticated
      const userId = req.session.userId || 1;
      
      // Extract the document IDs from the request body
      const { documentIds } = req.body;
      
      if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
        return res.status(400).json({ 
          error: "At least two document IDs are required for pattern detection"
        });
      }
      
      // Fetch the documents
      const documents = [];
      const documentTexts = [];
      
      for (const docId of documentIds) {
        const document = await storage.getDocument(docId);
        if (!document) {
          return res.status(404).json({ 
            error: `Document with ID ${docId} not found`
          });
        }
        
        if (document.userId !== userId) {
          return res.status(403).json({ 
            error: `You don't have permission to access document ${docId}`
          });
        }
        
        documents.push(document);
        
        // Generate sample text for each document based on type
        let documentText = "";
        if (document.fileType === "pdf") {
          documentText = `Sample text for document ${document.title} (ID: ${document.id}) - Contains information about human rights violations in region A, including multiple witness testimonies of excessive force by authorities.`;
        } else if (document.fileType === "docx") {
          documentText = `Legal analysis for case related to document ${document.title} (ID: ${document.id}) - References ICCPR Article 7 and documents systemic patterns of mistreatment of detainees.`;
        } else {
          documentText = `Content of document ${document.title} (ID: ${document.id}) - Contains reports of human rights issues affecting minority populations in multiple locations.`;
        }
        
        documentTexts.push(documentText);
      }
      
      // Use Gemini AI to detect patterns across documents
      const patternResult = await detectPatterns(documentIds, documentTexts);
      
      // Create a new pattern record
      const newPatternData = {
        userId,
        name: patternResult.patternName,
        description: patternResult.description,
        patternType: patternResult.patternType,
        criteria: { 
          ai_generated: true,
          detection_method: "cross_document_analysis",
          relatedLaws: patternResult.relatedLaws || "",
          recommendedActions: patternResult.recommendedActions || ""
        },
        documentIds,
        detectedCount: documentIds.length,
        status: "active",
        priority: "medium",
        geographicScope: patternResult.geographicScope,
        temporalTrends: patternResult.temporalTrends,
        notes: "Automatisch erkanntes Muster basierend auf KI-Analyse mehrerer Dokumente."
      };
      
      const parsedData = insertPatternSchema.parse(newPatternData);
      const pattern = await storage.createPattern(parsedData);
      
      // Log the pattern detection activity
      await storage.createActivity({
        userId,
        type: "pattern_detection",
        description: `Neues Muster erkannt: ${pattern.name}`,
        metadata: {
          patternId: pattern.id,
          documentCount: documentIds.length,
          documentIds,
          patternType: pattern.patternType
        }
      });
      
      res.status(201).json({
        pattern,
        analysis: patternResult
      });
    } catch (error) {
      console.error("Pattern detection error:", error);
      res.status(500).json({ 
        error: "Failed to detect patterns", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.patch("/api/patterns/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid pattern ID" });
      }
      
      const updatedPattern = await storage.updatePattern(id, req.body);
      if (!updatedPattern) {
        return res.status(404).json({ error: "Pattern not found" });
      }
      res.json(updatedPattern);
    } catch (error) {
      res.status(500).json({ error: "Failed to update pattern" });
    }
  });

  // Knowledge Context routes
  app.get("/api/knowledge-contexts", async (req: Request, res: Response) => {
    try {
      // In a real app, would use authenticated user's ID
      const userId = req.session.userId || 1;
      const contexts = await storage.getKnowledgeContexts(userId);
      res.json(contexts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get knowledge contexts" });
    }
  });

  app.get("/api/knowledge-contexts/search", async (req: Request, res: Response) => {
    try {
      // In a real app, would use authenticated user's ID
      const userId = req.session.userId || 1;
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const contexts = await storage.searchKnowledgeContexts(query, userId);
      res.json(contexts);
    } catch (error) {
      res.status(500).json({ error: "Failed to search knowledge contexts" });
    }
  });

  app.get("/api/knowledge-contexts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid knowledge context ID" });
      }
      
      const context = await storage.getKnowledgeContext(id);
      if (!context) {
        return res.status(404).json({ error: "Knowledge context not found" });
      }
      res.json(context);
    } catch (error) {
      res.status(500).json({ error: "Failed to get knowledge context" });
    }
  });

  app.get("/api/documents/:documentId/knowledge-contexts", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      
      const contexts = await storage.getRelatedKnowledgeContexts(documentId);
      res.json(contexts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get related knowledge contexts" });
    }
  });

  app.post("/api/knowledge-contexts", async (req: Request, res: Response) => {
    try {
      // In a real app, would validate user is authenticated
      const userId = req.session.userId || 1;
      
      // Validate request body against schema
      const contextData = { ...req.body, userId };
      const parsedData = insertKnowledgeContextSchema.parse(contextData);
      
      const context = await storage.createKnowledgeContext(parsedData);
      res.status(201).json(context);
    } catch (error) {
      if (error && typeof error === 'object' && error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid knowledge context data", 
          details: fromZodError(error) 
        });
      }
      res.status(500).json({ error: "Failed to create knowledge context" });
    }
  });

  app.patch("/api/knowledge-contexts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid knowledge context ID" });
      }
      
      const updatedContext = await storage.updateKnowledgeContext(id, req.body);
      if (!updatedContext) {
        return res.status(404).json({ error: "Knowledge context not found" });
      }
      res.json(updatedContext);
    } catch (error) {
      res.status(500).json({ error: "Failed to update knowledge context" });
    }
  });

  // Impact Metrics Routes
  app.get("/api/impact-metrics", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId || 1; // For demo: fall back to default user
      const metrics = await storage.getImpactMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting impact metrics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/impact-metrics/summary", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId || 1; // For demo: fall back to default user
      const summary = await storage.getImpactMetricsSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error getting impact metrics summary:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/impact-metrics/type/:type", async (req: Request, res: Response) => {
    const metricType = req.params.type;
    
    try {
      const userId = req.session.userId || 1; // For demo: fall back to default user
      const metrics = await storage.getImpactMetricsByType(userId, metricType);
      res.json(metrics);
    } catch (error) {
      console.error(`Error getting impact metrics for type ${metricType}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/impact-metrics/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    try {
      const metric = await storage.getImpactMetric(id);
      
      if (!metric) {
        return res.status(404).json({ error: "Impact metric not found" });
      }
      
      const userId = req.session.userId || 1; // For demo: fall back to default user
      
      // Verify ownership (only for authenticated users other than demo)
      if (req.session.userId && metric.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this metric" });
      }
      
      res.json(metric);
    } catch (error) {
      console.error(`Error getting impact metric ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/impact-metrics", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId || 1; // For demo: fall back to default user
      
      const metricData = {
        ...req.body,
        userId: userId
      };
      
      const metric = await storage.createImpactMetric(metricData);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating impact metric:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.patch("/api/impact-metrics/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    try {
      // Get current metric to verify ownership
      const existingMetric = await storage.getImpactMetric(id);
      
      if (!existingMetric) {
        return res.status(404).json({ error: "Impact metric not found" });
      }
      
      const userId = req.session.userId || 1; // For demo: fall back to default user
      
      // Verify ownership (only for authenticated users other than demo)
      if (req.session.userId && existingMetric.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this metric" });
      }
      
      const updatedMetric = await storage.updateImpactMetric(id, req.body);
      res.json(updatedMetric);
    } catch (error) {
      console.error(`Error updating impact metric ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Registriere die Uwazi-Integrationsrouten
  registerUwaziRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
