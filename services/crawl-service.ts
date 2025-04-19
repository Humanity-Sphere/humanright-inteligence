/**
 * Crawl-Service
 * 
 * Dieser Service implementiert einen Web-Crawler und Scraper für KI-Anwendungen,
 * basierend auf dem crawl4ai-Projekt: https://github.com/unclecode/crawl4ai
 * 
 * Da das Original in Python ist, haben wir hier eine TypeScript-Implementierung
 * der grundlegenden Funktionalität erstellt.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

// Crawl-Service Typdefinitionen
export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  followLinks?: boolean;
  respectRobotsTxt?: boolean;
  delay?: number;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  includePatterns?: string[];
  excludePatterns?: string[];
  proxyUrl?: string;
  cookies?: Record<string, string>;
  retries?: number;
  cacheResults?: boolean;
  cacheTTL?: number;
  filterDuplicates?: boolean;
  extractorType?: 'html' | 'json' | 'text' | 'markdown' | 'auto';
  fields?: string[];
  chunkSize?: number;
}

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
  html?: string;
  metadata: {
    crawledAt: string;
    contentType: string;
    statusCode: number;
    headers?: Record<string, string>;
    links: string[];
    images: string[];
    wordCount: number;
    language?: string;
  };
  chunks?: {
    index: number;
    content: string;
  }[];
  error?: {
    message: string;
    code: string;
  };
}

export interface SitemapItem {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface RobotsDirectives {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
  sitemaps: string[];
}

interface CacheItem {
  timestamp: number;
  result: CrawlResult;
}

export class CrawlService {
  private static instance: CrawlService;
  private eventEmitter: EventEmitter = new EventEmitter();
  private cache: Map<string, CacheItem> = new Map();
  private visitedUrls: Set<string> = new Set();
  private crawlQueue: string[] = [];
  private activeCrawls: number = 0;
  private maxConcurrentCrawls: number = 5;
  private defaultOptions: CrawlOptions = {
    maxDepth: 3,
    maxPages: 100,
    followLinks: true,
    respectRobotsTxt: true,
    delay: 1000,
    timeout: 30000,
    userAgent: 'HumanRightsIntelligence-Bot/1.0',
    retries: 3,
    cacheResults: true,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 Stunden
    filterDuplicates: true,
    extractorType: 'auto',
    chunkSize: 1000,
  };
  private crawlHistory: Array<{
    timestamp: number;
    url: string;
    success: boolean;
    errorMessage?: string;
  }> = [];
  
  private constructor() {
    // Private Konstruktor für Singleton
  }

  public static getInstance(): CrawlService {
    if (!CrawlService.instance) {
      CrawlService.instance = new CrawlService();
    }
    return CrawlService.instance;
  }

  /**
   * Führt einen Crawl für eine bestimmte URL durch
   */
  public async crawl(url: string, options: Partial<CrawlOptions> = {}): Promise<CrawlResult> {
    const crawlOptions = { ...this.defaultOptions, ...options };
    const cacheKey = this.generateCacheKey(url, crawlOptions);

    // Prüfen, ob Ergebnisse im Cache sind
    if (crawlOptions.cacheResults) {
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    try {
      // Überprüfen, ob die URL bereits besucht wurde und Duplikate vermeiden
      if (crawlOptions.filterDuplicates && this.visitedUrls.has(url)) {
        return {
          url,
          title: 'Duplizierte URL',
          content: '',
          metadata: {
            crawledAt: new Date().toISOString(),
            contentType: 'text/plain',
            statusCode: 0,
            links: [],
            images: [],
            wordCount: 0
          },
          error: {
            message: 'URL wurde bereits gecrawlt',
            code: 'DUPLICATE_URL'
          }
        };
      }

      // robots.txt überprüfen, wenn aktiviert
      if (crawlOptions.respectRobotsTxt) {
        const isAllowed = await this.checkRobotsTxt(url, crawlOptions.userAgent || '');
        if (!isAllowed) {
          return {
            url,
            title: 'Zugriff durch robots.txt verweigert',
            content: '',
            metadata: {
              crawledAt: new Date().toISOString(),
              contentType: 'text/plain',
              statusCode: 0,
              links: [],
              images: [],
              wordCount: 0
            },
            error: {
              message: 'Zugriff durch robots.txt verweigert',
              code: 'ROBOTS_TXT_DISALLOWED'
            }
          };
        }
      }

      // URL zu Besuchten hinzufügen
      this.visitedUrls.add(url);

      // HTTP-Anfrage senden
      const response = await this.fetchUrl(url, crawlOptions);
      
      // Starte Ereignis
      this.eventEmitter.emit('page:fetched', { url, statusCode: response.status });

      // Extraktion der Daten aus der Antwort
      const result = await this.extractContent(url, response, crawlOptions);

      // Ergebnis speichern
      if (crawlOptions.cacheResults) {
        this.saveToCache(cacheKey, result);
      }

      // Im Crawl-Verlauf speichern
      this.crawlHistory.push({
        timestamp: Date.now(),
        url,
        success: true
      });

      // Ergebnis zurückgeben
      return result;
    } catch (error: any) {
      console.error(`Fehler beim Crawlen von ${url}:`, error);
      
      // Fehler-Ereignis auslösen
      this.eventEmitter.emit('error', { url, error });

      // Im Crawl-Verlauf speichern
      this.crawlHistory.push({
        timestamp: Date.now(),
        url,
        success: false,
        errorMessage: error.message
      });

      return {
        url,
        title: 'Fehler beim Crawlen',
        content: '',
        metadata: {
          crawledAt: new Date().toISOString(),
          contentType: 'text/plain',
          statusCode: error.response?.status || 0,
          links: [],
          images: [],
          wordCount: 0
        },
        error: {
          message: error.message,
          code: error.code || 'CRAWL_ERROR'
        }
      };
    }
  }

  /**
   * Führt einen Deep-Crawl (rekursiven Crawl) durch
   */
  public async deepCrawl(
    startUrl: string, 
    options: Partial<CrawlOptions> = {}
  ): Promise<CrawlResult[]> {
    const crawlOptions = { ...this.defaultOptions, ...options };
    const results: CrawlResult[] = [];
    this.visitedUrls.clear();
    this.crawlQueue = [startUrl];

    // Deep-Crawl-Start-Ereignis
    this.eventEmitter.emit('deepCrawl:start', { url: startUrl, options: crawlOptions });

    try {
      while (
        this.crawlQueue.length > 0 && 
        this.visitedUrls.size < (crawlOptions.maxPages || 100)
      ) {
        // Bis zu maxConcurrentCrawls parallel ausführen
        const crawlBatch = [];
        while (
          this.crawlQueue.length > 0 && 
          crawlBatch.length < this.maxConcurrentCrawls &&
          this.visitedUrls.size + crawlBatch.length < (crawlOptions.maxPages || 100)
        ) {
          const nextUrl = this.crawlQueue.shift();
          if (nextUrl && !this.visitedUrls.has(nextUrl)) {
            crawlBatch.push(this.crawl(nextUrl, { ...crawlOptions, followLinks: false }));
            this.visitedUrls.add(nextUrl);
          }
        }

        if (crawlBatch.length === 0) break;

        // Wartezeit einhalten, um Server nicht zu überlasten
        if (crawlOptions.delay) {
          await new Promise(resolve => setTimeout(resolve, crawlOptions.delay));
        }

        // Parallele Ausführung
        const batchResults = await Promise.all(crawlBatch);
        
        for (const result of batchResults) {
          results.push(result);
          
          // Links extrahieren und zur Queue hinzufügen, wenn followLinks aktiviert ist
          if (crawlOptions.followLinks && !result.error) {
            const baseUrl = new URL(result.url);
            for (const link of result.metadata.links) {
              try {
                // Normalisiere die URL
                let fullUrl = link;
                if (link.startsWith('/')) {
                  fullUrl = `${baseUrl.origin}${link}`;
                } else if (!link.startsWith('http')) {
                  // Relative URL
                  const basePath = baseUrl.pathname.split('/').slice(0, -1).join('/');
                  fullUrl = `${baseUrl.origin}${basePath}/${link}`;
                }

                // Prüfe Muster für Einschluss/Ausschluss
                if (this.shouldCrawlUrl(fullUrl, crawlOptions)) {
                  if (!this.visitedUrls.has(fullUrl) && !this.crawlQueue.includes(fullUrl)) {
                    this.crawlQueue.push(fullUrl);
                  }
                }
              } catch (e) {
                console.warn(`Fehler beim Verarbeiten von Link ${link}:`, e);
              }
            }
          }

          // Ereignis für jedes Ergebnis
          this.eventEmitter.emit('page:processed', {
            url: result.url,
            success: !result.error
          });
        }
      }

      // Deep-Crawl-Ende-Ereignis
      this.eventEmitter.emit('deepCrawl:end', {
        startUrl,
        pagesProcessed: results.length,
        success: true
      });

      return results;
    } catch (error) {
      console.error('Fehler beim Deep-Crawl:', error);
      
      // Fehler-Ereignis
      this.eventEmitter.emit('deepCrawl:end', {
        startUrl,
        pagesProcessed: results.length,
        success: false,
        error
      });
      
      return results;
    }
  }

  /**
   * Crawlt eine komplette Website basierend auf der Sitemap
   */
  public async crawlSitemap(
    sitemapUrl: string, 
    options: Partial<CrawlOptions> = {}
  ): Promise<CrawlResult[]> {
    try {
      // Sitemap herunterladen und parsen
      const sitemapItems = await this.fetchSitemap(sitemapUrl);
      console.log(`Sitemap ${sitemapUrl} geladen, ${sitemapItems.length} URLs gefunden`);

      const results: CrawlResult[] = [];
      const crawlOptions = { ...this.defaultOptions, ...options };

      // Event für Sitemap-Crawl-Start
      this.eventEmitter.emit('sitemapCrawl:start', {
        sitemapUrl,
        urlCount: sitemapItems.length
      });

      // Batch-Verarbeitung für alle Sitemap-URLs
      for (let i = 0; i < sitemapItems.length; i += this.maxConcurrentCrawls) {
        const batch = sitemapItems.slice(i, i + this.maxConcurrentCrawls);
        
        // Starte mehrere Crawls parallel
        const batchPromises = batch.map(item => this.crawl(item.loc, crawlOptions));
        
        // Wartezeit einhalten, um Server nicht zu überlasten
        if (crawlOptions.delay) {
          await new Promise(resolve => setTimeout(resolve, crawlOptions.delay));
        }
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Fortschritt melden
        this.eventEmitter.emit('sitemapCrawl:progress', {
          sitemapUrl,
          processed: Math.min(i + this.maxConcurrentCrawls, sitemapItems.length),
          total: sitemapItems.length
        });
      }

      // Event für Sitemap-Crawl-Ende
      this.eventEmitter.emit('sitemapCrawl:end', {
        sitemapUrl,
        urlCount: sitemapItems.length,
        successCount: results.filter(r => !r.error).length
      });

      return results;
    } catch (error) {
      console.error(`Fehler beim Crawlen der Sitemap ${sitemapUrl}:`, error);
      
      // Fehler-Ereignis
      this.eventEmitter.emit('sitemapCrawl:error', {
        sitemapUrl,
        error
      });
      
      return [];
    }
  }

  /**
   * Speichert Crawl-Ergebnisse in einer Datei
   */
  public async saveResults(results: CrawlResult[], filePath: string): Promise<void> {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      console.log(`Ergebnisse gespeichert in ${filePath}`);
    } catch (error) {
      console.error('Fehler beim Speichern der Ergebnisse:', error);
      throw error;
    }
  }

  /**
   * Lädt Ergebnisse aus einer Datei
   */
  public async loadResults(filePath: string): Promise<CrawlResult[]> {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as CrawlResult[];
    } catch (error) {
      console.error('Fehler beim Laden der Ergebnisse:', error);
      return [];
    }
  }

  /**
   * Analysiert einen Text auf enthaltene Links
   */
  public async analyzeText(text: string): Promise<{
    links: string[];
    emails: string[];
    phoneNumbers: string[];
    entities: string[];
    sentiment: string;
    languages: string[];
  }> {
    // Einfache Analyse des Textes
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const phoneRegex = /(\+?[\d\s-]{8,})/g;

    const links = text.match(linkRegex) || [];
    const emails = text.match(emailRegex) || [];
    const phoneNumbers = text.match(phoneRegex) || [];

    // Einfache Entitätserkennung (Beispiel)
    const entities = [];
    const possibleEntities = text.match(/[A-Z][a-z]{2,}/g) || [];
    for (const entity of possibleEntities) {
      if (entity.length > 3 && !entities.includes(entity)) {
        entities.push(entity);
      }
    }

    // Einfache Stimmungsanalyse
    const positiveWords = ['gut', 'hervorragend', 'großartig', 'positiv', 'erfreulich', 'excellent', 'wonderful'];
    const negativeWords = ['schlecht', 'schrecklich', 'ärgerlich', 'negativ', 'enttäuschend', 'terrible', 'disappointing'];
    
    const normalizedText = text.toLowerCase();
    let positiveCount = 0, negativeCount = 0;
    
    for (const word of positiveWords) {
      positiveCount += (normalizedText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }
    
    for (const word of negativeWords) {
      negativeCount += (normalizedText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }
    
    let sentiment;
    if (positiveCount > negativeCount * 2) {
      sentiment = 'sehr positiv';
    } else if (positiveCount > negativeCount) {
      sentiment = 'positiv';
    } else if (negativeCount > positiveCount * 2) {
      sentiment = 'sehr negativ';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negativ';
    } else {
      sentiment = 'neutral';
    }

    // Einfache Spracherkennung
    const languages = [];
    if (
      text.match(/[äöüßÄÖÜ]/) || 
      normalizedText.match(/\b(der|die|das|und|oder|ist|sein|haben|für|von)\b/g)
    ) {
      languages.push('de');
    }
    if (
      normalizedText.match(/\b(the|and|or|is|are|have|for|from|with|that)\b/g)
    ) {
      languages.push('en');
    }

    return {
      links,
      emails,
      phoneNumbers,
      entities,
      sentiment,
      languages: languages.length ? languages : ['unbekannt']
    };
  }

  // Private Methoden

  /**
   * Führt eine HTTP-Anfrage aus
   */
  private async fetchUrl(url: string, options: CrawlOptions): Promise<any> {
    const headers: Record<string, string> = {
      'User-Agent': options.userAgent || this.defaultOptions.userAgent!
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const config = {
      timeout: options.timeout || this.defaultOptions.timeout,
      headers,
      validateStatus: function (status: number) {
        return status >= 200 && status < 500; // Akzeptiere auch 3xx und 4xx Status
      }
    };

    // Proxy verwenden, wenn konfiguriert
    if (options.proxyUrl) {
      config['proxy'] = {
        host: new URL(options.proxyUrl).hostname,
        port: parseInt(new URL(options.proxyUrl).port),
        protocol: new URL(options.proxyUrl).protocol.replace(':', '')
      };
    }

    return await axios.get(url, config);
  }

  /**
   * Extrahiert Inhalt aus einer HTTP-Antwort
   */
  private async extractContent(url: string, response: any, options: CrawlOptions): Promise<CrawlResult> {
    const contentType = response.headers['content-type'] || '';
    let extractedContent = '';
    let title = '';
    let links: string[] = [];
    let images: string[] = [];

    try {
      if (contentType.includes('text/html')) {
        const $ = cheerio.load(response.data);
        
        // Titel extrahieren
        title = $('title').text().trim() || $('h1').first().text().trim() || url;
        
        // Links und Bilder extrahieren
        $('a').each((_, elem) => {
          const href = $(elem).attr('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            links.push(href);
          }
        });
        
        $('img').each((_, elem) => {
          const src = $(elem).attr('src');
          if (src) {
            images.push(src);
          }
        });

        // Bestimme den extractor type
        switch (options.extractorType) {
          case 'text':
            // Extrahiere nur den Text
            extractedContent = $('body').text().replace(/\s+/g, ' ').trim();
            break;
          case 'markdown':
            // Einfache HTML-zu-Markdown-Konvertierung
            extractedContent = this.htmlToMarkdown($);
            break;
          case 'html':
            // Vollständiges HTML
            extractedContent = response.data;
            break;
          case 'auto':
          default:
            // Standard: Extrahiere wichtigen Inhalt und entferne unwichtige Elemente
            $('script, style, nav, footer, iframe, .cookie-banner, .ad, .advertisement, header').remove();
            extractedContent = $('body').text().replace(/\s+/g, ' ').trim();
        }
      } else if (contentType.includes('application/json')) {
        // JSON-Inhalt
        title = url.split('/').pop() || url;
        extractedContent = JSON.stringify(response.data, null, 2);
      } else if (contentType.includes('text/xml') || contentType.includes('application/xml')) {
        // XML-Inhalt
        title = url.split('/').pop() || url;
        const parser = new XMLParser();
        const jsonObj = parser.parse(response.data);
        extractedContent = JSON.stringify(jsonObj, null, 2);
      } else if (contentType.includes('text/')) {
        // Anderer Textinhalt
        title = url.split('/').pop() || url;
        extractedContent = response.data;
      } else {
        // Binärinhalt nicht extrahieren
        title = url.split('/').pop() || url;
        extractedContent = `[Binärinhalt nicht extrahiert: ${contentType}]`;
      }
    } catch (error) {
      console.error('Fehler bei der Inhaltsextraktion:', error);
      extractedContent = `[Fehler bei der Extraktion: ${error.message}]`;
    }

    // Anzahl der Wörter
    const wordCount = extractedContent.split(/\s+/).filter(w => w.length > 0).length;

    // Chunks erstellen, wenn eine Chunk-Größe angegeben ist
    const chunks = options.chunkSize ? this.chunkContent(extractedContent, options.chunkSize) : undefined;

    // Ergebnis zurückgeben
    return {
      url,
      title,
      content: extractedContent,
      html: contentType.includes('text/html') ? response.data : undefined,
      metadata: {
        crawledAt: new Date().toISOString(),
        contentType,
        statusCode: response.status,
        headers: response.headers,
        links,
        images,
        wordCount
      },
      chunks
    };
  }

  /**
   * Prüft, ob eine URL gecrawlt werden soll (basierend auf den Include/Exclude-Mustern)
   */
  private shouldCrawlUrl(url: string, options: CrawlOptions): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Wenn keine Muster definiert sind, alles erlauben
      if (!options.includePatterns && !options.excludePatterns) {
        return true;
      }

      // Auf Exclude-Muster prüfen
      if (options.excludePatterns && options.excludePatterns.length > 0) {
        for (const pattern of options.excludePatterns) {
          if (url.includes(pattern) || parsedUrl.pathname.includes(pattern)) {
            return false;
          }
        }
      }

      // Auf Include-Muster prüfen
      if (options.includePatterns && options.includePatterns.length > 0) {
        for (const pattern of options.includePatterns) {
          if (url.includes(pattern) || parsedUrl.pathname.includes(pattern)) {
            return true;
          }
        }
        // Wenn Include-Muster definiert sind, aber keines passt, ablehnen
        return false;
      }

      // Standardmäßig erlauben, wenn keine Include-Muster definiert sind
      return true;
    } catch (error) {
      console.warn(`Ungültige URL beim Prüfen von Mustern: ${url}`, error);
      return false;
    }
  }

  /**
   * Lädt und parst eine Sitemap XML-Datei
   */
  private async fetchSitemap(sitemapUrl: string): Promise<SitemapItem[]> {
    try {
      const response = await axios.get(sitemapUrl);
      
      if (response.status !== 200) {
        throw new Error(`Fehler beim Laden der Sitemap: HTTP ${response.status}`);
      }

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '_',
      });
      
      const parsedXml = parser.parse(response.data);
      
      // Prüfen, ob es sich um eine Sitemap-Index handelt
      if (parsedXml.sitemapindex && parsedXml.sitemapindex.sitemap) {
        const sitemaps = Array.isArray(parsedXml.sitemapindex.sitemap) 
          ? parsedXml.sitemapindex.sitemap 
          : [parsedXml.sitemapindex.sitemap];
        
        let allUrls: SitemapItem[] = [];
        
        // Rekursiv alle Sitemaps laden und kombinieren
        for (const sitemap of sitemaps) {
          const sitemapLoc = sitemap.loc;
          const urls = await this.fetchSitemap(sitemapLoc);
          allUrls = allUrls.concat(urls);
        }
        
        return allUrls;
      }
      
      // Direkte Sitemap verarbeiten
      if (parsedXml.urlset && parsedXml.urlset.url) {
        const urls = Array.isArray(parsedXml.urlset.url) 
          ? parsedXml.urlset.url 
          : [parsedXml.urlset.url];
        
        return urls.map(url => ({
          loc: url.loc,
          lastmod: url.lastmod,
          changefreq: url.changefreq,
          priority: url.priority
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Fehler beim Laden der Sitemap ${sitemapUrl}:`, error);
      return [];
    }
  }

  /**
   * Prüft die robots.txt-Datei, um zu sehen, ob das Crawling erlaubt ist
   */
  private async checkRobotsTxt(url: string, userAgent: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;
      
      const response = await axios.get(robotsUrl, { timeout: 5000 }).catch(() => null);
      
      if (!response || response.status !== 200) {
        // Keine robots.txt gefunden, erlauben
        return true;
      }
      
      const robotsTxt = response.data;
      const directives = this.parseRobotsTxt(robotsTxt);
      
      // Finde das relevante User-Agent Direktiven
      const relevantDirectives = directives.find(d => 
        d.userAgent === '*' || 
        d.userAgent === userAgent || 
        userAgent.includes(d.userAgent)
      );
      
      if (!relevantDirectives) {
        // Keine relevanten Anweisungen, erlauben
        return true;
      }
      
      // Prüfe, ob die URL erlaubt ist
      const path = parsedUrl.pathname + parsedUrl.search;
      
      // Zuerst nach expliziten Allow-Regeln suchen
      for (const allowPath of relevantDirectives.allow) {
        if (this.robotsPathMatches(path, allowPath)) {
          return true;
        }
      }
      
      // Dann nach Disallow-Regeln suchen
      for (const disallowPath of relevantDirectives.disallow) {
        if (this.robotsPathMatches(path, disallowPath)) {
          return false;
        }
      }
      
      // Wenn keine Regel passt, erlauben
      return true;
    } catch (error) {
      console.warn(`Fehler beim Prüfen von robots.txt für ${url}:`, error);
      // Im Zweifelsfall erlauben
      return true;
    }
  }

  /**
   * Parst eine robots.txt-Datei
   */
  private parseRobotsTxt(robotsTxt: string): RobotsDirectives[] {
    const lines = robotsTxt.split('\n');
    const directives: RobotsDirectives[] = [];
    let currentUserAgent = '';
    let currentDirective: RobotsDirectives | null = null;
    
    for (let line of lines) {
      line = line.trim();
      
      if (!line || line.startsWith('#')) {
        continue;
      }
      
      // Teile die Zeile in Schlüssel und Wert
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      let key = line.substring(0, colonIndex).trim().toLowerCase();
      let value = line.substring(colonIndex + 1).trim();
      
      if (key === 'user-agent') {
        // Neuer User-Agent beginnt
        if (currentUserAgent !== value) {
          if (currentDirective) {
            directives.push(currentDirective);
          }
          currentUserAgent = value;
          currentDirective = {
            userAgent: value,
            allow: [],
            disallow: [],
            sitemaps: []
          };
        }
      } else if (key === 'allow' && currentDirective) {
        currentDirective.allow.push(value);
      } else if (key === 'disallow' && currentDirective) {
        currentDirective.disallow.push(value);
      } else if (key === 'crawl-delay' && currentDirective) {
        currentDirective.crawlDelay = parseInt(value);
      } else if (key === 'sitemap') {
        if (currentDirective) {
          currentDirective.sitemaps.push(value);
        } else {
          // Wenn noch kein User-Agent definiert wurde, allgemeinen erstellen
          currentDirective = {
            userAgent: '*',
            allow: [],
            disallow: [],
            sitemaps: [value]
          };
        }
      }
    }
    
    if (currentDirective) {
      directives.push(currentDirective);
    }
    
    return directives;
  }

  /**
   * Prüft, ob ein Pfad auf ein robots.txt-Muster passt
   */
  private robotsPathMatches(path: string, pattern: string): boolean {
    if (pattern === '') return true; // Leeres Muster passt auf alles
    
    // Escape alle Regex-Sonderzeichen außer * 
    let regexPattern = pattern
      .replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*');
    
    // Muss am Anfang des Pfades übereinstimmen
    regexPattern = '^' + regexPattern;
    
    return new RegExp(regexPattern).test(path);
  }

  /**
   * Teilt Inhalt in Chunks auf
   */
  private chunkContent(content: string, chunkSize: number): { index: number, content: string }[] {
    // Wenn chunkSize <= 0 oder kein Inhalt, leeres Array zurückgeben
    if (chunkSize <= 0 || !content) {
      return [];
    }

    const chunks: { index: number, content: string }[] = [];
    const words = content.split(/\s+/);
    let currentChunk = '';
    let wordCount = 0;
    let chunkIndex = 0;

    for (const word of words) {
      if (wordCount + 1 > chunkSize) {
        chunks.push({
          index: chunkIndex++,
          content: currentChunk.trim()
        });
        currentChunk = '';
        wordCount = 0;
      }
      
      currentChunk += (currentChunk ? ' ' : '') + word;
      wordCount++;
    }

    // Den letzten Chunk hinzufügen, wenn er nicht leer ist
    if (currentChunk.trim()) {
      chunks.push({
        index: chunkIndex,
        content: currentChunk.trim()
      });
    }

    return chunks;
  }

  /**
   * Einfache HTML-zu-Markdown-Konvertierung
   */
  private htmlToMarkdown($: cheerio.CheerioAPI): string {
    let markdown = '';

    // Titel
    const title = $('title').text().trim();
    if (title) {
      markdown += `# ${title}\n\n`;
    }

    // Überschriften
    $('h1').each((_, elem) => {
      markdown += `# ${$(elem).text().trim()}\n\n`;
    });

    $('h2').each((_, elem) => {
      markdown += `## ${$(elem).text().trim()}\n\n`;
    });

    $('h3').each((_, elem) => {
      markdown += `### ${$(elem).text().trim()}\n\n`;
    });

    // Absätze
    $('p').each((_, elem) => {
      markdown += `${$(elem).text().trim()}\n\n`;
    });

    // Listen
    $('ul').each((_, elem) => {
      $(elem).find('li').each((__, liElem) => {
        markdown += `- ${$(liElem).text().trim()}\n`;
      });
      markdown += '\n';
    });

    $('ol').each((_, elem) => {
      $(elem).find('li').each((index, liElem) => {
        markdown += `${index + 1}. ${$(liElem).text().trim()}\n`;
      });
      markdown += '\n';
    });

    // Links
    $('a').each((_, elem) => {
      const text = $(elem).text().trim();
      const href = $(elem).attr('href');
      if (text && href) {
        markdown = markdown.replace(text, `[${text}](${href})`);
      }
    });

    // Bilder
    $('img').each((_, elem) => {
      const alt = $(elem).attr('alt') || '';
      const src = $(elem).attr('src');
      if (src) {
        markdown += `![${alt}](${src})\n\n`;
      }
    });

    return markdown;
  }

  /**
   * Generiert einen Cache-Schlüssel für eine URL und Optionen
   */
  private generateCacheKey(url: string, options: CrawlOptions): string {
    const optionsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(options))
      .digest('hex');
    
    return `${url}|${optionsHash}`;
  }

  /**
   * Liest ein Ergebnis aus dem Cache
   */
  private getFromCache(key: string): CrawlResult | null {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) {
      return null;
    }

    const { timestamp, result } = cachedItem;
    const defaultTTL = this.defaultOptions.cacheTTL || 24 * 60 * 60 * 1000; // 24 Stunden
    
    // Prüfen, ob der Cache abgelaufen ist
    if (Date.now() - timestamp > defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    return result;
  }

  /**
   * Speichert ein Ergebnis im Cache
   */
  private saveToCache(key: string, result: CrawlResult): void {
    this.cache.set(key, {
      timestamp: Date.now(),
      result
    });
  }

  /**
   * Löscht den Cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('Cache wurde geleert');
  }

  /**
   * Registriert einen Event-Listener
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Entfernt einen Event-Listener
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Gibt den Crawl-Verlauf zurück
   */
  public getCrawlHistory(): Array<{
    timestamp: number;
    url: string;
    success: boolean;
    errorMessage?: string;
  }> {
    return this.crawlHistory;
  }

  /**
   * Gibt die Anzahl der im Cache gespeicherten Elemente zurück
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Setzt die maximale Anzahl gleichzeitiger Crawls
   */
  public setMaxConcurrentCrawls(count: number): void {
    this.maxConcurrentCrawls = count;
  }

  /**
   * Ändert die Standard-Crawl-Optionen
   */
  public setDefaultOptions(options: Partial<CrawlOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}

// Singleton-Instanz exportieren
export const crawlService = CrawlService.getInstance();

// Hilfsfunktion zum Initialisieren des Crawl-Services
export function initializeCrawlService(): CrawlService {
  console.log('Crawl-Service initialisiert');
  return crawlService;
}