import LocalStorageService from './LocalStorageService';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  fontScale?: number;
  notificationsEnabled?: boolean;
  sessionHistoryVisible?: boolean;
  voiceCommandsEnabled?: boolean;
  preferredModel?: string;
  cameraQuality?: 'low' | 'medium' | 'high';
  syncFrequency?: 'always' | 'wifi' | 'manual';
  promptTemplates?: Array<{
    id: string;
    name: string;
    prompt: string;
    category: string;
  }>;
  recentTopics?: string[];
  savedCodeSnippets?: string[];
  accessibilityFeatures?: {
    highContrast?: boolean;
    screenReader?: boolean;
    reducedMotion?: boolean;
    subtitles?: boolean;
  };
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  surfaceColor: string;
  errorColor: string;
  successColor: string;
  warningColor: string;
  infoColor: string;
  fontSize: {
    small: number;
    normal: number;
    large: number;
    xlarge: number;
  };
}

export interface UsageStatistics {
  sessionsCreated: number;
  messagesExchanged: number;
  codeSnippetsGenerated: number;
  offlineActionsQueued: number;
  documentsScanned: number;
  voiceCommandsRecognized: number;
  lastUsed: string;
  totalUsageTime: number;
  launchCount: number;
}

/**
 * Service für Personalisierung und Benutzereinstellungen
 */
class PersonalizationService {
  private static instance: PersonalizationService;
  private cachedPreferences: UserPreferences | null = null;
  private cachedTheme: ThemeSettings | null = null;
  private cachedStats: UsageStatistics | null = null;
  
  /**
   * Singleton-Instanz erhalten
   */
  public static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService();
    }
    return PersonalizationService.instance;
  }
  
  /**
   * Benutzereinstellungen laden
   */
  public async getUserPreferences(): Promise<UserPreferences> {
    if (this.cachedPreferences) {
      return this.cachedPreferences;
    }
    
    try {
      const preferences = await LocalStorageService.getUserPreferences() as UserPreferences;
      
      if (Object.keys(preferences).length === 0) {
        // Standardeinstellungen bei erstem Start
        const defaults: UserPreferences = {
          theme: 'system',
          language: 'de',
          fontScale: 1.0,
          notificationsEnabled: true,
          sessionHistoryVisible: true,
          voiceCommandsEnabled: true,
          preferredModel: 'gemini-1.5-flash',
          cameraQuality: 'high',
          syncFrequency: 'wifi',
          promptTemplates: [],
          recentTopics: [],
          savedCodeSnippets: [],
          accessibilityFeatures: {
            highContrast: false,
            screenReader: false,
            reducedMotion: false,
            subtitles: true
          }
        };
        
        await this.saveUserPreferences(defaults);
        this.cachedPreferences = defaults;
        return defaults;
      }
      
      this.cachedPreferences = preferences;
      return preferences;
    } catch (error) {
      console.error('Fehler beim Laden der Benutzereinstellungen:', error);
      
      // Standardeinstellungen als Fallback
      const defaults: UserPreferences = {
        theme: 'system',
        language: 'de',
        fontScale: 1.0
      };
      
      return defaults;
    }
  }
  
  /**
   * Benutzereinstellungen speichern
   */
  public async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const currentPrefs = await this.getUserPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };
      
      const success = await LocalStorageService.saveUserPreferences(updatedPrefs);
      
      if (success) {
        this.cachedPreferences = updatedPrefs;
      }
      
      return success;
    } catch (error) {
      console.error('Fehler beim Speichern der Benutzereinstellungen:', error);
      return false;
    }
  }
  
  /**
   * Aktuelles Theme basierend auf Benutzereinstellungen laden
   */
  public async getThemeSettings(): Promise<ThemeSettings> {
    if (this.cachedTheme) {
      return this.cachedTheme;
    }
    
    try {
      const preferences = await this.getUserPreferences();
      const themeMode = preferences.theme || 'system';
      
      // Systemeinstellung auslesen (in echtem React Native mit Appearance API)
      const systemIsDark = false; // Simuliert für Entwicklungsumgebung
      
      // Theme basierend auf Einstellung bestimmen
      const isDark = themeMode === 'dark' || (themeMode === 'system' && systemIsDark);
      
      // Theme-Einstellungen generieren
      const theme: ThemeSettings = isDark 
        ? {
            primaryColor: '#4a86e8',
            secondaryColor: '#7cb342',
            accentColor: '#aa00ff',
            textColor: '#ffffff',
            backgroundColor: '#121212',
            surfaceColor: '#1e1e1e',
            errorColor: '#cf6679',
            successColor: '#4caf50',
            warningColor: '#ff9800',
            infoColor: '#2196f3',
            fontSize: {
              small: 12,
              normal: 14,
              large: 16,
              xlarge: 20
            }
          }
        : {
            primaryColor: '#4a86e8',
            secondaryColor: '#7cb342',
            accentColor: '#aa00ff',
            textColor: '#212121',
            backgroundColor: '#f7f9fc',
            surfaceColor: '#ffffff',
            errorColor: '#b00020',
            successColor: '#4caf50',
            warningColor: '#ff9800',
            infoColor: '#2196f3',
            fontSize: {
              small: 12,
              normal: 14,
              large: 16,
              xlarge: 20
            }
          };
      
      // Zusätzliche Anpassungen für Accessibility
      if (preferences.accessibilityFeatures?.highContrast) {
        theme.textColor = isDark ? '#ffffff' : '#000000';
        theme.backgroundColor = isDark ? '#000000' : '#ffffff';
      }
      
      // Schriftgröße anpassen
      if (preferences.fontScale && preferences.fontScale !== 1.0) {
        const scale = preferences.fontScale;
        theme.fontSize = {
          small: Math.round(theme.fontSize.small * scale),
          normal: Math.round(theme.fontSize.normal * scale),
          large: Math.round(theme.fontSize.large * scale),
          xlarge: Math.round(theme.fontSize.xlarge * scale)
        };
      }
      
      this.cachedTheme = theme;
      return theme;
    } catch (error) {
      console.error('Fehler beim Laden der Theme-Einstellungen:', error);
      
      // Standard-Theme als Fallback
      return {
        primaryColor: '#4a86e8',
        secondaryColor: '#7cb342',
        accentColor: '#aa00ff',
        textColor: '#212121',
        backgroundColor: '#f7f9fc',
        surfaceColor: '#ffffff',
        errorColor: '#b00020',
        successColor: '#4caf50',
        warningColor: '#ff9800',
        infoColor: '#2196f3',
        fontSize: {
          small: 12,
          normal: 14,
          large: 16,
          xlarge: 20
        }
      };
    }
  }
  
  /**
   * Nutzungsstatistiken laden
   */
  public async getUsageStatistics(): Promise<UsageStatistics> {
    if (this.cachedStats) {
      return this.cachedStats;
    }
    
    try {
      const stats = await LocalStorageService.getCachedResource('usage_statistics');
      
      if (!stats) {
        // Standardwerte bei erstem Start
        const defaults: UsageStatistics = {
          sessionsCreated: 0,
          messagesExchanged: 0,
          codeSnippetsGenerated: 0,
          offlineActionsQueued: 0,
          documentsScanned: 0,
          voiceCommandsRecognized: 0,
          lastUsed: new Date().toISOString(),
          totalUsageTime: 0,
          launchCount: 1
        };
        
        await this.updateUsageStatistics(defaults);
        return defaults;
      }
      
      this.cachedStats = stats;
      return stats;
    } catch (error) {
      console.error('Fehler beim Laden der Nutzungsstatistik:', error);
      
      // Standardwerte als Fallback
      return {
        sessionsCreated: 0,
        messagesExchanged: 0,
        codeSnippetsGenerated: 0,
        offlineActionsQueued: 0,
        documentsScanned: 0,
        voiceCommandsRecognized: 0,
        lastUsed: new Date().toISOString(),
        totalUsageTime: 0,
        launchCount: 1
      };
    }
  }
  
  /**
   * Nutzungsstatistiken aktualisieren
   */
  public async updateUsageStatistics(updates: Partial<UsageStatistics>): Promise<boolean> {
    try {
      const currentStats = await this.getUsageStatistics();
      const updatedStats = { ...currentStats, ...updates };
      
      const success = await LocalStorageService.cacheResource(
        'usage_statistics',
        updatedStats,
        // Cache nicht ablaufen lassen (1 Jahr)
        365 * 24 * 60 * 60 * 1000
      );
      
      if (success) {
        this.cachedStats = updatedStats;
      }
      
      return success;
    } catch (error) {
      console.error('Fehler beim Speichern der Nutzungsstatistik:', error);
      return false;
    }
  }
  
  /**
   * Aktualisiert die "Zuletzt verwendet"-Statistik und erhöht die Nutzungszeit
   */
  public async trackUsage(sessionDuration: number = 0): Promise<void> {
    try {
      const currentStats = await this.getUsageStatistics();
      
      await this.updateUsageStatistics({
        lastUsed: new Date().toISOString(),
        totalUsageTime: currentStats.totalUsageTime + sessionDuration
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Nutzungsstatistik:', error);
    }
  }
  
  /**
   * Trackt die Erstellung einer neuen Session
   */
  public async trackNewSession(): Promise<void> {
    try {
      const currentStats = await this.getUsageStatistics();
      
      await this.updateUsageStatistics({
        sessionsCreated: currentStats.sessionsCreated + 1
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Session-Statistik:', error);
    }
  }
  
  /**
   * Trackt eine neue Nachrichteninteraktion
   */
  public async trackMessageExchange(): Promise<void> {
    try {
      const currentStats = await this.getUsageStatistics();
      
      await this.updateUsageStatistics({
        messagesExchanged: currentStats.messagesExchanged + 1
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Nachrichten-Statistik:', error);
    }
  }
  
  /**
   * Trackt ein generiertes Code-Snippet
   */
  public async trackCodeSnippet(): Promise<void> {
    try {
      const currentStats = await this.getUsageStatistics();
      
      await this.updateUsageStatistics({
        codeSnippetsGenerated: currentStats.codeSnippetsGenerated + 1
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Code-Snippet-Statistik:', error);
    }
  }
  
  /**
   * Fügt ein neues Thema zu den zuletzt verwendeten hinzu
   */
  public async addRecentTopic(topic: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      const recentTopics = preferences.recentTopics || [];
      
      // Doppelte Einträge vermeiden
      if (recentTopics.includes(topic)) {
        // Thema an den Anfang verschieben (neuestes zuerst)
        const updatedTopics = [
          topic,
          ...recentTopics.filter(t => t !== topic)
        ];
        
        // Auf maximal 10 begrenzen
        const limitedTopics = updatedTopics.slice(0, 10);
        
        return await this.saveUserPreferences({ recentTopics: limitedTopics });
      } else {
        // Neues Thema hinzufügen
        const updatedTopics = [topic, ...recentTopics].slice(0, 10);
        return await this.saveUserPreferences({ recentTopics: updatedTopics });
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Themas:', error);
      return false;
    }
  }
  
  /**
   * Speichert ein Code-Snippet für schnellen Zugriff
   */
  public async saveCodeSnippet(snippetId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      const savedSnippets = preferences.savedCodeSnippets || [];
      
      // Doppelte Einträge vermeiden
      if (!savedSnippets.includes(snippetId)) {
        const updatedSnippets = [...savedSnippets, snippetId];
        return await this.saveUserPreferences({ savedCodeSnippets: updatedSnippets });
      }
      
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern des Code-Snippets:', error);
      return false;
    }
  }
  
  /**
   * Entfernt ein gespeichertes Code-Snippet
   */
  public async removeCodeSnippet(snippetId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      const savedSnippets = preferences.savedCodeSnippets || [];
      
      const updatedSnippets = savedSnippets.filter(id => id !== snippetId);
      return await this.saveUserPreferences({ savedCodeSnippets: updatedSnippets });
    } catch (error) {
      console.error('Fehler beim Entfernen des Code-Snippets:', error);
      return false;
    }
  }
  
  /**
   * Cache für Theme und Präferenzen zurücksetzen
   */
  public clearCache(): void {
    this.cachedPreferences = null;
    this.cachedTheme = null;
    this.cachedStats = null;
  }
}

export default PersonalizationService.getInstance();