# humanright-inteligence

# Human Rights Intelligence App

Eine fortschrittliche KI-gestützte Plattform zur Dokumentation, Analyse und zum Schutz von Menschenrechten mit zentraler KI-Steuerung.

## Plattformübersicht (Aktualisiert: April 2025)

Dieses Projekt ist eine integrierte Lösung für Menschenrechtsverteidiger und bietet erweiterte Werkzeuge für:

- Sichere Dokumentenverwaltung und KI-gestützte Analyse
- Zentrale Boss-KI für intelligente Aufgabenkoordination und Nutzerinteraktion
- Multi-Agenten-System mit spezialisierter Aufgabenteilung
- Interaktives ContentStudio mit Whiteboard-Funktionalität
- Umfassendes Knowledge Management System
- Erweiterte Mehrsprachige Benutzeroberfläche mit 45+ Sprachen
- Verbesserte Mobile App für Feldarbeit mit Offline-KI-Funktionen
- Self-Repair und Self-Learning Funktionen
- Umfassende Cross-Platform-Unterstützung (Web, Desktop, Mobile)

## Zentrale Boss-KI-Architektur

Das Herzstück der Human Rights Intelligence App ist die zentrale Boss-KI, die als Hauptkoordinator fungiert:

- **Zentrale Schnittstelle**: Der Nutzer interagiert primär mit einer übergeordneten KI-Entität
- **Intelligente Aufgabenverteilung**: Analysiert den Kontext und weist Aufgaben an spezialisierte Agenten zu
- **Koordination von Agentengruppen**: Orchestriert komplexe Workflows über mehrere Agenten hinweg
- **Konsistente Nutzererfahrung**: Liefert einheitliche Antworten aus multiplen Quellen
- **Personalisierte Interaktion**: Lernt kontinuierlich aus Nutzerinteraktionen
- **Voice-First-Onboarding**: Führt neue Nutzer mit natürlicher Sprache durch die Einrichtung

## Komponenten

### 1. Server & KI-Backend

Der Server bildet das Herzstück der Anwendung und bietet:
- REST-API für alle Plattformkomponenten
- Multi-Modell-KI-Integration (Google Gemini 1.5, Groq, OpenAI)
- KI-Agenten-Management und Koordination
- Authentifizierung und differenzierte Berechtigungsverwaltung
- Verteilte Datenverarbeitung und -analyse

**Technologien**: Node.js, Express, MongoDB, Neo4j, Archon Framework

### 2. Client (Web & Desktop-Frontend)

Die Web- und Desktop-Oberfläche ermöglicht:
- Interaktive Dokumentenanalyse und -verwaltung
- Voice-gesteuerte Benutzeroberfläche über MCP-Protokoll
- ContentStudio mit Whiteboard-Funktionalität
- Agent Flow Builder zur visuellen Erstellung von KI-Workflows
- Fortgeschrittene Suchfunktionen mit semantischen Erweiterungen
- Personalisierte Dashboards mit KI-generierten Erkenntnissen

**Technologien**: React, TypeScript, Tailwind CSS, Electron, ReactFlow

### 3. Mobile App mit erweiterter Funktionalität

Die mobile Anwendung bietet:
- Umfassende Offline-Funktionalität mit lokaler KI-Verarbeitung
- Verbesserte Sicherheitsmechanismen mit biometrischer Authentifizierung
- Intelligente Synchronisation mit priorisierter Datenübertragung
- Erweiterte Feldforschungsfunktionen mit GPS-Integration
- Voice Assistant für handfreie Dokumentation

**Technologien**: React Native, Expo, SQLite, TensorFlow Lite

### 4. Self-Care & Self-Repair Komponenten

Die Selbstpflege-Funktionen umfassen:
- Automatische Problemerkennung und -behebung
- Kontinuierliche Leistungsoptimierung
- Self-Learning aus Nutzerinteraktionen
- Automatische Updates kritischer Komponenten
- System-Selfcare für präventive Wartung

**Technologien**: Eigenentwickelte Reparatur-Agenten, Diagnostik-Framework

## Erweiterte KI-Funktionen

- **Zentrale Boss-KI**: Intelligenter Systemkoordinator für alle Nutzerinteraktionen
- **Multi-Agenten-Orchestrierung**: Verteilte Aufgabenbearbeitung durch spezialisierte Agenten
- **Fortschrittliche Dokumentenanalyse**: Tiefgehende Kontextanalyse mit Multi-Modell-Validierung
- **Intelligente Mustererkennung**: Identifikation komplexer Zusammenhänge mit Kausalitätsanalyse
- **Umfassende mehrsprachige Unterstützung**: Verbesserte Übersetzung und kulturell angepasste Analyse
- **Self-Learning**: Kontinuierliche Verbesserung durch Feedback-Schleifen
- **Interaktives ContentStudio**: KI-unterstützte Whiteboard-Funktionen und Dokumentverknüpfung
- **Knowledge Management System**: Dynamische Wissensdatenbank mit Self-Learning

## Installation und Start

### Komplette Plattform einrichten

```bash
# Alle Abhängigkeiten für alle Plattformen installieren
sh setup-all-platforms.sh

# Komplettes Build für alle Plattformen starten
sh build-all-platforms.sh
```

### Nur Webversion starten

```bash
npm run dev
```

### Deployment auf Replit

Für das Deployment in der Replit-Umgebung:

```bash
# Deployment-Server starten (speziell optimiert für Replit)
node scripts/fixed-deploy-server.js
```

**Wichtig:** Bei Deployment-Problemen wegen Port-Konflikten (mehrere externe Ports statt nur Port 80), bitte die Datei `DEPLOYMENT-GUIDE.md` konsultieren. Wir haben einen speziellen Server erstellt, der nur auf Port 5000 läuft, um das Deployment-Problem zu beheben.

### Mobile App entwickeln

```bash
cd mobile-app
npm start
```

Scannen Sie den generierten QR-Code mit der Expo Go App, um die Anwendung auf Ihrem Gerät zu testen.

### APK für Android erstellen

```bash
cd mobile-app
sh ../build-mobile-apk.sh
```

### Desktop-Anwendung starten

Unter Windows:
```
start-desktop-app.bat
```

Unter Linux/Mac:
```
sh start-desktop-app.sh
```

## Datensicherheit

Die Plattform bietet mehrere Sicherheitsebenen:
- Verschlüsselte Datenspeicherung
- Rollenbasierte Zugangskontrollen
- Lokale Datenspeicherung für sensible Informationen
- Verschlüsselte Übertragung zwischen Komponenten

## Uwazi-Integration

Die Plattform unterstützt die Integration mit dem Uwazi-Dokumentenmanagementsystem:
- Direkter Dokumentenaustausch
- Synchronisierung von Metadaten
- Gemeinsame Analyseergebnisse

## Unterstützte Sprachen

Die Anwendung unterstützt mehrere Sprachen, darunter:
- Deutsch
- Englisch
- Französisch
- Spanisch
- Arabisch

## Systemanforderungen

- **Server**: Node.js 16+, MongoDB 5+
- **Web-Client**: Moderner Browser (Chrome, Firefox, Safari, Edge)
- **Mobile App**: Android 9+ oder iOS 13+
- **Desktop-App**: Windows 10/11, macOS 10.14+, Linux

## Lizenz

Dieses Projekt ist urheberrechtlich geschützt. Alle Rechte vorbehalten.

### Deployment auf Replit

Für das Deployment in der Replit-Umgebung:

```bash
# Deployment-Server starten (speziell optimiert für Replit)
node scripts/fixed-deploy-server.js
```

**Wichtig:** Bei Deployment-Problemen wegen Port-Konflikten (mehrere externe Ports statt nur Port 80), wurde ein spezieller Server erstellt, der nur auf Port 5000 läuft, um das Deployment-Problem zu beheben.
