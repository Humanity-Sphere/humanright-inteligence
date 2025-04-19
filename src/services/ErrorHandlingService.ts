
import { Alert } from 'react-native';

class ErrorHandlingService {
  handleApiError(error: any, title = 'API Fehler') {
    console.error('API Error:', error);
    
    const errorMessage = this.extractErrorMessage(error);
    
    Alert.alert(
      title,
      errorMessage,
      [{ text: 'OK', style: 'default' }]
    );
    
    return errorMessage;
  }
  
  extractErrorMessage(error: any): string {
    if (!error) return 'Ein unbekannter Fehler ist aufgetreten';
    
    // Wenn der Fehler eine Nachricht-Eigenschaft hat
    if (error.message) return error.message;
    
    // Wenn der Fehler eine response-Eigenschaft hat (typisch für axios)
    if (error.response) {
      // Versuche, die Fehlermeldung aus der Antwort zu extrahieren
      if (error.response.data && error.response.data.error) {
        return error.response.data.error;
      }
      
      // Andernfalls verwende den HTTP-Statuscode
      if (error.response.status) {
        const statusCodes: Record<number, string> = {
          400: 'Ungültige Anfrage',
          401: 'Nicht autorisiert - Bitte erneut anmelden',
          403: 'Zugriff verweigert',
          404: 'Ressource nicht gefunden',
          409: 'Konflikt mit bestehendem Datensatz',
          422: 'Ungültige Daten',
          500: 'Interner Serverfehler'
        };
        
        return statusCodes[error.response.status] || `Fehler ${error.response.status}`;
      }
    }
    
    // Fallback für Netzwerkfehler
    if (error.code === 'ECONNABORTED') return 'Zeitüberschreitung bei der Verbindung';
    if (error.code === 'ERR_NETWORK') return 'Netzwerkfehler - Bitte überprüfen Sie Ihre Internetverbindung';
    
    // Standard-Fehlermeldung
    return 'Ein Fehler ist aufgetreten';
  }
  
  // Spezielle Methode für Authentifizierungsfehler
  handleAuthError() {
    Alert.alert(
      'Authentifizierungsfehler',
      'Ihre Sitzung ist abgelaufen oder Sie sind nicht angemeldet. Bitte melden Sie sich erneut an.',
      [{ text: 'OK', style: 'default' }]
    );
  }
  
  // Methode für Text-to-Speech Fehler
  handleTTSError(error: any) {
    const message = this.extractErrorMessage(error);
    console.warn('[TextToSpeech] Fehler:', message);
    
    // Nur Alert zeigen, wenn es ein schwerwiegender Fehler ist
    if (message !== 'Web Speech API nicht unterstützt') {
      Alert.alert(
        'Text-zu-Sprache Fehler',
        'Die Sprachausgabe konnte nicht initialisiert werden: ' + message,
        [{ text: 'OK', style: 'default' }]
      );
    }
    
    return message;
  }
  
  // Allgemeine Methode für Offline-Fehler
  handleOfflineError() {
    Alert.alert(
      'Keine Internetverbindung',
      'Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
      [{ text: 'OK', style: 'default' }]
    );
  }
}

export default new ErrorHandlingService();
