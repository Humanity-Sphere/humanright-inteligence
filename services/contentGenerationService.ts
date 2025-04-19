import { genAI } from './gemini';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  }
];

/**
 * Verschiedene Arten von generierbaren Inhalten
 */
export type ContentType = 
  'report' | 
  'article' | 
  'campaign' | 
  'official_letter' | 
  'press_release' | 
  'social_media' | 
  'legal_analysis' | 
  'educational';

/**
 * Verschiedene Tonarten für die Inhaltsgenerierung
 */
export type ToneStyle = 
  'formal' | 
  'informative' | 
  'persuasive' | 
  'urgent' | 
  'educational' | 
  'emotional' | 
  'factual';

/**
 * Optionen für die Inhaltsgenerierung
 */
export interface ContentGenerationOptions {
  contentType: ContentType;
  audience?: string;
  tone?: ToneStyle;
  length?: 'short' | 'medium' | 'long';
  includeData?: boolean;
  language?: string;
  focusPoints?: string[];
  dataPoints?: any[];
}

/**
 * Generiert Inhalte basierend auf den angegebenen Optionen
 * @param prompt Der Basis-Prompt für die Inhaltsgenerierung
 * @param options Optionen für die Inhaltsgenerierung
 * @returns Generierter Inhalt als String
 */
export async function generateContent(prompt: string, options: ContentGenerationOptions): Promise<string> {
  try {
    // Modell initialisieren
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings
    });

    // Prompt mit Optionen anreichern
    const enrichedPrompt = enrichPromptWithOptions(prompt, options);

    // Inhalt generieren
    const result = await model.generateContent(enrichedPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Fehler bei der Inhaltsgenerierung:", error);
    throw new Error(`Fehler bei der Inhaltsgenerierung: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Reichert den Basis-Prompt mit den Optionen an
 * @param basePrompt Der Basis-Prompt
 * @param options Die Optionen für die Inhaltsgenerierung
 * @returns Ein angereicherter Prompt
 */
function enrichPromptWithOptions(basePrompt: string, options: ContentGenerationOptions): string {
  let enrichedPrompt = basePrompt;

  // Inhaltstyp hinzufügen
  enrichedPrompt += `\nErstelle folgenden Inhaltstyp: ${getContentTypeDescription(options.contentType)}`;

  // Zielgruppe hinzufügen
  if (options.audience) {
    enrichedPrompt += `\nZielgruppe: ${options.audience}`;
  }

  // Tonfall hinzufügen
  if (options.tone) {
    enrichedPrompt += `\nTonfall: ${getToneDescription(options.tone)}`;
  }

  // Länge hinzufügen
  if (options.length) {
    const lengthMap = {
      short: "kurz (ca. 200-300 Wörter)",
      medium: "mittel (ca. 500-700 Wörter)",
      long: "lang (ca. 1000-1500 Wörter)"
    };
    enrichedPrompt += `\nLänge: ${lengthMap[options.length]}`;
  }

  // Sprache hinzufügen
  if (options.language) {
    enrichedPrompt += `\nSprache: ${options.language}`;
  }

  // Schwerpunkte hinzufügen
  if (options.focusPoints && options.focusPoints.length > 0) {
    enrichedPrompt += `\nDiese Punkte besonders hervorheben:\n- ${options.focusPoints.join('\n- ')}`;
  }

  // Datenpunkte hinzufügen
  if (options.includeData && options.dataPoints && options.dataPoints.length > 0) {
    enrichedPrompt += `\nBeziehe folgende Daten in den Inhalt ein:\n`;
    options.dataPoints.forEach(data => {
      enrichedPrompt += `- ${JSON.stringify(data)}\n`;
    });
  }

  return enrichedPrompt;
}

/**
 * Gibt eine Beschreibung für den Inhaltstyp zurück
 */
function getContentTypeDescription(contentType: ContentType): string {
  const descriptions: Record<ContentType, string> = {
    report: "Einen formellen Bericht mit strukturierten Abschnitten und faktenbasierter Analyse",
    article: "Einen informativen Artikel, der ein Thema umfassend darstellt",
    campaign: "Kampagnenmaterial, das zum Handeln motiviert",
    official_letter: "Ein offizielles Schreiben an eine Institution oder Organisation",
    press_release: "Eine Pressemitteilung für Medien und Öffentlichkeit",
    social_media: "Inhalte für soziale Medien mit kurzen, prägnanten Botschaften",
    legal_analysis: "Eine rechtliche Analyse mit Bezug zu relevanten Gesetzen und Vorschriften",
    educational: "Bildungsmaterial, das komplexe Konzepte verständlich erklärt"
  };

  return descriptions[contentType] || contentType;
}

/**
 * Gibt eine Beschreibung für den Tonfall zurück
 */
function getToneDescription(tone: ToneStyle): string {
  const descriptions: Record<ToneStyle, string> = {
    formal: "Formell und professionell",
    informative: "Sachlich und informativ",
    persuasive: "Überzeugend und argumentativ",
    urgent: "Dringend und handlungsorientiert",
    educational: "Lehrreich und erklärend",
    emotional: "Emotional und persönlich",
    factual: "Faktenbasiert und objektiv"
  };

  return descriptions[tone] || tone;
}

/**
 * Service für die intelligente Inhaltsgenerierung
 */
export class ContentGenerationService {
  /**
   * Generiert Inhalt basierend auf einem Thema und Optionen
   */
  async generateContent(
    topic: string,
    context: string,
    options: ContentGenerationOptions
  ): Promise<string> {
    try {
      //Using the new generateContent function
      return await generateContent( `Bitte erstelle einen Text zum Thema "${topic}" mit folgendem Kontext: ${context}`, options);
    } catch (error) {
      console.error("Content generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Content generation failed: ${errorMessage}`);
    }
  }

  //Rest of the original methods remain unchanged
  /**
   * Generiert maßgeschneiderte Berichte basierend auf Analysen und Dokumenten
   */
  async generateReport(
    title: string,
    documentAnalyses: any[],
    patternAnalyses: any[],
    options: {
      reportType?: 'summary' | 'detailed' | 'technical' | 'public';
      includeCaseStudies?: boolean;
      includeRecommendations?: boolean;
      includeTimeline?: boolean;
      audience?: string;
      tone?: ToneStyle;
      language?: string;
    }
  ): Promise<string> {
    try {
      // Gemini Modell verwenden
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings
      });

      // Standardwerte festlegen
      const reportType = options.reportType || 'detailed';
      const tone = options.tone || 'formal';
      const language = options.language || 'Deutsch';

      // Berichtstypen
      const reportTypeDescriptions = {
        summary: "einen kurzen Überblicksbericht mit den wichtigsten Erkenntnissen",
        detailed: "einen detaillierten Bericht mit gründlicher Analyse aller Aspekte",
        technical: "einen technischen Bericht für Fachexperten mit detaillierter Methodik",
        public: "einen öffentlichkeitswirksamen Bericht für breite Verbreitung"
      };

      // Tonstile
      const toneDescriptions: Record<ToneStyle, string> = {
        formal: "formell und professionell",
        informative: "informativ und sachlich",
        persuasive: "überzeugend und motivierend",
        urgent: "dringend und zum Handeln auffordernd",
        educational: "bildend und erklärend",
        emotional: "emotional und mitfühlend",
        factual: "faktenbasiert und objektiv"
      };

      // Systemanweisung
      const systemPrompt = `Du bist ein Expertenassistent für Menschenrechtsverteidiger, der hochwertige Berichte auf Basis von Dokumentenanalysen und Mustererkennung erstellt. 
Erstelle ${reportTypeDescriptions[reportType]} im ${toneDescriptions[tone]} Ton.`;

      // Dokumentenanalyse aufbereiten
      const documentAnalysesStr = documentAnalyses.length > 0 
        ? `DOKUMENTENANALYSEN:\n${JSON.stringify(documentAnalyses, null, 2)}`
        : "Es liegen keine Dokumentenanalysen vor.";

      // Musteranalyse aufbereiten
      const patternAnalysesStr = patternAnalyses.length > 0
        ? `MUSTERANALYSEN:\n${JSON.stringify(patternAnalyses, null, 2)}`
        : "Es liegen keine Musteranalysen vor.";

      // Optionale Abschnitte
      const optionalSections = [];
      if (options.includeCaseStudies) optionalSections.push("Fallstudien");
      if (options.includeRecommendations) optionalSections.push("Handlungsempfehlungen");
      if (options.includeTimeline) optionalSections.push("Zeitlicher Verlauf");

      const optionalSectionsStr = optionalSections.length > 0
        ? `\nFolgende zusätzliche Abschnitte sollten im Bericht enthalten sein:\n- ${optionalSections.join('\n- ')}`
        : "";

      // Audienz-spezifische Anpassung
      let audienceGuidance = "";
      if (options.audience) {
        audienceGuidance = `\nDer Bericht richtet sich an folgende Zielgruppe: ${options.audience}.`;
      }

      // Benutzeranfrage zusammenstellen
      const userPrompt = `Bitte erstelle einen Bericht mit dem Titel "${title}" in ${language}.

${documentAnalysesStr}

${patternAnalysesStr}

${audienceGuidance}
${optionalSectionsStr}

Der Bericht sollte eine klare Struktur mit Einleitung, Hauptteil, Schlussfolgerungen und gegebenenfalls Handlungsempfehlungen haben.
Verwende Zwischenüberschriften, Aufzählungspunkten und ggf. Tabellen für eine optimale Lesbarkeit.

Alle Quellen sollten korrekt zitiert werden, und die Darstellung sollte objektiv und faktenbasiert sein.`;

      // Generiere den Bericht
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      const generatedReport = response.text();

      return generatedReport;
    } catch (error) {
      console.error("Report generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Report generation failed: ${errorMessage}`);
    }
  }

  /**
   * Assistiert bei rechtlichen Fragestellungen und generiert rechtliche Einschätzungen
   */
  async generateLegalAssistance(
    question: string,
    context: string,
    relevantDocuments?: any[],
    options?: {
      jurisdiction?: string;
      requestType?: 'analysis' | 'advice' | 'template' | 'reference';
      tone?: ToneStyle;
      language?: string;
    }
  ): Promise<string> {
    try {
      // Gemini Modell verwenden
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings
      });

      // Standardwerte festlegen
      const requestType = options?.requestType || 'analysis';
      const tone = options?.tone || 'formal';
      const language = options?.language || 'Deutsch';
      const jurisdiction = options?.jurisdiction || 'international';

      // Arten von rechtlichen Anfragen
      const requestTypeDescriptions = {
        analysis: "eine rechtliche Analyse",
        advice: "eine rechtliche Beratung",
        template: "eine Vorlage für ein rechtliches Dokument",
        reference: "einen Überblick über relevante Rechtsquellen"
      };

      // Systemanweisung
      const systemPrompt = `Du bist ein Rechtsexperte für Menschenrechte und internationale Menschenrechtsstandards.
Deine Aufgabe ist es, ${requestTypeDescriptions[requestType]} zu erstellen, die Menschenrechtsverteidigern helfen kann.
Dies ist keine Rechtsberatung im engeren Sinne, sondern eine Bildungs- und Informationsressource.`;

      // Relevante Dokumente aufbereiten
      const documentsStr = relevantDocuments && relevantDocuments.length > 0 
        ? `RELEVANTE DOKUMENTE:\n${JSON.stringify(relevantDocuments, null, 2)}`
        : "";

      // Benutzeranfrage zusammenstellen
      const userPrompt = `Bitte erstelle ${requestTypeDescriptions[requestType]} zu folgender Fragestellung in ${language}:

FRAGESTELLUNG:
${question}

KONTEXT:
${context}

${documentsStr}

JURISDIKTION/RECHTSBEREICH:
${jurisdiction}

Deine Antwort sollte gut strukturiert, klar und verständlich sein. Beziehe dich auf relevante Rechtsquellen, Gesetze, Konventionen oder Präzedenzfälle, wo angemessen.
Stelle sicher, dass du dich auf die Rechtsprinzipien konzentrierst und die Anwendung auf die gegebene Situation erklärst.

Hinweis: Füge einen Disclaimer hinzu, dass dies keine rechtliche Beratung darstellt und bei konkreten rechtlichen Fragen ein qualifizierter Rechtsanwalt konsultiert werden sollte.`;

      // Generiere die rechtliche Assistenz
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      const generatedLegalAssistance = response.text();

      return generatedLegalAssistance;
    } catch (error) {
      console.error("Legal assistance generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Legal assistance generation failed: ${errorMessage}`);
    }
  }

  /**
   * Erstellt Kampagnen- und Kommunikationsmaterial
   */
  async generateCampaignMaterial(
    campaignName: string,
    objective: string,
    targetAudience: string,
    keyMessages: string[],
    options?: {
      materialType?: 'social_media' | 'press_release' | 'newsletter' | 'website' | 'talking_points';
      channelSpecific?: boolean;
      channels?: string[];
      tone?: ToneStyle;
      length?: 'short' | 'medium' | 'long';
      language?: string;
    }
  ): Promise<Record<string, string>> {
    try {
      // Gemini Modell verwenden
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings
      });

      // Standardwerte festlegen
      const materialType = options?.materialType || 'social_media';
      const tone = options?.tone || 'persuasive';
      const length = options?.length || 'medium';
      const language = options?.language || 'Deutsch';
      const channelSpecific = options?.channelSpecific || false;
      const channels = options?.channels || ['Twitter', 'Facebook', 'Instagram', 'LinkedIn'];

      // Materialtypen
      const materialTypeDescriptions = {
        social_media: "Social-Media-Beiträge",
        press_release: "eine Pressemitteilung",
        newsletter: "einen Newsletter",
        website: "Website-Content",
        talking_points: "Sprechpunkte für Interviews oder Präsentationen"
      };

      // Tonstile
      const toneDescriptions: Record<ToneStyle, string> = {
        formal: "formell und professionell",
        informative: "informativ und sachlich",
        persuasive: "überzeugend und motivierend",
        urgent: "dringend und zum Handeln auffordernd",
        educational: "bildend und erklärend",
        emotional: "emotional und mitfühlend",
        factual: "faktenbasiert und objektiv"
      };

      // Längenangaben
      const lengthGuide = {
        short: "kurz und prägnant",
        medium: "ausgewogen in der Länge",
        long: "ausführlich und detailliert"
      };

      // Systemanweisung
      const systemPrompt = `Du bist ein Experte für strategische Kommunikation und Kampagnenarbeit im Bereich Menschenrechte.
Deine Aufgabe ist es, effektive ${materialTypeDescriptions[materialType]} für eine Kampagne zu erstellen, 
die ${toneDescriptions[tone]} und ${lengthGuide[length]} sind.`;

      // Schlüsselbotschaften aufbereiten
      const keyMessagesStr = keyMessages.length > 0 
        ? `SCHLÜSSELBOTSCHAFTEN:\n- ${keyMessages.join('\n- ')}`
        : "Es wurden keine Schlüsselbotschaften angegeben.";

      // Kanalspezifische Angaben
      const channelsStr = channelSpecific && channels.length > 0
        ? `Bitte erstelle spezifische Inhalte für folgende Kanäle:\n- ${channels.join('\n- ')}`
        : "";

      // Benutzeranfrage zusammenstellen
      const userPrompt = `Bitte erstelle ${materialTypeDescriptions[materialType]} für die Kampagne "${campaignName}" in ${language}.

ZIEL DER KAMPAGNE:
${objective}

ZIELGRUPPE:
${targetAudience}

${keyMessagesStr}

${channelsStr}

Der Inhalt sollte die Zielgruppe ansprechen, zum Handeln motivieren und die Schlüsselbotschaften klar vermitteln.
Achte auf eine zugängliche Sprache und einen überzeugenden Aufruf zum Handeln (Call to Action).`;

      // Generiere das Kampagnenmaterial
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      const generatedContent = response.text();

      // Für kanalspezifische Inhalte das Ergebnis aufteilen
      if (channelSpecific && channels.length > 0) {
        const contentByChannel: Record<string, string> = {};


        // Einfache Aufteilung nach Überschriften versuchen
        for (const channel of channels) {
          const regex = new RegExp(`(?:^|\\n)(?:#{1,3}\\s*)?${channel}[:\\s]([\\s\\S]*?)(?=\\n(?:#{1,3}\\s*)?(?:${channels.join('|')})[:\\s]|$)`, 'i');
          const match = generatedContent.match(regex);


          if (match && match[1]) {
            contentByChannel[channel] = match[1].trim();
          } else {
            contentByChannel[channel] = `Kein spezifischer Inhalt für ${channel} gefunden.`;
          }
        }


        return contentByChannel;
      }


      // Wenn nicht kanalspezifisch, dann den gesamten Inhalt zurückgeben
      return { 'content': generatedContent };
    } catch (error) {
      console.error("Campaign material generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Campaign material generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generiert Bildungsmaterial und Schulungsinhalte
   */
  async generateEducationalContent(
    topic: string,
    targetGroup: string,
    learningObjectives: string[],
    options?: {
      contentFormat?: 'lesson_plan' | 'presentation' | 'handout' | 'interactive' | 'quiz';
      expertiseLevel?: 'beginner' | 'intermediate' | 'advanced';
      includeActivities?: boolean;
      includeAssessment?: boolean;
      language?: string;
    }
  ): Promise<string> {
    try {
      // Gemini Modell verwenden
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings
      });

      // Standardwerte festlegen
      const contentFormat = options?.contentFormat || 'lesson_plan';
      const expertiseLevel = options?.expertiseLevel || 'intermediate';
      const language = options?.language || 'Deutsch';
      const includeActivities = options?.includeActivities || false;
      const includeAssessment = options?.includeAssessment || false;

      // Formate für Bildungsinhalte
      const contentFormatDescriptions = {
        lesson_plan: "einen detaillierten Unterrichtsplan",
        presentation: "eine Präsentation mit Sprechnotizen",
        handout: "ein Handout für Teilnehmer",
        interactive: "interaktive Lerninhalte mit Übungen",
        quiz: "ein Quiz zur Überprüfung des Gelernten"
      };

      // Expertise-Level
      const expertiseLevelDescriptions = {
        beginner: "Anfänger ohne Vorkenntnisse",
        intermediate: "Personen mit Grundkenntnissen",
        advanced: "Fortgeschrittene mit tiefem Fachwissen"
      };

      // Systemanweisung
      const systemPrompt = `Du bist ein Experte für Bildung und Training im Bereich Menschenrechte.
Deine Aufgabe ist es, ${contentFormatDescriptions[contentFormat]} zum Thema "${topic}" zu erstellen,
der für ${expertiseLevelDescriptions[expertiseLevel]} geeignet ist.`;

      // Lernziele aufbereiten
      const learningObjectivesStr = learningObjectives.length > 0 
        ? `LERNZIELE:\n- ${learningObjectives.join('\n- ')}`
        : "Es wurden keine spezifischen Lernziele angegeben.";

      // Optionale Abschnitte
      const optionalSections = [];
      if (includeActivities) optionalSections.push("Interaktive Übungen und Aktivitäten");
      if (includeAssessment) optionalSections.push("Bewertungsmethoden (Quiz, Diskussionsfragen, etc.)");

      const optionalSectionsStr = optionalSections.length > 0
        ? `\nFolgende zusätzliche Abschnitte sollten enthalten sein:\n- ${optionalSections.join('\n- ')}`
        : "";

      // Benutzeranfrage zusammenstellen
      const userPrompt = `Bitte erstelle ${contentFormatDescriptions[contentFormat]} zum Thema "${topic}" in ${language}.

ZIELGRUPPE:
${targetGroup}

${learningObjectivesStr}

${optionalSectionsStr}

Der Inhalt sollte klar strukturiert, pädagogisch wertvoll und auf die Zielgruppe abgestimmt sein.
Verwende eine klare Gliederung mit Einleitung, Hauptteil (mit konkreten Inhalten) und Abschluss.
Achte auf eine zugängliche Sprache, relevante Beispiele und eine angemessene Didaktik für das angegebene Expertise-Level.`;

      // Generiere den Bildungsinhalt
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      const generatedEducationalContent = response.text();

      return generatedEducationalContent;
    } catch (error) {
      console.error("Educational content generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Educational content generation failed: ${errorMessage}`);
    }
  }
}

export const contentGenerationService = new ContentGenerationService();