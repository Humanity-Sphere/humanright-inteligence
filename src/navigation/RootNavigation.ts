import { createRef } from 'react';
import { NavigationContainerRef, StackActions } from '@react-navigation/native';

// Navigationsreferenz, auf die von außerhalb der Komponenten zugegriffen werden kann
export const navigationRef = createRef<NavigationContainerRef<any>>();

// Navigation zu einem bestimmten Screen
export function navigate(name: string, params?: object) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    console.warn('Navigation wurde aufgerufen, bevor die Referenz bereit war');
  }
}

// Gehe zurück zum vorherigen Screen
export function goBack() {
  if (navigationRef.current) {
    navigationRef.current.goBack();
  }
}

// Ersetze den aktuellen Screen (wie navigate, aber ohne zurück zu gehen)
export function replace(name: string, params?: object) {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.replace(name, params));
  }
}

// Zurück zum Homescreen
export function navigateToHome() {
  if (navigationRef.current) {
    navigationRef.current.navigate('Home');
  }
}

// Aktuelle Route abrufen
export function getCurrentRoute() {
  if (navigationRef.current) {
    return navigationRef.current.getCurrentRoute();
  }
  return null;
}

// Mehrere Screens zurückgehen
export function popToTop() {
  if (navigationRef.current) {
    navigationRef.current.dispatch(StackActions.popToTop());
  }
}

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  DocumentAnalysis: { documentId?: string };
  Evidence: undefined;
  Journal: undefined;
  InteractiveStudio: undefined;
  SmartGlass: undefined;
  AccessibilitySettings: undefined;
  LearningPaths: undefined;
  KIAssistant: undefined;
  LocalAI: undefined;
};