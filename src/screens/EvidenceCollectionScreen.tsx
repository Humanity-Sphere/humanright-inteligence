import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

// Services
import OfflineManager from '../services/OfflineManager';

// Typen für Beweismittel
interface Evidence {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  uri: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  tags: string[];
  created_at: number;
  synced: number;
}

// Komponente für ein einzelnes Beweismittel
const EvidenceItem = ({ item, onPress }: { item: Evidence; onPress: () => void }) => {
  const getIconForType = () => {
    switch (item.type) {
      case 'photo':
        return 'https://img.icons8.com/fluency/96/000000/image.png';
      case 'video':
        return 'https://img.icons8.com/fluency/96/000000/video.png';
      case 'audio':
        return 'https://img.icons8.com/fluency/96/000000/audio-wave.png';
      case 'document':
        return 'https://img.icons8.com/fluency/96/000000/document.png';
      default:
        return 'https://img.icons8.com/fluency/96/000000/file.png';
    }
  };

  const renderPreview = () => {
    if (item.type === 'photo') {
      return (
        <Image
          source={{ uri: item.uri }}
          style={styles.evidencePreview}
          resizeMode="cover"
        />
      );
    } else {
      return (
        <View style={styles.evidenceIconContainer}>
          <Image
            source={{ uri: getIconForType() }}
            style={styles.evidenceIcon}
            resizeMode="contain"
          />
        </View>
      );
    }
  };

  return (
    <TouchableOpacity style={styles.evidenceItem} onPress={onPress}>
      {renderPreview()}
      <View style={styles.evidenceInfo}>
        <Text style={styles.evidenceTitle}>{item.title}</Text>
        <Text style={styles.evidenceDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.evidenceMetadata}>
          <Text style={styles.evidenceDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <View style={styles.evidenceTags}>
            {item.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.evidenceTag}>
                <Text style={styles.evidenceTagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 2 && (
              <Text style={styles.evidenceTagMore}>+{item.tags.length - 2}</Text>
            )}
          </View>
        </View>
      </View>
      {item.synced === 0 && (
        <View style={styles.syncBadge}>
          <Text style={styles.syncBadgeText}>Offline</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Modal zum Hinzufügen neuer Beweismittel
const AddEvidenceModal = ({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (evidence: Partial<Evidence>) => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [evidenceType, setEvidenceType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get location permission and current location
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (error) {
          console.error('Error getting location:', error);
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setEvidenceType('photo');
    }
  };

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Keine Berechtigung', 'Wir benötigen Kamerazugriff, um Fotos zu machen.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setEvidenceType('photo');
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Titel ein.');
      return;
    }

    if (!mediaUri) {
      Alert.alert('Fehler', 'Bitte wählen Sie ein Foto oder Video aus.');
      return;
    }

    setLoading(true);

    // Erstellen des Beweismittel-Objekts
    const evidence: Partial<Evidence> = {
      title,
      description,
      type: evidenceType,
      uri: mediaUri,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      created_at: Date.now(),
    };

    if (location) {
      evidence.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: Date.now(),
      };
    }

    // Übergabe an parent component
    onSave(evidence);

    // Reset und schließen
    setTitle('');
    setDescription('');
    setTags('');
    setMediaUri(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Neues Beweismittel</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>Abbrechen</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.inputLabel}>Titel *</Text>
          <TextInput
            style={styles.input}
            placeholder="Titel des Beweismittels"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.inputLabel}>Beschreibung</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Beschreiben Sie den Kontext und die Bedeutung"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.inputLabel}>Tags (durch Komma getrennt)</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. Polizei, Protest, Berlin"
            value={tags}
            onChangeText={setTags}
          />

          <Text style={styles.inputLabel}>Medium *</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={takePicture}
            >
              <Image
                source={{ uri: 'https://img.icons8.com/fluency/96/000000/camera.png' }}
                style={styles.mediaButtonIcon}
              />
              <Text style={styles.mediaButtonText}>Kamera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={pickImage}
            >
              <Image
                source={{ uri: 'https://img.icons8.com/fluency/96/000000/image-gallery.png' }}
                style={styles.mediaButtonIcon}
              />
              <Text style={styles.mediaButtonText}>Galerie</Text>
            </TouchableOpacity>
          </View>

          {mediaUri && (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: mediaUri }}
                style={styles.mediaPreview}
                resizeMode="cover"
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Speichern</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Hauptkomponente für den Beweismittelsammlungs-Bildschirm
const EvidenceCollectionScreen = () => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    // In einer echten App würden wir die Daten aus dem lokalen SQLite laden
    // Für Demozwecke verwenden wir hier Beispieldaten
    
    setTimeout(() => {
      const mockEvidence: Evidence[] = [
        {
          id: '1',
          title: 'Polizeieinsatz bei Demonstration',
          description: 'Dokumentation des Polizeieinsatzes bei der Demonstration am Alexanderplatz.',
          type: 'photo',
          uri: 'https://via.placeholder.com/300',
          tags: ['Polizei', 'Demonstration', 'Berlin'],
          created_at: Date.now() - 86400000, // Yesterday
          synced: 1,
        },
        {
          id: '2',
          title: 'Interview mit Zeugen',
          description: 'Audio-Aufnahme eines Interviews mit Zeugen des Vorfalls.',
          type: 'audio',
          uri: 'https://example.com/audio.mp3',
          tags: ['Interview', 'Zeugen'],
          created_at: Date.now() - 172800000, // 2 days ago
          synced: 0,
        },
      ];

      setEvidenceList(mockEvidence);
      setLoading(false);
    }, 1000);
  };

  const handleAddEvidence = async (evidence: Partial<Evidence>) => {
    // In einer echten App würden wir das Beweismittel in SQLite speichern
    // und zur Sync-Queue hinzufügen
    
    const newEvidence: Evidence = {
      id: Date.now().toString(),
      title: evidence.title || '',
      description: evidence.description || '',
      type: evidence.type || 'photo',
      uri: evidence.uri || '',
      tags: evidence.tags || [],
      location: evidence.location,
      created_at: evidence.created_at || Date.now(),
      synced: 0,
    };

    setEvidenceList(prev => [newEvidence, ...prev]);

    // In einer echten App würden wir hier OfflineManager.addToSyncQueue aufrufen
    Alert.alert(
      'Erfolgreich',
      'Das Beweismittel wurde gespeichert und wird synchronisiert, sobald eine Internetverbindung verfügbar ist.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Beweissammlung</Text>
        <Text style={styles.subtitle}>
          Erfassen und organisieren Sie Beweismittel für Menschenrechtsfälle
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a86e8" />
          <Text style={styles.loadingText}>Beweismittel werden geladen...</Text>
        </View>
      ) : (
        <FlatList
          data={evidenceList}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <EvidenceItem
              item={item}
              onPress={() => {
                // Hier würden wir zur Detailansicht navigieren
                Alert.alert('Beweismittel', `Details für: ${item.title}`);
              }}
            />
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Noch keine Beweismittel vorhanden. Tippen Sie auf +, um ein neues Beweismittel hinzuzufügen.
              </Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      <AddEvidenceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddEvidence}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    padding: 24,
    backgroundColor: '#4a86e8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e6f0ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Für den Floating Button
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  evidenceItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evidencePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  evidenceIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  evidenceIcon: {
    width: 40,
    height: 40,
  },
  evidenceInfo: {
    flex: 1,
  },
  evidenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  evidenceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  evidenceMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evidenceDate: {
    fontSize: 12,
    color: '#999',
  },
  evidenceTags: {
    flexDirection: 'row',
  },
  evidenceTag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  evidenceTagText: {
    fontSize: 10,
    color: '#0d47a1',
  },
  evidenceTagMore: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
  },
  syncBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ff9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a86e8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 16,
    color: '#4a86e8',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mediaButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mediaButtonIcon: {
    width: 36,
    height: 36,
    marginBottom: 8,
  },
  mediaButtonText: {
    fontSize: 14,
    color: '#333',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#4a86e8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EvidenceCollectionScreen;