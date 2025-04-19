/**
 * Typen für die Trigger und Empfehlungs-Funktionalität
 */

// Kontexttypen für die Triggererkennung
export enum ContextType {
  PAGE_VIEW = 'page_view',
  DOCUMENT_VIEW = 'document_view',
  SEARCH_QUERY = 'search_query',
  IDLE_TIME = 'idle_time',
  CONTENT_ANALYSIS = 'content_analysis',
  SAFETY_ISSUE = 'safety_issue'
}

// Empfehlungstypen
export enum RecommendationType {
  DOCUMENT = 'document',
  RESOURCE = 'resource',
  ACTION = 'action',
  CONTACT = 'contact',
  TOOL = 'tool',
  SAFETY_ADVICE = 'safety_advice',
  LEARNING = 'learning'
}

// Prioritätsstufen für Empfehlungen
export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Status von Empfehlungen
export enum RecommendationStatus {
  NEW = 'new',
  SEEN = 'seen',
  CLICKED = 'clicked',
  DISMISSED = 'dismissed',
  COMPLETED = 'completed'
}

// Interface für einen Empfehlungs-Trigger
export interface ContentTrigger {
  id: number;
  name: string;
  description: string;
  active: boolean;
  conditions: TriggerCondition[];
  recommendations?: ContentRecommendation[];
  createdAt: Date;
  updatedAt: Date;
  createdById?: number;
  lastTriggeredAt?: Date;
  triggerCount: number;
  clickCount: number;
  dismissCount: number;
  tags?: string[];
}

// Interface für eine einzelne Empfehlung
export interface ContentRecommendation {
  id: number;
  triggerId: number;
  title: string;
  description: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  contentId?: number;
  contentType?: string;
  url?: string;
  actionText?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// Interface für eine Triggerbedingung
export interface TriggerCondition {
  contextType: ContextType;
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than';
  value: string | number | boolean | string[];
  cooldownMinutes?: number;
}

// Interface für ein Kontext-Ereignis
export interface ContextEvent {
  contextType: ContextType | string;
  data: {
    [key: string]: any;
    timestamp?: string;
  };
  userId?: number;
}

// Interface für Trigger-Benutzereinstellungen
export interface TriggerUserPreferences {
  userId: number;
  enableTriggers: boolean;
  priorityThreshold: RecommendationPriority;
  maxTriggersPerHour: number;
  disabledTriggerIds: number[];
  disabledContextTypes: ContextType[];
  preferredRecommendationTypes: RecommendationType[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface für Einträge in der Trigger-Historie
export interface TriggerHistoryEntry {
  id: number;
  triggerId: number;
  userId: number;
  contextType: ContextType;
  contextData: string; // JSON-String der Kontextdaten
  status: RecommendationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Interface für AI-generierte Trigger und Empfehlungen
export interface AIGeneratedTrigger {
  name: string;
  description: string;
  recommendations: {
    title: string;
    description: string;
    type: RecommendationType;
    priority: RecommendationPriority;
    contentId?: number;
    contentType?: string;
    url?: string;
    actionText?: string;
    imageUrl?: string;
    tags?: string[];
  }[];
}

// Interface für Trigger-Statistiken
export interface TriggerStatistics {
  triggerId: number;
  triggerCount: number;
  clickCount: number;
  dismissCount: number;
  completionRate: number;
  lastTriggeredAt?: Date;
}

// Interface zum Aktualisieren des Empfehlungsstatus
export interface UpdateRecommendationStatusRequest {
  triggerId: number;
  recommendationId?: number;
  status: RecommendationStatus | string;
  userId: number;
  metadata?: { [key: string]: any };
}

// Interface für das Prüfen von Kontexten
export interface CheckContextRequest {
  context: ContextEvent;
  userId?: number;
}

// Interface für die Antwort beim Prüfen von Kontexten
export interface CheckContextResponse {
  recommendations: ContentRecommendation[];
  triggeredTriggerIds: number[];
}