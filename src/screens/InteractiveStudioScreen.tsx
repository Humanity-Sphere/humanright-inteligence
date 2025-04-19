import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Keyboard,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, Button, Chip } from 'react-native-paper';
import { v4 as uuidv4 } from 'uuid';
import CodeHighlighter from 'react-native-code-highlighter';
import { atomDark } from 'react-native-code-highlighter/themes';
import * as Camera from 'expo-camera';
import * as Audio from 'expo-av';
//import { analytics } from './analytics'; // Assuming analytics is imported from somewhere


// Typen
interface CodeSnippet {
  language: string;
  code: string;
  purpose: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface InteractiveSessionState {
  sessionId: string;
  messages: Message[];
  codeSnippets: CodeSnippet[];
  topic: string;
  context?: any;
  isActive: boolean;
}

// Event Source Polyfill für React Native
class RNEventSource {
  private url: string;
  private eventSource: any;
  private listeners: Record<string, Array<(event: any) => void>> = {};

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    // In React Native simulieren wir EventSource mit fetch und chunks
    fetch(this.url)
      .then(response => {
        const reader = response.body?.getReader();
        if (!reader) {
          this.dispatchEvent({ type: 'error', data: 'Response body nicht verfügbar' });
          return;
        }

        let buffer = '';

        const processChunks = ({ done, value }: ReadableStreamReadResult<Uint8Array>) => {
          if (done) {
            this.dispatchEvent({ type: 'end', data: 'complete' });
            return;
          }

          // Decodiere den Chunk und füge ihn zum Buffer hinzu
          const chunk = new TextDecoder().decode(value);
          buffer += chunk;

          // Verarbeite alle vollständigen Events im Buffer
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Letzter unvollständiger Teil

          for (const event of events) {
            const lines = event.split('\n');
            let eventType = 'message';
            let data = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                data = line.slice(5).trim();
              }
            }

            this.dispatchEvent({ type: eventType, data });
          }

          // Fortsetzen des Lesens
          reader.read().then(processChunks);
        };

        reader.read().then(processChunks);
      })
      .catch(error => {
        this.dispatchEvent({ type: 'error', data: error.message });
      });
  }

  addEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners[type]) {
      return;
    }
    this.listeners[type] = this.listeners[type].filter(l => l !== listener);
  }

  private dispatchEvent(event: { type: string, data: any }) {
    const listeners = this.listeners[event.type] || [];
    for (const listener of listeners) {
      listener(event);
    }
  }

  close() {
    // No need to close anything since we're using fetch
    this.listeners = {};
  }
}

const InteractiveStudioScreen = ({ route }: any) => {
  const { initialTopic = 'Neue Brainstorming-Sitzung' } = route?.params || {};
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);


  const [sessionState, setSessionState] = useState<InteractiveSessionState>({
    sessionId: uuidv4(),
    messages: [],
    codeSnippets: [],
    topic: initialTopic,
    isActive: true
  });

  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Session initialisieren
  useEffect(() => {
    initializeSession();
  }, []);

  // Automatisch zum Ende des Chats scrollen
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [sessionState.messages, isLoading]);

  // Funktion zum Initialisieren der Session
  const initializeSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/interactive-studio/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: sessionState.topic,
          sessionId: sessionState.sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Initialisierung der Session');
      }

      const data = await response.json();

      // Begrüßungsnachricht hinzufügen
      if (data.suggestions?.message) {
        setSessionState(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'assistant', content: data.suggestions.message }]
        }));
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Fehler bei Session-Initialisierung:', error);
      Alert.alert('Fehler', 'Die interaktive Session konnte nicht initialisiert werden.');
      setIsLoading(false);
    }
  };

  // Funktion zum Senden einer Nachricht im normalen Modus
  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    Keyboard.dismiss();

    try {
      // Benutzernachricht zum Chat hinzufügen
      const userMessage = { role: 'user' as const, content: userInput };

      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));

      setUserInput('');
      setIsLoading(true);

      const response = await fetch('http://localhost:5000/api/interactive-studio/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionState.sessionId,
          message: userInput,
          history: [...sessionState.messages, userMessage]
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Senden der Nachricht');
      }

      const data = await response.json();

      // Antwort hinzufügen
      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: data.message }],
        codeSnippets: [...prev.codeSnippets, ...data.codeSnippets]
      }));

      setIsLoading(false);

      // Zum Code-Tab wechseln, wenn neue Code-Snippets extrahiert wurden
      if (data.codeSnippets && data.codeSnippets.length > 0) {
        setTimeout(() => {
          setActiveTab('code');
        }, 1000);
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      Alert.alert('Fehler', 'Die Nachricht konnte nicht gesendet werden.');
      setIsLoading(false);
    }
  };

  // Funktion zum Starten des Live-Modus mit Streaming
  const startLiveSession = async () => {
    if (!userInput.trim() || isLoading || isStreaming) return;

    Keyboard.dismiss();

    try {
      // Benutzernachricht zum Chat hinzufügen
      const userMessage = { role: 'user' as const, content: userInput };

      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));

      setUserInput('');
      setIsStreaming(true);
      setStreamingMessage('');

      // Placeholder für die Antwort hinzufügen
      const tempMessageIndex = sessionState.messages.length;
      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: '' }]
      }));

      // EventSource für Server-Sent Events einrichten
      const encodedMessage = encodeURIComponent(userInput);
      const url = `http://localhost:5000/api/interactive-studio/stream?sessionId=${sessionState.sessionId}&message=${encodedMessage}`;

      const eventSource = new RNEventSource(url);

      // Chunk-Event-Handler
      eventSource.addEventListener('chunk', (event) => {
        try {
          const chunk = event.data;
          setStreamingMessage(prev => prev + chunk);

          // Update der aktuellen Nachricht im State
          setSessionState(prev => {
            const updatedMessages = [...prev.messages];
            updatedMessages[tempMessageIndex] = {
              role: 'assistant',
              content: streamingMessage + chunk
            };
            return {
              ...prev,
              messages: updatedMessages
            };
          });
        } catch (error) {
          console.error('Fehler beim Verarbeiten eines Chunks:', error);
        }
      });

      // Code-Event-Handler
      eventSource.addEventListener('code', (event) => {
        try {
          const codeData = JSON.parse(event.data);

          // Neuen Code-Snippet zum State hinzufügen
          setSessionState(prev => ({
            ...prev,
            codeSnippets: [...prev.codeSnippets, codeData]
          }));

          // Zum Code-Tab wechseln, nachdem ein Snippet generiert wurde
          setTimeout(() => {
            setActiveTab('code');
          }, 1000);
        } catch (error) {
          console.error('Fehler beim Verarbeiten eines Code-Snippets:', error);
        }
      });

      // Fehler-Handler
      eventSource.addEventListener('error', (event) => {
        console.error('EventSource-Fehler:', event);
        eventSource.close();
        setIsStreaming(false);

        // Fehlermeldung anzeigen
        Alert.alert('Fehler', 'Die Live-Session wurde unterbrochen.');
      });

      // Ende-Event-Handler
      eventSource.addEventListener('end', () => {
        eventSource.close();
        setIsStreaming(false);

        // Finale Nachricht in den State übernehmen
        setSessionState(prev => {
          const updatedMessages = [...prev.messages];
          updatedMessages[tempMessageIndex] = {
            role: 'assistant',
            content: streamingMessage
          };
          return {
            ...prev,
            messages: updatedMessages
          };
        });
      });
    } catch (error) {
      console.error('Fehler beim Starten der Live-Session:', error);
      setIsStreaming(false);
      Alert.alert('Fehler', 'Die Live-Session konnte nicht gestartet werden.');
    }
  };

  // Funktion zum Beenden der Session
  const endSession = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('http://localhost:5000/api/interactive-studio/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionState.sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Beenden der Session');
      }

      setIsLoading(false);

      // Session als inaktiv markieren
      setSessionState(prev => ({
        ...prev,
        isActive: false
      }));

      // Zurück zum vorherigen Screen
      navigation.goBack();

    } catch (error) {
      console.error('Fehler beim Beenden der Session:', error);
      Alert.alert('Fehler', 'Die Session konnte nicht ordnungsgemäß beendet werden.');
      setIsLoading(false);
    }
  };

  // Render-Funktion für Chatnachrichten
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const messageStyles = isUser ? styles.userMessage : styles.assistantMessage;
    const textStyles = isUser ? styles.userMessageText : styles.assistantMessageText;

    return (
      <View 
        key={index} 
        style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.assistantMessageContainer]}
      >
        <View style={messageStyles}>
          <Text style={textStyles}>{message.content}</Text>
        </View>
      </View>
    );
  };

  // Render-Funktion für Code-Snippets
  const renderCodeSnippet = (snippet: CodeSnippet, index: number) => {
    return (
      <Card key={index} style={styles.codeCard}>
        <Card.Title 
          title={snippet.language.toUpperCase()} 
          subtitle={snippet.purpose}
          right={(props) => (
            <TouchableOpacity onPress={() => shareCode(snippet)}>
              <Icon name="share-variant" size={24} color="#666" />
            </TouchableOpacity>
          )}
        />
        <Card.Content>
          <ScrollView horizontal style={styles.codeScrollContainer}>
            <CodeHighlighter
              language={snippet.language || 'javascript'}
              theme={atomDark}
              hightlightLines={[]}
              textStyle={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
            >
              {snippet.code}
            </CodeHighlighter>
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  // Funktion zum Teilen von Code
  const shareCode = (snippet: CodeSnippet) => {
    Alert.alert(
      "Code teilen",
      "Diese Funktion wird bald verfügbar sein.",
      [{ text: "OK" }]
    );
  };

  useEffect(() => {
    // Berechtigungen für Kamera und Mikrofon anfordern
    (async () => {
      try {
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        const microphonePermission = await Audio.requestPermissionsAsync();

        if (cameraPermission.status !== 'granted' || microphonePermission.status !== 'granted') {
          console.log('Berechtigungen verweigert:', {
            camera: cameraPermission.status,
            microphone: microphonePermission.status
          });

          Alert.alert(
            'Berechtigungen erforderlich',
            'Für die Nutzung des interaktiven Studios werden Kamera- und Mikrofonberechtigungen benötigt.',
            [
              { 
                text: 'Einstellungen öffnen', 
                onPress: () => Linking.openSettings() 
              },
              { 
                text: 'Abbrechen', 
                style: 'cancel' 
              }
            ]
          );

          // Event für fehlende Berechtigungen senden
          //analytics.logEvent('permissions_denied', {
          //  camera: cameraPermission.status !== 'granted',
          //  microphone: microphonePermission.status !== 'granted'
          //});
        } else {
          setPermissionsGranted(true);
          console.log('Berechtigungen erteilt für Kamera und Mikrofon');
        }
      } catch (error) {
        console.error('Fehler beim Anfordern der Berechtigungen:', error);
        Alert.alert(
          'Fehler bei Berechtigungen',
          'Ein Fehler ist beim Anfordern der Berechtigungen aufgetreten. Bitte starten Sie die App neu.'
        );
      }
    })();
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{sessionState.topic}</Text>
        <TouchableOpacity onPress={endSession} disabled={isLoading}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'chat' && styles.activeTabButton]} 
          onPress={() => setActiveTab('chat')}
        >
          <Icon name="message-text" size={20} color={activeTab === 'chat' ? "#fff" : "#666"} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'code' && styles.activeTabButton]} 
          onPress={() => setActiveTab('code')}
        >
          <Icon name="code-tags" size={20} color={activeTab === 'code' ? "#fff" : "#666"} />
          <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>
            Code ({sessionState.codeSnippets.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat Tab Content */}
      {activeTab === 'chat' && (
        <View style={styles.chatContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {sessionState.messages.map(renderMessage)}

            {isLoading && (
              <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
                <View style={styles.assistantMessage}>
                  <ActivityIndicator size="small" color="#666" />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            {/* Live-Modus-Schalter */}
            <View style={styles.liveModeContainer}>
              <Button
                mode={liveMode ? "contained" : "outlined"}
                onPress={() => setLiveMode(!liveMode)}
                disabled={isLoading || isStreaming}
                icon={liveMode ? "flash" : "flash-outline"}
                style={styles.liveModeButton}
              >
                {liveMode ? "Live-Modus" : "Live-Modus aktivieren"}
              </Button>

              {liveMode && (
                <Text style={styles.liveModeHint}>
                  Echtzeit-Brainstorming mit Gemini
                </Text>
              )}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={userInput}
                onChangeText={setUserInput}
                placeholder={liveMode 
                  ? "Beschreibe deine Idee für ein Brainstorming..." 
                  : "Stell eine Frage oder beschreibe dein Anliegen..."}
                multiline
                placeholderTextColor="#999"
              />

              <TouchableOpacity 
                style={styles.sendButton}
                onPress={liveMode ? startLiveSession : sendMessage}
                disabled={isLoading || !userInput.trim() || isStreaming}
              >
                <Icon 
                  name={liveMode ? "flash" : "send"} 
                  size={24} 
                  color={isLoading || !userInput.trim() || isStreaming ? "#999" : "#2196F3"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Code Tab Content */}
      {activeTab === 'code' && (
        <ScrollView style={styles.codeContainer} contentContainerStyle={styles.codeContent}>
          {sessionState.codeSnippets.length === 0 ? (
            <View style={styles.emptyCodeContainer}>
              <Icon name="code-braces" size={64} color="#ccc" />
              <Text style={styles.emptyCodeTitle}>Noch keine Code-Snippets</Text>
              <Text style={styles.emptyCodeText}>
                Stell Fragen zur Generierung von Code, Visualisierungen oder Präsentationen.
              </Text>
            </View>
          ) : (
            sessionState.codeSnippets.map(renderCodeSnippet)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  activeTabButton: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    marginLeft: 8,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  chatContainer: {
    flex: 1,
    display: activeTab === 'chat' ? 'flex' : 'none',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  assistantMessage: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 48,
    maxHeight: 120,
    minHeight: 50,
  },
  sendButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeContainer: {
    flex: 1,
    display: activeTab === 'code' ? 'flex' : 'none',
  },
  codeContent: {
    padding: 16,
  },
  codeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  codeScrollContainer: {
    backgroundColor: '#282c34',
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  emptyCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyCodeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCodeText: {
    textAlign: 'center',
    color: '#666',
  },
  liveModeContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  liveModeButton: {
    borderRadius: 16,
  },
  liveModeHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default InteractiveStudioScreen;