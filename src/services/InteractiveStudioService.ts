import { Alert } from 'react-native';
import Config from '../config';
import LocalStorageService from './LocalStorageService';
import { v4 as uuidv4 } from 'uuid';

// API-Basisurl festlegen
// Für Entwicklung: 'http://localhost:5000'
// Für Produktion: Produktions-URL
const API_BASE_URL = 'http://localhost:5000';

// Helper-Funktion zum Überprüfen der Netzwerkverbindung
async function isNetworkConnected(): Promise<boolean> {
  try {
    // In einer echten React Native Umgebung würde NetInfo verwendet
    // Da wir im Simulator sind, simulieren wir eine Verbindung
    return true;
  } catch (error) {
    console.error('Fehler bei der Netzwerkprüfung:', error);
    return false;
  }
}

// Typen
export interface CodeSnippet {
  language: string;
  code: string;
  purpose: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface InteractiveSessionState {
  sessionId: string;
  messages: Message[];
  codeSnippets: CodeSnippet[];
  topic: string;
  context?: any;
  isActive: boolean;
}

export interface StreamEvents {
  onChunk?: (chunk: string) => void;
  onCode?: (codeSnippet: CodeSnippet) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * Service für die Interaktion mit dem Interactive Studio Backend
 */
class InteractiveStudioService {
  private static instance: InteractiveStudioService;
  
  /**
   * Singleton-Instanz erhalten
   */
  public static getInstance(): InteractiveStudioService {
    if (!InteractiveStudioService.instance) {
      InteractiveStudioService.instance = new InteractiveStudioService();
    }
    return InteractiveStudioService.instance;
  }
  
  /**
   * Erstellt eine neue (leere) Session-Instanz
   */
  private createNewSession(topic: string, sessionId: string = uuidv4(), context?: any): InteractiveSessionState {
    return {
      sessionId,
      messages: [
        { 
          role: 'system', 
          content: 'Willkommen im interaktiven Studio. Ich bin dein persönlicher Assistent für Brainstorming, Code-Generierung und Dokumentenerstellung. Wie kann ich dir heute helfen?' 
        }
      ],
      codeSnippets: [],
      topic,
      context: context || {},
      isActive: true
    };
  }

  /**
   * Session initialisieren
   */
  public async initializeSession(topic: string, sessionId: string = uuidv4(), context?: any): Promise<{
    success: boolean;
    suggestions?: { message: string; codeSnippets: CodeSnippet[] };
  }> {
    try {
      // Prüfen, ob wir online sind
      const isOnline = await isNetworkConnected();
      
      if (isOnline) {
        // Online-Modus: Mit Server kommunizieren
        const response = await fetch(`${API_BASE_URL}/api/interactive-studio/initialize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            context,
            sessionId
          }),
        });
        
        if (!response.ok) {
          throw new Error('Fehler bei der Initialisierung der Session');
        }
        
        const result = await response.json();
        
        // Session lokal speichern
        const newSession = this.createNewSession(topic, sessionId, context);
        if (result.success && result.suggestions) {
          newSession.messages.push({
            role: 'assistant',
            content: result.suggestions.message
          });
          
          result.suggestions.codeSnippets.forEach(snippet => {
            newSession.codeSnippets.push(snippet);
          });
        }
        
        await LocalStorageService.saveInteractiveSession(newSession);
        return result;
      } else {
        // Offline-Modus: Lokale Session erstellen
        console.log('Offline-Modus: Erstelle lokale Session');
        const newSession = this.createNewSession(topic, sessionId, context);
        
        // Session lokal speichern
        await LocalStorageService.saveInteractiveSession(newSession);
        
        // Offline-Nachricht hinzufügen
        newSession.messages.push({
          role: 'assistant',
          content: 'Du bist derzeit offline. Diese Session wird lokal gespeichert und bei Internetverbindung mit dem Server synchronisiert. Du kannst Nachrichten eingeben, aber sie werden erst beantwortet, wenn eine Verbindung zum Server besteht.'
        });
        
        return { 
          success: true,
          suggestions: {
            message: newSession.messages[newSession.messages.length - 1].content,
            codeSnippets: []
          }
        };
      }
    } catch (error) {
      console.error('Fehler bei Session-Initialisierung:', error);
      
      // Bei Fehler trotzdem eine lokale Session erstellen
      const newSession = this.createNewSession(topic, sessionId, context);
      await LocalStorageService.saveInteractiveSession(newSession);
      
      return { success: false };
    }
  }
  
  /**
   * Nachricht senden (Standard-Modus)
   */
  public async sendMessage(sessionId: string, message: string, history: Message[]): Promise<{
    success: boolean;
    message?: string;
    codeSnippets?: CodeSnippet[];
  }> {
    try {
      // Aktuelle Session laden
      const session = await LocalStorageService.getInteractiveSessionById(sessionId);
      
      if (!session) {
        throw new Error('Session nicht gefunden');
      }
      
      // Nutzernachricht zur lokalen Session hinzufügen
      const userMessage: Message = { role: 'user', content: message };
      session.messages.push(userMessage);
      
      // Speichern der Nutzernachricht (unabhängig vom Online-Status)
      await LocalStorageService.saveInteractiveSession(session);
      
      // Netzwerkverbindung prüfen
      const isOnline = await isNetworkConnected();
      
      if (isOnline) {
        // Online-Modus: Anfrage an Server senden
        const response = await fetch(`${API_BASE_URL}/api/interactive-studio/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            message,
            history
          }),
        });
        
        if (!response.ok) {
          throw new Error('Fehler beim Senden der Nachricht');
        }
        
        const result = await response.json();
        
        // Antwort zur lokalen Session hinzufügen
        if (result.success && result.message) {
          const assistantMessage: Message = { role: 'assistant', content: result.message };
          session.messages.push(assistantMessage);
          
          if (result.codeSnippets && result.codeSnippets.length > 0) {
            session.codeSnippets = [...session.codeSnippets, ...result.codeSnippets];
          }
          
          // Aktualisierte Session speichern
          await LocalStorageService.saveInteractiveSession(session);
        }
        
        return result;
      } else {
        // Offline-Modus: Lokale Nachricht hinzufügen
        const offlineMessage: Message = {
          role: 'assistant',
          content: 'Du bist derzeit offline. Deine Nachricht wurde gespeichert und wird bei Internetverbindung gesendet.'
        };
        
        session.messages.push(offlineMessage);
        
        // Zur Synchronisationswarteschlange hinzufügen
        await LocalStorageService.addToSyncQueue({
          type: 'save_session',
          data: {
            sessionId,
            message,
            history: session.messages,
          },
          timestamp: Date.now()
        });
        
        // Aktualisierte Session speichern
        await LocalStorageService.saveInteractiveSession(session);
        
        return {
          success: true,
          message: offlineMessage.content,
          codeSnippets: []
        };
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      return { success: false };
    }
  }
  
  /**
   * Live-Modus starten und Streaming-Verbindung aufbauen
   */
  public startLiveSession(sessionId: string, message: string, events: StreamEvents): () => void {
    // EventSource-ähnlicher Mechanismus für React Native
    // Da React Native keine native EventSource-Unterstützung hat,
    // implementieren wir einen Polyfill mit fetch und chunks
    
    try {
      // Zuerst prüfen, ob die Session existiert oder geladen werden muss
      const loadSessionAndProcessMessage = async () => {
        try {
          // Session laden
          const session = await LocalStorageService.getInteractiveSessionById(sessionId);
          
          if (!session) {
            // Session nicht gefunden, erstelle eine neue
            const newSession = this.createNewSession('Live-Session', sessionId);
            await LocalStorageService.saveInteractiveSession(newSession);
          }
          
          // Aktualisierte Session laden
          const updatedSession = await LocalStorageService.getInteractiveSessionById(sessionId) || 
                                 this.createNewSession('Live-Session', sessionId);
          
          // Nutzernachricht zur Session hinzufügen
          updatedSession.messages.push({ role: 'user', content: message });
          await LocalStorageService.saveInteractiveSession(updatedSession);
          
          // Netzwerkverbindung prüfen
          const isOnline = await isNetworkConnected();
          
          if (!isOnline) {
            // Offline-Modus: Fehlermeldung zurückgeben
            if (events.onError) {
              events.onError('Keine Internetverbindung verfügbar. Der Live-Modus benötigt eine aktive Verbindung.');
            }
            return;
          }
          
          // Streaming starten
          startStreaming();
        } catch (error) {
          console.error('Fehler beim Laden der Session:', error);
          if (events.onError) {
            events.onError('Fehler beim Laden der Session: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
          }
        }
      };
      
      // Streaming-Komponente
      const startStreaming = () => {
        const encodedMessage = encodeURIComponent(message);
        const url = `${API_BASE_URL}/api/interactive-studio/stream?sessionId=${sessionId}&message=${encodedMessage}`;
        
        let isCancelled = false;
        let fullResponse = '';
        let collectedCodeSnippets: CodeSnippet[] = [];
        
        // Streaming-Verbindung starten
        const runStream = async () => {
          try {
            const response = await fetch(url);
            
            if (!response.ok || !response.body) {
              throw new Error('Streaming-Verbindung fehlgeschlagen');
            }
            
            const reader = response.body.getReader();
            let buffer = '';
            
            while (!isCancelled) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Stream ist beendet - Antwort zur Session hinzufügen
                if (fullResponse) {
                  // Session aktualisieren
                  const session = await LocalStorageService.getInteractiveSessionById(sessionId);
                  if (session) {
                    session.messages.push({ role: 'assistant', content: fullResponse });
                    
                    // Code-Snippets hinzufügen
                    if (collectedCodeSnippets.length > 0) {
                      session.codeSnippets = [...session.codeSnippets, ...collectedCodeSnippets];
                    }
                    
                    await LocalStorageService.saveInteractiveSession(session);
                  }
                }
                
                if (events.onEnd) events.onEnd();
                break;
              }
              
              // Chunk decodieren und zum Buffer hinzufügen
              const chunk = new TextDecoder().decode(value);
              buffer += chunk;
              
              // Verarbeite alle vollständigen Events im Buffer
              const eventRegex = /event: ([^\n]+)\ndata: ([^\n]+)\n\n/g;
              let match;
              
              while ((match = eventRegex.exec(buffer)) !== null) {
                const eventType = match[1];
                const eventData = match[2];
                
                // Event-Typ verarbeiten
                switch (eventType) {
                  case 'chunk':
                    if (events.onChunk) events.onChunk(eventData);
                    fullResponse += eventData;
                    break;
                    
                  case 'code':
                    try {
                      const codeSnippet = JSON.parse(eventData) as CodeSnippet;
                      collectedCodeSnippets.push(codeSnippet);
                      if (events.onCode) events.onCode(codeSnippet);
                    } catch (e) {
                      console.error('Fehler beim Parsen des Code-Snippets:', e);
                    }
                    break;
                    
                  case 'error':
                    // Fehler zur Session hinzufügen
                    const session = await LocalStorageService.getInteractiveSessionById(sessionId);
                    if (session) {
                      session.messages.push({ 
                        role: 'assistant', 
                        content: 'Fehler: ' + eventData 
                      });
                      await LocalStorageService.saveInteractiveSession(session);
                    }
                    
                    if (events.onError) events.onError(eventData);
                    return; // Bei einem Fehler die Verbindung beenden
                    
                  case 'end':
                    // Zusammengefasste Antwort zur Session hinzufügen
                    const endSession = await LocalStorageService.getInteractiveSessionById(sessionId);
                    if (endSession && fullResponse) {
                      endSession.messages.push({ role: 'assistant', content: fullResponse });
                      
                      // Code-Snippets hinzufügen
                      if (collectedCodeSnippets.length > 0) {
                        endSession.codeSnippets = [...endSession.codeSnippets, ...collectedCodeSnippets];
                      }
                      
                      await LocalStorageService.saveInteractiveSession(endSession);
                    }
                    
                    if (events.onEnd) events.onEnd();
                    return; // Bei Ende die Verbindung beenden
                }
                
                // Verarbeiteten Teil aus dem Buffer entfernen
                buffer = buffer.replace(match[0], '');
                eventRegex.lastIndex = 0;
              }
            }
          } catch (error) {
            console.error('Fehler beim Streaming:', error);
            
            // Fehler zur Session hinzufügen
            const session = await LocalStorageService.getInteractiveSessionById(sessionId);
            if (session) {
              session.messages.push({ 
                role: 'assistant', 
                content: 'Fehler bei der Verbindung: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
              });
              await LocalStorageService.saveInteractiveSession(session);
            }
            
            if (events.onError) events.onError(error instanceof Error ? error.message : 'Unbekannter Fehler');
          }
        };
        
        // Stream starten
        runStream();
        
        // Cleanup-Funktion zurückgeben
        return () => {
          isCancelled = true;
        };
      };
      
      // Session laden und Streaming starten
      loadSessionAndProcessMessage();
      
      // Cleanup-Funktion zurückgeben
      return () => {
        // Diese Funktion wird aufgerufen, wenn die Komponente unmounted wird
        // In der eigentlichen Implementierung wird sie von startStreaming zurückgegeben
      };
    } catch (error) {
      console.error('Fehler beim Starten der Live-Session:', error);
      if (events.onError) events.onError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      return () => {}; // Leere Cleanup-Funktion
    }
  }
  
  /**
   * Session beenden
   */
  public async endSession(sessionId: string): Promise<boolean> {
    try {
      // Session lokal als inaktiv markieren
      const session = await LocalStorageService.getInteractiveSessionById(sessionId);
      
      if (session) {
        session.isActive = false;
        await LocalStorageService.saveInteractiveSession(session);
      }
      
      // Netzwerkverbindung prüfen
      const isOnline = await isNetworkConnected();
      
      if (isOnline) {
        // Online-Modus: Mit Server kommunizieren
        const response = await fetch(`${API_BASE_URL}/api/interactive-studio/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId
          }),
        });
        
        if (!response.ok) {
          throw new Error('Fehler beim Beenden der Session');
        }
        
        const data = await response.json();
        return data.success;
      } else {
        // Offline-Modus: Zur Synchronisationswarteschlange hinzufügen
        await LocalStorageService.addToSyncQueue({
          type: 'delete_session',
          data: { sessionId },
          timestamp: Date.now()
        });
        
        return true; // Lokal erfolgreich
      }
    } catch (error) {
      console.error('Fehler beim Beenden der Session:', error);
      return false;
    }
  }
  
  /**
   * Session speichern
   */
  public async saveSession(sessionState: InteractiveSessionState): Promise<boolean> {
    try {
      // Lokal speichern (unabhängig vom Online-Status)
      await LocalStorageService.saveInteractiveSession(sessionState);
      
      // Netzwerkverbindung prüfen
      const isOnline = await isNetworkConnected();
      
      if (isOnline) {
        // Online-Modus: Mit Server kommunizieren
        const response = await fetch(`${API_BASE_URL}/api/interactive-studio/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionState
          }),
        });
        
        if (!response.ok) {
          throw new Error('Fehler beim Speichern der Session');
        }
        
        const data = await response.json();
        return data.success;
      } else {
        // Offline-Modus: Zur Synchronisationswarteschlange hinzufügen
        await LocalStorageService.addToSyncQueue({
          type: 'save_session',
          data: { sessionState },
          timestamp: Date.now()
        });
        
        return true; // Lokal erfolgreich
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Session:', error);
      return false;
    }
  }
  
  /**
   * Listet alle gespeicherten interaktiven Sessions
   */
  public async getAllSessions(): Promise<InteractiveSessionState[]> {
    try {
      // Lokale Sessions laden
      return await LocalStorageService.getInteractiveSessions();
    } catch (error) {
      console.error('Fehler beim Laden der Sessions:', error);
      return [];
    }
  }
  
  /**
   * Session anhand ihrer ID laden
   */
  public async getSessionById(sessionId: string): Promise<InteractiveSessionState | null> {
    try {
      // Lokale Session laden
      return await LocalStorageService.getInteractiveSessionById(sessionId);
    } catch (error) {
      console.error('Fehler beim Laden der Session:', error);
      return null;
    }
  }
  
  /**
   * Session exportieren
   */
  public exportSession(sessionId: string): Promise<string | null> {
    return new Promise(async (resolve) => {
      try {
        const session = await LocalStorageService.getInteractiveSessionById(sessionId);
        if (!session) {
          resolve(null);
          return;
        }
        
        const jsonString = LocalStorageService.exportSessionToJson(session);
        resolve(jsonString);
      } catch (error) {
        console.error('Fehler beim Exportieren der Session:', error);
        resolve(null);
      }
    });
  }
  
  /**
   * Überprüft, ob die App online ist und synchronisiert, falls noch nicht gesendete Daten vorhanden sind
   */
  public async checkAndSyncOfflineData(): Promise<boolean> {
    try {
      // Netzwerkverbindung prüfen
      const isOnline = await isNetworkConnected();
      
      if (!isOnline) {
        console.log('Keine Verbindung zum Internet, Synchronisation nicht möglich');
        return false;
      }
      
      // Warteschlange laden
      const queue = await LocalStorageService.getSyncQueue();
      
      if (queue.length === 0) {
        console.log('Keine ausstehenden Synchronisationsaufgaben');
        return true;
      }
      
      console.log(`${queue.length} ausstehende Synchronisationsaufgaben gefunden`);
      
      // Alle Aktionen in der Warteschlange durchgehen
      for (const action of queue) {
        if (action.status === 'completed') continue;
        
        switch (action.type) {
          case 'save_session':
            if (action.data.sessionState) {
              await this.saveSession(action.data.sessionState);
            } else if (action.data.sessionId && action.data.message && action.data.history) {
              await this.sendMessage(action.data.sessionId, action.data.message, action.data.history);
            }
            break;
            
          case 'delete_session':
            if (action.data.sessionId) {
              await this.endSession(action.data.sessionId);
            }
            break;
        }
        
        // Aktion als erledigt markieren
        await LocalStorageService.markSyncActionComplete(action.id);
      }
      
      // Warteschlange bereinigen
      await LocalStorageService.cleanupSyncQueue();
      
      return true;
    } catch (error) {
      console.error('Fehler bei der Synchronisation:', error);
      return false;
    }
  }
}

export default InteractiveStudioService.getInstance();