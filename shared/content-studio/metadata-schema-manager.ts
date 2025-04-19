/**
 * Schema-Manager für das Content Creation Studio
 * Verwaltet Metadaten-Schemas für verschiedene Inhaltstypen
 */

export interface SchemaProperty {
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  enum?: string[];
  default?: any;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  minItems?: number;
  maxItems?: number;
}

export interface Schema {
  title: string;
  description: string;
  properties: Record<string, SchemaProperty>;
}

export interface FormField {
  id: string;
  label: string;
  type: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  options?: any[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  step?: number;
  fields?: FormField[];
}

export interface FormSchema {
  title: string;
  description: string;
  fields: FormField[];
}

export class MetadataSchemaManager {
  schemas: Record<string, Schema>;
  
  constructor() {
    this.schemas = {};
    this._initializeDefaultSchemas();
  }
  
  /**
   * Registriert ein neues Schema
   */
  registerSchema(id: string, schema: Schema): void {
    this.schemas[id] = schema;
  }
  
  /**
   * Gibt ein Schema anhand seiner ID zurück
   */
  getSchema(id: string): Schema | null {
    return this.schemas[id] || null;
  }
  
  /**
   * Gibt alle verfügbaren Schemas zurück
   */
  getAllSchemas(): Record<string, Schema> {
    return { ...this.schemas };
  }
  
  /**
   * Generiert ein Formularschema aus einem Metadatenschema
   */
  generateFormSchema(schemaId: string): FormSchema | null {
    const schema = this.getSchema(schemaId);
    if (!schema) return null;
    
    const formSchema: FormSchema = {
      title: schema.title,
      description: schema.description,
      fields: []
    };
    
    Object.entries(schema.properties).forEach(([fieldId, fieldSchema]) => {
      const formField: FormField = {
        id: fieldId,
        label: fieldSchema.title,
        type: this._mapTypeToFormFieldType(fieldSchema.type, fieldSchema),
        description: fieldSchema.description,
        required: !!fieldSchema.required,
        placeholder: `${fieldSchema.title} eingeben...`
      };
      
      if (fieldSchema.enum) {
        formField.options = fieldSchema.enum.map(option => ({
          value: option,
          label: option
        }));
      }
      
      if (fieldSchema.default !== undefined) {
        formField.default = fieldSchema.default;
      }
      
      if (fieldSchema.type === 'string') {
        formField.minLength = fieldSchema.minLength;
        formField.maxLength = fieldSchema.maxLength;
        formField.pattern = fieldSchema.pattern;
      }
      
      if (fieldSchema.type === 'number') {
        formField.minimum = fieldSchema.minimum;
        formField.maximum = fieldSchema.maximum;
        formField.step = fieldSchema.multipleOf || 1;
      }
      
      formSchema.fields.push(formField);
    });
    
    return formSchema;
  }
  
  /**
   * Übersetzt Schema-Typen in Formularfeld-Typen
   */
  _mapTypeToFormFieldType(schemaType: string, fieldSchema: SchemaProperty): string {
    switch (schemaType) {
      case 'string':
        if (fieldSchema.format === 'date') return 'date';
        if (fieldSchema.format === 'date-time') return 'datetime';
        if (fieldSchema.format === 'email') return 'email';
        if (fieldSchema.format === 'uri') return 'url';
        if (fieldSchema.enum) return 'select';
        if (fieldSchema.maxLength && fieldSchema.maxLength > 100) return 'textarea';
        return 'text';
        
      case 'number':
        if (fieldSchema.multipleOf === 1) return 'integer';
        return 'number';
        
      case 'boolean':
        return 'checkbox';
        
      case 'array':
        if (fieldSchema.items && fieldSchema.items.enum) return 'multiselect';
        return 'array';
        
      case 'object':
        return 'object';
        
      default:
        return 'text';
    }
  }
  
  /**
   * Initialisiert Standardschemas für verschiedene Inhaltstypen
   */
  _initializeDefaultSchemas() {
    // Schema für Berichte
    this.registerSchema('report', {
      title: 'Bericht',
      description: 'Metadaten-Schema für Menschenrechtsberichte',
      properties: {
        title: {
          type: 'string',
          title: 'Titel',
          description: 'Der vollständige Titel des Berichts',
          required: true,
          minLength: 3,
          maxLength: 200
        },
        subtitle: {
          type: 'string',
          title: 'Untertitel',
          description: 'Ein optionaler Untertitel oder Erklärung',
          maxLength: 300
        },
        authors: {
          type: 'array',
          title: 'Autoren',
          description: 'Liste der Autoren des Berichts',
          items: {
            type: 'string'
          },
          minItems: 1
        },
        publicationDate: {
          type: 'string',
          title: 'Veröffentlichungsdatum',
          description: 'Datum der Veröffentlichung des Berichts',
          format: 'date',
          required: true
        },
        coveragePeriod: {
          type: 'object',
          title: 'Berichtszeitraum',
          properties: {
            startDate: {
              type: 'string',
              title: 'Anfangsdatum',
              format: 'date'
            },
            endDate: {
              type: 'string',
              title: 'Enddatum',
              format: 'date'
            }
          }
        },
        geographicScope: {
          type: 'array',
          title: 'Geografischer Umfang',
          description: 'Länder oder Regionen, die in diesem Bericht behandelt werden',
          items: {
            type: 'string'
          }
        },
        thematicFocus: {
          type: 'array',
          title: 'Thematischer Fokus',
          description: 'Hauptthemen des Berichts',
          items: {
            type: 'string'
          },
          minItems: 1
        },
        targetAudience: {
          type: 'array',
          title: 'Zielgruppe',
          description: 'Hauptzielgruppen des Berichts',
          items: {
            type: 'string',
            enum: [
              'Allgemeine Öffentlichkeit',
              'Politische Entscheidungsträger',
              'UN-Mechanismen',
              'Regionale Menschenrechtsgremien',
              'NGOs',
              'Medien',
              'Akademiker',
              'Betroffene Gemeinschaften'
            ]
          }
        },
        reportType: {
          type: 'string',
          title: 'Berichtstyp',
          description: 'Art des Berichts',
          enum: [
            'Jahresbericht',
            'Länderbericht',
            'Themenbericht',
            'Situationsbericht',
            'Fallstudie',
            'Policy Brief',
            'Shadow Report',
            'Fact-Finding Mission'
          ],
          required: true
        },
        confidentialityLevel: {
          type: 'string',
          title: 'Vertraulichkeitsstufe',
          description: 'Vertraulichkeitsstufe des Berichts',
          enum: [
            'Öffentlich',
            'Beschränkt',
            'Vertraulich',
            'Streng vertraulich'
          ],
          default: 'Öffentlich'
        },
        keywords: {
          type: 'array',
          title: 'Schlüsselwörter',
          description: 'Schlüsselwörter für Indexierung und Suche',
          items: {
            type: 'string'
          },
          minItems: 3,
          maxItems: 15
        },
        language: {
          type: 'string',
          title: 'Sprache',
          description: 'Hauptsprache des Berichts',
          enum: [
            'Deutsch',
            'Englisch',
            'Französisch',
            'Spanisch',
            'Arabisch',
            'Russisch',
            'Chinesisch'
          ],
          default: 'Deutsch'
        },
        status: {
          type: 'string',
          title: 'Status',
          description: 'Aktueller Status des Berichts',
          enum: [
            'Entwurf',
            'In Bearbeitung',
            'In Überprüfung',
            'Genehmigt',
            'Veröffentlicht',
            'Archiviert'
          ],
          default: 'Entwurf'
        }
      }
    });
    
    // Schema für Pressemitteilungen
    this.registerSchema('press_release', {
      title: 'Pressemitteilung',
      description: 'Metadaten-Schema für Pressemitteilungen',
      properties: {
        title: {
          type: 'string',
          title: 'Titel',
          description: 'Der Titel der Pressemitteilung',
          required: true,
          minLength: 3,
          maxLength: 150
        },
        subtitle: {
          type: 'string',
          title: 'Untertitel',
          description: 'Ein optionaler Untertitel',
          maxLength: 200
        },
        date: {
          type: 'string',
          title: 'Datum',
          description: 'Das Veröffentlichungsdatum der Pressemitteilung',
          format: 'date',
          required: true
        },
        location: {
          type: 'string',
          title: 'Ort',
          description: 'Der Ort, von dem aus die Pressemitteilung herausgegeben wird',
          required: true
        },
        contactName: {
          type: 'string',
          title: 'Kontaktperson',
          description: 'Name der Kontaktperson für Medienanfragen'
        },
        contactEmail: {
          type: 'string',
          title: 'Kontakt-E-Mail',
          description: 'E-Mail-Adresse für Medienanfragen',
          format: 'email'
        },
        contactPhone: {
          type: 'string',
          title: 'Kontakttelefon',
          description: 'Telefonnummer für Medienanfragen'
        },
        organizationName: {
          type: 'string',
          title: 'Organisation',
          description: 'Name der herausgebenden Organisation',
          required: true
        },
        urgencyLevel: {
          type: 'string',
          title: 'Dringlichkeitsstufe',
          description: 'Dringlichkeitsstufe der Pressemitteilung',
          enum: [
            'Routine',
            'Wichtig',
            'Dringend',
            'Sofortige Aufmerksamkeit erforderlich'
          ],
          default: 'Routine'
        },
        targetMedia: {
          type: 'array',
          title: 'Zielmedien',
          description: 'Medientypen, die angesprochen werden sollen',
          items: {
            type: 'string',
            enum: [
              'Alle Medien',
              'Printmedien',
              'Onlinemedien',
              'Fernsehen',
              'Radio',
              'Fachmedien',
              'Internationale Medien',
              'Lokale Medien'
            ]
          },
          default: ['Alle Medien']
        },
        relatedTopic: {
          type: 'string',
          title: 'Thema',
          description: 'Hauptthema der Pressemitteilung',
          required: true
        }
      }
    });
    
    // Schema für rechtliche Analysen
    this.registerSchema('legal_analysis', {
      title: 'Rechtliche Analyse',
      description: 'Metadaten-Schema für rechtliche Analysen',
      properties: {
        title: {
          type: 'string',
          title: 'Titel',
          description: 'Titel der rechtlichen Analyse',
          required: true,
          minLength: 3,
          maxLength: 200
        },
        caseTitle: {
          type: 'string',
          title: 'Fallbezeichnung',
          description: 'Offizielle Bezeichnung des Falls oder Szenarios',
          required: true
        },
        jurisdiction: {
          type: 'string',
          title: 'Jurisdiktion',
          description: 'Relevant rechtliche Jurisdiktion',
          required: true
        },
        analysisDate: {
          type: 'string',
          title: 'Datum der Analyse',
          description: 'Datum, an dem die Analyse durchgeführt wurde',
          format: 'date',
          required: true
        },
        legalFramework: {
          type: 'array',
          title: 'Rechtlicher Rahmen',
          description: 'Relevante Gesetze, Verträge und Rechtsstandards',
          items: {
            type: 'string'
          },
          minItems: 1
        },
        analysisType: {
          type: 'string',
          title: 'Art der Analyse',
          description: 'Art der durchgeführten rechtlichen Analyse',
          enum: [
            'Vollständige rechtliche Analyse',
            'Kurze rechtliche Bewertung',
            'Vergleichende Analyse',
            'Rechtsgutachten',
            'Rechtliche Strategie',
            'Compliance-Prüfung'
          ],
          required: true
        }
      }
    });
  }
}

export default MetadataSchemaManager;