# Human Rights Intelligence Mobile App

## Übersicht

Diese mobile Anwendung ist Teil der Human Rights Intelligence Plattform, die für Menschenrechtsverteidiger entwickelt wurde. Sie bietet sichere und intelligente Funktionen für die Dokumentation, Analyse und den Schutz von sensiblen Informationen.

## Funktionen

- Sichere Dokumentenverwaltung
- Persönliches Journal/Tagebuch
- Kontextabhängige Sicherheitsempfehlungen
- KI-gestützte Analyse und Unterstützung
- Unterstützung für den Offline-Modus
- Globaler KI-Assistent
- Integration mit der Web-Plattform

## Technologie-Stack

- React Native (mit Expo)
- TypeScript
- Mehrsprachige Unterstützung (Deutsch/Englisch)
- Lokale Datenverschlüsselung
- Integration verschiedener KI-Dienste (OpenAI, Google Gemini, Claude)

## Entwicklung

### Voraussetzungen

- Node.js (v18+)
- npm oder yarn
- Expo CLI
- Ein Expo-Konto für die Entwicklung und den Build-Prozess

### Lokale Entwicklung

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Entwicklungsserver starten:
   ```bash
   npx expo start
   ```

3. QR-Code scannen mit der Expo Go App auf Ihrem Mobilgerät:
   ```bash
   node qr-generator.js
   ```

### APK erstellen

Für die Erstellung einer installierbaren Android-APK:

1. Führen Sie das Build-Skript aus:
   ```bash
   ./app-build.sh
   ```

2. Die APK wird über den Expo-Dienst erstellt (erfordert ein Expo-Konto).

3. Der Fortschritt und der Download-Link sind im Expo-Dashboard verfügbar.

**Alternative:** Detaillierte Anweisungen finden Sie in der `EXPO_APK_ANLEITUNG.md` Datei.

## Offline-Funktionalität

Die App ist für den Einsatz in Regionen mit eingeschränkter Internetverbindung konzipiert. Wichtige Funktionen wie Journal-Einträge und Dokumentenverwaltung sind auch offline verfügbar.

## Sicherheit

Alle sensiblen Daten werden lokal auf dem Gerät verschlüsselt gespeichert. Die Anwendung verwendet moderne Sicherheitsstandards, um die Vertraulichkeit der Daten zu gewährleisten.

## Kontakt

Bei Fragen oder Problemen mit der mobilen Anwendung wenden Sie sich bitte an das Entwicklungsteam.