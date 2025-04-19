
// Grundlegende Konfiguration für die App

// API-Basis-URLs für verschiedene Umgebungen
export const API_CONFIG = {
  development: 'http://localhost:3000/api',
  production: 'https://api.rightdocs.io/v1',
};

// Aktuelle Umgebung festlegen
export const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Aktive API-URL basierend auf Umgebung
export const API_BASE_URL = API_CONFIG[ENVIRONMENT];

// App-Konfiguration
export const APP_CONFIG = {
  appName: 'Menschenrechtsverteidiger App',
  version: '1.0.0',
  supportEmail: 'support@rightdocs.org',
  offlineStorageEnabled: true,
  maxOfflineDocuments: 100,
};

// Optionen für die Barrierefreiheit
export const ACCESSIBILITY_OPTIONS = {
  defaultFontSize: 100,
  minFontSize: 80,
  maxFontSize: 150,
  fontSizeStep: 10,
};

// Verfügbare Sprachen in der App
export const LANGUAGES = [
  { code: 'de', name: 'Deutsch', isDefault: true },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
];

// Integrationsoptionen
export const INTEGRATIONS = {
  uwazi: {
    enabled: true,
    baseUrl: 'https://demo.uwazi.io',
  },
  googleDrive: {
    enabled: true,
  },
};
