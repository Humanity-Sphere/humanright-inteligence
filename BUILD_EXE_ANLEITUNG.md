
# Anleitung zum Erstellen der Windows EXE-Anwendung

Diese Anleitung beschreibt, wie Sie eine ausführbare Windows-Datei (EXE) für die Human Rights Intelligence App erstellen können.

## Voraussetzungen

- Node.js (Version 16 oder höher)
- NPM (normalerweise mit Node.js installiert)
- Git 

## Schritte zum Erstellen der EXE-Datei

### 1. Projekt einrichten

Stellen Sie sicher, dass alle Abhängigkeiten installiert sind:

```bash
# Einrichtung aller Plattform-Abhängigkeiten
sh setup-all-platforms.sh
```

### 2. Konfiguration

Die Konfiguration für den Build-Prozess befindet sich in der `electron-builder.yml` Datei. Hier können Sie bei Bedarf Anpassungen vornehmen:

- Produktname
- App-ID
- Icons
- Installer-Einstellungen

### 3. EXE-Datei erstellen

Verwenden Sie den folgenden Befehl, um die Windows-Anwendung zu erstellen:

```bash
sh build-windows-exe.sh
```

Dieser Prozess kann einige Minuten dauern. Der Build-Prozess umfasst:
1. Kompilierung der React-Anwendung
2. Paketierung mit Electron
3. Erstellung des Installers

### 4. Build-Ergebnisse

Nach erfolgreicher Ausführung finden Sie die erstellten Dateien im Verzeichnis `dist/`:

- `Human Rights Intelligence Setup.exe` - Installer für Windows
- `Human Rights Intelligence.exe` - Ausführbare Datei (innerhalb des unpacked-Ordners)

### 5. Installation und Start

Die erstellte EXE-Datei kann wie folgt verwendet werden:

1. Führen Sie `Human Rights Intelligence Setup.exe` aus, um die Anwendung zu installieren.
2. Der Installer erstellt einen Desktop-Shortcut.
3. Nach der Installation können Sie die Anwendung über den Shortcut oder das Startmenü starten.

### 6. Neue Funktionen der Desktop-Anwendung

Die aktualisierte Version der Desktop-Anwendung enthält folgende neue Funktionen:

- **KI-Agenten Hub**: Zentraler Bereich für alle KI-basierten Funktionen
- **System Selfcare**: Leistungs- und Funktionsoptimierung der Anwendung
- **ContentStudio mit Whiteboard**: Erweiterte Funktionen für Dokumentenanalyse und -bearbeitung
- **Agent Flow Builder**: Visueller Editor zum Erstellen von KI-Agenten-Workflows
- **Kanban-Board**: Verbesserte Task-Management-Funktionen
- **Voice Assistant**: Intuitive Sprachsteuerung für alle Anwendungsbereiche
- **Offline-Modus**: Erweiterte Funktionalität für die Verwendung ohne Internetverbindung
- **Integration mit Gemini und anderen KI-Modellen**: Verbesserte Dokumentenanalyse und Textgenerierung
- **Vollständige lokale Datenspeicherung**: Datenschutzkonforme Verarbeitung sensibler Informationen
- **Self-Repair-Funktion**: Automatische Problembehebung für Systemkomponenten

### Fehlerbehebung

Wenn beim Erstellen oder Starten der Anwendung Probleme auftreten:

1. Stellen Sie sicher, dass alle Abhängigkeiten korrekt installiert sind.
2. Prüfen Sie, ob die erforderlichen Umgebungsvariablen in der `.env`-Datei gesetzt sind.
3. Überprüfen Sie die Build-Logs im Terminal auf spezifische Fehlermeldungen.
4. Verwenden Sie `node --max-old-space-size=8192` für größere Projekte, wenn Speicherprobleme auftreten.
5. Bei Problemen mit KI-Funktionen stellen Sie sicher, dass die entsprechenden API-Schlüssel (z.B. GEMINI_API_KEY) korrekt konfiguriert sind.
6. Wenn die Self-Repair-Funktion nicht arbeitet, starten Sie die Anwendung neu und prüfen Sie die Logs im "System Selfcare"-Bereich.

### Lokaler Test

Um die Electron-Anwendung vor dem Erstellen der EXE-Datei lokal zu testen:

```bash
npm run electron-dev
```

Oder verwenden Sie die Batchdatei für Windows:

```
start-desktop-app.bat
```

Diese Schritte ermöglichen es Ihnen, eine eigenständige Windows-Anwendung zu erstellen, die unabhängig von einer Internetverbindung betrieben werden kann und vollständig mit den neuesten KI-Funktionen ausgestattet ist.
