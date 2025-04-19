import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';

/**
 * Service zur Interaktion mit Google Drive
 * Diese Klasse stellt Funktionen bereit, um Dateien auf Google Drive hochzuladen,
 * herunterzuladen und zu verwalten.
 */
export class GoogleDriveService {
  private oauth2Client: OAuth2Client;
  private drive: any;

  /**
   * Konstruktor für den GoogleDriveService
   * @param credentials Anmeldeinformationen mit Zugriff auf Google Drive
   */
  constructor(credentials: any) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
    );

    // Token setzen, wenn vorhanden
    if (credentials?.access_token) {
      this.oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        expiry_date: credentials.expiry_date
      });
    }

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Prüft, ob die Authentifizierung gültig ist
   * @returns True, wenn authentifiziert, sonst False
   */
  public isAuthenticated(): boolean {
    return !!this.oauth2Client.credentials.access_token;
  }

  /**
   * Holt ein neues Token, wenn das aktuelle abgelaufen ist
   * @returns Das aktualisierte Token oder null bei Fehler
   */
  public async refreshAccessToken(): Promise<any> {
    try {
      if (!this.oauth2Client.credentials.refresh_token) {
        throw new Error('Kein Refresh-Token vorhanden');
      }
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Tokens:', error);
      return null;
    }
  }

  /**
   * Listet Dateien im Google Drive auf
   * @param options Optionale Filter und Einstellungen
   * @returns Liste der Dateien
   */
  public async listFiles(options: any = {}): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        pageSize: options.pageSize || 30,
        fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink)',
        q: options.query || "trashed = false",
        orderBy: options.orderBy || 'modifiedTime desc'
      });
      
      return response.data.files || [];
    } catch (error) {
      console.error('Fehler beim Auflisten der Dateien:', error);
      
      // Versuchen, das Token zu aktualisieren und erneut zu versuchen
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.listFiles(options);
      }
      
      return [];
    }
  }

  /**
   * Lädt eine Datei auf Google Drive hoch
   * @param filePath Lokaler Pfad der Datei
   * @param options Optionale Einstellungen (Ordner, Dateiname, usw.)
   * @returns Informationen zur hochgeladenen Datei
   */
  public async uploadFile(filePath: string, options: any = {}): Promise<any> {
    try {
      const fileName = options.name || path.basename(filePath);
      const mimeType = options.mimeType || this.getMimeType(filePath);
      const fileMetadata = {
        name: fileName,
        ...(options.folderId ? { parents: [options.folderId] } : {})
      };
      
      const media = {
        mimeType,
        body: fs.createReadStream(filePath)
      };
      
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });
      
      return response.data;
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      
      // Versuchen, das Token zu aktualisieren und erneut zu versuchen
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.uploadFile(filePath, options);
      }
      
      throw error;
    }
  }

  /**
   * Lädt eine Datei von Google Drive herunter
   * @param fileId ID der Datei auf Google Drive
   * @param destinationPath Lokaler Pfad zum Speichern
   * @returns Pfad zur heruntergeladenen Datei
   */
  public async downloadFile(fileId: string, destinationPath: string): Promise<string> {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      
      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(destinationPath);
        response.data
          .pipe(dest)
          .on('finish', () => {
            resolve(destinationPath);
          })
          .on('error', (err: any) => {
            reject(err);
          });
      });
    } catch (error) {
      console.error('Fehler beim Herunterladen der Datei:', error);
      
      // Versuchen, das Token zu aktualisieren und erneut zu versuchen
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.downloadFile(fileId, destinationPath);
      }
      
      throw error;
    }
  }

  /**
   * Erstellt einen Ordner auf Google Drive
   * @param folderName Name des neuen Ordners
   * @param parentFolderId Optional: ID des übergeordneten Ordners
   * @returns Informationen zum erstellten Ordner
   */
  public async createFolder(folderName: string, parentFolderId?: string): Promise<any> {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId ? { parents: [parentFolderId] } : {})
      };
      
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, webViewLink'
      });
      
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Ordners:', error);
      
      // Versuchen, das Token zu aktualisieren und erneut zu versuchen
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.createFolder(folderName, parentFolderId);
      }
      
      throw error;
    }
  }

  /**
   * Teilt eine Datei oder einen Ordner mit anderen Benutzern
   * @param fileId ID der Datei oder des Ordners
   * @param emailAddress E-Mail-Adresse des Empfängers
   * @param role Rolle (reader, writer, commenter)
   * @returns Informationen zur Freigabe
   */
  public async shareFile(fileId: string, emailAddress: string, role: 'reader' | 'writer' | 'commenter' = 'reader'): Promise<any> {
    try {
      const permission = {
        type: 'user',
        role: role,
        emailAddress: emailAddress
      };
      
      const response = await this.drive.permissions.create({
        fileId: fileId,
        requestBody: permission,
        fields: 'id',
        sendNotificationEmail: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Fehler beim Teilen der Datei:', error);
      
      // Versuchen, das Token zu aktualisieren und erneut zu versuchen
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.shareFile(fileId, emailAddress, role);
      }
      
      throw error;
    }
  }

  /**
   * Löscht eine Datei oder einen Ordner
   * @param fileId ID der Datei oder des Ordners
   * @returns True bei Erfolg, False bei Fehler
   */
  public async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Datei:', error);
      
      // Versuchen, das Token zu aktualisieren und erneut zu versuchen
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.deleteFile(fileId);
      }
      
      return false;
    }
  }

  /**
   * Ermittelt den MIME-Typ anhand der Dateiendung
   * @param filePath Pfad zur Datei
   * @returns MIME-Typ der Datei
   */
  private getMimeType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.zip': 'application/zip',
      '.json': 'application/json',
      '.html': 'text/html',
      '.csv': 'text/csv'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }
}

// Singleton-Instanz für einfachen Zugriff
let driveServiceInstance: GoogleDriveService | null = null;

/**
 * Initialisiert den Google Drive Service mit den Anmeldeinformationen eines Benutzers
 * @param credentials Anmeldeinformationen mit Zugriff auf Google Drive
 * @returns Die initialisierte GoogleDriveService-Instanz
 */
export function initializeGoogleDriveService(credentials: any): GoogleDriveService {
  driveServiceInstance = new GoogleDriveService(credentials);
  return driveServiceInstance;
}

/**
 * Gibt die aktuelle GoogleDriveService-Instanz zurück oder null, wenn nicht initialisiert
 * @returns Die GoogleDriveService-Instanz oder null
 */
export function getGoogleDriveService(): GoogleDriveService | null {
  return driveServiceInstance;
}