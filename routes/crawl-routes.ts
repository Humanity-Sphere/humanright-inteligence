/**
 * Crawl-Routen
 * 
 * Diese Routen bieten Zugriff auf den Crawl-Service über REST-API.
 */

import express from 'express';
import { crawlService, initializeCrawlService, CrawlOptions } from '../services/crawl-service';
import path from 'path';

const router = express.Router();

// Service initialisieren
initializeCrawlService();

// Status abrufen
router.get('/status', (_req, res) => {
  try {
    res.json({
      status: 'running',
      cacheSize: crawlService.getCacheSize(),
      crawlHistory: crawlService.getCrawlHistory().slice(-10) // Letzte 10 Crawls
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// URL crawlen
router.post('/crawl', async (req, res) => {
  try {
    const { url, options } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL ist erforderlich' });
    }
    
    console.log(`Crawl angefordert für URL: ${url}`);
    const result = await crawlService.crawl(url, options);
    
    res.json(result);
  } catch (error: any) {
    console.error('Fehler beim Crawlen:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deep-Crawl durchführen
router.post('/deep-crawl', async (req, res) => {
  try {
    const { url, options } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL ist erforderlich' });
    }
    
    console.log(`Deep-Crawl angefordert für URL: ${url}`);
    
    // Da Deep-Crawl lange dauern kann, starten wir einen Hintergrundprozess
    res.json({ 
      status: 'started', 
      message: 'Deep-Crawl wurde gestartet',
      url
    });
    
    // Crawl im Hintergrund ausführen
    crawlService.deepCrawl(url, options)
      .then(results => {
        console.log(`Deep-Crawl für ${url} abgeschlossen, ${results.length} Seiten gecrawlt`);
      })
      .catch(error => {
        console.error(`Fehler beim Deep-Crawl für ${url}:`, error);
      });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sitemap crawlen
router.post('/crawl-sitemap', async (req, res) => {
  try {
    const { sitemapUrl, options } = req.body;
    
    if (!sitemapUrl) {
      return res.status(400).json({ error: 'Sitemap-URL ist erforderlich' });
    }
    
    console.log(`Sitemap-Crawl angefordert für URL: ${sitemapUrl}`);
    
    // Da Sitemap-Crawl lange dauern kann, starten wir einen Hintergrundprozess
    res.json({ 
      status: 'started', 
      message: 'Sitemap-Crawl wurde gestartet',
      sitemapUrl
    });
    
    // Crawl im Hintergrund ausführen
    crawlService.crawlSitemap(sitemapUrl, options)
      .then(results => {
        console.log(`Sitemap-Crawl für ${sitemapUrl} abgeschlossen, ${results.length} Seiten gecrawlt`);
      })
      .catch(error => {
        console.error(`Fehler beim Sitemap-Crawl für ${sitemapUrl}:`, error);
      });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ergebnisse in einer Datei speichern
router.post('/save-results', async (req, res) => {
  try {
    const { results, filename } = req.body;
    
    if (!results || !filename) {
      return res.status(400).json({ error: 'Ergebnisse und Dateiname sind erforderlich' });
    }
    
    // Sicherstellen, dass der Dateiname sicher ist
    const sanitizedFilename = path.basename(filename).replace(/[^a-z0-9-_\.]/gi, '_');
    const filePath = path.join('uploads', 'crawl-results', sanitizedFilename);
    
    await crawlService.saveResults(results, filePath);
    
    res.json({ 
      status: 'saved', 
      message: 'Ergebnisse erfolgreich gespeichert',
      filePath
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ergebnisse aus einer Datei laden
router.get('/load-results/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Sicherstellen, dass der Dateiname sicher ist
    const sanitizedFilename = path.basename(filename).replace(/[^a-z0-9-_\.]/gi, '_');
    const filePath = path.join('uploads', 'crawl-results', sanitizedFilename);
    
    const results = await crawlService.loadResults(filePath);
    
    res.json({ 
      status: 'loaded', 
      message: 'Ergebnisse erfolgreich geladen',
      results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ergebnisse aus einer Datei löschen
router.delete('/results/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Sicherstellen, dass der Dateiname sicher ist
    const sanitizedFilename = path.basename(filename).replace(/[^a-z0-9-_\.]/gi, '_');
    const filePath = path.join('uploads', 'crawl-results', sanitizedFilename);
    
    await import('fs/promises').then(fs => fs.unlink(filePath));
    
    res.json({ 
      status: 'deleted', 
      message: 'Ergebnisse erfolgreich gelöscht'
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Datei nicht gefunden' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Text analysieren
router.post('/analyze-text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text ist erforderlich' });
    }
    
    const analysis = await crawlService.analyzeText(text);
    
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cache leeren
router.post('/clear-cache', (_req, res) => {
  try {
    crawlService.clearCache();
    
    res.json({ 
      status: 'cleared', 
      message: 'Cache erfolgreich geleert'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crawl-Verlauf abrufen
router.get('/history', (_req, res) => {
  try {
    const history = crawlService.getCrawlHistory();
    
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crawl-Optionen aktualisieren
router.post('/set-options', (req, res) => {
  try {
    const options = req.body as Partial<CrawlOptions>;
    
    crawlService.setDefaultOptions(options);
    
    res.json({ 
      status: 'updated', 
      message: 'Crawl-Optionen erfolgreich aktualisiert'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Maximale Anzahl gleichzeitiger Crawls setzen
router.post('/set-max-concurrent', (req, res) => {
  try {
    const { count } = req.body;
    
    if (typeof count !== 'number' || count < 1) {
      return res.status(400).json({ error: 'Ungültige Anzahl' });
    }
    
    crawlService.setMaxConcurrentCrawls(count);
    
    res.json({ 
      status: 'updated', 
      message: `Maximale Anzahl gleichzeitiger Crawls auf ${count} gesetzt`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;