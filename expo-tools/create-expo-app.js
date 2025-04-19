// Skript zur Erstellung einer funktionsfähigen Expo App
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Konfiguration für die App
const appConfig = {
  name: "Human Rights Intelligence",
  slug: "human-rights-intelligence",
  version: "1.0.0",
  description: "Eine App für Menschenrechtsverteidiger mit KI-Unterstützung",
  primaryColor: "#3E64FF",
  androidPackage: "com.humanrightsintelligence.app",
  permissions: [
    "CAMERA",
    "RECORD_AUDIO",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE"
  ]
};

// Relativer Pfad zum mobile-app Verzeichnis
const mobileDirPath = path.resolve(__dirname, '..');

// Pfad, in dem die exportierte App gespeichert wird
const outputPath = path.join(mobileDirPath, 'dist');

// Expo-Konfiguration erstellen
function createExpoConfig() {
  console.log('Erstelle app.json für Expo...');
  
  const appJson = {
    expo: {
      name: appConfig.name,
      slug: appConfig.slug,
      version: appConfig.version,
      orientation: "portrait",
      icon: "./assets/icon.png",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      updates: {
        fallbackToCacheTimeout: 0
      },
      assetBundlePatterns: [
        "**/*"
      ],
      ios: {
        supportsTablet: true,
        bundleIdentifier: appConfig.androidPackage
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#FFFFFF"
        },
        package: appConfig.androidPackage,
        permissions: appConfig.permissions
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      description: appConfig.description
    }
  };
  
  fs.writeFileSync(
    path.join(mobileDirPath, 'app.json'),
    JSON.stringify(appJson, null, 2)
  );
  console.log('app.json erstellt.');
}

// EAS Konfiguration erstellen
function createEasConfig() {
  console.log('Erstelle eas.json für Expo EAS Build...');
  
  const easJson = {
    "cli": {
      "version": ">= 3.13.3"
    },
    "build": {
      "development": {
        "developmentClient": true,
        "distribution": "internal"
      },
      "preview": {
        "distribution": "internal",
        "android": {
          "buildType": "apk"
        }
      },
      "production": {}
    },
    "submit": {
      "production": {}
    }
  };
  
  fs.writeFileSync(
    path.join(mobileDirPath, 'eas.json'),
    JSON.stringify(easJson, null, 2)
  );
  console.log('eas.json erstellt.');
}

// Umgebungskonfiguration erstellen
function createEnvironmentConfig() {
  console.log('Erstelle Umgebungskonfiguration...');
  
  const envConfig = `// Umgebungskonfiguration für die mobile App
export const environment = {
  // API-URL für die Verbindung mit dem Backend
  apiUrl: "https://workspace.juljocez.repl.co",
  
  // App-Version
  version: "${appConfig.version}",
  
  // Umgebungseinstellungen
  isProduction: true,
  enableAnalytics: false,
  
  // Offlinemodus-Einstellungen
  enableOfflineMode: true,
  offlineStorageLimit: 500,
  
  // Standard-Sprache der App
  defaultLanguage: "de",
  
  // Feature-Flags
  features: {
    smartGlassesIntegration: true,
    voiceCommands: true,
    documentScanning: true,
    accessibilityTools: true,
    aiAssistance: true
  }
};`;
  
  const configDir = path.join(mobileDirPath, 'src', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(configDir, 'environment.js'),
    envConfig
  );
  console.log('Umgebungskonfiguration erstellt.');
}

// Sicherstellen, dass das output-Verzeichnis existiert
function ensureOutputDir() {
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    console.log(`Ausgabeverzeichnis erstellt: ${outputPath}`);
  }
}

// Hauptfunktion
function main() {
  console.log('=== Human Rights Intelligence App Builder ===');
  
  try {
    ensureOutputDir();
    createExpoConfig();
    createEasConfig();
    createEnvironmentConfig();
    
    console.log('\nApp-Konfiguration erfolgreich erstellt!');
    console.log('\nAnleitung zur Erstellung der APK:');
    console.log('1. Installieren Sie Expo CLI: npm install -g eas-cli');
    console.log('2. Melden Sie sich an: eas login');
    console.log('3. Führen Sie aus: eas build -p android --profile preview');
    console.log('\nNach Abschluss des Builds erhalten Sie einen Link zum Herunterladen der APK.');
    console.log('\nFür eine lokale Vorschau:');
    console.log('1. Installieren Sie die Expo Go App auf Ihrem Gerät');
    console.log('2. Führen Sie aus: npx expo start');
    console.log('3. Scannen Sie den QR-Code mit der Expo Go App');
    
  } catch (error) {
    console.error('Fehler bei der App-Erstellung:', error);
    process.exit(1);
  }
}

// Ausführen der Hauptfunktion
main();