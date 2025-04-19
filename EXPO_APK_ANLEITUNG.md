# Erstellung einer Android APK mit Expo Go (Aktualisiert: April 2025)

Diese Anleitung beschreibt, wie Sie eine APK-Datei der Human Rights Intelligence Mobile App erstellen können, die auf Android-Geräten installiert werden kann. Die Anleitung wurde für die aktualisierte Version mit erweiterten KI-Funktionen aktualisiert.

## Voraussetzungen

1. Ein kostenloses [Expo-Konto](https://expo.dev/signup)
2. Die Expo Go App auf Ihrem Android-Gerät (aus dem [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))
3. Node.js v16 oder höher

## Option 1: APK mit Expo EAS Build erstellen (empfohlen)

Dies ist der einfachste Weg, um eine installierbare APK zu erhalten:

1. Führen Sie das aktualisierte Build-Skript aus:
   ```bash
   ./build-mobile-apk.sh
   ```
   
2. Wenn Sie aufgefordert werden, melden Sie sich bei Ihrem Expo-Konto an oder erstellen Sie ein neues.

3. Der Build-Prozess wurde optimiert und ist nun schneller. Ein Link wird angezeigt, unter dem Sie den Fortschritt verfolgen können.

4. Nach Abschluss des Builds (ca. 7-10 Minuten) können Sie die APK-Datei über das Expo-Dashboard herunterladen und auf Ihrem Gerät installieren.

## Option 2: Schnelles Testen mit QR-Code (ohne Installation)

Für den schnellen Test der aktuellen Version:

1. Führen Sie den verbesserten QR-Code-Generator aus:
   ```bash
   npm run generate-qr
   ```

2. Ein QR-Code wird im Terminal angezeigt.

3. Öffnen Sie die Expo Go App auf Ihrem Android-Gerät und scannen Sie den QR-Code.

4. Die neueste Version der App wird direkt in der Expo Go App geladen, mit allen aktuellen Funktionen.

## Option 3: Entwicklungsumgebung mit Tunneling (neu)

Diese Methode bietet die beste Entwicklungserfahrung mit Live-Updates:

1. Installieren Sie die neuesten Expo-Tools:
   ```bash
   npm install -g eas-cli@latest expo-cli@latest
   ```

2. Starten Sie den Entwicklungsserver mit Tunneling:
   ```bash
   cd mobile-app
   npx expo start --tunnel
   ```

3. Scannen Sie den QR-Code mit der Expo Go App. Das Tunneling ermöglicht die Verbindung, selbst wenn Ihr Gerät in einem anderen Netzwerk ist.

4. Änderungen werden in Echtzeit auf Ihrem Gerät aktualisiert.

## Neue Funktionen der Mobile App (April 2025)

Die aktuelle Version enthält folgende neue Funktionen:

- **KI-Agenten Hub** für mobilen Zugriff auf alle KI-Assistenten
- **Voice-First Interface** mit verbesserter Spracherkennung
- **Offline-Dokumentenanalyse** mit lokalem KI-Modell
- **Agent Flow Builder** für unterwegs
- **ContentStudio Mobile** mit Whiteboard-Funktionen
- **Self-Repair-Funktionen** für App-Stabilität
- **HURIDOCS-Integration** für Feldarbeit
- **Erweiterte Kameraintegration** für Dokumentenerfassung
- **Synchronisierung** mit Desktop- und Web-Version
- **Biometrische Authentifizierung** für erhöhte Sicherheit

## Systemanforderungen

- Android 7.0 oder höher (empfohlen: Android 9.0+)
- 4 GB RAM (empfohlen: 6 GB+)
- 500 MB freier Speicherplatz (1 GB für volle Offline-Funktionalität)
- Kamera und Mikrofon für volle Funktionalität

## Fehlerbehebung

- **Verbindungsprobleme**: Verwenden Sie die "--tunnel" Option für zuverlässigere Verbindungen.
- **KI-Funktionen**: Stellen Sie sicher, dass die API-Schlüssel in der .env-Datei konfiguriert sind.
- **Leistungsprobleme**: Aktivieren Sie den "Lite-Modus" in den App-Einstellungen für ältere Geräte.
- **Build-Fehler**: Überprüfen Sie die Expo-Build-Logs und stellen Sie sicher, dass Ihre eas.json korrekt ist.
- **APK-Installation**: Erlauben Sie die Installation aus unbekannten Quellen in den Android-Einstellungen.

## Entwicklungs-Tipps

- Ändern Sie die Datei `eas.json` für angepasste Build-Konfigurationen
- Nutzen Sie `expo-dev-client` für erweiterte Entwicklungsszenarien
- Verwenden Sie `npx expo prebuild` für native Code-Anpassungen
- Das Debug-Menü ist in der App unter Einstellungen > Entwickler verfügbar

Die App ist für den Einsatz im Feld optimiert und funktioniert auch in Gebieten mit eingeschränkter Internetverbindung zuverlässig.