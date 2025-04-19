/**
 * Learning-Paths API Routes
 * 
 * Diese Routen ermöglichen die Erstellung und Verwaltung von personalisierten Lernpfaden
 * für Menschenrechtsverteidiger basierend auf ihren Fähigkeiten, aktuellen Fällen und Interessen.
 */

import { Request, Response } from 'express';
import { HRDefenderCoach } from '../services/hr-defender-coach';
import { getAIService } from '../services/ai-service';

/**
 * Router-Funktion zur Registrierung der Learning-Paths-Routen
 * @param app Express-App
 */
export function registerLearningPathsRoutes(app: any) {
  /**
   * Generiert einen personalisierten Lernplan basierend auf dem Benutzerprofil
   * und aktuellen Fällen. Verwendet den HR-Defender-Coach-Service.
   * 
   * POST /api/learning/generate-plan
   */
  app.post('/api/learning/generate-plan', async (req: Request, res: Response) => {
    try {
      // Benutzer-ID aus der Session oder dem Request extrahieren
      const userId = req.session?.userId || req.body.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Nicht autorisiert. Bitte zuerst anmelden.' 
        });
      }
      
      // Benutzerprofil aus dem Request oder aus der Datenbank abrufen
      const userProfile = req.body.userProfile || await getUserProfile(userId);
      
      if (!userProfile) {
        return res.status(404).json({ 
          error: 'Benutzerprofil nicht gefunden.' 
        });
      }
      
      // Lernplanoptionen aus dem Request extrahieren
      const planOptions = {
        storageType: req.body.storageType,
        dataSources: req.body.dataSources,
        includeOhchrResources: req.body.includeOhchrResources,
        aiModelPreference: req.body.aiModelPreference,
        difficulty: req.body.difficulty,
        focusArea: req.body.focusArea,
        maxDurationDays: req.body.maxDurationDays
      };
      
      console.log("Lernplanoptionen:", planOptions);
      
      // AI-Service-Instanz abrufen
      const aiService = getAIService();
      
      // HR-Defender-Coach initialisieren mit Benutzeroptionen
      const coach = new HRDefenderCoach(aiService, userProfile, planOptions);
      
      // Lernplan generieren mit KI-Optionen
      const learningPlan = await coach.generateLearningPlan({
        temperature: 0.3, // Leicht kreativ, aber noch fokussiert
        maxTokens: 2048, // Ausreichend Token für komplexe Antworten
        model: planOptions.aiModelPreference // Verwende das vom Benutzer gewählte Modell
      });
      
      // Erfolgreiche Antwort senden
      res.status(200).json({
        success: true,
        plan: learningPlan
      });
      
    } catch (error: any) {
      console.error('Fehler beim Generieren des Lernplans:', error);
      res.status(500).json({ 
        error: 'Es ist ein Fehler aufgetreten: ' + error.message 
      });
    }
  });
  
  /**
   * Ruft den aktuellen oder neuesten Lernplan eines Benutzers ab
   * 
   * GET /api/learning/current-plan/:userId
   */
  app.get('/api/learning/current-plan/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Aktuellen Lernplan aus der Datenbank abrufen
      // Hier würden wir eine Datenbankabfrage durchführen
      
      // Simulierte Antwort für den Prototyp
      const mockPlan = {
        id: 123,
        userId: userId,
        createdAt: new Date(),
        // Weitere Plandaten...
        status: 'active'
      };
      
      res.status(200).json(mockPlan);
      
    } catch (error: any) {
      console.error('Fehler beim Abrufen des Lernplans:', error);
      res.status(500).json({ 
        error: 'Es ist ein Fehler aufgetreten: ' + error.message 
      });
    }
  });
  
  /**
   * Ruft eine Liste aller verfügbaren Lernmodule ab
   * 
   * GET /api/learning/modules
   */
  app.get('/api/learning/modules', async (req: Request, res: Response) => {
    try {
      // In einer realen Anwendung würden die Module aus einer Datenbank kommen
      const modules = [
        { id: 'lm001', title: 'Grundlagen Int. Menschenrechtsrecht', type: 'reading', estimatedTime: 120 },
        { id: 'lm002', title: 'Interviewtechniken für Zeugen', type: 'video', estimatedTime: 60 },
        { id: 'lm003', title: 'Digitale Sicherheit Basics', type: 'simulation', estimatedTime: 90 },
        { id: 'lm004', title: 'Dokumentation von Menschenrechtsverletzungen', type: 'reading', estimatedTime: 75 },
        { id: 'lm005', title: 'Kampagnenplanung und -durchführung', type: 'video', estimatedTime: 90 },
        { id: 'lm006', title: 'Rechtliche Recherche: Fortgeschrittene Methoden', type: 'reading', estimatedTime: 120 },
        { id: 'lm007', title: 'Interviewtechniken: Traumasensible Gesprächsführung', type: 'video', estimatedTime: 100 },
        { id: 'lm008', title: 'Verschlüsselung und sichere Kommunikation', type: 'simulation', estimatedTime: 120 },
      ];
      
      res.status(200).json(modules);
      
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Lernmodule:', error);
      res.status(500).json({ 
        error: 'Es ist ein Fehler aufgetreten: ' + error.message 
      });
    }
  });
}

/**
 * Hilfsfunktion zum Abrufen eines Benutzerprofils
 * In einer realen Anwendung würde dies aus einer Datenbank kommen
 */
async function getUserProfile(userId: number) {
  // Simuliere eine Datenbankabfrage
  console.log(`Benutzerprofil für User ${userId} abrufen`);
  
  // Dummy-Daten für den Prototyp
  return {
    userId: userId,
    skills: ['Documentation', 'Legal Research', 'Interviewing'],
    interests: ['International Law', 'Digital Security', 'Community Organizing'],
    learningHistory: [
      { moduleId: 'lm001', completedAt: new Date('2023-01-15'), score: 92 },
      { moduleId: 'lm003', completedAt: new Date('2023-02-20'), score: 85 }
    ],
    activeCases: [
      { 
        id: 1, 
        title: 'Dokumentation von Menschenrechtsverletzungen in Region X', 
        category: 'Documentation',
        description: 'Sammlung und Dokumentation von Zeugenaussagen zu Menschenrechtsverletzungen.' 
      },
      { 
        id: 2, 
        title: 'Rechtliche Unterstützung für Journalist*innen', 
        category: 'Legal Support',
        description: 'Rechtliche Beratung und Unterstützung für gefährdete Journalist*innen.' 
      }
    ],
    role: 'Field Researcher'
  };
}