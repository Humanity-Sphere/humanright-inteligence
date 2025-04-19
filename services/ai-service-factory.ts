/**
 * AI Service Factory
 * 
 * Diese Datei stellt eine Fabrik bereit, die verschiedene AI-Services instanziiert,
 * basierend auf der Konfiguration und Verfügbarkeit.
 */

import { log } from '../utils/logging';

/**
 * Aufgabentypen für KI-Dienste
 */
export enum TaskType {
  QUESTION_ANSWERING = 'question_answering',
  TEXT_GENERATION = 'text_generation',
  DOCUMENT_ANALYSIS = 'document_analysis',
  PATTERN_DETECTION = 'pattern_detection',
  LEGAL_STRATEGY = 'legal_strategy',
  LEGAL_ANALYSIS = 'legal_analysis',
  SUMMARIZATION = 'summarization',
  TRANSLATION = 'translation',
  CONTENT_MODERATION = 'content_moderation',
  BRAINSTORMING = 'brainstorming',
  CREATIVE_WRITING = 'creative_writing',
  CODE_GENERATION = 'code_generation',
  RISK_ASSESSMENT = 'risk_assessment',
  DATA_ANALYSIS = 'data_analysis'
}

// Mock-Interface für den AI-Service
interface IAIService {
  generateContent: (params: any) => Promise<string>;
  analyzeDocument: (document: any) => Promise<any>;
  detectPatterns: (documents: any[]) => Promise<any>;
  suggestLegalStrategy: (caseData: any) => Promise<any>;
}

// Singleton-Instance für den AI-Service-Factory
let factoryInstance: AIServiceFactory | null = null;

/**
 * AI-Service-Factory
 * Erstellt und verwaltet Instanzen verschiedener AI-Services
 */
class AIServiceFactory {
  private defaultService: IAIService | null = null;
  private services: Map<string, IAIService> = new Map();
  
  constructor() {
    // Initialisiere die Factory
    this.initialize();
  }
  
  /**
   * Initialisiert die AI-Service-Factory
   */
  private initialize(): void {
    try {
      log('Initialisiere AI-Service-Factory...', 'info');
      
      // Erstelle Standard-Service (simuliert)
      this.defaultService = this.createMockAIService();
      
      // Registriere verschiedene Service-Provider
      this.services.set('gemini', this.createMockAIService());
      this.services.set('openai', this.createMockAIService());
      this.services.set('groq', this.createMockAIService());
      
      log('AI-Service-Factory erfolgreich initialisiert', 'info');
    } catch (error) {
      log(`Fehler bei der Initialisierung der AI-Service-Factory: ${error}`, 'error');
    }
  }
  
  /**
   * Erstellt einen simulierten AI-Service für Demonstrationszwecke
   */
  private createMockAIService(): IAIService {
    return {
      generateContent: async (params: any) => {
        // Simulierte Content-Generierung
        const prompt = params.prompt || '';
        return `Generierter Inhalt basierend auf: "${prompt.substring(0, 30)}..."`;
      },
      
      analyzeDocument: async (document: any) => {
        // Simulierte Dokumentenanalyse
        return {
          topics: ['Menschenrechte', 'Dokumentation', 'Analyse'],
          sentiment: 'neutral',
          keyFindings: ['Wichtiger Punkt 1', 'Wichtiger Punkt 2'],
          entities: ['Person A', 'Organisation B'],
          legalReferences: ['Artikel 1 AEMR', 'Artikel 5 EMRK']
        };
      },
      
      detectPatterns: async (documents: any[]) => {
        // Simulierte Mustererkennung
        return {
          patterns: [
            {
              name: 'Muster 1',
              description: 'Beschreibung von Muster 1',
              confidence: 0.85
            },
            {
              name: 'Muster 2',
              description: 'Beschreibung von Muster 2',
              confidence: 0.72
            }
          ]
        };
      },
      
      suggestLegalStrategy: async (caseData: any) => {
        // Simulierte Strategie-Vorschläge
        return {
          recommendations: [
            'Empfehlung 1',
            'Empfehlung 2',
            'Empfehlung 3'
          ],
          legalFramework: 'Menschenrechtsrahmen XYZ',
          riskAssessment: 'Mittleres Risiko'
        };
      }
    };
  }
  
  /**
   * Gibt den Standard-AI-Service zurück
   */
  getDefaultService(): IAIService | null {
    return this.defaultService;
  }
  
  /**
   * Gibt einen bestimmten AI-Service zurück
   * @param provider Der Name des Service-Providers
   */
  getService(provider: string): IAIService | null {
    return this.services.get(provider) || this.defaultService;
  }
  
  /**
   * Gibt alle verfügbaren Service-Provider zurück
   */
  getAvailableProviders(): string[] {
    return Array.from(this.services.keys());
  }
  
  /**
   * Wählt den optimalen Service basierend auf den gegebenen Anforderungen aus
   * @param options Die Optionen für die Serviceauswahl
   */
  selectOptimalService(options: { 
    taskType?: TaskType; 
    preferLowCost?: boolean; 
    preferredProvider?: string;
  }): IAIService {
    const { taskType, preferLowCost, preferredProvider } = options;
    
    // Falls ein bevorzugter Provider angegeben wurde und verfügbar ist
    if (preferredProvider && this.services.has(preferredProvider)) {
      return this.services.get(preferredProvider)!;
    }
    
    // Fall kein bevorzugter Provider angegeben wurde, wähle den am besten geeigneten aus
    // In dieser Version wählen wir einfach nach dem Aufgabentyp aus
    if (taskType) {
      switch (taskType) {
        case TaskType.DOCUMENT_ANALYSIS:
        case TaskType.PATTERN_DETECTION:
          // Für komplexe Analysen bevorzugen wir OpenAI (falls verfügbar)
          if (this.services.has('openai') && !preferLowCost) {
            return this.services.get('openai')!;
          }
          break;
          
        case TaskType.QUESTION_ANSWERING:
        case TaskType.TEXT_GENERATION:
          // Für Textgenerierung bevorzugen wir Gemini oder Groq
          if (this.services.has('gemini')) {
            return this.services.get('gemini')!;
          } else if (this.services.has('groq')) {
            return this.services.get('groq')!;
          }
          break;
          
        default:
          // Für sonstige Aufgaben
          break;
      }
    }
    
    // Fallback: Default-Service zurückgeben
    return this.defaultService!;
  }
}

/**
 * Gibt die Singleton-Instanz der AI-Service-Factory zurück
 */
export function getAIServiceFactory(): AIServiceFactory {
  if (!factoryInstance) {
    factoryInstance = new AIServiceFactory();
  }
  
  return factoryInstance;
}

/**
 * Gibt einen AI-Service basierend auf dem Provider zurück
 * @param provider Der Name des Service-Providers (optional)
 */
export function getAIService(provider?: string): IAIService | null {
  const factory = getAIServiceFactory();
  
  if (provider) {
    return factory.getService(provider);
  } else {
    return factory.getDefaultService();
  }
}

/**
 * Gibt den Standard-AI-Service zurück
 */
export function getDefaultAIService(): IAIService | null {
  const factory = getAIServiceFactory();
  return factory.getDefaultService();
}

/**
 * Hilfsfunktion, um die aktuell aktive AI-Service-Instanz zu erhalten
 */
export function getAIServiceInstance(): IAIService | null {
  return getAIService();
}