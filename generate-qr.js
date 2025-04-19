#!/usr/bin/env node

/**
 * QR-Code-Generator für Expo-Anwendungen
 * 
 * Dieses Skript startet den QR-Code-Generator für die Expo-Anwendung.
 */

import { execSync } from 'child_process';

// Führe den QR-Code-Generator im mobile-app Verzeichnis aus
try {
  console.log('QR-Code-Generator wird gestartet...\n');
  execSync('node mobile-app/qr-generator.cjs', { stdio: 'inherit' });
} catch (error) {
  console.error('Fehler beim Starten des QR-Code-Generators:', error.message);
  console.log('\nBitte stellen Sie sicher, dass alle erforderlichen Abhängigkeiten installiert sind.');
  console.log('Führen Sie folgende Befehle aus, um die Abhängigkeiten zu installieren:');
  console.log('npm install ip qrcode-terminal\n');
}