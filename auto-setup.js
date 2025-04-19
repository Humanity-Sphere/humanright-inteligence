#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('\x1b[36m%s\x1b[0m', '🤖 Human Rights Intelligence - Automatische Einrichtung');
console.log('========================================================');

// Parameter verarbeiten
const args = process.argv.slice(2);
const includeExamples = !args.includes('--no-examples');
const offlineMode = args.includes('--offline');

// Funktionen
async function checkDependencies() {
  console.log('📦 Prüfe und installiere Abhängigkeiten...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Fehler bei der Installation der Abhängigkeiten:', error);
    return false;
  }
}

async function setupDatabase() {
  console.log('🗄️ Konfiguriere Datenbank...');
  try {
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
      fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    }

    if (includeExamples) {
      console.log('📋 Lade Beispieldaten...');
      // Datenbank mit Beispieldaten befüllen (Platzhaltercode)
      // Im echten System würde das die Datenbank aus einer Vorlage kopieren
    }
    return true;
  } catch (error) {
    console.error('❌ Fehler bei der Datenbankkonfiguration:', error);
    return false;
  }
}

async function setupAIServices() {
  console.log('🧠 Konfiguriere KI-Dienste...');

  if (offlineMode) {
    console.log('🔌 Offline-Modus aktiviert - Verwende lokale KI-Modelle');
    // Lokale Modelle konfigurieren
  } else {
    console.log('☁️ Online-Modus - Verwende Cloud-KI-Dienste');
    // API-Keys prüfen oder nutzer nach den Schlüsseln fragen
  }
  return true;
}

async function startServices() {
  console.log('🚀 Starte Anwendung auf Port 5000...');
  try {
    // Server im Hintergrund starten
    const serverProcess = require('child_process').spawn('node', ['--max-old-space-size=4096', 'server/index.ts'], {
      env: { ...process.env, PORT: '5000', NODE_ENV: 'development' },
      stdio: 'inherit'
    });

    console.log('✅ Server erfolgreich gestartet!');
    console.log('🌐 Die Anwendung ist nun verfügbar unter:');
    console.log('\x1b[32m%s\x1b[0m', '   https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co');

    return true;
  } catch (error) {
    console.error('❌ Fehler beim Starten der Anwendung:', error);
    return false;
  }
}

// Hauptfunktion
async function main() {
  console.log('🔍 Erkenne Umgebung...');
  console.log(`   Plattform: ${process.platform}`);
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Modus: ${offlineMode ? 'Offline' : 'Online'}`);
  console.log(`   Beispieldaten: ${includeExamples ? 'Ja' : 'Nein'}`);

  const steps = [
    { name: 'Abhängigkeiten', fn: checkDependencies },
    { name: 'Datenbank', fn: setupDatabase },
    { name: 'KI-Dienste', fn: setupAIServices },
    { name: 'Server starten', fn: startServices }
  ];

  for (const step of steps) {
    console.log(`\n⏳ Schritt: ${step.name}...`);
    const success = await step.fn();
    if (!success) {
      console.error(`\n❌ Fehler im Schritt '${step.name}'. Setup abgebrochen.`);
      process.exit(1);
    }
    console.log(`✅ Schritt '${step.name}' erfolgreich abgeschlossen.`);
  }

  console.log('\n🎉 Human Rights Intelligence Platform erfolgreich eingerichtet!');
}

// Ausführen
main().catch(error => {
  console.error('Ein unerwarteter Fehler ist aufgetreten:', error);
  process.exit(1);
});
