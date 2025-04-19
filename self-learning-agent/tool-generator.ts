/**
 * Tool Generator - Entwickelt und implementiert neue Webanwendungs-Tools
 * 
 * Diese Komponente des selbstlernenden Agenten ist darauf spezialisiert,
 * neue Werkzeuge und Mini-Anwendungen zu konzipieren, zu entwickeln und
 * in das bestehende System zu integrieren.
 */

import { generateAIContentService } from '../../../ai-service-original';
import fs from 'fs';
import path from 'path';
import { GeneratedSolution, InteractionPattern } from '../self-learning-agent';

// Interface für ein generiertes Tool
export interface GeneratedTool {
  id: string;
  name: string;
  description: string;
  patternId: string;
  category: 'utility' | 'visualization' | 'communication' | 'analysis' | 'integration';
  complexity: 'low' | 'medium' | 'high';
  requiredComponents: {
    frontend: string[];
    backend: string[];
    styles: string[];
  };
  files: {
    path: string;
    content: string;
    type: 'component' | 'service' | 'route' | 'model' | 'style' | 'utility';
  }[];
  status: 'proposed' | 'approved' | 'implemented' | 'rejected';
  createdAt: Date;
  implementedAt?: Date;
  metrics?: {
    usageCount: number;
    userFeedback: { positive: number; negative: number };
    averageRating: number;
  };
}

/**
 * Tool-Generator-Klasse zur Entwicklung neuer Webanwendungstools
 */
export class ToolGenerator {
  private static instance: ToolGenerator;
  private generatedTools: GeneratedTool[] = [];
  private isActive = true;
  private testMode = true; // Im Testmodus werden keine tatsächlichen Änderungen vorgenommen
  private basePath = './';
  
  private constructor() {
    this.loadGeneratedTools();
    console.log('Tool Generator initialisiert');
  }

  // Singleton-Pattern
  public static getInstance(): ToolGenerator {
    if (!ToolGenerator.instance) {
      ToolGenerator.instance = new ToolGenerator();
    }
    return ToolGenerator.instance;
  }

  /**
   * Aktiviert oder deaktiviert den Tool-Generator
   */
  public setActive(active: boolean): void {
    this.isActive = active;
    console.log(`Tool Generator ${active ? 'aktiviert' : 'deaktiviert'}`);
  }

  /**
   * Aktiviert oder deaktiviert den Testmodus
   */
  public setTestMode(testMode: boolean): void {
    this.testMode = testMode;
    console.log(`Tool Generator Testmodus ${testMode ? 'aktiviert' : 'deaktiviert'}`);
  }

  /**
   * Generiert ein neues Tool basierend auf einem identifizierten Muster
   */
  public async generateTool(pattern: InteractionPattern): Promise<GeneratedTool | null> {
    if (!this.isActive) return null;

    console.log(`Generiere neues Tool basierend auf Muster: "${pattern.pattern}"`);

    try {
      // Analysiere das Muster und generiere ein Konzept für ein Tool
      const toolConcept = await this.designToolConcept(pattern);
      
      if (!toolConcept) {
        console.log('Konnte kein geeignetes Tool-Konzept generieren');
        return null;
      }

      // Generiere die Dateien für das Tool
      const toolFiles = await this.generateToolFiles(toolConcept, pattern);
      
      if (!toolFiles || toolFiles.length === 0) {
        console.log('Konnte keine Dateien für das Tool generieren');
        return null;
      }

      // Erstelle das generierte Tool-Objekt
      const generatedTool: GeneratedTool = {
        id: `tool-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: toolConcept.name,
        description: toolConcept.description,
        patternId: pattern.id,
        category: toolConcept.category,
        complexity: toolConcept.complexity,
        requiredComponents: toolConcept.requiredComponents,
        files: toolFiles,
        status: 'proposed',
        createdAt: new Date(),
        metrics: {
          usageCount: 0,
          userFeedback: { positive: 0, negative: 0 },
          averageRating: 0
        }
      };

      this.generatedTools.push(generatedTool);
      this.saveGeneratedTools();

      console.log(`Neues Tool "${generatedTool.name}" generiert und vorgeschlagen`);
      return generatedTool;
    } catch (error) {
      console.error('Fehler bei der Generierung eines Tools:', error);
      return null;
    }
  }

  /**
   * Implementiert ein vorgeschlagenes Tool
   */
  public async implementTool(toolId: string): Promise<boolean> {
    if (!this.isActive) return false;

    const tool = this.generatedTools.find(t => t.id === toolId);
    
    if (!tool) {
      console.log(`Tool mit ID ${toolId} nicht gefunden`);
      return false;
    }

    if (tool.status === 'implemented') {
      console.log(`Tool "${tool.name}" ist bereits implementiert`);
      return true;
    }

    console.log(`Implementiere Tool "${tool.name}"...`);

    if (this.testMode) {
      console.log('Testmodus: Keine tatsächliche Implementierung durchgeführt');
      tool.status = 'approved'; // Im Testmodus nur als genehmigt markieren
      this.saveGeneratedTools();
      return true;
    }

    try {
      // Dateien für das Tool erstellen
      for (const file of tool.files) {
        const filePath = path.join(this.basePath, file.path);
        const dirPath = path.dirname(filePath);

        // Erstelle Verzeichnisse, falls sie nicht existieren
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        // Schreibe die Datei
        fs.writeFileSync(filePath, file.content);
        console.log(`Datei ${filePath} erstellt`);
      }

      // Tool als implementiert markieren
      tool.status = 'implemented';
      tool.implementedAt = new Date();
      this.saveGeneratedTools();

      console.log(`Tool "${tool.name}" erfolgreich implementiert`);
      return true;
    } catch (error) {
      console.error(`Fehler bei der Implementierung des Tools "${tool.name}":`, error);
      return false;
    }
  }

  /**
   * Gibt alle generierten Tools zurück
   */
  public getGeneratedTools(): GeneratedTool[] {
    return [...this.generatedTools];
  }

  /**
   * Gibt ein spezifisches Tool zurück
   */
  public getToolById(toolId: string): GeneratedTool | undefined {
    return this.generatedTools.find(t => t.id === toolId);
  }

  /**
   * Entwirft ein Konzept für ein neues Tool basierend auf einem Muster
   */
  private async designToolConcept(pattern: InteractionPattern): Promise<any> {
    const prompt = `
Als erfahrener Software-Entwickler, entwerfe ein neues Web-Tool basierend auf dem folgenden erkannten Nutzungsmuster:

ERKANNTES MUSTER:
${pattern.pattern}

DETAILLIERTE BESCHREIBUNG:
${pattern.description}

POTENTIELLE LÖSUNG (falls vorhanden):
${pattern.potentialSolution || 'Keine vorgeschlagen'}

Entwerfe ein kompaktes, nützliches Tool, das in eine bestehende React-Webanwendung integriert werden kann. Das Tool sollte das identifizierte Problem oder Bedürfnis adressieren.

Antworte im folgenden JSON-Format:
{
  "name": "Name des Tools",
  "description": "Detaillierte Beschreibung des Tools und seiner Funktionalität",
  "category": "Eine der folgenden Kategorien: utility, visualization, communication, analysis, integration",
  "complexity": "Eine der folgenden Komplexitätsstufen: low, medium, high",
  "requiredComponents": {
    "frontend": ["Liste benötigter Frontend-Bibliotheken/Komponenten"],
    "backend": ["Liste benötigter Backend-Services"],
    "styles": ["Liste benötigter UI-Komponenten wie Buttons, Cards, etc."]
  },
  "fileStructure": [
    {
      "path": "Relativer Pfad zur Datei",
      "description": "Kurze Beschreibung des Dateiinhalts",
      "type": "Eine der folgenden Typen: component, service, route, model, style, utility"
    }
  ]
}
`;

    try {
      const response = await generateAIContentService({
        prompt,
        model: 'gemini-1.5-flash',
        systemPrompt: 'Du bist ein erfahrener Full-Stack-Entwickler, der neue Webanwendungstools konzipiert.',
        maxTokens: 2048
      });

      // Extrahiere JSON aus der Antwort
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        console.log('Konnte kein valides JSON-Format in der KI-Antwort finden');
        return null;
      }
    } catch (error) {
      console.error('Fehler beim Entwerfen des Tool-Konzepts:', error);
      return null;
    }
  }

  /**
   * Generiert die Dateien für ein Tool
   */
  private async generateToolFiles(toolConcept: any, pattern: InteractionPattern): Promise<any[]> {
    const files = [];

    for (const file of toolConcept.fileStructure) {
      const fileContent = await this.generateFileContent(file, toolConcept, pattern);
      
      if (fileContent) {
        files.push({
          path: file.path,
          content: fileContent,
          type: file.type
        });
      }
    }

    return files;
  }

  /**
   * Generiert den Inhalt einer Datei für das Tool
   */
  private async generateFileContent(file: any, toolConcept: any, pattern: InteractionPattern): Promise<string | null> {
    const prompt = `
Generiere den Inhalt für die folgende Datei eines neuen Web-Tools:

TOOL-NAME: ${toolConcept.name}
TOOL-BESCHREIBUNG: ${toolConcept.description}
DATEI-PFAD: ${file.path}
DATEI-TYP: ${file.type}
DATEI-BESCHREIBUNG: ${file.description}

PATTERN, DAS DIESES TOOL ADRESSIERT:
${pattern.pattern}

ERFORDERLICHE FRONTEND-KOMPONENTEN: ${toolConcept.requiredComponents.frontend.join(', ')}
ERFORDERLICHE BACKEND-SERVICES: ${toolConcept.requiredComponents.backend.join(', ')}
ERFORDERLICHE UI-KOMPONENTEN: ${toolConcept.requiredComponents.styles.join(', ')}

Der Code sollte:
1. Modernen Best Practices folgen
2. Gut dokumentiert sein
3. Typensicher sein (TypeScript)
4. Zur bestehenden Anwendungsarchitektur passen
5. Keine externen Abhängigkeiten einführen, die nicht bereits in der Anwendung vorhanden sind

Generiere nur den Dateiinhalt, keine Erklärungen davor oder danach.
`;

    try {
      const response = await generateAIContentService({
        prompt,
        model: 'gemini-1.5-flash',
        systemPrompt: 'Du bist ein erfahrener Entwickler, der qualitativ hochwertigen Code schreibt.',
        maxTokens: 3072
      });

      // Entferne Code-Block-Markierungen
      let cleanedResponse = response.replace(/```(?:typescript|tsx|javascript|jsx|css|scss|html|json)?\n/g, '');
      cleanedResponse = cleanedResponse.replace(/```/g, '');

      return cleanedResponse.trim();
    } catch (error) {
      console.error(`Fehler beim Generieren des Inhalts für Datei ${file.path}:`, error);
      return null;
    }
  }

  /**
   * Fragt nach Benutzerfeedback zu einem implementierten Tool
   */
  public requestFeedback(toolId: string, userId: string): string {
    const tool = this.generatedTools.find(t => t.id === toolId);
    
    if (!tool) {
      return 'Tool nicht gefunden';
    }

    return `
Wir haben basierend auf Benutzerinteraktionen ein neues Tool entwickelt:

"${tool.name}" - ${tool.description}

Wir würden gerne Ihr Feedback dazu hören. War dieses Tool hilfreich für Ihre Arbeit?
`;
  }

  /**
   * Zeichnet Benutzerfeedback zu einem Tool auf
   */
  public recordFeedback(toolId: string, isPositive: boolean, rating: number = 0): boolean {
    const tool = this.generatedTools.find(t => t.id === toolId);
    
    if (!tool || !tool.metrics) {
      console.log(`Tool mit ID ${toolId} nicht gefunden oder hat keine Metriken`);
      return false;
    }

    // Aktualisiere die Feedback-Metriken
    if (isPositive) {
      tool.metrics.userFeedback.positive++;
    } else {
      tool.metrics.userFeedback.negative++;
    }

    // Aktualisiere die durchschnittliche Bewertung
    if (rating > 0) {
      const totalRatings = tool.metrics.userFeedback.positive + tool.metrics.userFeedback.negative;
      tool.metrics.averageRating = ((tool.metrics.averageRating * (totalRatings - 1)) + rating) / totalRatings;
    }

    this.saveGeneratedTools();
    return true;
  }

  /**
   * Lädt die generierten Tools aus dem Speicher
   */
  private loadGeneratedTools(): void {
    try {
      const toolsFilePath = path.join(this.basePath, 'data', 'generated-tools.json');
      
      if (fs.existsSync(toolsFilePath)) {
        const toolsData = fs.readFileSync(toolsFilePath, 'utf8');
        this.generatedTools = JSON.parse(toolsData);
      }
    } catch (error) {
      console.error('Fehler beim Laden der generierten Tools:', error);
      this.generatedTools = [];
    }
  }

  /**
   * Speichert die generierten Tools
   */
  private saveGeneratedTools(): void {
    try {
      const dataDir = path.join(this.basePath, 'data');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const toolsFilePath = path.join(dataDir, 'generated-tools.json');
      fs.writeFileSync(toolsFilePath, JSON.stringify(this.generatedTools, null, 2));
    } catch (error) {
      console.error('Fehler beim Speichern der generierten Tools:', error);
    }
  }
}

// Singleton-Instanz
let toolGeneratorInstance: ToolGenerator | null = null;

/**
 * Gibt die Tool-Generator-Instanz zurück
 */
export function getToolGenerator(): ToolGenerator {
  if (!toolGeneratorInstance) {
    toolGeneratorInstance = ToolGenerator.getInstance();
  }
  return toolGeneratorInstance;
}