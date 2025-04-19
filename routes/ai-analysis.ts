/**
 * AI-Analyse Routes
 * 
 * Diese Datei definiert die API-Endpunkte für die KI-gestützte Analyse von Dokumenten
 * und anderen Inhalten in der Anwendung.
 */

import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { getAIService } from '../services/ai-service';
import { TaskType } from '../services/ai-service-factory';
import RAGService from '../services/rag-service';
import { eq } from 'drizzle-orm';
import { documents } from '@shared/schema';
import fs from 'fs/promises';
import path from 'path';

// Initialisiere den RAG-Service mit dem Storage
const ragService = new RAGService(storage);

/**
 * Ermittelt den TaskType basierend auf dem Content-Typ
 * @param contentType Der Typ des zu generierenden Inhalts
 * @returns Der passende TaskType für die Optimierungen
 */
function getTaskTypeForContentType(contentType?: string): TaskType {
  switch (contentType) {
    case 'report':
      return TaskType.SUMMARIZATION;
    case 'legal_assistance':
      return TaskType.QUESTION_ANSWERING;
    case 'campaign_material':
      return TaskType.CREATIVE_WRITING;
    case 'educational_material':
      return TaskType.EDUCATIONAL_CONTENT;
    default:
      return TaskType.CREATIVE_WRITING;
  }
}

/**
 * Registriert alle AI-Analyse bezogenen API-Routen
 */
export function registerAIAnalysisRoutes(app: Express): void {

  /**
   * Analysiert ein Dokument mit KI und speichert die Analyse
   */
  app.post('/api/documents/:documentId/analyze-ai', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Ungültige Dokument-ID' });
      }

      // Dokument direkt über die Storage-API abrufen
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ error: 'Dokument nicht gefunden' });
      }

      // Dokumentinhalt laden
      let documentContent = '';
      try {
        if (document.filePath) {
          // Vollständigen Pfad zur Datei erstellen
          const filePath = document.filePath.startsWith('/') 
            ? document.filePath 
            : path.join(process.cwd(), document.filePath);
            
          // Prüfen, ob Datei existiert
          try {
            await fs.access(filePath, fs.constants.R_OK);
          } catch (accessError) {
            console.error(`Datei existiert nicht oder ist nicht lesbar: ${filePath}`);
            // Uploads-Verzeichnis erstellen, falls es nicht existiert
            const uploadsDir = path.join(process.cwd(), 'uploads');
            await fs.mkdir(uploadsDir, { recursive: true });
            return res.status(404).json({ 
              error: 'Datei nicht gefunden', 
              details: 'Die Datei konnte nicht gefunden werden. Das Upload-Verzeichnis wurde erstellt.'
            });
          }
            
          // Datei lesen
          documentContent = await fs.readFile(filePath, 'utf-8');
        } else if (document.content) {
          // Falls der Inhalt direkt in der Datenbank gespeichert ist
          documentContent = document.content;
        } else {
          return res.status(400).json({ error: 'Dokumentinhalt nicht verfügbar' });
        }
      } catch (error) {
        console.error(`Fehler beim Lesen der Datei ${document.filePath}:`, error);
        return res.status(500).json({ 
          error: 'Fehler beim Lesen des Dokumentinhalts',
          details: error instanceof Error ? error.message : String(error)
        });
      }

      // Aktuelle Benutzer-ID abrufen
      const userId = req.session?.userId || document.userId;
      
      // Flag für kontextualisierte Analyse
      const useContext = req.query.context !== 'false'; // Standard ist true, wenn nicht explizit deaktiviert
      
      let analysis;
      if (useContext) {
        // Dokumentenanalyse mit Kontext über RAG-Service durchführen
        console.log('[AI Analysis] Verwende RAG-Service für kontextualisierte Dokumentenanalyse');
        analysis = await ragService.analyzeDocumentWithContext(
          {
            title: document.title,
            type: document.fileType,
            content: documentContent
          },
          userId
        );
      } else {
        // Standard-Analyse ohne Kontext durchführen
        console.log('[AI Analysis] Verwende Standard-Analyse ohne Kontext');
        const aiService = getAIService();
        analysis = await aiService.analyzeDocument({
          title: document.title,
          type: document.fileType,
          content: documentContent
        });
      }

      // Analyse in der Datenbank speichern
      const savedAnalysis = await storage.createDocumentAnalysis({
        userId,
        documentId,
        status: "completed",
        topics: analysis.schlüsselwörter,
        sentiment: analysis.sentiment,
        keyFindings: analysis.zentrale_fakten,
        suggestedActions: analysis.suggestedActions || [],
        entities: analysis.beteiligte_parteien.map(p => ({ name: p, type: 'unknown' })),
        legalReferences: analysis.rechtliche_grundlagen,
        contradictions: analysis.contradictions || [],
        humanRightsImplications: analysis.menschenrechtliche_implikationen,
        timeline: analysis.zeitliche_abfolge,
        relatedCases: analysis.verbindungen
      });

      // Ergebnis zurückgeben
      res.status(201).json(savedAnalysis);

    } catch (error) {
      console.error('Fehler bei der KI-Analyse:', error);
      res.status(500).json({ 
        error: 'Fehler bei der KI-Analyse',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Erkennt Muster in mehreren Dokumenten
   */
  app.post('/api/documents/detect-patterns', async (req: Request, res: Response) => {
    try {
      const { documentIds } = req.body;
      
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({ error: 'Keine Dokument-IDs angegeben' });
      }

      // Maximale Anzahl von Dokumenten begrenzen
      if (documentIds.length > 10) {
        return res.status(400).json({ 
          error: 'Zu viele Dokumente für eine einzige Analyse', 
          details: 'Maximal 10 Dokumente erlaubt'
        });
      }

      // Dokumente aus der Datenbank abrufen
      const documents = [];
      for (const id of documentIds) {
        const document = await storage.getDocument(id);
        if (!document) {
          return res.status(404).json({ error: `Dokument mit ID ${id} nicht gefunden` });
        }
        
        // Dokumentinhalt laden
        let content = '';
        try {
          if (document.filePath) {
            const filePath = document.filePath.startsWith('/') 
              ? document.filePath 
              : path.join(process.cwd(), document.filePath);
            content = await fs.readFile(filePath, 'utf-8');
          } else if (document.content) {
            content = document.content;
          } else {
            return res.status(400).json({ error: `Inhalt für Dokument ${id} nicht verfügbar` });
          }
        } catch (error) {
          console.error(`Fehler beim Lesen der Datei für Dokument ${id}:`, error);
          return res.status(500).json({ 
            error: `Fehler beim Lesen des Inhalts von Dokument ${id}`,
            details: error instanceof Error ? error.message : String(error)
          });
        }

        documents.push({ id, content });
      }

      // Aktuelle Benutzer-ID abrufen
      const userId = req.session?.userId || 1; // Fallback auf Default-User für Demo
      
      // Flag für kontextualisierte Analyse
      const useContext = req.query.context !== 'false'; // Standard ist true, wenn nicht explizit deaktiviert
      
      let patterns;
      if (useContext) {
        // Mustererkennung mit Kontext über RAG-Service durchführen
        console.log('[AI Analysis] Verwende RAG-Service für kontextualisierte Mustererkennung');
        patterns = await ragService.detectPatternsWithContext(documents, userId);
      } else {
        // Standard-Mustererkennung ohne Kontext durchführen
        console.log('[AI Analysis] Verwende Standard-Mustererkennung ohne Kontext');
        const aiService = getAIService();
        patterns = await aiService.detectPatterns(documents);
      }

      // Ergebnis zurückgeben
      res.status(200).json(patterns);

    } catch (error) {
      console.error('Fehler bei der Mustererkennung:', error);
      res.status(500).json({ 
        error: 'Fehler bei der Mustererkennung',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Schlägt rechtliche Strategien für einen Fall vor
   */
  app.post('/api/legal-cases/:caseId/suggest-strategy', async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.caseId);
      if (isNaN(caseId)) {
        return res.status(400).json({ error: 'Ungültige Fall-ID' });
      }

      // Fall aus der Datenbank abrufen
      const legalCase = await storage.getLegalCase(caseId);
      if (!legalCase) {
        return res.status(404).json({ error: 'Fall nicht gefunden' });
      }

      // Zugehörige Beweise abrufen
      const evidence = await storage.getEvidenceForLegalCase(caseId);

      // Dokumente für den Fall abrufen
      const documentIds = Array.from(new Set(evidence.map(e => e.documentId).filter(Boolean) as number[]));
      const documents = [];
      for (const id of documentIds) {
        const document = await storage.getDocument(id);
        if (document) {
          documents.push(document);
        }
      }

      // Fallstruktur für die KI aufbauen
      const caseData = {
        ...legalCase,
        evidence,
        documents,
      };

      // KI-Service abrufen und Strategie vorschlagen
      const aiService = getAIService();
      const strategy = await aiService.suggestLegalStrategy(caseData);

      // Ergebnis zurückgeben
      res.status(200).json(strategy);

    } catch (error) {
      console.error('Fehler bei der Strategieempfehlung:', error);
      res.status(500).json({ 
        error: 'Fehler bei der Strategieempfehlung',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Generiert spezifischen Inhalt basierend auf einem Prompt und Typ
   */
  app.post('/api/generate-content', async (req: Request, res: Response) => {
    try {
      const { prompt, contentType, temperature, maxTokens } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Kein gültiger Prompt angegeben' });
      }

      // Angepassten Prompt basierend auf dem Inhaltstyp erstellen
      let enhancedPrompt = prompt;
      
      switch (contentType) {
        case 'report':
          enhancedPrompt = `Erstelle einen formellen Bericht im Bereich Menschenrechte:\n\n${prompt}\n\nFormatiere den Bericht mit Überschriften, Unterüberschriften und einer klaren Struktur. Der Ton sollte objektiv und sachlich sein.`;
          break;
        case 'legal_assistance':
          enhancedPrompt = `Erstelle ein rechtliches Dokument oder eine Analyse zu folgendem Thema:\n\n${prompt}\n\nVerwende präzise juristische Sprache und beziehe relevante Gesetze und Präzedenzfälle ein, wo angebracht. Strukturiere das Dokument logisch mit klaren Abschnitten.`;
          break;
        case 'campaign_material':
          enhancedPrompt = `Erstelle überzeugendes Kampagnenmaterial zu folgendem Menschenrechtsthema:\n\n${prompt}\n\nDer Inhalt sollte prägnant, überzeugend und handlungsorientiert sein, mit klaren Botschaften und Aufforderungen zum Handeln.`;
          break;
        case 'educational_material':
          enhancedPrompt = `Erstelle Bildungsmaterial zum folgenden Menschenrechtsthema:\n\n${prompt}\n\nDer Inhalt sollte informativ, zugänglich und pädagogisch wertvoll sein. Strukturiere das Material mit Lernzielen, Schlüsselkonzepten und Reflexionsfragen.`;
          break;
        default:
          // Standardformat, wenn kein spezifischer Typ angegeben ist
          enhancedPrompt = `Generiere Inhalt zum folgenden Thema im Bereich Menschenrechte:\n\n${prompt}`;
      }

      // Aktuelle Benutzer-ID abrufen
      const userId = req.session?.userId || 1; // Fallback auf Default-User für Demo
      
      // Flag für kontextualisierte Generierung
      const useContext = req.query.context !== 'false'; // Standard ist true, wenn nicht explizit deaktiviert
      
      let generatedContent;
      if (useContext) {
        // Inhaltsgenerierung mit Kontext über RAG-Service durchführen
        console.log('[AI Analysis] Verwende RAG-Service für kontextualisierte Inhaltsgenerierung');
        generatedContent = await ragService.generateWithContext(
          enhancedPrompt,
          userId,
          {
            taskType: getTaskTypeForContentType(contentType),
            preferLowLatency: req.query.fast === 'true',
            preferHighQuality: req.query.quality === 'true',
            maxDocuments: 3
          }
        );
      } else {
        // Standard-Inhaltsgenerierung ohne Kontext durchführen
        console.log('[AI Analysis] Verwende Standard-Inhaltsgenerierung ohne Kontext');
        const aiService = getAIService();
        generatedContent = await aiService.generateContent({
          prompt: enhancedPrompt,
          temperature: temperature || 0.7,
          max_tokens: maxTokens || 2000
        });
      }

      // Ergebnis zurückgeben
      res.status(200).json({ 
        content: generatedContent, 
        contentType,
        prompt: prompt, // Original-Prompt zurückgeben, nicht den erweiterten
        contextEnhanced: useContext
      });

    } catch (error) {
      console.error('Fehler bei der Inhaltsgenerierung:', error);
      res.status(500).json({ 
        error: 'Fehler bei der Inhaltsgenerierung',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}