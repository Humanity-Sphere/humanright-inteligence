import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SmartGlassService from '../services/SmartGlassService';
import AssistantService from '../services/AssistantService';
import LocalStorageService from '../services/LocalStorageService';

const SmartGlassScreen = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [capturedImages, setCapturedImages] = useState<any[]>([]);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  
  // Beim ersten Laden prüfen, ob Smart Glass verfügbar ist
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await SmartGlassService.isGlassAvailable();
      console.log('Smart Glass verfügbar:', available);
    };
    
    const loadSessions = async () => {
      const allSessions = await SmartGlassService.getAllSessions();
      setSessions(allSessions);
    };
    
    checkAvailability();
    loadSessions();
  }, []);
  
  // Status-Updates bei Verbindungsänderungen
  useEffect(() => {
    const updateStatus = async () => {
      const connected = SmartGlassService.isGlassConnected();
      setIsConnected(connected);
      
      if (connected) {
        const active = SmartGlassService.getActiveSession();
        setActiveSession(active);
        
        if (active) {
          setCapturedImages(active.cameraImages || []);
        }
      } else {
        setActiveSession(null);
        setCapturedImages([]);
      }
      
      const voiceActive = AssistantService.isVoiceControlActive();
      setIsVoiceActive(voiceActive);
    };
    
    // Initial ausführen
    updateStatus();
    
    // Status-Update-Intervall für simulierte Updates
    const interval = setInterval(() => {
      updateStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isConnected]);
  
  // Mit Smart Glass verbinden
  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      if (isConnected) {
        // Trennen
        await AssistantService.disconnectFromSmartGlass();
        setIsConnected(false);
        setActiveSession(null);
        setCapturedImages([]);
        setIsVoiceActive(false);
      } else {
        // Verbinden
        const success = await AssistantService.connectToSmartGlass();
        
        if (success) {
          setIsConnected(true);
          const active = SmartGlassService.getActiveSession();
          setActiveSession(active);
          
          Alert.alert(
            'Verbunden',
            'Erfolgreich mit Smart Glass verbunden.'
          );
        } else {
          Alert.alert(
            'Verbindungsfehler',
            'Konnte keine Verbindung zur Smart Glass herstellen.'
          );
        }
      }
    } catch (error) {
      console.error('Fehler bei Verbindung/Trennung:', error);
      Alert.alert(
        'Fehler',
        'Bei der Verbindungsoperation ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sprachsteuerung ein-/ausschalten
  const toggleVoiceControl = async () => {
    setIsLoading(true);
    
    try {
      if (!isConnected) {
        Alert.alert(
          'Nicht verbunden',
          'Bitte zuerst mit der Smart Glass verbinden.'
        );
        return;
      }
      
      if (isVoiceActive) {
        // Sprachsteuerung deaktivieren
        await AssistantService.stopVoiceControl();
        setIsVoiceActive(false);
      } else {
        // Sprachsteuerung aktivieren
        const success = await AssistantService.startVoiceControl();
        
        if (success) {
          setIsVoiceActive(true);
          Alert.alert(
            'Sprachsteuerung aktiviert',
            'Sprechen Sie Befehle, um die Smart Glass zu steuern. Sagen Sie "Hilfe" für eine Liste der verfügbaren Befehle.'
          );
        } else {
          Alert.alert(
            'Fehler',
            'Sprachsteuerung konnte nicht aktiviert werden.'
          );
        }
      }
    } catch (error) {
      console.error('Fehler bei Sprachsteuerung:', error);
      Alert.alert(
        'Fehler',
        'Bei der Aktivierung der Sprachsteuerung ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Bild aufnehmen
  const captureImage = async () => {
    if (!isConnected) {
      Alert.alert(
        'Nicht verbunden',
        'Bitte zuerst mit der Smart Glass verbinden.'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      const image = await SmartGlassService.captureGlassImage();
      
      if (image) {
        Alert.alert(
          'Bild aufgenommen',
          'Bild wurde erfolgreich aufgenommen.'
        );
        
        // Bilder aktualisieren
        const active = SmartGlassService.getActiveSession();
        if (active) {
          setCapturedImages(active.cameraImages || []);
        }
      } else {
        Alert.alert(
          'Fehler',
          'Bild konnte nicht aufgenommen werden.'
        );
      }
    } catch (error) {
      console.error('Fehler bei Bildaufnahme:', error);
      Alert.alert(
        'Fehler',
        'Bei der Bildaufnahme ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Bild analysieren (OCR)
  const analyzeImage = async () => {
    if (!isConnected) {
      Alert.alert(
        'Nicht verbunden',
        'Bitte zuerst mit der Smart Glass verbinden.'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      const ocrResult = await SmartGlassService.captureAndAnalyzeImage();
      
      if (ocrResult && ocrResult.text) {
        setRecognizedText(ocrResult.text);
        
        Alert.alert(
          'Analyse abgeschlossen',
          'Text erfolgreich erkannt.'
        );
        
        // Bilder aktualisieren
        const active = SmartGlassService.getActiveSession();
        if (active) {
          setCapturedImages(active.cameraImages || []);
        }
      } else {
        Alert.alert(
          'Analysefehler',
          'Es konnte kein Text im Bild erkannt werden.'
        );
      }
    } catch (error) {
      console.error('Fehler bei Bildanalyse:', error);
      Alert.alert(
        'Fehler',
        'Bei der Bildanalyse ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Multimodale Analyse
  const multimodalAnalysis = async () => {
    if (!isConnected) {
      Alert.alert(
        'Nicht verbunden',
        'Bitte zuerst mit der Smart Glass verbinden.'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await SmartGlassService.performMultimodalAnalysis(
        'Bitte beschreiben Sie, was Sie im Bild sehen'
      );
      
      if (result.ocr && result.voice) {
        Alert.alert(
          'Multimodale Analyse',
          `Bild: ${result.ocr.text.substring(0, 50)}...\n\nSprachbeschreibung: ${result.voice}`
        );
        
        setRecognizedText(`OCR: ${result.ocr.text}\n\nSprachbeschreibung: ${result.voice}`);
      } else if (result.ocr) {
        Alert.alert(
          'Nur Bildanalyse',
          `Nur OCR-Text erkannt: ${result.ocr.text.substring(0, 100)}...`
        );
        
        setRecognizedText(`OCR: ${result.ocr.text}`);
      } else if (result.voice) {
        Alert.alert(
          'Nur Sprachanalyse',
          `Nur Sprachdaten: ${result.voice}`
        );
        
        setRecognizedText(`Sprachbeschreibung: ${result.voice}`);
      } else {
        Alert.alert(
          'Analysefehler',
          'Multimodale Analyse fehlgeschlagen.'
        );
      }
      
      // Bilder aktualisieren
      const active = SmartGlassService.getActiveSession();
      if (active) {
        setCapturedImages(active.cameraImages || []);
      }
    } catch (error) {
      console.error('Fehler bei multimodaler Analyse:', error);
      Alert.alert(
        'Fehler',
        'Bei der multimodalen Analyse ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Neue Session starten
  const startNewSession = async () => {
    if (!isConnected) {
      Alert.alert(
        'Nicht verbunden',
        'Bitte zuerst mit der Smart Glass verbinden.'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await SmartGlassService.startNewSession();
      
      if (success) {
        const active = SmartGlassService.getActiveSession();
        setActiveSession(active);
        setCapturedImages([]);
        setRecognizedText('');
        
        Alert.alert(
          'Neue Session',
          'Neue Smart Glass-Session wurde gestartet.'
        );
        
        // Sessions neu laden
        const allSessions = await SmartGlassService.getAllSessions();
        setSessions(allSessions);
      } else {
        Alert.alert(
          'Fehler',
          'Neue Session konnte nicht gestartet werden.'
        );
      }
    } catch (error) {
      console.error('Fehler beim Starten einer neuen Session:', error);
      Alert.alert(
        'Fehler',
        'Beim Starten einer neuen Session ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Aktive Session beenden
  const endCurrentSession = async () => {
    if (!isConnected || !activeSession) {
      Alert.alert(
        'Keine aktive Session',
        'Es ist keine Session aktiv, die beendet werden könnte.'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await SmartGlassService.stopActiveSession();
      
      if (success) {
        setActiveSession(null);
        setCapturedImages([]);
        setRecognizedText('');
        
        Alert.alert(
          'Session beendet',
          'Die aktive Smart Glass-Session wurde beendet.'
        );
        
        // Sessions neu laden
        const allSessions = await SmartGlassService.getAllSessions();
        setSessions(allSessions);
      } else {
        Alert.alert(
          'Fehler',
          'Session konnte nicht beendet werden.'
        );
      }
    } catch (error) {
      console.error('Fehler beim Beenden der Session:', error);
      Alert.alert(
        'Fehler',
        'Beim Beenden der Session ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Session aus dem Verlauf laden
  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    
    try {
      const session = await SmartGlassService.loadSession(sessionId);
      
      if (session) {
        Alert.alert(
          'Session geladen',
          `Session ${sessionId} wurde geladen.`
        );
        
        setCapturedImages(session.cameraImages || []);
        
        if (session.cameraImages && session.cameraImages.length > 0) {
          const lastImage = session.cameraImages[session.cameraImages.length - 1];
          if (lastImage.analysis) {
            setRecognizedText(lastImage.analysis.text);
          }
        }
      } else {
        Alert.alert(
          'Fehler',
          'Session konnte nicht geladen werden.'
        );
      }
    } catch (error) {
      console.error('Fehler beim Laden der Session:', error);
      Alert.alert(
        'Fehler',
        'Beim Laden der Session ist ein Fehler aufgetreten.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Smart Glass Integration</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#44FF44' : '#FF4444' }]} />
            <Text style={styles.statusText}>{isConnected ? 'Verbunden' : 'Nicht verbunden'}</Text>
          </View>
        </View>
        
        {/* Verbindungs-Button */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: isConnected ? '#FF4444' : '#4a86e8' }]}
          onPress={handleConnect}
          disabled={isLoading}
        >
          <Icon name={isConnected ? 'bluetooth-off' : 'bluetooth'} size={24} color="white" />
          <Text style={styles.buttonText}>
            {isLoading 
              ? 'Bitte warten...' 
              : isConnected 
                ? 'Von Smart Glass trennen' 
                : 'Mit Smart Glass verbinden'}
          </Text>
        </TouchableOpacity>
        
        {/* Sprachsteuerung ein-/ausschalten */}
        {isConnected && (
          <View style={styles.voiceControlContainer}>
            <Text style={styles.voiceControlLabel}>Sprachsteuerung</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#4a86e8" }}
              thumbColor={isVoiceActive ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleVoiceControl}
              value={isVoiceActive}
              disabled={isLoading || !isConnected}
            />
          </View>
        )}
        
        {/* Aktive Session-Info */}
        {isConnected && activeSession && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionInfoTitle}>Aktive Session</Text>
            <Text style={styles.sessionInfoText}>ID: {activeSession.id}</Text>
            <Text style={styles.sessionInfoText}>Start: {new Date(activeSession.startTime).toLocaleString()}</Text>
            <Text style={styles.sessionInfoText}>Bilder: {capturedImages.length}</Text>
            <Text style={styles.sessionInfoText}>Sprachbefehle: {activeSession.voiceCommands?.length || 0}</Text>
            
            <View style={styles.sessionControlButtons}>
              <TouchableOpacity
                style={[styles.sessionButton, { backgroundColor: '#FF9800' }]}
                onPress={endCurrentSession}
                disabled={isLoading}
              >
                <Icon name="stop-circle" size={20} color="white" />
                <Text style={styles.sessionButtonText}>Session beenden</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sessionButton, { backgroundColor: '#7cb342' }]}
                onPress={startNewSession}
                disabled={isLoading}
              >
                <Icon name="play-circle" size={20} color="white" />
                <Text style={styles.sessionButtonText}>Neue Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Aktionsbuttons */}
        {isConnected && (
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Smart Glass-Aktionen</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={captureImage}
                disabled={isLoading || !activeSession}
              >
                <Icon name="camera" size={24} color="white" />
                <Text style={styles.actionButtonText}>Bild aufnehmen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={analyzeImage}
                disabled={isLoading || !activeSession}
              >
                <Icon name="text-recognition" size={24} color="white" />
                <Text style={styles.actionButtonText}>Text erkennen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={multimodalAnalysis}
                disabled={isLoading || !activeSession}
              >
                <Icon name="image-text" size={24} color="white" />
                <Text style={styles.actionButtonText}>Multimodale Analyse</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Aufgenommener Text */}
        {recognizedText !== '' && (
          <View style={styles.recognizedTextContainer}>
            <Text style={styles.sectionTitle}>Erkannter Text</Text>
            <View style={styles.textContent}>
              <Text style={styles.recognizedText}>{recognizedText}</Text>
            </View>
          </View>
        )}
        
        {/* Aufgenommene Bilder */}
        {capturedImages.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.sectionTitle}>Aufgenommene Bilder ({capturedImages.length})</Text>
            
            <ScrollView horizontal style={styles.imagesScrollView}>
              {capturedImages.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  <View style={styles.imagePlaceholder}>
                    <Icon name="image" size={36} color="#999" />
                    <Text style={styles.imageText}>Bild {index + 1}</Text>
                    <Text style={styles.imageTimestamp}>
                      {new Date(image.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  {image.analysis && (
                    <View style={styles.imageAnalysisIndicator}>
                      <Icon name="check-circle" size={16} color="#44FF44" />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Session-Verlauf */}
        <View style={styles.sessionsContainer}>
          <TouchableOpacity 
            style={styles.sessionsHeader} 
            onPress={() => setShowSessions(!showSessions)}
          >
            <Text style={styles.sectionTitle}>Gespeicherte Sessions ({sessions.length})</Text>
            <Icon name={showSessions ? "chevron-up" : "chevron-down"} size={24} color="#333" />
          </TouchableOpacity>
          
          {showSessions && (
            <View style={styles.sessionsList}>
              {sessions.length === 0 ? (
                <Text style={styles.emptyText}>Keine gespeicherten Sessions vorhanden</Text>
              ) : (
                sessions.map((session, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.sessionItem}
                    onPress={() => loadSession(session.id)}
                  >
                    <View style={styles.sessionItemContent}>
                      <Text style={styles.sessionItemTitle}>Session {index + 1}</Text>
                      <Text style={styles.sessionItemDate}>
                        {new Date(session.startTime).toLocaleString()}
                      </Text>
                      <Text style={styles.sessionItemDetails}>
                        Bilder: {session.cameraImages?.length || 0}, 
                        Sprachbefehle: {session.voiceCommands?.length || 0}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#666" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Loading-Indikator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4a86e8" />
          <Text style={styles.loadingText}>Bitte warten...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc'
  },
  scrollView: {
    flex: 1
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  statusText: {
    fontSize: 16,
    color: '#333'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a86e8',
    borderRadius: 8,
    padding: 16,
    margin: 16
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  voiceControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  voiceControlLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  sessionInfo: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  sessionInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  sessionControlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a86e8',
    borderRadius: 8,
    padding: 12,
    flex: 0.48
  },
  sessionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8
  },
  actionsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a86e8',
    borderRadius: 8,
    padding: 12,
    width: '30%'
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center'
  },
  recognizedTextContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  textContent: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8
  },
  recognizedText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  imagesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  imagesScrollView: {
    flexDirection: 'row'
  },
  imageItem: {
    marginRight: 12,
    position: 'relative'
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  imageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  imageTimestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 2
  },
  imageAnalysisIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4
  },
  sessionsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 32
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sessionsList: {
    marginTop: 12
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  sessionItemContent: {
    flex: 1
  },
  sessionItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  sessionItemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  sessionItemDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16
  }
});

export default SmartGlassScreen;