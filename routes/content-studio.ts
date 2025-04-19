import { Request, Response, Router } from 'express';
import { storage } from "../storage";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  ContentTemplate, 
  ContentType, 
  ROLE_DEFINITIONS, 
  AI_MODELS 
} from "../../shared/content-studio";
import { aiService } from "../services/aiService";
import { analyzeWithGemini } from "../services/gemini";
import { insertPromptLibrarySchema } from "../../shared/schema";

// Validierungsschemas
const contentGenerationSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein"),
  contentType: z.string(),
  role: z.string(),
  temperature: z.number().min(0).max(1),
  model: z.string(),
  promptTemplate: z.string(),
  systemPrompt: z.string().optional(),
  parameters: z.record(z.any()).optional()
});

const contentCreationSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein"),
  contentType: z.string(),
  content: z.string().min(1, "Inhalt darf nicht leer sein"),
  promptTemplate: z.string().optional(),
  promptParameters: z.record(z.any()).optional(),
  modelUsed: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  tags: z.array(z.string()).optional()
});

// Vordefinierte Content Templates
const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: "press-release",
    name: "Pressemitteilung",
    description: "Eine formelle Ankündigung für Medien zu wichtigen Nachrichten oder Entwicklungen",
    contentType: "press_release",
    promptTemplate: `Erstelle eine professionelle Pressemitteilung zum folgenden Thema: {{thema}}.

Die Pressemitteilung sollte folgende Elemente enthalten:
- Einen aussagekräftigen Titel
- Ort und Datum
- Einleitungsabsatz mit den wichtigsten Informationen (Wer, Was, Wann, Wo, Warum)
- Hauptteil mit Details und Hintergrundinformationen
- Zitate von relevanten Personen
- Abschluss mit Call-to-Action oder weiterführenden Informationen
- Kontaktinformationen

Ton und Stil: {{ton}}
Zusätzliche Informationen: {{zusatzinfo}}`,
    parameterSchema: {
      thema: {
        type: "string",
        title: "Thema",
        description: "Das Hauptthema der Pressemitteilung",
        required: true
      },
      ton: {
        type: "string",
        title: "Ton",
        description: "Der gewünschte Ton der Pressemitteilung",
        enum: ["Formal", "Informativ", "Dringend", "Ernsthaft", "Optimistisch"],
        default: "Informativ"
      },
      zusatzinfo: {
        type: "string",
        title: "Zusätzliche Informationen",
        description: "Weitere Details, die in der Pressemitteilung berücksichtigt werden sollen",
        format: "textarea"
      }
    },
    defaultRole: "journalist",
    systemPrompt: ROLE_DEFINITIONS["journalist"]?.systemPrompt,
    aiModels: ["gemini-1.5-pro", "claude-3-sonnet", "gpt-4o"],
    defaultModel: "gemini-1.5-pro",
    isPublic: true,
    examples: [],
    thumbnail: "/templates/press-release.svg",
    createdAt: new Date().toISOString(),
    popularity: 95
  },
  {
    id: "advocacy-statement",
    name: "Advocacy-Erklärung",
    description: "Eine überzeugende Erklärung zu einem Menschenrechtsthema für öffentliche Kampagnen",
    contentType: "article",
    promptTemplate: `Verfasse eine überzeugende Advocacy-Erklärung zum Thema: {{thema}}. 

Die Erklärung sollte:
- Die Problematik klar darstellen
- Die Menschenrechtsperspektive hervorheben
- Konkrete Forderungen formulieren
- Handlungsmöglichkeiten aufzeigen

Zielgruppe: {{zielgruppe}}
Wichtige zu berücksichtigende Aspekte: {{aspekte}}
Gewünschte Länge: {{laenge}} Wörter`,
    parameterSchema: {
      thema: {
        type: "string",
        title: "Thema",
        description: "Das zentrale Menschenrechtsthema der Erklärung",
        required: true
      },
      zielgruppe: {
        type: "string",
        title: "Zielgruppe",
        description: "An wen richtet sich die Erklärung primär?",
        enum: ["Politische Entscheidungsträger", "Allgemeine Öffentlichkeit", "Betroffene Gruppen", "Internationale Gemeinschaft", "Medien"],
        default: "Politische Entscheidungsträger"
      },
      aspekte: {
        type: "string",
        title: "Wichtige Aspekte",
        description: "Welche Perspektiven oder Argumente sollten unbedingt berücksichtigt werden?",
        format: "textarea"
      },
      laenge: {
        type: "string",
        title: "Gewünschte Länge",
        description: "Ungefähre Wortanzahl der Erklärung",
        enum: ["Kurz (300-500)", "Mittel (500-800)", "Lang (800-1200)"],
        default: "Mittel (500-800)"
      }
    },
    defaultRole: "advocate",
    systemPrompt: ROLE_DEFINITIONS["advocate"]?.systemPrompt,
    aiModels: ["gemini-1.5-pro", "claude-3-opus", "gpt-4o"],
    defaultModel: "claude-3-opus",
    isPublic: true,
    examples: [],
    thumbnail: "/templates/advocacy-statement.svg",
    createdAt: new Date().toISOString(),
    popularity: 87
  },
  {
    id: "legal-analysis",
    name: "Rechtliche Analyse",
    description: "Eine fachliche Analyse eines Menschenrechtsfalls oder einer rechtlichen Situation",
    contentType: "legal_document",
    promptTemplate: `Erstelle eine fundierte rechtliche Analyse zu folgendem Fall oder rechtlicher Fragestellung: {{fall_beschreibung}}

Die Analyse sollte enthalten:
- Eine präzise Darlegung des Sachverhalts
- Identifikation der relevanten Rechtsfragen
- Anwendbare Rechtsgrundlagen (national und international)
- Juristische Argumentation
- Schlussfolgerungen und rechtliche Einschätzung

Betroffene Menschenrechte: {{betroffene_rechte}}
Relevante Jurisdiktion: {{jurisdiktion}}`,
    parameterSchema: {
      fall_beschreibung: {
        type: "string",
        title: "Fallbeschreibung",
        description: "Detaillierte Beschreibung des rechtlichen Falls oder der Fragestellung",
        format: "textarea",
        required: true
      },
      betroffene_rechte: {
        type: "string",
        title: "Betroffene Rechte",
        description: "Welche Menschenrechte sind in diesem Fall betroffen?",
        format: "textarea"
      },
      jurisdiktion: {
        type: "string",
        title: "Relevante Jurisdiktion",
        description: "In welchem Rechtsraum bewegt sich der Fall? (z.B. Deutschland, EU, UN-System)",
        default: "Deutschland und internationales Recht"
      }
    },
    defaultRole: "legal_expert",
    systemPrompt: ROLE_DEFINITIONS["legal_expert"]?.systemPrompt,
    aiModels: ["gemini-1.5-pro", "claude-3-opus", "gpt-4o"],
    defaultModel: "claude-3-opus",
    isPublic: true,
    examples: [],
    thumbnail: "/templates/legal-analysis.svg",
    createdAt: new Date().toISOString(),
    popularity: 78
  },
  {
    id: "social-media-campaign",
    name: "Social Media Kampagne",
    description: "Eine Reihe von koordinierten Posts für soziale Medien zu einem Menschenrechtsthema",
    contentType: "social_media_post",
    promptTemplate: `Erstelle eine Reihe von Social Media Posts für eine Kampagne zum Thema: {{thema}}

Plattformen: {{plattformen}}
Kampagnenziel: {{ziel}}
Ton: {{ton}}
Call-to-Action: {{call_to_action}}
Verwendung von Hashtags: {{hashtags}}

Erstelle für jede Plattform angepasste Posts mit optimaler Länge und Format.`,
    parameterSchema: {
      thema: {
        type: "string",
        title: "Kampagnenthema",
        description: "Das zentrale Thema der Social Media Kampagne",
        required: true
      },
      plattformen: {
        type: "string",
        title: "Plattformen",
        description: "Für welche sozialen Medien sollen Posts erstellt werden?",
        enum: ["Twitter/X", "Instagram", "Facebook", "LinkedIn", "Alle genannten"],
        default: "Alle genannten"
      },
      ziel: {
        type: "string",
        title: "Kampagnenziel",
        description: "Was soll mit der Kampagne erreicht werden?",
        enum: ["Aufklärung", "Spendensammlung", "Mobilisierung", "Solidarität"],
        default: "Aufklärung"
      },
      ton: {
        type: "string",
        title: "Ton",
        description: "In welchem Ton sollen die Posts verfasst sein?",
        enum: ["Informativ", "Dringend", "Motivierend", "Emotional", "Sachlich"],
        default: "Informativ"
      },
      call_to_action: {
        type: "string",
        title: "Call-to-Action",
        description: "Welche Aktion sollen die Leser nach dem Lesen durchführen?",
        format: "textarea"
      },
      hashtags: {
        type: "string",
        title: "Hashtags",
        description: "Relevante Hashtags für die Kampagne (durch Komma getrennt)",
        default: "#Menschenrechte, #HumanRights"
      }
    },
    defaultRole: "social_media_expert",
    systemPrompt: ROLE_DEFINITIONS["social_media_expert"]?.systemPrompt,
    aiModels: ["gemini-1.5-flash", "gemini-1.5-pro", "claude-3-sonnet", "gpt-4o"],
    defaultModel: "gemini-1.5-flash",
    isPublic: true,
    examples: [],
    thumbnail: "/templates/social-media-campaign.svg",
    createdAt: new Date().toISOString(),
    popularity: 92
  },
  {
    id: "educational-module",
    name: "Bildungsmodul",
    description: "Ein strukturiertes Lernmodul zu einem Menschenrechtsthema für Bildungszwecke",
    contentType: "educational_material",
    promptTemplate: `Erstelle ein Bildungsmodul zum Thema: {{thema}}

Zielgruppe: {{zielgruppe}}
Lernziele: {{lernziele}}
Geschätzte Dauer: {{dauer}}
Format: {{format}}

Das Modul sollte enthalten:
- Einführung und Überblick
- Hauptinhalt mit strukturierten Abschnitten
- Aktivitäten oder Übungen
- Diskussionsfragen
- Ressourcen für weiterführendes Lernen`,
    parameterSchema: {
      thema: {
        type: "string",
        title: "Thema",
        description: "Das Hauptthema des Bildungsmoduls",
        required: true
      },
      zielgruppe: {
        type: "string",
        title: "Zielgruppe",
        description: "Für wen ist das Bildungsmodul konzipiert?",
        enum: ["Grundschule", "Sekundarstufe", "Hochschule", "Erwachsenenbildung", "Fachpublikum"],
        default: "Sekundarstufe"
      },
      lernziele: {
        type: "string",
        title: "Lernziele",
        description: "Was sollen die Lernenden nach Abschluss des Moduls wissen oder können?",
        format: "textarea"
      },
      dauer: {
        type: "string",
        title: "Dauer",
        description: "Geschätzte Dauer des Moduls",
        enum: ["1 Unterrichtsstunde", "2-3 Stunden", "Ganztägig", "Mehrere Tage"],
        default: "2-3 Stunden"
      },
      format: {
        type: "string",
        title: "Format",
        description: "In welchem Format soll das Modul präsentiert werden?",
        enum: ["Workshop", "Vorlesung", "Interaktives Seminar", "Selbstlerneinheit"],
        default: "Workshop"
      }
    },
    defaultRole: "educator",
    systemPrompt: ROLE_DEFINITIONS["educator"]?.systemPrompt,
    aiModels: ["gemini-1.5-pro", "claude-3-opus", "gpt-4o"],
    defaultModel: "gemini-1.5-pro",
    isPublic: true,
    examples: [],
    thumbnail: "/templates/educational-module.svg",
    createdAt: new Date().toISOString(),
    popularity: 85
  }
];

// Mock für erstellte Inhalte
const STUDIO_CONTENT = [
  {
    id: "1",
    title: "UN-Bericht zur Menschenrechtslage in XYZ",
    content: "# UN-Bericht zur Menschenrechtslage in XYZ\n\n## Zusammenfassung\n\nDieser Bericht dokumentiert die anhaltenden Menschenrechtsverletzungen in XYZ mit besonderem Augenmerk auf die Rechte von Minderheiten und den Zugang zur Justiz. Die von uns durchgeführte Untersuchung stützt sich auf Interviews mit 50 Betroffenen, 30 Zeugen und einer umfassenden Analyse von 200 dokumentierten Fällen.\n\n## Zentrale Erkenntnisse\n\n- Systematische Diskriminierung von ethnischen Minderheiten im Justizsystem\n- Eingeschränkter Zugang zu Rechtsbehelfen für Opfer von Menschenrechtsverletzungen\n- Fehlende Rechenschaftspflicht für Täter in Machtpositionen\n\n## Empfehlungen\n\n1. Einrichtung eines unabhängigen Überwachungsmechanismus\n2. Reform des Justizwesens zur Sicherstellung eines gleichberechtigten Zugangs\n3. Stärkung der Kapazitäten lokaler Menschenrechtsorganisationen",
    contentType: "report",
    promptTemplate: "",
    promptParameters: {},
    modelUsed: "gemini-1.5-pro",
    status: "published",
    tags: ["Bericht", "UN", "Menschenrechte", "Justiz"],
    createdAt: new Date('2025-03-05').toISOString(),
    updatedAt: new Date('2025-03-05').toISOString(),
    createdBy: "1"
  },
  {
    id: "2",
    title: "Pressemitteilung: Neue Kampagne zum Schutz von Journalisten",
    content: "# Pressemitteilung: Neue Kampagne zum Schutz von Journalisten\n\n## SOFORT ZUR VERÖFFENTLICHUNG\n\nDatum: 15. März 2025\n\nOrt: Berlin\n\n## Betreff: Start der internationalen Kampagne \"Schützt die Wahrheit\"\n\n### Haupttext:\n\nHeute kündigt die Organisation Menschenrechte Jetzt den Start ihrer neuen globalen Kampagne \"Schützt die Wahrheit\" an, die sich dem Schutz von Journalisten und der Pressefreiheit weltweit widmet. Die Kampagne reagiert auf die alarmierend zunehmenden Angriffe auf Medienschaffende, mit über 450 dokumentierten Fällen von Einschüchterung, Inhaftierung und Gewalt gegen Journalisten im vergangenen Jahr.\n\n\"Schützt die Wahrheit\" umfasst eine Reihe von Initiativen, darunter ein Notfall-Unterstützungsfonds für gefährdete Journalisten, ein globales Überwachungssystem für Bedrohungen der Pressefreiheit und gezielte Advocacy-Arbeit bei Regierungen und internationalen Institutionen.\n\n\"Wenn wir die Wahrheitssuchenden nicht schützen können, verlieren wir unser wichtigstes Werkzeug gegen Unterdrückung und Unrecht,\" erklärt Dr. Maria Schmidt, Leiterin der Kampagne. \"Diese Initiative stellt sicher, dass Journalisten die notwendige Unterstützung erhalten, um ihre lebenswichtige Arbeit fortzusetzen.\"\n\n### Zitat:\n\"Eine freie Presse ist nicht nur ein Grundpfeiler der Demokratie, sondern auch entscheidend für den Schutz der Menschenrechte. Ohne mutige Journalisten, die Missstände aufdecken, bleiben Menschenrechtsverletzungen im Verborgenen.\" — Dr. Thomas Weber, Vorstandsvorsitzender, Menschenrechte Jetzt\n\n### Über Menschenrechte Jetzt:\nMenschenrechte Jetzt ist eine internationale Nichtregierungsorganisation, die sich für den Schutz und die Förderung der Menschenrechte weltweit einsetzt. Mit Büros in 15 Ländern führt die Organisation Forschung, Advocacy und Bildungsprogramme durch.\n\n### Kontakt:\nLisa Müller\nPressesprecherin\nlisa.mueller@menschenrechte-jetzt.org\n+49 30 1234567\n\n---\nEnde",
    contentType: "press_release",
    promptTemplate: "Erstelle eine professionelle Pressemitteilung zum folgenden Thema: {{thema}}...",
    promptParameters: {
      thema: "Start einer neuen Kampagne zum Schutz von Journalisten",
      ton: "Informativ"
    },
    modelUsed: "gemini-1.5-flash",
    status: "draft",
    tags: ["Pressemitteilung", "Journalismus", "Pressefreiheit"],
    createdAt: new Date('2025-03-12').toISOString(),
    updatedAt: new Date('2025-03-15').toISOString(),
    createdBy: "1"
  },
  {
    id: "3",
    title: "Social Media Post: Internationaler Tag der Menschenrechte",
    content: "# Social Media Post für Instagram\n\n## Thema: Internationaler Tag der Menschenrechte\n\n### Haupttext:\nHeute am #TagDerMenschenrechte erinnern wir uns daran, dass Menschenrechte keine abstrakten Ideale, sondern tägliche Realität sein müssen. Jeder Mensch verdient Würde, Gleichheit und Gerechtigkeit – ohne Ausnahme.\n\nUnsere Organisation arbeitet unermüdlich daran, Menschenrechte zu schützen. Im letzten Jahr haben wir:\n✅ 120 Betroffenen rechtliche Unterstützung geboten\n✅ 15 Bildungsprogramme in Schulen durchgeführt\n✅ 5 erfolgreiche Advocacy-Kampagnen geleitet\n\nSei Teil des Wandels! Folge unserer Arbeit und erfahre, wie du dich engagieren kannst.\n\n### Hashtags:\n#Menschenrechte #Gerechtigkeit #Gleichheit #MenschenrechteJetzt #TagDerMenschenrechte #StandUpForHumanRights\n\n### Call to Action:\nLink in Bio: Entdecke, wie du die Menschenrechtsarbeit unterstützen kannst\n\n### Link:\nhttps://www.menschenrechte-jetzt.org/mitmachen",
    contentType: "social_media_post",
    promptTemplate: "",
    promptParameters: {},
    modelUsed: "gemini-1.5-flash",
    status: "published",
    tags: ["Social Media", "Menschenrechte", "Instagram"],
    createdAt: new Date('2025-03-20').toISOString(),
    updatedAt: new Date('2025-03-20').toISOString(),
    createdBy: "1"
  }
];

// Routen für Content Studio
export default function registerContentStudioRoutes(app: Router) {
  // API-Endpunkt für Prompt-Bibliothek
  app.get('/api/prompt-library', async (req: Request, res: Response) => {
    try {
      const promptLibrary = await storage.getPromptLibrary();
      res.json(promptLibrary);
    } catch (error) {
      res.status(500).json({ 
        error: 'Fehler beim Abrufen der Prompt-Bibliothek', 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      });
    }
  });

  app.get('/api/prompt-library/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Ungültige Prompt-ID" });
      }
      
      const prompt = await storage.getPromptLibraryItem(id);
      if (!prompt) {
        return res.status(404).json({ error: "Prompt nicht gefunden" });
      }
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ 
        error: 'Fehler beim Abrufen des Prompts', 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      });
    }
  });

  app.post('/api/prompt-library', async (req: Request, res: Response) => {
    try {
      const parsedData = insertPromptLibrarySchema.parse(req.body);
      const prompt = await storage.createPromptLibraryItem(parsedData);
      res.status(201).json(prompt);
    } catch (error) {
      if (error && typeof error === 'object' && error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Ungültige Prompt-Daten", 
          details: fromZodError(error) 
        });
      }
      res.status(500).json({ 
        error: 'Fehler beim Erstellen des Prompts', 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      });
    }
  });

  app.patch('/api/prompt-library/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Ungültige Prompt-ID" });
      }
      
      const updatedPrompt = await storage.updatePromptLibraryItem(id, req.body);
      if (!updatedPrompt) {
        return res.status(404).json({ error: "Prompt nicht gefunden" });
      }
      
      res.json(updatedPrompt);
    } catch (error) {
      res.status(500).json({ 
        error: 'Fehler beim Aktualisieren des Prompts', 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      });
    }
  });

  app.delete('/api/prompt-library/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Ungültige Prompt-ID" });
      }
      
      const success = await storage.deletePromptLibraryItem(id);
      if (!success) {
        return res.status(404).json({ error: "Prompt nicht gefunden" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ 
        error: 'Fehler beim Löschen des Prompts', 
        message: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      });
    }
  });

  // API-Endpunkt für Templates abrufen
  app.get('/api/studio-templates', (req: Request, res: Response) => {
    res.json(CONTENT_TEMPLATES);
  });

  // API-Endpunkt für Template nach ID abrufen
  app.get('/api/studio-templates/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const template = CONTENT_TEMPLATES.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template nicht gefunden' });
    }
    
    res.json(template);
  });

  // API-Endpunkt für Rollen abrufen
  app.get('/api/studio-roles', (req: Request, res: Response) => {
    const roles = Object.entries(ROLE_DEFINITIONS).map(([key, value]) => ({
      roleId: key,
      ...value
    }));
    
    res.json(roles);
  });

  // API-Endpunkt für verfügbare Modelle abrufen
  app.get('/api/studio-models', (req: Request, res: Response) => {
    const models = Object.entries(AI_MODELS).map(([key, value]) => ({
      modelId: key,
      ...value
    }));
    
    res.json(models);
  });

  // API-Endpunkt für Content-Generierung
  app.post('/api/generate-content', async (req: Request, res: Response) => {
    try {
      const validationResult = contentGenerationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const { 
        promptTemplate, 
        systemPrompt, 
        temperature = 0.7, 
        model = 'gemini-1.5-flash'
      } = validationResult.data;

      // Konfiguriere Parameter für den AI-Service
      const generationOptions = {
        prompt: promptTemplate,
        temperature,
        system_prompt: systemPrompt,
        model
      };

      // Generiere Inhalt mit Gemini
      const prompt = `
        Du bist ein professioneller Content-Ersteller für Menschenrechtsorganisationen.
        Erstelle folgenden Inhalt:
        
        Titel: ${validationResult.data.title}
        Typ: ${validationResult.data.contentType}
        
        Anweisungen: ${promptTemplate}
        
        Antworte nur mit dem formatierten Inhalt, ohne Einleitung oder Erklärung.
      `;
      
      const content = await analyzeWithGemini(prompt);

      res.json({
        content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Fehler bei der Content-Generierung:', error);
      res.status(500).json({ 
        error: 'Fehler bei der Content-Generierung',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // API-Endpunkt für Content abrufen
  app.get('/api/studio-content', (req: Request, res: Response) => {
    // TODO: Implementiere die Abfrage aus der Datenbank
    res.json(STUDIO_CONTENT);
  });

  // API-Endpunkt für Content erstellen
  app.post('/api/studio-content', async (req: Request, res: Response) => {
    try {
      const validationResult = contentCreationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const contentData = validationResult.data;
      
      // TODO: Speichere in der Datenbank
      const newContent = {
        id: Date.now().toString(),
        ...contentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "1" // Hier sollte die tatsächliche Benutzer-ID verwendet werden
      };
      
      STUDIO_CONTENT.push(newContent as any);
      
      res.status(201).json(newContent);
    } catch (error) {
      console.error('Fehler beim Erstellen des Contents:', error);
      res.status(500).json({ 
        error: 'Fehler beim Erstellen des Contents',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // API-Endpunkt für Content nach ID abrufen
  app.get('/api/studio-content/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const content = STUDIO_CONTENT.find(c => c.id === id);
    
    if (!content) {
      return res.status(404).json({ error: 'Content nicht gefunden' });
    }
    
    res.json(content);
  });

  // API-Endpunkt für Content aktualisieren
  app.patch('/api/studio-content/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const contentIndex = STUDIO_CONTENT.findIndex(c => c.id === id);
      
      if (contentIndex === -1) {
        return res.status(404).json({ error: 'Content nicht gefunden' });
      }
      
      // Validiere nur die übergebenen Felder
      const updateData = req.body;
      
      // Update durchführen
      const updatedContent = {
        ...STUDIO_CONTENT[contentIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      STUDIO_CONTENT[contentIndex] = updatedContent;
      
      res.json(updatedContent);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Contents:', error);
      res.status(500).json({ 
        error: 'Fehler beim Aktualisieren des Contents',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    }
  });

  // API-Endpunkt für Content löschen
  app.delete('/api/studio-content/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const contentIndex = STUDIO_CONTENT.findIndex(c => c.id === id);
    
    if (contentIndex === -1) {
      return res.status(404).json({ error: 'Content nicht gefunden' });
    }
    
    STUDIO_CONTENT.splice(contentIndex, 1);
    
    res.status(204).send();
  });
}