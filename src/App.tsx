import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { HelpProvider } from './contexts/HelpContext';

// Screens
import HomeScreen from './screens/HomeScreen';
import JournalScreen from './screens/JournalScreen';
import DocumentAnalysisScreen from './screens/DocumentAnalysisScreen';
import EvidenceCollectionScreen from './screens/EvidenceCollectionScreen';
import SmartGlassScreen from './screens/SmartGlassScreen';
import LearningPathsScreen from './screens/LearningPathsScreen';
import InteractiveStudioScreen from './screens/InteractiveStudioScreen';
import AccessibilitySettingsScreen from './screens/AccessibilitySettingsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <HelpProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Stack.Navigator initialRouteName="Home">
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ title: 'Startseite' }} 
              />
              <Stack.Screen 
                name="Journal" 
                component={JournalScreen} 
                options={{ title: 'Mein Journal' }} 
              />
              <Stack.Screen 
                name="DocumentAnalysis" 
                component={DocumentAnalysisScreen} 
                options={{ title: 'Dokumente analysieren' }} 
              />
              <Stack.Screen 
                name="Evidence" 
                component={EvidenceCollectionScreen} 
                options={{ title: 'Beweise sammeln' }} 
              />
              <Stack.Screen 
                name="SmartGlass" 
                component={SmartGlassScreen} 
                options={{ title: 'Smart Glass' }} 
              />
              <Stack.Screen 
                name="LearningPaths" 
                component={LearningPathsScreen} 
                options={{ title: 'Lernpfade' }} 
              />
              <Stack.Screen 
                name="InteractiveStudio" 
                component={InteractiveStudioScreen} 
                options={{ title: 'Interaktives Studio' }} 
              />
              <Stack.Screen 
                name="AccessibilitySettings" 
                component={AccessibilitySettingsScreen} 
                options={{ title: 'Barrierefreiheit' }} 
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ title: 'Profil' }} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </HelpProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}