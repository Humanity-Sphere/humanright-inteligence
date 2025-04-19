import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { JournalEntry } from '../../services/OfflineManager';
import JournalService from '../../services/JournalService';
import JournalListItem from './JournalListItem';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface JournalListProps {
  onSelectEntry: (entry: JournalEntry) => void;
  onCreateNew: () => void;
}

/**
 * Komponente zur Anzeige der Journal-Einträge
 */
const JournalList: React.FC<JournalListProps> = ({ onSelectEntry, onCreateNew }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Laden der Einträge
  const loadEntries = async () => {
    try {
      setLoading(true);
      const journalEntries = await JournalService.getJournalEntries();
      setEntries(journalEntries);
    } catch (error) {
      console.error('Fehler beim Laden der Journal-Einträge:', error);
      Alert.alert(
        'Fehler',
        'Die Journal-Einträge konnten nicht geladen werden. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Initialer Ladevorgang
  useEffect(() => {
    loadEntries();
  }, []);
  
  // Aktualisieren der Liste bei Pull-to-Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };
  
  // Löschen eines Eintrags
  const handleDeleteEntry = (entry: JournalEntry) => {
    Alert.alert(
      'Eintrag löschen',
      `Möchten Sie den Eintrag "${entry.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await JournalService.deleteJournalEntry(entry.id);
              // Eintrag aus der lokalen Liste entfernen
              setEntries(entries.filter(e => e.id !== entry.id));
            } catch (error) {
              console.error('Fehler beim Löschen des Eintrags:', error);
              Alert.alert(
                'Fehler',
                'Der Eintrag konnte nicht gelöscht werden. Bitte versuchen Sie es später erneut.'
              );
            }
          }
        }
      ]
    );
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Journal-Einträge werden geladen...</Text>
      </View>
    );
  }
  
  if (entries.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="book-outline" size={64} color="#CCCCCC" />
        <Text style={styles.emptyText}>Keine Journal-Einträge vorhanden</Text>
        <TouchableOpacity style={styles.createButton} onPress={onCreateNew}>
          <Text style={styles.createButtonText}>Neuen Eintrag erstellen</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        renderItem={({ item }) => (
          <JournalListItem 
            entry={item} 
            onPress={onSelectEntry}
            onLongPress={handleDeleteEntry}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
          />
        }
      />
      
      <TouchableOpacity style={styles.fab} onPress={onCreateNew}>
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A7A7A',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A7A7A',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4A90E2',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default JournalList;