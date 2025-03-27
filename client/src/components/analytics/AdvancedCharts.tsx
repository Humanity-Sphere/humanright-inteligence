import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#2D6CDF', '#34A853', '#FBC02D', '#EA4335', '#5E8EE8', '#5CBF78', '#F0A800', '#D64E40'];

// Beispiel-Daten für Trends über Zeit
const timeSeriesData = [
  { monat: 'Jan', dokumentenZählung: 4, kampagnenAktivität: 1, untersuchungen: 2 },
  { monat: 'Feb', dokumentenZählung: 6, kampagnenAktivität: 3, untersuchungen: 4 },
  { monat: 'Mär', dokumentenZählung: 8, kampagnenAktivität: 5, untersuchungen: 3 },
  { monat: 'Apr', dokumentenZählung: 12, kampagnenAktivität: 7, untersuchungen: 5 },
  { monat: 'Mai', dokumentenZählung: 16, kampagnenAktivität: 9, untersuchungen: 7 },
  { monat: 'Jun', dokumentenZählung: 20, kampagnenAktivität: 11, untersuchungen: 6 },
  { monat: 'Jul', dokumentenZählung: 18, kampagnenAktivität: 14, untersuchungen: 8 },
  { monat: 'Aug', dokumentenZählung: 22, kampagnenAktivität: 16, untersuchungen: 10 },
  { monat: 'Sep', dokumentenZählung: 26, kampagnenAktivität: 18, untersuchungen: 12 },
  { monat: 'Okt', dokumentenZählung: 34, kampagnenAktivität: 20, untersuchungen: 14 },
  { monat: 'Nov', dokumentenZählung: 42, kampagnenAktivität: 22, untersuchungen: 16 },
  { monat: 'Dez', dokumentenZählung: 48, kampagnenAktivität: 24, untersuchungen: 18 },
];

// Menschenrechtsvorfälle nach Kategorie
const vorfallKategorien = [
  { name: 'Meinungsfreiheit', wert: 32 },
  { name: 'Zugang zu Bildung', wert: 28 },
  { name: 'Wasserrechte', wert: 22 },
  { name: 'Gesundheitsversorgung', wert: 18 },
  { name: 'Landrechte', wert: 15 },
  { name: 'Digitale Rechte', wert: 12 },
  { name: 'Flüchtlingsrechte', wert: 10 },
  { name: 'Arbeitnehmerrechte', wert: 8 },
];

// Daten für geographische Verteilung
const geographischeVerteilung = [
  { name: 'Südasien', wert: 35 },
  { name: 'Afrika', wert: 25 },
  { name: 'Südamerika', wert: 20 },
  { name: 'Europa', wert: 15 },
  { name: 'Nordamerika', wert: 5 },
];

// Daten für Radar-Analyse
const radarDaten = [
  { kategorie: 'Dokumentensammlung', A: 65, B: 85, fullMark: 100 },
  { kategorie: 'Analyse', A: 80, B: 70, fullMark: 100 },
  { kategorie: 'Berichterstattung', A: 45, B: 90, fullMark: 100 },
  { kategorie: 'Kampagnen', A: 70, B: 60, fullMark: 100 },
  { kategorie: 'Engagement', A: 50, B: 75, fullMark: 100 },
  { kategorie: 'Rechtliche Maßnahmen', A: 90, B: 65, fullMark: 100 },
];

// Daten für Streudiagramm
const streuDaten = [
  { name: 'Dokumentensammlung', x: 65, y: 75, z: 120 },
  { name: 'Analysetiefe', x: 80, y: 60, z: 150 },
  { name: 'Berichterstattung', x: 45, y: 90, z: 80 },
  { name: 'Kampagnenreichweite', x: 70, y: 95, z: 200 },
  { name: 'Engagement', x: 50, y: 85, z: 90 },
  { name: 'Rechtliche Wirkung', x: 90, y: 55, z: 170 },
];

export function TrendAnalyse() {
  const [zeitraum, setZeitraum] = useState("jahr");
  const [ansichtTyp, setAnsichtTyp] = useState("linie");
  
  const filteredData = timeSeriesData;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Trend-Analyse</CardTitle>
            <CardDescription>Zeitliche Entwicklung von Dokumenten und Aktivitäten</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select value={zeitraum} onValueChange={setZeitraum}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Zeitraum wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quartal">Letztes Quartal</SelectItem>
                <SelectItem value="halbjahr">Letztes Halbjahr</SelectItem>
                <SelectItem value="jahr">Letztes Jahr</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ansichtTyp} onValueChange={setAnsichtTyp}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Diagrammtyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linie">Liniendiagramm</SelectItem>
                <SelectItem value="bereich">Bereichsdiagramm</SelectItem>
                <SelectItem value="balken">Balkendiagramm</SelectItem>
                <SelectItem value="kombiniert">Kombiniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {ansichtTyp === "linie" && (
              <LineChart
                data={filteredData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monat" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    const labels = {
                      dokumentenZählung: "Dokumente",
                      kampagnenAktivität: "Kampagnen",
                      untersuchungen: "Untersuchungen"
                    };
                    return [value, labels[name as keyof typeof labels] || name];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="dokumentenZählung" stroke="#2D6CDF" name="Dokumente" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="kampagnenAktivität" stroke="#34A853" name="Kampagnen" />
                <Line type="monotone" dataKey="untersuchungen" stroke="#FBC02D" name="Untersuchungen" />
              </LineChart>
            )}
            
            {ansichtTyp === "bereich" && (
              <AreaChart
                data={filteredData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monat" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    const labels = {
                      dokumentenZählung: "Dokumente",
                      kampagnenAktivität: "Kampagnen",
                      untersuchungen: "Untersuchungen"
                    };
                    return [value, labels[name as keyof typeof labels] || name];
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="dokumentenZählung" stackId="1" stroke="#2D6CDF" fill="#2D6CDF" name="Dokumente" />
                <Area type="monotone" dataKey="kampagnenAktivität" stackId="1" stroke="#34A853" fill="#34A853" name="Kampagnen" />
                <Area type="monotone" dataKey="untersuchungen" stackId="1" stroke="#FBC02D" fill="#FBC02D" name="Untersuchungen" />
              </AreaChart>
            )}
            
            {ansichtTyp === "balken" && (
              <BarChart
                data={filteredData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monat" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    const labels = {
                      dokumentenZählung: "Dokumente",
                      kampagnenAktivität: "Kampagnen",
                      untersuchungen: "Untersuchungen"
                    };
                    return [value, labels[name as keyof typeof labels] || name];
                  }}
                />
                <Legend />
                <Bar dataKey="dokumentenZählung" fill="#2D6CDF" name="Dokumente" />
                <Bar dataKey="kampagnenAktivität" fill="#34A853" name="Kampagnen" />
                <Bar dataKey="untersuchungen" fill="#FBC02D" name="Untersuchungen" />
              </BarChart>
            )}
            
            {ansichtTyp === "kombiniert" && (
              <ComposedChart
                data={filteredData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monat" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    const labels = {
                      dokumentenZählung: "Dokumente",
                      kampagnenAktivität: "Kampagnen",
                      untersuchungen: "Untersuchungen"
                    };
                    return [value, labels[name as keyof typeof labels] || name];
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="dokumentenZählung" fill="#2D6CDF" stroke="#2D6CDF" name="Dokumente" />
                <Bar dataKey="kampagnenAktivität" barSize={20} fill="#34A853" name="Kampagnen" />
                <Line type="monotone" dataKey="untersuchungen" stroke="#FBC02D" name="Untersuchungen" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function VorfallVerteilung() {
  const [diagrammTyp, setDiagrammTyp] = useState("kreisdiagramm");
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Verteilung der Menschenrechtsvorfälle</CardTitle>
            <CardDescription>Aufschlüsselung nach Kategorien</CardDescription>
          </div>
          <Select value={diagrammTyp} onValueChange={setDiagrammTyp}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Diagrammtyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kreisdiagramm">Kreisdiagramm</SelectItem>
              <SelectItem value="balkendiagramm">Balkendiagramm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {diagrammTyp === "kreisdiagramm" && (
              <PieChart>
                <Pie
                  data={vorfallKategorien}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="wert"
                >
                  {vorfallKategorien.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Vorfälle`, 'Anzahl']}
                />
                <Legend />
              </PieChart>
            )}
            
            {diagrammTyp === "balkendiagramm" && (
              <BarChart
                layout="vertical"
                data={vorfallKategorien}
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(value) => [`${value} Vorfälle`, 'Anzahl']} />
                <Legend />
                <Bar dataKey="wert" name="Vorfälle">
                  {vorfallKategorien.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function GeographischeAnalyse() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Geographische Analyse</CardTitle>
        <CardDescription>Verteilung der Vorfälle nach Region</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={geographischeVerteilung}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="wert"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {geographischeVerteilung.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [`${value}%`, 'Prozentsatz']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function KampagnenEffektivitaet() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Kampagnen-Effektivität</CardTitle>
        <CardDescription>Vergleich von Plattformen und deren Wirksamkeit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={90} data={radarDaten}>
              <PolarGrid />
              <PolarAngleAxis dataKey="kategorie" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Organisation A" dataKey="A" stroke="#2D6CDF" fill="#2D6CDF" fillOpacity={0.6} />
              <Radar name="Organisation B" dataKey="B" stroke="#34A853" fill="#34A853" fillOpacity={0.6} />
              <Legend />
              <Tooltip formatter={(value) => [`${value}%`, 'Effektivität']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ErgebnisMatrixVisualisierung() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ergebnis-Matrix</CardTitle>
        <CardDescription>Visualisierung der Wirksamkeit von Maßnahmen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={streuDaten}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" name="Ressourceneinsatz" unit="%" />
              <YAxis dataKey="y" type="number" name="Wirksamkeit" unit="%" />
              <Tooltip 
                formatter={(value, name, props) => {
                  if (name === 'x') return [`${value}%`, 'Ressourceneinsatz'];
                  if (name === 'y') return [`${value}%`, 'Wirksamkeit'];
                  if (name === 'z') return [`${value}`, 'Reichweite'];
                  return [value, name];
                }}
                labelFormatter={(label) => streuDaten[label as number].name}
              />
              <Legend />
              <Scatter name="Maßnahmen" data={streuDaten} fill="#2D6CDF">
                {streuDaten.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function BenutzerdefinierteAnalyse() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Benutzerdefinierte Analyse</CardTitle>
            <CardDescription>Wählen Sie Datenquellen und Visualisierungen aus</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Datenquellen</label>
            <Select defaultValue="dokumente">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Datenquelle auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dokumente">Dokumente</SelectItem>
                <SelectItem value="kampagnen">Kampagnen</SelectItem>
                <SelectItem value="aktivitaeten">Aktivitäten</SelectItem>
                <SelectItem value="rechtsfaelle">Rechtsfälle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Visualisierungstyp</label>
            <Select defaultValue="linie">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Visualisierung auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linie">Liniendiagramm</SelectItem>
                <SelectItem value="balken">Balkendiagramm</SelectItem>
                <SelectItem value="kreis">Kreisdiagramm</SelectItem>
                <SelectItem value="heatmap">Heatmap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Filter: Zeitraum</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Zeitraum wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Zeit</SelectItem>
                <SelectItem value="quarter">Letztes Quartal</SelectItem>
                <SelectItem value="year">Letztes Jahr</SelectItem>
                <SelectItem value="custom">Benutzerdefiniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filter: Region</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Region wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Regionen</SelectItem>
                <SelectItem value="europe">Europa</SelectItem>
                <SelectItem value="asia">Asien</SelectItem>
                <SelectItem value="africa">Afrika</SelectItem>
                <SelectItem value="americas">Amerika</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filter: Thema</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Thema wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Themen</SelectItem>
                <SelectItem value="water">Wasserrechte</SelectItem>
                <SelectItem value="education">Bildung</SelectItem>
                <SelectItem value="speech">Meinungsfreiheit</SelectItem>
                <SelectItem value="health">Gesundheit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end mb-4">
          <Button variant="default">
            Analyse durchführen
          </Button>
        </div>
        
        <div className="h-64 w-full flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
          <div className="text-center">
            <span className="material-icons text-neutral-400 text-4xl mb-2">insights</span>
            <p className="text-neutral-500 dark:text-neutral-400">Wählen Sie Datenquellen und Parameter aus, um Ihre benutzerdefinierte Analyse zu starten</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
