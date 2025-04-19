// shared/config/ohchr-resources.ts

export interface OhchrResource {
  id: string; // Unique identifier (e.g., slug)
  name: string; // Official name
  title?: string; // Display title (alias for name, wird automatisch generiert)
  url: string; // Direct URL
  description: string; // Description of content/purpose
  keywords: string[]; // Keywords for search/AI context
  type: 'Database' | 'Document Collection' | 'Dashboard' | 'Portal' | 'Registration'; // Type of resource
  
  // Erweiterte Felder für Detailansicht
  content?: string; // Vollständiger Inhalt der Ressource
  publicationDate?: string; // Veröffentlichungsdatum
  referenceNumber?: string; // Referenznummer
  relevance?: string; // Relevanz für Menschenrechtsarbeit
  recommendations?: string[]; // Empfehlungen
  relatedResources?: Partial<OhchrResource>[]; // Verwandte Ressourcen
}

export const ohchrResources: OhchrResource[] = [
  {
    id: 'ads-database',
    name: 'Antidiskriminierungsdatenbank',
    title: 'Antidiskriminierungsdatenbank',
    url: 'http://adsdatabase.ohchr.org/',
    description: 'Informationen, Richtlinien und Maßnahmen auf internationaler, regionaler und nationaler Ebene zur Bekämpfung von Rassismus, Rassendiskriminierung, Fremdenfeindlichkeit und damit verbundener Intoleranz.',
    keywords: ['Antidiskriminierung', 'Rassismus', 'Fremdenfeindlichkeit', 'Intoleranz', 'Politik', 'Maßnahmen', 'Gesetze'],
    type: 'Database',
  },
  {
    id: 'hre-database',
    name: 'Datenbank für Menschenrechtsbildung und -training',
    title: 'Datenbank für Menschenrechtsbildung und -training',
    url: 'http://hre.ohchr.org',
    description: 'Weltweite Suche nach Institutionen, Programmen und Materialien zur Förderung von Menschenrechtsbildung und -training.',
    keywords: ['Menschenrechtsbildung', 'Training', 'Bildung', 'Materialien', 'Programme', 'Institutionen'],
    type: 'Database',
  },
  {
    id: 'jurisprudence-database',
    name: 'Datenbank zur Rechtsprechung (Vertragsorgane)',
    title: 'Datenbank zur Rechtsprechung (Vertragsorgane)',
    url: 'http://juris.ohchr.org',
    description: 'Zugriff auf die Rechtsprechung der UN-Vertragsorgane, die Individualbeschwerden prüfen.',
    keywords: ['Rechtsprechung', 'Vertragsorgane', 'UN', 'Individualbeschwerde', 'Urteile', 'Entscheidungen', 'Jurisprudenz'],
    type: 'Database',
  },
  {
    id: 'ratification-dashboard',
    name: 'Interaktives Dashboard zum Stand der Ratifizierung',
    title: 'Interaktives Dashboard zum Stand der Ratifizierung',
    url: 'http://indicators.ohchr.org',
    description: 'Aktueller Stand der Ratifizierung internationaler Menschenrechtsverträge visualisiert.',
    keywords: ['Ratifizierung', 'Verträge', 'Menschenrechtsverträge', 'Status', 'Dashboard', 'Visualisierung', 'Karte'],
    type: 'Dashboard',
  },
  {
    id: 'udhr-translations',
    name: 'Allgemeine Erklärung der Menschenrechte (AEMR) Übersetzungen',
    title: 'Allgemeine Erklärung der Menschenrechte (AEMR) Übersetzungen',
    url: 'https://www.ohchr.org/en/human-rights/universal-declaration/universal-declaration-human-rights/about-universal-declaration-human-rights-translation-project',
    description: 'Zugriff auf Übersetzungen der AEMR in über 500 Sprachen und Dialekten.',
    keywords: ['AEMR', 'UDHR', 'Allgemeine Erklärung Menschenrechte', 'Übersetzungen', 'Sprachen'],
    type: 'Document Collection',
  },
  {
    id: 'uhri',
    name: 'Universal Human Rights Index (UHRI)',
    title: 'Universal Human Rights Index (UHRI)',
    url: 'http://uhri.ohchr.org',
    description: 'Länderspezifische Menschenrechtsempfehlungen und Informationen aus UN-Mechanismen (Vertragsorgane, Sonderverfahren, UPR).',
    keywords: ['UHRI', 'Empfehlungen', 'UN-Mechanismen', 'Vertragsorgane', 'Sonderverfahren', 'UPR', 'Länderberichte'],
    type: 'Database',
  },
  {
    id: 'charter-bodies-database',
    name: 'Datenbank der UN-Charta-Gremien',
    title: 'Datenbank der UN-Charta-Gremien',
    url: 'https://ap.ohchr.org/Documents/gmainec.aspx',
    description: 'Dokumente und Informationen zu Menschenrechtsgremien auf Grundlage der UN-Charta (Menschenrechtsrat, Kommission).',
    keywords: ['Charta-Gremien', 'UN', 'Menschenrechtsrat', 'HRC', 'Menschenrechtskommission', 'Dokumente'],
    type: 'Database',
  },
  {
    id: 'treaty-bodies-database',
    name: 'Datenbank der UN-Vertragsorgane',
    title: 'Datenbank der UN-Vertragsorgane',
    url: 'http://tbinternet.ohchr.org/',
    description: 'Dokumente und Informationen zu den wichtigsten internationalen Menschenrechtsverträgen und ihren Überwachungsgremien.',
    keywords: ['Vertragsorgane', 'UN', 'Menschenrechtsverträge', 'Ausschüsse', 'Berichte', 'Dokumente'],
    type: 'Database',
  },
  {
    id: 'upr-documentation',
    name: 'Allgemeine Regelmäßige Überprüfung (UPR) Dokumentation',
    title: 'Allgemeine Regelmäßige Überprüfung (UPR) Dokumentation',
    url: 'https://www.ohchr.org/en/hr-bodies/upr/documentation',
    description: 'Zugriff auf Informationen und Dokumente über Staaten im UPR-Prozess (eingereicht von Staaten, UN, NGOs).',
    keywords: ['UPR', 'Allgemeine Regelmäßige Überprüfung', 'Länderberichte', 'Staatenberichte', 'NGO-Berichte', 'Stakeholder'],
    type: 'Portal',
  },
  {
    id: 'sp-database',
    name: 'Datenbank für Sonderverfahren (Mandate & Besuche)',
    title: 'Datenbank für Sonderverfahren (Mandate & Besuche)',
    url: 'http://spinternet.ohchr.org',
    description: 'Dokumente und Informationen zu den Mandaten und Länderbesuchen der Sonderverfahren des Menschenrechtsrats.',
    keywords: ['Sonderverfahren', 'Special Procedures', 'Mandatsträger', 'Berichterstatter', 'Länderbesuche', 'Berichte'],
    type: 'Database',
  },
  {
    id: 'sp-communications',
    name: 'Sonderverfahren Kommunikationsberichte',
    title: 'Sonderverfahren Kommunikationsberichte',
    url: 'https://spcommreports.ohchr.org',
    description: 'Suche nach Mitteilungen im Rahmen von Sonderverfahren und Antworten von Staaten/Akteuren seit 2011.',
    keywords: ['Sonderverfahren', 'Special Procedures', 'Kommunikation', 'Mitteilungen', 'Allegation Letters', 'Urgent Appeals', 'Antworten'],
    type: 'Database',
  },
  {
    id: 'ngo-registration',
    name: 'NGO Registrierung (Mündliche/Schriftliche Stellungnahmen HRC)',
    title: 'NGO Registrierung (Mündliche/Schriftliche Stellungnahmen HRC)',
    url: 'https://ngoreg.ohchr.org',
    description: 'Portal für NGOs zur Einreichung von Registrierungen für mündliche/schriftliche Stellungnahmen bei Sitzungen des Menschenrechtsrats.',
    keywords: ['NGO', 'Registrierung', 'Menschenrechtsrat', 'HRC', 'Stellungnahme', 'Einreichung', 'Akkreditierung'],
    type: 'Registration',
  },
];

// Funktion zum Abrufen einer Ressource nach ID
export function getOhchrResourceById(id: string): OhchrResource | undefined {
  return ohchrResources.find(resource => resource.id === id);
}

// Funktion zum Suchen von Ressourcen
export function searchOhchrResources(query: string): OhchrResource[] {
  const lowerQuery = query.toLowerCase();
  return ohchrResources.filter(resource =>
    resource.name.toLowerCase().includes(lowerQuery) ||
    resource.description.toLowerCase().includes(lowerQuery) ||
    resource.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
}

// Funktion zum Finden von Ressourcen basierend auf Schlüsselwörtern
export function getOhchrResourcesByKeywords(keywords: string[], maxResults: number = 5): OhchrResource[] {
  // Scores für jede Ressource berechnen (Anzahl übereinstimmender Schlüsselwörter)
  const scoredResources = ohchrResources.map(resource => {
    let score = 0;
    const lowerKeywords = resource.keywords.map(k => k.toLowerCase());
    
    // Für jedes Suchschlüsselwort prüfen, ob es in den Ressourcenschlüsselwörtern vorkommt
    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerKeywords.some(k => k.includes(lowerKeyword) || lowerKeyword.includes(k))) {
        score += 1;
      }
      // Zusätzliche Punkte für Übereinstimmungen im Titel oder der Beschreibung
      if (resource.name.toLowerCase().includes(lowerKeyword)) {
        score += 0.5;
      }
      if (resource.description.toLowerCase().includes(lowerKeyword)) {
        score += 0.3;
      }
    });
    
    return { resource, score };
  });
  
  // Nach Score sortieren und nur Ressourcen mit einer Übereinstimmung zurückgeben
  return scoredResources
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.resource);
}