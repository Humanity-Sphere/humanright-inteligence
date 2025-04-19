import { 
  ohchrResources, 
  OhchrResource, 
  searchOhchrResources,
  getOhchrResourcesByKeywords
} from '@shared/config/ohchr-resources';

/**
 * Service für die Anreicherung von KI-Anfragen mit relevanten Kontextinformationen
 * Dieser Service identifiziert passende OHCHR-Ressourcen und andere Kontextquellen, 
 * die für eine bestimmte Anfrage relevant sein könnten
 */
export class ContextEnrichmentService {
  /**
   * Findet relevante OHCHR-Ressourcen basierend auf Schlüsselwörtern oder Suchbegriff
   * 
   * @param options Such- und Filteroptionen
   * @returns Array von relevanten Ressourcen mit Relevanzwert
   */
  public findRelevantResources(options: {
    query?: string;
    keywords?: string[];
    limit?: number;
    topicsOfInterest?: string[];
  }): Array<{ resource: OhchrResource; relevance: number }> {
    const { query, keywords, limit = 5, topicsOfInterest = [] } = options;
    let matchedResources: OhchrResource[] = [];
    
    // Nach Suchbegriff suchen
    if (query) {
      matchedResources = searchOhchrResources(query);
    } 
    // Nach Schlüsselwörtern suchen
    else if (keywords && keywords.length > 0) {
      matchedResources = getOhchrResourcesByKeywords(keywords);
    }
    // Alle Ressourcen verwenden, wenn keine Suchparameter angegeben wurden
    else {
      matchedResources = [...ohchrResources];
    }
    
    // Berechne Relevanz für jede Ressource
    const scoredResources = matchedResources.map(resource => {
      let relevance = 0;
      
      // Prüfe Übereinstimmung mit Interessensgebieten
      if (topicsOfInterest.length > 0) {
        relevance += resource.keywords.filter(
          keyword => topicsOfInterest.some(topic => 
            keyword.toLowerCase().includes(topic.toLowerCase()) || 
            topic.toLowerCase().includes(keyword.toLowerCase())
          )
        ).length * 2; // Doppelte Gewichtung für Themenübereinstimmungen
      }
      
      // Grundrelevanz basierend auf Ressourcentyp
      switch (resource.type) {
        case 'Database':
          relevance += 3;
          break;
        case 'Document Collection':
          relevance += 4;
          break;
        case 'Portal':
          relevance += 2;
          break;
        default:
          relevance += 1;
      }
      
      return { resource, relevance };
    });
    
    // Sortiere nach Relevanz und begrenze die Anzahl
    return scoredResources
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }
  
  /**
   * Generiert einen formattierten Kontext für KI-Anfragen basierend auf relevanten Ressourcen
   * 
   * @param resources Array von Ressourcen mit Relevanz
   * @param format Ausgabeformat ("text" oder "json")
   * @returns Formatierter Kontext als String
   */
  public generateResourceContext(
    resources: Array<{ resource: OhchrResource; relevance: number }>,
    format: 'text' | 'json' = 'text'
  ): string {
    if (resources.length === 0) {
      return '';
    }
    
    if (format === 'json') {
      return JSON.stringify(
        resources.map(({ resource }) => ({
          id: resource.id,
          name: resource.name,
          url: resource.url,
          description: resource.description,
          type: resource.type
        })),
        null, 
        2
      );
    }
    
    // Text-Format für direktes Einfügen in Prompts
    let context = 'Relevante OHCHR-Ressourcen für diese Anfrage:\n\n';
    
    resources.forEach(({ resource }, index) => {
      context += `${index + 1}. ${resource.name} (${resource.type})\n`;
      context += `   Beschreibung: ${resource.description}\n`;
      context += `   URL: ${resource.url}\n\n`;
    });
    
    return context;
  }
  
  /**
   * Anreicherung eines Prompt-Textes mit relevanten Ressourcen
   * 
   * @param promptText Ursprünglicher Prompt-Text
   * @param options Optionen für die Ressourcensuche
   * @returns Angereicherter Prompt-Text
   */
  public enrichPromptWithResources(
    promptText: string, 
    options: {
      addToBeginning?: boolean;
      limit?: number;
      format?: 'text' | 'json';
    } = {}
  ): string {
    const { addToBeginning = false, limit = 3, format = 'text' } = options;
    
    // Extrahiere potenzielle Schlüsselwörter aus dem Prompt
    const keywords = this.extractKeywordsFromPrompt(promptText);
    
    // Finde relevante Ressourcen basierend auf extrahierten Schlüsselwörtern
    const relevantResources = this.findRelevantResources({
      keywords,
      limit
    });
    
    if (relevantResources.length === 0) {
      return promptText;
    }
    
    // Generiere Ressourcenkontext
    const resourceContext = this.generateResourceContext(relevantResources, format);
    
    // Füge den Kontext zum Prompt hinzu
    if (addToBeginning) {
      return `${resourceContext}\n\n${promptText}`;
    } else {
      return `${promptText}\n\nHier sind einige relevante Ressourcen, die bei dieser Anfrage helfen könnten:\n\n${resourceContext}`;
    }
  }
  
  /**
   * Extrahiert potenzielle Schlüsselwörter aus einem Prompt-Text
   * Dies ist eine einfache Implementierung, die durch NLP-Methoden verbessert werden könnte
   * 
   * @param promptText Text des Prompts
   * @returns Array von extrahierten Schlüsselwörtern
   */
  private extractKeywordsFromPrompt(promptText: string): string[] {
    // Liste von relevanten Schlüsselwörtern im Menschenrechtskontext
    const relevantTerms = [
      'Menschenrechte', 'UN', 'Vereinte Nationen', 'OHCHR', 'Hochkommissariat',
      'Völkerrecht', 'Vertragsorgane', 'Sonderverfahren', 'UPR', 'Individualbeschwerde',
      'Überprüfung', 'Bericht', 'Konvention', 'Pakt', 'Protokoll',
      'Diskriminierung', 'Rassismus', 'Bildung', 'Training', 'Schulung',
      'NGO', 'Zivilgesellschaft', 'Registrierung', 'Berichterstattung', 'Ratifizierung'
    ];
    
    // Extrahiere Wörter, die in der Liste relevanter Begriffe vorkommen
    const promptLower = promptText.toLowerCase();
    return relevantTerms.filter(term => 
      promptLower.includes(term.toLowerCase())
    );
  }
}

// Singleton-Instanz des Services
export const contextEnrichmentService = new ContextEnrichmentService();