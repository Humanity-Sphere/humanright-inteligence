import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#2D6CDF', '#34A853', '#FBC02D', '#EA4335', '#5E8EE8', '#5CBF78', '#F0A800'];

// Daten für das Überblick-Dashboard
const trendData = [
  { monat: 'Jan', dokumentenZahl: 12, kampagnen: 2, alerts: 4 },
  { monat: 'Feb', dokumentenZahl: 15, kampagnen: 3, alerts: 5 },
  { monat: 'Mär', dokumentenZahl: 18, kampagnen: 2, alerts: 3 },
  { monat: 'Apr', dokumentenZahl: 14, kampagnen: 4, alerts: 6 },
  { monat: 'Mai', dokumentenZahl: 22, kampagnen: 3, alerts: 8 },
  { monat: 'Jun', dokumentenZahl: 26, kampagnen: 5, alerts: 7 },
];

const insightData = [
  { name: 'Dokumente', wert: 145 },
  { name: 'Kampagnen', wert: 24 },
  { name: 'Analysen', wert: 60 },
  { name: 'Warnungen', wert: 35 },
];

interface KeyInsightProps {
  icon: string;
  title: string;
  description: string;
  type: 'primary' | 'success' | 'warning' | 'danger';
}

const KeyInsight = ({ icon, title, description, type }: KeyInsightProps) => {
  const colorClass = {
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  const bgClass = {
    primary: 'bg-blue-50 dark:bg-blue-950',
    success: 'bg-green-50 dark:bg-green-950',
    warning: 'bg-yellow-50 dark:bg-yellow-950',
    danger: 'bg-red-50 dark:bg-red-950',
  };

  return (
    <div className={`p-4 ${bgClass[type]} rounded-lg border border-neutral-200 dark:border-neutral-700`}>
      <div className="flex items-center mb-2">
        <span className={`material-icons ${colorClass[type]} mr-2`}>{icon}</span>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm">{description}</p>
    </div>
  );
};

export default function DashboardOverview() {
  const [zeitraum, setZeitraum] = useState('6m');
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gesamtdokumente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="material-icons text-3xl text-blue-600 dark:text-blue-400 mr-2">description</span>
              <div>
                <div className="text-2xl font-bold">145</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="text-green-500 dark:text-green-400">+12%</span> im Vergleich zum Vormonat
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Kampagnen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="material-icons text-3xl text-green-600 dark:text-green-400 mr-2">campaign</span>
              <div>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="text-green-500 dark:text-green-400">+3</span> seit letztem Monat
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Durchgeführte Analysen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="material-icons text-3xl text-purple-600 dark:text-purple-400 mr-2">analytics</span>
              <div>
                <div className="text-2xl font-bold">60</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="text-green-500 dark:text-green-400">+8</span> seit letzter Woche
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Warnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="material-icons text-3xl text-red-600 dark:text-red-400 mr-2">warning</span>
              <div>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="text-red-500 dark:text-red-400">+2</span> Neue Warnungen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Aktivitätsübersicht</CardTitle>
                <CardDescription>Monatliche Aktivitäten und Trends</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setZeitraum('6m')} className={zeitraum === '6m' ? 'bg-primary text-white' : ''}>
                  6M
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZeitraum('1y')} className={zeitraum === '1y' ? 'bg-primary text-white' : ''}>
                  1J
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZeitraum('all')} className={zeitraum === 'all' ? 'bg-primary text-white' : ''}>
                  Alle
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monat" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels = {
                        dokumentenZahl: "Dokumente",
                        kampagnen: "Kampagnen",
                        alerts: "Warnungen"
                      };
                      return [value, labels[name as keyof typeof labels] || name];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="dokumentenZahl" stroke="#2D6CDF" name="Dokumente" />
                  <Line type="monotone" dataKey="kampagnen" stroke="#34A853" name="Kampagnen" />
                  <Line type="monotone" dataKey="alerts" stroke="#EA4335" name="Warnungen" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ressourcenverteilung</CardTitle>
            <CardDescription>Übersicht der Ressourcen nach Typ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insightData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="wert"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {insightData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'Anzahl']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Warnungen</CardTitle>
            <CardDescription>Wichtige Menschenrechtsthemen, die Aufmerksamkeit erfordern</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Wasserrechtsbedrohung', region: 'Südasien', severity: 'hoch', description: 'Mehrere Berichte über eingeschränkten Wasserzugang in ländlichen Gebieten' },
                { title: 'Meinungsfreiheit eingeschränkt', region: 'Osteuropa', severity: 'mittel', description: 'Neue Gesetze gefährden die Pressefreiheit und freie Meinungsäußerung' },
                { title: 'Bildungszugangseinschränkung', region: 'Zentral-Afrika', severity: 'hoch', description: 'Zunehmende Einschränkungen für Mädchen beim Zugang zu Bildung' },
              ].map((alert, index) => (
                <div key={index} className="pb-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{alert.region}</p>
                    </div>
                    <Badge variant={alert.severity === 'hoch' ? 'destructive' : 'outline'}>
                      {alert.severity === 'hoch' ? 'Hohe Priorität' : 'Mittlere Priorität'}
                    </Badge>
                  </div>
                  <p className="text-sm">{alert.description}</p>
                  {index < 2 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>KI-generierte Erkenntnisse</CardTitle>
            <CardDescription>Automatisch erkannte Trends und Muster</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <KeyInsight 
                icon="insights"
                title="Trendthema: Wasserrechte"
                description="Der Anstieg von Wasserrechtsthemen ist in den letzten 3 Monaten um 24% gestiegen, was auf eine zunehmende globale Krise hindeutet."
                type="primary"
              />
              
              <KeyInsight 
                icon="trending_up"
                title="Dringendes Problem"
                description="In Südasien zeigt sich ein deutlicher Anstieg (35%) bei negativen Vorfällen im Zusammenhang mit dem Wasserzugang in ländlichen Gemeinden."
                type="danger"
              />
              
              <KeyInsight 
                icon="new_releases"
                title="Chancen"
                description="Bildungskampagnen haben über alle Regionen und Demographien hinweg die höchste Erfolgsrate (85%)."
                type="success"
              />
              
              <KeyInsight 
                icon="policy"
                title="Rechtlicher Trend"
                description="Verweise auf die UN-Resolution 64/292 haben in aktuellen Dokumenten um 42% zugenommen, was auf ihre wachsende Relevanz hindeutet."
                type="warning"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
