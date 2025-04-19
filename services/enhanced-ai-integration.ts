/**
 * Erweiterte KI-Integration
 * Verbindet Kotaemon-Monitoring und PraisonAI-Router mit dem bestehenden System
 */

import logger from '../utils/logger';
import getKotaemonService from './kotaemon-monitoring';
import type { ModelResponse } from './praison-ai-router';
import { 
  aiRouter, 
  ModelProvider, 
  ModelCapability, 
  ModelConfig,
  RoutingContext,
  RoutingResult
} from './praison-ai-router';
import { generateAIContentService } from './ai-service';
import { genAI } from './gemini';
// config-Import entfernt, da nicht benötigt

export class EnhancedAIIntegration {
  private static instance: EnhancedAIIntegration;
  private isInitialized = false;
  
  private constructor() {
    logger.info('[EnhancedAI] Erweiterte KI-Integration wird initialisiert');
  }

  public static getInstance(): EnhancedAIIntegration {
    if (!EnhancedAIIntegration.instance) {
      EnhancedAIIntegration.instance = new EnhancedAIIntegration();
    }
    return EnhancedAIIntegration.instance;
  }

  /**
   * Initialisiert die KI-Integration
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('[EnhancedAI] Erweiterte KI-Integration bereits initialisiert');
      return;
    }

    try {
      // Registriere Standard-Modelle beim Router
      this.registerDefaultModels();
      
      // Konfiguriere Überwachungsregeln
      this.configureMonitoring();
      
      // Verbinde Router mit Monitoring
      this.connectRouterToMonitoring();
      
      this.isInitialized = true;
      logger.info('[EnhancedAI] Erweiterte KI-Integration erfolgreich initialisiert');
    } catch (error) {
      logger.error(`[EnhancedAI] Fehler bei der Initialisierung der erweiterten KI-Integration: ${error}`);
      throw error;
    }
  }

  /**
   * Registriert Standard-Modelle beim Router
   */
  private registerDefaultModels(): void {
    // Gemini-Modelle registrieren
    aiRouter.registerModels([
      {
        id: 'gemini-1.5-flash',
        provider: ModelProvider.GEMINI,
        name: 'Gemini 1.5 Flash',
        capabilities: [
          ModelCapability.TEXT_GENERATION,
          ModelCapability.DOCUMENT_ANALYSIS,
          ModelCapability.SUMMARIZATION,
          ModelCapability.QA,
          ModelCapability.CHAT
        ],
        costPer1KTokens: 0.0001,
        maxTokens: 30000,
        contextWindow: 32000,
        latencyMs: 500,
        errorRate: 0.05,
        fallbacks: ['gemini-1.5-pro', 'gpt-3.5-turbo'],
        isDefault: true,
        isActive: true
      },
      {
        id: 'gemini-1.5-pro',
        provider: ModelProvider.GEMINI,
        name: 'Gemini 1.5 Pro',
        capabilities: [
          ModelCapability.TEXT_GENERATION,
          ModelCapability.CODE_GENERATION,
          ModelCapability.DOCUMENT_ANALYSIS,
          ModelCapability.SUMMARIZATION,
          ModelCapability.TRANSLATION,
          ModelCapability.CREATIVE_WRITING,
          ModelCapability.QA,
          ModelCapability.CHAT
        ],
        costPer1KTokens: 0.0007,
        maxTokens: 30000,
        contextWindow: 1000000,
        latencyMs: 800,
        errorRate: 0.03,
        fallbacks: ['gpt-4o', 'claude-3-opus'],
        isActive: true
      }
    ]);

    // OpenAI-Modelle registrieren
    aiRouter.registerModels([
      {
        id: 'gpt-3.5-turbo',
        provider: ModelProvider.OPENAI,
        name: 'GPT-3.5 Turbo',
        capabilities: [
          ModelCapability.TEXT_GENERATION,
          ModelCapability.CODE_GENERATION,
          ModelCapability.SUMMARIZATION,
          ModelCapability.QA,
          ModelCapability.CHAT
        ],
        costPer1KTokens: 0.0005,
        maxTokens: 4096,
        contextWindow: 16000,
        latencyMs: 500,
        errorRate: 0.02,
        fallbacks: ['gemini-1.5-flash'],
        isActive: true
      },
      {
        id: 'gpt-4o',
        provider: ModelProvider.OPENAI,
        name: 'GPT-4o',
        capabilities: [
          ModelCapability.TEXT_GENERATION,
          ModelCapability.CODE_GENERATION,
          ModelCapability.DOCUMENT_ANALYSIS,
          ModelCapability.SUMMARIZATION,
          ModelCapability.TRANSLATION,
          ModelCapability.CREATIVE_WRITING,
          ModelCapability.QA,
          ModelCapability.CHAT
        ],
        costPer1KTokens: 0.005,
        maxTokens: 8192,
        contextWindow: 128000,
        latencyMs: 1200,
        errorRate: 0.01,
        fallbacks: ['gemini-1.5-pro', 'claude-3-opus'],
        isActive: true
      }
    ]);

    // Anthropic-Modelle registrieren
    aiRouter.registerModels([
      {
        id: 'claude-3-opus',
        provider: ModelProvider.ANTHROPIC,
        name: 'Claude 3 Opus',
        capabilities: [
          ModelCapability.TEXT_GENERATION,
          ModelCapability.CODE_GENERATION,
          ModelCapability.DOCUMENT_ANALYSIS,
          ModelCapability.SUMMARIZATION,
          ModelCapability.CREATIVE_WRITING,
          ModelCapability.QA,
          ModelCapability.CHAT
        ],
        costPer1KTokens: 0.015,
        maxTokens: 8192,
        contextWindow: 200000,
        latencyMs: 1500,
        errorRate: 0.01,
        fallbacks: ['gemini-1.5-pro', 'gpt-4o'],
        isActive: true
      }
    ]);

    // Groq-Modelle registrieren
    aiRouter.registerModels([
      {
        id: 'llama3-70b-groq',
        provider: ModelProvider.GROQ,
        name: 'LLaMA 3 70B (Groq)',
        capabilities: [
          ModelCapability.TEXT_GENERATION,
          ModelCapability.CODE_GENERATION,
          ModelCapability.SUMMARIZATION,
          ModelCapability.QA,
          ModelCapability.CHAT
        ],
        costPer1KTokens: 0.0003,
        maxTokens: 4096,
        contextWindow: 8192,
        latencyMs: 300, // Groq ist sehr schnell
        errorRate: 0.03,
        fallbacks: ['gemini-1.5-flash', 'gpt-3.5-turbo'],
        isActive: true
      }
    ]);

    // Status der registrierten Modelle protokollieren
    const stats = aiRouter.getRouterStats();
    logger.info(`[EnhancedAI] ${stats.registeredModels} Modelle registriert, ${stats.activeModels} aktiv`);
  }

  /**
   * Konfiguriert das Monitoring-System
   */
  private configureMonitoring(): void {
    // Füge Anomalieerkennungsregeln hinzu
    // Implementiere mehr erweiterte Regeln
  }

  /**
   * Verbindet Router und Monitoring
   */
  private connectRouterToMonitoring(): void {
    // Füge Event-Listener für Router-Ereignisse hinzu
    aiRouter.on('model_deactivated', (data) => {
      logger.warn(`[EnhancedAI] Modell ${data.modelId} wurde deaktiviert wegen ${data.reason}`);
      // Benachrichtige Administrator oder protokolliere
    });
  }

  /**
   * Generiert Inhalte mit intelligenter Modellauswahl
   */
  public async generateContent(
    prompt: string,
    options: {
      userId?: string;
      sessionId?: string;
      capability?: ModelCapability;
      temperature?: number;
      maxTokens?: number;
      preferredModel?: string;
      preferredProvider?: ModelProvider;
      priority?: 'cost' | 'quality' | 'speed';
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let content = '';
    let selectedModelId = '';
    let status: 'success' | 'error' = 'success';
    let error: any = null;
    let tokensUsed = 0;

    try {
      // Routing-Kontext erstellen
      const routingContext: RoutingContext = {
        userId: options.userId,
        sessionId: options.sessionId,
        requestId: `req_${Date.now()}`,
        requestType: options.capability || ModelCapability.TEXT_GENERATION,
        preferredModel: options.preferredModel,
        preferredProvider: options.preferredProvider,
        priority: options.priority
      };

      // Optimales Modell auswählen
      const routingResult = aiRouter.selectModel(routingContext);
      selectedModelId = routingResult.selectedModelId;
      
      logger.info(`[EnhancedAI] Verwende Modell ${selectedModelId} für Anfrage ${routingContext.requestId}`);
      
      // Kontext aktualisieren
      aiRouter.addMessageToContext(
        routingResult.contextId,
        'user',
        prompt
      );
      
      // Generiere Inhalt mit dem ausgewählten Modell
      const modelConfig = aiRouter.getModelDetails()[selectedModelId];
      
      // In Abhängigkeit vom Provider die richtige Implementierung verwenden
      if (modelConfig.provider === ModelProvider.GEMINI) {
        // Verwende Gemini-Implementierung
        const requestOptions = {
          prompt,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1000,
          model: modelConfig.name,
          systemPrompt: options.systemPrompt
        };
        
        content = await generateAIContentService(requestOptions);
        tokensUsed = prompt.split(/\\s+/).length + content.split(/\\s+/).length; // Grobe Schätzung
        
        // Kontext aktualisieren
        aiRouter.addMessageToContext(
          routingResult.contextId,
          'assistant',
          content,
          selectedModelId
        );
      } else {
        // Für andere Provider
        throw new Error(`Provider ${modelConfig.provider} noch nicht implementiert`);
      }
    } catch (err) {
      status = 'error';
      error = err;
      logger.error(`[EnhancedAI] Fehler bei der KI-Generierung: ${err}`);
      
      // Versuche Failover, wenn ein Fehler auftritt
      if (selectedModelId) {
        const routingContext = {
          requestId: `req_${Date.now()}`,
          requestType: options.capability || ModelCapability.TEXT_GENERATION,
        };
        
        const fallbackModelId = aiRouter.handleFailover(selectedModelId, err, routingContext);
        
        if (fallbackModelId) {
          logger.info(`[EnhancedAI] Versuche Failover zu Modell ${fallbackModelId}`);
          
          try {
            // Rekursiver Aufruf mit dem Fallback-Modell
            return await this.generateContent(prompt, {
              ...options,
              preferredModel: fallbackModelId
            });
          } catch (fallbackErr) {
            logger.error(`[EnhancedAI] Auch Fallback zu ${fallbackModelId} fehlgeschlagen: ${fallbackErr}`);
          }
        }
      }
      
      // Wenn alles fehlschlägt, wirf einen Fehler
      throw new Error(`KI-Generierung fehlgeschlagen: ${err}`);
    } finally {
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      // Aktualisiere Modellmetriken
      if (selectedModelId) {
        aiRouter.updateModelMetrics(selectedModelId, latency, status);
      }
      
      // Protokolliere für Monitoring
      const kotaemonService = getKotaemonService();
      kotaemonService.recordMetric('content_generation_time', latency);
      kotaemonService.logEvent('content_generation', {
        model: selectedModelId || 'unknown',
        tokensUsed,
        latency,
        status,
        timestamp: new Date().toISOString()
      });
      
      if (status === 'error') {
        kotaemonService.logError('content_generation_failed', {
          model: selectedModelId || 'unknown',
          error: error?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return content;
  }

  /**
   * Gibt Überwachungsstatistiken zurück
   */
  public getMonitoringStats(): any {
    // Zeitraum für den Bericht
    const timeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // letzte 24 Stunden
      end: new Date()
    };
    
    // Generiere Bericht
    const kotaemonService = getKotaemonService();
    return {
      status: kotaemonService.getStatus(),
      metrics: {
        timestamp: new Date().toISOString(),
        timeRange: {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString()
        }
      }
    };
  }

  /**
   * Gibt Router-Statistiken zurück
   */
  public getRouterStats(): any {
    return aiRouter.getRouterStats();
  }

  /**
   * Gibt detaillierte Modellinformationen zurück
   */
  public getModelDetails(): any {
    return aiRouter.getModelDetails();
  }
}

// Singleton-Instance exportieren
export const enhancedAI = EnhancedAIIntegration.getInstance();
export default enhancedAI;