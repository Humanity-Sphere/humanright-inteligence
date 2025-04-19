
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

/**
 * LocalModelService für die mobile App
 * Ermöglicht die Nutzung lokaler KI-Modelle auf dem Smartphone
 */
export class LocalModelService {
  private modelUrl: string | null = null;
  private isConnected: boolean = false;

  constructor(modelUrl?: string) {
    this.modelUrl = modelUrl || null;
  }

  /**
   * Konfiguriert das Service mit der URL des lokalen Modells
   */
  public configure(modelUrl: string): void {
    this.modelUrl = modelUrl;
  }

  /**
   * Prüft, ob das lokale Modell erreichbar ist
   */
  public async checkConnection(): Promise<boolean> {
    if (!this.modelUrl) {
      this.isConnected = false;
      return false;
    }

    try {
      const response = await axios.get(`${this.modelUrl}/health`, { timeout: 5000 });
      this.isConnected = response.status === 200;
      return this.isConnected;
    } catch (error) {
      console.warn('Lokales Modell nicht erreichbar:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Generiert Text mit einem lokalen Modell
   */
  public async generateText(prompt: string, options: any = {}): Promise<string> {
    if (!this.modelUrl) {
      throw new Error('Lokaler KI-Service nicht konfiguriert');
    }

    try {
      const response = await axios.post(`${this.modelUrl}/generate`, {
        prompt,
        ...options
      });

      return response.data.response || JSON.stringify(response.data);
    } catch (error) {
      console.error('Fehler bei der Textgenerierung:', error);
      throw new Error(`Fehler bei der Textgenerierung: ${error.message}`);
    }
  }

  /**
   * Generiert multimodalen Inhalt mit einem lokalen Modell
   */
  public async generateMultimodalContent(
    prompt: string, 
    imageUri: string,
    options: any = {}
  ): Promise<string> {
    if (!this.modelUrl) {
      throw new Error('Lokaler KI-Service nicht konfiguriert');
    }

    try {
      // Bild als Base64 kodieren
      const base64Image = await this.getBase64FromUri(imageUri);
      
      const payload = {
        prompt,
        image: base64Image,
        ...options
      };

      const response = await axios.post(`${this.modelUrl}/generate_multimodal`, payload);
      return response.data.response || JSON.stringify(response.data);
    } catch (error) {
      console.error('Fehler bei der multimodalen Inhaltsgenerierung:', error);
      throw new Error(`Fehler bei der multimodalen Inhaltsgenerierung: ${error.message}`);
    }
  }

  /**
   * Konvertiert einen Bild-URI in einen Base64-String
   */
  private async getBase64FromUri(uri: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Datei existiert nicht');
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return base64;
    } catch (error) {
      console.error('Fehler beim Konvertieren des Bildes:', error);
      throw error;
    }
  }

  /**
   * Wählt ein Bild aus der Galerie aus
   */
  public async pickImage(): Promise<string | null> {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      alert('Zugriff auf die Galerie wird benötigt, um Bilder auswählen zu können');
      return null;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  }
}

// Singleton-Instanz exportieren
export const localModelService = new LocalModelService();
export default localModelService;
