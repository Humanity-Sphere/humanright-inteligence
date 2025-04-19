/**
 * AI-Optimizer für die Menschenrechtsverteidiger-App
 * 
 * Dieser Service bietet Funktionen zur Optimierung von KI-Anfragen 
 * für verschiedene Modelle und Anwendungsfälle:
 * - Optimierte Prompt-Gestaltung für unterschiedliche Modelle
 * - Spezifische Parameter-Konfigurationen je nach Aufgabentyp
 * - Strategisches Fallback zwischen Modellen
 */

import { RequestOptions } from './ai-service';
import { contextEnrichmentService } from './context-enrichment-service';

// Verfügbare Modelle mit ihren Stärken und optimalen Parametern
interface ModelProfile {
  id: string;         // Modell-ID für API-Aufrufe
  provider: 'gemini' | 'openrouter'; // KI-Provider
  strengths: string[]; // Stärken des Modells
  defaultParams: RequestOptions; // Standardparameter
  contextWindow: number; // Maximale Token-Anzahl für Eingabe
  outputLimit: number;  // Maximale Token-Anzahl für Ausgabe
  costTier: 'low' | 'medium' | 'high'; // Relative Kosteneinschätzung
  isMultimodal: boolean; // Unterstützt Bilder und Text
}

// Aufgabentypen für die Optimierung
export type TaskType = 
  | 'analysis' // Dokumentenanalyse (ausführlich, genau)
  | 'generation' // Inhaltsgenerierung (kreativ)
  | 'extraction' // Informationsextraktion (präzise)
  | 'summarization' // Zusammenfassung (knapp, relevant)
  | 'translation' // Übersetzung (genau, kontextuell)
  | 'legal' // Rechtliche Analyse (fachlich, konservativ)
  | 'creative' // Kreative Inhalte (vielfältig, originell)
  | 'educational' // Bildungsinhalte (verständlich, strukturiert)
  | 'advocacy'; // Advocacy-Material (überzeugend, zugänglich)

/**
 * Modellprofile mit spezifischen Stärken und Standardparametern
 */
const modelProfiles: Record<string, ModelProfile> = {
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    provider: 'gemini',
    strengths: ['Multimodale Analyse', 'Kontextverständnis', 'Neuste Informationen (bis 2023)', 'Komplexe Anfragen'],
    defaultParams: { temperature: 0.2, maxTokens: 8192, topP: 0.95, topK: 40 },
    contextWindow: 8192 * 2,  // Gemini 2.5 Pro hat ein größeres Kontextfenster
    outputLimit: 8192,
    costTier: 'medium',
    isMultimodal: true
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    strengths: ['Schnelle Antworten', 'Effizienz', 'Gut für einfachere Anfragen', 'Kostenoptimiert'],
    defaultParams: { temperature: 0.3, maxTokens: 4096, topP: 0.95, topK: 40 },
    contextWindow: 4096 * 2,
    outputLimit: 4096,
    costTier: 'low',
    isMultimodal: true
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    provider: 'gemini',
    strengths: ['Multimodale Analyse', 'Langkontext (Bis zu 1M Token)', 'Hohe Genauigkeit'],
    defaultParams: { temperature: 0.2, maxTokens: 4096, topP: 0.95, topK: 40 },
    contextWindow: 32000,
    outputLimit: 4096,
    costTier: 'medium',
    isMultimodal: true
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    provider: 'gemini',
    strengths: ['Gutes Preis-Leistungs-Verhältnis', 'Effizient', 'Ausgeglichen'],
    defaultParams: { temperature: 0.3, maxTokens: 4096, topP: 0.95, topK: 40 },
    contextWindow: 16000,
    outputLimit: 4096,
    costTier: 'low',
    isMultimodal: true
  },
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    provider: 'openrouter',
    strengths: ['Hohe Genauigkeit', 'Versteht Nuancen', 'Ethische Erwägungen', 'Fachlichkeit'],
    defaultParams: { temperature: 0.2, maxTokens: 4096, topP: 0.9 },
    contextWindow: 200000,
    outputLimit: 4096,
    costTier: 'medium',
    isMultimodal: true
  },
  'anthropic/claude-3-opus': {
    id: 'anthropic/claude-3-opus',
    provider: 'openrouter',
    strengths: ['Höchste Genauigkeit', 'Komplexes Reasoning', 'Gute ethische Bewertung', 'Rechtliche Analyse'],
    defaultParams: { temperature: 0.1, maxTokens: 4096, topP: 0.9 },
    contextWindow: 150000,
    outputLimit: 4096,
    costTier: 'high',
    isMultimodal: true
  },
  'anthropic/claude-3-sonnet': {
    id: 'anthropic/claude-3-sonnet',
    provider: 'openrouter',
    strengths: ['Ausgewogen', 'Verständliche Antworten', 'Ethische Abwägungen'],
    defaultParams: { temperature: 0.2, maxTokens: 4096, topP: 0.9 },
    contextWindow: 100000,
    outputLimit: 4096,
    costTier: 'medium',
    isMultimodal: true
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    provider: 'openrouter',
    strengths: ['Multimodaler All-Rounder', 'Kreativität', 'Aktuelle Informationen', 'Vielseitigkeit'],
    defaultParams: { temperature: 0.2, maxTokens: 4096, topP: 0.95 },
    contextWindow: 128000,
    outputLimit: 4096,
    costTier: 'medium',
    isMultimodal: true
  },
  'meta-llama/llama-3-70b': {
    id: 'meta-llama/llama-3-70b',
    provider: 'openrouter',
    strengths: ['Open-Source', 'Gute Allgemeinleistung', 'Effizienz'],
    defaultParams: { temperature: 0.3, maxTokens: 4096, topP: 0.95 },
    contextWindow: 8000,
    outputLimit: 4096,
    costTier: 'low',
    isMultimodal: false
  },
  'mistralai/mistral-large': {
    id: 'mistralai/mistral-large',
    provider: 'openrouter',
    strengths: ['Strukturierte Ausgaben', 'Gutes Reasoning', 'Ausgewogen'],
    defaultParams: { temperature: 0.3, maxTokens: 4096, topP: 0.95 },
    contextWindow: 32000,
    outputLimit: 4096,
    costTier: 'medium',
    isMultimodal: false
  }
};

/**
 * Aufgabenspezifische Optimierungsprofile
 */
const taskOptimizationProfiles: Record<TaskType, {
  preferredModels: string[];  // In Reihenfolge der Präferenz
  parameterAdjustments: Partial<RequestOptions>;
  promptStrategies: {
    prefix?: string;    // Text vor dem eigentlichen Prompt
    suffix?: string;    // Text nach dem Prompt
    formatGuidelines?: string; // Anweisungen zum Format
    useCOT?: boolean;   // "Chain of Thought" Prompting aktivieren
    useRAG?: boolean;   // Retrieval Augmented Generation aktivieren
  }
}> = {
  'analysis': {
    preferredModels: [
      'anthropic/claude-3-opus', 
      'gemini-2.5-pro', 
      'openai/gpt-4o', 
      'anthropic/claude-3.5-sonnet'
    ],
    parameterAdjustments: {
      temperature: 0.1, // Niedrige Temperatur für präzise und konsistente Analyse
      topP: 0.85,
      topK: 30
    },
    promptStrategies: {
      prefix: "Du bist ein Menschenrechtsexperte, der Dokumente auf Menschenrechtsverletzungen analysiert. Führe eine gründliche, objektive und präzise Analyse durch.\n\n",
      formatGuidelines: "\n\nStrukturiere die Analyse in folgende Abschnitte: 1) Zusammenfassung, 2) Identifizierte Menschenrechte, 3) Potentielle Verletzungen, 4) Empfehlungen, 5) Quellen und Referenzen.",
      useCOT: true,
      useRAG: true
    }
  },
  'generation': {
    preferredModels: [
      'openai/gpt-4o', 
      'gemini-2.5-pro', 
      'anthropic/claude-3-opus'
    ],
    parameterAdjustments: {
      temperature: 0.7, // Höhere Temperatur für kreativere Ausgaben
      topP: 0.92
    },
    promptStrategies: {
      prefix: "Du bist ein Menschenrechtsexperte, der überzeugende und fachlich korrekte Inhalte erstellt.\n\n",
      formatGuidelines: "\n\nAchte auf eine klare, zugängliche Sprache und eine überzeugende Struktur.",
      useRAG: true
    }
  },
  'extraction': {
    preferredModels: [
      'anthropic/claude-3-opus', 
      'openai/gpt-4o', 
      'gemini-2.5-pro'
    ],
    parameterAdjustments: {
      temperature: 0.0, // Minimal für konsistente, deterministische Extraktion
      topP: 0.5,
      topK: 10
    },
    promptStrategies: {
      prefix: "Du bist ein präziser Informationsextraktionsassistent. Extrahiere die folgenden spezifischen Informationen aus dem Text.\n\n",
      suffix: "\n\nWenn eine Information nicht im Text vorhanden ist, gib 'Nicht im Text gefunden' an. Füge keine Informationen hinzu, die nicht direkt im Text enthalten sind.",
      formatGuidelines: "\n\nGib die Informationen im JSON-Format zurück, gemäß der angeforderten Struktur.",
      useCOT: false,
      useRAG: false
    }
  },
  'summarization': {
    preferredModels: [
      'anthropic/claude-3.5-sonnet', 
      'gemini-2.5-flash', 
      'mistralai/mistral-large'
    ],
    parameterAdjustments: {
      temperature: 0.3,
      topP: 0.85
    },
    promptStrategies: {
      prefix: "Du bist ein Experte für präzise Zusammenfassungen. Erstelle eine prägnante und informative Zusammenfassung des folgenden Inhalts.\n\n",
      formatGuidelines: "\n\nDie Zusammenfassung sollte die Kernpunkte abdecken, etwa 10-15% der Länge des Originals betragen und die wichtigsten Schlüsselpunkte enthalten.",
      useCOT: false,
      useRAG: false
    }
  },
  'translation': {
    preferredModels: [
      'anthropic/claude-3-opus', 
      'gemini-2.5-pro', 
      'openai/gpt-4o'
    ],
    parameterAdjustments: {
      temperature: 0.2,
      topP: 0.8
    },
    promptStrategies: {
      prefix: "Du bist ein Übersetzungsexperte für Menschenrechtsdokumente. Übersetze den folgenden Text präzise unter Beibehaltung der Fachterminologie und Nuancen.\n\n",
      suffix: "\n\nWenn fachspezifische Begriffe vorkommen, füge bei Bedarf eine kurze Erklärung in Klammern hinzu.",
      useCOT: false,
      useRAG: false
    }
  },
  'legal': {
    preferredModels: [
      'anthropic/claude-3-opus', 
      'anthropic/claude-3-sonnet', 
      'openai/gpt-4o'
    ],
    parameterAdjustments: {
      temperature: 0.1,
      topP: 0.8
    },
    promptStrategies: {
      prefix: "Du bist ein Experte für internationales Menschenrecht und nationales Recht. Analysiere die rechtlichen Aspekte des folgenden Textes präzise und konservativ.\n\n",
      formatGuidelines: "\n\nStrukturiere die Antwort in: 1) Rechtliche Fragen, 2) Anwendbare Gesetze und Normen, 3) Rechtliche Analyse, 4) Schlussfolgerungen, 5) Empfehlungen.",
      useCOT: true,
      useRAG: true
    }
  },
  'creative': {
    preferredModels: [
      'openai/gpt-4o', 
      'gemini-2.5-pro', 
      'anthropic/claude-3.5-sonnet'
    ],
    parameterAdjustments: {
      temperature: 0.8,
      topP: 0.95,
      topK: 50
    },
    promptStrategies: {
      prefix: "Du bist ein kreativer Assistent für Menschenrechtsverteidiger, der überzeugende und wirkungsvolle Inhalte erstellt.\n\n",
      formatGuidelines: "\n\nSei kreativ, einfühlsam und überzeugend. Finde neue Perspektiven und Ausdrucksweisen, während du die Genauigkeit der Menschenrechtsprinzipien beibehältst.",
      useCOT: false,
      useRAG: true
    }
  },
  'educational': {
    preferredModels: [
      'gemini-2.5-pro', 
      'anthropic/claude-3-sonnet', 
      'openai/gpt-4o'
    ],
    parameterAdjustments: {
      temperature: 0.4,
      topP: 0.9
    },
    promptStrategies: {
      prefix: "Du bist ein Bildungsexperte für Menschenrechtsthemen. Erstelle verständliche, informative und pädagogisch wertvolle Inhalte zum folgenden Thema.\n\n",
      formatGuidelines: "\n\nGliedere den Inhalt in Einführung, Hauptteil mit klaren Abschnitten und Zusammenfassung. Verwende eine zugängliche Sprache und erkläre Fachbegriffe. Füge wenn möglich Lernziele, Diskussionsfragen und Übungen hinzu.",
      useCOT: false,
      useRAG: true
    }
  },
  'advocacy': {
    preferredModels: [
      'anthropic/claude-3.5-sonnet', 
      'openai/gpt-4o', 
      'gemini-2.5-pro'
    ],
    parameterAdjustments: {
      temperature: 0.6,
      topP: 0.92
    },
    promptStrategies: {
      prefix: "Du bist ein Kommunikationsexperte für Menschenrechtsthemen. Erstelle überzeugende, faktisch korrekte und zugängliche Inhalte für Advocacy-Zwecke.\n\n",
      formatGuidelines: "\n\nHalte die Sprache klar, prägnant und wirkungsvoll. Nutze starke Fakten und persönliche Geschichten, wo angemessen. Vermeide Fachjargon und konzentriere dich auf Lösungen und Handlungsmöglichkeiten.",
      useCOT: false,
      useRAG: true
    }
  }
};

export class AIOptimizer {
  /**
   * Wählt das optimale Modell basierend auf der Aufgabe und anderen Faktoren
   * 
   * @param taskType Art der Aufgabe
   * @param options Zusätzliche Optionen
   * @returns Das empfohlene Modell mit angepassten Parametern
   */
  selectOptimalModel(taskType: TaskType, options: {
    preferLowCost?: boolean;
    requireMultimodal?: boolean;
    inputTokenLength?: number;
    preferredProvider?: 'gemini' | 'openrouter';
  } = {}): { modelId: string; provider: 'gemini' | 'openrouter'; parameters: RequestOptions } {
    const { preferLowCost, requireMultimodal, inputTokenLength, preferredProvider } = options;
    
    // Wähle die bevorzugten Modelle für diese Aufgabe
    let candidateModels = [...taskOptimizationProfiles[taskType].preferredModels];
    
    // Filtere basierend auf Anforderungen
    if (requireMultimodal) {
      candidateModels = candidateModels.filter(id => modelProfiles[id].isMultimodal);
    }
    
    if (preferredProvider) {
      const providerModels = candidateModels.filter(id => modelProfiles[id].provider === preferredProvider);
      // Nur wenn Provider-Modelle verfügbar sind, filtere
      if (providerModels.length > 0) {
        candidateModels = providerModels;
      }
    }
    
    // Filtere basierend auf Kontextfenster, wenn inputTokenLength angegeben ist
    if (inputTokenLength) {
      candidateModels = candidateModels.filter(id => {
        const contextWindow = modelProfiles[id].contextWindow;
        // Füge einen Puffer hinzu (75% der maximalen Kapazität)
        return inputTokenLength <= (contextWindow * 0.75);
      });
    }
    
    // Sortiere nach Kosten, wenn niedriger Preis bevorzugt wird
    if (preferLowCost) {
      candidateModels.sort((a, b) => {
        const costA = modelProfiles[a].costTier === 'low' ? 0 : 
                     (modelProfiles[a].costTier === 'medium' ? 1 : 2);
        const costB = modelProfiles[b].costTier === 'low' ? 0 : 
                     (modelProfiles[b].costTier === 'medium' ? 1 : 2);
        return costA - costB;
      });
    }
    
    // Wähle das Top-Modell oder Fallback zum ersten bevorzugten Modell
    const selectedModelId = candidateModels.length > 0 ? 
      candidateModels[0] : 
      taskOptimizationProfiles[taskType].preferredModels[0];
    
    const selectedModel = modelProfiles[selectedModelId];
    
    // Kombiniere Standardparameter mit aufgabenspezifischen Anpassungen
    const baseParameters = { ...selectedModel.defaultParams };
    const taskAdjustments = taskOptimizationProfiles[taskType].parameterAdjustments;
    
    const finalParameters: RequestOptions = {
      ...baseParameters,
      ...taskAdjustments
    };
    
    return {
      modelId: selectedModelId,
      provider: selectedModel.provider,
      parameters: finalParameters
    };
  }
  
  /**
   * Optimiert einen Prompt für die spezifische Aufgabe und das ausgewählte Modell
   * 
   * @param originalPrompt Der ursprüngliche Prompt-Text
   * @param taskType Art der Aufgabe
   * @param options Zusätzliche Optionen
   * @returns Optimierter Prompt
   */
  optimizePrompt(originalPrompt: string, taskType: TaskType, options: {
    enrichWithResources?: boolean;
    modelId?: string;
    useStructuredOutput?: boolean;
    outputFormat?: 'json' | 'markdown' | 'html' | 'text';
  } = {}): string {
    const taskProfile = taskOptimizationProfiles[taskType];
    const { enrichWithResources, modelId, useStructuredOutput, outputFormat } = options;
    
    let optimizedPrompt = originalPrompt;
    
    // Füge Präfix hinzu
    if (taskProfile.promptStrategies.prefix) {
      optimizedPrompt = taskProfile.promptStrategies.prefix + optimizedPrompt;
    }
    
    // Füge Chain-of-Thought Anweisungen hinzu, wenn aktiviert
    if (taskProfile.promptStrategies.useCOT) {
      optimizedPrompt += "\n\nUm zu einer gründlichen Antwort zu gelangen, denke Schritt für Schritt:";
      optimizedPrompt += "\n1. Verstehe die Frage und identifiziere die Kernthemen";
      optimizedPrompt += "\n2. Sammle relevante Fakten und Informationen";
      optimizedPrompt += "\n3. Analysiere systematisch unter Berücksichtigung verschiedener Perspektiven";
      optimizedPrompt += "\n4. Ziehe logische Schlussfolgerungen";
      optimizedPrompt += "\n5. Formuliere eine präzise Antwort";
    }
    
    // Füge Format-Richtlinien hinzu
    if (taskProfile.promptStrategies.formatGuidelines) {
      optimizedPrompt += taskProfile.promptStrategies.formatGuidelines;
    }
    
    // Spezifische Formatierungsanweisungen basierend auf dem gewünschten Ausgabeformat
    if (useStructuredOutput && outputFormat) {
      switch (outputFormat) {
        case 'json':
          optimizedPrompt += "\n\nFormatiere die Antwort als gültiges JSON-Objekt.";
          break;
        case 'markdown':
          optimizedPrompt += "\n\nFormatiere die Antwort in Markdown mit Überschriften, Listen und anderen Elementen zur besseren Lesbarkeit.";
          break;
        case 'html':
          optimizedPrompt += "\n\nFormatiere die Antwort als HTML-Struktur mit entsprechenden Tags für Überschriften, Absätze, Listen und andere Elemente.";
          break;
        default:
          optimizedPrompt += "\n\nFormatiere die Antwort als gut strukturierten Text mit klaren Abschnitten.";
      }
    }
    
    // Füge modellspezifische Optimierungen hinzu
    if (modelId && modelProfiles[modelId]) {
      // Hier können modellspezifische Anpassungen erfolgen
      // z.B. bestimmte Formulierungen, die für ein bestimmtes Modell besser funktionieren
    }
    
    // Füge Suffix hinzu
    if (taskProfile.promptStrategies.suffix) {
      optimizedPrompt += taskProfile.promptStrategies.suffix;
    }
    
    // Reichere mit OHCHR-Ressourcen an, wenn gewünscht und für die Aufgabe vorgesehen
    if (enrichWithResources && taskProfile.promptStrategies.useRAG) {
      optimizedPrompt = contextEnrichmentService.enrichPromptWithResources(optimizedPrompt, {
        limit: 3,
        format: 'text',
        addToBeginning: false
      });
    }
    
    return optimizedPrompt;
  }
  
  /**
   * Gibt alle verfügbaren Modellprofile zurück
   * 
   * @returns Liste aller Modellprofile
   */
  getAllModelProfiles(): ModelProfile[] {
    return Object.values(modelProfiles);
  }
  
  /**
   * Gibt ein spezifisches Modellprofil zurück
   * 
   * @param modelId ID des Modells
   * @returns Modellprofil oder undefined, wenn nicht gefunden
   */
  getModelProfile(modelId: string): ModelProfile | undefined {
    return modelProfiles[modelId];
  }
  
  /**
   * Gibt empfohlene Modelle für einen bestimmten Aufgabentyp zurück
   * 
   * @param taskType Art der Aufgabe
   * @returns Array von Modell-IDs, sortiert nach Empfehlung
   */
  getRecommendedModelsForTask(taskType: TaskType): string[] {
    return taskOptimizationProfiles[taskType]?.preferredModels || [];
  }
}

// Singleton-Instanz
export const aiOptimizer = new AIOptimizer();