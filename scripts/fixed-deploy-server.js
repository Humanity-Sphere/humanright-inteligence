/**
 * Fixed Deployment Server
 * 
 * Dieser spezielle Server wurde erstellt, um das Replit-Deployment zu ermöglichen.
 * Er verwendet ausschließlich Port 5000, wie vom Replit-Deployment erwartet.
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Umgebungsvariablen laden
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Statische Dateien servieren, wenn ein 'dist' oder 'public' Verzeichnis existiert
if (fs.existsSync(path.join(rootDir, 'dist'))) {
  app.use(express.static(path.join(rootDir, 'dist')));
  console.log('Serving static files from /dist');
}

if (fs.existsSync(path.join(rootDir, 'public'))) {
  app.use(express.static(path.join(rootDir, 'public')));
  console.log('Serving static files from /public');
}

// API-Endpunkte 
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Fallback-Route für Single-Page Application
app.get('*', (req, res) => {
  // Prüfen, ob eine index.html-Datei existiert und sie servieren
  const indexPath = path.join(rootDir, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
    return;
  }

  // Ansonsten eine einfache HTML-Seite anzeigen
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Human Rights Intelligence Platform</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c5282; margin-top: 0; }
        .btn { display: inline-block; background-color: #4299e1; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; margin-top: 20px; }
        .btn:hover { background-color: #3182ce; }
        .status { padding: 10px; background-color: #e6fffa; border-left: 4px solid #38b2ac; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Human Rights Intelligence Platform</h1>
        <div class="status">
          <p><strong>Server-Status:</strong> Aktiv auf Port 5000</p>
          <p><strong>Deployment-Status:</strong> Bereit für Replit-Deployment</p>
        </div>
        <p>Dies ist der Bereitstellungsserver für die Human Rights Intelligence Platform. Die eigentliche Anwendung wird über diesen Server bereitgestellt.</p>
        <p>API Test: <a href="/api/health">Health Check</a></p>
        <p><a href="/api/health" class="btn">API-Test durchführen</a></p>
      </div>
    </body>
    </html>
  `);
});

// Server starten
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Fixed Deployment Server läuft auf Port ${PORT}`);
  console.log(`Diese Anwendung ist ausschließlich für Replit-Deployment-Zwecke gedacht.`);
  console.log(`Bei Verwendung in der Entwicklung, bitte stattdessen 'npm run dev' ausführen.`);
  console.log(`Webansicht sollte unter https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co verfügbar sein`);
});