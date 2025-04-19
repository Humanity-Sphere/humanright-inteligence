import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
// HINWEIS: OCR muss separat implementiert werden (z.B. Cloud API oder native Bibliothek)
// Importieren Sie hier Ihre OCR-Lösung, z.B.:
// import OcrService from './OcrService'; // Angenommener separater OCR-Service

export interface CaptureOptions {
  quality?: number; // 0 bis 1, Standard: 0.8
  allowsEditing?: boolean; // Standard: false
  base64?: boolean; // Bild als Base64-String einbinden, Standard: false
  mediaTypes?: ImagePicker.MediaTypeOptions; // z.B. Images, Videos, All
  ocrLanguage?: string; // Sprache für OCR, Standard: 'deu+eng'
}

export interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  type: string; // MIME-Typ, z.B. 'image/jpeg'
  base64?: string;
  ocrText?: string; // Optional: Erkannter Text aus dem Bild
  documentType?: string; // Optional: Erkannter Dokumenttyp
}

class CameraService {
  private hasPermission: boolean = false;

  constructor() {
    this.checkPermissions();
  }

  async checkPermissions(): Promise<boolean> {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    this.hasPermission = cameraStatus === 'granted' && libraryStatus === 'granted';
    return this.hasPermission;
  }

  async captureImage(options: CaptureOptions = {}): Promise<CapturedImage | null> {
    if (!this.hasPermission) {
      const granted = await this.checkPermissions();
      if (!granted) {
        throw new Error('Keine Kameraberechtigungen erteilt');
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        quality: options.quality || 0.8,
        base64: options.base64 || false,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets?.[0];
      if (!asset) return null;

      const capturedImage: CapturedImage = {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        type: asset.type || 'image/jpeg',
        base64: asset.base64,
      };

      // Hier könnte eine OCR-Integration stattfinden
      // capturedImage.ocrText = await this.performOCR(capturedImage.uri, options.ocrLanguage);

      return capturedImage;
    } catch (error) {
      console.error('Fehler beim Aufnehmen des Bildes:', error);
      throw error;
    }
  }

  async pickImage(options: CaptureOptions = {}): Promise<CapturedImage | null> {
    if (!this.hasPermission) {
      const granted = await this.checkPermissions();
      if (!granted) {
        throw new Error('Keine Medienbibliothek-Berechtigungen erteilt');
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        quality: options.quality || 0.8,
        base64: options.base64 || false,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets?.[0];
      if (!asset) return null;

      const selectedImage: CapturedImage = {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        type: asset.type || 'image/jpeg',
        base64: asset.base64,
      };

      // Hier könnte eine OCR-Integration stattfinden
      // selectedImage.ocrText = await this.performOCR(selectedImage.uri, options.ocrLanguage);

      return selectedImage;
    } catch (error) {
      console.error('Fehler beim Auswählen des Bildes:', error);
      throw error;
    }
  }

  // Diese Methode würde in einer vollständigen Implementierung die OCR-Verarbeitung durchführen
  // async performOCR(imageUri: string, language: string = 'deu+eng'): Promise<string> {
  //   // Integration mit einem OCR-Service wie Google Cloud Vision, Tesseract oder einer anderen API
  //   // Hier würde der Code zur Texterkennung stehen
  //   return 'Erkannter Text würde hier stehen';
  // }
}

export default new CameraService();