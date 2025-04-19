import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  SafeAreaView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HelpBubble from '../components/HelpBubble';
import { HelpProvider, defaultHelpItems, defaultTours } from '../contexts/HelpContext';
import AccessibilityWrapper from '../components/AccessibilityWrapper';

const HelpBubbleDemoScreen = ({ navigation }: any) => {
  const [activeDemo, setActiveDemo] = useState<string>('simple');
  const [interactiveMode, setInteractiveMode] = useState<boolean>(false);
  const [demoPosition, setDemoPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [demoVariant, setDemoVariant] = useState<'info' | 'tip' | 'warning' | 'important'>('info');
  const [manualVisible, setManualVisible] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<{ current: number; total: number }>({ current: 1, total: 3 });
  
  const handleNextStep = () => {
    if (tourStep.current < tourStep.total) {
      setTourStep(prev => ({ ...prev, current: prev.current + 1 }));
    }
  };
  
  const handlePrevStep = () => {
    if (tourStep.current > 1) {
      setTourStep(prev => ({ ...prev, current: prev.current - 1 }));
    }
  };
  
  return (
    <HelpProvider helpItems={defaultHelpItems} tours={defaultTours}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hilfeblase Demo</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Demonstration Einstellungen</Text>
              <HelpBubble
                title="Hilfeblase konfigurieren"
                content="Hier können Sie verschiedene Einstellungen für die Hilfeblasen anpassen, um zu sehen, wie sie sich verhalten."
                position="left"
                variant="tip"
                isVisible={false}
              />
            </View>
            
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Demo Typ</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={activeDemo}
                    onValueChange={itemValue => setActiveDemo(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Einfache Hilfeblase" value="simple" />
                    <Picker.Item label="Interaktive Hilfeblase" value="interactive" />
                    <Picker.Item label="Tour-Modus" value="tour" />
                    <Picker.Item label="Manuell gesteuert" value="manual" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Position</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={demoPosition}
                    onValueChange={itemValue => setDemoPosition(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Oben" value="top" />
                    <Picker.Item label="Unten" value="bottom" />
                    <Picker.Item label="Links" value="left" />
                    <Picker.Item label="Rechts" value="right" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Variante</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={demoVariant}
                    onValueChange={itemValue => setDemoVariant(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Info" value="info" />
                    <Picker.Item label="Tipp" value="tip" />
                    <Picker.Item label="Warnung" value="warning" />
                    <Picker.Item label="Wichtig" value="important" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.switchContainer}>
                <Switch
                  value={interactiveMode}
                  onValueChange={setInteractiveMode}
                />
                <Text style={styles.switchLabel}>Mikro-Interaktionen aktivieren</Text>
                
                <HelpBubble
                  title="Was sind Mikro-Interaktionen?"
                  content="Mikro-Interaktionen sind subtile Animationen und visuelle Effekte, die die Aufmerksamkeit lenken und das Benutzererlebnis verbessern."
                  position="bottom"
                  variant="info"
                  isVisible={false}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Beispiel Vorschau</Text>
              <Text style={styles.sectionDescription}>
                Interagieren Sie mit den Elementen, um die Hilfeblasen zu sehen
              </Text>
            </View>
            
            <View style={styles.previewContainer}>
              {activeDemo === 'simple' && (
                <View style={styles.demoContainer}>
                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.demoButtonText}>Hilfe anzeigen</Text>
                  </TouchableOpacity>
                  
                  <HelpBubble
                    title="Einfache Hilfeblase"
                    content="Dies ist ein Beispiel für eine einfache Hilfeblase. Sie können mit dem Mauszeiger über diesen Button fahren oder darauf klicken, um die Hilfeblase anzuzeigen."
                    position={demoPosition}
                    variant={demoVariant}
                    isVisible={true}
                    microInteractions={interactiveMode}
                  />
                </View>
              )}
              
              {activeDemo === 'interactive' && (
                <View style={styles.demoContainer}>
                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.demoButtonText}>Interaktive Hilfe</Text>
                  </TouchableOpacity>
                  
                  <HelpBubble
                    title="Interaktive Hilfeblase"
                    content="Diese Hilfeblase enthält Aktionen, die Sie ausführen können. Klicken Sie auf eine der Schaltflächen unten."
                    position={demoPosition}
                    variant={demoVariant}
                    isVisible={true}
                    microInteractions={interactiveMode}
                    actions={[
                      { 
                        label: 'Mehr Info', 
                        onPress: () => alert('Sie haben "Mehr Info" ausgewählt')
                      },
                      { 
                        label: 'Schließen', 
                        onPress: () => console.log('Hilfeblase geschlossen')
                      }
                    ]}
                  />
                </View>
              )}
              
              {activeDemo === 'tour' && (
                <View style={styles.demoContainer}>
                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.demoButtonText}>Tour Anzeigen</Text>
                  </TouchableOpacity>
                  
                  <HelpBubble
                    title={`Schritt ${tourStep.current}: Tour Beispiel`}
                    content={
                      tourStep.current === 1 
                        ? "Dies ist der erste Schritt der Tour. Tippen Sie auf 'Weiter', um fortzufahren."
                        : tourStep.current === 2
                          ? "Dies ist der zweite Schritt. Sie können mit den Schaltflächen unten navigieren."
                          : "Dies ist der letzte Schritt der Tour. Tippen Sie auf 'Fertig', um die Tour zu beenden."
                    }
                    position={demoPosition}
                    variant={demoVariant}
                    isVisible={true}
                    microInteractions={interactiveMode}
                    tourStep={tourStep}
                    onNextStep={handleNextStep}
                    onPrevStep={handlePrevStep}
                  />
                </View>
              )}
              
              {activeDemo === 'manual' && (
                <View style={styles.demoContainer}>
                  <View style={styles.targetArea}>
                    <Text>Zielbereich</Text>
                  </View>
                  
                  <HelpBubble
                    title="Manuell gesteuerte Hilfeblase"
                    content="Diese Hilfeblase wird manuell über die Schaltflächen unten gesteuert."
                    position={demoPosition}
                    variant={demoVariant}
                    isVisible={manualVisible}
                    microInteractions={interactiveMode}
                    onClose={() => setManualVisible(false)}
                  />
                  
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity 
                      style={[styles.button, styles.buttonOutline]} 
                      onPress={() => setManualVisible(true)}
                    >
                      <Text style={styles.buttonOutlineText}>Anzeigen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.button, styles.buttonOutline]} 
                      onPress={() => setManualVisible(false)}
                    >
                      <Text style={styles.buttonOutlineText}>Ausblenden</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Praktisches Beispiel</Text>
              <Text style={styles.sectionDescription}>
                Beispiel für Hilfeblasen in einer Formularumgebung
              </Text>
            </View>
            
            <View style={styles.sectionContent}>
              <View style={styles.formExample}>
                <View style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Name</Text>
                    <TouchableOpacity>
                      <HelpBubble
                        content="Geben Sie Ihren vollständigen Namen ein."
                        position="top"
                        variant="info"
                        isVisible={false}
                      />
                      <Text style={styles.helpIcon}>(?)</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput 
                    style={styles.input}
                    placeholder="Max Mustermann"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>E-Mail</Text>
                    <TouchableOpacity>
                      <HelpBubble
                        title="E-Mail Adresse"
                        content="Ihre E-Mail wird für wichtige Benachrichtigungen verwendet und niemals an Dritte weitergegeben."
                        position="top"
                        variant="important"
                        isVisible={false}
                      />
                      <Text style={styles.helpIcon}>(?)</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput 
                    style={styles.input}
                    placeholder="max.mustermann@beispiel.de"
                    keyboardType="email-address"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Dokumenttyp</Text>
                    <TouchableOpacity>
                      <HelpBubble
                        title="Dokumenttyp auswählen"
                        content="Der Dokumenttyp bestimmt, welche Analyse-Algorithmen angewendet werden. Wählen Sie den passendsten Typ für Ihr Dokument."
                        position="right"
                        variant="tip"
                        isVisible={false}
                      />
                      <Text style={styles.helpIcon}>(?)</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue="report"
                      style={styles.picker}
                    >
                      <Picker.Item label="Bericht" value="report" />
                      <Picker.Item label="Juristisches Dokument" value="legal" />
                      <Picker.Item label="Zeugenaussage" value="testimony" />
                      <Picker.Item label="Nachrichtenartikel" value="news" />
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.switchContainer}>
                  <Switch value={false} />
                  <View style={styles.labelContainer}>
                    <Text style={styles.switchLabel}>Ich stimme der Datenverarbeitung zu</Text>
                    <TouchableOpacity>
                      <HelpBubble
                        title="Wichtiger Hinweis"
                        content="Ihre Daten werden gemäß unserer Datenschutzrichtlinie verarbeitet. Dies ist notwendig, um die Analyse durchführen zu können."
                        position="bottom"
                        variant="warning"
                        isVisible={false}
                      />
                      <Text style={[styles.helpIcon, styles.warningIcon]}>(!)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>Formular absenden</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </HelpProvider>
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
    padding: 16
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
  sectionHeader: {
    padding: 16,
    backgroundColor: '#f0f4f8'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333'
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4
  },
  sectionContent: {
    padding: 16
  },
  formGroup: {
    marginBottom: 16
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginRight: 8
  },
  helpIcon: {
    fontSize: 14,
    color: '#666666'
  },
  warningIcon: {
    color: '#f97316'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden'
  },
  picker: {
    height: 50,
    width: '100%'
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12
  },
  switchLabel: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12
  },
  previewContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200
  },
  demoContainer: {
    alignItems: 'center'
  },
  demoButton: {
    backgroundColor: '#4a86e8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  },
  targetArea: {
    width: 150,
    height: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 16
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 4
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#4a86e8',
    backgroundColor: 'transparent'
  },
  buttonOutlineText: {
    color: '#4a86e8',
    fontWeight: '500'
  },
  formExample: {
    width: '100%'
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#4a86e8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  }
});

export default HelpBubbleDemoScreen;