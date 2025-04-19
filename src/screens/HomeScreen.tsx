import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import AccessibilityWrapper from '../components/AccessibilityWrapper';
import { 
  useDimensions,
  colors, 
  fontSize, 
  spacing, 
  wp, 
  hp
} from '../services/ResponsiveService';

interface AccessibilitySettings {
  isDarkMode: boolean;
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface FeatureItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  screenName: string;
}

const HomeScreen = ({ navigation }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    isDarkMode: false,
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
  });

  const { width, isPhone, isTablet } = useDimensions();

  // Features für die App
  const features: FeatureItem[] = [
    {
      id: '1',
      title: 'Mein Journal',
      icon: 'journal',
      description: 'Sicher und privat Notizen und Beobachtungen festhalten',
      screenName: 'Journal'
    },
    {
      id: '2',
      title: 'Dokumente analysieren',
      icon: 'document-text',
      description: 'KI-gestützte Analyse von Dokumenten und Beweismitteln',
      screenName: 'Dokumente'
    },
    {
      id: '3',
      title: 'Beweise sammeln',
      icon: 'folder',
      description: 'Organisieren und katalogisieren Sie wichtige Beweisunterlagen',
      screenName: 'Beweise'
    },
    {
      id: '4',
      title: 'Smart Glass',
      icon: 'glasses',
      description: 'Unterstützung für Smart Glass Geräte',
      screenName: 'SmartGlass'
    },
    {
      id: '5',
      title: 'Lernpfade',
      icon: 'school',
      description: 'Bildungsmaterialien und Leitfäden',
      screenName: 'LearningPaths'
    },
    {
      id: '6',
      title: 'Interaktives Studio',
      icon: 'color-palette',
      description: 'Erweiterte Werkzeuge zur Erstellung von Inhalten',
      screenName: 'InteractiveStudio'
    },
    {
      id: '7',
      title: 'Lokale KI',
      icon: 'cpu',
      description: 'Lokale KI-Modelle verwenden',
      screenName: 'LocalAI' // Assuming 'LocalAI' screen exists
    },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

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

  // Berechnung der Spaltenanzahl basierend auf Bildschirmbreite
  const getNumColumns = () => {
    if (width < 600) return 1;
    if (width < 900) return 2;
    return 3;
  };

  const renderFeatureCard = ({ item }: { item: FeatureItem }) => (
    <TouchableOpacity
      style={[
        styles.featureCard,
        {
          backgroundColor: settings.isDarkMode ? colors.dark.surface : colors.light.surface,
          width: isPhone ? '100%' : (isTablet ? wp(44) : wp(30)),
          height: isPhone ? hp(20) : hp(25),
          margin: isPhone ? spacing.small : spacing.medium
        }
      ]}
      onPress={() => navigation.navigate(item.screenName)}
    >
      <Ionicons
        name={item.icon}
        size={isPhone ? 36 : 48}
        color={colors.primary}
      />
      <Text
        style={[
          styles.featureTitle,
          {
            color: settings.isDarkMode ? colors.dark.text : colors.light.text,
            fontSize: isPhone ? fontSize.medium : fontSize.large,
            marginTop: spacing.small
          }
        ]}
      >
        {item.title}
      </Text>
      <Text
        style={[
          styles.featureDescription,
          {
            color: settings.isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            fontSize: isPhone ? fontSize.small : fontSize.medium
          }
        ]}
      >
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <AccessibilityWrapper isDarkMode={settings.isDarkMode}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={{
              width: isPhone ? 40 : 60,
              height: isPhone ? 40 : 60,
              marginRight: spacing.small
            }}
          />
          <Text 
            style={[
              styles.title, 
              { 
                color: settings.isDarkMode ? colors.dark.text : colors.light.text,
                fontSize: isPhone ? fontSize.large : fontSize.xlarge
              }
            ]}
          >
            Human Rights Intelligence
          </Text>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('AccessibilitySettings')}
        >
          <Ionicons
            name="settings-outline"
            size={isPhone ? 24 : 28}
            color={settings.isDarkMode ? colors.dark.text : colors.light.text}
          />
        </TouchableOpacity>
      </View>

      <Text 
        style={[
          styles.subtitle, 
          { 
            color: settings.isDarkMode ? colors.dark.text : colors.light.text,
            fontSize: isPhone ? fontSize.medium : fontSize.large
          }
        ]}
      >
        Willkommen zur mobilen Menschenrechtsverteidiger-App
      </Text>

      <FlatList
        data={features}
        renderItem={renderFeatureCard}
        keyExtractor={(item) => item.id}
        numColumns={getNumColumns()}
        key={getNumColumns().toString()}
        contentContainerStyle={styles.featuresContainer}
      />

      <View 
        style={[
          styles.infoBox, 
          { 
            backgroundColor: settings.isDarkMode ? 'rgba(93, 92, 222, 0.2)' : 'rgba(93, 92, 222, 0.1)',
            padding: isPhone ? spacing.medium : spacing.large
          }
        ]}
      >
        <Text 
          style={[
            styles.infoText, 
            { 
              color: settings.isDarkMode ? colors.dark.text : colors.light.text,
              fontSize: isPhone ? fontSize.small : fontSize.medium
            }
          ]}
        >
          Diese App wurde entwickelt, um Menschenrechtsverteidiger bei ihrer wichtigen Arbeit zu unterstützen. 
          Sie funktioniert auch offline und bietet Tools für Dokumentation, Analyse und den Schutz sensibler Informationen.
        </Text>
      </View>
    </AccessibilityWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: spacing.large,
  },
  settingsButton: {
    padding: spacing.small,
  },
  featuresContainer: {
    alignItems: 'center',
    paddingBottom: spacing.medium,
  },
  featureCard: {
    borderRadius: 12,
    padding: spacing.medium,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  featureDescription: {
    textAlign: 'center',
    marginTop: spacing.small,
  },
  infoBox: {
    borderRadius: 8,
    marginTop: spacing.medium,
    marginBottom: spacing.large,
  },
  infoText: {
    textAlign: 'center',
  },
});

export default HomeScreen;