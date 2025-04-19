import { Router, Request, Response } from 'express';
import { selfRepairAgent, initializeSelfRepairAgent } from '../services/ai-self-repair-agent';

/**
 * Router für die Selbstreparatur-Funktionen
 */
export function registerSelfRepairRoutes(): Router {
  const router = Router();

  // Status des Self-Repair-Agenten abrufen
  router.get('/status', (req: Request, res: Response) => {
    const status = selfRepairAgent.getStatus();
    res.json(status);
  });

  // Agent aktivieren/deaktivieren (immer aktivieren)
  router.post('/toggle', (req: Request, res: Response) => {
    try {
      // Immer aktivieren, unabhängig vom Request
      selfRepairAgent.activate();
      
      // Rückgabe des Status
      res.json({ active: true });
    } catch (error) {
      console.error('Fehler beim Aktivieren des Agenten:', error);
      res.status(500).json({ 
        error: 'Fehler beim Aktivieren des Agenten',
        active: selfRepairAgent.isActivated()
      });
    }
  });

  // Erkannte Probleme abrufen
  router.get('/issues', (req: Request, res: Response) => {
    const issues = selfRepairAgent.getIssues();
    res.json(issues);
  });

  // Reparaturverlauf abrufen
  router.get('/history', (req: Request, res: Response) => {
    const history = selfRepairAgent.getRepairHistory();
    res.json(history);
  });

  // Wissensbasis abrufen
  router.get('/knowledge-base', (req: Request, res: Response) => {
    const knowledgeBase = selfRepairAgent.getKnowledgeBase();
    res.json(knowledgeBase);
  });

  // Benutzerfeedback zur Problemanalyse einreichen
  router.post('/analyze-feedback', async (req: Request, res: Response) => {
    const { feedback } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ error: 'Feedback ist erforderlich' });
    }
    
    try {
      const issues = await selfRepairAgent.analyzeUserFeedback(feedback);
      res.json({ success: true, issues });
    } catch (error) {
      console.error('Fehler bei der Analyse des Feedbacks:', error);
      res.status(500).json({ error: 'Fehler bei der Analyse des Feedbacks' });
    }
  });

  // Benutzeraktivität mit Fehler melden
  router.post('/report-error', (req: Request, res: Response) => {
    const { userId, action, component, path, errorMessage } = req.body;
    
    if (!component || !errorMessage) {
      return res.status(400).json({ error: 'Komponente und Fehlermeldung sind erforderlich' });
    }
    
    selfRepairAgent.monitorUserActivity({
      userId: userId || 'anonymous',
      action: action || 'unknown',
      component,
      path: path || 'unknown',
      timestamp: new Date(),
      errorEncountered: true,
      errorMessage
    });
    
    res.json({ success: true });
  });

  // Manuell ein Problem reparieren
  router.post('/repair/:issueId', async (req: Request, res: Response) => {
    const { issueId } = req.params;
    
    // Finde das Problem
    const issues = selfRepairAgent.getIssues();
    const issue = issues.find(i => i.id === issueId);
    
    if (!issue) {
      return res.status(404).json({ error: 'Problem nicht gefunden' });
    }
    
    try {
      const result = await selfRepairAgent.repairIssue(issue);
      res.json(result);
    } catch (error) {
      console.error('Fehler bei der Reparatur:', error);
      res.status(500).json({ error: 'Fehler bei der Reparatur' });
    }
  });

  // Reparaturvorschläge für ein Problem generieren
  router.get('/suggestions/:issueId', async (req: Request, res: Response) => {
    const { issueId } = req.params;
    
    // Finde das Problem
    const issues = selfRepairAgent.getIssues();
    const issue = issues.find(i => i.id === issueId);
    
    if (!issue) {
      return res.status(404).json({ error: 'Problem nicht gefunden' });
    }
    
    try {
      const suggestions = await selfRepairAgent.suggestFixes(issue);
      res.json(suggestions);
    } catch (error) {
      console.error('Fehler beim Generieren von Vorschlägen:', error);
      res.status(500).json({ error: 'Fehler beim Generieren von Vorschlägen' });
    }
  });

  // Einen Reparaturvorschlag anwenden
  router.post('/apply-fix', async (req: Request, res: Response) => {
    const { suggestion } = req.body;
    
    if (!suggestion) {
      return res.status(400).json({ error: 'Reparaturvorschlag ist erforderlich' });
    }
    
    try {
      const success = await selfRepairAgent.applyFix(suggestion);
      res.json({ success });
    } catch (error) {
      console.error('Fehler beim Anwenden des Reparaturvorschlags:', error);
      res.status(500).json({ error: 'Fehler beim Anwenden des Reparaturvorschlags' });
    }
  });

  // Probleme erkennen (manuelle Diagnose)
  router.post('/detect-issues', async (req: Request, res: Response) => {
    const { fullScan } = req.body;
    
    try {
      // Wir speichern die Anzahl der Probleme vor der Erkennung
      const previousIssuesCount = selfRepairAgent.getIssues().length;
      
      // Führe die Problemerkennung durch
      const issues = await selfRepairAgent.detectIssues();
      
      // Berechne neue Probleme
      const newIssuesCount = issues.length - previousIssuesCount;
      
      res.json({ 
        success: true, 
        issues,
        newIssuesCount,
        totalIssuesCount: issues.length
      });
    } catch (error) {
      console.error('Fehler bei der Problemerkennung:', error);
      res.status(500).json({ error: 'Fehler bei der Problemerkennung' });
    }
  });
  
  // Agent zurücksetzen
  router.post('/reset', (req: Request, res: Response) => {
    selfRepairAgent.resetAgent();
    res.json({ success: true });
  });

  return router;
}

// Initialisiere den Agenten beim Serverstart
export function initializeSelfRepairRoutes(): void {
  initializeSelfRepairAgent();
  console.log('Self-Repair-Routen initialisiert');
}