
import { Request, Response, NextFunction } from 'express';

/**
 * Zentrale Fehlerbehandlung für die API
 * 
 * Fängt Fehler ab und sendet standardisierte Fehlerantworten
 * 
 * @param err Der aufgetretene Fehler
 * @param req Die Express-Anfrage
 * @param res Die Express-Antwort
 * @param next Die nächste Middleware-Funktion
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log des Fehlers für Debugging
  console.error('API Error:', err);

  // Standard-Fehlerobjekt
  const error = {
    message: 'Ein Fehler ist aufgetreten',
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  // Anpassung basierend auf Fehlertyp
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    error.message = err.message || 'Ungültige Anfragedaten';
  } else if (err.name === 'UnauthorizedError') {
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    error.message = 'Nicht autorisiert - Bitte erneut anmelden';
  } else if (err.name === 'ForbiddenError') {
    error.status = 403;
    error.code = 'FORBIDDEN';
    error.message = 'Zugriff verweigert';
  } else if (err.name === 'NotFoundError') {
    error.status = 404;
    error.code = 'NOT_FOUND';
    error.message = 'Ressource nicht gefunden';
  }

  // Explizite Fehlercodes vom Fehler selbst übernehmen
  if (err.status) error.status = err.status;
  if (err.code) error.code = err.code;
  if (err.message) error.message = err.message;

  // Antwort senden
  return res.status(error.status).json(error);
}

/**
 * Middleware zur Behandlung von 404-Fehlern (Route nicht gefunden)
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    message: 'Route nicht gefunden',
    status: 404,
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
}
