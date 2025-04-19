/**
 * Activity Tracking Service
 * 
 * Dient zur automatischen Erfassung von Benutzeraktivitäten
 * und zur Erstellung von Reflexionsberichten
 */

import { storage } from '../storage';
import { InsertUserActivityLog, InsertReflectionReport } from '../../shared/schema';
import logger from '../utils/logger';
import { analyzeWithGemini } from './gemini';
import { encrypt } from '../utils/encryption';

class ActivityTrackingService {
  /**
   * Aktivität eines Benutzers protokollieren
   */
  async logActivity(userId: number, activityData: Omit<InsertUserActivityLog, 'userId'>): Promise<void> {
    try {
      await storage.createUserActivityLog({
        userId,
        ...activityData
      });
    } catch (error) {
      logger.error('Fehler beim Protokollieren der Benutzeraktivität:', error);
      // Wir werfen keinen Fehler, damit der normale Ablauf nicht unterbrochen wird,
      // falls das Logging fehlschlägt
    }
  }

  /**
   * Nicht verarbeitete Aktivitäten eines Benutzers abrufen
   */
  async getUnprocessedActivities(userId: number, timeSpan?: { from: Date, to: Date }): Promise<any[]> {
    try {
      const query: any = {
        userId,
        processed: false
      };

      if (timeSpan) {
        query.timeRange = timeSpan;
      }

      return await storage.getUserActivityLogs(query);
    } catch (error) {
      logger.error('Fehler beim Abrufen unverarbeiteter Aktivitäten:', error);
      return [];
    }
  }

  /**
   * Aktivitäten als verarbeitet markieren
   */
  async markActivitiesAsProcessed(activityIds: number[]): Promise<void> {
    try {
      await Promise.all(
        activityIds.map(id => storage.updateUserActivityLog(id, { processed: true }))
      );
    } catch (error) {
      logger.error('Fehler beim Markieren von Aktivitäten als verarbeitet:', error);
    }
  }

  /**
   * Generiert einen täglichen Reflexionsbericht für einen Benutzer
   */
  async generateDailyReflectionReport(userId: number, date: Date = new Date()): Promise<number | null> {
    try {
      // Zeitraum für den heutigen Tag bestimmen
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Aktivitäten des Tages abrufen
      const activities = await storage.getUserActivityLogs({
        userId,
        timeRange: { from: startOfDay, to: endOfDay }
      });

      if (activities.length === 0) {
        logger.info(`Keine Aktivitäten für Benutzer ${userId} am ${date.toISOString().split('T')[0]} gefunden.`);
        return null;
      }

      // Heute erstellte Journaleinträge abrufen
      const journalEntries = await storage.getJournalEntries(userId, {
        from: startOfDay, 
        to: endOfDay 
      });

      // Wohlbefinden-Checkins abrufen
      const wellbeingCheckins = await storage.getWellbeingCheckins(userId, {
        from: startOfDay, 
        to: endOfDay 
      });

      // Daten für den Bericht sammeln
      const reportData = {
        activities: activities.map(a => ({
          type: a.activityType,
          timestamp: a.timestamp,
          resourceType: a.resourceType,
          resourceId: a.resourceId,
          data: a.activityData
        })),
        journalEntries: journalEntries.map(e => ({
          id: e.id,
          title: e.title,
          mood: e.mood,
          tags: e.tags,
          createdAt: e.createdAt
        })),
        wellbeingCheckins: wellbeingCheckins.map(c => ({
          mood: c.mood,
          stressLevel: c.stressLevel,
          restLevel: c.restLevel,
          createdAt: c.createdAt
        }))
      };

      // Reflexionsbericht mit KI generieren
      const reportContent = await this.generateReflectionContent(userId, reportData, 'daily');

      if (!reportContent) {
        logger.error(`Fehler bei der Generierung des Reflexionsberichts für Benutzer ${userId}`);
        return null;
      }

      // Verschlüsselter Bericht
      const encryptedContent = encrypt(reportContent, userId.toString());

      // Aktivitäts-IDs für die Verknüpfung
      const activityIds = activities.map(a => a.id);
      
      // Journal-Einträge für die Verknüpfung
      const journalEntryIds = journalEntries.map(e => e.id);

      // Extrahiere Tags aus Journal-Einträgen
      const tags = Array.from(new Set(
        journalEntries.flatMap(e => e.tags || [])
      ));

      // Titel generieren
      const formattedDate = new Date(date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const title = `Tagesreflexion: ${formattedDate}`;

      // Bericht in der Datenbank speichern
      const reportData2: InsertReflectionReport = {
        userId,
        title,
        reportType: 'daily',
        encryptedContent,
        timeFrame: { start: startOfDay.toISOString(), end: endOfDay.toISOString() },
        includedActivities: activityIds,
        relatedJournalEntries: journalEntryIds,
        tags,
        insights: null // Wird später mit KI-Analyse gefüllt
      };

      const report = await storage.createReflectionReport(reportData2);

      if (report && report.id) {
        // Markiere alle verarbeiteten Aktivitäten
        await this.markActivitiesAsProcessed(activityIds);
        return report.id;
      }

      return null;
    } catch (error) {
      logger.error('Fehler bei der Generierung des Tagesreflexionsberichts:', error);
      return null;
    }
  }

  /**
   * Generiert einen wöchentlichen Reflexionsbericht
   */
  async generateWeeklyReflectionReport(userId: number, weekEndDate: Date = new Date()): Promise<number | null> {
    try {
      // Zeitraum für die vergangene Woche berechnen
      const endOfWeek = new Date(weekEndDate);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const startOfWeek = new Date(endOfWeek);
      startOfWeek.setDate(startOfWeek.getDate() - 6); // 7 Tage zurück (inklusive des aktuellen Tages)
      startOfWeek.setHours(0, 0, 0, 0);

      // Reflexionsberichte der Woche abrufen
      const dailyReports = await storage.getReflectionReports({
        userId,
        reportType: 'daily',
        timeRange: { from: startOfWeek, to: endOfWeek }
      });

      // Falls keine Tagesberichte vorhanden sind, direkt Aktivitäten abrufen
      let activities: any[] = [];
      let journalEntries: any[] = [];
      let usedActivityIds: number[] = [];
      let usedJournalEntryIds: number[] = [];

      if (dailyReports.length === 0) {
        // Direkt Aktivitäten und Journaleinträge der Woche abrufen
        activities = await storage.getUserActivityLogs({
          userId,
          timeRange: { from: startOfWeek, to: endOfWeek }
        });

        journalEntries = await storage.getJournalEntries(userId, {
          from: startOfWeek, 
          to: endOfWeek 
        });

        usedActivityIds = activities.map(a => a.id);
        usedJournalEntryIds = journalEntries.map(e => e.id);
      } else {
        // IDs aus Tagesberichten sammeln
        usedActivityIds = Array.from(new Set(
          dailyReports.flatMap(r => r.includedActivities || [])
        ));
        
        usedJournalEntryIds = Array.from(new Set(
          dailyReports.flatMap(r => r.relatedJournalEntries || [])
        ));

        // Berichte entschlüsseln und Zusammenfassung erstellen
        const reportContents = await Promise.all(dailyReports.map(async (report) => {
          try {
            // Entschlüsseln würde hier passieren - wir simulieren aber nur
            return `Tagesbericht ${report.title}`;
          } catch (error) {
            logger.error(`Fehler beim Entschlüsseln des Berichts ${report.id}:`, error);
            return null;
          }
        }));

        // Filtere null-Einträge heraus
        const validReportContents = reportContents.filter(Boolean);
        
        // Aktivitäten und Journaleinträge werden für Berichterstellung benötigt
        if (usedActivityIds.length > 0) {
          activities = await Promise.all(
            usedActivityIds.map(id => storage.getUserActivityLog(id))
          );
        }
        
        if (usedJournalEntryIds.length > 0) {
          journalEntries = await Promise.all(
            usedJournalEntryIds.map(id => storage.getJournalEntry(id))
          );
        }
      }

      // Wohlbefinden-Checkins der Woche abrufen
      const wellbeingCheckins = await storage.getWellbeingCheckins(userId, {
        from: startOfWeek, 
        to: endOfWeek 
      });

      // Daten für die Berichtsgenerierung
      const reportData = {
        timeframe: { start: startOfWeek, end: endOfWeek },
        activities: activities.map(a => ({
          type: a.activityType,
          timestamp: a.timestamp,
          resourceType: a.resourceType,
          resourceId: a.resourceId,
          data: a.activityData
        })),
        journalEntries: journalEntries.map(e => ({
          id: e.id,
          title: e.title,
          mood: e.mood,
          tags: e.tags,
          createdAt: e.createdAt
        })),
        wellbeingCheckins: wellbeingCheckins.map(c => ({
          mood: c.mood,
          stressLevel: c.stressLevel,
          restLevel: c.restLevel,
          createdAt: c.createdAt
        }))
      };

      // Reflexionsbericht mit KI generieren
      const reportContent = await this.generateReflectionContent(userId, reportData, 'weekly');

      if (!reportContent) {
        logger.error(`Fehler bei der Generierung des Wochenreflexionsberichts für Benutzer ${userId}`);
        return null;
      }

      // Verschlüsselter Bericht
      const encryptedContent = encrypt(reportContent, userId.toString());

      // Extrahiere Tags aus Journal-Einträgen
      const tags = Array.from(new Set(
        journalEntries.flatMap(e => e.tags || [])
      ));

      // Titel generieren
      const weekStart = startOfWeek.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit'
      });
      
      const weekEnd = endOfWeek.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const title = `Wochenreflexion: ${weekStart} - ${weekEnd}`;

      // Bericht in der Datenbank speichern
      const reportData2: InsertReflectionReport = {
        userId,
        title,
        reportType: 'weekly',
        encryptedContent,
        timeFrame: { start: startOfWeek.toISOString(), end: endOfWeek.toISOString() },
        includedActivities: usedActivityIds,
        relatedJournalEntries: usedJournalEntryIds,
        tags,
        insights: null // Wird später mit KI-Analyse gefüllt
      };

      const report = await storage.createReflectionReport(reportData2);

      if (report && report.id) {
        // Bei wöchentlichen Berichten markieren wir keine Aktivitäten als verarbeitet,
        // da sie bereits in den Tagesberichten verarbeitet wurden
        return report.id;
      }

      return null;
    } catch (error) {
      logger.error('Fehler bei der Generierung des Wochenreflexionsberichts:', error);
      return null;
    }
  }

  /**
   * Generiert mit KI den Inhalt eines Reflexionsberichts
   */
  private async generateReflectionContent(userId: number, data: any, reportType: 'daily' | 'weekly'): Promise<string | null> {
    try {
      // Benutzerinformationen abrufen
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`Benutzer mit ID ${userId} wurde nicht gefunden`);
      }

      let promptPrefix = '';
      if (reportType === 'daily') {
        promptPrefix = `Du bist ein unterstützender Reflexionsassistent für Menschenrechtsverteidiger. Erstelle einen täglichen Reflexionsbericht auf Basis der folgenden Aktivitäten und Journaleinträge. 
Der Bericht soll dem Benutzer helfen, den Tag zu reflektieren und wichtige Erkenntnisse zu identifizieren. 
Verwende einen freundlichen, unterstützenden Ton und formuliere den Bericht in der "Du"-Form.

Strukturiere den Bericht wie folgt:
1. Kurze Zusammenfassung des Tages
2. Beobachtete Muster und Trends
3. Herausforderungen und Erfolge
4. Empfehlungen für den nächsten Tag
5. Reflexionsfragen

Berücksichtige auch die emotionale Komponente (Stimmung, Stress) aus den Daten.`;
      } else {
        promptPrefix = `Du bist ein unterstützender Reflexionsassistent für Menschenrechtsverteidiger. Erstelle einen wöchentlichen Reflexionsbericht auf Basis der folgenden Aktivitäten und Journaleinträge der letzten Woche. 
Der Bericht soll dem Benutzer helfen, die vergangene Woche zu reflektieren und wichtige Erkenntnisse zu identifizieren. 
Verwende einen freundlichen, unterstützenden Ton und formuliere den Bericht in der "Du"-Form.

Strukturiere den Bericht wie folgt:
1. Überblick über die Woche
2. Wichtige Themen und Muster
3. Fortschritte und Herausforderungen
4. Wohlbefinden und Selbstfürsorge
5. Empfehlungen für die kommende Woche
6. Reflexionsfragen

Gehe besonders auf langfristige Muster und Entwicklungen ein, die über die Woche hinweg erkennbar sind.`;
      }

      // Daten für den Prompt formatieren
      const promptData = JSON.stringify(data, null, 2);
      
      // Vollständigen Prompt erstellen
      const prompt = `${promptPrefix}

BENUTZERDATEN:
Name: ${user.fullName || 'Anonym'}
Sprache: ${user.language || 'de'}

AKTIVITÄTSDATEN:
${promptData}

Bitte erstelle nun einen ausführlichen, personalisierten Reflexionsbericht.`;

      // Anfrage an die KI senden
      const result = await analyzeWithGemini(prompt, {
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        maxOutputTokens: 2048,
      });

      return result;
    } catch (error) {
      logger.error('Fehler bei der Generierung des Reflexionsberichts:', error);
      return null;
    }
  }
}

// Singleton-Instanz
export const activityTrackingService = new ActivityTrackingService();