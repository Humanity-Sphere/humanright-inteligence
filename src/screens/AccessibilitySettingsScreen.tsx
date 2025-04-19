import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  PanResponder
} from 'react-native';

// Einfacher Slider für Demo-Zwecke
const SimpleSlider = ({ 
  minimumValue = 0, 
  maximumValue = 1, 
  value = 0.5, 
  step = 0.1, 
  onValueChange, 
  minimumTrackTintColor = '#4a86e8', 
  maximumTrackTintColor = '#d3d3d3', 
  thumbTintColor = '#4a86e8',
  style,
  accessibilityLabel
}) => {
  const [sliderValue, setSliderValue] = useState(value);
  
  const handlePress = (e) => {
    const width = 300; // Annahme für die Breite des Sliders
    const x = e.nativeEvent.locationX;
    const percentage = x / width;
    const newValue = minimumValue + percentage * (maximumValue - minimumValue);
    
    // Zu Step runden
    const roundedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.min(Math.max(roundedValue, minimumValue), maximumValue);
    
    setSliderValue(clampedValue);
    if (onValueChange) onValueChange(clampedValue);
  };
  
  return (
    <View style={[{ width: 300, height: 40 }, style]}>
      <View 
        style={{
          height: 4,
          backgroundColor: maximumTrackTintColor,
          borderRadius: 2,
          marginTop: 18
        }}
      >
        <View 
          style={{
            height: 4,
            width: `${((sliderValue - minimumValue) / (maximumValue - minimumValue)) * 100}%`,
            backgroundColor: minimumTrackTintColor,
            borderRadius: 2
          }}
        />
      </View>
      <TouchableOpacity
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: thumbTintColor,
          position: 'absolute',
          top: 12,
          left: `${((sliderValue - minimumValue) / (maximumValue - minimumValue)) * 100}%`,
          marginLeft: -8
        }}
        onPress={() => {}}
      />
      <View 
        style={{ 
          position: 'absolute', 
          left: 0, 
          right: 0, 
          top: 0, 
          bottom: 0 
        }}
        onTouchEnd={handlePress}
      />
    </View>
  );
};
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AccessibilityService, { 
  AccessibilitySettings, 
  AccessibilityLevel 
} from '../services/AccessibilityService';

const AccessibilitySettingsScreen = ({ navigation }: any) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    AccessibilityService.getSettings()
  );
  const [originalSettings, setOriginalSettings] = useState<AccessibilitySettings>(
    AccessibilityService.getSettings()
  );
  const [hasChanges, setHasChanges] = useState(false);
  
  // Einstellungsänderungen überwachen
  useEffect(() => {
    const handleSettingsChange = (newSettings: AccessibilitySettings) => {
      setSettings({ ...newSettings });
    };
    
    AccessibilityService.addSettingsChangeListener(handleSettingsChange);
    
    return () => {
      AccessibilityService.removeSettingsChangeListener(handleSettingsChange);
    };
  }, []);
  
  // Prüfen, ob Änderungen vorliegen
  useEffect(() => {
    const checkChanges = () => {
      const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(hasChanged);
    };
    
    checkChanges();
  }, [settings, originalSettings]);
  
  // Einstellung aktualisieren
  const updateSetting = async (name: keyof AccessibilitySettings, value: any) => {
    const updatedSettings = { ...settings, [name]: value };
    setSettings(updatedSettings);
    
    // Bei einigen Einstellungen sofort anwenden
    if (['fontScale', 'uiScale', 'highContrast', 'reduceMotion'].includes(name)) {
      await AccessibilityService.updateSettings({ [name]: value });
    }
  };
  
  // Voreinstellung auswählen
  const selectPreset = async (level: AccessibilityLevel) => {
    await AccessibilityService.performAction('set-preset', level);
    setSettings(AccessibilityService.getSettings());
  };
  
  // Änderungen speichern
  const saveChanges = async () => {
    try {
      await AccessibilityService.updateSettings(settings);
      setOriginalSettings({ ...settings });
      Alert.alert(
        'Einstellungen gespeichert',
        'Ihre Barrierefreiheitseinstellungen wurden erfolgreich gespeichert.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      Alert.alert(
        'Fehler',
        'Ihre Einstellungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Auf Standardeinstellungen zurücksetzen
  const resetToDefaults = async () => {
    Alert.alert(
      'Standardeinstellungen',
      'Möchten Sie wirklich alle Barrierefreiheitseinstellungen auf die Standardwerte zurücksetzen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Zurücksetzen', 
          style: 'destructive',
          onPress: async () => {
            await AccessibilityService.resetSettings();
            setSettings(AccessibilityService.getSettings());
            setOriginalSettings(AccessibilityService.getSettings());
          } 
        }
      ]
    );
  };
  
  /**
   * Rendert einen Abschnitt der Einstellungen
   */
  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
  
  /**
   * Rendert eine Schaltfläche für eine Voreinstellung
   */
  const renderPresetButton = (level: AccessibilityLevel, label: string, description: string, iconName: string) => (
    <TouchableOpacity
      style={[styles.presetButton, settings.level === level && styles.selectedPreset]}
      onPress={() => selectPreset(level)}
    >
      <Icon name={iconName} size={24} color={settings.level === level ? '#FFFFFF' : '#333333'} />
      <View style={styles.presetTextContainer}>
        <Text style={[
          styles.presetLabel, 
          settings.level === level && styles.selectedPresetText
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.presetDescription, 
          settings.level === level && styles.selectedPresetText,
          { fontSize: settings.fontScale > 1 ? 12 * settings.fontScale : 12 }
        ]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  /**
   * Rendert einen Schieberegler für numerische Einstellungen
   */
  const renderSlider = (
    label: string, 
    value: number, 
    onValueChange: (value: number) => void, 
    minimumValue: number = 0.7, 
    maximumValue: number = 2.0, 
    step: number = 0.1
  ) => (
    <View style={styles.sliderContainer}>
      <Text style={[styles.sliderLabel, { fontSize: settings.fontScale > 1 ? 16 * settings.fontScale : 16 }]}>
        {label}: {value.toFixed(1)}
      </Text>
      <SimpleSlider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#4a86e8"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#4a86e8"
        accessibilityLabel={label}
      />
    </View>
  );
  
  /**
   * Rendert einen Switch mit Label für boolesche Einstellungen
   */
  const renderSwitch = (
    label: string, 
    value: boolean, 
    onValueChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.switchContainer}>
      <View style={styles.switchTextContainer}>
        <Text style={[
          styles.switchLabel, 
          { fontSize: settings.fontScale > 1 ? 16 * settings.fontScale : 16 }
        ]}>
          {label}
        </Text>
        {description && (
          <Text style={[
            styles.switchDescription,
            { fontSize: settings.fontScale > 1 ? 12 * settings.fontScale : 12 }
          ]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        trackColor={{ false: "#767577", true: "#4a86e8" }}
        thumbColor={value ? "#ffffff" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={onValueChange}
        value={value}
        accessibilityLabel={label}
      />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (hasChanges) {
              Alert.alert(
                'Ungespeicherte Änderungen',
                'Sie haben Änderungen vorgenommen, die noch nicht gespeichert wurden. Möchten Sie die Änderungen speichern?',
                [
                  { text: 'Verwerfen', onPress: () => navigation.goBack() },
                  { text: 'Abbrechen', style: 'cancel' },
                  { text: 'Speichern', onPress: async () => {
                    await saveChanges();
                    navigation.goBack();
                  }}
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barrierefreiheit</Text>
        {hasChanges && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveChanges}
          >
            <Text style={styles.saveButtonText}>Speichern</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.content}>
        {/* Voreinstellungen */}
        {renderSection('Voreinstellungen', (
          <View style={styles.presetContainer}>
            {renderPresetButton(
              'none', 
              'Standard', 
              'Keine Anpassungen der Barrierefreiheit', 
              'format-font'
            )}
            {renderPresetButton(
              'low', 
              'Leicht', 
              'Etwas größere Schrift und Elemente', 
              'magnify-plus-outline'
            )}
            {renderPresetButton(
              'medium', 
              'Mittel', 
              'Größere Texte und Buttons mit verbesserter Lesbarkeit', 
              'magnify-plus'
            )}
            {renderPresetButton(
              'high', 
              'Stark', 
              'Hoher Kontrast und große Bedienelemente', 
              'contrast-box'
            )}
            {renderPresetButton(
              'very-high', 
              'Maximal', 
              'Maximale Anpassungen für beste Lesbarkeit und Bedienung', 
              'accessibility'
            )}
          </View>
        ))}
        
        {/* Größenanpassungen */}
        {renderSection('Größenanpassungen', (
          <View style={styles.sliderContainer}>
            {renderSlider(
              'Schriftgröße', 
              settings.fontScale, 
              (value) => updateSetting('fontScale', value)
            )}
            {renderSlider(
              'Elementgröße', 
              settings.uiScale, 
              (value) => updateSetting('uiScale', value)
            )}
          </View>
        ))}
        
        {/* Visuelle Anpassungen */}
        {renderSection('Visuelle Anpassungen', (
          <View>
            {renderSwitch(
              'Hoher Kontrast', 
              settings.highContrast, 
              (value) => updateSetting('highContrast', value),
              'Maximiert den Kontrast zwischen Text und Hintergrund'
            )}
            {renderSwitch(
              'Fetter Text', 
              settings.boldText, 
              (value) => updateSetting('boldText', value),
              'Macht Texte fetter und besser lesbar'
            )}
            {renderSwitch(
              'Größere Abstände', 
              settings.increaseSpacing, 
              (value) => updateSetting('increaseSpacing', value),
              'Erhöht Abstände zwischen Buchstaben und Zeilen'
            )}
            {renderSwitch(
              'Bewegungen reduzieren', 
              settings.reduceMotion, 
              (value) => updateSetting('reduceMotion', value),
              'Reduziert Animationen und Bewegungen in der App'
            )}
          </View>
        ))}
        
        {/* Farbsehen-Anpassungen */}
        {renderSection('Farbsehen-Anpassungen', (
          <View style={styles.colorBlindContainer}>
            <Text style={[
              styles.colorBlindLabel,
              { fontSize: settings.fontScale > 1 ? 16 * settings.fontScale : 16 }
            ]}>
              Modus für Farbfehlsichtigkeit
            </Text>
            <View style={styles.colorBlindOptions}>
              {[
                { value: 'none', label: 'Normal' },
                { value: 'protanopia', label: 'Protanopie' },
                { value: 'deuteranopia', label: 'Deuteranopie' },
                { value: 'tritanopia', label: 'Tritanopie' },
                { value: 'achromatopsia', label: 'Achromatopsie' }
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.colorBlindOption,
                    settings.colorBlindMode === option.value && styles.selectedColorBlindOption
                  ]}
                  onPress={() => updateSetting('colorBlindMode', option.value)}
                >
                  <Text style={[
                    styles.colorBlindOptionText,
                    settings.colorBlindMode === option.value && styles.selectedColorBlindOptionText,
                    { fontSize: settings.fontScale > 1 ? 14 * settings.fontScale : 14 }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        
        {/* Weitere Optionen */}
        {renderSection('Weitere Optionen', (
          <View>
            {renderSwitch(
              'Automatische Anpassung', 
              settings.autoAdjust, 
              (value) => updateSetting('autoAdjust', value),
              'Passt die App automatisch an das Gerät und die Systemeinstellungen an'
            )}
            {renderSwitch(
              'Tooltips anzeigen', 
              settings.tooltipsEnabled, 
              (value) => updateSetting('tooltipsEnabled', value),
              'Zeigt Hilfetexte bei längerem Drücken an'
            )}
            {renderSwitch(
              'Einfache Benutzeroberfläche', 
              settings.simplifiedInterface, 
              (value) => updateSetting('simplifiedInterface', value),
              'Reduziert die Komplexität der Benutzeroberfläche'
            )}
            {renderSwitch(
              'Haptisches Feedback', 
              settings.hapticFeedback, 
              (value) => updateSetting('hapticFeedback', value),
              'Vibriert leicht bei Berührungen und wichtigen Ereignissen'
            )}
          </View>
        ))}
        
        {/* Aktionsbuttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDefaults}
          >
            <Icon name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.resetButtonText}>Auf Standard zurücksetzen</Text>
          </TouchableOpacity>
        </View>
        
        {/* Hinweise */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Diese Einstellungen helfen Ihnen, die App an Ihre Bedürfnisse anzupassen. Sie können 
            jederzeit über das Profil-Menü auf diese Einstellungen zugreifen.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a86e8',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 16
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4
  },
  saveButtonText: {
    color: '#4a86e8',
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#f0f4f8',
    color: '#333333'
  },
  sectionContent: {
    padding: 16
  },
  presetContainer: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 8
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center', 
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  selectedPreset: {
    backgroundColor: '#4a86e8',
    borderColor: '#3a76d8'
  },
  presetTextContainer: {
    marginLeft: 12,
    flex: 1
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333'
  },
  presetDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2
  },
  selectedPresetText: {
    color: '#FFFFFF'
  },
  sliderContainer: {
    marginBottom: 16
  },
  sliderLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8
  },
  slider: {
    width: '100%',
    height: 40
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 16
  },
  switchLabel: {
    fontSize: 16,
    color: '#333333'
  },
  switchDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2
  },
  colorBlindContainer: {
    marginVertical: 8
  },
  colorBlindLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 12
  },
  colorBlindOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  colorBlindOption: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minWidth: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  selectedColorBlindOption: {
    backgroundColor: '#4a86e8',
    borderColor: '#3a76d8'
  },
  colorBlindOptionText: {
    fontSize: 14,
    color: '#333333'
  },
  selectedColorBlindOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  actionButtons: {
    marginVertical: 24,
    alignItems: 'center'
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  resetButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8
  },
  footer: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 32
  },
  footerText: {
    fontSize: 14,
    color: '#0d47a1',
    lineHeight: 20
  }
});

export default AccessibilitySettingsScreen;