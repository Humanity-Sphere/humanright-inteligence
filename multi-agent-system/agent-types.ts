/**
 * Agent Types - Typdefinitionen für das Multi-Agent-System
 */

export type AgentRole = 
  | 'manager' 
  | 'content-generator' 
  | 'code-generator' 
  | 'voice-assistant';
  
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export type TaskType = 
  | 'document-generation' 
  | 'code-generation' 
  | 'learning-path-creation'
  | 'data-analysis'
  | 'visualization'
  | 'information-retrieval'
  | 'presentation-generation'
  | 'map-generation'
  | 'html-page-generation'
  | 'dashboard-generation'
  | 'unknown';

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  capabilities?: string[];
  runtime?: {
    model?: string;
    minTokens?: number;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface AgentInitOptions {
  apiKey: string;
  options?: Record<string, any>;
}

export enum AgentStatus {
  INITIALIZING = 'initializing',
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline'
}

export interface AgentStatusInfo {
  isActive: boolean;
  currentTask?: string;
  lastActiveTime?: Date;
  errorCount: number;
  successCount: number;
  status: AgentStatus;
}

export interface TaskCoordinationRequest {
  workflowId: string;
  intent: string;
  parameters: Record<string, any>;
  taskType: TaskType;
  requiredAgents: string[];
}

export interface VoiceCommandOptions {
  workflowId: string;
  userId: string;
  languageCode: string;
}

export interface VoiceCommandResult {
  response: string;
  intent: string;
  parameters: Record<string, any>;
  taskType: TaskType;
  needsManagerCoordination: boolean;
  requiresFollowUp: boolean;
  followUpQuestions?: string[];
  generatedContent?: any;
  requiredAgents?: string[];
}

export interface FollowUpResult {
  response: string;
  needsManagerCoordination: boolean;
  requiresFollowUp: boolean;
  updatedIntent?: string;
  updatedParameters?: Record<string, any>;
  followUpQuestions?: string[];
  generatedContent?: any;
  taskType?: TaskType;
  requiredAgents?: string[];
}

export interface GeneratedDocument {
  title: string;
  content: string;
  metadata: {
    author: string;
    createdAt: Date;
    tags: string[];
    targetAudience: string;
    language: string;
    category?: string;
    format?: string;
  };
}

export interface GeneratedCode {
  language: string;
  code: string;
  title: string;
  metadata: {
    purpose: string;
    dependencies: string[];
    createdAt: Date;
    author: string;
    instructions?: string;
  };
}

export interface GeneratedLearningPath {
  title: string;
  description: string;
  modules: {
    title: string;
    description: string;
    duration: string;
    resources: string[];
    activities: string[];
  }[];
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    timeToComplete: string;
    prerequisites: string[];
    createdAt: Date;
    author: string;
  };
}

export interface GoogleAssistantParams {
  command: string;
  userId?: number | string;
  language?: string;
  conversationHistory?: any[];
  intent?: string;
  parameters?: Record<string, any>;
  rawQuery?: string;
  context?: {
    bestApproach?: string;
    requiresFollowUp?: boolean;
    followUpQuestions?: string[];
  };
}

export interface ITask {
  id: string;
  type: string;
  parameters: any;
  priority?: TaskPriority;
  createdAt?: Date;
  requester?: string;
}

export interface ITaskResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  completedAt: Date;
}

export interface TaskResult {
  success: boolean;
  response: string;
  content?: GeneratedDocument | GeneratedCode | GeneratedLearningPath;
  error?: string;
  taskId?: string;
  data?: any;
  completedAt?: Date;
}

export interface CodeGenerationParams {
  purpose: string;
  language: string;
  libraries?: string[];
  complexity?: string;
  dataFormat?: string;
  dataSource?: string;
}