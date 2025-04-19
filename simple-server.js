import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Grundlegende Routen
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, 'public')));

// Fallback-Route
app.get('*', (req, res) => {
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
const PORT = 5000; // Port 5000 für Replit Deployment verwenden
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple Server läuft auf Port ${PORT}`);
  console.log(`Webansicht sollte unter https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co verfügbar sein`);
});