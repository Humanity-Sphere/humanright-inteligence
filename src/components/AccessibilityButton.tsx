import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Animated,
  Easing,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AccessibilityService from '../services/AccessibilityService';
import AccessibilityControls from './AccessibilityControls';

interface AccessibilityButtonProps {
  style?: any;
  size?: number;
  color?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({
  style,
  size = 50,
  color = '#4a86e8',
  position = 'bottom-right'
}) => {
  const [controlsVisible, setControlsVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [settings, setSettings] = useState(AccessibilityService.getSettings());
  
  // Einstellungsänderungen überwachen
  useEffect(() => {
    const handleSettingsChange = (newSettings: any) => {
      setSettings(newSettings);
    };
    
    AccessibilityService.addSettingsChangeListener(handleSettingsChange);
    
    return () => {
      AccessibilityService.removeSettingsChangeListener(handleSettingsChange);
    };
  }, []);
  
  // Pulsierende Animation starten (für Aufmerksamkeit)
  useEffect(() => {
    // Nur animieren, wenn keine Bewegungsreduzierung aktiviert ist
    if (!settings.reduceMotion) {
      const loopAnimation = () => {
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ]).start(({ finished }) => {
          if (finished) {
            loopAnimation();
          }
        });
      };
      
      loopAnimation();
    } else {
      // Bei Bewegungsreduzierung Animation zurücksetzen
      animation.setValue(0);
    }
    
    return () => {
      animation.stopAnimation();
    };
  }, [settings.reduceMotion]);
  
  // Zugänglichkeitsmenü öffnen/schließen
  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };
  
  // Position des Buttons bestimmen
  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: 16, left: 16 };
      case 'top-right':
        return { top: 16, right: 16 };
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'bottom-right':
      default:
        return { bottom: 16, right: 16 };
    }
  };
  
  // Animationen berechnen
  const scale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1]
  });
  
  const shadowOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3]
  });
  
  const positionStyle = getPositionStyle();
  
  return (
    <>
      <Animated.View
        style={[
          styles.buttonContainer,
          positionStyle,
          {
            transform: [{ scale }],
            shadowOpacity
          },
          style
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color
            }
          ]}
          onPress={toggleControls}
          accessibilityLabel="Barrierefreiheit anpassen"
          accessibilityHint="Öffnet das Menü für Barrierefreiheitseinstellungen"
        >
          <Icon name="accessibility" size={size / 2} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      
      <AccessibilityControls
        isOpen={controlsVisible}
        onClose={() => setControlsVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default AccessibilityButton;