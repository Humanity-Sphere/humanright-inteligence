#!/bin/bash

echo "=== Human Rights Defender Mobile APK Builder ==="

# Prüfe ob eas-cli installiert ist
if ! command -v npx eas &> /dev/null
then
    echo "EAS CLI wird installiert..."
    npm install eas-cli
fi

# Wir sind bereits im Mobile-App-Verzeichnis, keine Navigation notwendig
# cd "$(dirname "$0")" || exit

# Prüfe auf Expo Token
if [ -z "$EXPO_TOKEN" ]
then
    echo "EXPO_TOKEN nicht gefunden. Bitte auf der App-Seite einen Token hinzufügen."
    echo "Ein Expo-Token kann auf https://expo.dev/settings/access-tokens erstellt werden."
    echo "Nach dem Erstellen des Tokens, fügen Sie ihn als Umgebungsvariable hinzu."
    exit 1
fi

# API-URL für Replit
API_URL="https://${REPL_SLUG}-${REPL_OWNER}.${REPL_SLUG}.repl.co"
echo "API-URL wird auf $API_URL gesetzt"

# Status-Nachricht
echo "Bereite den APK-Build vor..."

# Prüfe app.json und eas.json
if [ ! -f "app.json" ]; then
    echo "Fehler: app.json nicht gefunden!"
    exit 1
fi

# Erstelle oder aktualisiere eas.json, wenn nötig
cat > eas.json << EOF
{
  "cli": {
    "version": ">= 5.9.1",
    "requireCommit": false,
    "promptToConfigurePushNotifications": false,
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "withoutCredentials": true
      }
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
EOF

echo "eas.json aktualisiert"

# APK-Build starten
echo "Starte APK-Build..."
echo "Dieser Prozess kann einige Minuten dauern."

npx eas build -p android --profile preview --non-interactive

echo "Build-Prozess gestartet. Nach Abschluss können Sie die APK-Datei im Expo-Dashboard herunterladen."
echo "Besuchen Sie https://expo.dev/accounts/[IHR_ACCOUNT]/projects/hrdefenderguard/builds"
echo "Hinweis: Der Build-Prozess kann 5-15 Minuten dauern."