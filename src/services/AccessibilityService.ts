
import { Platform, Dimensions } from 'react-native';

const MOBILE_MIN_TOUCH_SIZE = 44;
const MOBILE_MIN_FONT_SCALE = 0.8;
const MOBILE_MAX_FONT_SCALE = 2.5;

export const getMobileOptimizedSettings = (settings: AccessibilitySettings) => {
  const { width } = Dimensions.get('window');
  const isSmallDevice = width < 375;

  return {
    ...settings,
    fontScale: Math.min(Math.max(settings.fontScale, MOBILE_MIN_FONT_SCALE), MOBILE_MAX_FONT_SCALE),
    uiScale: isSmallDevice ? Math.min(settings.uiScale, 1.5) : settings.uiScale,
    minTouchSize: MOBILE_MIN_TOUCH_SIZE,
    reduceMotion: Platform.OS === 'ios' ? settings.reduceMotion : true
  };
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions, ViewStyle, TextStyle } from 'react-native';
import { EventEmitter } from 'events';

// Definiere die Zugänglichkeitsebenen
export type AccessibilityLevel = 'none' | 'low' | 'medium' | 'high' | 'very-high';

// Typ für Farbsehen-Modi
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

// Typschnittstelle für die Zugänglichkeitseinstellungen
export interface AccessibilitySettings {
  // Allgemeine Einstellungen
  level: AccessibilityLevel;
  fontScale: number;
  uiScale: number;
  
  // Visuelle Anpassungen
  highContrast: boolean;
  boldText: boolean;
  increaseSpacing: boolean;
  reduceMotion: boolean;
  
  // Farbsehen
  colorBlindMode: ColorBlindMode;
  
  // Weitere Optionen
  autoAdjust: boolean;
  tooltipsEnabled: boolean;
  simplifiedInterface: boolean;
  hapticFeedback: boolean;
  
  // Systemspezifische Einstellungen
  systemFontScale?: number;
  systemReduceMotion?: boolean;
  systemHighContrast?: boolean;
}

// Standardeinstellungen basierend auf den Zugänglichkeitsebenen
const PRESET_SETTINGS: Record<AccessibilityLevel, Partial<AccessibilitySettings>> = {
  'none': {
    fontScale: 1.0,
    uiScale: 1.0,
    highContrast: false,
    boldText: false,
    increaseSpacing: false,
    reduceMotion: false,
    colorBlindMode: 'none',
    tooltipsEnabled: true,
    simplifiedInterface: false
  },
  'low': {
    fontScale: 1.2,
    uiScale: 1.1,
    highContrast: false,
    boldText: true,
    increaseSpacing: false,
    reduceMotion: false,
    colorBlindMode: 'none',
    tooltipsEnabled: true,
    simplifiedInterface: false
  },
  'medium': {
    fontScale: 1.4,
    uiScale: 1.2,
    highContrast: true,
    boldText: true,
    increaseSpacing: true,
    reduceMotion: false,
    colorBlindMode: 'none',
    tooltipsEnabled: true,
    simplifiedInterface: false
  },
  'high': {
    fontScale: 1.6,
    uiScale: 1.4,
    highContrast: true,
    boldText: true,
    increaseSpacing: true,
    reduceMotion: true,
    colorBlindMode: 'none',
    tooltipsEnabled: true,
    simplifiedInterface: true
  },
  'very-high': {
    fontScale: 1.8,
    uiScale: 1.6,
    highContrast: true,
    boldText: true,
    increaseSpacing: true,
    reduceMotion: true,
    colorBlindMode: 'none',
    tooltipsEnabled: true,
    simplifiedInterface: true
  }
};

// Standardeinstellungen für den Service
const DEFAULT_SETTINGS: AccessibilitySettings = {
  level: 'none',
  fontScale: 1.0,
  uiScale: 1.0,
  highContrast: false,
  boldText: false,
  increaseSpacing: false,
  reduceMotion: false,
  colorBlindMode: 'none',
  autoAdjust: true,
  tooltipsEnabled: true,
  simplifiedInterface: false,
  hapticFeedback: true,
  systemFontScale: 1.0,
  systemReduceMotion: false,
  systemHighContrast: false
};

/**
 * Service für die Verwaltung von Barrierefreiheitseinstellungen in der App
 */
class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings = { ...DEFAULT_SETTINGS };
  private initialized: boolean = false;
  private eventEmitter: EventEmitter = new EventEmitter();
  private readonly STORAGE_KEY = 'accessibility_settings';
  
  /**
   * Singleton-Instanz zurückgeben
   */
  public static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }
  
  /**
   * Konstruktor - Privat, um Singleton-Pattern zu erzwingen
   */
  private constructor() {
    this.initialize();
  }
  
  /**
   * Initialisiere den Service und lade gespeicherte Einstellungen
   */
  private async initialize() {
    if (this.initialized) return;
    
    try {
      // Gespeicherte Einstellungen laden
      const storedSettings = await this.loadSettings();
      
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...storedSettings };
      }
      
      // Systemeinstellungen erfassen (falls verfügbar)
      await this.detectSystemSettings();
      
      this.initialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Fehler beim Initialisieren der Barrierefreiheitseinstellungen:', error);
    }
  }
  
  /**
   * Lade Einstellungen aus dem AsyncStorage
   */
  private async loadSettings(): Promise<AccessibilitySettings | null> {
    try {
      const savedSettings = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (savedSettings) {
        return JSON.parse(savedSettings) as AccessibilitySettings;
      }
      
      return null;
    } catch (error) {
      console.error('Fehler beim Laden der Barrierefreiheitseinstellungen:', error);
      return null;
    }
  }
  
  /**
   * Speichere Einstellungen im AsyncStorage
   */
  private async saveSettings(settings: AccessibilitySettings): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern der Barrierefreiheitseinstellungen:', error);
      return false;
    }
  }
  
  /**
   * System-Zugänglichkeitseinstellungen erkennen (falls verfügbar)
   */
  private async detectSystemSettings() {
    // Diese Funktion würde idealerweise die System-Einstellungen des Betriebssystems abfragen
    // In React Native gibt es noch keine einheitliche API hierfür, aber bestimmte Plattformen
    // bieten Zugänglichkeits-APIs (z.B. AccessibilityInfo in React Native)
    
    // In einer vollständigen Implementierung würden wir hier z.B.
    // Font-Skaliering, Bewegungsreduzierung, Kontrastverstärkung etc. erkennen
    
    // Für dieses Beispiel verwenden wir Standardwerte
    this.settings.systemFontScale = 1.0;
    this.settings.systemReduceMotion = false;
    this.settings.systemHighContrast = false;
    
    // Wenn autoAdjust aktiviert ist, könnten wir hier automatisch
    // die App-Einstellungen an die Systemeinstellungen anpassen
    if (this.settings.autoAdjust) {
      // Zum Beispiel: this.settings.fontScale = this.settings.systemFontScale;
    }
  }
  
  /**
   * Benachrichtige alle Listener über Änderungen
   */
  private notifyListeners() {
    this.eventEmitter.emit('settingsChanged', this.settings);
  }
  
  /**
   * Führe eine Zugänglichkeitsaktion aus
   */
  public async performAction(action: string, value?: any): Promise<boolean> {
    switch (action) {
      case 'increase-font':
        this.settings.fontScale = Math.min(2.0, this.settings.fontScale + 0.1);
        break;
      case 'decrease-font':
        this.settings.fontScale = Math.max(0.7, this.settings.fontScale - 0.1);
        break;
      case 'zoom-in':
        this.settings.uiScale = Math.min(2.0, this.settings.uiScale + 0.1);
        break;
      case 'zoom-out':
        this.settings.uiScale = Math.max(0.7, this.settings.uiScale - 0.1);
        break;
      case 'toggle-high-contrast':
        this.settings.highContrast = !this.settings.highContrast;
        break;
      case 'toggle-bold-text':
        this.settings.boldText = !this.settings.boldText;
        break;
      case 'toggle-reduce-motion':
        this.settings.reduceMotion = !this.settings.reduceMotion;
        break;
      case 'toggle-spacing':
        this.settings.increaseSpacing = !this.settings.increaseSpacing;
        break;
      case 'set-preset':
        if (value && PRESET_SETTINGS[value as AccessibilityLevel]) {
          const preset = PRESET_SETTINGS[value as AccessibilityLevel];
          this.settings = { ...this.settings, ...preset, level: value as AccessibilityLevel };
        }
        break;
      case 'set-color-blind-mode':
        if (typeof value === 'string') {
          this.settings.colorBlindMode = value as ColorBlindMode;
        }
        break;
      default:
        return false;
    }
    
    await this.saveSettings(this.settings);
    this.notifyListeners();
    return true;
  }
  
  /**
   * Aktualisiere Einstellungen
   */
  public async updateSettings(newSettings: Partial<AccessibilitySettings>): Promise<boolean> {
    this.settings = { ...this.settings, ...newSettings };
    const success = await this.saveSettings(this.settings);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }
  
  /**
   * Aktuelle Einstellungen zurückgeben
   */
  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }
  
  /**
   * Einen Style basierend auf den Einstellungen skalieren
   */
  public scaleStyle(style: ViewStyle | TextStyle, options?: { specificScale?: number }): ViewStyle | TextStyle {
    if (!style) return {};
    
    const scaledStyle: any = { ...style };
    const scaleValue = options?.specificScale || this.settings.uiScale;
    
    // Fonts/Texte skalieren
    if ('fontSize' in scaledStyle && typeof scaledStyle.fontSize === 'number') {
      scaledStyle.fontSize = scaledStyle.fontSize * this.settings.fontScale;
    }
    
    if ('lineHeight' in scaledStyle && typeof scaledStyle.lineHeight === 'number') {
      scaledStyle.lineHeight = scaledStyle.lineHeight * this.settings.fontScale;
    }
    
    // Abstände (falls aktiviert)
    if (this.settings.increaseSpacing) {
      if ('letterSpacing' in scaledStyle && typeof scaledStyle.letterSpacing === 'number') {
        scaledStyle.letterSpacing += 0.5;
      } else if ('letterSpacing' in scaledStyle) {
        scaledStyle.letterSpacing = 0.5;
      }
    }
    
    // Fettdruck (falls aktiviert)
    if (this.settings.boldText && 'fontWeight' in scaledStyle) {
      scaledStyle.fontWeight = 'bold';
    }
    
    // UI-Elemente skalieren
    if ('padding' in scaledStyle && typeof scaledStyle.padding === 'number') {
      scaledStyle.padding = scaledStyle.padding * scaleValue;
    }
    
    if ('margin' in scaledStyle && typeof scaledStyle.margin === 'number') {
      scaledStyle.margin = scaledStyle.margin * scaleValue;
    }
    
    if ('width' in scaledStyle && typeof scaledStyle.width === 'number') {
      scaledStyle.width = scaledStyle.width * scaleValue;
    }
    
    if ('height' in scaledStyle && typeof scaledStyle.height === 'number') {
      scaledStyle.height = scaledStyle.height * scaleValue;
    }
    
    // Hoher Kontrast (falls aktiviert)
    if (this.settings.highContrast) {
      if ('color' in scaledStyle && typeof scaledStyle.color === 'string') {
        if (scaledStyle.color !== '#FFFFFF' && scaledStyle.color !== '#000000') {
          // Wir würden hier eigentlich eine komplexe Farbberechnung für höheren Kontrast machen
          // Für dieses Beispiel vereinfachen wir es
          scaledStyle.color = scaledStyle.color.toLowerCase() === '#ffffff' ? '#FFFFFF' : '#000000';
        }
      }
      
      if ('backgroundColor' in scaledStyle && typeof scaledStyle.backgroundColor === 'string') {
        if (scaledStyle.backgroundColor !== '#FFFFFF' && scaledStyle.backgroundColor !== '#000000') {
          scaledStyle.backgroundColor = scaledStyle.backgroundColor.toLowerCase() === '#ffffff' 
            ? '#FFFFFF' 
            : '#000000';
        }
      }
    }
    
    return scaledStyle;
  }
  
  /**
   * Listener für Einstellungsänderungen hinzufügen
   */
  public addSettingsChangeListener(callback: (settings: AccessibilitySettings) => void): void {
    this.eventEmitter.on('settingsChanged', callback);
  }
  
  /**
   * Listener für Einstellungsänderungen entfernen
   */
  public removeSettingsChangeListener(callback: (settings: AccessibilitySettings) => void): void {
    this.eventEmitter.off('settingsChanged', callback);
  }
  
  /**
   * Einstellungen auf Standardwerte zurücksetzen
   */
  public async resetSettings(): Promise<boolean> {
    this.settings = { ...DEFAULT_SETTINGS };
    const success = await this.saveSettings(this.settings);
    
    if (success) {
      this.notifyListeners();
    }
    
    return success;
  }
  
  /**
   * Service aufräumen (z.B. bei App-Beendigung)
   */
  public cleanup(): void {
    this.eventEmitter.removeAllListeners();
  }
}

// Singleton-Instanz exportieren
export default AccessibilityService.getInstance();