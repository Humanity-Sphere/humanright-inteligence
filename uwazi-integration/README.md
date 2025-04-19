# Uwazi Integration für Human Rights Intelligence

Diese Dokumentation beschreibt die Implementierung der Uwazi-Integration in unsere Human Rights Intelligence Anwendung.

## Überblick

Uwazi ist eine flexible Datenbankplattform, die von HURIDOCS speziell für Menschenrechtsorganisationen entwickelt wurde. Unsere Integration ermöglicht den nahtlosen Datenaustausch zwischen der Human Rights Intelligence App und Uwazi-basierten Dokumentensammlungen.

## Hauptkomponenten der Integration

### 1. Datenmodell

Die Integration synchronisiert folgende Datentypen:
- Dokumente und Metadaten
- Entitäten (Personen, Organisationen, Ereignisse) 
- Thesauri (kontrollierte Vokabulare)
- Beziehungen zwischen Entitäten
- Berechtigungen und Zugriffsrechte

### 2. API-Integration

Die Integration erfolgt über die RESTful APIs von Uwazi:
- Dokument-Endpunkte (`/api/documents`)
- Entitäten-Endpunkte (`/api/entities`)
- Such-Endpunkte (`/api/search`)
- Thesauri-Endpunkte (`/api/thesauri`)

### 3. Authentifizierung

Die Anwendung verwendet JWT-basierte Authentifizierung für die sichere Kommunikation mit Uwazi-Instanzen.

### 4. Daten-Synchronisation

Die Anwendung unterstützt:
- Bidirektionale Synchronisation zwischen Uwazi und der App
- Offline-Fähigkeiten mit Konfliktlösung
- Inkrementelle Updates

### 5. KI-Integration

Die Human Rights Intelligence App erweitert Uwazi um:
- Dokumentenanalyse mit Gemini und OpenAI
- Automatische Erkennung von Mustern in Menschenrechtsverletzungen
- Intelligente Inhaltsgenerierung für Berichte
- Multi-Agent-Koordination für komplexe Arbeitsabläufe

## Implementierungsdetails

### Mobile App Integration

Die Mobile App kommuniziert mit Uwazi über:
1. REST API-Aufrufe für Online-Operationen
2. SQLite-Datenbank für Offline-Speicherung
3. Synchronisationslogik für bidirektionale Updates

### Datenmodell-Mapping

Unsere Anwendung bildet das MongoDB-Schema von Uwazi auf relationale Strukturen ab:
- Dokumente → documents-Tabelle
- Entitäten → entities-Tabelle
- Beziehungen → relationships-Tabelle

### Multi-Tenancy-Unterstützung

Die Integration unterstützt Multi-Tenancy:
- Verbindung zu mehreren Uwazi-Instanzen
- Isolierung von Daten zwischen verschiedenen Mandanten
- Konfigurierbare API-Endpunkte pro Mandant

## API-Nutzungsbeispiele

Beispiel für die Abfrage von Dokumenten:
```typescript
const fetchUwaziDocuments = async (query) => {
  const response = await uwaziAPI.get('/api/documents', {
    params: {
      searchTerm: query,
      fields: ['title', 'creationDate', 'sharedId']
    }
  });
  return response.data.rows;
};
```

Beispiel für die Erstellung einer Entität:
```typescript
const createUwaziEntity = async (entity) => {
  const response = await uwaziAPI.post('/api/entities', {
    entity: {
      title: entity.title,
      template: entity.templateId,
      metadata: entity.metadata
    }
  });
  return response.data;
};
```

## Technische Anforderungen

Die Integration benötigt:
- MongoDB-Verbindung (für volle Funktionalität)
- ElasticSearch-Verbindung (für Suche)
- Uwazi API-Zugriff mit entsprechenden Berechtigungen

## Konfigurationsoptionen

Die Integration kann konfiguriert werden über:
- Umgebungsvariablen
- Konfigurationsdateien
- API-Schlüssel und Secrets

## Bekannte Einschränkungen

- Die Offline-Synchronisation unterstützt nur Basisfunktionen
- Vollständige Funktionalität erfordert eine aktive Internetverbindung
- Komplexe Beziehungsnetzwerke werden nur teilweise unterstützt