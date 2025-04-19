import net from 'net';

// Array für die zu scannenden Ports
const portsToCheck = [3000, 5000, 8080, 8081, 4173, 24678];
const host = '0.0.0.0';

// Status-Array für den Scan-Fortschritt
const portStatus = {};

// Port-Scanner-Funktion
function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    // Timeout, falls der Verbindungsversuch zu lange dauert
    socket.setTimeout(1000);
    
    // Versuche eine Verbindung herzustellen
    socket.connect(port, host, () => {
      portStatus[port] = 'open';
      socket.destroy();
      resolve();
    });
    
    // Falls Verbindung fehlschlägt
    socket.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        portStatus[port] = 'closed';
      } else {
        portStatus[port] = `error: ${err.code}`;
      }
      socket.destroy();
      resolve();
    });
    
    // Falls Timeout ausgelöst wurde
    socket.on('timeout', () => {
      portStatus[port] = 'timeout';
      socket.destroy();
      resolve();
    });
  });
}

// Hauptfunktion zum Scannen aller Ports
async function scanPorts() {
  console.log(`Scanne Ports auf ${host}...`);
  
  // Scanne alle Ports parallel
  await Promise.all(portsToCheck.map(port => checkPort(port)));
  
  // Zeige Ergebnisse an
  console.log('\nScan-Ergebnisse:');
  for (const port of portsToCheck) {
    console.log(`Port ${port}: ${portStatus[port]}`);
  }
}

// Starte den Scan
scanPorts();