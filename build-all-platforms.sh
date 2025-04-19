
#!/bin/bash
echo "=== Human Rights Defender Tools - Automatisierter Build-Prozess ==="
echo "Starte den automatisierten Build-Prozess für alle Plattformen..."

# Installiere alle Abhängigkeiten
echo "Installiere Abhängigkeiten für alle Plattformen..."
npm install

# Web-App bauen
echo "Baue die Web-Anwendung..."
npm run build

# Mobile App APK erstellen
echo "Baue die Mobile App APK..."
cd mobile-app
npm install
npx expo build:android -t apk --non-interactive
cd ..

# Windows Desktop-App bauen
echo "Baue die Windows Desktop-Anwendung..."
sh build-windows-exe.sh

echo "Build-Prozess abgeschlossen!"
echo "Die Artefakte befinden sich in den folgenden Verzeichnissen:"
echo "- Web-App: ./dist"
echo "- Windows-App: ./dist"
echo "- Mobile-App: Expo-Build (Download-Link in der Konsole)"
