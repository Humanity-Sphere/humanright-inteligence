/**
 * Code Generator Agent - Erzeugt Code für komplexe Visualisierungen und Datenanalysen
 * 
 * Dieser Agent ist für die Generierung von Code verantwortlich, wenn komplexere
 * Visualisierungen oder Datenanalysen erforderlich sind, die über die Möglichkeiten
 * des Document Generators hinausgehen.
 */

import { BaseAgent } from './base-agent';
import { v4 as uuidv4 } from 'uuid';
import { TaskResult, ITask, CodeGenerationParams } from './agent-types';

// Enum Definitionen, die in der Datei fehlen
enum AgentRuntime {
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

// Enum für Agentenrollen
enum AgentRole {
  MANAGER = 'manager',
  CONTENT_GENERATOR = 'content-generator',
  CODE_GENERATOR = 'code-generator',
  VOICE_ASSISTANT = 'voice-assistant'
}

// Enum für Agent Status
enum AgentStatus {
  IDLE = 'idle',
  WORKING = 'working',
  FAILED = 'failed'
}

/**
 * Code Generator Agent
 * Generiert Code für komplexe Visualisierungen und Datenanalysen
 */
export class CodeGeneratorAgent extends BaseAgent {
  private aiService: any;
  private supportedLanguages: string[] = [
    'python',
    'javascript',
    'typescript',
    'r',
    'html',
    'css'
  ];
  
  private supportedVisualizationLibraries: Record<string, string[]> = {
    python: ['matplotlib', 'seaborn', 'plotly', 'bokeh', 'altair'],
    javascript: ['d3.js', 'chart.js', 'plotly.js', 'highcharts', 'echarts', 'leaflet', 'mapbox'],
    typescript: ['d3.js', 'chart.js', 'plotly.js', 'highcharts', 'echarts', 'leaflet', 'mapbox'],
    r: ['ggplot2', 'plotly', 'lattice', 'highcharter'],
    html: ['bootstrap', 'tailwind', 'reveal.js', 'impress.js']
  };
  
  constructor(name: string = 'Code Generator') {
    // Übergebe ein AgentConfig-Objekt statt einzelner Parameter
    super({
      id: `code-generator-${Date.now()}`,
      name: name,
      role: 'code-generator',
      capabilities: [
        'visualization-code',
        'data-analysis-code',
        'interactive-dashboard',
        'code-generation',
        'presentation-generation',
        'map-generation',
        'html-page-generation'
      ],
      runtime: {
        model: 'gemini-1.5-flash',
        maxTokens: 8192,
        temperature: 0.7
      }
    });
  }
  
  /**
   * Initialisiert den Code Generator Agenten
   */
  async initialize(): Promise<boolean> {
    try {
      // KI-Dienst initialisieren
      // Für den Prototyp wird ein Placeholder verwendet
      this.aiService = {
        generateContent: async (prompt: string, opts?: any) => {
          // Simulate AI service response
          return `Generated code for prompt: ${prompt}`;
        }
      };
      
      this.updateStatus({ isActive: true });
      console.log(`Code Generator Agent "${this.name}" initialisiert`);
      return true;
    } catch (error) {
      console.error('Fehler bei der Initialisierung des Code Generator Agenten:', error);
      this.updateStatus({ isActive: false });
      return false;
    }
  }
  
  /**
   * Führt eine Aufgabe aus
   */
  async executeTask(task: any): Promise<TaskResult> {
    this.updateStatus({ isActive: true });
    
    try {
      let result: any = null;
      const taskType = task.type as string;
      
      switch (taskType) {
        case 'generate-visualization-code':
          // Visualisierungscode erstellen
          result = await this.generateVisualizationCode(task);
          break;
          
        case 'generate-data-analysis-code':
          // Datenanalysecode erstellen
          result = await this.generateDataAnalysisCode(task);
          break;
          
        case 'generate-interactive-dashboard':
          // Interaktives Dashboard erstellen
          result = await this.generateInteractiveDashboard(task);
          break;
          
        case 'generate-presentation':
          // Präsentation erstellen
          result = await this.generatePresentation(task);
          break;
          
        case 'generate-map':
          // Interaktive Karte erstellen
          result = await this.generateInteractiveMap(task);
          break;
          
        case 'generate-html-page':
          // HTML-Seite erstellen
          result = await this.generateHtmlPage(task);
          break;
          
        default:
          throw new Error(`Unbekannter Aufgabentyp: ${taskType}`);
      }
      
      this.updateStatus({ 
        isActive: false, 
        successCount: this._status.successCount + 1 
      });
      
      return this.createTaskResult(
        true,
        `Code erfolgreich generiert: ${taskType}`,
        result
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error(`Fehler bei der Ausführung der Aufgabe ${task.type}:`, errorMessage);
      
      this.updateStatus({ 
        isActive: false, 
        errorCount: this._status.errorCount + 1 
      });
      
      return this.createTaskResult(
        false,
        `Fehler bei der Codegenerierung: ${task.type}`,
        null,
        errorMessage
      );
    }
  }
  
  /**
   * Generiert Code für Visualisierungen
   */
  private async generateVisualizationCode(task: ITask): Promise<any> {
    const params = task.parameters as CodeGenerationParams;
    console.log(`Generiere Visualisierungscode für "${params.purpose}" in ${params.language}`);
    
    // Sprache validieren
    const language = this.validateLanguage(params.language);
    
    // Bibliotheken validieren
    const libraries = this.validateLibraries(language, params.libraries);
    
    try {
      // Prompt für die Codegenerierung erstellen
      const prompt = this.buildVisualizationPrompt(
        params,
        language,
        libraries
      );
      
      // Code mit KI generieren
      const generatedCode = await this.aiService.generateContent(prompt);
      
      // Code extrahieren und validieren
      const code = this.extractCodeFromResponse(generatedCode, language);
      
      // Code-Objekt erstellen
      const visualizationCode = {
        title: `Visualisierung: ${params.purpose}`,
        code,
        language,
        libraries,
        type: 'visualization',
        complexity: params.complexity,
        metadata: {
          purpose: params.purpose,
          createdAt: new Date(),
          dataFormat: params.dataFormat || 'csv'
        }
      };
      
      console.log(`Visualisierungscode für "${params.purpose}" erfolgreich erstellt`);
      
      return visualizationCode;
    } catch (error) {
      console.error('Fehler bei der Generierung des Visualisierungscodes:', error);
      throw error;
    }
  }
  
  /**
   * Generiert Code für Datenanalyse
   */
  private async generateDataAnalysisCode(task: ITask): Promise<any> {
    const params = task.parameters as CodeGenerationParams;
    console.log(`Generiere Datenanalysecode für "${params.purpose}" in ${params.language}`);
    
    // Sprache validieren
    const language = this.validateLanguage(params.language);
    
    // Bibliotheken validieren
    const libraries = this.validateLibraries(language, params.libraries);
    
    try {
      // Prompt für die Codegenerierung erstellen
      const prompt = this.buildDataAnalysisPrompt(
        params,
        language,
        libraries
      );
      
      // Code mit KI generieren
      const generatedCode = await this.aiService.generateContent(prompt);
      
      // Code extrahieren und validieren
      const code = this.extractCodeFromResponse(generatedCode, language);
      
      // Code-Objekt erstellen
      const analysisCode = {
        title: `Datenanalyse: ${params.purpose}`,
        code,
        language,
        libraries,
        type: 'data-analysis',
        complexity: params.complexity,
        metadata: {
          purpose: params.purpose,
          createdAt: new Date(),
          dataFormat: params.dataFormat || 'csv',
          dataSource: params.dataSource
        }
      };
      
      console.log(`Datenanalysecode für "${params.purpose}" erfolgreich erstellt`);
      
      return analysisCode;
    } catch (error) {
      console.error('Fehler bei der Generierung des Datenanalysecodes:', error);
      throw error;
    }
  }
  
  /**
   * Generiert Code für ein interaktives Dashboard
   */
  private async generateInteractiveDashboard(task: ITask): Promise<any> {
    const params = task.parameters as CodeGenerationParams;
    console.log(`Generiere interaktives Dashboard für "${params.purpose}"`);
    
    // Bei Dashboards immer JavaScript/TypeScript verwenden für Web-Integration
    const language = params.language === 'typescript' ? 'typescript' : 'javascript';
    
    // Standard-Bibliotheken für Dashboards
    const dashboardLibraries = [
      'react', 'vue', 'dash', 'streamlit', 'echarts', 'd3.js'
    ].filter(lib => params.libraries?.includes(lib) || !params.libraries);
    
    try {
      // Prompt für Dashboard-Code erstellen
      const prompt = `Erstelle ein interaktives Dashboard für ${params.purpose} mit ${language}.
Verwende die folgenden Bibliotheken: ${dashboardLibraries.join(', ')}.
Komplexität: ${params.complexity}.
${params.dataFormat ? `Datenformat: ${params.dataFormat}` : ''}
${params.dataSource ? `Datenquelle: ${params.dataSource}` : ''}

Das Dashboard sollte folgende Komponenten enthalten:
1. Ein Hauptvisualisierungselement
2. Filter- und Steuerungselemente
3. Datentabelle
4. Interaktive Elemente (Hover-Effekte, Klickereignisse)
5. Reaktionsfähiges Layout

Bitte strukturiere den Code klar und füge Kommentare hinzu.`;
      
      // Code mit KI generieren
      const generatedCode = await this.aiService.generateContent(prompt);
      
      // Code-Komponenten extrahieren
      const dashboardComponents = this.extractDashboardComponents(generatedCode);
      
      // Dashboard-Objekt erstellen
      const dashboard = {
        title: `Dashboard: ${params.purpose}`,
        components: dashboardComponents,
        language,
        libraries: dashboardLibraries,
        type: 'interactive-dashboard',
        complexity: params.complexity,
        metadata: {
          purpose: params.purpose,
          createdAt: new Date(),
          componentCount: Object.keys(dashboardComponents).length
        }
      };
      
      console.log(`Interaktives Dashboard für "${params.purpose}" erfolgreich erstellt`);
      
      return dashboard;
    } catch (error) {
      console.error('Fehler bei der Generierung des interaktiven Dashboards:', error);
      throw error;
    }
  }
  
  /**
   * Validiert die angegebene Sprache
   */
  private validateLanguage(language: string): string {
    const lowerCase = language.toLowerCase();
    
    // Unterstützte Sprache validieren
    if (!this.supportedLanguages.includes(lowerCase)) {
      // Fallback zu Python, wenn die Sprache nicht unterstützt wird
      console.warn(`Sprache ${language} wird nicht unterstützt, verwende Python als Fallback`);
      return 'python';
    }
    
    return lowerCase;
  }
  
  /**
   * Validiert die angegebenen Bibliotheken für die Sprache
   */
  private validateLibraries(language: string, libraries?: string[]): string[] {
    if (!libraries || libraries.length === 0) {
      // Standard-Bibliotheken für die Sprache zurückgeben
      switch (language) {
        case 'python':
          return ['matplotlib', 'pandas', 'numpy'];
        case 'javascript':
        case 'typescript':
          return ['d3.js', 'chart.js'];
        case 'r':
          return ['ggplot2', 'dplyr'];
        default:
          return [];
      }
    }
    
    // Prüfen, ob die angegebenen Bibliotheken für die Sprache verfügbar sind
    const supportedLibs = this.supportedVisualizationLibraries[language] || [];
    
    // Nur unterstützte Bibliotheken zurückgeben
    return libraries.filter(lib => supportedLibs.includes(lib));
  }
  
  /**
   * Baut einen Prompt für Visualisierungscode
   */
  private buildVisualizationPrompt(
    params: CodeGenerationParams, 
    language: string,
    libraries: string[]
  ): string {
    return `Erstelle Code für eine Visualisierung zum Thema "${params.purpose}" in der Programmiersprache ${language}.
Verwende die folgenden Bibliotheken: ${libraries.join(', ')}.
Komplexität: ${params.complexity}.
${params.dataFormat ? `Datenformat: ${params.dataFormat}` : ''}
${params.dataSource ? `Datenquelle: ${params.dataSource}` : ''}

Der Code sollte folgende Elemente enthalten:
1. Datenimport und -verarbeitung
2. Visualisierungscode mit ${libraries.join(', ')}
3. Achsenbeschriftungen und Titel
4. Farbschema und Stilangaben
5. Kommentare zur Erklärung des Codes

Bitte strukturiere den Code klar und füge Kommentare hinzu.`;
  }
  
  /**
   * Baut einen Prompt für Datenanalysecode
   */
  private buildDataAnalysisPrompt(
    params: CodeGenerationParams, 
    language: string,
    libraries: string[]
  ): string {
    return `Erstelle Code für eine Datenanalyse zu "${params.purpose}" in der Programmiersprache ${language}.
Verwende die folgenden Bibliotheken: ${libraries.join(', ')}.
Komplexität: ${params.complexity}.
${params.dataFormat ? `Datenformat: ${params.dataFormat}` : ''}
${params.dataSource ? `Datenquelle: ${params.dataSource}` : ''}

Der Code sollte folgende Elemente enthalten:
1. Datenimport und -bereinigung
2. Explorative Datenanalyse
3. Statistische Analysen
4. Visualisierungen der Ergebnisse
5. Zusammenfassung und Interpretation

Bitte strukturiere den Code klar und füge Kommentare hinzu.`;
  }
  
  /**
   * Extrahiert Code aus der Antwort
   */
  private extractCodeFromResponse(response: string, language: string): string {
    // Codeblöcke mit Markdown-Syntax suchen
    const codeRegex = new RegExp(`\`\`\`(?:${language})?\n([\\s\\S]*?)\n\`\`\``, 'g');
    const matches = [...response.matchAll(codeRegex)];
    
    if (matches.length > 0) {
      // Alle gefundenen Codeblöcke zusammenfügen
      return matches.map(match => match[1]).join('\n\n');
    }
    
    // Wenn keine Markdown-Codeblöcke gefunden wurden, versuchen wir, den Code direkt zu extrahieren
    const lines = response.split('\n');
    const codeLines = lines.filter(line => this.looksLikeCode(line, language));
    
    if (codeLines.length > 0) {
      return codeLines.join('\n');
    }
    
    // Fallback: Gesamten Text zurückgeben
    return response;
  }
  
  /**
   * Prüft, ob eine Zeile wie Code in der angegebenen Sprache aussieht
   */
  private looksLikeCode(line: string, language: string): boolean {
    // Einfache Heuristik, um zu erkennen, ob eine Zeile wie Code aussieht
    if (line.trim().length === 0 || line.trim().startsWith('#')) {
      return true; // Leere Zeilen und Kommentare
    }
    
    // Sprach-spezifische Prüfungen
    switch (language) {
      case 'python':
        return /^(\s*)(import|from|def|class|if|for|while|try|except|with|return|print|[a-zA-Z_][a-zA-Z0-9_]*\s*=)/.test(line);
      case 'javascript':
      case 'typescript':
        return /^(\s*)(import|export|const|let|var|function|class|if|for|while|try|catch|return|console\.|[a-zA-Z_$][a-zA-Z0-9_$]*\s*=)/.test(line);
      case 'r':
        return /^(\s*)(library|require|source|if|for|while|function|return|print|[a-zA-Z_.][a-zA-Z0-9_.]*\s*<-|\<\-)/.test(line);
      default:
        return true; // Im Zweifel annehmen, dass es Code ist
    }
  }
  
  /**
   * Extrahiert Dashboard-Komponenten aus der Antwort
   */
  private extractDashboardComponents(response: string): Record<string, string> {
    const components: Record<string, string> = {};
    
    // Versuchen, Komponenten aus Markdown-Abschnitten zu extrahieren
    const componentRegex = /## ([a-zA-Z0-9_\- ]+)\n\`\`\`(?:javascript|typescript|jsx|tsx)?\n([\s\S]*?)\n\`\`\`/g;
    const matches = [...response.matchAll(componentRegex)];
    
    if (matches.length > 0) {
      // Extrahierte Komponenten speichern
      for (const match of matches) {
        const componentName = match[1].trim();
        const componentCode = match[2];
        components[componentName] = componentCode;
      }
      
      return components;
    }
    
    // Fallback: Einen allgemeinen Komponentennamen verwenden
    components['Dashboard'] = this.extractCodeFromResponse(response, 'javascript');
    
    return components;
  }
  
  /**
   * Generiert eine Präsentation (HTML oder React-basiert)
   */
  private async generatePresentation(task: ITask): Promise<any> {
    console.log('Generiere Präsentation...');
    
    const { 
      topic, 
      targetAudience = 'Menschenrechtsverteidiger',
      format = 'html', // html oder react
      styleType = 'modern',
      complexity = 'medium'
    } = task.parameters as any;
    
    const language = format === 'react' ? 'typescript' : 'html';
    const libraries = format === 'react' ? ['react', '@radix-ui/react-tabs', 'framer-motion'] : ['reveal.js'];
    
    const presentationPrompt = `
Du bist ein Experte für die Erstellung von ${format === 'react' ? 'React-basierten' : 'HTML'} Präsentationen. 
Erstelle eine ansprechende Präsentation zum Thema "${topic}" für ${targetAudience}.

Die Präsentation sollte:
- Im ${styleType} Stil gestaltet sein
- Klare, gut strukturierte Folien enthalten
- Kurze, prägnante Texte haben
- Vorschläge für visuelle Elemente enthalten
- Eine logische Gliederung aufweisen
- Komplexitätsniveau: ${complexity}

${format === 'react' 
  ? 'Bitte verwende React mit TypeScript, @radix-ui/react-tabs für die Tab-Navigation und framer-motion für Animationen.'
  : 'Bitte erstelle HTML-Code mit CSS-Stilen und reveal.js für die Präsentation.'}

Strukturiere die Präsentation in folgende Abschnitte:
1. Einführung/Titelfolie
2. Überblick/Agenda
3. Hauptinhalt (3-5 Folien)
4. Schlussfolgerungen/Zusammenfassung
5. Handlungsaufforderung/nächste Schritte

Integriere auch Elemente, die für Menschenrechtsarbeit relevant sind, wie:
- Faktenbasierte Darstellungen
- Bezüge zu internationalen Standards
- Konkrete Fallbeispiele
- Handlungsmöglichkeiten

Liefere den vollständigen Code für die Präsentation.
`;
    
    try {
      const generatedCode = await this.aiService.generateContent({
        prompt: presentationPrompt,
        temperature: 0.4,
        max_tokens: 3500
      });
      
      // Code aus der Antwort extrahieren
      const presentationCode = this.extractCodeFromResponse(generatedCode, language);
      
      return {
        title: `Präsentation: ${topic}`,
        code: presentationCode,
        language,
        libraries,
        format,
        type: 'presentation',
        complexity,
        metadata: {
          topic,
          targetAudience,
          styleType,
          createdAt: new Date()
        }
      };
    } catch (error) {
      console.error('Fehler bei der Präsentationsgenerierung:', error);
      throw error;
    }
  }
  
  /**
   * Generiert eine interaktive Karte (Map)
   */
  private async generateInteractiveMap(task: ITask): Promise<any> {
    console.log('Generiere interaktive Karte...');
    
    const { 
      purpose, 
      mapType = 'world', // 'world', 'region', 'country'
      dataType = 'heatmap', // 'heatmap', 'markers', 'choropleth'
      complexity = 'medium',
      region = '' // Optional: spezifische Region oder Land
    } = task.parameters as any;
    
    const mapPrompt = `
Du bist ein Experte für die Erstellung von interaktiven Karten mit Leaflet.js oder MapBox.
Erstelle Code für eine interaktive ${mapType}-Karte, die ${purpose} visualisiert.

Die Karte sollte:
- Vom Typ ${dataType} sein
- Komplexitätsniveau: ${complexity}
${region ? `- Fokussiert auf die Region: ${region}` : ''}
- Für die Darstellung von Menschenrechtsdaten geeignet sein
- Interaktive Elemente wie Tooltips, Popups und Zoomen ermöglichen
- Responsives Design haben

Verwende HTML, CSS und JavaScript mit Leaflet.js.

Strukturiere den Code in:
1. HTML-Struktur mit einem Container für die Karte
2. CSS-Stile für das Layout
3. JavaScript-Code für die Karte und Interaktionen
4. Beispieldaten im passenden Format

Füge ausführliche Kommentare hinzu, die erklären, wie der Code funktioniert und wie er an echte Daten angepasst werden kann.

Liefere den vollständigen Code für die interaktive Karte.
`;
    
    try {
      const generatedCode = await this.aiService.generateContent({
        prompt: mapPrompt,
        temperature: 0.3,
        max_tokens: 3000
      });
      
      // Code aus der Antwort extrahieren
      const htmlCode = this.extractCodeFromResponse(generatedCode, 'html');
      const cssCode = this.extractCodeFromResponse(generatedCode, 'css');
      const jsCode = this.extractCodeFromResponse(generatedCode, 'javascript');
      
      return {
        title: `Interaktive Karte: ${purpose}`,
        code: {
          html: htmlCode,
          css: cssCode,
          javascript: jsCode
        },
        mapType,
        dataType,
        type: 'interactive-map',
        complexity,
        libraries: ['leaflet'],
        language: 'javascript',
        metadata: {
          purpose,
          region,
          createdAt: new Date()
        }
      };
    } catch (error) {
      console.error('Fehler bei der Kartengenerierung:', error);
      throw error;
    }
  }
  
  /**
   * Generiert eine HTML-Seite
   */
  private async generateHtmlPage(task: ITask): Promise<any> {
    console.log('Generiere HTML-Seite...');
    
    const { 
      topic,
      pageType = 'information', // 'information', 'form', 'portfolio', 'blog', 'dashboard'
      styleFramework = 'bootstrap', // 'bootstrap', 'tailwind', 'plain'
      complexity = 'medium',
      includeJs = true
    } = task.parameters as any;
    
    const htmlPrompt = `
Du bist ein Experte für Web-Entwicklung und erstellst eine ${pageType}-Seite zum Thema "${topic}".

Die Seite sollte:
- Mit ${styleFramework} gestaltet sein
- Komplexitätsniveau: ${complexity}
- Ein responsives Design haben
- Barrierefreiheit berücksichtigen
- Modern und benutzerfreundlich sein
${includeJs ? '- Interaktive JavaScript-Elemente enthalten' : ''}

Die HTML-Seite sollte folgende Elemente enthalten:
1. Eine klare Seitenstruktur mit Header, Hauptinhalt und Footer
2. Navigation und Menüelemente
3. Relevanten Inhalt zum Thema "${topic}"
4. Ansprechende Stilelemente${includeJs ? '\n5. Interaktive Komponenten wie Formulare, Dropdown-Menüs oder Animationen' : ''}

Strukturiere den Code in:
1. HTML-Struktur 
2. CSS-Stile${includeJs ? '\n3. JavaScript für interaktive Elemente' : ''}

Liefere den vollständigen Code für die HTML-Seite, einschließlich aller notwendigen Elemente und Bibliotheken.
`;
    
    try {
      const generatedCode = await this.aiService.generateContent({
        prompt: htmlPrompt,
        temperature: 0.3,
        max_tokens: 3000
      });
      
      // Code aus der Antwort extrahieren
      const htmlCode = this.extractCodeFromResponse(generatedCode, 'html');
      const cssCode = this.extractCodeFromResponse(generatedCode, 'css');
      const jsCode = includeJs ? this.extractCodeFromResponse(generatedCode, 'javascript') : '';
      
      return {
        title: `HTML-Seite: ${topic}`,
        code: {
          html: htmlCode,
          css: cssCode,
          javascript: jsCode
        },
        pageType,
        styleFramework,
        type: 'html-page',
        complexity,
        hasJs: includeJs,
        metadata: {
          topic,
          createdAt: new Date()
        }
      };
    } catch (error) {
      console.error('Fehler bei der HTML-Seitengenerierung:', error);
      throw error;
    }
  }
}