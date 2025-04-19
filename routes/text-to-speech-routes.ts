/**
 * Text-to-Speech Routing-Modul
 * 
 * Dieses Modul stellt Routen für die Text-to-Speech-Funktionalität bereit.
 * Es verwendet intern eine Verbindung zu Google Cloud TTS.
 */

import express, { Router, Request, Response } from 'express';
import ttsRoutes from './tts-routes';

/**
 * Registriert die Text-to-Speech Routen an einem bestehenden Router
 */
export function registerTextToSpeechRoutes(router: Router): void {
  // TTS-Routen unter /tts anmelden
  router.use('/tts', ttsRoutes);
  
  console.log('Text-to-Speech Routen registriert');
}

export default registerTextToSpeechRoutes;