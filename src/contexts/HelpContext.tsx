import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definieren der Typen für die Hilfedaten
export interface HelpItem {
  id: string;
  title: string;
  content: string;
  variant?: 'info' | 'tip' | 'warning' | 'important';
  category?: string;
  tags?: string[];
  relatedIds?: string[];
  priority?: number;
}

interface HelpTourStep {
  helpId: string;
  targetElementId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface HelpTour {
  id: string;
  name: string;
  steps: HelpTourStep[];
  showOnFirstVisit?: boolean;
  showOnFeatureUpdate?: boolean;
}

interface HelpContextType {
  // Sichtbarkeitsstatus für spezifische Hilfethemen
  visibleHelpIds: Record<string, boolean>;

  // Gesehene Hilfeelemente und Touren
  seenHelpIds: Set<string>;
  completedTours: Set<string>;

  // Aktuelle Tour-Daten
  activeTourId: string | null;
  activeTourStep: number;

  // Benutzereinstellungen
  helpEnabled: boolean;
  autoShowHelp: boolean;
  contextualHintsEnabled: boolean;

  // Methoden zur Steuerung der Hilfeanzeige
  showHelp: (helpId: string) => void;
  hideHelp: (helpId: string) => void;
  toggleHelp: (helpId: string) => void;
  isHelpVisible: (helpId: string) => boolean;

  // Methoden für Touren
  startTour: (tourId: string) => void;
  stopCurrentTour: () => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;

  // Methoden zur Verwaltung von gesehenen Hilfeelementen
  markHelpAsSeen: (helpId: string) => void;
  isHelpSeen: (helpId: string) => boolean;
  resetSeenHelp: () => void;

  // Methoden zur Verwaltung von Benutzereinstellungen
  setHelpEnabled: (enabled: boolean) => void;
  setAutoShowHelp: (enabled: boolean) => void;
  setContextualHintsEnabled: (enabled: boolean) => void;

  // Zugriff auf Hilfeinhalte
  getHelpItem: (helpId: string) => HelpItem | undefined;
  getHelpItemsByCategory: (category: string) => HelpItem[];
  getHelpItemsByTags: (tags: string[]) => HelpItem[];
  searchHelpItems: (query: string) => HelpItem[];

  // Listen von Hilfeelementen und Touren
  helpItems: HelpItem[];
  tours: HelpTour[];
  showHelpOverlay: boolean; // Added from edited code
  toggleHelpOverlay: () => void; // Added from edited code
  currentScreen: string; // Added from edited code
  setCurrentScreen: (screen: string) => void; // Added from edited code

}

// Erstellen des Kontexts
const HelpContext = createContext<HelpContextType | undefined>(undefined);

// Storage-Keys
const STORAGE_KEYS = {
  SEEN_HELP: 'seen_help_ids',
  COMPLETED_TOURS: 'completed_tours',
  HELP_SETTINGS: 'help_settings'
};

// Standardeinstellungen
const DEFAULT_SETTINGS = {
  helpEnabled: true,
  autoShowHelp: true,
  contextualHintsEnabled: true
};

interface HelpProviderProps {
  children: ReactNode;
  helpItems: HelpItem[];
  tours: HelpTour[];
}

/**
 * Provider-Komponente für den Hilfe-Kontext
 */
export const HelpProvider: React.FC<HelpProviderProps> = ({
  children,
  helpItems,
  tours
}) => {
  // Sichtbarkeit der Hilfen
  const [visibleHelpIds, setVisibleHelpIds] = useState<Record<string, boolean>>({});

  // Gesehene Hilfeelemente und Touren
  const [seenHelpIds, setSeenHelpIds] = useState<Set<string>>(new Set());
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());

  // Aktuelle Tour-Daten
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeTourStep, setActiveTourStep] = useState(0);

  // Benutzereinstellungen
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Hilfedaten
  const [localHelpItems] = useState<HelpItem[]>(helpItems);
  const [localTours] = useState<HelpTour[]>(tours);

  // Overlay state from edited code
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');

  // Daten beim Start laden
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Geladene Hilfethemen
        const storedSeenHelpIds = await AsyncStorage.getItem(STORAGE_KEYS.SEEN_HELP);
        if (storedSeenHelpIds) {
          setSeenHelpIds(new Set(JSON.parse(storedSeenHelpIds)));
        }

        // Abgeschlossene Touren
        const storedCompletedTours = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_TOURS);
        if (storedCompletedTours) {
          setCompletedTours(new Set(JSON.parse(storedCompletedTours)));
        }

        // Einstellungen
        const storedSettings = await AsyncStorage.getItem(STORAGE_KEYS.HELP_SETTINGS);
        if (storedSettings) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...JSON.parse(storedSettings)
          });
        }

        // Auto-Tour für Erstbesucher starten
        const firstVisitTour = localTours.find(tour => tour.showOnFirstVisit && !completedTours.has(tour.id));
        if (firstVisitTour && settings.autoShowHelp) {
          startTour(firstVisitTour.id);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Hilfe-Daten:', error);
      }
    };

    loadStoredData();
  }, []);

  // Hilfesichtbarkeit ändern
  const showHelp = useCallback((helpId: string) => {
    setVisibleHelpIds(prev => ({ ...prev, [helpId]: true }));
  }, []);

  const hideHelp = useCallback((helpId: string) => {
    setVisibleHelpIds(prev => {
      const newState = { ...prev };
      delete newState[helpId];
      return newState;
    });
  }, []);

  const toggleHelp = useCallback((helpId: string) => {
    setVisibleHelpIds(prev => {
      const newState = { ...prev };
      if (newState[helpId]) {
        delete newState[helpId];
      } else {
        newState[helpId] = true;
      }
      return newState;
    });
  }, []);

  const isHelpVisible = useCallback((helpId: string) => {
    return !!visibleHelpIds[helpId];
  }, [visibleHelpIds]);

  // Tour-Steuerung
  const startTour = useCallback((tourId: string) => {
    const tour = localTours.find(t => t.id === tourId);
    if (!tour || !settings.helpEnabled) return;

    setActiveTourId(tourId);
    setActiveTourStep(0);

    // Ersten Hilfetext anzeigen
    if (tour.steps.length > 0) {
      showHelp(tour.steps[0].helpId);
    }
  }, [localTours, settings.helpEnabled, showHelp]);

  const stopCurrentTour = useCallback(() => {
    if (!activeTourId) return;

    // Aktive Hilfe ausblenden
    const tour = localTours.find(t => t.id === activeTourId);
    if (tour && activeTourStep < tour.steps.length) {
      hideHelp(tour.steps[activeTourStep].helpId);
    }

    // Tour als abgeschlossen markieren
    const newCompletedTours = new Set(completedTours);
    newCompletedTours.add(activeTourId);
    setCompletedTours(newCompletedTours);

    // Tour beenden
    setActiveTourId(null);
    setActiveTourStep(0);

    // In AsyncStorage speichern
    AsyncStorage.setItem(
      STORAGE_KEYS.COMPLETED_TOURS,
      JSON.stringify([...newCompletedTours])
    );
  }, [activeTourId, activeTourStep, completedTours, localTours, hideHelp]);

  const goToNextStep = useCallback(() => {
    if (!activeTourId) return;

    const tour = localTours.find(t => t.id === activeTourId);
    if (!tour) return;

    // Aktuelle Hilfe ausblenden
    if (activeTourStep < tour.steps.length) {
      hideHelp(tour.steps[activeTourStep].helpId);
    }

    const nextStep = activeTourStep + 1;

    if (nextStep >= tour.steps.length) {
      // Tour beenden
      stopCurrentTour();
    } else {
      // Zur nächsten Hilfe gehen
      setActiveTourStep(nextStep);
      showHelp(tour.steps[nextStep].helpId);
    }
  }, [activeTourId, activeTourStep, localTours, hideHelp, showHelp, stopCurrentTour]);

  const goToPrevStep = useCallback(() => {
    if (!activeTourId) return;

    const tour = localTours.find(t => t.id === activeTourId);
    if (!tour) return;

    // Aktuelle Hilfe ausblenden
    if (activeTourStep < tour.steps.length) {
      hideHelp(tour.steps[activeTourStep].helpId);
    }

    // Nicht unter 0 gehen
    const prevStep = Math.max(0, activeTourStep - 1);

    setActiveTourStep(prevStep);
    showHelp(tour.steps[prevStep].helpId);
  }, [activeTourId, activeTourStep, localTours, hideHelp, showHelp]);

  // Gesehene Hilfen verwalten
  const markHelpAsSeen = useCallback((helpId: string) => {
    const newSeenHelpIds = new Set(seenHelpIds);
    newSeenHelpIds.add(helpId);
    setSeenHelpIds(newSeenHelpIds);

    // In AsyncStorage speichern
    AsyncStorage.setItem(
      STORAGE_KEYS.SEEN_HELP,
      JSON.stringify([...newSeenHelpIds])
    );
  }, [seenHelpIds]);

  const isHelpSeen = useCallback((helpId: string) => {
    return seenHelpIds.has(helpId);
  }, [seenHelpIds]);

  const resetSeenHelp = useCallback(() => {
    setSeenHelpIds(new Set());
    AsyncStorage.removeItem(STORAGE_KEYS.SEEN_HELP);
  }, []);

  // Einstellungen verwalten
  const updateSettings = useCallback((newSettings: Partial<typeof DEFAULT_SETTINGS>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };

      // In AsyncStorage speichern
      AsyncStorage.setItem(
        STORAGE_KEYS.HELP_SETTINGS,
        JSON.stringify(updated)
      );

      return updated;
    });
  }, []);

  const setHelpEnabled = useCallback((enabled: boolean) => {
    updateSettings({ helpEnabled: enabled });
  }, [updateSettings]);

  const setAutoShowHelp = useCallback((enabled: boolean) => {
    updateSettings({ autoShowHelp: enabled });
  }, [updateSettings]);

  const setContextualHintsEnabled = useCallback((enabled: boolean) => {
    updateSettings({ contextualHintsEnabled: enabled });
  }, [updateSettings]);

  // Hilfeinhalte abrufen
  const getHelpItem = useCallback((helpId: string) => {
    return localHelpItems.find(item => item.id === helpId);
  }, [localHelpItems]);

  const getHelpItemsByCategory = useCallback((category: string) => {
    return localHelpItems.filter(item => item.category === category);
  }, [localHelpItems]);

  const getHelpItemsByTags = useCallback((tags: string[]) => {
    return localHelpItems.filter(item =>
      item.tags && tags.some(tag => item.tags?.includes(tag))
    );
  }, [localHelpItems]);

  const searchHelpItems = useCallback((query: string) => {
    if (!query) return [];

    const lowercaseQuery = query.toLowerCase();
    return localHelpItems.filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.content.toLowerCase().includes(lowercaseQuery) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  }, [localHelpItems]);

  // Toggle for simple overlay from edited code
  const toggleHelpOverlay = () => {
    setShowHelpOverlay(prev => !prev);
  };


  const contextValue: HelpContextType = {
    visibleHelpIds,
    seenHelpIds,
    completedTours,
    activeTourId,
    activeTourStep,
    helpEnabled: settings.helpEnabled,
    autoShowHelp: settings.autoShowHelp,
    contextualHintsEnabled: settings.contextualHintsEnabled,
    showHelp,
    hideHelp,
    toggleHelp,
    isHelpVisible,
    startTour,
    stopCurrentTour,
    goToNextStep,
    goToPrevStep,
    markHelpAsSeen,
    isHelpSeen,
    resetSeenHelp,
    setHelpEnabled,
    setAutoShowHelp,
    setContextualHintsEnabled,
    getHelpItem,
    getHelpItemsByCategory,
    getHelpItemsByTags,
    searchHelpItems,
    helpItems: localHelpItems,
    tours: localTours,
    showHelpOverlay,
    toggleHelpOverlay,
    currentScreen,
    setCurrentScreen
  };

  return (
    <HelpContext.Provider value={contextValue}>
      {children}
    </HelpContext.Provider>
  );
};

// Custom Hook zum Zugriff auf den Hilfe-Kontext
export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

// Hook zum Verwalten eines einzelnen Hilfeelements
export const useHelpItem = (helpId: string) => {
  const {
    isHelpVisible,
    showHelp,
    hideHelp,
    toggleHelp,
    markHelpAsSeen,
    isHelpSeen,
    getHelpItem
  } = useHelp();

  const helpItem = getHelpItem(helpId);
  const isVisible = isHelpVisible(helpId);
  const isSeen = isHelpSeen(helpId);

  return {
    helpItem,
    isVisible,
    isSeen,
    show: () => showHelp(helpId),
    hide: () => hideHelp(helpId),
    toggle: () => toggleHelp(helpId),
    markAsSeen: () => markHelpAsSeen(helpId)
  };
};

// Beispieldaten für die mobile App
export const defaultHelpItems: HelpItem[] = [
  {
    id: 'welcome-mobile',
    title: 'Willkommen bei Human Rights Intelligence',
    content: 'Diese App unterstützt Sie bei der Dokumentation und Analyse von Menschenrechtsverletzungen, auch unterwegs und offline.',
    variant: 'info',
    category: 'getting-started',
    tags: ['welcome', 'intro']
  },
  {
    id: 'offline-mode',
    title: 'Offline-Modus',
    content: 'Die App funktioniert auch ohne Internetverbindung. Ihre Daten werden synchronisiert, sobald Sie wieder online sind.',
    variant: 'tip',
    category: 'features',
    tags: ['offline', 'sync']
  },
  {
    id: 'camera-integration',
    title: 'Kamera und Dokumentenerfassung',
    content: 'Nutzen Sie die Kamera Ihres Geräts, um Beweise zu dokumentieren oder Dokumente zu scannen.',
    variant: 'tip',
    category: 'features',
    tags: ['camera', 'evidence']
  },
  {
    id: 'voice-commands',
    title: 'Sprachbefehle',
    content: 'Steuern Sie die App mit Sprachbefehlen für eine freihändige Bedienung.',
    variant: 'tip',
    category: 'features',
    tags: ['voice', 'accessibility']
  },
  {
    id: 'accessibility',
    title: 'Barrierefreiheit',
    content: 'Passen Sie die Barrierefreiheitseinstellungen an Ihre Bedürfnisse an, um die App optimal nutzen zu können.',
    variant: 'info',
    category: 'settings',
    tags: ['accessibility', 'settings']
  },
  {
    id: 'security-mobile',
    title: 'Sicherheitshinweis',
    content: 'Ihre Daten werden verschlüsselt gespeichert. Aktivieren Sie die biometrische Authentifizierung für zusätzlichen Schutz.',
    variant: 'important',
    category: 'security',
    tags: ['security', 'privacy', 'biometric']
  },
  {
    id: 'smart-glass',
    title: 'Smart Glass Modus',
    content: 'Verbinden Sie eine Smart Glass für eine erweiterte Dokumentation mit freien Händen.',
    variant: 'info',
    category: 'advanced',
    tags: ['smart-glass', 'wearable']
  }
];

// Beispiel-Touren für die mobile App
export const defaultTours: HelpTour[] = [
  {
    id: 'mobile-getting-started',
    name: 'Erste Schritte mit der App',
    showOnFirstVisit: true,
    steps: [
      { helpId: 'welcome-mobile', position: 'bottom' },
      { helpId: 'offline-mode', position: 'bottom' },
      { helpId: 'camera-integration', position: 'bottom' },
      { helpId: 'voice-commands', position: 'bottom' }
    ]
  },
  {
    id: 'accessibility-tour',
    name: 'Barrierefreiheit einrichten',
    steps: [
      { helpId: 'accessibility', position: 'bottom' }
    ]
  },
  {
    id: 'security-tour-mobile',
    name: 'Sicherheitseinführung',
    showOnFeatureUpdate: true,
    steps: [
      { helpId: 'security-mobile', position: 'bottom' }
    ]
  },
  {
    id: 'smart-glass-tour',
    name: 'Smart Glass Einführung',
    steps: [
      { helpId: 'smart-glass', position: 'bottom' }
    ]
  }
];