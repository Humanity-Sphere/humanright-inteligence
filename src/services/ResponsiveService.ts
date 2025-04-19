
import { Dimensions, Platform, ScaledSize } from 'react-native';

export type DeviceType = 'phone' | 'tablet' | 'desktop';

const { width, height } = Dimensions.get('window');

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Bestimmen des Gerätetyps basierend auf Bildschirmbreite
export const getDeviceType = (): DeviceType => {
  if (width < 768) return 'phone';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Funktion zur Berechnung relativer Größen
export const wp = (percentage: number): number => {
  return (width * percentage) / 100;
};

export const hp = (percentage: number): number => {
  return (height * percentage) / 100;
};

// Responsive Schriftgrößen
export const fontSize = {
  small: wp(3.5),
  medium: wp(4),
  large: wp(5),
  xlarge: wp(6.5),
};

// Responsive Abstände
export const spacing = {
  xs: wp(2),
  small: wp(3),
  medium: wp(5),
  large: wp(7),
  xl: wp(10),
};

// Funktion für adaptive Layouts
export const getAdaptiveLayout = (
  phoneValue: number, 
  tabletValue: number, 
  desktopValue: number
): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'phone':
      return phoneValue;
    case 'tablet':
      return tabletValue;
    case 'desktop':
      return desktopValue;
  }
};

// Hook für Screen-Dimensionen Änderungen
export const useDimensions = () => {
  const [dimensions, setDimensions] = React.useState<ScaledSize>(Dimensions.get('window'));

  React.useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => subscription.remove();
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isPhone: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
  };
};

// Standard-Farben für die App
export const colors = {
  primary: '#5D5CDE',
  secondary: '#4F4FC9',
  dark: {
    primary: '#7372E8',
    secondary: '#6261DE',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
  },
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#121212',
  },
  error: '#B00020',
  warning: '#FB8C00',
  success: '#43A047',
};
