# Anleitung zur Bereitstellung (Deployment) der Human Rights Intelligence Platform

## Problemlösung für das Replit-Deployment

Aktuell gibt es ein bekanntes Problem mit der Bereitstellung der Anwendung auf Replit. Die Plattform erwartet, dass die Anwendung nur über einen einzigen externen Port (Port 80) verfügbar ist, der intern auf Port 5000 zugreift.

## Lösung für die Bereitstellung

Um dieses Problem zu lösen, haben wir einen speziellen Deployment-Server erstellt, der ausschließlich auf Port 5000 läuft und für die Bereitstellung konfiguriert ist.

### Schritt 1: Beenden Sie alle laufenden Server

Stellen Sie sicher, dass keine anderen Server auf Port 5000 laufen.

### Schritt 2: Starten Sie den speziellen Deployment-Server

Führen Sie den folgenden Befehl aus, um den für die Bereitstellung optimierten Server zu starten:

```bash
node scripts/fixed-deploy-server.js
```

### Schritt 3: Bereitstellung starten

Nachdem der Server gestartet wurde, können Sie die Bereitstellungsfunktion von Replit verwenden, um Ihre Anwendung zu veröffentlichen.

## Hinweise zur .replit-Datei

Die aktuelle `.replit`-Datei enthält mehrere Port-Weiterleitungen, was zu Konflikten bei der Bereitstellung führt. Die korrekte Konfiguration sollte nur eine einzige Port-Weiterleitung enthalten:

```toml
[[ports]]
localPort = 5000
externalPort = 80
```

Da das direkte Bearbeiten der `.replit`-Datei in dieser Umgebung nicht zulässig ist, verwenden wir den speziellen Deployment-Server als Übergangslösung.

## Weitere Informationen

- **Hauptentwicklungsserver**: Verwenden Sie `npm run dev`, um den vollständigen Entwicklungsserver mit allen Funktionen zu starten.
- **Deployment-Server**: Verwenden Sie `node scripts/fixed-deploy-server.js`, um den vereinfachten Server für die Bereitstellung zu starten.

## Kontakt zum Replit-Support

Falls die Bereitstellung weiterhin fehlschlägt, bitten Sie den Replit-Support, Ihre `.replit`-Datei zu aktualisieren, um nur Port 5000 (intern) auf Port 80 (extern) weiterzuleiten.