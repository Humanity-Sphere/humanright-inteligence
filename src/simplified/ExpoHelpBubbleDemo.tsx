import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HelpBubble from '../components/HelpBubble';
import { HelpProvider, defaultHelpItems, defaultTours } from '../contexts/HelpContext';

const variants = ['info', 'tip', 'warning', 'important'];
const positions = ['top', 'bottom', 'left', 'right'];

const ExpoHelpBubbleDemo = ({ navigation }: any) => {
  const [demoPosition, setDemoPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [demoVariant, setDemoVariant] = useState<'info' | 'tip' | 'warning' | 'important'>('info');
  const [interactiveMode, setInteractiveMode] = useState<boolean>(false);
  const [showSimpleHelp, setShowSimpleHelp] = useState<boolean>(true);
  const [showInteractiveHelp, setShowInteractiveHelp] = useState<boolean>(false);
  const [showTourHelp, setShowTourHelp] = useState<boolean>(false);
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

  const nextPosition = () => {
    const currentIndex = positions.indexOf(demoPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setDemoPosition(positions[nextIndex] as any);
  };

  const nextVariant = () => {
    const currentIndex = variants.indexOf(demoVariant);
    const nextIndex = (currentIndex + 1) % variants.length;
    setDemoVariant(variants[nextIndex] as any);
  };
  
  return (
    <HelpProvider helpItems={defaultHelpItems} tours={defaultTours}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack ? navigation.goBack() : null}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expo Hilfeblase Demo</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Einstellungen</Text>
            </View>
            
            <View style={styles.sectionContent}>
              <View style={styles.controlRow}>
                <Text style={styles.label}>Position:</Text>
                <View style={styles.controlValue}>
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={nextPosition}
                  >
                    <Text style={styles.buttonText}>{demoPosition}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.controlRow}>
                <Text style={styles.label}>Variante:</Text>
                <View style={styles.controlValue}>
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={nextVariant}
                  >
                    <Text style={styles.buttonText}>{demoVariant}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Mikro-Interaktionen:</Text>
                <Switch
                  value={interactiveMode}
                  onValueChange={setInteractiveMode}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Beispiel Vorschau</Text>
            </View>
            
            <View style={styles.previewContainer}>
              {/* Einfache Hilfeblase */}
              <View style={styles.demoContainer}>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => setShowSimpleHelp(!showSimpleHelp)}
                >
                  <Text style={styles.demoButtonText}>Einfache Hilfeblase</Text>
                </TouchableOpacity>
                
                <HelpBubble
                  title="Einfache Hilfeblase"
                  content="Dies ist ein Beispiel für eine einfache Hilfeblase. Sie können auf den Button klicken, um die Hilfeblase anzuzeigen oder auszublenden."
                  position={demoPosition}
                  variant={demoVariant}
                  isVisible={showSimpleHelp}
                  microInteractions={interactiveMode}
                  onClose={() => setShowSimpleHelp(false)}
                />
              </View>
              
              {/* Interaktive Hilfeblase */}
              <View style={styles.demoContainer}>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => setShowInteractiveHelp(!showInteractiveHelp)}
                >
                  <Text style={styles.demoButtonText}>Interaktive Hilfeblase</Text>
                </TouchableOpacity>
                
                <HelpBubble
                  title="Interaktive Hilfeblase"
                  content="Diese Hilfeblase enthält Aktionen, die Sie ausführen können. Tippen Sie auf eine der Schaltflächen unten."
                  position={demoPosition}
                  variant={demoVariant}
                  isVisible={showInteractiveHelp}
                  microInteractions={interactiveMode}
                  onClose={() => setShowInteractiveHelp(false)}
                  actions={[
                    { 
                      label: 'Aktion 1', 
                      onPress: () => console.log('Aktion 1 ausgewählt')
                    },
                    { 
                      label: 'Aktion 2', 
                      onPress: () => console.log('Aktion 2 ausgewählt')
                    }
                  ]}
                />
              </View>
              
              {/* Tour-Mode Hilfeblase */}
              <View style={styles.demoContainer}>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => setShowTourHelp(!showTourHelp)}
                >
                  <Text style={styles.demoButtonText}>Tour-Modus</Text>
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
                  isVisible={showTourHelp}
                  microInteractions={interactiveMode}
                  onClose={() => setShowTourHelp(false)}
                  tourStep={tourStep}
                  onNextStep={handleNextStep}
                  onPrevStep={handlePrevStep}
                />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#f0f4f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  sectionContent: {
    padding: 16
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    color: '#333',
    flex: 1
  },
  controlValue: {
    flex: 2,
    alignItems: 'flex-start'
  },
  button: {
    backgroundColor: '#4a86e8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  switchLabel: {
    fontSize: 16,
    color: '#333'
  },
  previewContainer: {
    padding: 16
  },
  demoContainer: {
    marginBottom: 24,
    alignItems: 'center'
  },
  demoButton: {
    backgroundColor: '#4a86e8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default ExpoHelpBubbleDemo;