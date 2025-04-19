import SmartGlassService, { GlassDisplayOptions } from './SmartGlassService';
import LocalStorageService from './LocalStorageService';
import VoiceRecognitionService from './VoiceRecognitionService';
import axios from 'axios';

// Kommandotypen für den Sprachassistenten
export enum AssistantCommandType {
  CAPTURE_IMAGE = 'CAPTURE_IMAGE',
  ANALYZE_DOCUMENT = 'ANALYZE_DOCUMENT',
  MULTIMODAL_ANALYSIS = 'MULTIMODAL_ANALYSIS',
  SEARCH_KNOWLEDGE = 'SEARCH_KNOWLEDGE',
  CREATE_SESSION = 'CREATE_SESSION',
  GENERATE_CONTENT = 'GENERATE_CONTENT',
  TRANSLATION = 'TRANSLATION',
  SUMMARIZE = 'SUMMARIZE',
  PROVIDE_GUIDANCE = 'PROVIDE_GUIDANCE',
  SYSTEM_CONTROL = 'SYSTEM_CONTROL'
}

// Struktur für ein erkanntes Sprachkommando
export interface RecognizedCommand {
  type: AssistantCommandType;
  confidence: number;
  parameters: Record<string, any>;
  originalQuery: string;
}

// Struktur für eine Assistentenantwort
export interface AssistantResponse {
  text: string;
  displayOptions?: GlassDisplayOptions;
  requiresUserAction?: boolean;
  suggestedActions?: string[];
  data?: any;
}

// Aktionen, die der Assistent durchführen kann
interface AssistantAction {
  commandType: AssistantCommandType;
  keywords: string[];
  handler: (command: RecognizedCommand) => Promise<AssistantResponse>;
}

/**
 * Service für Sprachassistent und Google Assistant Integration
 */
class AssistantService {
  private static instance: AssistantService;
  private isListening: boolean = false;
  private actions: AssistantAction[] = [];
  private serverUrl: string = '';
  
  /**
   * Singleton-Instanz erhalten
   */
  public static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }
  
  /**
   * Konstruktor mit Initialisierung der Aktionen
   */
  private constructor() {
    // Server-URL setzen (wird in einer echten App aus der Konfiguration geladen)
    this.serverUrl = 'http://localhost:5000';
    
    // Aktionen registrieren
    this.registerActions();
  }
  
  /**
   * Verfügbare Aktionen registrieren
   */
  private registerActions(): void {
    // Bild aufnehmen
    this.actions.push({
      commandType: AssistantCommandType.CAPTURE_IMAGE,
      keywords: ['foto', 'bild', 'aufnehmen', 'kamera', 'fotografieren', 'capture'],
      handler: async (command) => {
        try {
          await SmartGlassService.displayText('Nehme Bild auf...', { duration: 2000 });
          const image = await SmartGlassService.captureGlassImage();
          
          if (image) {
            return {
              text: 'Bild erfolgreich aufgenommen',
              displayOptions: { position: 'bottom', duration: 3000 }
            };
          } else {
            return {
              text: 'Bildaufnahme fehlgeschlagen',
              displayOptions: { position: 'bottom', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler bei Bildaufnahme:', error);
          return {
            text: 'Fehler bei der Bildaufnahme',
            displayOptions: { position: 'bottom', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Dokument analysieren
    this.actions.push({
      commandType: AssistantCommandType.ANALYZE_DOCUMENT,
      keywords: ['analysiere', 'dokument', 'text erkennen', 'ocr', 'scan', 'scannen'],
      handler: async (command) => {
        try {
          await SmartGlassService.displayText('Analysiere Dokument...', { duration: 2000 });
          const ocrResult = await SmartGlassService.captureAndAnalyzeImage();
          
          if (ocrResult && ocrResult.text) {
            const shortText = ocrResult.text.length > 100 
              ? ocrResult.text.substring(0, 100) + '...' 
              : ocrResult.text;
              
            return {
              text: 'Dokument erfolgreich analysiert',
              displayOptions: { position: 'bottom', duration: 3000 },
              data: { text: shortText, fullText: ocrResult.text }
            };
          } else {
            return {
              text: 'Dokumentanalyse fehlgeschlagen',
              displayOptions: { position: 'bottom', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler bei Dokumentanalyse:', error);
          return {
            text: 'Fehler bei der Dokumentanalyse',
            displayOptions: { position: 'bottom', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Multimodale Analyse
    this.actions.push({
      commandType: AssistantCommandType.MULTIMODAL_ANALYSIS,
      keywords: ['multimodal', 'kombiniert', 'bild und sprache', 'beides', 'komplettanalyse'],
      handler: async (command) => {
        try {
          await SmartGlassService.displayText('Starte multimodale Analyse...', { duration: 2000 });
          
          const analysisResult = await SmartGlassService.performMultimodalAnalysis(
            'Bitte beschreiben Sie nach der Aufnahme, was Sie im Bild sehen'
          );
          
          if (analysisResult.ocr && analysisResult.voice) {
            // Beide Modalitäten erfolgreich
            return {
              text: 'Multimodale Analyse abgeschlossen',
              displayOptions: { position: 'center', duration: 3000 },
              data: { 
                imageOcr: analysisResult.ocr.text,
                voiceDescription: analysisResult.voice
              }
            };
          } else if (analysisResult.ocr) {
            // Nur OCR erfolgreich
            return {
              text: 'Nur Bildanalyse erfolgreich, keine Sprachdaten',
              displayOptions: { position: 'center', duration: 3000 },
              data: { imageOcr: analysisResult.ocr.text }
            };
          } else if (analysisResult.voice) {
            // Nur Sprache erfolgreich
            return {
              text: 'Nur Sprachanalyse erfolgreich, keine Bilddaten',
              displayOptions: { position: 'center', duration: 3000 },
              data: { voiceDescription: analysisResult.voice }
            };
          } else {
            // Beide fehlgeschlagen
            return {
              text: 'Multimodale Analyse fehlgeschlagen',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler bei multimodaler Analyse:', error);
          return {
            text: 'Fehler bei der multimodalen Analyse',
            displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Wissen suchen
    this.actions.push({
      commandType: AssistantCommandType.SEARCH_KNOWLEDGE,
      keywords: ['suche', 'finde', 'recherchiere', 'wissen', 'information', 'kontext'],
      handler: async (command) => {
        try {
          const query = command.parameters.query || command.originalQuery;
          
          await SmartGlassService.displayText(`Suche nach: ${query}...`, { duration: 3000 });
          
          // API-Anfrage an den Server für die Wissenssuche
          try {
            const response = await axios.get(`${this.serverUrl}/api/knowledge-contexts/search`, {
              params: { query }
            });
            
            if (response.data && response.data.length > 0) {
              const resultCount = response.data.length;
              const firstResult = response.data[0];
              
              return {
                text: `${resultCount} Ergebnisse gefunden`,
                displayOptions: { position: 'center', duration: 3000 },
                data: { results: response.data }
              };
            } else {
              return {
                text: 'Keine Ergebnisse gefunden',
                displayOptions: { position: 'center', duration: 3000 }
              };
            }
          } catch (apiError) {
            console.error('API-Fehler bei der Wissenssuche:', apiError);
            return {
              text: 'Fehler bei der Wissenssuche',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler bei der Wissenssuche:', error);
          return {
            text: 'Fehler bei der Wissenssuche',
            displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Neue Session erstellen
    this.actions.push({
      commandType: AssistantCommandType.CREATE_SESSION,
      keywords: ['neue session', 'starte session', 'beginne sitzung', 'neue sitzung'],
      handler: async (command) => {
        try {
          const success = await SmartGlassService.startNewSession();
          
          if (success) {
            return {
              text: 'Neue Smart Glass-Session gestartet',
              displayOptions: { position: 'center', duration: 3000 }
            };
          } else {
            return {
              text: 'Fehler beim Starten der Session',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler beim Erstellen einer Session:', error);
          return {
            text: 'Fehler beim Erstellen einer Session',
            displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Inhalt generieren
    this.actions.push({
      commandType: AssistantCommandType.GENERATE_CONTENT,
      keywords: ['generiere', 'erstelle', 'schreibe', 'verfasse', 'inhalte erstellen'],
      handler: async (command) => {
        try {
          const prompt = command.parameters.prompt || command.originalQuery;
          
          await SmartGlassService.displayText('Generiere Inhalt...', { duration: 2000 });
          
          // API-Anfrage an den Server für die Inhaltsgenerierung
          try {
            const response = await axios.post(`${this.serverUrl}/api/generate-content`, {
              prompt,
              max_tokens: 500,
              temperature: 0.7
            });
            
            if (response.data && response.data.content) {
              const contentPreview = response.data.content.length > 100 
                ? response.data.content.substring(0, 100) + '...' 
                : response.data.content;
                
              await SmartGlassService.displayText(contentPreview, { 
                position: 'center', 
                duration: 5000
              });
              
              return {
                text: 'Inhalt erfolgreich generiert',
                displayOptions: { position: 'bottom', duration: 2000 },
                data: { content: response.data.content }
              };
            } else {
              return {
                text: 'Inhaltsgenerierung fehlgeschlagen',
                displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
              };
            }
          } catch (apiError) {
            console.error('API-Fehler bei der Inhaltsgenerierung:', apiError);
            return {
              text: 'Fehler bei der Inhaltsgenerierung',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler bei der Inhaltsgenerierung:', error);
          return {
            text: 'Fehler bei der Inhaltsgenerierung',
            displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Übersetzung
    this.actions.push({
      commandType: AssistantCommandType.TRANSLATION,
      keywords: ['übersetze', 'übersetzung', 'translate', 'in andere sprache'],
      handler: async (command) => {
        try {
          // OCR durchführen, um Text zu erhalten
          await SmartGlassService.displayText('Erfasse Text zur Übersetzung...', { duration: 2000 });
          const ocrResult = await SmartGlassService.captureAndAnalyzeImage();
          
          if (!ocrResult || !ocrResult.text) {
            return {
              text: 'Kein Text zum Übersetzen gefunden',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
          
          // Zielsprache bestimmen (Standard: Englisch)
          const targetLanguage = command.parameters.language || 'Englisch';
          
          // API-Anfrage an den Server für die Übersetzung
          try {
            const response = await axios.post(`${this.serverUrl}/api/generate-content`, {
              prompt: `Übersetze den folgenden Text ins ${targetLanguage}:\n\n${ocrResult.text}`,
              max_tokens: 1000,
              temperature: 0.3
            });
            
            if (response.data && response.data.content) {
              const translationPreview = response.data.content.length > 100 
                ? response.data.content.substring(0, 100) + '...' 
                : response.data.content;
                
              await SmartGlassService.displayText(translationPreview, { 
                position: 'center', 
                duration: 5000
              });
              
              return {
                text: `Übersetzung ins ${targetLanguage} abgeschlossen`,
                displayOptions: { position: 'bottom', duration: 2000 },
                data: { 
                  originalText: ocrResult.text,
                  translatedText: response.data.content
                }
              };
            } else {
              return {
                text: 'Übersetzung fehlgeschlagen',
                displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
              };
            }
          } catch (apiError) {
            console.error('API-Fehler bei der Übersetzung:', apiError);
            return {
              text: 'Fehler bei der Übersetzung',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler bei der Übersetzung:', error);
          return {
            text: 'Fehler bei der Übersetzung',
            displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Zusammenfassung
    this.actions.push({
      commandType: AssistantCommandType.SUMMARIZE,
      keywords: ['zusammenfassen', 'zusammenfassung', 'fasse zusammen', 'kurz darstellen'],
      handler: async (command) => {
        try {
          // OCR durchführen, um Text zu erhalten
          await SmartGlassService.displayText('Erfasse Text zum Zusammenfassen...', { duration: 2000 });
          const ocrResult = await SmartGlassService.captureAndAnalyzeImage();
          
          if (!ocrResult || !ocrResult.text) {
            return {
              text: 'Kein Text zum Zusammenfassen gefunden',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
          
          // API-Anfrage an den Server für die Zusammenfassung
          try {
            const response = await axios.post(`${this.serverUrl}/api/generate-content`, {
              prompt: `Fasse den folgenden Text in 3-5 kurzen Stichpunkten zusammen:\n\n${ocrResult.text}`,
              max_tokens: 500,
              temperature: 0.3
            });
            
            if (response.data && response.data.content) {
              await SmartGlassService.displayText(response.data.content, { 
                position: 'center', 
                duration: 8000
              });
              
              return {
                text: 'Zusammenfassung erstellt',
                displayOptions: { position: 'bottom', duration: 2000 },
                data: { 
                  originalText: ocrResult.text,
                  summary: response.data.content
                }
              };
            } else {
              return {
                text: 'Zusammenfassung fehlgeschlagen',
                displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
              };
            }
          } catch (apiError) {
            console.error('API-Fehler bei der Zusammenfassung:', apiError);
            return {
              text: 'Fehler bei der Zusammenfassung',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler bei der Zusammenfassung:', error);
          return {
            text: 'Fehler bei der Zusammenfassung',
            displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Anleitung/Hilfe bereitstellen
    this.actions.push({
      commandType: AssistantCommandType.PROVIDE_GUIDANCE,
      keywords: ['hilfe', 'anleitung', 'wie funktioniert', 'guide', 'unterstützung'],
      handler: async (command) => {
        try {
          const helpTopics = [
            'Bildaufnahme: "Nimm ein Foto auf" oder "Mach ein Bild"',
            'Dokumentanalyse: "Analysiere dieses Dokument" oder "Scanne diesen Text"',
            'Multimodale Analyse: "Führe eine kombinierte Analyse durch"',
            'Wissenssuche: "Suche nach [Begriff]" oder "Finde Informationen zu [Thema]"',
            'Session: "Starte eine neue Session" oder "Beende die aktuelle Session"',
            'Inhaltsgenerierung: "Generiere Inhalt über [Thema]"',
            'Übersetzung: "Übersetze diesen Text ins [Sprache]"',
            'Zusammenfassung: "Fasse diesen Text zusammen"'
          ];
          
          await SmartGlassService.displayText('Verfügbare Sprachbefehle:', { 
            position: 'top', 
            duration: 3000
          });
          
          // Jedes Hilfethema einzeln anzeigen
          for (const topic of helpTopics) {
            await SmartGlassService.displayText(topic, { 
              position: 'center', 
              duration: 3000
            });
            
            // Kurze Pause zwischen den Anzeigen
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          return {
            text: 'Hilfe angezeigt',
            displayOptions: { position: 'bottom', duration: 2000 }
          };
        } catch (error) {
          console.error('Fehler bei der Anzeige der Hilfe:', error);
          return {
            text: 'Fehler bei der Anzeige der Hilfe',
            displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
    
    // Systemsteuerung
    this.actions.push({
      commandType: AssistantCommandType.SYSTEM_CONTROL,
      keywords: ['beenden', 'stoppen', 'pause', 'verbinden', 'trennen', 'status'],
      handler: async (command) => {
        try {
          const commandLower = command.originalQuery.toLowerCase();
          
          // Kommando identifizieren
          if (commandLower.includes('verbinden') || commandLower.includes('connect')) {
            const success = await SmartGlassService.connectToGlass();
            return {
              text: success ? 'Mit Smart Glass verbunden' : 'Verbindung fehlgeschlagen',
              displayOptions: { 
                position: 'center', 
                duration: 3000,
                color: success ? '#44FF44' : '#FF4444'
              }
            };
          } else if (commandLower.includes('trennen') || commandLower.includes('disconnect')) {
            const success = await SmartGlassService.disconnectFromGlass();
            return {
              text: success ? 'Verbindung getrennt' : 'Trennung fehlgeschlagen',
              displayOptions: { 
                position: 'center', 
                duration: 3000
              }
            };
          } else if (commandLower.includes('status')) {
            const isConnected = SmartGlassService.isGlassConnected();
            const activeSession = SmartGlassService.getActiveSession();
            
            let statusText = `Status: ${isConnected ? 'Verbunden' : 'Nicht verbunden'}`;
            if (isConnected && activeSession) {
              statusText += `\nAktive Session: ${activeSession.id}`;
              statusText += `\nBilder: ${activeSession.cameraImages.length}`;
              statusText += `\nSprachbefehle: ${activeSession.voiceCommands.length}`;
            }
            
            await SmartGlassService.displayText(statusText, { 
              position: 'center', 
              duration: 5000
            });
            
            return {
              text: 'Status angezeigt',
              displayOptions: { position: 'bottom', duration: 2000 }
            };
          } else if (commandLower.includes('beenden') || commandLower.includes('stoppen')) {
            const success = await SmartGlassService.stopActiveSession();
            return {
              text: success ? 'Session beendet' : 'Keine aktive Session',
              displayOptions: { 
                position: 'center', 
                duration: 3000
              }
            };
          } else if (commandLower.includes('pause')) {
            await SmartGlassService.sendNotification('Funktion pausiert');
            return {
              text: 'Funktion pausiert',
              displayOptions: { position: 'center', duration: 3000 }
            };
          } else {
            return {
              text: 'Unbekanntes Systemkommando',
              displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
            };
          }
        } catch (error) {
          console.error('Fehler bei der Systemsteuerung:', error);
          return {
            text: 'Fehler bei der Systemsteuerung',
            displayOptions: { position: 'center', duration: 3000, color: '#FF4444' }
          };
        }
      }
    });
  }
  
  /**
   * Sprachkommando erkennen und zuordnen
   */
  private recognizeCommand(text: string): RecognizedCommand | null {
    try {
      if (!text || text.trim() === '') {
        return null;
      }
      
      const textLower = text.toLowerCase();
      
      // Für jede Aktion prüfen, ob Keywords enthalten sind
      for (const action of this.actions) {
        for (const keyword of action.keywords) {
          if (textLower.includes(keyword.toLowerCase())) {
            // Parameter extrahieren
            const parameters: Record<string, any> = {};
            
            // Einfache Parameterextraktion für bestimmte Kommandotypen
            switch (action.commandType) {
              case AssistantCommandType.SEARCH_KNOWLEDGE:
                // Suchbegriff nach "nach" oder "über" extrahieren
                const searchMatch = textLower.match(/(nach|über|zu)\s+(.+)$/i);
                if (searchMatch && searchMatch[2]) {
                  parameters.query = searchMatch[2].trim();
                }
                break;
                
              case AssistantCommandType.GENERATE_CONTENT:
                // Prompt nach "über" oder "zu" extrahieren
                const promptMatch = textLower.match(/(über|zu)\s+(.+)$/i);
                if (promptMatch && promptMatch[2]) {
                  parameters.prompt = promptMatch[2].trim();
                }
                break;
                
              case AssistantCommandType.TRANSLATION:
                // Zielsprache nach "ins" oder "auf" extrahieren
                const langMatch = textLower.match(/(ins|auf|in)\s+(\w+)(\s|$)/i);
                if (langMatch && langMatch[2]) {
                  parameters.language = langMatch[2].trim();
                }
                break;
            }
            
            return {
              type: action.commandType,
              confidence: 0.8, // Vereinfachte Implementierung mit fester Konfidenz
              parameters,
              originalQuery: text
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Fehler bei der Kommandoerkennung:', error);
      return null;
    }
  }
  
  /**
   * Sprachsteuerung starten
   */
  public async startVoiceControl(): Promise<boolean> {
    try {
      if (this.isListening) {
        console.log('Sprachsteuerung läuft bereits');
        return true;
      }
      
      // Event-Handler für Spracherkennung
      const handleVoiceResult = async (data: any) => {
        if (data.results && data.results.length > 0 && data.isFinal) {
          const text = data.results[0];
          console.log('Erkannter Text:', text);
          
          // Kommando erkennen
          const command = this.recognizeCommand(text);
          
          if (command) {
            console.log('Erkanntes Kommando:', command);
            
            // Passende Aktion finden
            const action = this.actions.find(a => a.commandType === command.type);
            
            if (action) {
              // Aktion ausführen
              const response = await action.handler(command);
              
              // Antwort auf dem Display anzeigen
              if (response.text && SmartGlassService.isGlassConnected()) {
                await SmartGlassService.displayText(
                  response.text,
                  response.displayOptions
                );
              }
              
              // Erneut auf Sprachbefehle warten
              setTimeout(() => {
                if (this.isListening) {
                  VoiceRecognitionService.startRecognition({ language: 'de-DE' });
                }
              }, 2000);
            }
          } else {
            console.log('Kein Kommando erkannt für:', text);
            
            if (SmartGlassService.isGlassConnected()) {
              await SmartGlassService.displayText(
                'Kommando nicht erkannt. Versuchen Sie "Hilfe" für eine Liste der Befehle.',
                { position: 'center', duration: 3000, color: '#FF8800' }
              );
            }
            
            // Erneut auf Sprachbefehle warten
            setTimeout(() => {
              if (this.isListening) {
                VoiceRecognitionService.startRecognition({ language: 'de-DE' });
              }
            }, 2000);
          }
        }
      };
      
      // Event-Handler für Spracherkennungsfehler
      const handleVoiceError = (data: any) => {
        console.error('Fehler bei der Spracherkennung:', data.error);
        
        // Erneut auf Sprachbefehle warten
        setTimeout(() => {
          if (this.isListening) {
            VoiceRecognitionService.startRecognition({ language: 'de-DE' });
          }
        }, 2000);
      };
      
      // Handler registrieren
      VoiceRecognitionService.addEventListener('result', handleVoiceResult);
      VoiceRecognitionService.addEventListener('error', handleVoiceError);
      
      // Spracherkennung starten
      const success = await VoiceRecognitionService.startRecognition({ language: 'de-DE' });
      
      if (success) {
        this.isListening = true;
        
        if (SmartGlassService.isGlassConnected()) {
          await SmartGlassService.displayText(
            'Sprachsteuerung aktiviert. Sagen Sie "Hilfe" für eine Liste der Befehle.',
            { position: 'center', duration: 4000 }
          );
        }
        
        return true;
      } else {
        console.error('Fehler beim Starten der Spracherkennung');
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Starten der Sprachsteuerung:', error);
      return false;
    }
  }
  
  /**
   * Sprachsteuerung stoppen
   */
  public async stopVoiceControl(): Promise<boolean> {
    try {
      if (!this.isListening) {
        console.log('Sprachsteuerung ist nicht aktiv');
        return true;
      }
      
      const success = await VoiceRecognitionService.stopRecognition();
      
      if (success) {
        this.isListening = false;
        
        if (SmartGlassService.isGlassConnected()) {
          await SmartGlassService.displayText(
            'Sprachsteuerung deaktiviert',
            { position: 'center', duration: 3000 }
          );
        }
        
        return true;
      } else {
        console.error('Fehler beim Stoppen der Spracherkennung');
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Stoppen der Sprachsteuerung:', error);
      return false;
    }
  }
  
  /**
   * Sprachassistent mit Google Smart Glass verbinden
   */
  public async connectToSmartGlass(): Promise<boolean> {
    try {
      const isAvailable = await SmartGlassService.isGlassAvailable();
      
      if (!isAvailable) {
        console.error('Smart Glass ist nicht verfügbar');
        return false;
      }
      
      const isConnected = await SmartGlassService.connectToGlass();
      
      if (isConnected) {
        await SmartGlassService.displayText(
          'Sprachassistent verbunden',
          { position: 'center', duration: 3000 }
        );
        
        // Neue Session starten
        await SmartGlassService.startNewSession();
        
        return true;
      } else {
        console.error('Verbindung zur Smart Glass fehlgeschlagen');
        return false;
      }
    } catch (error) {
      console.error('Fehler bei der Verbindung mit Smart Glass:', error);
      return false;
    }
  }
  
  /**
   * Verbindung zur Smart Glass trennen
   */
  public async disconnectFromSmartGlass(): Promise<boolean> {
    try {
      // Sprachsteuerung stoppen
      await this.stopVoiceControl();
      
      // Von Smart Glass trennen
      const success = await SmartGlassService.disconnectFromGlass();
      
      return success;
    } catch (error) {
      console.error('Fehler beim Trennen der Verbindung zur Smart Glass:', error);
      return false;
    }
  }
  
  /**
   * Prüft, ob die Sprachsteuerung aktiv ist
   */
  public isVoiceControlActive(): boolean {
    return this.isListening;
  }
}

export default AssistantService.getInstance();