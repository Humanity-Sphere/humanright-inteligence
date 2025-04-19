import { getAIService } from './ai-service';

export interface ImageSuggestion {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  source: string;
  license?: string;
}

interface ImageSearchParams {
  query: string;
  context?: string;
  count?: number;
  includeKeywords?: boolean;
}

/**
 * Service für KI-gestützte Bildvorschläge auf Basis von Textinhalten
 */
export class ImageSuggestionService {
  // Mock-Datenbank für Bildvorschläge (später durch eine echte Datenbank ersetzen)
  private static mockImages: ImageSuggestion[] = [
    {
      id: '1',
      title: 'Demonstranten halten Schilder hoch',
      description: 'Gruppe von Demonstranten mit Schildern zu Menschenrechten',
      url: 'https://images.unsplash.com/photo-1591189824359-a259ada83a7c',
      tags: ['Demonstration', 'Protest', 'Menschenrechte', 'Aktivismus'],
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: '2',
      title: 'Internationales Gericht',
      description: 'Gerichtssaal eines internationalen Menschenrechtsgerichts',
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f',
      tags: ['Gericht', 'Justiz', 'Recht', 'International'],
      source: 'Unsplash', 
      license: 'Unsplash License'
    },
    {
      id: '3',
      title: 'Frau mit Zeichen der Hoffnung',
      description: 'Frau hält Kerze als Symbol für Hoffnung und Gerechtigkeit',
      url: 'https://images.unsplash.com/photo-1544642956-57a089df7c44',
      tags: ['Hoffnung', 'Frieden', 'Solidarität', 'Gerechtigkeit'],
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: '4',
      title: 'Kinder in der Schule',
      description: 'Kinder erhalten Bildung in einer Schule',
      url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
      tags: ['Bildung', 'Kinder', 'Schule', 'Recht auf Bildung'],
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: '5',
      title: 'Flüchtlingslager',
      description: 'Temporäre Unterkünfte in einem Flüchtlingslager',
      url: 'https://images.unsplash.com/photo-1469571486292-b53601012a8a',
      tags: ['Flüchtlinge', 'Humanitarian', 'Krise', 'Hilfe'],
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: '6',
      title: 'Juristische Bücher',
      description: 'Stapel von Rechtsbüchern und juristischen Dokumenten',
      url: 'https://images.unsplash.com/photo-1589216553494-9c8519603723',
      tags: ['Recht', 'Bücher', 'Rechtswissenschaft', 'Dokumente'],
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: '7',
      title: 'Pressekonferenz',
      description: 'Sprecher an einem Podium während einer Pressekonferenz',
      url: 'https://images.unsplash.com/photo-1551020690-d636bc9dde51',
      tags: ['Medien', 'Pressefreiheit', 'Kommunikation', 'Öffentlichkeit'],
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: '8',
      title: 'Soziale Medien und Aktivismus',
      description: 'Person nutzt soziale Medien für Aktivismus',
      url: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6',
      tags: ['Social Media', 'Aktivismus', 'Digital', 'Kampagne'],
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: '9',
      title: 'Training Workshop',
      description: 'Menschen in einem interaktiven Workshop',
      url: 'https://images.unsplash.com/photo-1558403194-611308249627',
      tags: ['Workshop', 'Training', 'Bildung', 'Capacity Building'],
      source: 'Unsplash',
      license: 'Unsplash License'
    },
    {
      id: '10',
      title: 'Unterschriften Petition',
      description: 'Menschen unterschreiben eine Petition',
      url: 'https://images.unsplash.com/photo-1554070011-0ff462bdd8d8',
      tags: ['Petition', 'Unterschriften', 'Kampagne', 'Aktion'],
      source: 'Unsplash',
      license: 'Unsplash License'
    }
  ];

  /**
   * Analysiert den Textinhalt und schlägt passende Bilder vor
   * 
   * @param content Der Textinhalt, für den Bilder vorgeschlagen werden sollen
   * @param context Zusätzlicher Kontext über das Dokument
   * @returns Liste von vorgeschlagenen Bildern
   */
  async suggestImagesForContent(content: string, context?: string): Promise<ImageSuggestion[]> {
    try {
      // Extrahiere relevante Schlüsselwörter aus dem Inhalt mit KI
      const keywords = await this.extractKeywordsFromContent(content);
      
      // Suche nach passenden Bildern basierend auf den Schlüsselwörtern
      return await this.searchImages({
        query: keywords.join(' '), 
        context: context,
        count: 5,
        includeKeywords: true
      });
    } catch (error) {
      console.error('Fehler beim Vorschlagen von Bildern:', error);
      return [];
    }
  }

  /**
   * Extrahiert relevante Schlüsselwörter aus dem Textinhalt mit KI
   */
  private async extractKeywordsFromContent(content: string): Promise<string[]> {
    try {
      // Text kürzen, falls er zu lang ist
      const truncatedContent = content.length > 1000 
        ? content.substring(0, 1000) + '...' 
        : content;

      // KI-Anfrage zur Extraktion von Schlüsselwörtern
      const prompt = `
        Analysiere den folgenden Text und extrahiere 5-7 relevante Schlüsselwörter oder Konzepte, 
        die für die Suche nach passenden Bildern nützlich wären. 
        Achte auf die zentralen Themen, visuelle Elemente und emotionale Töne im Text.
        Gib nur die Schlüsselwörter als kommagetrennte Liste zurück.
        
        TEXT:
        ${truncatedContent}
      `;

      // KI-Service verwenden
      const aiService = getAIService();
      const response = await aiService.generateContent({
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.3
      });

      // Antwort parsen und Schlüsselwörter extrahieren
      const keywords = response
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);

      return keywords;
    } catch (error) {
      console.error('Fehler bei der Schlüsselwortextraktion:', error);
      // Fallback zu einfacher Textanalyse ohne KI
      return this.fallbackKeywordExtraction(content);
    }
  }

  /**
   * Einfache Schlüsselwortextraktion ohne KI als Fallback
   */
  private fallbackKeywordExtraction(content: string): string[] {
    const commonWords = new Set([
      'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'für', 'mit',
      'auf', 'in', 'an', 'zu', 'bei', 'von', 'aus', 'nach', 'über', 'unter',
      'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'on', 'in', 'at', 'to'
    ]);

    // Text in Wörter aufteilen, Häufigkeit zählen und häufigste Wörter zurückgeben
    const words = content.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/);
    
    const wordCount: Record<string, number> = {};
    
    for (const word of words) {
      if (word.length > 3 && !commonWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }
    
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  /**
   * Sucht nach passenden Bildern basierend auf Suchparametern
   */
  private async searchImages(params: ImageSearchParams): Promise<ImageSuggestion[]> {
    // In einer echten Implementierung: API-Aufruf an Bildservice oder Datenbank
    // Hier: Mock-Implementierung mit Filterung der Mock-Daten
    
    const query = params.query.toLowerCase();
    const count = params.count || 5;
    
    try {
      // Bilder nach Relevanz filtern
      let matchedImages = ImageSuggestionService.mockImages.filter(img => {
        // Prüfen, ob Tags, Titel oder Beschreibung die Suchbegriffe enthalten
        const matchesTitle = img.title.toLowerCase().includes(query);
        const matchesDescription = img.description.toLowerCase().includes(query);
        const matchesTags = img.tags.some(tag => 
          query.includes(tag.toLowerCase()) || tag.toLowerCase().includes(query)
        );
        
        return matchesTitle || matchesDescription || matchesTags;
      });
      
      // Falls keine Übereinstimmungen, verwende zufällige Bilder
      if (matchedImages.length === 0) {
        // Zufällige Auswahl aus allen verfügbaren Bildern
        matchedImages = ImageSuggestionService.mockImages
          .sort(() => Math.random() - 0.5)
          .slice(0, count);
      } else if (matchedImages.length > count) {
        // Anzahl der Ergebnisse beschränken
        matchedImages = matchedImages.slice(0, count);
      }
      
      return matchedImages;
    } catch (error) {
      console.error('Fehler bei der Bildsuche:', error);
      return [];
    }
  }
}

// Singleton-Instanz
let imageSuggestionService: ImageSuggestionService | null = null;

/**
 * Gibt die Singleton-Instanz des ImageSuggestionService zurück
 */
export function getImageSuggestionService(): ImageSuggestionService {
  if (!imageSuggestionService) {
    imageSuggestionService = new ImageSuggestionService();
  }
  return imageSuggestionService;
}