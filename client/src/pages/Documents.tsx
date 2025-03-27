import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Document, Pattern } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import FileUploader from "@/components/documents/FileUploader";
import CloudStorageModal from "@/components/modals/CloudStorageModal";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  const [patternResult, setPatternResult] = useState<Pattern | null>(null);
  const [patternDetails, setPatternDetails] = useState<any>(null);
  
  // Fetch documents
  const { 
    data: documents,
    isLoading,
    refetch
  } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  // Filter documents based on search query
  const filteredDocuments = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  // Mutation for pattern detection
  const patternMutation = useMutation({
    mutationFn: async (documentIds: number[]) => {
      setIsAnalyzing(true);
      const response = await apiRequest('POST', '/api/detect-patterns', { documentIds });
      return response as unknown as { pattern: Pattern, analysis: any };
    },
    onSuccess: (data) => {
      setPatternResult(data.pattern);
      setPatternDetails(data.analysis);
      setIsAnalyzing(false);
      toast({
        title: "Muster erkannt",
        description: `Ein neues Muster wurde erfolgreich identifiziert: ${data.pattern.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: "Fehler",
        description: "Mustererkennung fehlgeschlagen. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
      console.error("Pattern detection error:", error);
    }
  });
  
  const handleDeleteDocument = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/documents/${id}`);
      toast({
        title: "Document deleted",
        description: "The document was successfully deleted.",
      });
      refetch();
      // Remove document from selection if it was selected
      if (selectedDocuments.includes(id)) {
        setSelectedDocuments(selectedDocuments.filter(docId => docId !== id));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document.",
        variant: "destructive",
      });
    }
  };
  
  const handleToggleDocumentSelection = (id: number) => {
    if (selectedDocuments.includes(id)) {
      setSelectedDocuments(selectedDocuments.filter(docId => docId !== id));
    } else {
      setSelectedDocuments([...selectedDocuments, id]);
    }
  };
  
  const handleDetectPatterns = () => {
    if (selectedDocuments.length < 2) {
      toast({
        title: "Zu wenige Dokumente ausgewählt",
        description: "Bitte wählen Sie mindestens 2 Dokumente für die Mustererkennung aus.",
        variant: "destructive",
      });
      return;
    }
    
    patternMutation.mutate(selectedDocuments);
    setIsPatternDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dokumente</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Dokumente und Dateien</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {selectedDocuments.length >= 2 && (
            <Button 
              variant="outline" 
              className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800"
              onClick={handleDetectPatterns} 
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                  Analyse läuft...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2 text-sm">psychology</span>
                  Muster erkennen ({selectedDocuments.length})
                </>
              )}
            </Button>
          )}
          <Button onClick={() => setIsModalOpen(true)}>
            <span className="material-icons mr-2 text-sm">cloud</span>
            Cloud Speicher
          </Button>
          <Button variant="default">
            <span className="material-icons mr-2 text-sm">upload_file</span>
            Hochladen
          </Button>
        </div>
      </div>
      
      <div className="mb-8">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <TabsList>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
            <div className="mt-4 sm:mt-0 relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-icons text-neutral-400 text-sm">search</span>
              </span>
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-icons text-4xl text-muted-foreground mb-2">search_off</span>
                <h3 className="text-lg font-medium">No documents found</h3>
                <p className="text-muted-foreground">Try adjusting your search or upload a new document</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc) => (
                  <Card 
                    key={doc.id} 
                    className={`overflow-hidden ${selectedDocuments.includes(doc.id) ? 'ring-2 ring-amber-500 dark:ring-amber-400' : ''}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`select-doc-${doc.id}`}
                            checked={selectedDocuments.includes(doc.id)}
                            onCheckedChange={() => handleToggleDocumentSelection(doc.id)}
                          />
                          <CardTitle className="text-lg">{doc.title}</CardTitle>
                        </div>
                        <span className={`material-icons text-${doc.fileType === 'pdf' ? 'red' : doc.fileType === 'docx' ? 'blue' : 'gray'}-500`}>
                          {doc.fileType === 'pdf' ? 'picture_as_pdf' : doc.fileType === 'docx' ? 'description' : 'insert_drive_file'}
                        </span>
                      </div>
                      <CardDescription>
                        {doc.fileSize / 1000000} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {doc.description || "Keine Beschreibung vorhanden"}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {doc.tags?.map((tag, i) => (
                          <Badge key={i} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <Button size="sm" variant="outline">
                          <span className="material-icons mr-1 text-sm">visibility</span>
                          Anzeigen
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteDocument(doc.id)}>
                          <span className="material-icons mr-1 text-sm">delete</span>
                          Löschen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent">
            <div className="text-center py-12">
              <span className="material-icons text-4xl text-muted-foreground mb-2">history</span>
              <h3 className="text-lg font-medium">Recent Documents</h3>
              <p className="text-muted-foreground">Recently accessed documents will appear here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="shared">
            <div className="text-center py-12">
              <span className="material-icons text-4xl text-muted-foreground mb-2">folder_shared</span>
              <h3 className="text-lg font-medium">Shared Documents</h3>
              <p className="text-muted-foreground">Documents shared with you will appear here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="archived">
            <div className="text-center py-12">
              <span className="material-icons text-4xl text-muted-foreground mb-2">archive</span>
              <h3 className="text-lg font-medium">Archived Documents</h3>
              <p className="text-muted-foreground">Archived documents will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>
        <FileUploader onUploadComplete={() => refetch()} />
      </div>
      
      <CloudStorageModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
      {/* Dialog für Mustererkennung */}
      <Dialog open={isPatternDialogOpen} onOpenChange={setIsPatternDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isAnalyzing ? (
                <div className="flex items-center">
                  <span className="material-icons animate-spin mr-2">refresh</span>
                  Suche nach Mustern in Dokumenten...
                </div>
              ) : patternResult ? (
                <div className="flex items-center text-amber-700 dark:text-amber-400">
                  <span className="material-icons mr-2">psychology</span>
                  Muster erkannt: {patternResult.name}
                </div>
              ) : (
                "Mustererkennung"
              )}
            </DialogTitle>
            <DialogDescription>
              {isAnalyzing ? (
                "Dokumentenanalyse läuft. Dies kann einige Momente dauern..."
              ) : patternResult ? (
                `Basierend auf der Analyse von ${selectedDocuments.length} Dokumenten wurde ein Muster identifiziert.`
              ) : (
                "Dokumente werden auf wiederkehrende Muster untersucht."
              )}
            </DialogDescription>
          </DialogHeader>
          
          {isAnalyzing && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-center text-muted-foreground">
                Die ausgewählten Dokumente werden mit Hilfe von KI auf übereinstimmende Muster und Trends analysiert...
              </p>
            </div>
          )}
          
          {!isAnalyzing && patternResult && patternDetails && (
            <div className="space-y-6 py-4">
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md">
                <h3 className="font-medium mb-2">Erkanntes Muster</h3>
                <p>{patternResult.description}</p>
              </div>
              
              {patternDetails.geographicScope && (
                <div>
                  <h3 className="font-medium mb-2">Geografische Verteilung</h3>
                  <p className="text-muted-foreground">{patternDetails.geographicScope}</p>
                </div>
              )}
              
              {patternDetails.temporalTrends && (
                <div>
                  <h3 className="font-medium mb-2">Zeitliche Entwicklung</h3>
                  <p className="text-muted-foreground">{patternDetails.temporalTrends}</p>
                </div>
              )}
              
              {patternDetails.relatedLaws && (
                <div>
                  <h3 className="font-medium mb-2">Relevante Rechtsgrundlagen</h3>
                  <p className="text-muted-foreground">{patternDetails.relatedLaws}</p>
                </div>
              )}
              
              {patternDetails.recommendedActions && (
                <Alert>
                  <span className="material-icons mr-2">tips_and_updates</span>
                  <AlertTitle>Empfohlene Maßnahmen</AlertTitle>
                  <AlertDescription>{patternDetails.recommendedActions}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            {!isAnalyzing && patternResult && (
              <Button 
                variant="outline" 
                onClick={() => setIsPatternDialogOpen(false)}
              >
                Schließen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
