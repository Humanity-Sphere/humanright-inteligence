import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, fontSize, spacing, wp, getDeviceType, useDimensions } from '../services/ResponsiveService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  isDarkMode: boolean;
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
}

const AccessibilityControls = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    isDarkMode: false,
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
  });

  const { isPhone } = useDimensions();

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

  const saveSettings = async (newSettings: AccessibilitySettings) => {
    try {
      setSettings(newSettings);
      await AsyncStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
    }
  };

  const handleSettingChange = (setting: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...settings, [setting]: value };
    saveSettings(newSettings);
  };

  return (
    <ScrollView style={[
      styles.container, 
      { backgroundColor: settings.isDarkMode ? colors.dark.background : colors.light.background }
    ]}>
      <Text style={[
        styles.title, 
        { 
          color: settings.isDarkMode ? colors.dark.text : colors.light.text,
          fontSize: isPhone ? fontSize.large : fontSize.xlarge 
        }
      ]}>
        Barrierefreiheit
      </Text>

      <View style={styles.settingItem}>
        <Text style={[
          styles.settingLabel, 
          { color: settings.isDarkMode ? colors.dark.text : colors.light.text }
        ]}>
          Dunkler Modus
        </Text>
        <Switch
          value={settings.isDarkMode}
          onValueChange={(value) => handleSettingChange('isDarkMode', value)}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor="#f4f3f4"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={[
          styles.settingLabel,
          { color: settings.isDarkMode ? colors.dark.text : colors.light.text }
        ]}>
          Schriftgröße
        </Text>
        <View style={styles.sliderContainer}>
          <Text style={[
            styles.sliderLabel,
            { color: settings.isDarkMode ? colors.dark.text : colors.light.text }
          ]}>
            A
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={80}
            maximumValue={150}
            step={10}
            value={settings.fontSize}
            onValueChange={(value) => handleSettingChange('fontSize', value)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor="#000000"
            thumbTintColor={colors.primary}
          />
          <Text style={[
            styles.sliderLabelLarge,
            { color: settings.isDarkMode ? colors.dark.text : colors.light.text }
          ]}>
            A
          </Text>
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={[
          styles.settingLabel,
          { color: settings.isDarkMode ? colors.dark.text : colors.light.text }
        ]}>
          Hoher Kontrast
        </Text>
        <Switch
          value={settings.highContrast}
          onValueChange={(value) => handleSettingChange('highContrast', value)}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor="#f4f3f4"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={[
          styles.settingLabel,
          { color: settings.isDarkMode ? colors.dark.text : colors.light.text }
        ]}>
          Reduzierte Animation
        </Text>
        <Switch
          value={settings.reducedMotion}
          onValueChange={(value) => handleSettingChange('reducedMotion', value)}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor="#f4f3f4"
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={[
          styles.infoText,
          { color: settings.isDarkMode ? colors.dark.text : colors.light.text }
        ]}>
          Diese Einstellungen helfen Ihnen, die App an Ihre Bedürfnisse anzupassen. Änderungen werden automatisch gespeichert und auf alle Bereiche der App angewendet.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.medium,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: spacing.large,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: fontSize.medium,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp(50),
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: fontSize.small,
    marginRight: spacing.xs,
  },
  sliderLabelLarge: {
    fontSize: fontSize.large,
    marginLeft: spacing.xs,
  },
  infoBox: {
    marginTop: spacing.large,
    padding: spacing.medium,
    backgroundColor: 'rgba(93, 92, 222, 0.1)',
    borderRadius: 8,
  },
  infoText: {
    fontSize: fontSize.small,
  },
});

export default AccessibilityControls;