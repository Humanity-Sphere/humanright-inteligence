
@echo off
echo Starte Human Rights Defender Tools - Desktop-Anwendung...

:: Überprüfen, ob npm installiert ist
where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo Fehler: Node.js und npm müssen installiert sein.
  echo Bitte laden Sie Node.js von https://nodejs.org/ herunter und installieren Sie es.
  pause
  exit /b 1
)

:: Überprüfen, ob Dependencies installiert sind
if not exist node_modules (
  echo Installiere Abhängigkeiten...
  npm install
  if %errorlevel% neq 0 (
    echo Fehler bei der Installation der Abhängigkeiten.
    pause
    exit /b 1
  )
)

:: Start-Server im Hintergrund
start cmd /c "npm run dev"

:: Warten, bis der Server gestartet ist
echo Warte auf Server-Start...
timeout /t 5 /nobreak > nul

:: Electron-App starten
echo Starte Electron-App...
npx electron electron/main.js

echo Anwendung wird beendet...
exit /b 0
