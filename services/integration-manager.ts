
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  settings: Record<string, any>;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageConfig {
  provider: string;
  settings: Record<string, any>;
  isDefault: boolean;
  enabled: boolean;
}

export interface ApiConfig {
  provider: string;
  apiKey: string;
  settings: Record<string, any>;
  enabled: boolean;
}

export interface EmailConfig {
  provider: string;
  settings: Record<string, any>;
  enabled: boolean;
}

export interface CalendarConfig {
  provider: string;
  settings: Record<string, any>;
  enabled: boolean;
}

export class IntegrationManager {
  private configPath: string;
  private integrations: IntegrationConfig[] = [];
  private storageConfigs: Record<string, StorageConfig> = {};
  private apiConfigs: Record<string, ApiConfig> = {};
  private emailConfig: EmailConfig | null = null;
  private calendarConfig: CalendarConfig | null = null;

  constructor(dataDir: string = './data') {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.configPath = path.join(dataDir, 'integrations.json');
    this.loadConfigurations();
  }

  private async loadConfigurations() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = await fsPromises.readFile(this.configPath, 'utf8');
        const config = JSON.parse(data);
        
        this.integrations = config.integrations || [];
        this.storageConfigs = config.storageConfigs || {};
        this.apiConfigs = config.apiConfigs || {};
        this.emailConfig = config.emailConfig || null;
        this.calendarConfig = config.calendarConfig || null;
      }
    } catch (error) {
      console.error('Fehler beim Laden der Integrationseinstellungen:', error);
      // Initialize with empty configurations
      this.integrations = [];
      this.storageConfigs = {};
      this.apiConfigs = {};
      this.emailConfig = null;
      this.calendarConfig = null;
    }
  }

  private async saveConfigurations() {
    try {
      const config = {
        integrations: this.integrations,
        storageConfigs: this.storageConfigs,
        apiConfigs: this.apiConfigs,
        emailConfig: this.emailConfig,
        calendarConfig: this.calendarConfig
      };
      
      // Ensure the directory exists
      const dirPath = path.dirname(this.configPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      await fsPromises.writeFile(
        this.configPath, 
        JSON.stringify(config, null, 2), 
        'utf8'
      );
      console.log('Integrationseinstellungen erfolgreich gespeichert in:', this.configPath);
    } catch (error) {
      console.error('Fehler beim Speichern der Integrationseinstellungen:', error);
      console.error('Pfad:', this.configPath);
      throw new Error(`Fehler beim Speichern der Integrationseinstellungen: ${error.message}`);
    }
  }

  // INTEGRATIONS MANAGEMENT
  
  async getIntegrations(): Promise<IntegrationConfig[]> {
    return [...this.integrations];
  }

  async getIntegrationById(id: string): Promise<IntegrationConfig | null> {
    return this.integrations.find(integration => integration.id === id) || null;
  }

  async addIntegration(integration: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    const now = new Date().toISOString();
    const newIntegration: IntegrationConfig = {
      ...integration,
      id: `integration_${Date.now()}`, // Generate a unique ID
      createdAt: now,
      updatedAt: now
    };
    
    this.integrations.push(newIntegration);
    await this.saveConfigurations();
    
    return newIntegration;
  }

  async updateIntegration(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig | null> {
    const index = this.integrations.findIndex(integration => integration.id === id);
    
    if (index === -1) {
      return null;
    }
    
    // Don't allow updating these fields
    const { id: _, createdAt: __, ...allowedUpdates } = updates;
    
    this.integrations[index] = {
      ...this.integrations[index],
      ...allowedUpdates,
      updatedAt: new Date().toISOString()
    };
    
    await this.saveConfigurations();
    
    return this.integrations[index];
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const initialLength = this.integrations.length;
    this.integrations = this.integrations.filter(integration => integration.id !== id);
    
    if (initialLength !== this.integrations.length) {
      await this.saveConfigurations();
      return true;
    }
    
    return false;
  }

  // STORAGE CONFIGURATIONS
  
  async getStorageConfigs(): Promise<Record<string, StorageConfig>> {
    return { ...this.storageConfigs };
  }

  async getStorageConfig(provider: string): Promise<StorageConfig | null> {
    return this.storageConfigs[provider] || null;
  }

  async updateStorageConfig(provider: string, config: Partial<StorageConfig>): Promise<StorageConfig> {
    // If setting this as default, update other providers
    if (config.isDefault) {
      Object.keys(this.storageConfigs).forEach(key => {
        if (key !== provider && this.storageConfigs[key]) {
          this.storageConfigs[key].isDefault = false;
        }
      });
    }
    
    this.storageConfigs[provider] = {
      ...(this.storageConfigs[provider] || { 
        provider, 
        settings: {}, 
        isDefault: false, 
        enabled: false 
      }),
      ...config
    };
    
    await this.saveConfigurations();
    
    return this.storageConfigs[provider];
  }

  async deleteStorageConfig(provider: string): Promise<boolean> {
    if (this.storageConfigs[provider]) {
      delete this.storageConfigs[provider];
      await this.saveConfigurations();
      return true;
    }
    
    return false;
  }

  // API CONFIGURATIONS
  
  async getApiConfigs(): Promise<Record<string, ApiConfig>> {
    return { ...this.apiConfigs };
  }

  async getApiConfig(provider: string): Promise<ApiConfig | null> {
    return this.apiConfigs[provider] || null;
  }

  async updateApiConfig(provider: string, config: Partial<ApiConfig>): Promise<ApiConfig> {
    this.apiConfigs[provider] = {
      ...(this.apiConfigs[provider] || { 
        provider, 
        apiKey: '', 
        settings: {}, 
        enabled: false 
      }),
      ...config
    };
    
    await this.saveConfigurations();
    
    return this.apiConfigs[provider];
  }

  async deleteApiConfig(provider: string): Promise<boolean> {
    if (this.apiConfigs[provider]) {
      delete this.apiConfigs[provider];
      await this.saveConfigurations();
      return true;
    }
    
    return false;
  }

  // EMAIL & CALENDAR CONFIGURATIONS
  
  async getEmailConfig(): Promise<EmailConfig | null> {
    return this.emailConfig;
  }

  async updateEmailConfig(config: Partial<EmailConfig>): Promise<EmailConfig> {
    this.emailConfig = {
      ...(this.emailConfig || { provider: 'none', settings: {}, enabled: false }),
      ...config
    };
    
    await this.saveConfigurations();
    
    return this.emailConfig;
  }

  async getCalendarConfig(): Promise<CalendarConfig | null> {
    return this.calendarConfig;
  }

  async updateCalendarConfig(config: Partial<CalendarConfig>): Promise<CalendarConfig> {
    this.calendarConfig = {
      ...(this.calendarConfig || { provider: 'none', settings: {}, enabled: false }),
      ...config
    };
    
    await this.saveConfigurations();
    
    return this.calendarConfig;
  }
}

export default new IntegrationManager();
