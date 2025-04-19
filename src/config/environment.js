// Umgebungskonfiguration für die mobile App
export const environment = {
  // API-URL für die Verbindung mit dem Backend
  // In Produktionsumgebung wird dies durch die Backend-URL ersetzt
  apiUrl: "https://" + window.location.hostname,
  
  // App-Version
  version: "1.0.0",
  
  // Umgebungseinstellungen
  isProduction: false,
  enableAnalytics: false,
  
  // Offlinemodus-Einstellungen
  enableOfflineMode: true,
  offlineStorageLimit: 500, // Anzahl der Datensätze, die offline gespeichert werden können
  
  // Standard-Sprache der App
  defaultLanguage: "de",
  
  // Feature-Flags
  features: {
    smartGlassesIntegration: true,
    voiceCommands: true,
    documentScanning: true,
    accessibilityTools: true,
    aiAssistance: true
  },
  
  // Timeout-Einstellungen für API-Anfragen (in Millisekunden)
  apiTimeouts: {
    default: 10000,
    documentAnalysis: 30000,
    patternDetection: 45000
  }
};