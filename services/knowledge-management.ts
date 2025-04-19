/**
 * Wissensmanagement-System für die KI
 * 
 * Dieses Modul dient als Ressourcen- und Wissensdatenbank für die KI-Komponenten.
 * Es stellt Funktionen bereit, um Wissen zu speichern, abzurufen und zu verwalten.
 */
import { db } from '../db';
import { 
  aiKnowledgeBase, 
  promptLibrary, 
  domainKnowledge,
  knowledgeContexts,
  SelectAiKnowledgeBase,
  SelectPromptLibrary,
  SelectDomainKnowledge,
  SelectKnowledgeContext
} from '../../shared/schema';
import { eq, like, inArray, and, or, desc } from 'drizzle-orm';
import logger, { createLogger } from '../utils/logger';

/**
 * Wissensmanagement-Dienst
 * Verwaltet das Wissen, das von den KI-Agenten verwendet wird
 */
export class KnowledgeManagementService {
  private static instance: KnowledgeManagementService;

  /**
   * Singleton-Instanz erhalten
   */
  public static getInstance(): KnowledgeManagementService {
    if (!KnowledgeManagementService.instance) {
      KnowledgeManagementService.instance = new KnowledgeManagementService();
    }
    return KnowledgeManagementService.instance;
  }

  /**
   * Einen neuen Wissensbasiseintrag erstellen
   */
  async createKnowledgeBaseEntry(entry: {
    category: string;
    name: string;
    content: string;
    description?: string;
    tags?: string[];
    usage?: string;
    priority?: number;
    aiAgentType?: string[];
    userId?: number;
  }): Promise<SelectAiKnowledgeBase | null> {
    try {
      const result = await db.insert(aiKnowledgeBase).values({
        category: entry.category,
        name: entry.name,
        content: entry.content,
        description: entry.description,
        tags: entry.tags,
        usage: entry.usage,
        priority: entry.priority ?? 5,
        aiAgentType: entry.aiAgentType,
        userId: entry.userId,
      }).returning();

      if (result.length > 0) {
        return result[0];
      }
      return null;
    } catch (error) {
      logger.error(`Fehler beim Erstellen eines Wissensbank-Eintrags: ${error}`);
      return null;
    }
  }

  /**
   * Einen neuen Prompt zur Bibliothek hinzufügen
   */
  async createPrompt(promptData: {
    type: string;
    name: string;
    prompt: string;
    systemMessage?: string;
    description?: string;
    parameters?: any;
    examples?: any;
    category?: string;
    tags?: string[];
    aiModels?: string[];
    userId?: number;
  }): Promise<SelectPromptLibrary | null> {
    try {
      const result = await db.insert(promptLibrary).values({
        type: promptData.type,
        name: promptData.name,
        prompt: promptData.prompt,
        systemMessage: promptData.systemMessage,
        description: promptData.description,
        parameters: promptData.parameters,
        examples: promptData.examples,
        category: promptData.category,
        tags: promptData.tags,
        aiModels: promptData.aiModels,
        userId: promptData.userId
      }).returning();

      if (result.length > 0) {
        return result[0];
      }
      return null;
    } catch (error) {
      logger.error(`Fehler beim Erstellen eines Prompts: ${error}`);
      return null;
    }
  }

  /**
   * Fachwissen für eine bestimmte Domäne hinzufügen
   */
  async createDomainKnowledge(knowledgeData: {
    domain: string;
    concept: string;
    definition: string;
    subDomain?: string;
    explanation?: string;
    examples?: any;
    relatedConcepts?: string[];
    sources?: any;
    importance?: number;
    complexity?: number;
    tags?: string[];
    userId?: number;
  }): Promise<SelectDomainKnowledge | null> {
    try {
      const result = await db.insert(domainKnowledge).values({
        domain: knowledgeData.domain,
        concept: knowledgeData.concept,
        definition: knowledgeData.definition,
        subDomain: knowledgeData.subDomain,
        explanation: knowledgeData.explanation,
        examples: knowledgeData.examples,
        relatedConcepts: knowledgeData.relatedConcepts,
        sources: knowledgeData.sources,
        importance: knowledgeData.importance ?? 5,
        complexity: knowledgeData.complexity ?? 3,
        tags: knowledgeData.tags,
        userId: knowledgeData.userId
      }).returning();

      if (result.length > 0) {
        return result[0];
      }
      return null;
    } catch (error) {
      logger.error(`Fehler beim Erstellen von Domänenwissen: ${error}`);
      return null;
    }
  }

  /**
   * Einen allgemeinen Wissenskontext hinzufügen
   */
  async createKnowledgeContext(contextData: {
    title: string;
    type: string;
    content: string;
    keywords?: string[];
    source?: string;
    sourceName?: string;
    sourceType?: string;
    geographicScope?: string;
    jurisdiction?: string;
    humanRightsDomains?: string[];
    relatedEntities?: string[];
    contentQuality?: number;
    userId?: number;
  }): Promise<SelectKnowledgeContext | null> {
    try {
      const result = await db.insert(knowledgeContexts).values({
        title: contextData.title,
        type: contextData.type,
        content: contextData.content,
        keywords: contextData.keywords,
        source: contextData.source,
        sourceName: contextData.sourceName,
        sourceType: contextData.sourceType,
        geographicScope: contextData.geographicScope,
        jurisdiction: contextData.jurisdiction,
        humanRightsDomains: contextData.humanRightsDomains,
        relatedEntities: contextData.relatedEntities,
        contentQuality: contextData.contentQuality,
        userId: contextData.userId
      }).returning();

      if (result.length > 0) {
        return result[0];
      }
      return null;
    } catch (error) {
      logger.error(`Fehler beim Erstellen eines Wissenskontexts: ${error}`);
      return null;
    }
  }

  /**
   * Suche nach Wissen in der KI-Wissensbasis
   */
  async searchKnowledgeBase(query: string, agentType?: string): Promise<SelectAiKnowledgeBase[]> {
    try {
      let whereClause = like(aiKnowledgeBase.name, `%${query}%`);
      
      if (agentType) {
        // Fix für TypeScript-Fehler: 
        // Verwende eine eindeutige SQL-Abfrage anstelle von eq mit Array-Typ
        whereClause = and(
          whereClause,
          or(
            inArray(aiKnowledgeBase.aiAgentType, [agentType]),
            eq(aiKnowledgeBase.aiAgentType, null)
          )
        );
      }

      return await db.select().from(aiKnowledgeBase)
        .where(whereClause)
        .orderBy(desc(aiKnowledgeBase.priority))
        .limit(20);
    } catch (error) {
      logger.error(`Fehler bei der Suche in der Wissensbasis: ${error}`);
      return [];
    }
  }

  /**
   * Suche nach Prompts in der Prompt-Bibliothek
   */
  async searchPrompts(query: string, type?: string): Promise<SelectPromptLibrary[]> {
    try {
      let whereClause = or(
        like(promptLibrary.name, `%${query}%`),
        like(promptLibrary.prompt, `%${query}%`)
      );
      
      if (type) {
        whereClause = and(whereClause, eq(promptLibrary.type, type));
      }

      return await db.select().from(promptLibrary)
        .where(whereClause)
        .limit(20);
    } catch (error) {
      logger.error(`Fehler bei der Suche nach Prompts: ${error}`);
      return [];
    }
  }

  /**
   * Suche nach Domänenwissen
   */
  async searchDomainKnowledge(query: string, domain?: string): Promise<SelectDomainKnowledge[]> {
    try {
      let whereClause = or(
        like(domainKnowledge.concept, `%${query}%`),
        like(domainKnowledge.definition, `%${query}%`),
        like(domainKnowledge.explanation, `%${query}%`)
      );
      
      if (domain) {
        whereClause = and(whereClause, eq(domainKnowledge.domain, domain));
      }

      return await db.select().from(domainKnowledge)
        .where(whereClause)
        .orderBy(desc(domainKnowledge.importance))
        .limit(20);
    } catch (error) {
      logger.error(`Fehler bei der Suche nach Domänenwissen: ${error}`);
      return [];
    }
  }

  /**
   * Aktualisiere die Erfolgsbewertung eines Prompts
   */
  async updatePromptSuccessRate(promptId: number, modelName: string, success: boolean): Promise<void> {
    try {
      const prompt = await db.select().from(promptLibrary).where(eq(promptLibrary.id, promptId)).limit(1);
      
      if (prompt.length === 0) return;
      
      const currentSuccessRate = prompt[0].successRate as Record<string, { success: number, total: number }> || {};
      
      if (!currentSuccessRate[modelName]) {
        currentSuccessRate[modelName] = { success: 0, total: 0 };
      }
      
      currentSuccessRate[modelName].total += 1;
      if (success) {
        currentSuccessRate[modelName].success += 1;
      }
      
      await db.update(promptLibrary)
        .set({ successRate: currentSuccessRate })
        .where(eq(promptLibrary.id, promptId));
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Erfolgsrate: ${error}`);
    }
  }

  /**
   * Aktualisiere die Effektivitätsbewertung eines Wissensbankeintrags
   */
  async updateKnowledgeEffectiveness(knowledgeId: number, effectiveness: number): Promise<void> {
    try {
      await db.update(aiKnowledgeBase)
        .set({ 
          effectiveness,
          usageCount: () => `${aiKnowledgeBase.usageCount} + 1`,
          lastUsed: new Date()
        })
        .where(eq(aiKnowledgeBase.id, knowledgeId));
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Effektivität: ${error}`);
    }
  }

  /**
   * Hole alle Prompts eines bestimmten Typs
   */
  async getPromptsByType(type: string): Promise<SelectPromptLibrary[]> {
    try {
      return await db.select().from(promptLibrary)
        .where(eq(promptLibrary.type, type))
        .orderBy(desc(promptLibrary.createdAt));
    } catch (error) {
      logger.error(`Fehler beim Abrufen von Prompts nach Typ: ${error}`);
      return [];
    }
  }

  /**
   * Hole alle Wissensbankeinträge nach Kategorie
   */
  async getKnowledgeByCategory(category: string): Promise<SelectAiKnowledgeBase[]> {
    try {
      return await db.select().from(aiKnowledgeBase)
        .where(eq(aiKnowledgeBase.category, category))
        .orderBy(desc(aiKnowledgeBase.priority));
    } catch (error) {
      logger.error(`Fehler beim Abrufen von Wissen nach Kategorie: ${error}`);
      return [];
    }
  }

  /**
   * Hole Domänenwissen nach Domäne
   */
  async getDomainKnowledgeByDomain(domain: string): Promise<SelectDomainKnowledge[]> {
    try {
      return await db.select().from(domainKnowledge)
        .where(eq(domainKnowledge.domain, domain))
        .orderBy(desc(domainKnowledge.importance));
    } catch (error) {
      logger.error(`Fehler beim Abrufen von Domänenwissen: ${error}`);
      return [];
    }
  }

  /**
   * Lösche einen Eintrag aus der Wissensbasis
   */
  async deleteKnowledgeBaseEntry(id: number): Promise<boolean> {
    try {
      const result = await db.delete(aiKnowledgeBase)
        .where(eq(aiKnowledgeBase.id, id))
        .returning({ id: aiKnowledgeBase.id });
      
      return result.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Löschen eines Wissensbankeintrags: ${error}`);
      return false;
    }
  }

  /**
   * Lösche einen Prompt
   */
  async deletePrompt(id: number): Promise<boolean> {
    try {
      const result = await db.delete(promptLibrary)
        .where(eq(promptLibrary.id, id))
        .returning({ id: promptLibrary.id });
      
      return result.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Löschen eines Prompts: ${error}`);
      return false;
    }
  }

  /**
   * Fülle die Wissensdatenbank mit Grundwissen
   */
  async seedBasicKnowledge(): Promise<void> {
    try {
      const existingPrompts = await this.getPromptsByType("repair_agent");
      if (existingPrompts.length === 0) {
        // Füge einige Grundprompts hinzu
        await this.createPrompt({
          type: "repair_agent",
          name: "API-Fehlerdiagnose",
          prompt: `Analysiere den folgenden API-Fehler und schlage Lösungen vor:
          
Fehlerdetails:
{{error_details}}

Mögliche Ursachen:
1. Die API-Endpunktadresse ist falsch
2. Authentifizierungsprobleme
3. Fehlerhafte Parameter
4. Netzwerkprobleme
5. Server-seitige Fehler

Bitte untersuche den Fehler und schlage konkrete Lösungsschritte vor.`,
          systemMessage: "Du bist ein Experte für API-Fehlerdiagnose und -behebung.",
          description: "Hilft bei der Diagnose und Lösung von API-Fehlern",
          category: "Fehlerdiagnose",
          tags: ["API", "Fehler", "Diagnose"]
        });

        await this.createPrompt({
          type: "repair_agent",
          name: "Datenbankfehlerdiagnose",
          prompt: `Analysiere den folgenden Datenbankfehler und schlage Lösungen vor:
          
Fehlerdetails:
{{error_details}}

Mögliche Ursachen:
1. Verbindungsprobleme
2. SQL-Syntax-Fehler
3. Berechtigungsprobleme
4. Schemaprobleme
5. Datenbankressourcenprobleme

Bitte untersuche den Fehler und schlage konkrete Lösungsschritte vor.`,
          systemMessage: "Du bist ein Experte für Datenbankfehlerdiagnose und -behebung.",
          description: "Hilft bei der Diagnose und Lösung von Datenbankfehlern",
          category: "Fehlerdiagnose",
          tags: ["Datenbank", "SQL", "Fehler", "Diagnose"]
        });
      }

      const existingKnowledge = await this.getKnowledgeByCategory("system_message");
      if (existingKnowledge.length === 0) {
        // Füge System-Nachrichten für verschiedene KI-Agenten hinzu
        await this.createKnowledgeBaseEntry({
          category: "system_message",
          name: "Standard-Systemanweisung für Self-Repair-Agent",
          content: `Du bist ein KI-Self-Repair-Agent, der Softwarefehler in der Anwendung identifiziert und behebt. 
          
Deine Aufgaben sind:
1. Fehler erkennen und klassifizieren
2. Ursachenanalyse durchführen
3. Lösungsvorschläge generieren
4. Reparaturmaßnahmen umsetzen
5. Erfolg der Reparatur verifizieren

Arbeite autonom und proaktiv, um die Systemstabilität zu gewährleisten.`,
          aiAgentType: ["repair_agent"],
          priority: 10
        });

        await this.createKnowledgeBaseEntry({
          category: "system_message",
          name: "Standard-Systemanweisung für Self-Learning-Agent",
          content: `Du bist ein KI-Self-Learning-Agent, der kontinuierlich aus Interaktionen und Fehlern lernt, um die Systemleistung zu verbessern.
          
Deine Aufgaben sind:
1. Benutzerverhalten analysieren
2. Muster und Trends identifizieren
3. Verbesserungen vorschlagen
4. Neue Fähigkeiten entwickeln
5. Wissensdatenbank erweitern

Arbeite autonom und proaktiv, um die Systemleistung kontinuierlich zu verbessern.`,
          aiAgentType: ["learning_agent"],
          priority: 10
        });
      }

      const existingDomainKnowledge = await this.getDomainKnowledgeByDomain("human_rights");
      if (existingDomainKnowledge.length === 0) {
        // Füge grundlegendes Domänenwissen hinzu
        await this.createDomainKnowledge({
          domain: "human_rights",
          concept: "Allgemeine Erklärung der Menschenrechte",
          definition: "Die Allgemeine Erklärung der Menschenrechte (AEMR) ist ein von der Generalversammlung der Vereinten Nationen am 10. Dezember 1948 verkündetes Menschenrechtsdokument.",
          explanation: "Die AEMR definiert grundlegende Menschenrechte, die allen Menschen zustehen, unabhängig von ihrer Nationalität, Hautfarbe, Geschlecht, Religion, politischer Meinung oder sozialer Herkunft.",
          relatedConcepts: ["Menschenwürde", "UN-Menschenrechtscharta", "Grundrechte"],
          importance: 10,
          tags: ["Menschenrechte", "UN", "Grunddokument"]
        });

        await this.createDomainKnowledge({
          domain: "human_rights",
          concept: "Dokumentation von Menschenrechtsverletzungen",
          definition: "Der systematische Prozess der Sammlung, Verifikation, Analyse und Speicherung von Informationen über Menschenrechtsverletzungen.",
          explanation: "Die Dokumentation von Menschenrechtsverletzungen umfasst verschiedene Methoden wie Interviews mit Opfern und Zeugen, Sammlung physischer Beweise, Analyse von Medienberichten und Verwendung digitaler Technologien zur Erfassung von Verletzungen.",
          relatedConcepts: ["Beweissicherung", "Zeugenaussagen", "Fact-Finding", "Monitoring"],
          importance: 9,
          tags: ["Dokumentation", "Methodik", "Beweissicherung"]
        });
      }

      logger.info("Wissensdatenbank erfolgreich mit Grundwissen gefüllt");
    } catch (error) {
      logger.error(`Fehler beim Füllen der Wissensdatenbank: ${error}`);
    }
  }
}

// Singleton-Instanz exportieren
export const knowledgeManagement = KnowledgeManagementService.getInstance();

// Initialisierung beim Import
(async () => {
  try {
    await knowledgeManagement.seedBasicKnowledge();
    logger.info("Wissensdatenbank initialisiert");
  } catch (error) {
    logger.error(`Fehler bei der Initialisierung der Wissensdatenbank: ${error}`);
  }
})();