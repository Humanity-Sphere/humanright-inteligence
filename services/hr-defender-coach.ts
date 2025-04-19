/**
 * HR-Defender-Coach Service
 * 
 * Dieser Service bietet persönliche Lernpläne und Entwicklungsberatung für Menschenrechtsverteidiger
 * basierend auf ihrem Profil, aktuellen Fällen und Fähigkeiten.
 */

import { IAIService, RequestOptions } from './ai-service';
import { ContextEnrichmentService, contextEnrichmentService } from './context-enrichment-service';

// Speichertypen für Daten
export enum StorageType {
  LOCAL = 'local',
  CLOUD = 'cloud',
  HYBRID = 'hybrid'
}

// Datenquellentypen
export enum DataSourceType {
  DOCUMENTS = 'documents',
  CASES = 'cases',
  OHCHR_RESOURCES = 'ohchr_resources',
  EVIDENCE = 'evidence',
  KNOWLEDGE_BASE = 'knowledge_base',
  ALL = 'all'
}

// Lernplanoptionen
export interface LearningPlanOptions {
  storageType: StorageType;
  dataSources: DataSourceType[];
  includeOhchrResources: boolean;
  aiModelPreference?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'auto';
  focusArea?: string[];
  maxDurationDays?: number;
}

// Typdefinitionen
interface UserProfile { 
  userId: number; 
  skills?: string[]; 
  interests?: string[]; 
  learningHistory?: any[]; 
  activeCases?: any[]; 
  role?: string; 
}

interface SkillGap { 
  skill: string; 
  currentLevel: number; 
  targetLevel: number; 
  importance: number; 
}

interface LearningGoal { 
  goal: string; 
  priority: number; 
  relatedSkills: string[]; 
}

interface LearningModule { 
  id: string; 
  title: string; 
  type: 'reading' | 'video' | 'simulation'; 
  estimatedTime: number; 
  relatedGoals: string[]; 
}

interface PracticalExercise { 
  description: string; 
  relatedCaseId?: number; 
  relatedModuleId: string; 
}

interface LearningPlan {
  skillAssessment: Record<string, number>;
  prioritizedGoals: LearningGoal[];
  recommendedLearningPath: any[];
  practicalExercises: PracticalExercise[];
  estimatedTimeInvestment: number;
}

/**
 * HRDefenderCoach Klasse
 * Bietet personalisierte Lernpläne und Entwicklungsberatung für Menschenrechtsverteidiger
 */
export class HRDefenderCoach {
  private aiService: IAIService;
  private userProfile: UserProfile;
  private learningHistory: any[];
  private skillAssessment: Record<string, number>;
  private contextEnrichmentService: any;
  private planOptions: LearningPlanOptions;

  /**
   * Konstruktor
   * @param aiService KI-Service-Instanz
   * @param userProfile Benutzerprofil mit Fähigkeiten, Interessen usw.
   * @param planOptions Optionen für die Lernplangenerierung (optional)
   */
  constructor(
    aiService: IAIService, 
    userProfile: UserProfile, 
    planOptions?: Partial<LearningPlanOptions>
  ) {
    this.aiService = aiService;
    this.userProfile = userProfile;
    this.learningHistory = userProfile.learningHistory || [];
    this.skillAssessment = this._assessSkillsInitial();
    this.contextEnrichmentService = contextEnrichmentService;
    
    // Standardoptionen für den Lernplan festlegen
    this.planOptions = {
      storageType: planOptions?.storageType || StorageType.LOCAL,
      dataSources: planOptions?.dataSources || [DataSourceType.ALL],
      includeOhchrResources: planOptions?.includeOhchrResources !== undefined ? 
        planOptions.includeOhchrResources : true,
      aiModelPreference: planOptions?.aiModelPreference || 'gpt-4', // Standardmodell
      difficulty: planOptions?.difficulty || 'auto',
      focusArea: planOptions?.focusArea || [],
      maxDurationDays: planOptions?.maxDurationDays || 30
    };
  }
  
  /**
   * Lädt relevante Daten aus den ausgewählten Datenquellen basierend auf den Planoptionen
   * @returns Geladene Daten aus verschiedenen Quellen
   */
  private async _loadDataFromSources(): Promise<any> {
    console.log(`Lade Daten aus Quellen (${this.planOptions.storageType}):`, 
      this.planOptions.dataSources);
    
    const data: any = {
      documents: [],
      cases: this.userProfile.activeCases || [],
      ohchrResources: [],
      evidence: [],
      knowledgeBase: []
    };
    
    // In einer echten Anwendung würden hier Datenbankabfragen durchgeführt
    // basierend auf dem ausgewählten Speichertyp (lokal/cloud/hybrid)
    
    try {
      // Lade OHCHR-Ressourcen, wenn aktiviert
      if (this.planOptions.includeOhchrResources) {
        console.log("Lade OHCHR-Ressourcen für Lernplan...");
        
        // Simulierte Anfrage für OHCHR-Ressourcen
        // In der echten Anwendung würde dies aus einer API kommen
        data.ohchrResources = [
          { id: "ohchr1", title: "UN-Leitprinzipien für Wirtschaft und Menschenrechte", category: "business" },
          { id: "ohchr2", title: "Toolkit für Dokumentation von Menschenrechtsverletzungen", category: "documentation" },
          { id: "ohchr3", title: "Leitfaden zum Menschenrechtsansatz", category: "general" }
        ];
      }
      
      // Je nach ausgewählten Datenquellen weitere Daten laden
      if (this.planOptions.dataSources.includes(DataSourceType.ALL) || 
          this.planOptions.dataSources.includes(DataSourceType.DOCUMENTS)) {
        // Dokumente laden (aus lokalem/Cloud-Speicher je nach Einstellung)
        console.log(`Lade Dokumente aus ${this.planOptions.storageType}...`);
        // Simulierte Dokumentendaten
        data.documents = [
          { id: 1, title: "Bericht über Menschenrechtsverletzungen", category: "report" },
          { id: 2, title: "Zeugenbefragung in Region X", category: "evidence" }
        ];
      }
      
      // Weitere Datenquellen hier hinzufügen...
      
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
    }
    
    return data;
  }
  
  /**
   * Passt die Prompt-Generierung basierend auf den verfügbaren Datenquellen an
   * @param basePrompt Grundlegender Prompt-Text
   * @param data Geladene Daten aus verschiedenen Quellen
   * @returns Erweiterter Prompt mit Kontextdaten
   */
  private _enhancePromptWithData(basePrompt: string, data: any): string {
    let enhancedPrompt = basePrompt;
    
    // Füge Informationen über OHCHR-Ressourcen hinzu, wenn vorhanden
    if (data.ohchrResources && data.ohchrResources.length > 0) {
      enhancedPrompt += `\n\nRELEVANTE OHCHR-RESSOURCEN:
      ${data.ohchrResources.map((r: any) => `- ${r.title} (${r.category})`).join('\n')}`;
    }
    
    // Füge Informationen über Dokumente hinzu, wenn vorhanden
    if (data.documents && data.documents.length > 0) {
      enhancedPrompt += `\n\nRELEVANTE DOKUMENTE:
      ${data.documents.map((d: any) => `- ${d.title} (${d.category})`).join('\n')}`;
    }
    
    // Wenn Context Enrichment Service verfügbar ist, nutze diesen für weitere Anreicherung
    if (this.contextEnrichmentService) {
      try {
        // Extrahiere Schlüsselwörter aus dem Prompt
        const keywords = this._extractKeywords(enhancedPrompt);
        
        // Füge relevante Kontextinformationen hinzu
        enhancedPrompt = this.contextEnrichmentService.enrichPromptWithKeywords(
          enhancedPrompt, 
          keywords, 
          this.planOptions.includeOhchrResources
        );
      } catch (error) {
        console.error("Fehler bei der Kontextanreicherung:", error);
      }
    }
    
    return enhancedPrompt;
  }
  
  /**
   * Extrahiert wichtige Schlüsselwörter aus einem Text
   * Einfache Version zur Demonstration
   */
  private _extractKeywords(text: string): string[] {
    // In einer echten Anwendung würde hier eine NLP-basierte Extraktion erfolgen
    // Einfache Version: Teile den Text in Wörter, filtere häufige Wörter und nimm die längsten
    const words = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 5)
      .filter(w => !['basierend', 'folgenden', 'anforderung'].includes(w));
    
    // Eindeutige Wörter und nach Länge sortiert (längere Wörter sind oft spezifischer)
    return Array.from(new Set(words))
      .sort((a, b) => b.length - a.length)
      .slice(0, 10);
  }

  /**
   * Initialbewertung der Fähigkeiten basierend auf dem Benutzerprofil
   * In einer realen Anwendung könnte dies KI-gestützt sein oder aus einer Datenbank kommen
   */
  private _assessSkillsInitial(): Record<string, number> {
    console.log("Initial-Bewertung der Fähigkeiten basierend auf dem Profil.");
    
    // Standardbewertung für Menschenrechtsverteidiger
    const defaultSkills: Record<string, number> = {
      'Legal Research': 3, 
      'Documentation': 4, 
      'Interviewing': 2, 
      'Campaign Strategy': 3, 
      'Digital Security': 2
    };
    
    // Wenn Benutzer Fähigkeiten definiert hat, könnten wir diese integrieren
    if (this.userProfile.skills && this.userProfile.skills.length > 0) {
      // Hier könnten wir eine Verarbeitung der Benutzerfähigkeiten implementieren
      console.log("Benutzer hat Fähigkeiten definiert:", this.userProfile.skills);
    }
    
    return defaultSkills;
  }

  /**
   * Identifiziert Fähigkeitslücken basierend auf dem Benutzerprofil und der Rolle
   */
  private async _identifySkillGaps(options?: RequestOptions): Promise<SkillGap[]> {
    const prompt = `
      Basierend auf dem folgenden Benutzerprofil und der Skill-Bewertung, identifiziere die wichtigsten Fähigkeitslücken für einen Menschenrechtsverteidiger in der Rolle '${this.userProfile.role || 'General Defender'}'.
      Bewerte die aktuelle Stufe (1-5) und schlage eine Zielstufe vor. Berücksichtige die Interessen und bisherige Lerngeschichte.

      PROFIL:
      Skills (selbsteingeschätzt/bewertet): ${JSON.stringify(this.skillAssessment)}
      Interessen: ${this.userProfile.interests?.join(', ') || 'Keine angegeben'}
      Lerngeschichte (letzte 5): ${JSON.stringify(this.learningHistory.slice(-5))}

      ANFORDERUNG: Gib eine Liste von Fähigkeitslücken als JSON Array zurück.
      FORMAT (JSON Array):
      [
        {
          "skill": "Name der Fähigkeit",
          "currentLevel": 1-5,
          "targetLevel": 1-5,
          "importance": 1-5 // Wichtigkeit für die Rolle
        }
      ]
      Antworte NUR mit dem JSON Array.
    `;
    
    try {
      const responseJsonString = await this.aiService.generateContent({
        prompt,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens
      });
      return JSON.parse(responseJsonString);
    } catch (error: any) {
      console.error(`Fehler bei der Identifizierung von Fähigkeitslücken:`, error);
      
      // Fallback: Sende einfache Lücken basierend auf dem Standardbewertungssystem zurück
      return Object.entries(this.skillAssessment)
        .filter(([_, value]) => value < 4)
        .map(([skill, level]) => ({
          skill,
          currentLevel: level,
          targetLevel: Math.min(level + 2, 5),
          importance: 3
        }));
    }
  }

  /**
   * Priorisiert Lernziele basierend auf identifizierten Fähigkeitslücken und aktuellen Fällen
   */
  private async _prioritizeLearningGoals(skillGaps: SkillGap[], activeCases: any[], options?: RequestOptions): Promise<LearningGoal[]> {
    const prompt = `
      Priorisiere Lernziele für einen Menschenrechtsverteidiger basierend auf den identifizierten Fähigkeitslücken und den aktuell bearbeiteten Fällen.

      FÄHIGKEITSLÜCKEN (Skill, Aktuell, Ziel, Wichtigkeit):
      ${skillGaps.map(g => `- ${g.skill} (${g.currentLevel} -> ${g.targetLevel}, Wichtigkeit: ${g.importance})`).join('\n')}

      AKTIVE FÄLLE (Kurzbeschreibung):
      ${(activeCases || []).map((c, i) => `- Fall ${i + 1}: ${c.title} (${c.category || 'N/A'}) - ${c.description?.substring(0, 50)}...`).join('\n')}

      ANFORDERUNG: Erstelle eine priorisierte Liste von Lernzielen (max. 5) als JSON Array.
      FORMAT (JSON Array):
      [
        {
          "goal": "Konkretes Lernziel",
          "priority": 1-5, // 5 = höchste Priorität
          "relatedSkills": ["Fähigkeit1", "Fähigkeit2"]
        }
      ]
      Sortiere nach Priorität (höchste zuerst). Antworte NUR mit dem JSON Array.
    `;
    
    try {
      const responseJsonString = await this.aiService.generateContent({
        prompt,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens
      });
      return JSON.parse(responseJsonString);
    } catch (error: any) {
      console.error(`Fehler bei der Priorisierung von Lernzielen:`, error);
      
      // Fallback: Generiere einfache Lernziele basierend auf Fähigkeitslücken
      return skillGaps
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3)
        .map((gap, index) => ({
          goal: `Verbessere deine Fähigkeiten in ${gap.skill}`,
          priority: 5 - index,
          relatedSkills: [gap.skill]
        }));
    }
  }

  /**
   * Wählt passende Lernmodule basierend auf priorisierten Lernzielen aus
   */
  private async _selectLearningModules(prioritizedGoals: LearningGoal[], options?: RequestOptions): Promise<LearningModule[]> {
    // In einer echten App kämen diese aus einer Datenbank
    const availableModulesDB = [
      { id: 'lm001', title: 'Grundlagen Int. Menschenrechtsrecht', type: 'reading' as const, relatedGoals: ['Verbesserung Rechtskenntnisse'], estimatedTime: 120 },
      { id: 'lm002', title: 'Interviewtechniken für Zeugen', type: 'video' as const, relatedGoals: ['Verbesserung Interviewführung'], estimatedTime: 60 },
      { id: 'lm003', title: 'Digitale Sicherheit Basics', type: 'simulation' as const, relatedGoals: ['Verbesserung Digitale Sicherheit'], estimatedTime: 90 },
      { id: 'lm004', title: 'Dokumentation von Menschenrechtsverletzungen', type: 'reading' as const, relatedGoals: ['Verbessere Documentation'], estimatedTime: 75 },
      { id: 'lm005', title: 'Kampagnenplanung und -durchführung', type: 'video' as const, relatedGoals: ['Verbessere Campaign Strategy'], estimatedTime: 90 },
      { id: 'lm006', title: 'Rechtliche Recherche: Fortgeschrittene Methoden', type: 'reading' as const, relatedGoals: ['Verbessere Legal Research'], estimatedTime: 120 },
      { id: 'lm007', title: 'Interviewtechniken: Traumasensible Gesprächsführung', type: 'video' as const, relatedGoals: ['Verbessere Interviewing'], estimatedTime: 100 },
      { id: 'lm008', title: 'Verschlüsselung und sichere Kommunikation', type: 'simulation' as const, relatedGoals: ['Verbessere Digital Security'], estimatedTime: 120 },
    ];

    const prompt = `
      Wähle passende Lernmodule für einen Menschenrechtsverteidiger aus, basierend auf den priorisierten Lernzielen und den verfügbaren Modulen.

      PRIORISIERTE LERNZIELE:
      ${prioritizedGoals.map(g => `- ${g.goal} (Prio: ${g.priority}, Skills: ${g.relatedSkills.join(', ')})`).join('\n')}

      VERFÜGBARE MODULE (ID, Titel, Typ, Ziele, Zeit):
      ${availableModulesDB.map(m => `- ${m.id}, ${m.title}, ${m.type}, ${m.relatedGoals.join('/')}, ${m.estimatedTime}min`).join('\n')}

      ANFORDERUNG: Stelle einen sinnvollen Lernplan zusammen (max. 3-4 Module) als JSON Array. Berücksichtige Prioritäten und Modulabhängigkeiten (implizit).
      FORMAT (JSON Array):
      [
        {
          "moduleId": "ID des Moduls",
          "title": "Titel des Moduls",
          "reason": "Kurze Begründung der Auswahl"
        }
      ]
      Sortiere nach empfohlener Reihenfolge. Antworte NUR mit dem JSON Array.
    `;
    
    try {
      const responseJsonString = await this.aiService.generateContent({
        prompt,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens
      });
      const selectedModulesInfo = JSON.parse(responseJsonString);
      
      // Finde die vollen Moduldaten basierend auf den IDs
      return selectedModulesInfo
        .map((info: any) => availableModulesDB.find(m => m.id === info.moduleId))
        .filter(Boolean);
    } catch (error: any) {
      console.error(`Fehler bei der Auswahl von Lernmodulen:`, error);
      
      // Fallback: Wähle die ersten 2-3 Module, die zu den Skills passen
      return prioritizedGoals
        .slice(0, 2)
        .flatMap(goal => {
          return availableModulesDB
            .filter(module => 
              module.relatedGoals.some(moduleGoal => 
                goal.relatedSkills.some(skill => 
                  moduleGoal.toLowerCase().includes(skill.toLowerCase())
                )
              )
            )
            .slice(0, 1);
        })
        .filter((module, index, self) => 
          index === self.findIndex(m => m.id === module.id)
        );
    }
  }

  /**
   * Erstellt praktische Übungen, die mit Lernmodulen und aktuellen Fällen verknüpft sind
   */
  private _createPracticalExercises(learningModules: LearningModule[], activeCases: any[]): PracticalExercise[] {
    console.log("Erstelle praktische Übungen, die mit Modulen und Fällen verknüpft sind.");
    
    const exercises: PracticalExercise[] = [];
    
    // Wenn es Module und aktive Fälle gibt, erstelle verknüpfte Übungen
    if (learningModules.length > 0 && activeCases && activeCases.length > 0) {
      // Für jedes Modul (max. 2) eine Übung erstellen
      learningModules.slice(0, 2).forEach((module, index) => {
        // Fall je nach Verfügbarkeit zuordnen
        const relatedCase = index < activeCases.length ? activeCases[index] : activeCases[0];
        
        exercises.push({
          description: `Wende die Techniken aus dem Modul "${module.title}" auf den Fall "${relatedCase.title}" an.`,
          relatedModuleId: module.id,
          relatedCaseId: relatedCase.id
        });
      });
      
      // Zusätzlich, wenn es genug Module gibt, eine modulübergreifende Übung erstellen
      if (learningModules.length >= 2) {
        exercises.push({
          description: `Erstelle eine integrierte Analyse, die Konzepte aus "${learningModules[0].title}" und "${learningModules[1].title}" kombiniert.`,
          relatedModuleId: learningModules[0].id
        });
      }
    }
    
    // Fallback: Wenn es keine aktiven Fälle gibt, erstelle generische Übungen
    if (exercises.length === 0 && learningModules.length > 0) {
      learningModules.forEach(module => {
        exercises.push({
          description: `Praxisübung zu "${module.title}": Wende das Gelernte auf ein hypothetisches Szenario an.`,
          relatedModuleId: module.id
        });
      });
    }
    
    return exercises;
  }

  /**
   * Plant die Reihenfolge der Lernmodule
   */
  private _scheduleLearningModules(modules: LearningModule[]): any[] {
    console.log("Plane die Reihenfolge der Lernmodule.");
    
    // Hier könnten weitere Logik zur optimalen Anordnung implementiert werden
    // Zum Beispiel basierend auf Schwierigkeitsgrad, Abhängigkeiten oder verfügbarer Zeit
    
    return modules.map((module, index) => ({ 
      ...module, 
      order: index + 1,
      estimatedCompletionDays: Math.ceil(module.estimatedTime / 60) // Grobe Schätzung in Tagen
    }));
  }

  /**
   * Berechnet den Zeitaufwand für den Lernplan
   */
  private _calculateTimeInvestment(modules: LearningModule[], exercises: PracticalExercise[]): number {
    console.log("Berechne den Zeitaufwand für den Lernplan.");
    
    // Module + Zeit für Übungen (Annahme: 30min pro Übung)
    const moduleTime = modules.reduce((sum, module) => sum + module.estimatedTime, 0);
    const exerciseTime = exercises.length * 30;
    
    return moduleTime + exerciseTime;
  }

  /**
   * Hauptmethode zur Generierung des Lernplans
   * @param options Optionale Parameter für die KI-Anfragen
   * @returns Vollständiger Lernplan mit Fähigkeitsbewertung, Zielen, Modulen und Übungen
   */
  async generateLearningPlan(options?: RequestOptions): Promise<LearningPlan> {
    console.log("Generiere personalisierten Lernplan für User:", this.userProfile.userId);
    console.log("Storage Type:", this.planOptions.storageType);
    console.log("Data Sources:", this.planOptions.dataSources);
    console.log("Include OHCHR Resources:", this.planOptions.includeOhchrResources);
    
    // Schritt 0: Lade relevante Daten aus den ausgewählten Quellen
    const sourceData = await this._loadDataFromSources();
    
    // Schritt 1: Identifiziere Fähigkeitslücken
    const basePrompt = `Basierend auf dem folgenden Benutzerprofil und der Skill-Bewertung, identifiziere die wichtigsten Fähigkeitslücken für einen Menschenrechtsverteidiger in der Rolle '${this.userProfile.role || 'General Defender'}'.
      Bewerte die aktuelle Stufe (1-5) und schlage eine Zielstufe vor. Berücksichtige die Interessen und bisherige Lerngeschichte.

      PROFIL:
      Skills (selbsteingeschätzt/bewertet): ${JSON.stringify(this.skillAssessment)}
      Interessen: ${this.userProfile.interests?.join(', ') || 'Keine angegeben'}
      Lerngeschichte (letzte 5): ${JSON.stringify(this.learningHistory.slice(-5))}

      ANFORDERUNG: Gib eine Liste von Fähigkeitslücken als JSON Array zurück.
      FORMAT (JSON Array):
      [
        {
          "skill": "Name der Fähigkeit",
          "currentLevel": 1-5,
          "targetLevel": 1-5,
          "importance": 1-5 // Wichtigkeit für die Rolle
        }
      ]
      Antworte NUR mit dem JSON Array.
    `;
    
    // Erweitere den Prompt mit Kontext aus Datenquellen
    const enhancedPrompt = this._enhancePromptWithData(basePrompt, sourceData);
    
    // Führe die KI-Anfrage mit dem erweiterten Prompt durch
    let skillGaps: SkillGap[] = [];
    try {
      const responseJsonString = await this.aiService.generateContent({
        prompt: enhancedPrompt,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        model: this.planOptions.aiModelPreference // Verwende vom Benutzer gewähltes Modell
      });
      skillGaps = JSON.parse(responseJsonString);
    } catch (error: any) {
      console.error(`Fehler bei der Identifizierung von Fähigkeitslücken:`, error);
      
      // Fallback: Sende einfache Lücken basierend auf dem Standardbewertungssystem zurück
      skillGaps = Object.entries(this.skillAssessment)
        .filter(([_, value]) => value < 4)
        .map(([skill, level]) => ({
          skill,
          currentLevel: level,
          targetLevel: Math.min(level + 2, 5),
          importance: 3
        }));
    }
    
    // Schritt 2: Priorisiere Lernziele basierend auf Lücken und aktuellen Fällen
    const prioritizedGoals = await this._prioritizeLearningGoals(
      skillGaps, 
      sourceData.cases || [], 
      options
    );
    
    // Schritt 3: Wähle passende Lernmodule
    const learningModules = await this._selectLearningModules(prioritizedGoals, options);
    
    // Schritt 4: Erstelle praktische Übungen
    const practicalExercises = this._createPracticalExercises(
      learningModules, 
      sourceData.cases || []
    );
    
    // Schritt 5: Plane Module und berechne Zeitaufwand
    const scheduledModules = this._scheduleLearningModules(learningModules);
    const timeInvestment = this._calculateTimeInvestment(learningModules, practicalExercises);
    
    // Gebe vollständigen Lernplan zurück
    return {
      skillAssessment: this.skillAssessment,
      prioritizedGoals,
      recommendedLearningPath: scheduledModules,
      practicalExercises,
      estimatedTimeInvestment: timeInvestment
    };
  }
}