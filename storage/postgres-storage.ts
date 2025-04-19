import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { IStorage } from '../storage';
import { SelectUser, SelectDocument, SelectSafetyRecommendation } from '@shared/schema';
import * as schema from '@shared/schema';

/**
 * PostgresStorage - Eine Storage-Implementierung, die PostgreSQL verwendet
 */
export class PostgresStorage implements Partial<IStorage> {
  private db: any;
  private client: any;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL Umgebungsvariable nicht gesetzt');
    }

    // Initialisiere den Postgres-Client und Drizzle ORM
    this.client = postgres(process.env.DATABASE_URL);
    this.db = drizzle(this.client, { schema });

    console.log('[PostgresStorage] Verbindung zur PostgreSQL-Datenbank hergestellt');
  }

  /**
   * Führt Migrationen aus, um sicherzustellen, dass die Datenbank aktuell ist
   */
  public async runMigrations() {
    try {
      console.log('[PostgresStorage] Führe Migrationen aus...');
      await migrate(this.db, { migrationsFolder: 'drizzle' });
      console.log('[PostgresStorage] Migrationen erfolgreich abgeschlossen');
    } catch (error) {
      console.error('[PostgresStorage] Fehler bei Migrationen:', error);
      throw error;
    }
  }

  // ==== Benutzer-Funktionen ====

  /**
   * Gibt alle Benutzer zurück
   */
  async getUsers(): Promise<SelectUser[]> {
    return await this.db.query.users.findMany();
  }

  /**
   * Gibt einen bestimmten Benutzer zurück
   */
  async getUser(id: number): Promise<SelectUser | null> {
    return await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id)
    });
  }

  /**
   * Erstellt einen neuen Benutzer
   */
  async createUser(userData: any): Promise<SelectUser> {
    const result = await this.db.insert(schema.users).values(userData).returning();
    return result[0];
  }

  // ==== Dokument-Funktionen ====

  /**
   * Gibt alle Dokumente eines Benutzers zurück
   */
  async getDocuments(userId: number): Promise<SelectDocument[]> {
    return await this.db.query.documents.findMany({
      where: (documents, { eq }) => eq(documents.userId, userId)
    });
  }

  /**
   * Gibt ein bestimmtes Dokument zurück
   */
  async getDocument(id: number): Promise<SelectDocument | null> {
    return await this.db.query.documents.findFirst({
      where: (documents, { eq }) => eq(documents.id, id)
    });
  }

  /**
   * Erstellt ein neues Dokument
   */
  async createDocument(documentData: any): Promise<SelectDocument> {
    const result = await this.db.insert(schema.documents).values(documentData).returning();
    return result[0];
  }

  /**
   * Löscht ein Dokument
   */
  async deleteDocument(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.documents)
      .where((documents, { eq }) => eq(documents.id, id))
      .returning();
    return result.length > 0;
  }

  // ==== Sicherheitsempfehlungs-Funktionen ====

  /**
   * Gibt alle Sicherheitsempfehlungen zurück
   */
  async getSafetyRecommendations(): Promise<SelectSafetyRecommendation[]> {
    return await this.db.query.safetyRecommendations.findMany();
  }

  /**
   * Gibt eine bestimmte Sicherheitsempfehlung zurück
   */
  async getSafetyRecommendation(id: number): Promise<SelectSafetyRecommendation | null> {
    return await this.db.query.safetyRecommendations.findFirst({
      where: (recommendations, { eq }) => eq(recommendations.id, id)
    });
  }

  /**
   * Erstellt eine neue Sicherheitsempfehlung
   */
  async createSafetyRecommendation(data: any): Promise<SelectSafetyRecommendation> {
    const result = await this.db.insert(schema.safetyRecommendations).values(data).returning();
    return result[0];
  }

  /**
   * Aktualisiert eine Sicherheitsempfehlung
   */
  async updateSafetyRecommendation(id: number, data: any): Promise<SelectSafetyRecommendation | null> {
    const result = await this.db.update(schema.safetyRecommendations)
      .set(data)
      .where((recommendations, { eq }) => eq(recommendations.id, id))
      .returning();
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Löscht eine Sicherheitsempfehlung
   */
  async deleteSafetyRecommendation(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.safetyRecommendations)
      .where((recommendations, { eq }) => eq(recommendations.id, id))
      .returning();
    return result.length > 0;
  }

  /**
   * Gibt alle Sicherheitsempfehlungen eines Benutzers zurück
   */
  async getSafetyRecommendationsByUser(userId: number): Promise<SelectSafetyRecommendation[]> {
    return await this.db.query.safetyRecommendations.findMany({
      where: (recommendations, { eq }) => eq(recommendations.userId, userId)
    });
  }
}