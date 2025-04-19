/**
 * Menschenrechtsstandards-Service
 * 
 * Dieser Service verwaltet Menschenrechtsstandards, HURIDOCS-Formate und unterstützt
 * KI-Agenten bei der Erkennung und Erzeugung standardkonformer Dokumente.
 */

import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import csv from 'csv-parser';

// Typen von Menschenrechtsdokumenten
export type DocumentType =
  | 'ereignis'
  | 'akt'
  | 'beteiligung'
  | 'sicherheitsumfrage'
  | 'umsiedlungsantrag'
  | 'notfallzuschuss'
  | 'finanzierungsplan'
  | 'verteidigerressource';

// Interface für Standards
export interface HumanRightsStandard {
  id: string;
  name: string;
  description: string;
  source: string;
  format?: string;
  fields?: Array<{
    name: string;
    description: string;
    required: boolean;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  }>;
  examples?: string[];
  patterns?: RegExp[];
}

// Interface für Dokumentvorlagen
export interface DocumentTemplate {
  type: DocumentType;
  structure: any;
  requiredFields: string[];
  optionalFields: string[];
  validationRules?: Record<string, (value: any) => boolean>;
  example?: string;
  description?: string;
}

// Singleton-Klasse für Menschenrechtsstandards
class HumanRightsStandardsService {
  private standards: HumanRightsStandard[] = [];
  private documentTemplates: Record<DocumentType, DocumentTemplate> = {} as Record<DocumentType, DocumentTemplate>;
  private initialized: boolean = false;

  constructor() {
    // Vorlagen für HURIDOCS-Dokumente initialisieren
    this.initializeDocumentTemplates();
  }

  // Initialisiert Dokumentvorlagen für alle unterstützten Dokumenttypen
  private initializeDocumentTemplates() {
    // Ereignis-Vorlage (Event)
    this.documentTemplates.ereignis = {
      type: 'ereignis',
      structure: {
        title: '',
        date: '',
        location: '',
        description: '',
        victims: [],
        witnesses: [],
        sources: [],
        humanRightsViolations: [],
        perpetrators: [],
        relatedEvents: []
      },
      requiredFields: ['title', 'date', 'location', 'description'],
      optionalFields: ['victims', 'witnesses', 'sources', 'humanRightsViolations', 'perpetrators', 'relatedEvents'],
      description: 'HURIDOCS Ereignisformat für die Dokumentation von Menschenrechtsverletzungen'
    };

    // Akt-Vorlage (Act)
    this.documentTemplates.akt = {
      type: 'akt',
      structure: {
        title: '',
        actType: '',
        date: '',
        location: '',
        description: '',
        legalProvisions: [],
        involvedAuthorities: [],
        consequences: '',
        sources: []
      },
      requiredFields: ['title', 'actType', 'date', 'location', 'description'],
      optionalFields: ['legalProvisions', 'involvedAuthorities', 'consequences', 'sources'],
      description: 'HURIDOCS Akt-Format für die Dokumentation von rechtlichen und behördlichen Handlungen'
    };

    // Beteiligung-Vorlage (Involvement)
    this.documentTemplates.beteiligung = {
      type: 'beteiligung',
      structure: {
        title: '',
        person: {
          name: '',
          role: '',
          organization: '',
          contact: ''
        },
        involvementType: '',
        startDate: '',
        endDate: '',
        description: '',
        relatedEvents: [],
        status: ''
      },
      requiredFields: ['title', 'person', 'involvementType', 'description'],
      optionalFields: ['startDate', 'endDate', 'relatedEvents', 'status'],
      description: 'HURIDOCS Beteiligungsformat für die Dokumentation von Personen und deren Rolle bei Menschenrechtsverletzungen'
    };

    // Sicherheitsumfrage-Vorlage
    this.documentTemplates.sicherheitsumfrage = {
      type: 'sicherheitsumfrage',
      structure: {
        title: '',
        date: '',
        respondent: {
          name: '',
          organization: '',
          role: '',
          contact: ''
        },
        threatAssessment: {
          personalThreats: [],
          digitalThreats: [],
          physicalThreats: [],
          legalThreats: []
        },
        securityMeasures: {
          current: [],
          needed: []
        },
        priorityAreas: [],
        additionalNotes: ''
      },
      requiredFields: ['title', 'date', 'respondent', 'threatAssessment'],
      optionalFields: ['securityMeasures', 'priorityAreas', 'additionalNotes'],
      description: 'Sicherheitsumfrage für Menschenrechtsverteidiger zur Erfassung von Bedrohungen und Sicherheitsmaßnahmen'
    };

    // Umsiedlungsantrag-Vorlage
    this.documentTemplates.umsiedlungsantrag = {
      type: 'umsiedlungsantrag',
      structure: {
        title: '',
        date: '',
        applicant: {
          name: '',
          birthdate: '',
          nationality: '',
          profession: '',
          contact: '',
          familyMembers: []
        },
        currentLocation: '',
        threatAssessment: {
          natureOfThreats: [],
          perpetrators: [],
          evidenceOfThreats: []
        },
        securityMeasuresTaken: [],
        requestedDestination: '',
        supportingOrganizations: [],
        additionalInformation: ''
      },
      requiredFields: ['title', 'date', 'applicant', 'currentLocation', 'threatAssessment'],
      optionalFields: ['securityMeasuresTaken', 'requestedDestination', 'supportingOrganizations', 'additionalInformation'],
      description: 'Umsiedlungsantrag für gefährdete Menschenrechtsverteidiger'
    };

    // Notfallzuschuss-Vorlage
    this.documentTemplates.notfallzuschuss = {
      type: 'notfallzuschuss',
      structure: {
        title: '',
        date: '',
        applicant: {
          name: '',
          organization: '',
          role: '',
          contact: ''
        },
        emergencyType: '',
        description: '',
        requestedAmount: 0,
        purpose: '',
        timeline: '',
        bankDetails: {},
        supportingDocuments: []
      },
      requiredFields: ['title', 'date', 'applicant', 'emergencyType', 'description', 'requestedAmount', 'purpose'],
      optionalFields: ['timeline', 'bankDetails', 'supportingDocuments'],
      description: 'Antrag auf Notfallzuschuss für Menschenrechtsverteidiger in Krisensituationen'
    };

    // Finanzierungsplan-Vorlage
    this.documentTemplates.finanzierungsplan = {
      type: 'finanzierungsplan',
      structure: {
        title: '',
        organization: '',
        projectTitle: '',
        projectPeriod: {
          start: '',
          end: ''
        },
        budget: {
          personnel: [],
          materials: [],
          travel: [],
          services: [],
          other: []
        },
        totalAmount: 0,
        fundingSources: [],
        notes: ''
      },
      requiredFields: ['title', 'organization', 'projectTitle', 'projectPeriod', 'budget', 'totalAmount'],
      optionalFields: ['fundingSources', 'notes'],
      description: 'Finanzierungsplan für Menschenrechtsprojekte und -organisationen'
    };

    // Verteidigerressource-Vorlage
    this.documentTemplates.verteidigerressource = {
      type: 'verteidigerressource',
      structure: {
        title: '',
        resourceType: '',
        date: '',
        author: '',
        description: '',
        content: '',
        relevantRights: [],
        applicableContexts: [],
        keywords: [],
        relatedResources: []
      },
      requiredFields: ['title', 'resourceType', 'description', 'content'],
      optionalFields: ['date', 'author', 'relevantRights', 'applicableContexts', 'keywords', 'relatedResources'],
      description: 'Ressource für Menschenrechtsverteidiger (Leitfaden, Handbuch, Schulungsmaterial)'
    };
  }

  // Lädt Standards aus CSV-, Excel- und anderen Dateien
  async loadStandards() {
    if (this.initialized) return;

    try {
      // Pfad zum Verzeichnis mit Standard-Dateien
      const assetsDir = path.join(process.cwd(), 'attached_assets');
      
      // Prüfe, ob Verzeichnis existiert
      if (!fs.existsSync(assetsDir)) {
        console.warn('Assets-Verzeichnis existiert nicht:', assetsDir);
        return;
      }
      
      // Lade Excel-Dateien
      const excelFiles = fs.readdirSync(assetsDir).filter(file => 
        file.endsWith('.xlsx') || file.endsWith('.xls')
      );
      
      for (const file of excelFiles) {
        try {
          const filePath = path.join(assetsDir, file);
          const workbook = xlsx.readFile(filePath);
          const sheetNames = workbook.SheetNames;
          
          // Verarbeite jedes Blatt als separate Standard-Datei
          for (const sheetName of sheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);
            
            // Extrahiere Standards aus den Daten
            this.extractStandardsFromData(data, file, sheetName);
          }
        } catch (err) {
          console.error(`Fehler beim Laden der Excel-Datei ${file}:`, err);
        }
      }
      
      // Lade CSV-Dateien
      const csvFiles = fs.readdirSync(assetsDir).filter(file => 
        file.endsWith('.csv')
      );
      
      for (const file of csvFiles) {
        try {
          const filePath = path.join(assetsDir, file);
          const results: any[] = [];
          
          // CSV parsen und Standards extrahieren
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
              this.extractStandardsFromData(results, file);
            });
        } catch (err) {
          console.error(`Fehler beim Laden der CSV-Datei ${file}:`, err);
        }
      }
      
      // Textdateien für spezielle Formate
      const textFiles = fs.readdirSync(assetsDir).filter(file => 
        file.endsWith('.md') || file.endsWith('.txt')
      );
      
      for (const file of textFiles) {
        try {
          const filePath = path.join(assetsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Verarbeite Markdown/Text-Datei
          this.extractStandardsFromText(content, file);
        } catch (err) {
          console.error(`Fehler beim Laden der Textdatei ${file}:`, err);
        }
      }
      
      this.initialized = true;
      console.log(`Geladen: ${this.standards.length} Menschenrechtsstandards aus ${excelFiles.length + csvFiles.length + textFiles.length} Dateien`);
    } catch (err) {
      console.error('Fehler beim Laden der Menschenrechtsstandards:', err);
    }
  }

  // Extrahiert Standards aus Excel/CSV-Daten
  private extractStandardsFromData(data: any[], filename: string, sheetName?: string) {
    // Einfache Heuristik zur Erkennung von Standard-Daten
    // In echten Anwendungen würde hier ein robusterer Parser stehen
    
    for (const item of data) {
      // Überprüfe, ob wichtige Felder vorhanden sind
      if (item.id || item.name || item.standard || item.description || item.reference) {
        const standard: HumanRightsStandard = {
          id: item.id || `standard-${this.standards.length + 1}`,
          name: item.name || item.standard || item.title || filename,
          description: item.description || item.details || '',
          source: filename + (sheetName ? ` (Blatt: ${sheetName})` : ''),
          fields: []
        };
        
        // Füge Felder hinzu, wenn vorhanden
        if (item.fields && typeof item.fields === 'string') {
          const fields = item.fields.split(',').map((field: string) => ({
            name: field.trim(),
            description: '',
            required: false,
            type: 'string'
          }));
          standard.fields = fields;
        }
        
        // Füge Beispiele hinzu, wenn vorhanden
        if (item.example || item.examples) {
          standard.examples = (item.example || item.examples)
            .split('\n')
            .map((ex: string) => ex.trim())
            .filter((ex: string) => ex.length > 0);
        }
        
        this.standards.push(standard);
      }
    }
  }

  // Extrahiert Standards aus Textdateien
  private extractStandardsFromText(content: string, filename: string) {
    // Spezielle Muster für HURIDOCS-Formate
    const ereignisPattern = /Dokumentation\s+(?:einer|von|des)\s+(.+?)(?:\s+vom\s+(\d{1,2}\.\d{1,2}\.\d{4}))?/i;
    const aktPattern = /Dokumentation\s+(?:von)?\s+behördliche(?:n)?\s+Handlungen/i;
    const beteiligungPattern = /Beteiligungsformat|Personen\s+und\s+deren\s+Rolle/i;
    
    // Überprüfe auf HURIDOCS Ereignis-Format
    if (ereignisPattern.test(content)) {
      const standard: HumanRightsStandard = {
        id: `huridocs-ereignis-${this.standards.length + 1}`,
        name: 'HURIDOCS Ereignis-Format',
        description: 'Format zur Dokumentation von Menschenrechtsereignissen nach HURIDOCS-Standard',
        source: filename,
        format: 'ereignis',
        patterns: [ereignisPattern]
      };
      this.standards.push(standard);
    }
    
    // Überprüfe auf HURIDOCS Akt-Format
    if (aktPattern.test(content)) {
      const standard: HumanRightsStandard = {
        id: `huridocs-akt-${this.standards.length + 1}`,
        name: 'HURIDOCS Akt-Format',
        description: 'Format zur Dokumentation behördlicher Handlungen nach HURIDOCS-Standard',
        source: filename,
        format: 'akt',
        patterns: [aktPattern]
      };
      this.standards.push(standard);
    }
    
    // Überprüfe auf HURIDOCS Beteiligungs-Format
    if (beteiligungPattern.test(content)) {
      const standard: HumanRightsStandard = {
        id: `huridocs-beteiligung-${this.standards.length + 1}`,
        name: 'HURIDOCS Beteiligungs-Format',
        description: 'Format zur Dokumentation von Personen und deren Rolle bei Menschenrechtsverletzungen',
        source: filename,
        format: 'beteiligung',
        patterns: [beteiligungPattern]
      };
      this.standards.push(standard);
    }
    
    // Überprüfe auf Sicherheitsumfrage
    if (content.includes('SICHERHEITSUMFRAGE') || filename.includes('SICHERHEITSUMFRAGE')) {
      const standard: HumanRightsStandard = {
        id: `sicherheitsumfrage-${this.standards.length + 1}`,
        name: 'Sicherheitsumfrage für Menschenrechtsverteidiger',
        description: 'Format zur Erfassung von Sicherheitsrisiken und Bedrohungen für Menschenrechtsverteidiger',
        source: filename,
        format: 'sicherheitsumfrage'
      };
      this.standards.push(standard);
    }
    
    // Überprüfe auf Umsiedlungsantrag
    if (content.includes('Resettlement') || content.includes('Umsiedlung') || 
        filename.includes('Resettlement') || filename.includes('Eligibility')) {
      const standard: HumanRightsStandard = {
        id: `umsiedlungsantrag-${this.standards.length + 1}`,
        name: 'Umsiedlungsantrag für gefährdete Menschenrechtsverteidiger',
        description: 'Format für Anträge auf Umsiedlung/Resettlement für bedrohte Menschenrechtsverteidiger',
        source: filename,
        format: 'umsiedlungsantrag'
      };
      this.standards.push(standard);
    }
    
    // Überprüfe auf Notfallzuschuss
    if (content.includes('Emergency Grant') || content.includes('Notfallzuschuss') || 
        filename.includes('Emergency-Grants') || filename.includes('ProtectDefenders')) {
      const standard: HumanRightsStandard = {
        id: `notfallzuschuss-${this.standards.length + 1}`,
        name: 'Notfallzuschuss für Menschenrechtsverteidiger',
        description: 'Format für Anträge auf Notfallzuschüsse für Menschenrechtsverteidiger in akuten Gefahrensituationen',
        source: filename,
        format: 'notfallzuschuss'
      };
      this.standards.push(standard);
    }
    
    // Überprüfe auf Finanzierungsplan
    if (content.includes('Finanzierungsplan') || content.includes('Budget') || 
        filename.includes('finanzierungsplan') || filename.includes('verwendungsnachweis')) {
      const standard: HumanRightsStandard = {
        id: `finanzierungsplan-${this.standards.length + 1}`,
        name: 'Finanzierungsplan für Menschenrechtsprojekte',
        description: 'Format für Finanzplanung, Budgetierung und Verwendungsnachweise von Menschenrechtsprojekten',
        source: filename,
        format: 'finanzierungsplan'
      };
      this.standards.push(standard);
    }
  }

  // Gibt alle geladenen Standards zurück
  getAllStandards(): HumanRightsStandard[] {
    return this.standards;
  }

  // Gibt alle Dokumentvorlagen zurück
  getAllDocumentTemplates(): DocumentTemplate[] {
    return Object.values(this.documentTemplates);
  }

  // Gibt eine spezifische Dokumentvorlage zurück
  getDocumentTemplate(type: DocumentType): DocumentTemplate | null {
    return this.documentTemplates[type] || null;
  }

  // Erkennt den Dokumenttyp basierend auf dem Inhalt
  detectDocumentType(content: string): DocumentType | null {
    // Überprüfe Standards mit Mustern
    for (const standard of this.standards) {
      if (standard.format && standard.patterns) {
        for (const pattern of standard.patterns) {
          if (pattern.test(content)) {
            return standard.format as DocumentType;
          }
        }
      }
    }
    
    // Textbasierte Heuristik, wenn keine Muster übereinstimmen
    
    // HURIDOCS Ereignis
    if (
      content.includes('Dokumentation einer') || 
      content.includes('Ereignis vom') ||
      content.includes('Vorfall am') ||
      content.includes('Datum des Ereignisses')
    ) {
      return 'ereignis';
    }
    
    // HURIDOCS Akt
    if (
      content.includes('behördliche Handlung') || 
      content.includes('Verwaltungsakt') ||
      content.includes('Rechtsakt') ||
      content.includes('Gesetzgebung')
    ) {
      return 'akt';
    }
    
    // HURIDOCS Beteiligung
    if (
      content.includes('Rolle') && (content.includes('Person') || content.includes('Beteiligte')) ||
      content.includes('Beteiligungsform') ||
      content.includes('Involvierte Personen')
    ) {
      return 'beteiligung';
    }
    
    // Sicherheitsumfrage
    if (
      content.includes('Sicherheitsrisiko') || 
      content.includes('Bedrohungsanalyse') ||
      content.includes('Sicherheitsumfrage') ||
      content.includes('Risikobewertung')
    ) {
      return 'sicherheitsumfrage';
    }
    
    // Umsiedlungsantrag
    if (
      content.includes('Umsiedlung') || 
      content.includes('Resettlement') ||
      content.includes('Relocation') ||
      content.includes('Asylantrag')
    ) {
      return 'umsiedlungsantrag';
    }
    
    // Notfallzuschuss
    if (
      content.includes('Notfallzuschuss') || 
      content.includes('Emergency Grant') ||
      content.includes('Soforthilfe') ||
      content.includes('Notfallfinanzierung')
    ) {
      return 'notfallzuschuss';
    }
    
    // Finanzierungsplan
    if (
      content.includes('Finanzierungsplan') || 
      content.includes('Budget') ||
      content.includes('Finanzplan') ||
      content.includes('Kostenaufstellung')
    ) {
      return 'finanzierungsplan';
    }
    
    // Verteidigerressource
    if (
      content.includes('Ressource') || 
      content.includes('Leitfaden') ||
      content.includes('Handbuch') ||
      content.includes('Schulungsmaterial')
    ) {
      return 'verteidigerressource';
    }
    
    // Standard-Dokumenttyp, wenn keine Übereinstimmung gefunden wurde
    return null;
  }

  // Generiert einen spezifischen Prompt für die Dokumenterstellung
  generateCreationPrompt(documentType: DocumentType, additionalInfo: any = {}): string {
    const template = this.documentTemplates[documentType];
    
    if (!template) {
      throw new Error(`Keine Vorlage für Dokumenttyp '${documentType}' gefunden`);
    }
    
    // Basis-Prompt mit Formatanweisungen
    let prompt = `## Erstelle ein ${template.description} im Format "${documentType}"\n\n`;
    
    // Hinzufügen von Strukturinformationen
    prompt += `### Struktur\n`;
    prompt += `Das Dokument sollte die folgende Struktur haben:\n`;
    
    for (const field of template.requiredFields) {
      prompt += `- ${field} (ERFORDERLICH)\n`;
    }
    
    for (const field of template.optionalFields) {
      prompt += `- ${field} (OPTIONAL)\n`;
    }
    
    // Hinzufügen von bereitgestellten Informationen
    if (Object.keys(additionalInfo).length > 0) {
      prompt += `\n### Bereitgestellte Informationen\n`;
      
      for (const [key, value] of Object.entries(additionalInfo)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            prompt += `- ${key}: ${value.join(', ')}\n`;
          } else if (typeof value === 'object') {
            prompt += `- ${key}:\n`;
            for (const [subKey, subValue] of Object.entries(value)) {
              prompt += `  - ${subKey}: ${subValue}\n`;
            }
          } else {
            prompt += `- ${key}: ${value}\n`;
          }
        }
      }
    }
    
    // Formatierungsanweisungen
    prompt += `\n### Formatierung\n`;
    prompt += `- Formatiere den Text als Markdown\n`;
    prompt += `- Verwende Überschriften, Listen und Tabellen, wo angemessen\n`;
    prompt += `- Halte die HURIDOCS-Standards für Menschenrechtsdokumentation ein\n`;
    prompt += `- Achte auf Präzision und Objektivität in der Darstellung\n`;
    
    // Anweisungen für die Ergebnisausgabe
    prompt += `\n### Ausgabe\n`;
    prompt += `Erstelle ein vollständiges, formal korrektes Dokument basierend auf den bereitgestellten Informationen.\n`;
    prompt += `Wenn Informationen fehlen, verwende plausible, aber neutrale Platzhalter und kennzeichne diese deutlich.\n`;
    
    return prompt;
  }

  // Generiert einen Prompt für die Analyse eines Dokuments
  generateAnalysisPrompt(documentType: DocumentType, content: string): string {
    // Basis-Prompt für die Dokumentanalyse
    let prompt = `## Analysiere das folgende Dokument vom Typ "${documentType}"\n\n`;
    
    // Hinzufügen des Dokumentinhalts
    prompt += `### Dokumentinhalt\n\n${content}\n\n`;
    
    // Analyseanweisungen
    prompt += `### Analyseanweisungen\n\n`;
    prompt += `Bitte analysiere das Dokument und extrahiere die folgenden Aspekte:\n\n`;
    prompt += `1. **Beteiligte Parteien**: Identifiziere alle im Dokument genannten Personen, Organisationen und Institutionen.\n`;
    prompt += `2. **Rechtliche Grundlagen**: Identifiziere alle erwähnten Gesetze, Vorschriften, Verträge oder Rechtsnormen.\n`;
    prompt += `3. **Zentrale Fakten**: Liste die wichtigsten Fakten aus dem Dokument auf.\n`;
    prompt += `4. **Menschenrechtliche Implikationen**: Bestimme, welche Menschenrechte betroffen sind und wie.\n`;
    prompt += `5. **Verbindungen**: Identifiziere Verbindungen zu anderen Ereignissen, Dokumenten oder Fällen.\n`;
    prompt += `6. **Zeitliche Abfolge**: Erstelle eine chronologische Darstellung der Ereignisse.\n`;
    prompt += `7. **Schlüsselwörter**: Extrahiere relevante Schlüsselwörter für die Indexierung.\n`;
    
    // Formatierungs- und Ausgabeanweisungen
    prompt += `\n### Formatierung\n`;
    prompt += `Stelle deine Analyse in einem klar strukturierten, markdownbasierten Format dar.\n`;
    prompt += `Verwende die obigen Überschriften und nummeriere die Punkte unter jeder Kategorie.\n`;
    
    return prompt;
  }

  // Liefert Systemanweisungen für KI basierend auf den geladenen Standards
  getSystemInstructions(documentType?: DocumentType): string {
    let instructions = `Du bist ein Experte für Menschenrechtsdokumentation und folgst den internationalen Standards für solche Dokumentationen.`;
    
    if (documentType && this.documentTemplates[documentType]) {
      const template = this.documentTemplates[documentType];
      
      instructions += `\n\nDu arbeitest mit Dokumenten vom Typ "${documentType}" (${template.description}).`;
      instructions += `\n\nDiese Dokumente haben die folgende Struktur:`;
      
      for (const field of template.requiredFields) {
        instructions += `\n- ${field} (ERFORDERLICH)`;
      }
      
      for (const field of template.optionalFields) {
        instructions += `\n- ${field} (OPTIONAL)`;
      }
    }
    
    if (this.standards.length > 0) {
      instructions += `\n\nDu beachtest folgende Menschenrechtsstandards in deiner Arbeit:`;
      
      // Füge die wichtigsten Standards hinzu (maximal 5)
      const topStandards = this.standards.slice(0, 5);
      for (const standard of topStandards) {
        instructions += `\n- ${standard.name}: ${standard.description}`;
      }
    }
    
    return instructions;
  }
}

// Singleton-Instanz des Services
let standardsService: HumanRightsStandardsService | null = null;

// Gibt die Singleton-Instanz zurück
export function getHumanRightsStandards(): HumanRightsStandardsService {
  if (!standardsService) {
    standardsService = new HumanRightsStandardsService();
    
    // Lade Standards asynchron
    standardsService.loadStandards().catch(err => {
      console.error('Fehler beim Laden der Menschenrechtsstandards:', err);
    });
  }
  
  return standardsService;
}

export default {
  getHumanRightsStandards
};