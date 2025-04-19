import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { GoogleDriveService, initializeGoogleDriveService, getGoogleDriveService } from '../services/google-drive-service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Temporärer Speicher für hochgeladene Dateien
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    // Stellen Sie sicher, dass das Upload-Verzeichnis existiert
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Eindeutiger Dateiname generieren
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage });

// Endpoint zum Prüfen der Google Drive Authentifizierung
router.get('/auth-status', isAuthenticated, async (req, res) => {
  try {
    // Prüfen, ob der Benutzer Google Drive Anmeldeinformationen hat
    const user = req.user as any;
    
    if (!user || !user.googleCredentials) {
      return res.status(200).json({ 
        isAuthenticatedd: false, 
        message: 'Keine Google Drive Anmeldeinformationen gefunden' 
      });
    }
    
    // Den Google Drive Service mit den Anmeldeinformationen des Benutzers initialisieren
    let driveService = getGoogleDriveService();
    
    if (!driveService) {
      driveService = initializeGoogleDriveService(user.googleCredentials);
    }
    
    // Prüfen, ob die Authentifizierung gültig ist
    const isAuthenticated = driveService.isAuthenticated();
    
    if (!isAuthenticated) {
      // Versuch, das Token zu aktualisieren
      const refreshedToken = await driveService.refreshAccessToken();
      
      if (refreshedToken) {
        // Token wurde erfolgreich aktualisiert
        return res.status(200).json({ 
          isAuthenticatedd: true, 
          message: 'Authentifizierung erfolgreich (nach Token-Aktualisierung)' 
        });
      } else {
        // Token konnte nicht aktualisiert werden
        return res.status(200).json({ 
          isAuthenticatedd: false, 
          message: 'Token abgelaufen und konnte nicht aktualisiert werden' 
        });
      }
    }
    
    // Authentifizierung ist gültig
    return res.status(200).json({ 
      isAuthenticatedd: true, 
      message: 'Authentifizierung erfolgreich' 
    });
  } catch (error) {
    console.error('Fehler beim Prüfen des Google Drive Auth-Status:', error);
    return res.status(500).json({ error: 'Serverfehler bei der Authentifizierungsprüfung' });
  }
});

// Endpoint zum Auflisten von Dateien im Google Drive
router.get('/files', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    
    if (!user || !user.googleCredentials) {
      return res.status(401).json({ error: 'Keine Google Drive Anmeldeinformationen gefunden' });
    }
    
    // Den Google Drive Service mit den Anmeldeinformationen des Benutzers initialisieren
    let driveService = getGoogleDriveService();
    
    if (!driveService) {
      driveService = initializeGoogleDriveService(user.googleCredentials);
    }
    
    // Optionen aus Query-Parametern extrahieren
    const options = {
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 30,
      query: req.query.query as string || undefined,
      orderBy: req.query.orderBy as string || undefined
    };
    
    // Dateien auflisten
    const files = await driveService.listFiles(options);
    
    return res.status(200).json({ files });
  } catch (error) {
    console.error('Fehler beim Auflisten von Google Drive Dateien:', error);
    return res.status(500).json({ error: 'Serverfehler beim Auflisten der Dateien' });
  }
});

// Endpoint zum Hochladen einer Datei auf Google Drive
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const user = req.user as any;
    
    if (!user || !user.googleCredentials) {
      // Temporäre Datei löschen, falls vorhanden
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(401).json({ error: 'Keine Google Drive Anmeldeinformationen gefunden' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei zum Hochladen gefunden' });
    }
    
    // Den Google Drive Service mit den Anmeldeinformationen des Benutzers initialisieren
    let driveService = getGoogleDriveService();
    
    if (!driveService) {
      driveService = initializeGoogleDriveService(user.googleCredentials);
    }
    
    // Optionen für den Upload
    const options = {
      name: req.body.name || req.file.originalname,
      folderId: req.body.folderId || undefined,
      mimeType: req.body.mimeType || undefined
    };
    
    // Datei hochladen
    const uploadResult = await driveService.uploadFile(req.file.path, options);
    
    // Temporäre Datei löschen
    fs.unlinkSync(req.file.path);
    
    return res.status(200).json({ 
      success: true, 
      file: uploadResult 
    });
  } catch (error) {
    console.error('Fehler beim Hochladen auf Google Drive:', error);
    
    // Temporäre Datei löschen, falls vorhanden
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Fehler beim Löschen der temporären Datei:', unlinkError);
      }
    }
    
    return res.status(500).json({ error: 'Serverfehler beim Datei-Upload' });
  }
});

// Endpoint zum Erstellen eines Ordners auf Google Drive
router.post('/folders', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    
    if (!user || !user.googleCredentials) {
      return res.status(401).json({ error: 'Keine Google Drive Anmeldeinformationen gefunden' });
    }
    
    const { folderName, parentFolderId } = req.body;
    
    if (!folderName) {
      return res.status(400).json({ error: 'Ordnername ist erforderlich' });
    }
    
    // Den Google Drive Service mit den Anmeldeinformationen des Benutzers initialisieren
    let driveService = getGoogleDriveService();
    
    if (!driveService) {
      driveService = initializeGoogleDriveService(user.googleCredentials);
    }
    
    // Ordner erstellen
    const folder = await driveService.createFolder(folderName, parentFolderId);
    
    return res.status(200).json({ 
      success: true, 
      folder 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Ordners:', error);
    return res.status(500).json({ error: 'Serverfehler beim Erstellen des Ordners' });
  }
});

// Endpoint zum Teilen einer Datei oder eines Ordners
router.post('/share', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    
    if (!user || !user.googleCredentials) {
      return res.status(401).json({ error: 'Keine Google Drive Anmeldeinformationen gefunden' });
    }
    
    const { fileId, emailAddress, role } = req.body;
    
    if (!fileId || !emailAddress) {
      return res.status(400).json({ error: 'Datei-ID und E-Mail-Adresse sind erforderlich' });
    }
    
    // Den Google Drive Service mit den Anmeldeinformationen des Benutzers initialisieren
    let driveService = getGoogleDriveService();
    
    if (!driveService) {
      driveService = initializeGoogleDriveService(user.googleCredentials);
    }
    
    // Datei teilen
    const permission = await driveService.shareFile(
      fileId, 
      emailAddress, 
      (role as 'reader' | 'writer' | 'commenter') || 'reader'
    );
    
    return res.status(200).json({ 
      success: true, 
      permission 
    });
  } catch (error) {
    console.error('Fehler beim Teilen der Datei:', error);
    return res.status(500).json({ error: 'Serverfehler beim Teilen der Datei' });
  }
});

// Endpoint zum Löschen einer Datei oder eines Ordners
router.delete('/files/:fileId', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    
    if (!user || !user.googleCredentials) {
      return res.status(401).json({ error: 'Keine Google Drive Anmeldeinformationen gefunden' });
    }
    
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'Datei-ID ist erforderlich' });
    }
    
    // Den Google Drive Service mit den Anmeldeinformationen des Benutzers initialisieren
    let driveService = getGoogleDriveService();
    
    if (!driveService) {
      driveService = initializeGoogleDriveService(user.googleCredentials);
    }
    
    // Datei löschen
    const success = await driveService.deleteFile(fileId);
    
    if (success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Datei erfolgreich gelöscht' 
      });
    } else {
      return res.status(500).json({ error: 'Fehler beim Löschen der Datei' });
    }
  } catch (error) {
    console.error('Fehler beim Löschen der Datei:', error);
    return res.status(500).json({ error: 'Serverfehler beim Löschen der Datei' });
  }
});

export default router;