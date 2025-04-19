
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch
} from 'react-native';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

const KIAssistantScreen: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const apiService = new ApiService();

  // Initialisiere Session beim Laden der Komponente
  useEffect(() => {
    initializeSession();

    return () => {
      // Cleanup beim Verlassen
      if (isSpeaking) {
        Speech.stop();
      }
      if (sessionId) {
        endSession();
      }
    };
  }, []);

  const initializeSession = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.post('/api/gemini-live/sessions', {
        context: {
          role: "Menschenrechtsverteidiger-Assistent",
          task: "Unterstützung und Beratung in Echtzeit",
          topic: "Menschenrechte und Sicherheit"
        }
      });
      
      if (response.data && response.data.sessionId) {
        setSessionId(response.data.sessionId);
        
        // Begrüßungsnachricht
        const welcomeMessage = "Hallo, ich bin Ihr KI-Assistenten Engel für Menschenrechtsfragen. Wie kann ich Ihnen heute helfen?";
        
        const newMessage: Message = {
          id: `assistant-${Date.now()}`,
          content: welcomeMessage,
          type: 'assistant',
          timestamp: new Date()
        };
        
        setMessages([newMessage]);
        
        if (autoSpeak) {
          speak(welcomeMessage);
        }
      } else {
        console.error('Keine SessionId erhalten');
      }
    } catch (error) {
      console.error('Fehler beim Initialisieren der Session:', error);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      await apiService.delete(`/api/gemini-live/sessions/${sessionId}`);
    } catch (error) {
      console.error('Fehler beim Beenden der Session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || loading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    try {
      setLoading(true);
      
      const response = await apiService.post('/api/gemini-live/messages', {
        sessionId,
        message: inputValue
      });
      
      if (response.data && response.data.response) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          content: response.data.response,
          type: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        if (autoSpeak) {
          speak(response.data.response);
        }
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }
    
    if (sessionId) {
      await endSession();
    }
    
    setMessages([]);
    initializeSession();
  };

  const speak = async (text: string) => {
    try {
      if (isSpeaking) {
        await Speech.stop();
      }
      
      setIsSpeaking(true);
      
      Speech.speak(text, {
        language: 'de-DE',
        onDone: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('Sprachausgabe Fehler:', error);
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('Fehler bei der Sprachausgabe:', error);
      setIsSpeaking(false);
    }
  };

  const toggleSpeech = (message: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      speak(message);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View 
      style={[
        styles.messageContainer, 
        item.type === 'user' ? styles.userMessage : styles.assistantMessage
      ]}
    >
      <View style={styles.messageHeader}>
        <View style={styles.messageInfo}>
          <MaterialIcons 
            name={item.type === 'user' ? 'person' : 'android'} 
            size={16} 
            color={item.type === 'user' ? '#fff' : '#000'} 
          />
          <Text style={[styles.timestamp, item.type === 'user' && styles.userTimestamp]}>
            {item.timestamp.toLocaleTimeString()}
          </Text>
        </View>
        
        {item.type === 'assistant' && (
          <TouchableOpacity 
            onPress={() => toggleSpeech(item.content)}
            style={styles.speakButton}
          >
            <MaterialIcons 
              name={isSpeaking ? 'volume-off' : 'volume-up'} 
              size={18} 
              color="#555" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[
        styles.messageText,
        item.type === 'user' && styles.userMessageText
      ]}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>KI-Assistenten Engel</Text>
        <View style={styles.headerControls}>
          <View style={styles.autoSpeakContainer}>
            <MaterialIcons name="volume-up" size={16} color="#555" />
            <Switch
              value={autoSpeak}
              onValueChange={setAutoSpeak}
              trackColor={{ false: '#ddd', true: '#aae' }}
              thumbColor={autoSpeak ? '#5469FF' : '#f4f3f4'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetChat}
          >
            <MaterialIcons name="refresh" size={18} color="#555" />
            <Text style={styles.resetText}>Neu</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5469FF" />
          <Text style={styles.loadingText}>Verbindung wird hergestellt...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Schreiben Sie Ihre Nachricht..."
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputValue.trim() || !sessionId || loading) && styles.disabledButton
          ]}
          onPress={handleSendMessage}
          disabled={!inputValue.trim() || !sessionId || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  autoSpeakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4
  },
  resetText: {
    fontSize: 12,
    marginLeft: 2,
    color: '#555'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: '#666'
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24
  },
  messageContainer: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#5469FF',
    borderTopRightRadius: 4
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9e9e9',
    borderTopLeftRadius: 4
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  speakButton: {
    padding: 2
  },
  messageText: {
    fontSize: 15,
    color: '#333'
  },
  userMessageText: {
    color: '#fff'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: '#f8f8f8'
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5469FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },
  disabledButton: {
    backgroundColor: '#b1b8e3'
  }
});

export default KIAssistantScreen;
