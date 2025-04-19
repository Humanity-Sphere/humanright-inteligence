# APK-Installations-Anleitung

## Installation auf Android

1. Laden Sie die APK herunter
2. Öffnen Sie die heruntergeladene APK-Datei
3. Erlauben Sie die Installation aus unbekannten Quellen falls nötig
4. Folgen Sie den Anweisungen auf dem Bildschirm

## Neue Funktionen (Stand: April 2025)

- **Offline-Modus** mit erweiterter Funktionalität für Feldarbeit
- **KI-gestützte Dokumentenanalyse** mit Gemini 1.5-Integration
- **Fortschrittliche Sprachsteuerung** mit Dialekt- und Akzenterkennung
- **Smart Glass Integration** für freihändige Dokumentation
- **Multi-Faktor-Authentifizierung** für verbesserte Sicherheit
- **Self-Repair-Funktion** für automatische Problembehebung
- **Nahtlose Synchronisation** mit Desktop- und Web-Backend
- **Knowledge Management System** für verbesserte Analysen
- **Volle HURIDOCS-Unterstützung** mit standardisierten Formularen
- **Integrierte Kanban-Boards** für Aufgabenverwaltung
- **Agent Flow Builder** für mobile KI-Agenten-Konfiguration
- **ContentStudio Mobile** mit Whiteboard-Funktionalität
- **Archon-Integration** für Multi-Agenten-Systeme
- **TangoFlux** und **STORM-Framework** Support
- **Stanford OVAL** synthetische Konversationsgenerierung

## System-Anforderungen und Problembehebung

- Mindestens Android 7.0 oder höher
- 4 GB RAM (empfohlen: 6 GB oder mehr)
- 500 MB verfügbarer Speicherplatz (1 GB für volle Offline-Funktionalität)
- Kamera- und Mikrofon-Berechtigungen für volle Funktionalität

Bei Installationsproblemen:
- Stellen Sie sicher, dass Ihr Gerät die System-Anforderungen erfüllt
- Überprüfen Sie alle erforderlichen Berechtigungen in den Einstellungen
- Bei Verbindungsproblemen prüfen Sie Ihre WLAN- oder Mobilfunkverbindung
- Aktivieren Sie die Self-Repair-Funktion in den Einstellungen unter "System"

# APK für Ihr Mobiltelefon erstellen

## Option 1: Schnellinstallation über QR-Code

1. Führen Sie den aktualisierten QR-Code-Generator aus:
   ```bash
   npm run generate-qr
   ```

2. Scannen Sie den angezeigten QR-Code mit der Expo Go App

3. Die App wird automatisch installiert und gestartet

## Option 2: APK direkt in Expo erstellen (empfohlen)

Für eine vollständige standalone APK:

1. Erstellen Sie ein kostenloses Konto auf [Expo.dev](https://expo.dev)

2. Installieren Sie die aktualisierte Expo CLI:
   ```
   npm install -g eas-cli@latest
   ```

3. Melden Sie sich bei Expo an:
   ```
   eas login
   ```

4. Konfigurieren Sie den Build mit den neuen Profilen:
   ```
   cd mobile-app
   eas build:configure
   ```

5. Starten Sie den APK-Build mit dem optimierten Preview-Profil:
   ```
   eas build -p android --profile preview-2025
   ```

Der Build-Prozess wurde optimiert und ist nun schneller (ca. 5-10 Minuten). Nach Abschluss erhalten Sie einen Link zum Herunterladen der APK-Datei.

## Option 3: Lokale Entwicklung

Für fortgeschrittene Entwickler, die Anpassungen vornehmen möchten:

1. Klonen Sie das Repository oder laden Sie es als ZIP-Datei herunter

2. Navigieren Sie zum mobile-app-Verzeichnis:
   ```
   cd mobile-app
   ```

3. Installieren Sie die Abhängigkeiten:
   ```
   npm install
   ```

4. Konfigurieren Sie die erforderlichen API-Schlüssel in `.env.local`:
   ```
   GEMINI_API_KEY=ihr-gemini-api-key
   GROQ_API_KEY=ihr-groq-api-key  # Optional
   ```

5. Starten Sie die Entwicklungsumgebung:
   ```
   npx expo start --tunnel
   ```

6. Scannen Sie den QR-Code mit der Expo Go App

Das neue `--tunnel` Flag ermöglicht eine zuverlässigere Verbindung, auch wenn Ihr Gerät nicht im selben WLAN-Netzwerk ist.