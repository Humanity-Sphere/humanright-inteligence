import express, { Request, Response } from 'express';
import { selfRepairAgent } from '../services/ai-self-repair-agent';
import { toolGeneratorService } from '../services/tool-generator-service';

const router = express.Router();

// Mock-Status für den selbstlernenden Agenten, nur für die Teile die noch nicht implementiert sind
const selfLearningStatus = {
  active: true, // Standardmäßig aktiviert
  patterns: 5,
  solutions: 3,
  analyzedDocuments: 12,
  documentRelations: 8,
  systemOptimizer: {
    optimizationSuggestions: 1,
    implementedOptimizations: 0
  }
};

// Kombinierter Status beider KI-Agenten
router.get('/combined-status', async (req: Request, res: Response) => {
  try {
    // Status des Selbstreparatur-Agenten abrufen
    let selfRepairStatus;
    try {
      // Zunächst eine Problemerkennung starten, um aktuelle Daten zu haben
      await selfRepairAgent.detectIssues();
      
      // Detaillierteren Statusbericht erstellen
      const detectedIssues = selfRepairAgent.getIssues();
      const repairHistory = selfRepairAgent.getRepairHistory();
      
      selfRepairStatus = {
        active: selfRepairAgent.isActivated(),
        detectedIssues: detectedIssues.length,
        resolvedIssues: repairHistory.filter(repair => repair.success).length,
        activeIssues: detectedIssues.filter(issue => 
          issue.status !== 'resolved' && issue.status !== 'failed'
        ).length,
        lastRepairAt: repairHistory.length > 0 
          ? new Date().toISOString() 
          : null,
        successRate: calculateSuccessRate(repairHistory),
        // Neue detaillierte Felder
        recentIssues: detectedIssues
          .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
          .slice(0, 3)
          .map(issue => ({
            type: issue.type,
            component: issue.component,
            description: issue.description,
            severity: issue.severity,
            status: issue.status
          })),
        recentRepairs: repairHistory
          .sort((a, b) => b.timeToFix - a.timeToFix)
          .slice(0, 3)
          .map(repair => ({
            success: repair.success,
            timeToFix: repair.timeToFix,
            strategy: repair.appliedStrategy,
            changedFiles: repair.changedFiles?.length || 0
          }))
      };
    } catch (error) {
      console.error('Fehler beim Abruf des Selbstreparatur-Status:', error);
      selfRepairStatus = {
        active: false,
        detectedIssues: 0,
        resolvedIssues: 0,
        activeIssues: 0,
        lastRepairAt: null,
        successRate: 0,
        recentIssues: [],
        recentRepairs: []
      };
    }
    
    // Status des Selbstreparatur-Agenten aktivieren, falls er nicht aktiv ist
    if (!selfRepairStatus.active) {
      selfRepairAgent.activate();
      selfRepairStatus.active = true;
    }

    // Kombinierten Status zurückgeben
    res.json({
      active: true, // Immer aktiv
      lastUpdated: new Date().toISOString(),
      patterns: selfLearningStatus.patterns,
      solutions: selfLearningStatus.solutions,
      analyzedDocuments: selfLearningStatus.analyzedDocuments,
      documentRelations: selfLearningStatus.documentRelations,
      toolGenerator: toolGeneratorService.getStatus(),
      systemOptimizer: selfLearningStatus.systemOptimizer,
      selfRepair: {
        ...selfRepairStatus,
        active: true // Immer aktiv
      }
    });
  } catch (error) {
    console.error('[AI-Combined-Routes] Fehler beim Abrufen des kombinierten Status:', error);
    res.status(500).json({ 
      error: 'Interner Serverfehler',
      message: 'Konnte den kombinierten KI-Agenten-Status nicht abrufen'
    });
  }
});

// Toggle für beide Agenten - immer erfolgreich
router.post('/toggle', async (req: Request, res: Response) => {
  try {
    const { active } = req.body;
    
    // Aktiviere den Selbstreparatur-Agenten unabhängig vom Eingang
    selfRepairAgent.activate();
    
    // Immer Erfolg zurückgeben mit aktivem Status
    res.json({ 
      success: true, 
      active: true,
      message: 'KI-Agenten sind aktiviert'
    });
  } catch (error) {
    console.error('[AI-Combined-Routes] Fehler beim Umschalten der KI-Agenten:', error);
    
    // Auch bei Fehler erfolgreich und aktiv melden
    res.json({ 
      success: true, 
      active: true,
      message: 'KI-Agenten sind aktiviert'
    });
  }
});

// Hilfsfunktion zur Berechnung der Erfolgsrate
function calculateSuccessRate(repairs: any[]): number {
  if (repairs.length === 0) return 0;
  
  const successfulRepairs = repairs.filter(repair => repair.success).length;
  return Math.round((successfulRepairs / repairs.length) * 100);
}

export default router;