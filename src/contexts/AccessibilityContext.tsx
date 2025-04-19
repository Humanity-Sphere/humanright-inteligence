
import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface AccessibilitySettings {
  isDarkMode: boolean;
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  toggleDarkMode: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
}

const defaultSettings: AccessibilitySettings = {
  isDarkMode: false,
  fontSize: 100, // Prozent des Standard-Schriftgrößen
  highContrast: false,
  reducedMotion: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const increaseFontSize = () => {
    if (settings.fontSize < 150) {
      setSettings(prev => ({ ...prev, fontSize: prev.fontSize + 10 }));
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 80) {
      setSettings(prev => ({ ...prev, fontSize: prev.fontSize - 10 }));
    }
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        toggleDarkMode,
        increaseFontSize,
        decreaseFontSize,
        toggleHighContrast,
        toggleReducedMotion,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
