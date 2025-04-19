import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * LocalStorageService - Dienst zur Verwaltung des lokalen Speichers in der mobilen App
 * 
 * Dieser Service bietet eine einheitliche Schnittstelle für persistente Datenspeicherung
 * unter Verwendung von AsyncStorage. Er unterstützt das Speichern verschiedener Datentypen
 * und bietet Dienstprogramme für allgemeine Speichervorgänge.
 */
export class LocalStorageService {
  /**
   * Speichert einen Wert mit einem Schlüssel
   * Unterstützt primitive Datentypen, Objekte und Arrays durch automatische Serialisierung
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      let valueToStore: string;
      
      // Serialisieren, wenn es kein String ist
      if (typeof value !== 'string') {
        valueToStore = JSON.stringify(value);
      } else {
        valueToStore = value;
      }
      
      await AsyncStorage.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Fehler beim Speichern von Wert für Schlüssel ${key}:`, error);
      throw error;
    }
  }

  /**
   * Ruft einen Wert anhand eines Schlüssels ab
   * Gibt den Rohwert als String zurück; verwende getObject für geparste Objekte
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Fehler beim Abrufen des Werts für Schlüssel ${key}:`, error);
      return null;
    }
  }

  /**
   * Ruft einen Wert ab und parsed ihn als JSON-Objekt
   * Gibt null zurück, wenn der Wert nicht existiert oder nicht geparst werden kann
   */
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Fehler beim Parsen des JSON-Objekts für Schlüssel ${key}:`, error);
      return null;
    }
  }

  /**
   * Entfernt einen Wert anhand eines Schlüssels
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Fehler beim Entfernen des Werts für Schlüssel ${key}:`, error);
      throw error;
    }
  }

  /**
   * Prüft, ob ein Schlüssel im Speicher existiert
   */
  async hasKey(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Fehler beim Prüfen des Schlüssels ${key}:`, error);
      return false;
    }
  }

  /**
   * Löscht alle gespeicherten Werte
   * Sei vorsichtig mit dieser Methode!
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Fehler beim Löschen des lokalen Speichers:', error);
      throw error;
    }
  }

  /**
   * Ruft alle Schlüssel im Speicher ab
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Fehler beim Abrufen aller Schlüssel:', error);
      return [];
    }
  }

  /**
   * Ruft mehrere Elemente als Schlüssel-Wert-Paare ab
   */
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Fehler beim Mehrfachabruf von Werten:', error);
      return [];
    }
  }
  
  /**
   * Speichert mehrere Elemente als Schlüssel-Wert-Paare
   */
  async multiSet(items: Array<[string, string]>): Promise<void> {
    try {
      await AsyncStorage.multiSet(items);
    } catch (error) {
      console.error('Fehler beim Mehrfachspeichern von Werten:', error);
      throw error;
    }
  }
  
  /**
   * Entfernt mehrere Elemente anhand ihrer Schlüssel
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Fehler beim Mehrfachentfernen von Werten:', error);
      throw error;
    }
  }
  
  /**
   * Speichert ein Objekt als JSON unter einem Schlüssel
   * Dies ist eine Komfortmethode, die setItem mit automatischer Serialisierung verwendet
   */
  async setObject<T>(key: string, object: T): Promise<void> {
    return this.setItem(key, object);
  }
  
  /**
   * Speichert einen Wert mit einem Schlüssel für eine begrenzte Zeit (in Millisekunden)
   * Der Wert wird mit einem Ablaufdatum gespeichert
   */
  async setWithExpiry(key: string, value: any, ttl: number): Promise<void> {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    
    await this.setItem(key, item);
  }
  
  /**
   * Ruft einen Wert mit Ablaufzeit ab
   * Gibt null zurück, wenn der Wert abgelaufen ist und entfernt ihn in diesem Fall
   */
  async getWithExpiry<T>(key: string): Promise<T | null> {
    const itemStr = await this.getItem(key);
    if (!itemStr) return null;
    
    try {
      const item = JSON.parse(itemStr);
      
      // Prüfen, ob das Element abgelaufen ist
      if (item.expiry && Date.now() > item.expiry) {
        // Abgelaufenes Element entfernen
        await this.removeItem(key);
        return null;
      }
      
      return item.value as T;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Werts mit Ablaufzeit für Schlüssel ${key}:`, error);
      return null;
    }
  }
}