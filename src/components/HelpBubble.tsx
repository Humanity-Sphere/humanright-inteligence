import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useHelp } from '../contexts/HelpContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface HelpBubbleProps {
  screenName: string;
  content: string;
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
}

const HelpBubble: React.FC<HelpBubbleProps> = ({
  screenName,
  content,
  position = 'bottomRight',
}) => {
  const { showHelp, toggleHelp } = useHelp();
  const { settings } = useAccessibility();

  const getPositionStyle = () => {
    switch (position) {
      case 'topRight':
        return { top: 20, right: 20 };
      case 'topLeft':
        return { top: 20, left: 20 };
      case 'bottomLeft':
        return { bottom: 20, left: 20 };
      case 'bottomRight':
      default:
        return { bottom: 20, right: 20 };
    }
  };

  const textSize = {
    fontSize: 16 * (settings.fontSize / 100),
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.bubbleButton, getPositionStyle()]}
        onPress={toggleHelp}
        accessibilityLabel="Hilfe anzeigen"
        accessibilityHint="Öffnet Hilfe-Informationen zu diesem Bildschirm"
      >
        <Text style={styles.bubbleText}>?</Text>
      </TouchableOpacity>

      <Modal
        visible={showHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleHelp}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleHelp}
        >
          <View 
            style={[
              styles.helpContent, 
              settings.isDarkMode ? styles.darkMode : {}
            ]}
          >
            <Text 
              style={[
                styles.helpTitle, 
                textSize,
                settings.isDarkMode ? styles.darkModeText : {}
              ]}
            >
              {screenName} Hilfe
            </Text>
            <Text 
              style={[
                styles.helpText, 
                textSize,
                settings.isDarkMode ? styles.darkModeText : {}
              ]}
            >
              {content}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={toggleHelp}
              accessibilityLabel="Hilfe schließen"
            >
              <Text style={styles.closeButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bubbleButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5D5CDE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bubbleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  darkMode: {
    backgroundColor: '#333',
  },
  darkModeText: {
    color: 'white',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#5D5CDE',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HelpBubble;