
import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface AccessibilityWrapperProps {
  children: ReactNode;
  style?: object;
  scrollable?: boolean;
}

const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  style,
  scrollable = true,
}) => {
  const { settings } = useAccessibility();
  
  const containerStyle = {
    backgroundColor: settings.isDarkMode 
      ? '#1A1A1A' 
      : settings.highContrast 
        ? '#FFFFFF' 
        : '#F5F5F5',
  };
  
  const contentStyle = {
    ...(settings.highContrast && { 
      borderWidth: 1,
      borderColor: settings.isDarkMode ? '#FFFFFF' : '#000000',
    })
  };

  const Wrapper = scrollable ? ScrollView : View;

  return (
    <Wrapper
      style={[styles.container, containerStyle, style]}
      contentContainerStyle={scrollable ? styles.scrollContent : {}}
      // Reduce animation speed when reducedMotion is enabled
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default AccessibilityWrapper;
