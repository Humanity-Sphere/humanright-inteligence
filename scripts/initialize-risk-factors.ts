
/**
 * Dieses Skript initialisiert die Standard-Risikofaktoren für die Risikoanalyse.
 * Es kann erweitert werden, um zusätzliche Faktoren hinzuzufügen.
 */

import db from '../server/utils/db';
import { RiskFactor } from '../server/models/risk-analysis-model';

const DEFAULT_RISK_FACTORS: RiskFactor[] = [
  {
    id: 'political_instability',
    name: 'Politische Instabilität',
    description: 'Grad der politischen Instabilität in der Region, einschließlich Regierungswechsel, Unruhen und Proteste',
    weight: 9,
    category: 'politisch'
  },
  {
    id: 'legal_framework',
    name: 'Rechtliches Umfeld',
    description: 'Qualität und Effektivität des rechtlichen Rahmens zum Schutz der Menschenrechte',
    weight: 8,
    category: 'rechtlich'
  },
  {
    id: 'freedom_of_expression',
    name: 'Meinungsfreiheit',
    description: 'Grad der Meinungsfreiheit und Pressefreiheit in der Region',
    weight: 8,
    category: 'rechtlich'
  },
  {
    id: 'digital_surveillance',
    name: 'Digitale Überwachung',
    description: 'Ausmaß der digitalen Überwachung und Einschränkungen im Internet',
    weight: 7,
    category: 'digital'
  },
  {
    id: 'physical_security',
    name: 'Physische Sicherheit',
    description: 'Bedrohungen für die physische Sicherheit von Menschenrechtsverteidigern',
    weight: 10,
    category: 'physisch'
  },
  {
    id: 'discrimination',
    name: 'Diskriminierung',
    description: 'Ausmaß der Diskriminierung gegen marginalisierte Gruppen',
    weight: 7,
    category: 'andere'
  },
  {
    id: 'judicial_independence',
    name: 'Unabhängigkeit der Justiz',
    description: 'Grad der Unabhängigkeit und Effektivität des Justizsystems',
    weight: 8,
    category: 'rechtlich'
  },
  {
    id: 'access_to_justice',
    name: 'Zugang zur Justiz',
    description: 'Möglichkeit für Opfer, Zugang zu Rechtsmitteln zu erhalten',
    weight: 7,
    category: 'rechtlich'
  },
  {
    id: 'economic_stability',
    name: 'Wirtschaftliche Stabilität',
    description: 'Wirtschaftliche Faktoren, die die Menschenrechtssituation beeinflussen können',
    weight: 6,
    category: 'andere'
  },
  {
    id: 'environmental_factors',
    name: 'Umweltfaktoren',
    description: 'Umweltbezogene Risiken, die Menschenrechte beeinflussen können',
    weight: 5,
    category: 'andere'
  },
  {
    id: 'healthcare_access',
    name: 'Zugang zu Gesundheitsversorgung',
    description: 'Verfügbarkeit und Zugänglichkeit grundlegender Gesundheitsversorgung',
    weight: 6,
    category: 'andere'
  },
  {
    id: 'digital_security',
    name: 'Digitale Sicherheit',
    description: 'Risiken im Zusammenhang mit digitaler Sicherheit und Datenschutzverletzungen',
    weight: 8,
    category: 'digital'
  }
];

async function initializeRiskFactors() {
  try {
    // Verbindung zur Datenbank herstellen
    await db.connect();
    
    const collection = db.collection('riskFactors');
    
    // Prüfen, ob bereits Risikofaktoren existieren
    const existingCount = await collection.countDocuments();
    
    if (existingCount > 0) {
      console.log(`${existingCount} Risikofaktoren existieren bereits. Keine neuen hinzugefügt.`);
      return;
    }
    
    // Risikofaktoren einfügen
    const result = await collection.insertMany(DEFAULT_RISK_FACTORS);
    
    console.log(`${result.insertedCount} Risikofaktoren erfolgreich initialisiert.`);
  } catch (error) {
    console.error('Fehler bei der Initialisierung der Risikofaktoren:', error);
  } finally {
    await db.close();
  }
}

// Skript ausführen
initializeRiskFactors();
