import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Komponente für Einstellungsoptionen
const SettingsOption = ({ 
  title, 
  description, 
  showToggle = false, 
  isEnabled = false, 
  onToggle,
  onPress,
}: {
  title: string;
  description?: string;
  showToggle?: boolean;
  isEnabled?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity 
      style={styles.settingsOption}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingsDescription}>{description}</Text>
        )}
      </View>
      {showToggle && onToggle && (
        <Switch
          trackColor={{ false: '#ccc', true: '#81b0ff' }}
          thumbColor={isEnabled ? '#4a86e8' : '#f4f3f4'}
          onValueChange={onToggle}
          value={isEnabled}
        />
      )}
    </TouchableOpacity>
  );
};

// Komponente für Profilaktionen
const ProfileAction = ({ title, icon, onPress }: {
  title: string;
  icon: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity 
      style={styles.profileAction}
      onPress={onPress}
    >
      <Image
        source={{ uri: icon }}
        style={styles.actionIcon}
      />
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

const ProfileScreen = () => {
  // Zustand für Einstellungen
  const [offlineMode, setOfflineMode] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  // Profilaktionen
  const profileActions = [
    {
      id: 'learning',
      title: 'Lernfortschritt',
      icon: 'https://img.icons8.com/fluency/96/000000/graduation-cap.png',
      onPress: () => Alert.alert('Lernfortschritt', 'Hier werden Ihre Lernfortschritte angezeigt.')
    },
    {
      id: 'security',
      title: 'Sicherheit',
      icon: 'https://img.icons8.com/fluency/96/000000/security-shield-green.png',
      onPress: () => Alert.alert('Sicherheit', 'Hier können Sie Sicherheitseinstellungen anpassen.')
    },
    {
      id: 'data',
      title: 'Daten & Speicher',
      icon: 'https://img.icons8.com/fluency/96/000000/database.png',
      onPress: () => Alert.alert('Daten & Speicher', 'Hier werden Informationen zum Speicherverbrauch angezeigt.')
    },
    {
      id: 'help',
      title: 'Hilfe',
      icon: 'https://img.icons8.com/fluency/96/000000/help.png',
      onPress: () => Alert.alert('Hilfe', 'Hier finden Sie Hilfe und Support.')
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>
            Verwalten Sie Ihre Einstellungen und Ihren Fortschritt
          </Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: 'https://img.icons8.com/fluency/96/000000/user-circle.png' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Beispielnutzer</Text>
              <Text style={styles.profileEmail}>beispiel@menschenrechte.org</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Bearbeiten', 'Hier können Sie Ihr Profil bearbeiten.')}>
            <Text style={styles.editButtonText}>Bearbeiten</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          {profileActions.map((action) => (
            <ProfileAction
              key={action.id}
              title={action.title}
              icon={action.icon}
              onPress={action.onPress}
            />
          ))}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App-Einstellungen</Text>
          
          <SettingsOption
            title="Offline-Modus"
            description="Daten werden lokal gespeichert und bei Internetverbindung synchronisiert"
            showToggle
            isEnabled={offlineMode}
            onToggle={setOfflineMode}
          />
          
          <SettingsOption
            title="Dunkler Modus"
            description="Dunkles Farbschema für bessere Lesbarkeit bei schlechten Lichtverhältnissen"
            showToggle
            isEnabled={darkMode}
            onToggle={setDarkMode}
          />
          
          <SettingsOption
            title="Benachrichtigungen"
            description="Erhalten Sie Updates zu Ihren Lernpfaden und wichtigen Änderungen"
            showToggle
            isEnabled={notifications}
            onToggle={setNotifications}
          />
          
          <SettingsOption
            title="Biometrische Authentifizierung"
            description="Verwenden Sie Fingerabdruck oder Gesichtserkennung zum Entsperren der App"
            showToggle
            isEnabled={biometricAuth}
            onToggle={setBiometricAuth}
          />
          
          <SettingsOption
            title="Sprache"
            description="Deutsch"
            onPress={() => Alert.alert('Sprache', 'Hier können Sie die Sprache ändern.')}
          />
          
          <SettingsOption
            title="Datenschutz und Sicherheit"
            onPress={() => Alert.alert('Datenschutz', 'Hier können Sie Datenschutzeinstellungen anpassen.')}
          />
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Über die App</Text>
          <Text style={styles.aboutText}>
            Die Menschenrechtsverteidiger App unterstützt Menschenrechtsverteidiger bei ihrer täglichen Arbeit mit KI-gestützten Tools.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          
          <TouchableOpacity 
            style={styles.feedbackButton}
            onPress={() => Alert.alert('Feedback', 'Hier können Sie Feedback geben.')}
          >
            <Text style={styles.feedbackButtonText}>Feedback geben</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4f8',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#4a86e8',
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  profileAction: {
    width: '50%',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingsDescription: {
    fontSize: 12,
    color: '#666',
  },
  aboutSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 32,
  },
  aboutText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  feedbackButton: {
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#4a86e8',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProfileScreen;