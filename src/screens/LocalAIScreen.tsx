
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { localModelService } from '../services/LocalModelService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LocalAIScreen() {
  const [modelUrl, setModelUrl] = useState('http://192.168.1.100:11434');
  const [prompt, setPrompt] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [modelUrl]);

  const checkConnection = async () => {
    localModelService.configure(modelUrl);
    const connected = await localModelService.checkConnection();
    setIsConnected(connected);
  };

  const handleTextGeneration = async () => {
    if (!prompt.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Prompt ein');
      return;
    }

    setIsLoading(true);
    try {
      const result = await localModelService.generateText(prompt);
      setResponse(result);
    } catch (error) {
      Alert.alert('Fehler', `Textgenerierung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultimodalGeneration = async () => {
    if (!prompt.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Prompt ein');
      return;
    }

    if (!imageUri) {
      Alert.alert('Fehler', 'Bitte wähle ein Bild aus');
      return;
    }

    setIsLoading(true);
    try {
      const result = await localModelService.generateMultimodalContent(prompt, imageUri);
      setResponse(result);
    } catch (error) {
      Alert.alert('Fehler', `Multimodale Generierung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const uri = await localModelService.pickImage();
    if (uri) {
      setImageUri(uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Lokale KI</Text>
        
        <View style={styles.connectionContainer}>
          <TextInput
            style={styles.input}
            value={modelUrl}
            onChangeText={setModelUrl}
            placeholder="URL des lokalen Modells (z.B. http://192.168.1.100:11434)"
          />
          <TouchableOpacity style={styles.checkButton} onPress={checkConnection}>
            <Text style={styles.buttonText}>Prüfen</Text>
          </TouchableOpacity>
          <Text style={[styles.statusText, { color: isConnected ? 'green' : 'red' }]}>
            {isConnected ? 'Verbunden' : 'Nicht verbunden'}
          </Text>
        </View>

        <TextInput
          style={styles.promptInput}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Gib deinen Prompt ein..."
          multiline
        />
        
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Bild auswählen</Text>
          </TouchableOpacity>
          
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.image} />
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, !isConnected && styles.disabledButton]} 
            onPress={handleTextGeneration}
            disabled={!isConnected || isLoading}
          >
            <Text style={styles.buttonText}>Nur Text</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, (!isConnected || !imageUri) && styles.disabledButton]} 
            onPress={handleMultimodalGeneration}
            disabled={!isConnected || !imageUri || isLoading}
          >
            <Text style={styles.buttonText}>Text + Bild</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}
        
        {response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>Antwort:</Text>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  connectionContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  checkButton: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loader: {
    marginVertical: 16,
  },
  responseContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
