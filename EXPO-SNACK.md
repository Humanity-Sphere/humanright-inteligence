# Testen der App mit Expo Snack (ohne Installation)

Expo Snack ist ein Online-Editor für React Native, mit dem Sie die App direkt im Browser oder auf Ihrem Mobilgerät testen können.

## So testen Sie die App mit Expo Snack:

1. Besuchen Sie [Expo Snack](https://snack.expo.dev/) im Browser

2. Kopieren Sie den folgenden Code in den Editor:

```jsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Switch, TextInput } from 'react-native';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([
    { id: 1, text: 'Dokument zu Menschenrechtsverletzung erfasst', date: '31.03.2025' },
    { id: 2, text: 'Interview mit Zeugen geplant', date: '01.04.2025' },
  ]);

  const addNote = () => {
    if (note.trim() !== '') {
      const today = new Date();
      const dateStr = today.toLocaleDateString('de-DE');
      setNotes([...notes, { id: Date.now(), text: note, date: dateStr }]);
      setNote('');
    }
  };

  const theme = darkMode ? darkStyles : lightStyles;

  return (
    <ScrollView style={[styles.container, theme.background]}>
      <Text style={[styles.header, theme.text, { fontSize: fontSize * 1.5 }]}>
        Human Rights Intelligence
      </Text>
      
      <View style={styles.card}>
        <Text style={[styles.title, theme.text, { fontSize: fontSize * 1.2 }]}>
          Accessibility-Einstellungen
        </Text>
        <View style={styles.setting}>
          <Text style={[styles.label, theme.text, { fontSize }]}>Dunkelmodus</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#767577', true: '#3E64FF' }}
          />
        </View>
        <View style={styles.setting}>
          <Text style={[styles.label, theme.text, { fontSize }]}>Hoher Kontrast</Text>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            trackColor={{ false: '#767577', true: '#3E64FF' }}
          />
        </View>
        <View style={styles.setting}>
          <Text style={[styles.label, theme.text, { fontSize }]}>Schriftgröße: {fontSize}</Text>
          <View style={styles.row}>
            <Button title="-" onPress={() => setFontSize(Math.max(12, fontSize - 2))} />
            <View style={styles.spacer} />
            <Button title="+" onPress={() => setFontSize(Math.min(24, fontSize + 2))} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.title, theme.text, { fontSize: fontSize * 1.2 }]}>
          Notizen
        </Text>
        <TextInput
          style={[styles.input, theme.input, { fontSize }]}
          value={note}
          onChangeText={setNote}
          placeholder="Neue Notiz hinzufügen..."
          placeholderTextColor={darkMode ? '#aaa' : '#777'}
        />
        <Button title="Hinzufügen" onPress={addNote} color="#3E64FF" />
        
        <View style={styles.notesList}>
          {notes.map((item) => (
            <View key={item.id} style={[styles.noteItem, theme.noteItem]}>
              <Text style={[styles.noteText, theme.text, { fontSize }]}>{item.text}</Text>
              <Text style={[styles.noteDate, theme.subtext, { fontSize: fontSize * 0.8 }]}>{item.date}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.title, theme.text, { fontSize: fontSize * 1.2 }]}>
          Verfügbare Funktionen
        </Text>
        <View style={styles.featureList}>
          <View style={styles.feature}>
            <Text style={[styles.featureText, theme.text, { fontSize }]}>• Dokumentenanalyse</Text>
          </View>
          <View style={styles.feature}>
            <Text style={[styles.featureText, theme.text, { fontSize }]}>• Rechtliche Unterstützung</Text>
          </View>
          <View style={styles.feature}>
            <Text style={[styles.featureText, theme.text, { fontSize }]}>• Bildungsmaterialien</Text>
          </View>
          <View style={styles.feature}>
            <Text style={[styles.featureText, theme.text, { fontSize }]}>• Kampagnenplanung</Text>
          </View>
          <View style={styles.feature}>
            <Text style={[styles.featureText, theme.text, { fontSize }]}>• Smart-Glass-Integration</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, theme.subtext, { fontSize: fontSize * 0.8 }]}>
          Human Rights Intelligence App - Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 15,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  spacer: {
    width: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  notesList: {
    marginTop: 15,
  },
  noteItem: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  noteText: {
    marginBottom: 5,
  },
  noteDate: {
    textAlign: 'right',
    fontStyle: 'italic',
  },
  featureList: {
    marginTop: 5,
  },
  feature: {
    marginBottom: 10,
  },
  featureText: {
    lineHeight: 22,
  },
  footer: {
    marginTop: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
});

const lightStyles = {
  background: {
    backgroundColor: '#f5f5f5',
  },
  text: {
    color: '#333',
  },
  subtext: {
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  noteItem: {
    backgroundColor: '#f9f9f9',
  },
};

const darkStyles = {
  background: {
    backgroundColor: '#222',
  },
  text: {
    color: '#fff',
  },
  subtext: {
    color: '#ccc',
  },
  input: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: '#fff',
  },
  noteItem: {
    backgroundColor: '#333',
  },
};

export default App;
```

3. Klicken Sie auf "My Device" auf der rechten Seite

4. Scannen Sie den QR-Code mit Ihrem Mobiltelefon (Sie benötigen die Expo Go App, die Sie im App Store oder Play Store herunterladen können)

## Funktionen der Demo-App:

Diese vereinfachte Version der App zeigt folgende Features:

- Accessibility-Einstellungen (Dunkelmodus, Kontrast, Schriftgröße)
- Notizfunktion mit Speicherung
- Übersicht der verfügbaren Funktionen

Es ist eine vereinfachte Version, die ohne Backend läuft und auf jedem Gerät funktioniert. Sie bietet einen guten Eindruck der mobilen Oberfläche und der Accessibility-Funktionen.

## Vorteile von Expo Snack:

- Keine Installation erforderlich
- Sofortiges Testen auf Ihrem Gerät möglich
- Änderungen sind sofort sichtbar
- Funktioniert auf iOS und Android