import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

// Services
import OfflineManager from '../services/OfflineManager';

// Typen für die Lernpfade und Module
interface LearningPath {
  id: string;
  title: string;
  description: string;
  goal: string;
  created_at: number;
  synced: number;
}

interface LearningModule {
  id: string;
  path_id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  created_at: number;
  synced: number;
}

// Komponente für einen einzelnen Lernpfad
const LearningPathItem = ({ path, onPress }: { 
  path: LearningPath; 
  onPress: () => void; 
}) => (
  <TouchableOpacity 
    style={styles.pathItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.pathTitle}>{path.title}</Text>
    <Text style={styles.pathDescription}>{path.description}</Text>
    <View style={styles.pathFooter}>
      <Text style={styles.pathGoal}>Ziel: {path.goal}</Text>
      <Text style={styles.pathDate}>
        {new Date(path.created_at).toLocaleDateString()}
      </Text>
    </View>
    {path.synced === 0 && (
      <View style={styles.syncBadge}>
        <Text style={styles.syncBadgeText}>Offline</Text>
      </View>
    )}
  </TouchableOpacity>
);

// Lernpfade Tab
const LearningPathsTab = () => {
  const navigation = useNavigation();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningPaths();
  }, []);

  const loadLearningPaths = async () => {
    try {
      const data = await OfflineManager.getLearningPaths();
      setPaths(data);
    } catch (error) {
      console.error('Fehler beim Laden der Lernpfade:', error);
      Alert.alert('Fehler', 'Die Lernpfade konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a86e8" />
        <Text style={styles.loadingText}>Lernpfade werden geladen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {paths.length > 0 ? (
        <FlatList
          data={paths}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LearningPathItem
              path={item}
              onPress={() => {
                // Hier würde die Navigation zu den Details des Lernpfads erfolgen
                Alert.alert('Lernpfad', `Details für: ${item.title}`);
              }}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Noch keine Lernpfade vorhanden. Erstellen Sie einen neuen Lernpfad.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          // Modal zum Erstellen eines neuen Lernpfads öffnen (in der realen App)
          Alert.alert(
            'Neuer Lernpfad',
            'Hier würde ein Dialog zum Erstellen eines neuen Lernpfads erscheinen.'
          );
        }}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// Fähigkeiten Tab
const SkillsTab = () => (
  <View style={styles.tabContent}>
    <Text style={styles.emptyText}>
      Anzeige Ihrer Fähigkeiten und Fortschritte
    </Text>
  </View>
);

// Ressourcen Tab
const ResourcesTab = () => (
  <View style={styles.tabContent}>
    <Text style={styles.emptyText}>
      Ihre Lernressourcen und Materialien
    </Text>
  </View>
);

// Hauptkomponente für den Lernpfade-Bildschirm
const LearningPathsScreen = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'paths', title: 'Lernpfade' },
    { key: 'skills', title: 'Fähigkeiten' },
    { key: 'resources', title: 'Ressourcen' },
  ]);

  // Scene Map für die Tabs
  const renderScene = SceneMap({
    paths: LearningPathsTab,
    skills: SkillsTab,
    resources: ResourcesTab,
  });

  // Render für die Tab-Leiste
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor="#4a86e8"
      inactiveColor="#999"
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabIndicator: {
    backgroundColor: '#4a86e8',
    height: 3,
  },
  tabLabel: {
    fontWeight: '600',
    textTransform: 'none',
  },
  tabContent: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  pathItem: {
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
  pathTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pathFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pathGoal: {
    fontSize: 12,
    color: '#4a86e8',
    fontWeight: '500',
  },
  pathDate: {
    fontSize: 12,
    color: '#999',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
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
});

export default LearningPathsScreen;