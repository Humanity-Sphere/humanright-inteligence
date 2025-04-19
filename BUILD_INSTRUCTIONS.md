# Anleitung zum Erstellen und Installieren der APK

Diese Anleitung erklärt, wie Sie die Human Rights Intelligence App als APK erstellen und auf Ihrem Android-Gerät installieren können.

## Voraussetzungen

1. Ein Expo-Konto (kostenlos erstellen unter [https://expo.dev/signup](https://expo.dev/signup))
2. Expo CLI (installieren mit `npm install -g eas-cli`)
3. Ein Android-Gerät oder Emulator

## Schritte zum Erstellen der APK

1. **Anmelden bei Expo**:
   ```bash
   eas login
   ```

2. **Initialisieren Sie Ihr Projekt (nur bei erstmaliger Ausführung)**:
   ```bash
   cd mobile-app
   eas build:configure
   ```

3. **APK erstellen**:
   ```bash
   cd mobile-app
   eas build -p android --profile preview
   ```

4. Folgen Sie den Anweisungen auf dem Bildschirm. Der Build-Prozess wird in der Expo-Cloud durchgeführt.

5. Nach Abschluss des Builds erhalten Sie einen Link, unter dem Sie die APK herunterladen können.

## Installation auf dem Android-Gerät

1. Laden Sie die APK auf Ihr Android-Gerät herunter.

2. Öffnen Sie die Datei auf Ihrem Gerät, um die Installation zu starten.

3. Sie müssen möglicherweise die Installation von Apps aus unbekannten Quellen erlauben:
   - Gehen Sie zu **Einstellungen > Sicherheit**
   - Aktivieren Sie **Installation aus unbekannten Quellen**

4. Folgen Sie den Anweisungen auf dem Bildschirm, um die Installation abzuschließen.

## Alternative: Direktes Testen ohne APK

Falls Sie die APK nicht erstellen möchten, können Sie die App auch direkt mit Expo Go testen:

1. Installieren Sie die **Expo Go** App auf Ihrem Android- oder iOS-Gerät.

2. Erstellen Sie ein Expo-Konto (falls noch nicht geschehen).

3. Führen Sie folgenden Befehl aus, um Ihr Projekt zu veröffentlichen:
   ```bash
   cd mobile-app
   npx expo publish
   ```

4. Melden Sie sich in der Expo Go App auf Ihrem Mobilgerät an und finden Sie Ihr Projekt unter "Projects".

## Fehlerbehebung

- Wenn Sie Probleme mit dem Build haben, überprüfen Sie die Expo-Dokumentation unter [https://docs.expo.dev/build/troubleshooting/](https://docs.expo.dev/build/troubleshooting/)
- Stellen Sie sicher, dass Ihre `app.json` korrekt konfiguriert ist
- Bei Problemen mit der Anmeldung führen Sie `eas logout` aus und versuchen Sie es erneut