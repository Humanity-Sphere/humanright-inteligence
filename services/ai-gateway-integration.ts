/**
 * AI Gateway Integration Service
 * 
 * Diese Klasse bietet eine Integration mit der Higress AI Gateway für optimierte KI-Anfragen.
 * Sie unterstützt multi-provider Zugriff, Failover, Caching und Lastverteilung.
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// AI Service Provider
export enum AIServiceProvider {
  OPENAI = 'openai',
  GOOGLE_GEMINI = 'gemini',
  ANTHROPIC = 'anthropic',
  HUGGINGFACE = 'huggingface',
  MISTRAL = 'mistral',
  OLLAMA = 'ollama',
  AZURE_OPENAI = 'azure_openai',
  COHERE = 'cohere'
}

// Provider-Konfiguration
export interface ProviderConfig {
  name: AIServiceProvider;
  apiKey: string;
  baseUrl?: string;
  weight?: number; // für gewichtetes Load Balancing
  defaultModel?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

// Multi-Provider Konfiguration
export interface AIGatewayConfig {
  providers: ProviderConfig[];
  cachingEnabled?: boolean;
  cacheTTLSeconds?: number;
  failoverStrategy?: 'sequential' | 'random';
  loadBalancingStrategy?: 'round-robin' | 'weighted' | 'least-load';
  defaultTimeoutMs?: number;
  defaultMaxRetries?: number;
  requestLogging?: boolean;
}

// API-Anfrageparameter
export interface APIRequestParams {
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  provider?: AIServiceProvider;
  customHeaders?: Record<string, string>;
  [key: string]: any;
}

// Cache-Eintrag
interface CacheEntry {
  data: any;
  timestamp: number;
  provider: AIServiceProvider;
}

/**
 * AIGateway-Klasse für die Verwaltung von KI-Anfragen über mehrere Provider
 */
export class AIGateway {
  private static instance: AIGateway;
  private config: AIGatewayConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private providerClients: Map<AIServiceProvider, AxiosInstance> = new Map();
  private currentProviderIndex: number = 0;
  private providerUsageCount: Map<AIServiceProvider, number> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  /**
   * Private Konstruktor für Singleton-Pattern
   */
  private constructor(config: AIGatewayConfig) {
    this.config = this.validateAndNormalizeConfig(config);
    this.initializeProviders();

    // Starte Cache-Cleanup-Timer wenn Caching aktiviert ist
    if (this.config.cachingEnabled) {
      setInterval(() => this.cleanupCache(), (this.config.cacheTTLSeconds || 3600) * 1000 / 2);
    }

    // Provider-Nutzungszähler initialisieren
    this.config.providers.forEach(provider => {
      this.providerUsageCount.set(provider.name, 0);
    });
  }

  /**
   * Singleton-Instanz erhalten
   */
  public static getInstance(config?: AIGatewayConfig): AIGateway {
    if (!AIGateway.instance && config) {
      AIGateway.instance = new AIGateway(config);
    } else if (!AIGateway.instance) {
      throw new Error('AIGateway muss zuerst mit einer Konfiguration initialisiert werden');
    }
    return AIGateway.instance;
  }

  /**
   * Konfiguration validieren und normalisieren
   */
  private validateAndNormalizeConfig(config: AIGatewayConfig): AIGatewayConfig {
    if (!config.providers || config.providers.length === 0) {
      throw new Error('Mindestens ein KI-Provider muss konfiguriert sein');
    }

    // Standardwerte setzen
    return {
      ...config,
      cachingEnabled: config.cachingEnabled !== undefined ? config.cachingEnabled : true,
      cacheTTLSeconds: config.cacheTTLSeconds || 3600,
      failoverStrategy: config.failoverStrategy || 'sequential',
      loadBalancingStrategy: config.loadBalancingStrategy || 'round-robin',
      defaultTimeoutMs: config.defaultTimeoutMs || 60000,
      defaultMaxRetries: config.defaultMaxRetries || 3,
      requestLogging: config.requestLogging !== undefined ? config.requestLogging : true
    };
  }

  /**
   * Provider initialisieren und HTTP-Clients erstellen
   */
  private initializeProviders(): void {
    this.config.providers.forEach(provider => {
      const axiosConfig: AxiosRequestConfig = {
        baseURL: this.getBaseUrlForProvider(provider),
        timeout: provider.timeoutMs || this.config.defaultTimeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        }
      };

      // Spezielle Header je nach Provider
      if (provider.name === AIServiceProvider.AZURE_OPENAI) {
        axiosConfig.headers!['api-key'] = provider.apiKey;
        delete axiosConfig.headers!.Authorization;
      }

      this.providerClients.set(provider.name, axios.create(axiosConfig));
    });
  }

  /**
   * Basis-URL für einen Provider abrufen
   */
  private getBaseUrlForProvider(provider: ProviderConfig): string {
    if (provider.baseUrl) return provider.baseUrl;

    // Standardbasis-URLs für bekannte Provider
    switch (provider.name) {
      case AIServiceProvider.OPENAI:
        return 'https://api.openai.com/v1';
      case AIServiceProvider.GOOGLE_GEMINI:
        return 'https://generativelanguage.googleapis.com/v1';
      case AIServiceProvider.ANTHROPIC:
        return 'https://api.anthropic.com/v1';
      case AIServiceProvider.HUGGINGFACE:
        return 'https://api-inference.huggingface.co/models';
      case AIServiceProvider.MISTRAL:
        return 'https://api.mistral.ai/v1';
      case AIServiceProvider.OLLAMA:
        return 'http://localhost:11434/api';
      case AIServiceProvider.COHERE:
        return 'https://api.cohere.ai/v1';
      default:
        throw new Error(`Keine Standard-Basis-URL für Provider: ${provider.name}`);
    }
  }

  /**
   * Cache-Schlüssel für eine Anfrage generieren
   */
  private generateCacheKey(params: APIRequestParams): string {
    // Entferne nicht-deterministische oder irrelevante Parameter
    const { stream, customHeaders, ...relevantParams } = params;
    return JSON.stringify(relevantParams);
  }

  /**
   * Prüfen, ob eine Anfrage im Cache ist und noch gültig
   */
  private getCachedResponse(params: APIRequestParams): any | null {
    if (!this.config.cachingEnabled) return null;

    const cacheKey = this.generateCacheKey(params);
    const cachedEntry = this.cache.get(cacheKey);

    if (!cachedEntry) return null;

    const now = Date.now();
    const ttlMs = (this.config.cacheTTLSeconds || 3600) * 1000;

    if (now - cachedEntry.timestamp > ttlMs) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cachedEntry.data;
  }

  /**
   * Antwort im Cache speichern
   */
  private cacheResponse(params: APIRequestParams, data: any, provider: AIServiceProvider): void {
    if (!this.config.cachingEnabled) return;

    const cacheKey = this.generateCacheKey(params);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      provider
    });
  }

  /**
   * Cache aufräumen (veraltete Einträge entfernen)
   */
  private cleanupCache(): void {
    if (!this.config.cachingEnabled) return;

    const now = Date.now();
    const ttlMs = (this.config.cacheTTLSeconds || 3600) * 1000;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Provider nach der konfigurierten Load-Balancing-Strategie auswählen
   */
  private selectProvider(requestedProvider?: AIServiceProvider): ProviderConfig {
    // Wenn ein bestimmter Provider angefordert wurde und verfügbar ist, verwende diesen
    if (requestedProvider) {
      const provider = this.config.providers.find(p => p.name === requestedProvider);
      if (provider) return provider;
    }

    // Ansonsten nach Strategie auswählen
    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.config.providers.length;
        return this.config.providers[this.currentProviderIndex];

      case 'weighted':
        return this.selectProviderByWeight();

      case 'least-load':
        return this.selectLeastLoadedProvider();

      default:
        return this.config.providers[0];
    }
  }

  /**
   * Provider nach Gewichtung auswählen
   */
  private selectProviderByWeight(): ProviderConfig {
    // Gesamtgewicht berechnen
    const totalWeight = this.config.providers.reduce(
      (sum, provider) => sum + (provider.weight || 1), 
      0
    );

    // Zufällige Position im Gesamtgewicht wählen
    let randomWeight = Math.random() * totalWeight;

    // Provider auswählen
    for (const provider of this.config.providers) {
      const weight = provider.weight || 1;
      if (randomWeight <= weight) {
        return provider;
      }
      randomWeight -= weight;
    }

    // Fallback zum ersten Provider
    return this.config.providers[0];
  }

  /**
   * Provider mit der geringsten Last auswählen
   */
  private selectLeastLoadedProvider(): ProviderConfig {
    let leastLoadedProvider = this.config.providers[0];
    let minLoad = this.providerUsageCount.get(leastLoadedProvider.name) || 0;

    for (const provider of this.config.providers) {
      const load = this.providerUsageCount.get(provider.name) || 0;
      if (load < minLoad) {
        leastLoadedProvider = provider;
        minLoad = load;
      }
    }

    return leastLoadedProvider;
  }

  /**
   * Transformiere die Anfrageparameter für den spezifischen Provider
   */
  private transformParamsForProvider(params: APIRequestParams, provider: ProviderConfig): APIRequestParams {
    const transformedParams = { ...params };

    // Wenn kein Modell angegeben, verwende das Standard-Modell des Providers
    if (!transformedParams.model && provider.defaultModel) {
      transformedParams.model = provider.defaultModel;
    }

    // Provider-spezifische Transformationen
    switch (provider.name) {
      case AIServiceProvider.GOOGLE_GEMINI:
        // Transformiere OpenAI-Format zu Gemini-Format
        if (transformedParams.messages) {
          transformedParams.contents = transformedParams.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.content }]
          }));
          delete transformedParams.messages;
        }
        break;

      case AIServiceProvider.ANTHROPIC:
        // Transformiere zu Claude-Format
        if (transformedParams.messages) {
          transformedParams.messages = transformedParams.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          // Claude verwendet system_prompt statt system-Nachrichten
          const systemMessages = transformedParams.messages.filter(msg => msg.role === 'system');
          if (systemMessages.length > 0) {
            transformedParams.system = systemMessages[0].content;
            transformedParams.messages = transformedParams.messages.filter(msg => msg.role !== 'system');
          }
        }
        break;
    }

    return transformedParams;
  }

  /**
   * Antwortobjekt in ein standardisiertes Format umwandeln
   */
  private normalizeResponse(response: any, provider: AIServiceProvider): any {
    // Basis-Normalisierung mit Provider-Info
    const normalizedResponse = {
      ...response,
      provider: provider,
      timestamp: new Date().toISOString()
    };

    // Provider-spezifische Normalisierungen
    switch (provider) {
      case AIServiceProvider.GOOGLE_GEMINI:
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
          normalizedResponse.content = response.candidates[0].content.parts[0].text;
          normalizedResponse.choices = [{
            message: {
              role: 'assistant',
              content: normalizedResponse.content
            },
            index: 0,
            finish_reason: 'stop'
          }];
        }
        break;

      case AIServiceProvider.ANTHROPIC:
        if (response.content && response.content[0] && response.content[0].text) {
          normalizedResponse.content = response.content[0].text;
          normalizedResponse.choices = [{
            message: {
              role: 'assistant',
              content: normalizedResponse.content
            },
            index: 0,
            finish_reason: response.stop_reason || 'stop'
          }];
        }
        break;
    }

    return normalizedResponse;
  }

  /**
   * Anfrage an einen Provider senden mit Retry-Mechanismus
   */
  private async makeRequestToProvider(
    provider: ProviderConfig, 
    endpoint: string, 
    params: APIRequestParams
  ): Promise<any> {
    const client = this.providerClients.get(provider.name);
    if (!client) {
      throw new Error(`Kein HTTP-Client für Provider ${provider.name} initialisiert`);
    }

    const transformedParams = this.transformParamsForProvider(params, provider);
    const maxRetries = provider.maxRetries || this.config.defaultMaxRetries || 3;
    let lastError: Error | null = null;

    // Anfrageobjekt erstellen
    const requestConfig: AxiosRequestConfig = {};
    if (params.customHeaders) {
      requestConfig.headers = params.customHeaders;
    }

    // Protokollieren der Anfrage
    if (this.config.requestLogging) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        provider: provider.name,
        endpoint,
        requestId: uuidv4(),
        params: transformedParams
      };

      this.eventEmitter.emit('request', logEntry);
      console.log(`[AIGateway] Anfrage an ${provider.name}: ${endpoint}`);
    }

    // Provider-Nutzung erhöhen
    const currentCount = this.providerUsageCount.get(provider.name) || 0;
    this.providerUsageCount.set(provider.name, currentCount + 1);

    // Versuche mit Retries
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await client.post(endpoint, transformedParams, requestConfig);
        const endTime = Date.now();

        // Protokollieren der erfolgreichen Antwort
        if (this.config.requestLogging) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            provider: provider.name,
            endpoint,
            durationMs: endTime - startTime,
            success: true
          };

          this.eventEmitter.emit('response', logEntry);
          console.log(`[AIGateway] Antwort von ${provider.name} erhalten (${endTime - startTime}ms)`);
        }

        return this.normalizeResponse(response.data, provider.name);
      } catch (error) {
        lastError = error as Error;

        // Protokollieren des Fehlers
        if (this.config.requestLogging) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            provider: provider.name,
            endpoint,
            attempt: attempt + 1,
            error: lastError.message,
            success: false
          };

          this.eventEmitter.emit('error', logEntry);
          console.error(`[AIGateway] Fehler bei ${provider.name} (Versuch ${attempt + 1}/${maxRetries}): ${lastError.message}`);
        }

        // Bei letztem Versuch nicht warten
        if (attempt < maxRetries - 1) {
          // Exponentielles Backoff
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    // Alle Versuche fehlgeschlagen
    throw lastError || new Error(`Alle Anfrageversuche an ${provider.name} fehlgeschlagen`);
  }

  /**
   * Führe Anfrage mit automatischem Failover durch
   */
  private async executeWithFailover(
    endpoint: string, 
    params: APIRequestParams
  ): Promise<any> {
    const requestedProvider = params.provider;
    let providers = [...this.config.providers];

    // Wenn ein Provider angefordert wurde, versuche zuerst diesen
    if (requestedProvider) {
      const preferredProvider = providers.find(p => p.name === requestedProvider);
      if (preferredProvider) {
        providers = [
          preferredProvider,
          ...providers.filter(p => p.name !== requestedProvider)
        ];
      }
    } else {
      // Ansonsten den Provider nach Load-Balancing-Strategie auswählen
      const selectedProvider = this.selectProvider();
      providers = [
        selectedProvider,
        ...providers.filter(p => p.name !== selectedProvider.name)
      ];
    }

    // Bei "random" Failover-Strategie die Reihenfolge (außer dem ersten) mischen
    if (this.config.failoverStrategy === 'random') {
      const [first, ...rest] = providers;
      providers = [
        first,
        ...rest.sort(() => Math.random() - 0.5)
      ];
    }

    // Versuche jeden Provider der Reihe nach
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        return await this.makeRequestToProvider(provider, endpoint, params);
      } catch (error) {
        lastError = error as Error;

        // Protokolliere Failover
        if (this.config.requestLogging) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            failedProvider: provider.name,
            endpoint,
            error: lastError.message
          };

          this.eventEmitter.emit('failover', logEntry);
          console.warn(`[AIGateway] Failover von ${provider.name} wegen: ${lastError.message}`);
        }
      }
    }

    // Alle Provider fehlgeschlagen
    throw lastError || new Error('Alle Provider fehlgeschlagen');
  }

  /**
   * Chat-Vervollständigung anfordern (ähnlich OpenAI's chat/completions)
   */
  public async chatCompletion(params: APIRequestParams): Promise<any> {
    // Prüfe auf Cache-Treffer
    const cachedResponse = this.getCachedResponse(params);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        cached: true,
        cachedAt: new Date(cachedResponse.timestamp).toISOString()
      };
    }

    // Stream wird nicht gecached
    if (params.stream) {
      return this.executeWithFailover('/chat/completions', params);
    }

    // Normale Anfrage durchführen
    const response = await this.executeWithFailover('/chat/completions', params);

    // Antwort cachen wenn nicht streaming
    this.cacheResponse(params, response, response.provider);

    return response;
  }

  /**
   * Text-Vervollständigung anfordern (ähnlich OpenAI's completions)
   */
  public async completion(params: APIRequestParams): Promise<any> {
    // Prüfe auf Cache-Treffer
    const cachedResponse = this.getCachedResponse(params);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        cached: true,
        cachedAt: new Date(cachedResponse.timestamp).toISOString()
      };
    }

    // Stream wird nicht gecached
    if (params.stream) {
      return this.executeWithFailover('/completions', params);
    }

    // Normale Anfrage durchführen
    const response = await this.executeWithFailover('/completions', params);

    // Antwort cachen wenn nicht streaming
    this.cacheResponse(params, response, response.provider);

    return response;
  }

  /**
   * Embeddings anfordern (Vektorrepräsentationen von Text)
   */
  public async embeddings(params: APIRequestParams): Promise<any> {
    // Prüfe auf Cache-Treffer
    const cachedResponse = this.getCachedResponse(params);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        cached: true,
        cachedAt: new Date(cachedResponse.timestamp).toISOString()
      };
    }

    // Normale Anfrage durchführen
    const response = await this.executeWithFailover('/embeddings', params);

    // Antwort cachen
    this.cacheResponse(params, response, response.provider);

    return response;
  }

  /**
   * Allgemeine Methode für beliebige KI-API-Anfragen
   */
  public async request(endpoint: string, params: APIRequestParams): Promise<any> {
    // Prüfe auf Cache-Treffer (wenn es kein Stream ist)
    if (!params.stream) {
      const cachedResponse = this.getCachedResponse({ ...params, endpoint });
      if (cachedResponse) {
        return {
          ...cachedResponse,
          cached: true,
          cachedAt: new Date(cachedResponse.timestamp).toISOString()
        };
      }
    }

    // Führe Anfrage aus
    const response = await this.executeWithFailover(endpoint, params);

    // Cache die Antwort wenn nicht streaming
    if (!params.stream) {
      this.cacheResponse({ ...params, endpoint }, response, response.provider);
    }

    return response;
  }

  /**
   * Event-Listener registrieren
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Event-Listener entfernen
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Cache leeren
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Statistiken über die Nutzung der Provider abrufen
   */
  public getProviderStats(): Record<string, { count: number, weight?: number }> {
    const stats: Record<string, { count: number, weight?: number }> = {};

    for (const provider of this.config.providers) {
      stats[provider.name] = {
        count: this.providerUsageCount.get(provider.name) || 0,
        weight: provider.weight
      };
    }

    return stats;
  }

  /**
   * Cache-Statistiken abrufen
   */
  public getCacheStats(): { size: number, hitRate?: number } {
    return {
      size: this.cache.size
      // Weitere Statistiken können hier ergänzt werden
    };
  }

  /**
   * Konfiguration aktualisieren
   */
  public updateConfig(newConfig: Partial<AIGatewayConfig>): void {
    this.config = this.validateAndNormalizeConfig({
      ...this.config,
      ...newConfig
    });

    // Aktualisiere Provider-Clients wenn nötig
    if (newConfig.providers) {
      this.providerClients.clear();
      this.initializeProviders();
    }
  }

  /**
   * AI Gateway-Status abrufen
   */
  public getStatus(): { 
    ready: boolean, 
    providersCount: number,
    cacheSize: number,
    config: AIGatewayConfig
  } {
    return {
      ready: this.providerClients.size > 0,
      providersCount: this.providerClients.size,
      cacheSize: this.cache.size,
      config: { ...this.config, providers: this.config.providers.map(p => ({ ...p, apiKey: '***' })) }
    };
  }
}

// Ein einfacher Factory-Helper für die AIGateway-Initialisierung
export function createAIGateway(config: AIGatewayConfig): AIGateway {
  return AIGateway.getInstance(config);
}

// Exportiere eine einzelne Instanz für einfache Verwendung
export let aiGateway: AIGateway | null = null;

/**
 * AIGateway mit einer Konfiguration initialisieren
 */
export function initializeAIGateway(config: AIGatewayConfig): AIGateway {
  aiGateway = createAIGateway(config);
  return aiGateway;
}

/**
 * AIGateway-Instanz abrufen
 */
export function getAIGateway(): AIGateway {
  if (!aiGateway) {
    // Statt Fehler zu werfen, initialisieren wir mit Standard-Konfiguration
    const defaultConfig: AIGatewayConfig = {
      providers: [
        {
          name: AIServiceProvider.GOOGLE_GEMINI,
          apiKey: process.env.GEMINI_API_KEY || '',
          defaultModel: 'gemini-1.5-flash'
        }
      ],
      cachingEnabled: true,
      loadBalancingStrategy: 'round-robin'
    };

    console.log('[AIGateway] Initialisiere mit Standard-Konfiguration');
    aiGateway = AIGateway.getInstance(defaultConfig);
  }
  return aiGateway;
}