
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';

interface VoiceRecognitionOptions {
  language?: string;
  maxDuration?: number; // in Millisekunden
  quality?: Audio.RecordingOptions;
}

interface RecognitionResult {
  success: boolean;
  text?: string;
  error?: string;
  confidence?: number;
}

class VoiceRecognitionService {
  private recording: Audio.Recording | null = null;
  private audioUri: string | null = null;
  private isRecording = false;
  private isInitialized = false;

  // Initialisierung der Audio-Aufnahme
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Berechtigung anfragen
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Mikrofon-Berechtigungen',
          'Für die Spracherkennung werden Mikrofon-Berechtigungen benötigt.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Audio-Modus für Aufnahme konfigurieren
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Spracherkennung:', error);
      return false;
    }
  }

  // Beginn der Aufnahme
  async startRecording(options: VoiceRecognitionOptions = {}): Promise<boolean> {
    try {
      if (this.isRecording) {
        console.warn('Aufnahme läuft bereits');
        return false;
      }

      const initialized = await this.initialize();
      if (!initialized) return false;

      // Aufnahme-Optionen
      const recordingOptions: Audio.RecordingOptions = options.quality || {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Neue Aufnahme erstellen
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      this.isRecording = true;

      // Automatisches Stoppen, falls gewünscht
      if (options.maxDuration) {
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, options.maxDuration);
      }

      return true;
    } catch (error) {
      console.error('Fehler beim Starten der Aufnahme:', error);
      return false;
    }
  }

  // Aufnahme stoppen
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.isRecording || !this.recording) {
        console.warn('Keine aktive Aufnahme vorhanden');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.audioUri = uri;
      this.isRecording = false;
      this.recording = null;

      return uri;
    } catch (error) {
      console.error('Fehler beim Stoppen der Aufnahme:', error);
      this.isRecording = false;
      this.recording = null;
      return null;
    }
  }

  // Spracherkennung
  async recognizeSpeech(audioUri?: string, options: VoiceRecognitionOptions = {}): Promise<RecognitionResult> {
    try {
      const uri = audioUri || this.audioUri;
      
      if (!uri) {
        return {
          success: false,
          error: 'Keine Audiodatei verfügbar'
        };
      }

      // HINWEIS: Expo bietet keine direkte API für Spracherkennung
      // Hier müsste eine Integration mit einem Dienst wie Google Speech-to-Text,
      // Vosk oder einem anderen Dienst implementiert werden

      // Beispiel für einen simulierten API-Aufruf:
      console.log(`Spracherkennung wird auf ${uri} angewendet`);
      console.log(`Sprache: ${options.language || 'de-DE'}`);

      // Hier die tatsächliche API-Integration implementieren:
      // 1. Hochladen der Audiodatei an den API-Dienst
      // 2. Anfordern der Transkription
      // 3. Verarbeiten des Ergebnisses

      // Beispiel eines simulierten Ergebnisses:
      const simulatedResult: RecognitionResult = {
        success: true,
        text: 'Dies ist ein Beispieltext für die Spracherkennung. Bitte implementieren Sie einen Erkennungsdienst.',
        confidence: 0.8
      };

      return simulatedResult;
    } catch (error) {
      console.error('Fehler bei der Spracherkennung:', error);
      return {
        success: false,
        error: `Fehler bei der Spracherkennung: ${error}`
      };
    }
  }

  // Text zu Sprache
  async speak(text: string, options: Speech.SpeechOptions = {}): Promise<void> {
    try {
      // Standardoptionen mit überschreibbaren Werten
      const defaultOptions: Speech.SpeechOptions = {
        language: options.language || 'de-DE',
        pitch: options.pitch || 1.0,
        rate: options.rate || 0.9, // Etwas langsamer für bessere Verständlichkeit
        volume: options.volume || 1.0
      };

      // Vorhandene Sprache stoppen
      await Speech.stop();

      // Text aussprechen
      await Speech.speak(text, defaultOptions);
    } catch (error) {
      console.error('Fehler bei der Sprachsynthese:', error);
    }
  }

  // Prüfen, ob Sprachsynthese verfügbar ist
  async isSpeechAvailable(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAvailableAsync();
    } catch (error) {
      console.error('Fehler beim Prüfen der Sprachsynthese-Verfügbarkeit:', error);
      return false;
    }
  }

  // Sprachsynthese stoppen
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Fehler beim Stoppen der Sprachsynthese:', error);
    }
  }

  // Aufräumen
  cleanup(): void {
    if (this.recording) {
      this.recording.stopAndUnloadAsync().catch(console.error);
      this.recording = null;
    }
    
    this.isRecording = false;
    this.isInitialized = false;
    
    if (this.audioUri) {
      FileSystem.deleteAsync(this.audioUri, { idempotent: true }).catch(console.error);
      this.audioUri = null;
    }
    
    Speech.stop().catch(console.error);
  }
}

export default new VoiceRecognitionService();
