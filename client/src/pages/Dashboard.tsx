import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, BarChart3, LineChart, PieChart, Rocket, Award, Users, FileText, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useState } from "react";

// Farbpalette für Diagramme
const CHART_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green 
  "#EF4444", // red
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6366F1", // indigo
  "#1D4ED8", // deeper blue
  "#047857", // emerald
  "#7C3AED", // purple
];

interface ImpactSummary {
  metricType: string;
  totalValue: number;
  changePercentage: number;
  recentMetrics: ImpactMetric[];
}

interface ImpactMetric {
  id: number;
  userId: number;
  metricType: string;
  metricName: string;
  value: number;
  previousValue: number | null;
  unit: string;
  color: string;
  icon: string;
  description: string | null;
  goal: number | null;
  timestamp: string;
  region: string | null;
  tags: string[] | null;
  impactStory: string | null;
  dataSource: string | null;
  visualType: string;
}

// Hilfsfunktion für das Rendern der Icons
const renderIcon = (iconName: string, className = "w-4 h-4") => {
  switch (iconName) {
    case "bar-chart":
    case "chart":
      return <BarChart3 className={className} />;
    case "line-chart":
      return <LineChart className={className} />;
    case "pie-chart":
      return <PieChart className={className} />;
    case "award":
      return <Award className={className} />;
    case "users":
      return <Users className={className} />;
    case "file-text":
      return <FileText className={className} />;
    case "newspaper":
      return <Newspaper className={className} />;
    case "rocket":
    default:
      return <Rocket className={className} />;
  }
};

// Lokalisierte Metriktyp-Namen
const metricTypeNames: Record<string, string> = {
  advocacy: "Advocacy & Öffentlichkeitsarbeit",
  legal: "Rechtliche Aktivitäten",
  education: "Bildung & Workshops",
  community: "Community-Arbeit",
  research: "Forschung & Analyse",
};

// Formatierung von Zahlen
const formatValue = (value: number, unit: string) => {
  if (unit === "percentage" || unit === "percent") {
    return `${value}%`;
  }
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} Mio.`;
  }
  
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  
  return value.toString();
};

// MetricCard-Komponente für einzelne Metriken
const MetricCard = ({ metric }: { metric: ImpactMetric }) => {
  const changePercent = metric.previousValue 
    ? ((metric.value - metric.previousValue) / metric.previousValue) * 100
    : 0;
  
  const isPositive = changePercent >= 0;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {metric.metricName}
        </CardTitle>
        <div className={`p-2 rounded-full bg-${metric.color}-100`}>
          {renderIcon(metric.icon)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(metric.value, metric.unit)}
          {metric.unit === "people" && " Personen"}
        </div>
        {metric.previousValue !== null && (
          <p className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? "+" : ""}{changePercent.toFixed(1)}% gegenüber Vorperiode
          </p>
        )}
        {metric.goal && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Fortschritt</span>
              <span>{Math.round((metric.value / metric.goal) * 100)}%</span>
            </div>
            <Progress value={(metric.value / metric.goal) * 100} className="h-1" />
          </div>
        )}
        {metric.impactStory && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            {metric.impactStory}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// MetricTypeSection Komponente für einen Metriktyp
const MetricTypeSection = ({ 
  metrics, 
  title,
  showChart = true 
}: { 
  metrics: ImpactMetric[], 
  title: string,
  showChart?: boolean
}) => {
  const chartData = metrics.map(metric => ({
    name: metric.metricName,
    value: metric.value,
    previousValue: metric.previousValue || 0,
    unit: metric.unit,
    color: metric.color
  }));
  
  // Finde die bevorzugte Visualisierungsart
  const getPreferredChartType = () => {
    const types = metrics.map(m => m.visualType);
    if (types.includes("line")) return "line";
    if (types.includes("pie")) return "pie";
    return "bar"; // Default
  };
  
  const chartType = getPreferredChartType();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
      
      {showChart && chartData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Übersicht {title}</CardTitle>
            <CardDescription>Visualisierung der wichtigsten Metriken</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      const item = chartData.find(d => d.value === value || d.previousValue === value);
                      return [`${value}${item?.unit === "people" ? " Personen" : ""}`, name];
                    }} 
                  />
                  <Bar dataKey="value" fill="#3B82F6" name="Aktueller Wert" />
                  <Bar dataKey="previousValue" fill="#93C5FD" name="Vorheriger Wert" />
                </BarChart>
              ) : chartType === "line" ? (
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" activeDot={{ r: 8 }} name="Aktueller Wert" />
                  <Line type="monotone" dataKey="previousValue" stroke="#93C5FD" name="Vorheriger Wert" />
                </RechartsLineChart>
              ) : (
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Hauptkomponente Dashboard
export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Lade alle Impact Metrics
  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery<ImpactMetric[]>({
    queryKey: ["/api/impact-metrics"],
    retry: 1,
  });
  
  // Lade die Metrics-Zusammenfassung
  const { data: summaryData, isLoading: isLoadingSummary, error: summaryError } = useQuery<ImpactSummary[]>({
    queryKey: ["/api/impact-metrics/summary"],
    retry: 1,
  });
  
  // Extrahiere Metriktypen für die Tabs
  const metricTypes = metrics 
    ? Array.from(new Set(metrics.map(metric => metric.metricType)))
    : [];
  
  // Berechne Gesamtwerte für die Übersicht
  const totalMetricsCount = metrics?.length || 0;
  const metricsWithGoals = metrics?.filter(m => m.goal !== null) || [];
  const completedGoals = metricsWithGoals.filter(m => m.value >= (m.goal || 0));
  const goalCompletionRate = metricsWithGoals.length > 0 
    ? Math.round((completedGoals.length / metricsWithGoals.length) * 100)
    : 0;
  
  // Behandle Ladefehler
  if (metricsError || summaryError) {
    toast({
      title: "Fehler beim Laden der Metriken",
      description: "Die Daten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
      variant: "destructive",
    });
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Wirkungsdashboard</h2>
        <Button className="hidden sm:flex">
          <PlusCircle className="mr-2 h-4 w-4" />
          Neue Metrik
        </Button>
      </div>
      
      {/* Zusammenfassung Karten */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Erfasste Metriken
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetricsCount}</div>
            <p className="text-xs text-muted-foreground">
              Verfolgte Impact-Messgrößen
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Zielerreichung
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalCompletionRate}%</div>
            <Progress value={goalCompletionRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedGoals.length} von {metricsWithGoals.length} Zielen erreicht
            </p>
          </CardContent>
        </Card>
        
        {summaryData?.slice(0, 2).map((summary, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metricTypeNames[summary.metricType] || summary.metricType}
              </CardTitle>
              {renderIcon(summary.recentMetrics[0]?.icon || "chart", "h-4 w-4 text-muted-foreground")}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(summary.totalValue, summary.recentMetrics[0]?.unit || "count")}
              </div>
              <p className={`text-xs ${summary.changePercentage >= 0 ? "text-green-500" : "text-red-500"}`}>
                {summary.changePercentage >= 0 ? "+" : ""}{summary.changePercentage.toFixed(1)}% zum Vorjahr
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Tabs für verschiedene Metriktypen */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-4">
          <TabsTrigger value="overview">Überblick</TabsTrigger>
          {metricTypes.map(type => (
            <TabsTrigger key={type} value={type}>
              {metricTypeNames[type] || type}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {isLoadingMetrics || isLoadingSummary ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="space-y-8">
              {summaryData && summaryData.length > 0 ? (
                summaryData.map((summary, index) => {
                  const typeMetrics = metrics?.filter(m => m.metricType === summary.metricType) || [];
                  return (
                    <MetricTypeSection
                      key={summary.metricType}
                      metrics={typeMetrics}
                      title={metricTypeNames[summary.metricType] || summary.metricType}
                      showChart={index === 0} // Nur für den ersten Typ ein Diagramm anzeigen
                    />
                  );
                })
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <p className="mb-2 mt-2 text-sm text-gray-500">Keine Metriken gefunden</p>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Erste Metrik erstellen
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {metricTypes.map(type => (
              <TabsContent key={type} value={type}>
                <MetricTypeSection 
                  metrics={metrics?.filter(m => m.metricType === type) || []}
                  title={metricTypeNames[type] || type}
                  showChart={true}
                />
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>
    </div>
  );
}
