import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { JournalEntry } from '../../services/OfflineManager';
import JournalService from '../../services/JournalService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Definierte Stimmungen mit Emojis
const MOODS = [
  { key: 'great', label: 'Großartig', emoji: '😃' },
  { key: 'good', label: 'Gut', emoji: '🙂' },
  { key: 'neutral', label: 'Neutral', emoji: '😐' },
  { key: 'bad', label: 'Schlecht', emoji: '☹️' },
  { key: 'terrible', label: 'Furchtbar', emoji: '😣' }
];

interface JournalEditorProps {
  entry?: JournalEntry; // Optional für Bearbeitung, wenn undefined => Neuer Eintrag
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
}

/**
 * Komponente zum Erstellen und Bearbeiten von Journal-Einträgen
 */
const JournalEditor: React.FC<JournalEditorProps> = ({ entry, onSave, onCancel }) => {
  // State für Form-Felder
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState<string | undefined>(entry?.mood);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [isEncrypted, setIsEncrypted] = useState(entry?.isEncrypted !== false); // Standardmäßig true
  const [saving, setSaving] = useState(false);
  
  // Neuen Tag hinzufügen
  const addTag = () => {
    if (tagInput.trim() === '') return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
    Keyboard.dismiss();
  };
  
  // Tag entfernen
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Speichern des Eintrags
  const handleSave = async () => {
    if (title.trim() === '') {
      Alert.alert('Fehler', 'Bitte geben Sie einen Titel ein.');
      return;
    }
    
    if (content.trim() === '') {
      Alert.alert('Fehler', 'Bitte geben Sie einen Inhalt ein.');
      return;
    }
    
    try {
      setSaving(true);
      
      if (entry) {
        // Bestehenden Eintrag aktualisieren
        await JournalService.updateJournalEntry(entry.id, {
          title,
          content,
          mood,
          tags,
          isEncrypted
        });
        
        // Aktualisierter Eintrag für die UI
        const updatedEntry: JournalEntry = {
          ...entry,
          title,
          content,
          mood,
          tags,
          updated_at: Date.now(),
          isEncrypted
        };
        
        onSave(updatedEntry);
      } else {
        // Neuen Eintrag erstellen
        const id = await JournalService.createJournalEntry({
          title,
          content,
          mood,
          tags,
          isEncrypted
        });
        
        // Neuer Eintrag für die UI
        const newEntry: JournalEntry = {
          id,
          title,
          content,
          created_at: Date.now(),
          updated_at: Date.now(),
          mood,
          tags,
          isEncrypted
        };
        
        onSave(newEntry);
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Journal-Eintrags:', error);
      Alert.alert(
        'Fehler',
        'Der Journal-Eintrag konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {entry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Icon name="close" size={24} color="#333333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Titel</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Titel des Eintrags"
            maxLength={100}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Inhalt</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Schreiben Sie hier Ihren Eintrag..."
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Stimmung</Text>
          <View style={styles.moodContainer}>
            {MOODS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.moodButton,
                  mood === item.key && styles.moodButtonSelected
                ]}
                onPress={() => setMood(item.key)}
              >
                <Text style={styles.moodEmoji}>{item.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  mood === item.key && styles.moodLabelSelected
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Tag hinzufügen (z.B. wichtig, privat)"
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
              <Icon name="plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Icon name="close-circle" size={16} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Verschlüsseln</Text>
            <Switch
              value={isEncrypted}
              onValueChange={setIsEncrypted}
              trackColor={{ false: '#CCCCCC', true: '#BFD7F2' }}
              thumbColor={isEncrypted ? '#4A90E2' : '#F5F5F5'}
            />
          </View>
          <Text style={styles.encryptionHint}>
            Verschlüsselte Einträge sind lokal gesichert und werden nicht unverschlüsselt übertragen.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Abbrechen</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Speichern</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#F9F9F9',
  },
  moodButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E8F0FE',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: '#7A7A7A',
  },
  moodLabelSelected: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: '#4A90E2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#4A90E2',
    marginRight: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  encryptionHint: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default JournalEditor;