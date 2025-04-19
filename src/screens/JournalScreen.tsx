import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Alert, BackHandler } from 'react-native';
import { JournalEntry } from '../services/OfflineManager';
import EncryptionService from '../services/EncryptionService';
import JournalList from '../components/Journal/JournalList';
import JournalEditor from '../components/Journal/JournalEditor';
import JournalDetailView from '../components/Journal/JournalDetailView';

/**
 * Hauptscreen für die Journal-Funktionalität
 */
const JournalScreen: React.FC = () => {
  // States für UI-Steuerung
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'edit' | 'create'>('list');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Initialisierung
  useEffect(() => {
    const init = async () => {
      try {
        // Initialisiere den Verschlüsselungsservice
        await EncryptionService.initialize();
        setInitialized(true);
      } catch (error) {
        console.error('Fehler bei der Initialisierung des Journal-Screens:', error);
        Alert.alert(
          'Fehler',
          'Die Journal-Funktion konnte nicht initialisiert werden. Bitte starten Sie die App neu.'
        );
      }
    };
    
    init();
  }, []);
  
  // Back-Handling
  useEffect(() => {
    const handleBackPress = () => {
      if (viewMode === 'detail') {
        setViewMode('list');
        return true;
      } else if (viewMode === 'edit' || viewMode === 'create') {
        // Frage nach Bestätigung, wenn ein Eintrag erstellt oder bearbeitet wird
        Alert.alert(
          'Änderungen verwerfen?',
          'Möchten Sie die Bearbeitung abbrechen? Alle Änderungen gehen verloren.',
          [
            { text: 'Bleiben', style: 'cancel' },
            { 
              text: 'Verwerfen', 
              style: 'destructive',
              onPress: () => {
                if (viewMode === 'edit') {
                  setViewMode('detail');
                } else {
                  setViewMode('list');
                }
              }
            }
          ]
        );
        return true;
      }
      return false;
    };
    
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [viewMode]);
  
  // Handler für die Auswahl eines Eintrags
  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setViewMode('detail');
  };
  
  // Handler für das Erstellen eines neuen Eintrags
  const handleCreateNew = () => {
    setSelectedEntry(null);
    setViewMode('create');
  };
  
  // Handler für das Bearbeiten eines bestehenden Eintrags
  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setViewMode('edit');
  };
  
  // Handler für die Rückkehr zur Liste
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEntry(null);
  };
  
  // Handler für die Rückkehr zur Detailansicht
  const handleBackToDetail = () => {
    setViewMode('detail');
  };
  
  // Handler für das Speichern eines Eintrags
  const handleSaveEntry = (entry: JournalEntry) => {
    if (viewMode === 'edit') {
      setSelectedEntry(entry);
      setViewMode('detail');
    } else {
      setViewMode('list');
    }
  };
  
  // Anzeige der verschiedenen Modi (Liste, Detail, Bearbeiten, Erstellen)
  const renderContent = () => {
    if (!initialized) {
      return null; // Zeige nichts an, während initialisiert wird
    }
    
    switch (viewMode) {
      case 'list':
        return (
          <JournalList 
            onSelectEntry={handleSelectEntry} 
            onCreateNew={handleCreateNew}
          />
        );
        
      case 'detail':
        if (!selectedEntry) return null;
        return (
          <JournalDetailView
            entry={selectedEntry}
            onBack={handleBackToList}
            onEdit={handleEditEntry}
          />
        );
        
      case 'edit':
        if (!selectedEntry) return null;
        return (
          <JournalEditor
            entry={selectedEntry}
            onSave={handleSaveEntry}
            onCancel={handleBackToDetail}
          />
        );
        
      case 'create':
        return (
          <JournalEditor
            onSave={handleSaveEntry}
            onCancel={handleBackToList}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  }
});

export default JournalScreen;