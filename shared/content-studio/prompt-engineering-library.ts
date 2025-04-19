/**
 * Zentrale Bibliothek für Prompt Engineering im MR-Tool Content Studio
 */
export class PromptEngineeringLibrary {
  config: {
    defaultLanguage: string;
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    [key: string]: any;
  };
  
  promptTemplates: Record<string, any>;
  systemPrompts: Record<string, any>;
  examplePrompts: Record<string, any>;
  metadataSchemas: Record<string, any>;
  promptChains: Record<string, any>;
  
  constructor(config: Record<string, any> = {}) {
    this.config = {
      defaultLanguage: 'de',
      defaultModel: 'gemini-2.5-pro',
      maxTokens: 4096,
      temperature: 0.3,
      ...config
    };
    
    this.promptTemplates = {};
    this.systemPrompts = {};
    this.examplePrompts = {};
    this.metadataSchemas = {};
    this.promptChains = {};
    
    // Standard-Templates initialisieren
    this._initializeDefaultTemplates();
  }
  
  /**
   * Lädt Templates aus einer externen Quelle oder Datenbank
   */
  async loadTemplates(source: string | Record<string, any>): Promise<boolean> {
    try {
      if (typeof source === 'string') {
        // Von URL oder Datei laden
        const response = await fetch(source);
        const templates = await response.json();
        this._registerTemplates(templates);
      } else if (typeof source === 'object') {
        // Direkt aus Objekt laden
        this._registerTemplates(source);
      }
      return true;
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
      return false;
    }
  }
  
  /**
   * Registriert Templates intern
   */
  _registerTemplates(templates: Record<string, any>) {
    if (templates.promptTemplates) {
      this.promptTemplates = {
        ...this.promptTemplates,
        ...templates.promptTemplates
      };
    }
    
    if (templates.systemPrompts) {
      this.systemPrompts = {
        ...this.systemPrompts,
        ...templates.systemPrompts
      };
    }
    
    if (templates.examplePrompts) {
      this.examplePrompts = {
        ...this.examplePrompts,
        ...templates.examplePrompts
      };
    }
    
    if (templates.metadataSchemas) {
      this.metadataSchemas = {
        ...this.metadataSchemas,
        ...templates.metadataSchemas
      };
    }
    
    if (templates.promptChains) {
      this.promptChains = {
        ...this.promptChains,
        ...templates.promptChains
      };
    }
  }
  
  /**
   * Erstellt einen optimierten Prompt basierend auf einem Template und Parametern
   */
  createPrompt(templateId: string, params: Record<string, any> = {}, options: Record<string, any> = {}) {
    const template = this.promptTemplates[templateId];
    if (!template) {
      throw new Error(`Template '${templateId}' nicht gefunden`);
    }
    
    const {
      language = this.config.defaultLanguage,
      model = this.config.defaultModel,
      role = 'default',
      includeExamples = true,
      includeSources = false
    } = options;
    
    // System-Prompt für die spezifische Rolle auswählen
    const systemPrompt = this._getSystemPrompt(role, language as string);
    
    // Template mit Parametern füllen
    let promptText = this._fillTemplate(template.template, params);
    
    // Beispiele hinzufügen, falls gewünscht
    if (includeExamples && template.examples && template.examples.length > 0) {
      const exampleSection = this._generateExampleSection(template.examples, language as string);
      promptText = `${promptText}\n\n${exampleSection}`;
    }
    
    // Quellen hinzufügen, falls gewünscht und vorhanden
    if (includeSources && params.sources) {
      const sourcesSection = this._generateSourcesSection(params.sources, language as string);
      promptText = `${promptText}\n\n${sourcesSection}`;
    }
    
    // Vollständigen Prompt zusammenbauen
    return {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText }
      ],
      metadata: {
        templateId,
        language,
        role,
        params: Object.keys(params),
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Erstellt eine Serie von Prompts für komplexe Workflows
   */
  createPromptChain(chainId: string, params: Record<string, any> = {}, options: Record<string, any> = {}) {
    const chain = this.promptChains[chainId];
    if (!chain) {
      throw new Error(`Prompt-Kette '${chainId}' nicht gefunden`);
    }
    
    return chain.steps.map((step: any) => {
      const stepParams = { ...params, ...step.additionalParams };
      return this.createPrompt(step.templateId, stepParams, { ...options, ...step.options });
    });
  }
  
  /**
   * Füllt ein Template mit Parametern
   */
  _fillTemplate(template: string, params: Record<string, any>): string {
    let filledTemplate = template;
    
    // Einfache Parameter-Ersetzung mit {{param}}
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      filledTemplate = filledTemplate.replace(regex, String(value));
    });
    
    // Bedingte Abschnitte mit {{#if param}}...{{/if}}
    const conditionalRegex = /{{#if\s+([^}]+)}}\s*([\s\S]*?)\s*{{\/if}}/g;
    filledTemplate = filledTemplate.replace(conditionalRegex, (match, condition, content) => {
      return params[condition] ? content : '';
    });
    
    // Listen mit {{#each items}}...{{/each}}
    const listRegex = /{{#each\s+([^}]+)}}\s*([\s\S]*?)\s*{{\/each}}/g;
    filledTemplate = filledTemplate.replace(listRegex, (match, listName, template) => {
      const list = params[listName];
      if (!Array.isArray(list)) return '';
      
      return list.map(item => {
        let itemContent = template;
        if (typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            const itemRegex = new RegExp(`{{\\s*item\\.${key}\\s*}}`, 'g');
            itemContent = itemContent.replace(itemRegex, String(value));
          });
        } else {
          itemContent = itemContent.replace(/{{item}}/g, String(item));
        }
        return itemContent;
      }).join('\n');
    });
    
    return filledTemplate;
  }
  
  /**
   * Ermittelt den passenden System-Prompt für eine Rolle
   */
  _getSystemPrompt(role: string, language: string): string {
    const systemPrompt = this.systemPrompts[role] || this.systemPrompts.default;
    
    if (typeof systemPrompt === 'object') {
      return systemPrompt[language] || systemPrompt.en || '';
    }
    
    return systemPrompt || '';
  }
  
  /**
   * Generiert einen Beispielabschnitt
   */
  _generateExampleSection(examples: any[], language: string): string {
    const exampleHeaders: Record<string, string> = {
      de: 'BEISPIELE:',
      en: 'EXAMPLES:',
      fr: 'EXEMPLES:',
      es: 'EJEMPLOS:'
    };
    
    const header = exampleHeaders[language] || exampleHeaders.en;
    const exampleTexts = examples.map(example => {
      if (typeof example === 'object' && example[language]) {
        return example[language];
      }
      return example;
    });
    
    return `${header}\n${exampleTexts.join('\n\n')}`;
  }
  
  /**
   * Generiert einen Quellenabschnitt
   */
  _generateSourcesSection(sources: any[] | string, language: string): string {
    const sourceHeaders: Record<string, string> = {
      de: 'QUELLEN:',
      en: 'SOURCES:',
      fr: 'SOURCES:',
      es: 'FUENTES:'
    };
    
    const header = sourceHeaders[language] || sourceHeaders.en;
    let sourcesText = '';
    
    if (Array.isArray(sources)) {
      sourcesText = sources.map((source, index) => {
        if (typeof source === 'object') {
          return `[${index + 1}] ${source.title || 'Quelle'}: ${source.url || source.text || ''}`;
        }
        return `[${index + 1}] ${source}`;
      }).join('\n');
    } else if (typeof sources === 'string') {
      sourcesText = sources;
    }
    
    return `${header}\n${sourcesText}`;
  }
  
  /**
   * Initialisiert Standard-Templates für das Content Creation Studio
   */
  _initializeDefaultTemplates() {
    // System-Prompts für verschiedene Rollen
    this.systemPrompts = {
      default: {
        de: "Du bist ein Experte für Menschenrechte und hilfst bei der Erstellung von Inhalten für Menschenrechtsarbeit. Deine Antworten sind präzise, faktenbasiert und ethisch fundiert.",
        en: "You are an expert in human rights, assisting with content creation for human rights work. Your responses are precise, fact-based, and ethically grounded."
      },
      legal: {
        de: "Du bist ein Experte für internationales Menschenrechtsrecht mit fundiertem Wissen über UN-Menschenrechtsmechanismen, regionale Menschenrechtssysteme und nationale Rechtsrahmen. Deine Antworten enthalten präzise rechtliche Definitionen, Fallverweise und relevante Rechtsstandards.",
        en: "You are an expert in international human rights law with extensive knowledge of UN human rights mechanisms, regional human rights systems, and national legal frameworks. Your responses include precise legal definitions, case references, and relevant legal standards."
      },
      advocacy: {
        de: "Du bist ein Experte für Menschenrechtsadvocacy mit Erfahrung in öffentlicher Kommunikation, Medienkampagnen und politischer Lobbyarbeit. Deine Antworten sind überzeugend, zielgruppengerecht und handlungsorientiert.",
        en: "You are an expert in human rights advocacy with experience in public communications, media campaigns, and policy lobbying. Your responses are persuasive, audience-appropriate, and action-oriented."
      },
      documentation: {
        de: "Du bist ein Experte für Menschenrechtsdokumentation mit Fokus auf Beweissicherung, Zeugeninterviews und Fallaufbereitung. Deine Antworten sind systematisch, detailreich und folgen internationalen Standards für Dokumentation und Beweisführung.",
        en: "You are an expert in human rights documentation with a focus on evidence preservation, witness interviews, and case preparation. Your responses are systematic, detail-oriented, and follow international standards for documentation and evidence handling."
      },
      research: {
        de: "Du bist ein Experte für Menschenrechtsforschung mit Erfahrung in qualitativen und quantitativen Methoden, Datenanalyse und akademischer Publikation. Deine Antworten sind methodisch fundiert, analytisch präzise und berücksichtigen aktuelle Forschungsstandards.",
        en: "You are an expert in human rights research with experience in qualitative and quantitative methods, data analysis, and academic publishing. Your responses are methodologically sound, analytically precise, and consider current research standards."
      }
    };
    
    // Beispielhafte Prompt-Templates für verschiedene Inhaltstypen
    this.promptTemplates = {
      // Bericht-Templates
      "report_executive_summary": {
        template: `Erstelle eine prägnante Zusammenfassung (Executive Summary) für einen Menschenrechtsbericht mit dem Titel "{{title}}".
        
KONTEXT:
{{context}}

HAUPTTHEMEN:
{{#each mainPoints}}
- {{item}}
{{/each}}

ZIELGRUPPE:
{{audience}}

FORMAT:
Die Executive Summary sollte maximal 500 Wörter umfassen und folgende Elemente enthalten:
1. Einen packenden Einstieg, der den Kontext und die Bedeutung des Themas vermittelt
2. Die wichtigsten Erkenntnisse und Schlussfolgerungen
3. Zentrale Empfehlungen
4. Einen Aufruf zum Handeln

Achte auf eine klare, präzise Sprache und vermeide Fachjargon, es sei denn, die Zielgruppe ist ein Fachpublikum.`,
        examples: [
          {
            de: `BEISPIEL (Kontext: Bericht über Polizeigewalt bei Demonstrationen):
            
VERLETZUNGEN DER VERSAMMLUNGSFREIHEIT: SYSTEMISCHE POLIZEIGEWALT BEI FRIEDLICHEN PROTESTEN

Diese Zusammenfassung präsentiert die Ergebnisse einer 12-monatigen Untersuchung zu unverhältnismäßiger Gewaltanwendung durch Polizeikräfte bei friedlichen Demonstrationen in der Region X. Der Bericht dokumentiert 37 separate Vorfälle zwischen Januar und Dezember 2023, bei denen exzessive Gewalt gegen Demonstrierende eingesetzt wurde, darunter der Einsatz von Gummigeschossen, Tränengas und willkürlichen Verhaftungen.

Unsere Untersuchung, basierend auf 145 Zeugenaussagen, Videomaterial und medizinischen Berichten, zeigt ein besorgniserregendes Muster systematischen Machtmissbrauchs. In 82% der dokumentierten Fälle wurden keine Deeskalationsmaßnahmen ergriffen, bevor zu Gewalt gegriffen wurde. Besonders alarmierend ist die Tatsache, dass Journalisten und Sanitäter in 24 Fällen gezielt ins Visier genommen wurden.

Die Studie identifiziert institutionelle Faktoren, die zu dieser Situation beitragen:
- Unzureichende Ausbildung in Bezug auf Versammlungsfreiheit und Deeskalationstechniken
- Fehlende Rechenschaftspflicht durch mangelhafte interne Untersuchungsmechanismen
- Problematische rechtliche Rahmenbedingungen, die zu viel Interpretationsspielraum bieten

Unsere zentralen Empfehlungen umfassen:
1. Die sofortige Einrichtung einer unabhängigen Aufsichtskommission
2. Umfassende Reformen der polizeilichen Ausbildung im Umgang mit Versammlungen
3. Überarbeitung der Einsatzprotokolle im Einklang mit internationalen Menschenrechtsstandards
4. Entschädigung für Opfer unverhältnismäßiger Polizeigewalt

Es ist zwingend erforderlich, dass Behörden diese systematischen Probleme angehen, um das Recht auf friedliche Versammlung zu gewährleisten und das Vertrauen in die Strafverfolgungsbehörden wiederherzustellen.`
          }
        ]
      },
      
      "press_release": {
        template: `Erstelle eine Pressemitteilung für {{organization}} zum Thema {{topic}}.

KONTEXT:
{{context}}

WICHTIGSTE FAKTEN:
{{#each key_facts}}
- {{item}}
{{/each}}

KERNBOTSCHAFTEN:
{{#each key_messages}}
- {{item}}
{{/each}}

ZITATE:
{{#if quotes}}
{{quotes}}
{{/if}}

ZIELGRUPPE:
{{audience}}

FORMAT:
Die Pressemitteilung sollte folgende Elemente enthalten:
1. Aussagekräftiger Titel
2. Ort und Datum
3. Ein starker erster Absatz, der die wichtigsten W-Fragen beantwortet (Wer, Was, Wo, Wann, Warum)
4. Detaillierte Informationen mit Fakten und Zahlen
5. Mindestens ein Zitat einer Schlüsselperson der Organisation
6. Eine klare Handlungsaufforderung
7. Kontaktinformationen für Medienanfragen`,
        examples: []
      },
      
      "witness_interview_questions": {
        template: `Entwickle einen strukturierten Fragenkatalog für ein Zeugeninterview zu {{incident_type}}.

KONTEXT DES VORFALLS:
{{context}}

BEREITS BEKANNTE INFORMATIONEN:
{{#each known_facts}}
- {{item}}
{{/each}}

ZIEL DES INTERVIEWS:
{{interview_purpose}}

FORMAT:
Erstelle einen umfassenden Fragenkatalog mit folgenden Abschnitten:
1. Einleitende Fragen (Hintergrund des Zeugen, Beziehung zum Vorfall)
2. Chronologische Fragen zum Ablauf des Vorfalls
3. Detailfragen zu spezifischen Aspekten
4. Fragen zu anderen möglichen Zeugen oder Beweisen
5. Abschließende Fragen

Achte darauf, dass die Fragen:
- Offen formuliert sind und keine Suggestivfragen enthalten
- Traumasensibel gestaltet sind
- Rechtlich relevante Aspekte erfassen
- Die Glaubwürdigkeit der Aussage stärken`,
        examples: []
      },
      
      "legal_analysis": {
        template: `Führe eine rechtliche Analyse des folgenden Falls/Szenarios durch:

FALLBESCHREIBUNG:
{{case_description}}

RELEVANTER RECHTLICHER RAHMEN:
{{#if legal_framework}}
{{legal_framework}}
{{/if}}

FRAGEN ZUR RECHTLICHEN ANALYSE:
{{#each legal_questions}}
- {{item}}
{{/each}}

JURISDIKTION:
{{jurisdiction}}

FORMAT:
Erstelle eine strukturierte rechtliche Analyse mit folgenden Abschnitten:
1. Zusammenfassung des Sachverhalts
2. Anwendbarer rechtlicher Rahmen (national und international)
3. Analyse der rechtlichen Fragen
4. Schlussfolgerungen und Empfehlungen
5. Mögliche rechtliche Strategien

Die Analyse sollte präzise rechtliche Terminologie verwenden, relevante Rechtsprechung zitieren und potenzielle Gegenargumente berücksichtigen.`,
        examples: []
      }
    };
  }
}

export default PromptEngineeringLibrary;