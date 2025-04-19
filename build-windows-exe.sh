#!/bin/bash

# Setze die Umgebungsvariable NODE_ENV auf production
export NODE_ENV=production

# Zeige Informationen an
echo "==== Human Rights Defender Tools Windows EXE Build ===="
echo "Installiere Abhängigkeiten für Electron..."

# Installiere Abhängigkeiten für Electron
echo "Richte Electron-Builder für die App ein..."
mkdir -p build/static

# Erstelle eine temporäre package.json im build-Verzeichnis für Electron
cat > build/package.json << EOF
{
  "name": "human-rights-defender-tools",
  "version": "1.0.0",
  "description": "Eine sichere, intelligente KI-gestützte Plattform für Menschenrechtsdokumentation",
  "main": "../electron/main.js",
  "author": "HRDP Team",
  "license": "MIT",
  "private": true
}
EOF

# Kopiere die Icon-Datei
cp electron/icon.png build/

echo "Baue die React-Anwendung..."
# Erstelle den React-Build
npm run build

# Kopiere Electron-Dateien
cp -r electron build/

# Erstelle die Windows EXE-Datei mit electron-builder
echo "Erstelle Windows EXE-Datei..."
npx electron-builder --win --x64 --dir

echo "Build abgeschlossen!"
echo "Die EXE-Datei befindet sich im 'dist'-Verzeichnis."