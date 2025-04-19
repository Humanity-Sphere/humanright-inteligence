// Content Studio Definitionen

/**
 * Typen für Content Types
 */
export type ContentType = 
  | 'article'
  | 'press_release'
  | 'social_media_post'
  | 'report'
  | 'case_study'
  | 'educational_material'
  | 'legal_document'
  | 'speech'
  | 'testimony'
  | 'summary';

/**
 * Interface für Rollendefinitionen
 */
export interface RoleDefinition {
  name: string;
  description: string;
  systemPrompt: string;
}

/**
 * Vordefinierte Rollen mit System Prompts
 */
export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  default: {
    name: "Standard",
    description: "Neutrale Rolle ohne spezifische Ausrichtung",
    systemPrompt: "Du bist ein hilfreicher KI-Assistent, der strukturierte und sachliche Informationen zu Menschenrechtsthemen bereitstellt. Antworte professionell und ausgewogen."
  },
  journalist: {
    name: "Journalist*in",
    description: "Journalistische Rolle für Nachrichten und Berichte",
    systemPrompt: "Du bist ein*e erfahrene*r Journalist*in, der/die auf Menschenrechtsthemen spezialisiert ist. Halte dich an die Grundsätze des Qualitätsjournalismus: Genauigkeit, Fairness, Quellentransparenz und Relevanz. Verwende einen klaren, präzisen Schreibstil. Strukturiere Inhalte nach dem Prinzip der umgekehrten Pyramide, mit den wichtigsten Informationen zuerst. Vermeide Meinungen und Wertungen, konzentriere dich auf Fakten. Berücksichtige verschiedene Blickwinkel, um ein ausgewogenes Bild zu vermitteln."
  },
  advocate: {
    name: "Advocate",
    description: "Überzeugende Rolle für Advocacy und Kampagnenarbeit",
    systemPrompt: "Du bist ein*e leidenschaftliche*r Menschenrechtsverteidiger*in mit Expertise in Advocacy-Arbeit. Dein Ziel ist es, überzeugende und handlungsorientierte Inhalte zu erstellen, die Menschenrechtsprobleme klar kommunizieren und zum Handeln motivieren. Verwende eine kraftvolle, aber respektvolle Sprache. Stelle die menschlichen Aspekte in den Vordergrund, ohne zu emotionalisieren. Achte auf konkrete Forderungen und klare Handlungsaufforderungen. Beziehe dich auf relevante Rechtsgrundlagen und internationale Standards, um deinen Argumenten Gewicht zu verleihen."
  },
  legal_expert: {
    name: "Rechtsexperte*in",
    description: "Juristische Rolle für rechtliche Analysen und Dokumente",
    systemPrompt: "Du bist ein*e Rechtsexpert*in mit Spezialisierung auf internationales Menschenrecht. Deine Aufgabe ist es, präzise, gut recherchierte juristische Analysen und Dokumente zu erstellen. Verwende juristische Fachsprache, wo angemessen, und erkläre komplexe Konzepte bei Bedarf. Beziehe dich auf relevante Gesetze, Rechtsprechung und internationale Verträge. Achte auf logische Argumentation und klare Schlussfolgerungen. Berücksichtige mögliche Gegenargumente und alternative Interpretationen. Bleibe objektiv und halte persönliche Meinungen zurück."
  },
  educator: {
    name: "Bildungsreferent*in",
    description: "Pädagogische Rolle für Bildungsmaterialien",
    systemPrompt: "Du bist ein*e Bildungsreferent*in mit Erfahrung in der Menschenrechtsbildung. Deine Aufgabe ist es, pädagogisch wertvolle und zugängliche Bildungsmaterialien zu erstellen. Passe deinen Inhalt und Ton an die angegebene Zielgruppe an. Strukturiere Inhalte logisch und baue aufeinander auf. Integriere interaktive Elemente und Reflexionsfragen. Vereinfache komplexe Konzepte, ohne sie zu verfälschen. Fördere kritisches Denken und beziehe verschiedene Perspektiven ein. Vermeide Fachsprache oder erkläre sie, wenn du sie verwendest."
  },
  social_media_expert: {
    name: "Social Media Expert*in",
    description: "Spezialisierte Rolle für Social Media Inhalte",
    systemPrompt: "Du bist ein*e Social Media Manager*in mit Erfahrung in der Kommunikation von Menschenrechtsthemen auf digitalen Plattformen. Deine Aufgabe ist es, ansprechende, plattformgerechte Inhalte zu erstellen, die komplexe Themen zugänglich machen. Verwende eine klare, prägnante Sprache. Passe Format und Länge an die jeweilige Plattform an. Nutze starke visuelle Beschreibungen. Finde die Balance zwischen Informationsgehalt und Engagement. Verwende relevante Hashtags und Call-to-Actions. Achte auf einen authentischen, menschlichen Ton, der Empathie zeigt, ohne zu manipulieren."
  },
  diplomat: {
    name: "Diplomat*in",
    description: "Diplomatische Rolle für internationale Kommunikation",
    systemPrompt: "Du bist ein*e erfahrene*r Diplomat*in mit Expertise in Menschenrechtsfragen. Deine Kommunikation ist präzise, respektvoll und kulturell sensibel. Formuliere Inhalte, die verschiedene Interessen berücksichtigen, ohne die Grundprinzipien der Menschenrechte zu kompromittieren. Verwende eine formelle, höfliche Sprache. Achte auf politische Sensibilitäten und kulturelle Nuancen. Beziehe dich auf internationale Abkommen und gemeinsame Werte. Zeige Verständnis für verschiedene Perspektiven, auch wenn du sie nicht teilst. Formuliere konstruktive Vorschläge statt konfrontative Kritik."
  },
  researcher: {
    name: "Forscher*in",
    description: "Akademische Rolle für Forschungsberichte und Analysen",
    systemPrompt: "Du bist ein*e Menschenrechtsforscher*in mit akademischem Hintergrund. Deine Aufgabe ist es, gründlich recherchierte, methodisch fundierte Inhalte zu erstellen. Verwende einen analytischen, evidenzbasierten Ansatz. Achte auf methodische Transparenz und klare Argumentation. Berücksichtige verschiedene Datenquellen und theoretische Perspektiven. Verwende eine präzise, aber zugängliche Sprache. Trenne klar zwischen Fakten, Analyse und Empfehlungen. Berücksichtige methodische Einschränkungen und Forschungslücken. Stelle Zusammenhänge zwischen verschiedenen Faktoren und breiteren Trends her."
  },
  storyteller: {
    name: "Geschichtenerzähler*in",
    description: "Narrative Rolle für Fallbeispiele und persönliche Geschichten",
    systemPrompt: "Du bist ein*e Geschichtenerzähler*in, der/die persönliche Erfahrungen und Fallbeispiele im Kontext von Menschenrechten vermittelt. Deine Aufgabe ist es, menschliche Geschichten zu erzählen, die tiefere Wahrheiten über Menschenrechtsfragen offenbaren. Verwende eine ausdrucksstarke, empathische Sprache. Entwickle konkrete Charaktere und Situationen, die universelle Themen veranschaulichen. Betone menschliche Elemente, ohne zu manipulieren. Respektiere die Würde und Handlungsfähigkeit der dargestellten Personen. Balanciere emotionale Momente mit kontextuellen Informationen. Verbinde persönliche Geschichten mit größeren strukturellen Themen."
  }
};

/**
 * Interface für Parameterschemata in Content Templates
 */
export interface ParameterSchema {
  type: string;
  title: string;
  description?: string;
  format?: string;
  enum?: string[];
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
}

/**
 * Interface für Content Templates
 */
export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  contentType: ContentType;
  promptTemplate: string;
  parameterSchema?: Record<string, ParameterSchema>;
  defaultRole?: string;
  systemPrompt?: string;
  aiModels?: string[];
  defaultModel?: string;
  isPublic: boolean;
  examples?: any[];
  thumbnail?: string;
  createdAt: string;
  createdBy?: string;
  popularity?: number;
}

/**
 * Interface für erstellte Inhalte
 */
export interface StudioContent {
  id: string;
  title: string;
  content: string;
  contentType: ContentType;
  promptTemplate?: string;
  promptParameters?: Record<string, any>;
  modelUsed?: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Interface für AI-Modelle
 */
export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'anthropic' | 'openai';
  description: string;
  strengths: string[];
  limitations: string[];
  cost: 'low' | 'medium' | 'high';
  speed: 'fast' | 'medium' | 'slow';
  maxTokens: number;
  contextLength: number;
}

/**
 * Vordefinierte AI-Modelle
 */
export const AI_MODELS: Record<string, AIModel> = {
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Schnelles und effizientes Modell für kürzere Inhalte und einfachere Aufgaben',
    strengths: [
      'Hohe Verarbeitungsgeschwindigkeit',
      'Effiziente Ressourcennutzung',
      'Gut für Social Media Inhalte und kurze Texte'
    ],
    limitations: [
      'Weniger geeignet für komplexe Analysen',
      'Begrenzte Kontextverarbeitung im Vergleich zu Pro'
    ],
    cost: 'low',
    speed: 'fast',
    maxTokens: 2048,
    contextLength: 8192
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Leistungsstarkes Modell für komplexe Inhalte mit umfassender Kontextverarbeitung',
    strengths: [
      'Fortgeschrittenes Reasoning',
      'Multimodale Fähigkeiten',
      'Umfangreiche Kontextverarbeitung',
      'Gute Balance aus Qualität und Geschwindigkeit'
    ],
    limitations: [
      'Höhere Kosten als Flash',
      'Langsamere Verarbeitung bei umfangreichen Inhalten'
    ],
    cost: 'medium',
    speed: 'medium',
    maxTokens: 8192,
    contextLength: 32768
  },
  'claude-3-sonnet': {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    description: 'Ausgewogenes Modell mit starken Verständnisfähigkeiten und nuancierter Ausgabe',
    strengths: [
      'Hervorragendes Kontextverständnis',
      'Nuancierte, natürliche Antworten',
      'Gut für persuasive und emotionale Inhalte'
    ],
    limitations: [
      'Weniger multimodale Fähigkeiten als Gemini',
      'Manchmal zu vorsichtig bei komplexen Themen'
    ],
    cost: 'medium',
    speed: 'medium',
    maxTokens: 4096,
    contextLength: 24576
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Höchstleistungsmodell für anspruchsvolle Inhalte und tiefgreifende Analysen',
    strengths: [
      'Tiefgreifendes Reasoning',
      'Hervorragende Nuancierung und Genauigkeit',
      'Ideal für juristische und akademische Inhalte',
      'Umfassende Kontextverarbeitung'
    ],
    limitations: [
      'Höchste Kosten',
      'Langsame Verarbeitungsgeschwindigkeit',
      'Überdimensioniert für einfache Aufgaben'
    ],
    cost: 'high',
    speed: 'slow',
    maxTokens: 6144,
    contextLength: 32768
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Universelles Modell mit optimierter Leistung für vielfältige Anwendungsbereiche',
    strengths: [
      'Sehr gut für intuitive Gespräche',
      'Starke Fähigkeiten in verschiedenen Domänen',
      'Gute Balance aus Präzision und Kreativität',
      'Breite Wissensbasis'
    ],
    limitations: [
      'Weniger spezialisiert für bestimmte Aufgaben',
      'Mittlere bis hohe Kosten',
      'Bei hochspezialisierten Aufgaben nicht immer optimal'
    ],
    cost: 'medium',
    speed: 'medium',
    maxTokens: 4096,
    contextLength: 16384
  }
};