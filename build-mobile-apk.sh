#!/bin/bash

echo "===== Human Rights Defender Mobile APK Builder =====\n"
echo "Starte den Build-Prozess für die mobile Anwendung...\n"

# Wechsele ins mobile-app-Verzeichnis
cd mobile-app || {
  echo "Das mobile-app-Verzeichnis wurde nicht gefunden!"
  exit 1
}

# Prüfen, ob Expo installiert ist
if ! npm list -g | grep -q 'eas-cli'; then
  echo "Installiere eas-cli..."
  npm install -g eas-cli
fi

# Prüfen auf EXPO_TOKEN in den Umgebungsvariablen
if [ -z "$EXPO_TOKEN" ]; then
  echo "EXPO_TOKEN nicht gefunden!"
  echo "Bitte Expo-Token auf https://expo.dev/settings/access-tokens erstellen und als Umgebungsvariable hinzufügen."
  exit 1
fi

# App-Konfiguration prüfen
if [ ! -f "app.json" ]; then
  echo "app.json nicht gefunden!"
  exit 1
fi

echo "Konfiguration erfolgreich geladen"

# APK-Build starten
echo "\nStarte APK-Build mit Expo EAS..."
echo "Dieser Prozess kann einige Minuten dauern.\n"

# Build ausführen
npm run build:apk

echo "\nBuild-Befehl abgeschlossen."
echo "Wenn der Build erfolgreich war, können Sie die APK-Datei von Expo herunterladen."
echo "Besuchen Sie https://expo.dev und navigieren Sie zu Ihrem Projekt."