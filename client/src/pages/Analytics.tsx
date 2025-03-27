import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import DashboardOverview from "@/components/analytics/DashboardOverview";
import { 
  TrendAnalyse, 
  VorfallVerteilung, 
  GeographischeAnalyse, 
  KampagnenEffektivitaet, 
  ErgebnisMatrixVisualisierung,
  BenutzerdefinierteAnalyse
} from "@/components/analytics/AdvancedCharts";

const themenDaten = [
  { name: 'Wasserrechte', value: 75 },
  { name: 'Bildung', value: 65 },
  { name: 'Meinungsfreiheit', value: 60 },
  { name: 'Gesundheitsversorgung', value: 45 },
  { name: 'Landrechte', value: 40 },
  { name: 'Flüchtlingsrechte', value: 35 },
  { name: 'Arbeitsrechte', value: 30 },
];

const regionenDaten = [
  { name: 'Südasien', value: 35 },
  { name: 'Afrika', value: 25 },
  { name: 'Südamerika', value: 20 },
  { name: 'Europa', value: 15 },
  { name: 'Nordamerika', value: 5 },
];

const COLORS = ['#2D6CDF', '#34A853', '#FBC02D', '#EA4335', '#5E8EE8', '#5CBF78', '#F0A800'];

export default function Analytics() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytik & Erkenntnisse</h1>
          <p className="text-muted-foreground">Analysieren Sie Ihre Dokumente und Kampagnen</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Select defaultValue="30tage">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zeitraum auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7tage">Letzte 7 Tage</SelectItem>
              <SelectItem value="30tage">Letzte 30 Tage</SelectItem>
              <SelectItem value="90tage">Letzte 90 Tage</SelectItem>
              <SelectItem value="1jahr">Letztes Jahr</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="ueberblick" className="w-full mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="ueberblick">Überblick</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="kategorie">Kategorien</TabsTrigger>
          <TabsTrigger value="regionen">Regionen</TabsTrigger>
          <TabsTrigger value="effektivitaet">Effektivität</TabsTrigger>
          <TabsTrigger value="benutzerdefiniert">Benutzerdefiniert</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ueberblick" className="mt-6">
          <DashboardOverview />
        </TabsContent>
        
        <TabsContent value="trends" className="mt-6">
          <div className="space-y-6">
            <TrendAnalyse />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dokumenten-Uploads</CardTitle>
                  <CardDescription>Anzahl der hochgeladenen Dokumente im Zeitverlauf</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <span className="material-icons text-primary text-4xl">query_stats</span>
                      <div className="text-lg font-medium">Erweiterte Statistik</div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Die Datenvisualisierung zeigt detaillierte zeitliche Analysen Ihrer hochgeladenen Dokumente.
                      </p>
                      <p className="text-sm text-primary">
                        Mehr detaillierte Einblicke im "Trends"-Tab
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Themen</CardTitle>
                  <CardDescription>Meisterwähnte Themen in allen Dokumenten</CardDescription>
                </CardHeader>
                <CardContent>
                  {themenDaten.map((thema, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{thema.name}</span>
                        <span className="text-sm text-muted-foreground">{thema.value}%</span>
                      </div>
                      <Progress value={thema.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="kategorie" className="mt-6">
          <div className="space-y-6">
            <VorfallVerteilung />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Themen-Trends</CardTitle>
                  <CardDescription>Entwicklung wichtiger Themen im Zeitverlauf</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="h-full">
                    {/* Hier könnte die Themen-Trend-Grafik sein, aber wird in der TrendAnalyse-Komponente besser umgesetzt */}
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <span className="material-icons text-primary text-4xl">topic</span>
                        <div className="text-lg font-medium">Thematische Entwicklung</div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Die erweiterte Visualisierung zeigt die Entwicklung der wichtigsten Menschenrechtsthemen im Zeitverlauf
                          mit umfangreichen Filtermöglichkeiten.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Stimmungsanalyse</CardTitle>
                  <CardDescription>Gesamtstimmung in Dokumenten nach Thema</CardDescription>
                </CardHeader>
                <CardContent>
                  {[
                    { topic: 'Wasserrechte', sentiment: 'Negativ', value: 65 },
                    { topic: 'Bildung', sentiment: 'Gemischt', value: 50 },
                    { topic: 'Meinungsfreiheit', sentiment: 'Negativ', value: 70 },
                    { topic: 'Gesundheitsversorgung', sentiment: 'Positiv', value: 40 },
                    { topic: 'Landrechte', sentiment: 'Negativ', value: 75 },
                  ].map((item, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{item.topic}</span>
                        <span className={`text-sm ${
                          item.sentiment === 'Negativ' ? 'text-red-500' : 
                          item.sentiment === 'Positiv' ? 'text-green-500' : 'text-yellow-500'
                        }`}>
                          {item.sentiment}
                        </span>
                      </div>
                      <Progress 
                        value={item.value} 
                        className={`h-2 ${
                          item.sentiment === 'Negativ' ? 'bg-red-100 dark:bg-red-950' : 
                          item.sentiment === 'Positiv' ? 'bg-green-100 dark:bg-green-950' : 
                          'bg-yellow-100 dark:bg-yellow-950'
                        }`}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="regionen" className="mt-6">
          <div className="space-y-6">
            <GeographischeAnalyse />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regionale Verteilung</CardTitle>
                  <CardDescription>Verteilung der Dokumente nach Region</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="h-full">
                    {/* Diese Funktion wird bereits in der GeographischeAnalyse-Komponente besser umgesetzt */}
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <span className="material-icons text-primary text-4xl">public</span>
                        <div className="text-lg font-medium">Interaktive Geografische Analyse</div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Die geografische Verteilung zeigt detaillierte regionale Daten und kann nach verschiedenen Kriterien gefiltert werden.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Regionen nach Thema</CardTitle>
                  <CardDescription>Prominenteste Themen nach Region</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { region: 'Südasien', topics: ['Wasserrechte', 'Landrechte', 'Bildung'] },
                      { region: 'Afrika', topics: ['Gesundheitsversorgung', 'Wasserrechte', 'Bildung'] },
                      { region: 'Südamerika', topics: ['Landrechte', 'Indigene Rechte', 'Meinungsfreiheit'] },
                      { region: 'Europa', topics: ['Migration', 'Meinungsfreiheit', 'Digitale Rechte'] },
                      { region: 'Nordamerika', topics: ['Bürgerrechte', 'Digitale Rechte', 'Gesundheitsversorgung'] },
                    ].map((item, index) => (
                      <div key={index}>
                        <h3 className="text-sm font-medium mb-2">{item.region}</h3>
                        <div className="flex flex-wrap gap-2">
                          {item.topics.map((topic, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="effektivitaet" className="mt-6">
          <div className="space-y-6">
            <KampagnenEffektivitaet />
            <ErgebnisMatrixVisualisierung />
          </div>
        </TabsContent>
        
        <TabsContent value="benutzerdefiniert" className="mt-6">
          <BenutzerdefinierteAnalyse />
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Wichtige Erkenntnisse</CardTitle>
          <CardDescription>KI-generierte Erkenntnisse aus Ihren Daten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center mb-2">
                <span className="material-icons text-primary mr-2">insights</span>
                <h3 className="font-medium">Trendthema</h3>
              </div>
              <p className="text-sm">Wasserrechte haben einen Anstieg von 24% der Erwähnungen im letzten Monat verzeichnet und sind damit das am schnellsten wachsende Thema in Ihren Dokumenten.</p>
            </div>
            
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center mb-2">
                <span className="material-icons text-danger mr-2">trending_up</span>
                <h3 className="font-medium">Dringendes Problem</h3>
              </div>
              <p className="text-sm">Die Region Südasien zeigt einen signifikanten Anstieg der negativen Stimmung (35%) in Bezug auf den Wasserzugang in ländlichen Gemeinden.</p>
            </div>
            
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center mb-2">
                <span className="material-icons text-secondary mr-2">new_releases</span>
                <h3 className="font-medium">Chance</h3>
              </div>
              <p className="text-sm">Bildungskampagnen haben über alle Regionen und demografischen Gruppen hinweg die höchste Engagementrate (85%) gezeigt.</p>
            </div>
            
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center mb-2">
                <span className="material-icons text-blue-500 mr-2">policy</span>
                <h3 className="font-medium">Rechtlicher Trend</h3>
              </div>
              <p className="text-sm">Verweise auf die UN-Resolution 64/292 haben in aktuellen Dokumenten um 42% zugenommen, was auf ihre wachsende Relevanz hindeutet.</p>
            </div>
            
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center mb-2">
                <span className="material-icons text-purple-600 mr-2">groups</span>
                <h3 className="font-medium">Zusammenarbeit</h3>
              </div>
              <p className="text-sm">Dokumente, die mit Partnerorganisationen geteilt wurden, haben eine 2,5-fach höhere Wirkung bei der Umsetzung von Maßnahmen.</p>
            </div>
            
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center mb-2">
                <span className="material-icons text-yellow-600 mr-2">emoji_events</span>
                <h3 className="font-medium">Erfolgsfall</h3>
              </div>
              <p className="text-sm">Die Kampagne "Sauberes Wasser Initiative" hat zu Gesetzesänderungen in 3 verschiedenen Regionen geführt und ist damit Ihre erfolgreichste Kampagne.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
