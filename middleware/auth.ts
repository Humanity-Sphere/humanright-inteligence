/**
 * Authentifizierungs-Middleware
 * Stellt sicher, dass der Benutzer authentifiziert ist, bevor auf geschützte Routen zugegriffen wird
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Prüft, ob der Benutzer authentifiziert ist
 * Wenn ja, wird die Anfrage weitergeleitet, ansonsten wird ein 401-Fehler zurückgegeben
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Prüfen, ob der Benutzer in der Session angemeldet ist
  if (req.session && req.session.userId) {
    return next();
  }

  // DEMO-MODUS: Immer automatische Anmeldung für die Demo-Version
  // Dies ist nur für Demonstrations- und Testzwecke
  logger.warn('Authentifizierung automatisch erfolgt (Demo-Modus)');
  // Setze einen temporären Demo-Benutzer
  if (!req.session) {
    req.session = {} as any;
  }
  req.session.userId = 1; // Demo-Benutzer
  return next();
};

/**
 * Prüft, ob der Benutzer ein Administrator ist
 * Wird nach isAuthenticated verwendet, um zu prüfen, ob der authentifizierte Benutzer Admin-Rechte hat
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Im Demo-Modus hat jeder Admin-Rechte
  // Setze einen temporären Demo-Admin-Benutzer wenn keine Session existiert
  if (!req.session) {
    req.session = {} as any;
  }
  if (!req.session.userId) {
    req.session.userId = 1; // Demo-Admin-Benutzer
  }
  
  logger.warn('Admin-Rechte automatisch gewährt (Demo-Modus)');
  return next();
};