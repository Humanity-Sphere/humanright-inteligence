import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, useWindowDimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { ErrorBoundary } from 'react-native-error-boundary';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import JournalScreen from './src/screens/JournalScreen';
import DocumentAnalysisScreen from './src/screens/DocumentAnalysisScreen';
import EvidenceCollectionScreen from './src/screens/EvidenceCollectionScreen';
import AccessibilitySettingsScreen from './src/screens/AccessibilitySettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SmartGlassScreen from './src/screens/SmartGlassScreen';
import HelpBubbleDemoScreen from './src/screens/HelpBubbleDemoScreen';
import LearningPathsScreen from './src/screens/LearningPathsScreen';
import InteractiveStudioScreen from './src/screens/InteractiveStudioScreen';
import LocalAIScreen from './src/screens/LocalAIScreen'; // Added import


// Contexts
import { HelpProvider } from './src/contexts/HelpContext';

// Services
import { useDimensions, colors } from './src/services/ResponsiveService';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

interface AccessibilitySettings {
  isDarkMode: boolean;
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
}

const MainTabs = () => {
  const { isPhone } = useDimensions();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Journal') {
            iconName = focused ? 'journal' : 'journal-outline';
          } else if (route.name === 'Dokumente') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Beweise') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={isPhone ? size : size + 4} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: isPhone ? 5 : 10,
          height: isPhone ? 60 : 70,
        },
        tabBarLabelStyle: {
          fontSize: isPhone ? 12 : 14,
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Dokumente" component={DocumentAnalysisScreen} />
      <Tab.Screen name="Beweise" component={EvidenceCollectionScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const DrawerContent = (props) => {
  const { isPhone } = useDimensions();

  return (
    <View style={{ flex: 1, padding: isPhone ? 10 : 20 }}>
      <View style={{ 
        alignItems: 'center', 
        padding: isPhone ? 20 : 30, 
        marginBottom: isPhone ? 20 : 40 
      }}>
        <Text style={{ 
          fontSize: isPhone ? 18 : 24, 
          fontWeight: 'bold',
          color: colors.primary
        }}>
          Human Rights Intelligence
        </Text>
      </View>
      {props.children}
    </View>
  );
};

// Komponente für Fehleranzeige
const ErrorFallback = ({ error, resetError }: { error: Error, resetError: () => void }) => {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Ein Fehler ist aufgetreten</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <TouchableOpacity style={styles.resetButton} onPress={resetError}>
        <Text style={styles.resetButtonText}>App zurücksetzen</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function App() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    isDarkMode: false,
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
  });

  const { isPhone, width } = useDimensions();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('accessibilitySettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    }
  };

  // Globale Fehlerbehandlung für unbehandelte Fehler
  const handleError = (error: Error) => {
    console.error("Unbehandelter Fehler:", error);
    // Hier könnten Sie den Fehler an einen Fehlerüberwachungsdienst senden
  };

  // Verwende Drawer für größere Bildschirme, nur Stack für Telefone
  const renderNavigator = () => {
    if (width > 768) {
      return (
        <Drawer.Navigator
          initialRouteName="MainContent"
          drawerContent={(props) => <DrawerContent {...props} />}
          screenOptions={{
            headerStyle: {
              backgroundColor: settings.isDarkMode ? colors.dark.background : colors.light.background,
            },
            headerTintColor: settings.isDarkMode ? colors.dark.text : colors.light.text,
            drawerStyle: {
              width: width * 0.3, // 30% der Bildschirmbreite für große Geräte
              backgroundColor: settings.isDarkMode ? colors.dark.surface : colors.light.surface,
            },
            drawerLabelStyle: {
              fontSize: 16,
            },
            drawerActiveTintColor: colors.primary,
          }}
        >
          <Drawer.Screen name="MainContent" component={MainTabs} options={{ title: 'Dashboard' }} />
          <Drawer.Screen name="SmartGlass" component={SmartGlassScreen} options={{ title: 'Smart Glass' }} />
          <Drawer.Screen name="LearningPaths" component={LearningPathsScreen} options={{ title: 'Lernpfade' }} />
          <Drawer.Screen name="InteractiveStudio" component={InteractiveStudioScreen} options={{ title: 'Interaktives Studio' }} />
          <Drawer.Screen name="AccessibilitySettings" component={AccessibilitySettingsScreen} options={{ title: 'Barrierefreiheit' }} />
          <Drawer.Screen name="HelpDemo" component={HelpBubbleDemoScreen} options={{ title: 'Hilfe' }} />
        </Drawer.Navigator>
      );
    } else {
      return (
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerStyle: {
              backgroundColor: settings.isDarkMode ? colors.dark.background : colors.light.background,
            },
            headerTintColor: settings.isDarkMode ? colors.dark.text : colors.light.text,
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="SmartGlass" component={SmartGlassScreen} options={{ title: 'Smart Glass' }} />
          <Stack.Screen name="LearningPaths" component={LearningPathsScreen} options={{ title: 'Lernpfade' }} />
          <Stack.Screen name="InteractiveStudio" component={InteractiveStudioScreen} options={{ title: 'Interaktives Studio' }} />
          <Stack.Screen name="AccessibilitySettings" component={AccessibilitySettingsScreen} options={{ title: 'Barrierefreiheit' }} />
          <Stack.Screen name="HelpDemo" component={HelpBubbleDemoScreen} options={{ title: 'Hilfe' }} />
          <Stack.Screen name="LocalAI" component={LocalAIScreen} options={{ title: 'Lokale KI' }} /> {/* Added route */}
        </Stack.Navigator>
      );
    }
  };

  return (
    <SafeAreaProvider>
      <HelpProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
          <NavigationContainer>
            <StatusBar style={settings.isDarkMode ? 'light' : 'dark'} />
            {renderNavigator()}
          </NavigationContainer>
        </ErrorBoundary>
      </HelpProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#dc3545',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#343a40',
  },
  resetButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});