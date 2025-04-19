import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service für die Verschlüsselung und Entschlüsselung von Daten
 * Verwendet SecureStore für den Schlüssel (iOS, Android) und AsyncStorage als Fallback (Web)
 */
class EncryptionService {
  private readonly ENCRYPTION_KEY_ID = 'hr_defender_encryption_key';
  private encryptionKey: string | null = null;
  
  /**
   * Initialisiert den Verschlüsselungsservice
   */
  public async initialize(): Promise<void> {
    try {
      // Bestehenden Schlüssel laden oder neuen generieren
      const key = await this.getEncryptionKey();
      if (key) {
        this.encryptionKey = key;
        console.log('Verschlüsselungsschlüssel geladen');
      } else {
        await this.generateNewEncryptionKey();
        console.log('Neuer Verschlüsselungsschlüssel generiert');
      }
    } catch (error) {
      console.error('Fehler bei der Initialisierung des Verschlüsselungsservices:', error);
      throw new Error('Verschlüsselungsservice konnte nicht initialisiert werden');
    }
  }
  
  /**
   * Verschlüsselt Daten mit dem aktuellen Schlüssel
   */
  public encrypt(data: any): string {
    if (!this.encryptionKey) {
      throw new Error('Verschlüsselungsschlüssel nicht initialisiert');
    }
    
    try {
      // Konvertiere Daten in String und verschlüssele
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      return CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();
    } catch (error) {
      console.error('Fehler bei der Verschlüsselung:', error);
      throw new Error('Daten konnten nicht verschlüsselt werden');
    }
  }
  
  /**
   * Entschlüsselt Daten mit dem aktuellen Schlüssel
   */
  public decrypt(encryptedData: string): any {
    if (!this.encryptionKey) {
      throw new Error('Verschlüsselungsschlüssel nicht initialisiert');
    }
    
    try {
      // Entschlüssele und versuche als JSON zu parsen
      const decryptedString = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey).toString(CryptoJS.enc.Utf8);
      try {
        return JSON.parse(decryptedString);
      } catch {
        // Falls kein gültiges JSON, gib den String zurück
        return decryptedString;
      }
    } catch (error) {
      console.error('Fehler bei der Entschlüsselung:', error);
      throw new Error('Daten konnten nicht entschlüsselt werden');
    }
  }
  
  /**
   * Generiert einen neuen Verschlüsselungsschlüssel und speichert ihn sicher
   */
  private async generateNewEncryptionKey(): Promise<void> {
    const newKey = uuidv4() + uuidv4() + Date.now().toString();
    this.encryptionKey = newKey;
    
    await this.saveEncryptionKey(newKey);
  }
  
  /**
   * Lädt den Verschlüsselungsschlüssel aus dem sicheren Speicher
   */
  private async getEncryptionKey(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(this.ENCRYPTION_KEY_ID);
    } else {
      return await SecureStore.getItemAsync(this.ENCRYPTION_KEY_ID);
    }
  }
  
  /**
   * Speichert den Verschlüsselungsschlüssel im sicheren Speicher
   */
  private async saveEncryptionKey(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(this.ENCRYPTION_KEY_ID, key);
    } else {
      await SecureStore.setItemAsync(this.ENCRYPTION_KEY_ID, key);
    }
  }
  
  /**
   * Löscht den Verschlüsselungsschlüssel (für Logout/Reset)
   */
  public async resetEncryptionKey(): Promise<void> {
    this.encryptionKey = null;
    
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(this.ENCRYPTION_KEY_ID);
    } else {
      await SecureStore.deleteItemAsync(this.ENCRYPTION_KEY_ID);
    }
    
    console.log('Verschlüsselungsschlüssel zurückgesetzt');
  }
}

// Singleton-Instanz
export default new EncryptionService();