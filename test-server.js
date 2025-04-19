// Einfacher Test-Server, um zu prüfen, ob der Port 5000 erreichbar ist
import express from 'express';
const app = express();

app.get('/', (req, res) => {
  res.send('Server funktioniert!');
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Test-Server läuft auf Port 5000');
});