
#!/bin/bash
echo "=== Human Rights Defender Tools - Platform Setup ==="
echo "Installiere Abhängigkeiten für alle Plattformen..."

# Hauptprojekt-Abhängigkeiten
npm install

# Web-Client Abhängigkeiten
cd client
npm install
cd ..

# Mobile App Abhängigkeiten
cd mobile-app
npm install
cd ..

# Electron Abhängigkeiten
npm install electron electron-builder --save-dev

echo "Installation abgeschlossen!"
echo "Verwenden Sie 'npm run build-all' um alle Plattformen zu bauen"
