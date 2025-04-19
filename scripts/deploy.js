/**
 * Deployment-Skript für die Human Rights Intelligence Platform
 * 
 * Dieses Skript bereitet die Anwendung für das Deployment auf Replit vor.
 * Es baut die Anwendung und startet den Fixed-Deploy-Server auf Port 5000.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function deploy() {
  console.log('=== Human Rights Intelligence Platform Deployment ===');
  console.log('Starte den Deployment-Prozess...');

  try {
    // 1. Build-Prozess starten
    console.log('Baue die Anwendung...');
    await execPromise('npm run build');
    console.log('Build erfolgreich abgeschlossen!');

    // 2. Überprüfen, ob der Server auf Port 5000 läuft
    console.log('Starte den Fixed-Deploy-Server auf Port 5000...');
    
    // Import und Ausführung des Fixed-Deploy-Servers
    await import('./fixed-deploy-server.js');
    
    console.log('Der Fixed-Deploy-Server wurde erfolgreich gestartet!');
    console.log('Die Anwendung ist jetzt bereit für das Deployment auf Replit.');
    console.log('Verwenden Sie den Replit-Deployment-Button, um die Anwendung zu veröffentlichen.');
  } catch (error) {
    console.error('Fehler beim Deployment:', error);
    process.exit(1);
  }
}

// Starte den Deployment-Prozess
deploy();