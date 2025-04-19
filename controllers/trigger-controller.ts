import { db } from "../db";
import {
  contentTriggers,
  contentRecommendations,
  userTriggerHistory,
  triggerPreferences,
  SelectContentTrigger,
  SelectContentRecommendation,
  SelectUserTriggerHistory,
  SelectTriggerPreferences,
  InsertContentTrigger,
  InsertContentRecommendation,
} from "../../shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TriggerEngineService } from "../services/trigger-engine-service";
import {
  ContextEvent,
  ContentTrigger,
  ContentRecommendation,
  TriggerCondition,
  RecommendationPriority,
  RecommendationType,
  ContextType,
} from "../../shared/types/trigger-recommendations";

/**
 * Controller zur Verwaltung von Inhaltstrigger und Empfehlungen
 */
export class TriggerController {
  private triggerEngine: TriggerEngineService;

  constructor() {
    this.triggerEngine = TriggerEngineService.getInstance();
  }

  /**
   * Erstellt einen neuen Inhaltstrigger
   */
  public async createTrigger(data: InsertContentTrigger): Promise<SelectContentTrigger | null> {
    try {
      const result = await db.insert(contentTriggers).values(data).returning();
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("[TriggerController] Fehler beim Erstellen des Triggers:", error);
      return null;
    }
  }

  /**
   * Erstellt eine neue Empfehlung für einen Trigger
   */
  public async createRecommendation(data: InsertContentRecommendation): Promise<SelectContentRecommendation | null> {
    try {
      const result = await db.insert(contentRecommendations).values(data).returning();
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("[TriggerController] Fehler beim Erstellen der Empfehlung:", error);
      return null;
    }
  }

  /**
   * Aktualisiert einen vorhandenen Trigger
   */
  public async updateTrigger(id: number, data: Partial<InsertContentTrigger>): Promise<boolean> {
    try {
      const result = await db
        .update(contentTriggers)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(contentTriggers.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("[TriggerController] Fehler beim Aktualisieren des Triggers:", error);
      return false;
    }
  }

  /**
   * Aktualisiert eine vorhandene Empfehlung
   */
  public async updateRecommendation(id: number, data: Partial<InsertContentRecommendation>): Promise<boolean> {
    try {
      const result = await db
        .update(contentRecommendations)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(contentRecommendations.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("[TriggerController] Fehler beim Aktualisieren der Empfehlung:", error);
      return false;
    }
  }

  /**
   * Löscht einen Trigger und alle zugehörigen Empfehlungen
   */
  public async deleteTrigger(id: number): Promise<boolean> {
    try {
      // Zuerst zugehörige Empfehlungen löschen
      await db
        .delete(contentRecommendations)
        .where(eq(contentRecommendations.triggerId, id));

      // Dann den Trigger selbst löschen
      const result = await db
        .delete(contentTriggers)
        .where(eq(contentTriggers.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("[TriggerController] Fehler beim Löschen des Triggers:", error);
      return false;
    }
  }

  /**
   * Löscht eine Empfehlung
   */
  public async deleteRecommendation(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(contentRecommendations)
        .where(eq(contentRecommendations.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("[TriggerController] Fehler beim Löschen der Empfehlung:", error);
      return false;
    }
  }

  /**
   * Lädt alle Trigger
   */
  public async getAllTriggers(): Promise<SelectContentTrigger[]> {
    try {
      return await db.select().from(contentTriggers).orderBy(desc(contentTriggers.updatedAt));
    } catch (error) {
      console.error("[TriggerController] Fehler beim Laden aller Trigger:", error);
      return [];
    }
  }

  /**
   * Lädt alle Empfehlungen eines Triggers
   */
  public async getRecommendationsForTrigger(triggerId: number): Promise<SelectContentRecommendation[]> {
    try {
      return await db
        .select()
        .from(contentRecommendations)
        .where(eq(contentRecommendations.triggerId, triggerId))
        .orderBy(desc(contentRecommendations.priority));
    } catch (error) {
      console.error("[TriggerController] Fehler beim Laden der Trigger-Empfehlungen:", error);
      return [];
    }
  }

  /**
   * Lädt einen Trigger mit seinen Empfehlungen
   */
  public async getTriggerWithRecommendations(triggerId: number): Promise<{
    trigger: SelectContentTrigger | null;
    recommendations: SelectContentRecommendation[];
  }> {
    try {
      const trigger = await db
        .select()
        .from(contentTriggers)
        .where(eq(contentTriggers.id, triggerId))
        .limit(1);

      if (trigger.length === 0) {
        return { trigger: null, recommendations: [] };
      }

      const recommendations = await this.getRecommendationsForTrigger(triggerId);

      return {
        trigger: trigger[0],
        recommendations,
      };
    } catch (error) {
      console.error("[TriggerController] Fehler beim Laden des Triggers mit Empfehlungen:", error);
      return { trigger: null, recommendations: [] };
    }
  }

  /**
   * Markiert eine Empfehlung als gesehen oder angeklickt
   */
  public async updateRecommendationStatus(
    userId: number,
    triggerId: number,
    wasDismissed: boolean,
    wasClicked: boolean
  ): Promise<boolean> {
    return await this.triggerEngine.updateRecommendationStatus(
      userId,
      triggerId,
      wasDismissed,
      wasClicked
    );
  }

  /**
   * Aktualisiert die Benutzereinstellungen für Trigger
   */
  public async updateUserPreferences(
    userId: number,
    preferences: {
      enableTriggers?: boolean;
      priorityThreshold?: RecommendationPriority;
      maxTriggersPerHour?: number;
      disabledTriggerIds?: number[];
      disabledContextTypes?: ContextType[];
      preferredRecommendationTypes?: RecommendationType[];
    }
  ): Promise<boolean> {
    return await this.triggerEngine.updateUserPreferences(userId, preferences);
  }

  /**
   * Lädt die Benutzereinstellungen für Trigger
   */
  public async getUserPreferences(userId: number): Promise<SelectTriggerPreferences | null> {
    try {
      const prefs = await db
        .select()
        .from(triggerPreferences)
        .where(eq(triggerPreferences.userId, userId))
        .limit(1);

      return prefs.length > 0 ? prefs[0] : null;
    } catch (error) {
      console.error("[TriggerController] Fehler beim Laden der Benutzereinstellungen:", error);
      return null;
    }
  }

  /**
   * Prüft den aktuellen Kontext auf passende Empfehlungen
   */
  public async checkContextForRecommendations(
    userId: number,
    contextEvent: ContextEvent
  ): Promise<ContentRecommendation[]> {
    return await this.triggerEngine.checkForTriggers(contextEvent, userId);
  }

  /**
   * Erstellt automatisch einen Trigger mit zugehörigen Empfehlungen basierend auf einer Inhaltsanalyse
   * Diese Funktion wird von der KI verwendet, um proaktiv hilfreiche Empfehlungen zu generieren
   */
  public async createAIGeneratedTrigger(
    data: {
      name: string;
      description: string;
      conditions: TriggerCondition[];
      createdBy?: number;
      recommendations: {
        title: string;
        description: string;
        type: RecommendationType;
        priority: RecommendationPriority;
        contentId?: number;
        contentType?: string;
        url?: string;
        actionText?: string;
        imageUrl?: string;
        tags?: string[];
      }[];
    }
  ): Promise<{
    success: boolean;
    triggerId?: number;
    recommendations?: SelectContentRecommendation[];
  }> {
    try {
      // 1. Trigger erstellen
      const triggerResult = await db.insert(contentTriggers).values({
        name: data.name,
        description: data.description,
        active: true,
        conditions: data.conditions,
        aiGenerated: true,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      if (triggerResult.length === 0) {
        return { success: false };
      }

      const triggerId = triggerResult[0].id;

      // 2. Empfehlungen erstellen
      const recommendationPromises = data.recommendations.map(rec => {
        return db.insert(contentRecommendations).values({
          triggerId: triggerId,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          priority: rec.priority,
          contentId: rec.contentId,
          contentType: rec.contentType,
          url: rec.url,
          actionText: rec.actionText,
          dismissible: true,
          imageUrl: rec.imageUrl,
          tags: rec.tags,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await Promise.all(recommendationPromises);

      // 3. Empfehlungen laden
      const createdRecommendations = await this.getRecommendationsForTrigger(triggerId);

      return {
        success: true,
        triggerId,
        recommendations: createdRecommendations,
      };
    } catch (error) {
      console.error("[TriggerController] Fehler beim Erstellen des KI-generierten Triggers:", error);
      return { success: false };
    }
  }

  /**
   * Lädt die Trigger-Historie eines Benutzers
   */
  public async getUserTriggerHistory(
    userId: number,
    limit: number = 100
  ): Promise<SelectUserTriggerHistory[]> {
    try {
      return await db
        .select()
        .from(userTriggerHistory)
        .where(eq(userTriggerHistory.userId, userId))
        .orderBy(desc(userTriggerHistory.triggeredAt))
        .limit(limit);
    } catch (error) {
      console.error("[TriggerController] Fehler beim Laden der Benutzer-Trigger-Historie:", error);
      return [];
    }
  }

  /**
   * Lädt die Statistiken für einen Trigger
   */
  public async getTriggerStatistics(
    triggerId: number
  ): Promise<{
    triggerCount: number;
    dismissCount: number;
    clickCount: number;
    lastTriggeredAt?: Date;
  }> {
    try {
      // Lade den Trigger für triggerCount und lastTriggeredAt
      const trigger = await db
        .select()
        .from(contentTriggers)
        .where(eq(contentTriggers.id, triggerId))
        .limit(1);

      if (trigger.length === 0) {
        return { triggerCount: 0, dismissCount: 0, clickCount: 0 };
      }

      // Lade die Historie für dismiss und click counts
      const history = await db
        .select()
        .from(userTriggerHistory)
        .where(eq(userTriggerHistory.triggerId, triggerId));

      const dismissCount = history.filter(h => h.dismissed).length;
      const clickCount = history.filter(h => h.clicked).length;

      return {
        triggerCount: trigger[0].triggerCount || 0,
        dismissCount,
        clickCount,
        lastTriggeredAt: trigger[0].lastTriggeredAt,
      };
    } catch (error) {
      console.error("[TriggerController] Fehler beim Laden der Trigger-Statistiken:", error);
      return { triggerCount: 0, dismissCount: 0, clickCount: 0 };
    }
  }
}