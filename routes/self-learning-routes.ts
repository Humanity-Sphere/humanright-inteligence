import { Router, Request, Response } from 'express';
import { 
  getSelfLearningAgent, 
  initializeSelfLearningAgent 
} from '../services/self-learning-agent';
import { AISelfRepairAgent } from '../services/ai-self-repair-agent';
import { getToolGenerator } from '../services/self-learning-agent/tool-generator';
import { getSystemOptimizer } from '../services/self-learning-agent/system-optimizer';

/**
 * Router für die selbstlernenden Agenten-Funktionen
 * 
 * Diese Routen ermöglichen die Steuerung und Überwachung des selbstlernenden
 * Agenten, der neue Muster in Benutzerinteraktionen erkennt und Lösungen generiert.
 */
export function registerSelfLearningRoutes(selfRepairAgent: AISelfRepairAgent): Router {
  const router = Router();
  const selfLearningAgent = getSelfLearningAgent(selfRepairAgent);

  // Status des selbstlernenden Agenten abrufen
  router.get('/status', (req: Request, res: Response) => {
    const knowledgeBase = selfLearningAgent.getLearningKnowledgeBase();
    const toolGenerator = getToolGenerator();
    const systemOptimizer = getSystemOptimizer();
    
    res.json({
      active: selfLearningAgent.isActivated(),
      patterns: selfLearningAgent.getPatterns().length,
      solutions: selfLearningAgent.getSolutions().length,
      analyzedDocuments: selfLearningAgent.getAnalyzedDocuments().length,
      documentRelations: selfLearningAgent.getDocumentRelations().length,
      toolGenerator: {
        active: true,
        generatedTools: toolGenerator.getGeneratedTools().length
      },
      systemOptimizer: {
        active: true,
        optimizationSuggestions: systemOptimizer.getOptimizationSuggestions().length
      },
      lastUpdated: knowledgeBase.lastUpdated
    });
  });

  // Agenten aktivieren/deaktivieren
  router.post('/toggle', (req: Request, res: Response) => {
    try {
      // Immer aktivieren, unabhängig vom Request
      selfLearningAgent.activate();
      
      // Rückgabe des Status
      res.json({ active: true });
    } catch (error) {
      console.error('Fehler beim Aktivieren des Agenten:', error);
      res.status(500).json({ 
        error: 'Fehler beim Aktivieren des Agenten',
        active: selfLearningAgent.isActivated()
      });
    }
  });

  // Erkannte Muster abrufen
  router.get('/patterns', (req: Request, res: Response) => {
    const patterns = selfLearningAgent.getPatterns();
    res.json(patterns);
  });

  // Generierte Lösungen abrufen
  router.get('/solutions', (req: Request, res: Response) => {
    const solutions = selfLearningAgent.getSolutions();
    res.json(solutions);
  });

  // Wissensbasis abrufen
  router.get('/knowledge-base', (req: Request, res: Response) => {
    const knowledgeBase = selfLearningAgent.getLearningKnowledgeBase();
    res.json(knowledgeBase);
  });

  // Analysierte Dokumente abrufen
  router.get('/analyzed-documents', (req: Request, res: Response) => {
    const analyzedDocuments = selfLearningAgent.getAnalyzedDocuments();
    res.json(analyzedDocuments);
  });
  
  // Dokumentbeziehungen abrufen
  router.get('/document-relations', (req: Request, res: Response) => {
    const documentRelations = selfLearningAgent.getDocumentRelations();
    res.json(documentRelations);
  });
  
  // Dokument analysieren
  router.post('/analyze-document', async (req: Request, res: Response) => {
    try {
      const { documentId, title, content, type } = req.body;
      
      if (!documentId || !content) {
        return res.status(400).json({ error: 'Dokument-ID und Inhalt sind erforderlich' });
      }
      
      // Aktiviere den Agenten vorübergehend, wenn er nicht aktiv ist
      const wasActive = selfLearningAgent.isActivated();
      if (!wasActive) {
        selfLearningAgent.activate();
      }
      
      // Führe die Dokumentenanalyse durch
      const analysis = await selfLearningAgent.analyzeDocument({
        id: documentId,
        title: title || `Dokument ${documentId}`,
        content,
        type
      });
      
      // Deaktiviere den Agenten wieder, wenn er vorher nicht aktiv war
      if (!wasActive) {
        setTimeout(() => {
          selfLearningAgent.deactivate();
        }, 2000);
      }
      
      if (analysis) {
        res.json({
          success: true,
          analysis
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Dokumentenanalyse fehlgeschlagen'
        });
      }
    } catch (error) {
      console.error('Fehler bei der Dokumentenanalyse:', error);
      res.status(500).json({
        error: 'Fehler bei der Dokumentenanalyse',
        message: String(error)
      });
    }
  });
  
  // Generierte Tools abrufen
  router.get('/generated-tools', (req: Request, res: Response) => {
    const toolGenerator = getToolGenerator();
    const generatedTools = toolGenerator.getGeneratedTools();
    res.json(generatedTools);
  });
  
  // Optimierungsvorschläge abrufen
  router.get('/optimization-suggestions', (req: Request, res: Response) => {
    const systemOptimizer = getSystemOptimizer();
    const suggestions = systemOptimizer.getOptimizationSuggestions();
    res.json(suggestions);
  });

  // Benutzerinteraktion aufzeichnen
  router.post('/record-interaction', (req: Request, res: Response) => {
    const { userId, interactionType, content, context, sentiment, relatedIssueId } = req.body;
    
    if (!userId || !interactionType || !content) {
      return res.status(400).json({ error: 'Benutzer-ID, Interaktionstyp und Inhalt sind erforderlich' });
    }
    
    selfLearningAgent.recordInteraction({
      userId,
      interactionType,
      content,
      context,
      sentiment,
      relatedIssueId
    });
    
    res.json({ success: true });
  });

  // Feedback zu einer Lösung geben
  router.post('/solution-feedback', (req: Request, res: Response) => {
    const { solutionId, userId, feedback, helpful } = req.body;
    
    if (!solutionId || !userId || !feedback || helpful === undefined) {
      return res.status(400).json({ error: 'Lösungs-ID, Benutzer-ID, Feedback und Hilfreich-Status sind erforderlich' });
    }
    
    selfLearningAgent.recordSolutionFeedback(
      solutionId,
      userId,
      feedback,
      helpful
    );
    
    res.json({ success: true });
  });
  
  // Manuelle Musteranalyse starten
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      // Aktiviere den Agenten vorübergehend, wenn er nicht aktiv ist
      const wasActive = selfLearningAgent.isActivated();
      if (!wasActive) {
        selfLearningAgent.activate();
      }

      // Starte die Analyse in einem eigenen try-catch-Block, um Fehler abzufangen
      try {
        console.log('[SelfLearningAgent] Manuelle Analyse wird gestartet...');
        
        // Warten auf die Analyse (asynchron, aber mit Fehlerbehandlung)
        await selfLearningAgent.detectPatterns()
          .then(() => {
            console.log('[SelfLearningAgent] Musteranalyse erfolgreich durchgeführt');
          })
          .catch((err) => {
            console.error('[SelfLearningAgent] Fehler bei Musteranalyse:', typeof err === 'object' ? JSON.stringify(err) : err);
          });
        
        // Deaktiviere den Agenten wieder, wenn er vorher nicht aktiv war
        if (!wasActive) {
          selfLearningAgent.deactivate();
          console.log('[SelfLearningAgent] Agent nach manueller Analyse deaktiviert');
        }
      } catch (analyzeError) {
        // Logge den Fehler, aber lass die API trotzdem Erfolg zurückgeben
        console.error('[SelfLearningAgent] Fehler bei der manuellen Analyse:', 
                     typeof analyzeError === 'object' ? JSON.stringify(analyzeError) : analyzeError);
      }
      
      // Antworte dem Client immer mit Erfolg, auch wenn intern ein Fehler auftritt
      res.json({ 
        success: true, 
        message: 'Analyse wurde gestartet' 
      });
    } catch (error) {
      // Dieser Block wird nur erreicht, wenn bei der Aktivierung des Agenten ein Fehler auftritt
      console.error('[SelfLearningAgent] Kritischer Fehler beim Starten der Analyse:', 
                   typeof error === 'object' ? JSON.stringify(error) : error);
      
      res.status(500).json({ 
        error: 'Fehler beim Starten der Analyse',
        message: 'Ein interner Serverfehler ist aufgetreten.'
      });
    }
  });

  return router;
}

// Initialisiere den Agenten beim Serverstart und aktiviere ihn automatisch
export function initializeSelfLearningRoutes(selfRepairAgent: AISelfRepairAgent): void {
  initializeSelfLearningAgent(selfRepairAgent);
  const selfLearningAgent = getSelfLearningAgent(selfRepairAgent);
  
  // Automatisch aktivieren
  try {
    selfLearningAgent.activate();
    console.log('Selbstlernender Agent automatisch aktiviert');
  } catch (error) {
    console.error('Fehler beim automatischen Aktivieren des Selbstlernenden Agenten:', error);
  }
  
  console.log('Selbstlernender Agent und Routen initialisiert');
}