/**
 * STORM Adapter für die Integration mit den bestehenden AI-Services
 * 
 * Dieser Adapter ermöglicht die nahtlose Integration des STORM-Frameworks
 * mit den vorhandenen KI-Diensten der Anwendung.
 */

// Import-Typen definieren
interface DocumentAnalysisResult {
  beteiligte_parteien: string[];
  rechtliche_grundlagen: { reference: string; description: string }[];
  zentrale_fakten: string[];
  menschenrechtliche_implikationen: string[];
  verbindungen: string[];
  zeitliche_abfolge: string[];
  schlüsselwörter: string[];
  sentiment?: string;
  suggestedActions?: string[];
  contradictions?: { statement1: string; statement2: string; explanation: string }[];
}

enum TaskType {
  CREATIVE_WRITING = "CREATIVE_WRITING",
  DOCUMENT_ANALYSIS = "DOCUMENT_ANALYSIS",
  CODE_GENERATION = "CODE_GENERATION",
  TRANSLATION = "TRANSLATION",
  SUMMARIZATION = "SUMMARIZATION",
  QUESTION_ANSWERING = "QUESTION_ANSWERING"
}

// Interface für den AIService mit STORM-spezifischen Methoden
interface IAIService {
  analyzeDocumentForStorm(document: { title?: string; type?: string; content: string }): Promise<DocumentAnalysisResult>;
  generateContent(params: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    enrichWithResources?: boolean;
    taskType?: TaskType;
    preferLowCost?: boolean;
    outputFormat?: 'json' | 'markdown' | 'html' | 'text';
  }): Promise<string>;
  detectPatterns(documents: Array<{ id: number; content: string }>): Promise<any>;
  suggestLegalStrategy(caseData: any): Promise<any>;
}
import StormService, { StormGenerationResult } from './index';
import { IStorage } from '../../storage';

interface SyntheticConversationOptions {
  topic: string;
  numTurns?: number;
  numPersonas?: number;
  language?: string;
  perspectives?: string[];
  useRealData?: boolean;
}

interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  conversations: StormGenerationResult[];
  metadata: {
    created: Date;
    topics: string[];
    totalConversations: number;
    totalTurns: number;
  };
}

/**
 * StormAdapter verbindet den STORM-Service mit den bestehenden KI-Diensten
 * für die Erzeugung synthetischer Trainingsdaten
 */
export class StormAdapter {
  private stormService: StormService;
  private aiService: IAIService;
  private datasets: Map<string, TrainingDataset> = new Map();
  
  constructor(stormService: StormService, aiService: IAIService) {
    this.stormService = stormService;
    this.aiService = aiService;
  }
  
  /**
   * Erzeugt synthetische Konversationsdaten zu einem bestimmten Thema
   */
  public async generateSyntheticConversation(options: SyntheticConversationOptions): Promise<StormGenerationResult> {
    console.log(`Erzeuge synthetische Konversation zum Thema: ${options.topic}`);
    
    try {
      // Wenn in einem Mock-Modus oder bei bestimmten Themen, verwende lokale Funktionen
      if (!options.useRealData) {
        return this.generateLocalConversation(options);
      }
      
      // Ansonsten verwende den STORM-Service
      const result = await this.stormService.generateConversation(
        options.topic,
        {
          numPersonas: options.numPersonas,
          numTurns: options.numTurns,
          perspectives: options.perspectives,
          language: options.language
        }
      );
      
      return result;
    } catch (error) {
      console.error('Fehler bei der Erzeugung synthetischer Konversationsdaten:', error);
      
      // Bei einem Fehler zurückfallen auf lokale Generierung
      return this.generateLocalConversation(options);
    }
  }
  
  /**
   * Analysiert bestehende Konversationen mit KI und extrahiert nützliche Informationen
   */
  public async analyzeConversation(conversationId: string): Promise<DocumentAnalysisResult> {
    const conversation = await this.stormService.getConversationById(conversationId);
    
    if (!conversation) {
      throw new Error(`Konversation mit ID ${conversationId} nicht gefunden`);
    }
    
    // Konversation in einen Text umwandeln
    let conversationText = `Thema: ${conversation.topic}\n\n`;
    
    for (const turn of conversation.conversation) {
      conversationText += `${turn.speaker}: ${turn.utterance}\n`;
    }
    
    // KI-Service zur Analyse verwenden
    const analysis = await this.aiService.analyzeDocumentForStorm({
      title: `Konversation zu ${conversation.topic}`,
      type: 'conversation',
      content: conversationText
    });
    
    return analysis;
  }
  
  /**
   * Extrahiert Trainingsmuster aus mehreren Konversationen für das Training von KI-Modellen
   */
  public async extractTrainingPatterns(conversationIds: string[]): Promise<any> {
    const conversations = [];
    
    for (const id of conversationIds) {
      const conversation = await this.stormService.getConversationById(id);
      if (conversation) {
        conversations.push(conversation);
      }
    }
    
    // Konversationsdaten in ein Format umwandeln, das für das KI-Training geeignet ist
    const trainingSamples = this.prepareConversationsForTraining(conversations);
    
    // Muster in den Trainingsbeispielen identifizieren
    const patterns = await this.aiService.detectPatterns(
      trainingSamples.map((sample, index) => ({
        id: index,
        content: JSON.stringify(sample)
      }))
    );
    
    return patterns;
  }
  
  /**
   * Erstellt einen synthetischen Trainingsdatensatz mit mehreren Konversationen
   */
  public async createTrainingDataset(
    name: string, 
    description: string, 
    topics: string[], 
    conversationsPerTopic: number = 3
  ): Promise<TrainingDataset> {
    const conversations: StormGenerationResult[] = [];
    
    // Für jedes Thema mehrere Konversationen erzeugen
    for (const topic of topics) {
      for (let i = 0; i < conversationsPerTopic; i++) {
        try {
          const result = await this.generateSyntheticConversation({
            topic,
            numTurns: 8 + Math.floor(Math.random() * 7), // 8-14 Turns
            numPersonas: 2 + Math.floor(Math.random() * 2), // 2-3 Personas
            language: 'de',
            useRealData: true
          });
          
          conversations.push(result);
        } catch (error) {
          console.error(`Fehler bei der Erzeugung einer Konversation zum Thema ${topic}:`, error);
        }
      }
    }
    
    // Datensatz erstellen
    const datasetId = `dataset_${Date.now()}`;
    const dataset: TrainingDataset = {
      id: datasetId,
      name,
      description,
      conversations,
      metadata: {
        created: new Date(),
        topics,
        totalConversations: conversations.length,
        totalTurns: conversations.reduce((total, conv) => total + conv.conversation.length, 0)
      }
    };
    
    this.datasets.set(datasetId, dataset);
    
    return dataset;
  }
  
  /**
   * Bereitet Konversationen für das KI-Training vor
   */
  private prepareConversationsForTraining(conversations: StormGenerationResult[]): any[] {
    const samples = [];
    
    for (const conversation of conversations) {
      // Rollenbasierte Gruppierung
      const speakerRoles: Record<string, string> = {};
      
      // Ordne Sprechern Rollen zu
      for (const persona of conversation.personas) {
        speakerRoles[persona.name] = persona.role;
      }
      
      // Für jede Unterhaltungsrunde
      for (let i = 0; i < conversation.conversation.length - 1; i++) {
        const currentTurn = conversation.conversation[i];
        const nextTurn = conversation.conversation[i + 1];
        
        samples.push({
          input: {
            topic: conversation.topic,
            speaker: currentTurn.speaker,
            role: speakerRoles[currentTurn.speaker] || 'unknown',
            utterance: currentTurn.utterance,
            turnIndex: currentTurn.turn
          },
          output: {
            nextSpeaker: nextTurn.speaker,
            nextRole: speakerRoles[nextTurn.speaker] || 'unknown',
            nextUtterance: nextTurn.utterance
          }
        });
      }
    }
    
    return samples;
  }
  
  /**
   * Generiert synthetische Konversationsdaten lokal (ohne externe Abhängigkeiten)
   */
  private async generateLocalConversation(options: SyntheticConversationOptions): Promise<StormGenerationResult> {
    // Personas für die synthetische Konversation erstellen
    const numPersonas = options.numPersonas || 2;
    const personas = [];
    
    const personaTypes = [
      { name: "Menschenrechtsexperte", role: "Experte", description: "Ein erfahrener Menschenrechtsexperte mit Fokus auf Dokumentation von Menschenrechtsverletzungen." },
      { name: "Betroffener", role: "Zeuge", description: "Eine Person, die persönliche Erfahrungen mit dem diskutierten Thema gemacht hat." },
      { name: "Anwalt", role: "Rechtsberater", description: "Ein Rechtsanwalt mit Fokus auf Menschenrechtsrecht und internationale Konventionen." },
      { name: "Aktivist", role: "Verteidiger", description: "Ein aktiver Menschenrechtsverteidiger, der sich für Betroffene einsetzt." },
      { name: "Journalist", role: "Berichterstatter", description: "Ein Journalist, der über Menschenrechtsverletzungen berichtet." }
    ];
    
    // Wähle numPersonas aus den verfügbaren Typen
    for (let i = 0; i < numPersonas; i++) {
      if (i < personaTypes.length) {
        personas.push(personaTypes[i]);
      }
    }
    
    // Synthetische Unterhaltung erzeugen
    const numTurns = options.numTurns || 10;
    const conversation = [];
    
    // Verwende das KI-System, um die Konversation zu generieren
    if (this.aiService) {
      try {
        // Prompt für die KI erstellen
        const prompt = `
Erstelle eine simulierte Konversation zum Thema "${options.topic}" mit ${numPersonas} Teilnehmern:
${personas.map(p => `- ${p.name} (${p.role}): ${p.description}`).join('\n')}

Die Konversation sollte ${numTurns} Wechsel umfassen und einen natürlichen Dialog darstellen.
Formatiere die Konversation als Liste mit dem Namen des Sprechers am Anfang jeder Zeile.
        `;
        
        // KI-Generierung für den Konversationstext
        const generatedText = await this.aiService.generateContent({
          prompt,
          taskType: TaskType.CREATIVE_WRITING,
          enrichWithResources: false
        });
        
        // Parsen der generierten Konversation
        const lines = generatedText.split('\n').filter(line => line.trim() !== '');
        
        for (let i = 0; i < Math.min(lines.length, numTurns); i++) {
          const line = lines[i];
          
          // Versuche, den Sprecher und die Äußerung zu extrahieren
          const match = line.match(/^([^:]+):(.*)/);
          
          if (match) {
            const speakerName = match[1].trim();
            const utterance = match[2].trim();
            
            conversation.push({
              speaker: speakerName,
              utterance,
              turn: i + 1,
              metadata: {
                intent: 'unknown',
                sentiment: 'neutral'
              }
            });
          }
        }
      } catch (error) {
        console.error('Fehler bei der KI-gestützten Konversationsgenerierung:', error);
      }
    }
    
    // Wenn die KI-Generierung fehlgeschlagen ist oder keine Ergebnisse lieferte, fallback zu einfachen Beispieldialogen
    if (conversation.length === 0) {
      for (let i = 0; i < numTurns; i++) {
        const persona = personas[i % personas.length];
        
        conversation.push({
          speaker: persona.name,
          utterance: this.generateSampleUtterance(options.topic, persona, i),
          turn: i + 1,
          metadata: {
            intent: i % 2 === 0 ? 'informieren' : 'fragen',
            sentiment: 'neutral'
          }
        });
      }
    }
    
    return {
      id: `local_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      topic: options.topic,
      personas,
      conversation,
      createdAt: new Date(),
      success: true
    };
  }
  
  /**
   * Generiert eine einfache Beispieläußerung für ein Thema und eine Persona
   */
  private generateSampleUtterance(topic: string, persona: { name: string; role: string; description: string }, turnIndex: number): string {
    const templates = [
      `Als ${persona.role} möchte ich betonen, dass ${topic} eine wichtige Rolle in der Menschenrechtssituation spielt.`,
      `Basierend auf meinen Erfahrungen als ${persona.role} kann ich sagen, dass ${topic} viele Menschen betrifft.`,
      `Es ist wichtig, dass wir bei ${topic} die rechtlichen Aspekte berücksichtigen.`,
      `In meiner Rolle als ${persona.role} habe ich beobachtet, dass ${topic} oft missverstanden wird.`,
      `Wie können wir sicherstellen, dass ${topic} in unserer Dokumentation angemessen behandelt wird?`,
      `Ich denke, wir sollten diesen Fall im Kontext von ${topic} genauer analysieren.`,
      `Meine Erfahrung mit ${topic} zeigt, dass wir mehr Unterstützung für Betroffene benötigen.`,
      `Es gibt verschiedene Perspektiven zu ${topic}, die wir in unserer Arbeit berücksichtigen sollten.`
    ];
    
    return templates[turnIndex % templates.length];
  }
}

export default StormAdapter;