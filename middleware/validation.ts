/**
 * Validierungs-Middleware
 * 
 * Diese Middleware validiert Anfragen gegen ein Zod-Schema.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger, { createLogger } from '../utils/logger';

/**
 * Erzeugt eine Middleware-Funktion, die Anfragedaten mit einem Zod-Schema validiert
 * @param schema - Das Zod-Schema für die Validierung
 */
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`Validierungsfehler: ${error.message}`);
        return res.status(400).json({
          error: 'Validierungsfehler',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      logger.error(`Unerwarteter Validierungsfehler: ${error}`);
      res.status(500).json({ error: 'Interner Serverfehler bei der Validierung' });
    }
  };
}