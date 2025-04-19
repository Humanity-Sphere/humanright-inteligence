import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * LocalModelService - Ein Service zur Interaktion mit lokal laufenden KI-Modellen
 * Unterstützt verschiedene Arten von lokalen Modellen:
 * 1. Lokale HTTP-APIs (z.B. Ollama, LM Studio, LlamaFile, etc.)
 * 2. Python-Modelle via Python-Subprocess
 * 3. JavaScript-Modelle via Node.js-Integration
 */
export class LocalModelService {
  private localModelPath: string | null = null;
  private localModelUrl: string | null = null;
  private localModelType: 'api' | 'python' | 'node' | null = null;
  private pythonPath: string = 'python'; // Standardmäßig verwenden wir den Python-Befehl im Pfad
  
  /**
   * Initialisiert den LocalModelService mit einem Pfad oder URL zu einem lokalen Modell
   */
  constructor(
    modelPathOrUrl?: string, 
    modelType?: 'api' | 'python' | 'node',
    pythonPath?: string
  ) {
    if (modelPathOrUrl) {
      this.localModelPath = modelPathOrUrl;
      this.localModelType = modelType || this.detectModelType(modelPathOrUrl);
    }
    
    if (pythonPath) {
      this.pythonPath = pythonPath;
    }
    
    // Konfiguration aus Umgebungsvariablen laden
    if (process.env.LOCAL_MODEL_PATH) {
      this.localModelPath = process.env.LOCAL_MODEL_PATH;
      this.localModelType = (process.env.LOCAL_MODEL_TYPE as any) || this.detectModelType(process.env.LOCAL_MODEL_PATH);
    }
    
    if (process.env.LOCAL_MODEL_URL) {
      this.localModelUrl = process.env.LOCAL_MODEL_URL;
      this.localModelType = 'api';
    }
    
    if (process.env.PYTHON_PATH) {
      this.pythonPath = process.env.PYTHON_PATH;
    }
    
    this.logConfiguration();
  }
  
  /**
   * Erkennt den Typ des Modells basierend auf dem Pfad oder der URL
   */
  private detectModelType(pathOrUrl: string): 'api' | 'python' | 'node' {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return 'api';
    }
    
    if (pathOrUrl.endsWith('.py')) {
      return 'python';
    }
    
    if (pathOrUrl.endsWith('.js') || pathOrUrl.endsWith('.ts')) {
      return 'node';
    }
    
    // Standardmäßig versuchen wir es als API
    return 'api';
  }
  
  /**
   * Protokolliert die aktuelle Konfiguration
   */
  private logConfiguration(): void {
    console.log('[LocalModelService] Konfiguration:');
    console.log(`- Modellpfad: ${this.localModelPath || 'Nicht konfiguriert'}`);
    console.log(`- Modell-URL: ${this.localModelUrl || 'Nicht konfiguriert'}`);
    console.log(`- Modelltyp: ${this.localModelType || 'Nicht konfiguriert'}`);
    console.log(`- Python-Pfad: ${this.pythonPath}`);
  }
  
  /**
   * Prüft, ob ein lokales Modell konfiguriert ist
   */
  public isConfigured(): boolean {
    return Boolean(this.localModelPath || this.localModelUrl);
  }
  
  /**
   * Sendet eine Anfrage an ein lokales API-Modell
   */
  private async queryApiModel(prompt: string, options: any = {}): Promise<string> {
    if (!this.localModelUrl && !this.localModelPath) {
      throw new Error('Lokales API-Modell nicht konfiguriert');
    }
    
    const url = this.localModelUrl || `http://localhost:11434/api/generate`;
    
    try {
      // Standard-Request-Format für Ollama
      const payload = {
        model: options.model || 'llama3',
        prompt: prompt,
        stream: false,
        ...options
      };
      
      const response = await axios.post(url, payload);
      
      // Verschiedene Antwortformate unterstützen
      if (response.data.response) {
        return response.data.response;
      } else if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else if (response.data.generated_text) {
        return response.data.generated_text;
      } else {
        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.error('[LocalModelService] Fehler bei API-Anfrage:', error);
      throw new Error(`Fehler bei Anfrage an lokales Modell: ${error.message}`);
    }
  }
  
  /**
   * Führt ein Python-Skript aus, um ein lokales Modell zu befragen
   */
  private async queryPythonModel(prompt: string, options: any = {}): Promise<string> {
    if (!this.localModelPath) {
      throw new Error('Lokales Python-Modell nicht konfiguriert');
    }
    
    return new Promise((resolve, reject) => {
      // Erstelle eine temporäre JSON-Datei mit dem Prompt und Optionen
      const tempInputFile = path.join(process.cwd(), 'temp_input.json');
      const tempOutputFile = path.join(process.cwd(), 'temp_output.json');
      
      // Wenn die Dateien bereits existieren, lösche sie
      if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile);
      if (fs.existsSync(tempOutputFile)) fs.unlinkSync(tempOutputFile);
      
      // Schreibe Prompt und Optionen in die Eingabedatei
      fs.writeFileSync(tempInputFile, JSON.stringify({
        prompt,
        options
      }));
      
      // Parameter für das Python-Skript
      const args = [
        this.localModelPath!,
        tempInputFile,
        tempOutputFile
      ];
      
      // Führe das Python-Skript aus
      const pythonProcess = spawn(this.pythonPath, args);
      
      let errorOutput = '';
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        // Lösche die Eingabedatei
        if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile);
        
        if (code !== 0) {
          reject(new Error(`Python-Prozess beendet mit Code ${code}: ${errorOutput}`));
          return;
        }
        
        // Lese die Ausgabedatei
        if (!fs.existsSync(tempOutputFile)) {
          reject(new Error('Ausgabedatei wurde nicht erstellt'));
          return;
        }
        
        try {
          const output = JSON.parse(fs.readFileSync(tempOutputFile, 'utf-8'));
          
          // Lösche die Ausgabedatei
          fs.unlinkSync(tempOutputFile);
          
          resolve(output.response || JSON.stringify(output));
        } catch (error) {
          reject(new Error(`Fehler beim Lesen der Ausgabedatei: ${error.message}`));
        }
      });
    });
  }
  
  /**
   * Importiert ein Node.js-Modul dynamisch und führt es aus, um ein lokales Modell zu befragen
   */
  private async queryNodeModel(prompt: string, options: any = {}): Promise<string> {
    if (!this.localModelPath) {
      throw new Error('Lokales Node.js-Modell nicht konfiguriert');
    }
    
    try {
      // Importiere das Modul dynamisch
      const modelModule = await import(this.localModelPath);
      
      // Führe die generate-Funktion aus, falls vorhanden
      if (typeof modelModule.generate === 'function') {
        return await modelModule.generate(prompt, options);
      }
      
      // Führe die default-Funktion aus, falls vorhanden
      if (typeof modelModule.default === 'function') {
        return await modelModule.default(prompt, options);
      }
      
      throw new Error('Das Node.js-Modul enthält keine generate- oder default-Funktion');
    } catch (error) {
      console.error('[LocalModelService] Fehler beim Ausführen des Node.js-Moduls:', error);
      throw new Error(`Fehler beim Ausführen des lokalen Node.js-Modells: ${error.message}`);
    }
  }
  
  /**
   * Generiert Text mit dem lokal konfigurierten Modell
   */
  public async generateText(prompt: string, options: any = {}): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Lokales Modell nicht konfiguriert');
    }
    
    console.log(`[LocalModelService] Generiere Text mit Modelltyp ${this.localModelType}`);
    
    try {
      switch (this.localModelType) {
        case 'api':
          return await this.queryApiModel(prompt, options);
        case 'python':
          return await this.queryPythonModel(prompt, options);
        case 'node':
          return await this.queryNodeModel(prompt, options);
        default:
          throw new Error(`Unbekannter Modelltyp: ${this.localModelType}`);
      }
    } catch (error) {
      console.error('[LocalModelService] Fehler bei der Textgenerierung:', error);
      return `Fehler bei der Textgenerierung: ${error.message}`;
    }
  }
  
  /**
   * Verarbeitet multimodale Eingaben (Text und Bilder) mit dem lokal konfigurierten Modell
   * @param text Der Textprompt
   * @param imageData Base64-codierte Bilddaten oder Pfad zu einem lokalen Bild
   * @param options Zusätzliche Optionen für das Modell
   */
  public async generateMultimodalContent(text: string, imageData: string | Buffer, options: any = {}): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Lokales Modell nicht konfiguriert');
    }
    
    console.log(`[LocalModelService] Generiere multimodalen Inhalt mit Modelltyp ${this.localModelType}`);
    
    try {
      switch (this.localModelType) {
        case 'api':
          return await this.queryMultimodalApiModel(text, imageData, options);
        case 'python':
          return await this.queryMultimodalPythonModel(text, imageData, options);
        case 'node':
          return await this.queryMultimodalNodeModel(text, imageData, options);
        default:
          throw new Error(`Unbekannter Modelltyp: ${this.localModelType}`);
      }
    } catch (error) {
      console.error('[LocalModelService] Fehler bei der multimodalen Inhaltsgenerierung:', error);
      return `Fehler bei der multimodalen Inhaltsgenerierung: ${error.message}`;
    }
  }
  
  /**
   * Sendet eine multimodale Anfrage an ein lokales API-Modell
   */
  private async queryMultimodalApiModel(text: string, imageData: string | Buffer, options: any = {}): Promise<string> {
    if (!this.localModelUrl && !this.localModelPath) {
      throw new Error('Lokales API-Modell nicht konfiguriert');
    }
    
    const url = this.localModelUrl || `http://localhost:11434/api/generate`;
    
    try {
      // Bild als Base64 konvertieren, falls es als Buffer vorliegt
      const imageBase64 = Buffer.isBuffer(imageData) ? imageData.toString('base64') : imageData;
      
      // Standard-Request-Format für Ollama mit Multimodal-Unterstützung
      const payload = {
        model: options.model || 'llava',
        prompt: text,
        images: [imageBase64],
        stream: false,
        ...options
      };
      
      const response = await axios.post(url, payload);
      
      // Verschiedene Antwortformate unterstützen
      if (response.data.response) {
        return response.data.response;
      } else if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else if (response.data.generated_text) {
        return response.data.generated_text;
      } else {
        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.error('[LocalModelService] Fehler bei multimodaler API-Anfrage:', error);
      throw new Error(`Fehler bei Anfrage an lokales multimodales Modell: ${error.message}`);
    }
  }
  
  /**
   * Führt ein Python-Skript aus, um ein lokales multimodales Modell zu befragen
   */
  private async queryMultimodalPythonModel(text: string, imageData: string | Buffer, options: any = {}): Promise<string> {
    if (!this.localModelPath) {
      throw new Error('Lokales Python-Modell nicht konfiguriert');
    }
    
    return new Promise((resolve, reject) => {
      // Erstelle eine temporäre JSON-Datei mit dem Prompt und Optionen
      const tempInputFile = path.join(process.cwd(), 'temp_multimodal_input.json');
      const tempOutputFile = path.join(process.cwd(), 'temp_multimodal_output.json');
      const tempImageFile = path.join(process.cwd(), 'temp_image.jpg');
      
      // Wenn die Dateien bereits existieren, lösche sie
      if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile);
      if (fs.existsSync(tempOutputFile)) fs.unlinkSync(tempOutputFile);
      if (fs.existsSync(tempImageFile)) fs.unlinkSync(tempImageFile);
      
      // Bild speichern, wenn es als Buffer oder Base64 vorliegt
      if (Buffer.isBuffer(imageData)) {
        fs.writeFileSync(tempImageFile, imageData);
      } else if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
        // Base64-String verarbeiten und speichern
        const base64Data = imageData.split(',')[1];
        fs.writeFileSync(tempImageFile, Buffer.from(base64Data, 'base64'));
      } else if (typeof imageData === 'string') {
        // Falls es ein Pfad ist, diesen verwenden
        fs.copyFileSync(imageData, tempImageFile);
      }
      
      // Schreibe Prompt und Optionen in die Eingabedatei
      fs.writeFileSync(tempInputFile, JSON.stringify({
        prompt: text,
        image_path: tempImageFile,
        options
      }));
      
      // Parameter für das Python-Skript
      const args = [
        this.localModelPath!,
        tempInputFile,
        tempOutputFile
      ];
      
      // Führe das Python-Skript aus
      const pythonProcess = spawn(this.pythonPath, args);
      
      let errorOutput = '';
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        // Lösche die Eingabedatei und das Bild
        if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile);
        if (fs.existsSync(tempImageFile)) fs.unlinkSync(tempImageFile);
        
        if (code !== 0) {
          reject(new Error(`Python-Prozess beendet mit Code ${code}: ${errorOutput}`));
          return;
        }
        
        // Lese die Ausgabedatei
        if (!fs.existsSync(tempOutputFile)) {
          reject(new Error('Ausgabedatei wurde nicht erstellt'));
          return;
        }
        
        try {
          const output = JSON.parse(fs.readFileSync(tempOutputFile, 'utf-8'));
          
          // Lösche die Ausgabedatei
          fs.unlinkSync(tempOutputFile);
          
          resolve(output.response || JSON.stringify(output));
        } catch (error) {
          reject(new Error(`Fehler beim Lesen der Ausgabedatei: ${error.message}`));
        }
      });
    });
  }
  
  /**
   * Importiert ein Node.js-Modul dynamisch und führt es aus, um ein lokales multimodales Modell zu befragen
   */
  private async queryMultimodalNodeModel(text: string, imageData: string | Buffer, options: any = {}): Promise<string> {
    if (!this.localModelPath) {
      throw new Error('Lokales Node.js-Modell nicht konfiguriert');
    }
    
    try {
      // Importiere das Modul dynamisch
      const modelModule = await import(this.localModelPath);
      
      // Führe die generateMultimodal-Funktion aus, falls vorhanden
      if (typeof modelModule.generateMultimodal === 'function') {
        return await modelModule.generateMultimodal(text, imageData, options);
      }
      
      // Führe die default-Funktion aus und übergebe Image und Text
      if (typeof modelModule.default === 'function') {
        return await modelModule.default(text, { image: imageData, ...options });
      }
      
      throw new Error('Das Node.js-Modul enthält keine generateMultimodal- oder default-Funktion mit Bildunterstützung');
    } catch (error) {
      console.error('[LocalModelService] Fehler beim Ausführen des multimodalen Node.js-Moduls:', error);
      throw new Error(`Fehler beim Ausführen des lokalen multimodalen Node.js-Modells: ${error.message}`);
    }
  }
  
  /**
   * Prüft, ob das konfigurierte lokale Modell verfügbar ist
   */
  public async checkAvailability(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }
    
    try {
      // Einfachen Prompt senden, um zu prüfen, ob das Modell antwortet
      await this.generateText('Hallo, bist du verfügbar?', { max_tokens: 10 });
      return true;
    } catch (error) {
      console.error('[LocalModelService] Modell nicht verfügbar:', error);
      return false;
    }
  }
}

// Singleton-Export für einfache Verwendung
export const localModelService = new LocalModelService();