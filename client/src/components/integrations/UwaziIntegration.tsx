import { useState, useEffect } from 'react';
import { useQuery, useMutation, type UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Document } from '@shared/schema';

interface UwaziDocument {
  _id: string;
  title: string;
  file?: {
    filename: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
  sharedId?: string;
  language?: string;
  metadata?: Record<string, any>;
  creationDate?: string;
  template?: string;
}

interface UwaziSearchResult {
  documents: UwaziDocument[];
  totalPages: number;
  totalCount: number;
}

interface UwaziConnectionStatus {
  connected: boolean;
  baseUrl: string;
  hasApiKey: boolean;
  hasCredentials: boolean;
}

interface UwaziConfigFormData {
  baseUrl: string;
  apiKey: string;
  username: string;
  password: string;
  useApiKey: boolean;
}

export default function UwaziIntegration() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isTestingConfig, setIsTestingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [configFormData, setConfigFormData] = useState<UwaziConfigFormData>({
    baseUrl: '',
    apiKey: '',
    username: '',
    password: '',
    useApiKey: true
  });

  // Fetch Uwazi connection status
  const { 
    data: connectionStatus,
    isLoading: isLoadingStatus
  } = useQuery<unknown, Error, UwaziConnectionStatus>({
    queryKey: ['/api/integrations/uwazi/status']
  });

  // Effect to handle showing the config dialog when needed
  useEffect(() => {
    if (connectionStatus && !connectionStatus.connected) {
      setIsConfigDialogOpen(true);
    }
  }, [connectionStatus]);

  // Effect to handle error cases
  useEffect(() => {
    const handleError = () => {
      setIsConfigDialogOpen(true);
    };

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Search Uwazi documents
  const {
    data: searchResult,
    isLoading: isSearching,
    refetch: refetchSearch
  } = useQuery<unknown, Error, UwaziSearchResult>({
    queryKey: ['/api/integrations/uwazi/search', searchQuery, currentPage],
    enabled: !!connectionStatus?.connected && searchQuery !== '',
  });

  // Import selected documents mutation
  const importMutation = useMutation({
    mutationFn: async (documentIds: string[]) => {
      return apiRequest('POST', '/api/integrations/uwazi/import', { documentIds });
    },
    onSuccess: (data) => {
      toast({
        title: 'Import erfolgreich',
        description: `${data.length} Dokumente wurden erfolgreich importiert.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedDocuments([]);
    },
    onError: () => {
      toast({
        title: 'Import fehlgeschlagen',
        description: 'Die Dokumente konnten nicht importiert werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    }
  });

  // Configure Uwazi connection mutation
  const configMutation = useMutation({
    mutationFn: async (config: Partial<UwaziConfigFormData>) => {
      const configToSend = { ...config };
      
      // If using API key, remove username and password
      if (config.useApiKey) {
        delete configToSend.username;
        delete configToSend.password;
      } else {
        delete configToSend.apiKey;
      }
      
      // Remove useApiKey flag as it's not needed by the backend
      delete configToSend.useApiKey;
      
      return apiRequest('POST', '/api/integrations/uwazi/configure', configToSend);
    },
    onSuccess: () => {
      toast({
        title: 'Konfiguration gespeichert',
        description: 'Die Uwazi-Integration wurde erfolgreich konfiguriert.',
      });
      setIsConfigDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/uwazi/status'] });
    },
    onError: () => {
      toast({
        title: 'Konfiguration fehlgeschlagen',
        description: 'Die Uwazi-Integration konnte nicht konfiguriert werden. Bitte überprüfen Sie Ihre Eingaben.',
        variant: 'destructive',
      });
    }
  });

  // Test Uwazi connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (config: Partial<UwaziConfigFormData>) => {
      const configToTest = { ...config };
      
      // Same logic as in configMutation
      if (config.useApiKey) {
        delete configToTest.username;
        delete configToTest.password;
      } else {
        delete configToTest.apiKey;
      }
      
      delete configToTest.useApiKey;
      
      return apiRequest('POST', '/api/integrations/uwazi/test', configToTest);
    },
    onSuccess: () => {
      setConfigStatus('success');
      setIsTestingConfig(false);
    },
    onError: () => {
      setConfigStatus('error');
      setIsTestingConfig(false);
    }
  });

  // Handle document selection toggle
  const toggleDocumentSelection = (id: string) => {
    if (selectedDocuments.includes(id)) {
      setSelectedDocuments(selectedDocuments.filter(docId => docId !== id));
    } else {
      setSelectedDocuments([...selectedDocuments, id]);
    }
  };

  // Handle import of selected documents
  const handleImportDocuments = () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: 'Keine Dokumente ausgewählt',
        description: 'Bitte wählen Sie mindestens ein Dokument zum Importieren aus.',
        variant: 'destructive',
      });
      return;
    }

    importMutation.mutate(selectedDocuments);
  };

  // Handle config form input changes
  const handleConfigInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfigFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset status when form is changed
    setConfigStatus('idle');
  };

  // Handle authentication method toggle
  const handleAuthMethodToggle = (useApiKey: boolean) => {
    setConfigFormData(prev => ({
      ...prev,
      useApiKey
    }));
    
    // Reset status when auth method is changed
    setConfigStatus('idle');
  };

  // Handle form submission for Uwazi configuration
  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    configMutation.mutate(configFormData);
  };

  // Handle testing of Uwazi configuration
  const handleTestConnection = () => {
    setIsTestingConfig(true);
    setConfigStatus('idle');
    testConnectionMutation.mutate(configFormData);
  };

  // Function to handle search
  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      toast({
        title: 'Suchanfrage leer',
        description: 'Bitte geben Sie einen Suchbegriff ein.',
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentPage(1);
    refetchSearch();
  };

  // Extract mimetype icon
  const getMimetypeIcon = (mimetype?: string, filename?: string) => {
    if (!mimetype && !filename) return 'insert_drive_file';
    
    if (mimetype?.includes('pdf') || filename?.endsWith('.pdf')) return 'picture_as_pdf';
    if (mimetype?.includes('word') || filename?.endsWith('.docx') || filename?.endsWith('.doc')) return 'description';
    if (mimetype?.includes('image')) return 'image';
    if (mimetype?.includes('text')) return 'text_snippet';
    
    return 'insert_drive_file';
  };

  // Get mimetype color
  const getMimetypeColor = (mimetype?: string, filename?: string) => {
    if (!mimetype && !filename) return 'gray';
    
    if (mimetype?.includes('pdf') || filename?.endsWith('.pdf')) return 'red';
    if (mimetype?.includes('word') || filename?.endsWith('.docx') || filename?.endsWith('.doc')) return 'blue';
    if (mimetype?.includes('image')) return 'green';
    if (mimetype?.includes('text')) return 'purple';
    
    return 'gray';
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unbekannt';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Uwazi Integration</h2>
          <p className="text-muted-foreground">
            Verbinden Sie sich mit Ihrer Uwazi-Instanz, um Dokumente zu durchsuchen und zu importieren
          </p>
        </div>
        
        <Button onClick={() => setIsConfigDialogOpen(true)}>
          <span className="material-icons mr-2 text-sm">settings</span>
          Konfigurieren
        </Button>
      </div>
      
      {isLoadingStatus ? (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ) : connectionStatus?.connected ? (
        <>
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <span className="material-icons mr-2 text-green-600 dark:text-green-400">check_circle</span>
            <AlertTitle>Verbunden mit Uwazi</AlertTitle>
            <AlertDescription>
              Ihre Anwendung ist erfolgreich mit der Uwazi-Instanz <span className="font-medium">{connectionStatus.baseUrl}</span> verbunden.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-neutral-400 text-sm">search</span>
                </span>
                <Input
                  placeholder="Dokumente in Uwazi durchsuchen..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                    Suche...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2 text-sm">search</span>
                    Suchen
                  </>
                )}
              </Button>
              {selectedDocuments.length > 0 && (
                <Button 
                  variant="default" 
                  onClick={handleImportDocuments}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <>
                      <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                      Importiere...
                    </>
                  ) : (
                    <>
                      <span className="material-icons mr-2 text-sm">download</span>
                      {selectedDocuments.length} Dokumente importieren
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <Tabs defaultValue="search" className="w-full">
              <TabsList>
                <TabsTrigger value="search">Suchergebnisse</TabsTrigger>
                <TabsTrigger value="recent">Kürzlich angesehen</TabsTrigger>
                <TabsTrigger value="collections">Sammlungen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="pt-4">
                {isSearching ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4 mb-4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : searchResult?.documents && searchResult.documents.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        {searchResult.totalCount} Dokumente gefunden
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResult.documents.map((doc) => (
                        <Card 
                          key={doc._id} 
                          className={`overflow-hidden ${selectedDocuments.includes(doc._id) ? 'ring-2 ring-amber-500 dark:ring-amber-400' : ''}`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id={`select-doc-${doc._id}`}
                                  checked={selectedDocuments.includes(doc._id)}
                                  onCheckedChange={() => toggleDocumentSelection(doc._id)}
                                />
                                <CardTitle className="text-base line-clamp-1">{doc.title}</CardTitle>
                              </div>
                              <span className={`material-icons text-${getMimetypeColor(doc.file?.mimetype, doc.file?.filename)}-500`}>
                                {getMimetypeIcon(doc.file?.mimetype, doc.file?.filename)}
                              </span>
                            </div>
                            <CardDescription className="line-clamp-1">
                              {formatFileSize(doc.file?.size)} • {doc.creationDate ? new Date(doc.creationDate).toLocaleDateString() : 'Unbekanntes Datum'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1 mb-4">
                              {doc.metadata?.keywords && Array.isArray(doc.metadata.keywords) && (
                                doc.metadata.keywords.map((keyword: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {typeof keyword === 'string' ? keyword : keyword.label || 'Tag'}
                                  </Badge>
                                ))
                              )}
                              {doc.template && (
                                <Badge variant="outline" className="text-xs">
                                  {doc.template}
                                </Badge>
                              )}
                            </div>
                            <div className="flex justify-end">
                              <Button size="sm" variant="outline" onClick={() => toggleDocumentSelection(doc._id)}>
                                {selectedDocuments.includes(doc._id) ? (
                                  <>
                                    <span className="material-icons mr-1 text-sm">check</span>
                                    Ausgewählt
                                  </>
                                ) : (
                                  <>
                                    <span className="material-icons mr-1 text-sm">add</span>
                                    Auswählen
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {searchResult.totalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={currentPage === 1 || isSearching}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          >
                            <span className="material-icons text-sm">chevron_left</span>
                          </Button>
                          <div className="flex h-9 items-center justify-center px-4 rounded-md border">
                            Seite {currentPage} von {searchResult.totalPages}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={currentPage === searchResult.totalPages || isSearching}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, searchResult.totalPages))}
                          >
                            <span className="material-icons text-sm">chevron_right</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : searchQuery !== '' ? (
                  <div className="text-center py-12">
                    <span className="material-icons text-4xl text-muted-foreground mb-2">search_off</span>
                    <h3 className="text-lg font-medium">Keine Dokumente gefunden</h3>
                    <p className="text-muted-foreground">Versuchen Sie es mit anderen Suchbegriffen</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-icons text-4xl text-muted-foreground mb-2">manage_search</span>
                    <h3 className="text-lg font-medium">Dokumente suchen</h3>
                    <p className="text-muted-foreground">Geben Sie einen Suchbegriff ein, um Dokumente in Uwazi zu finden</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent">
                <div className="text-center py-12">
                  <span className="material-icons text-4xl text-muted-foreground mb-2">history</span>
                  <h3 className="text-lg font-medium">Kürzlich angesehene Dokumente</h3>
                  <p className="text-muted-foreground">Hier werden Ihre kürzlich angesehenen Dokumente angezeigt</p>
                </div>
              </TabsContent>
              
              <TabsContent value="collections">
                <div className="text-center py-12">
                  <span className="material-icons text-4xl text-muted-foreground mb-2">collections_bookmark</span>
                  <h3 className="text-lg font-medium">Uwazi-Sammlungen</h3>
                  <p className="text-muted-foreground">Hier werden Ihre Uwazi-Sammlungen angezeigt</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      ) : (
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <span className="material-icons mr-2 text-amber-600 dark:text-amber-400">info</span>
          <AlertTitle>Uwazi-Integration nicht konfiguriert</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>Sie müssen die Integration mit Ihrer Uwazi-Instanz konfigurieren, um Dokumente zu importieren.</p>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setIsConfigDialogOpen(true)}
            >
              <span className="material-icons mr-2 text-sm">settings</span>
              Jetzt konfigurieren
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Uwazi Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Uwazi-Integration konfigurieren</DialogTitle>
            <DialogDescription>
              Geben Sie die Verbindungsdaten für Ihre Uwazi-Instanz ein. Die Daten werden sicher gespeichert.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleConfigSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Uwazi-URL</Label>
                <Input
                  id="baseUrl"
                  name="baseUrl"
                  placeholder="https://ihre-uwazi-instanz.org"
                  value={configFormData.baseUrl}
                  onChange={handleConfigInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Die vollständige URL Ihrer Uwazi-Instanz, z.B. https://uwazi.yourdomain.org
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Authentifizierungsmethode</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    type="button"
                    variant={configFormData.useApiKey ? "default" : "outline"}
                    className="flex-1 justify-start"
                    onClick={() => handleAuthMethodToggle(true)}
                  >
                    <span className="material-icons mr-2 text-sm">vpn_key</span>
                    API-Schlüssel
                  </Button>
                  <Button 
                    type="button"
                    variant={!configFormData.useApiKey ? "default" : "outline"}
                    className="flex-1 justify-start"
                    onClick={() => handleAuthMethodToggle(false)}
                  >
                    <span className="material-icons mr-2 text-sm">person</span>
                    Benutzerdaten
                  </Button>
                </div>
              </div>
              
              {configFormData.useApiKey ? (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API-Schlüssel</Label>
                  <Input
                    id="apiKey"
                    name="apiKey"
                    type="password"
                    placeholder="Ihr Uwazi API-Schlüssel"
                    value={configFormData.apiKey}
                    onChange={handleConfigInputChange}
                    required={configFormData.useApiKey}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Benutzername</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="Ihr Uwazi-Benutzername"
                      value={configFormData.username}
                      onChange={handleConfigInputChange}
                      required={!configFormData.useApiKey}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Ihr Uwazi-Passwort"
                      value={configFormData.password}
                      onChange={handleConfigInputChange}
                      required={!configFormData.useApiKey}
                    />
                  </div>
                </>
              )}
              
              {configStatus === 'success' && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <span className="material-icons mr-2 text-green-600 dark:text-green-400">check_circle</span>
                  <AlertTitle>Verbindung erfolgreich</AlertTitle>
                  <AlertDescription>
                    Die Verbindung zur Uwazi-Instanz konnte erfolgreich hergestellt werden.
                  </AlertDescription>
                </Alert>
              )}
              
              {configStatus === 'error' && (
                <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <span className="material-icons mr-2 text-red-600 dark:text-red-400">error</span>
                  <AlertTitle>Verbindungsfehler</AlertTitle>
                  <AlertDescription>
                    Die Verbindung zur Uwazi-Instanz konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Eingaben.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={
                  isTestingConfig || 
                  configMutation.isPending || 
                  !configFormData.baseUrl || 
                  (configFormData.useApiKey && !configFormData.apiKey) ||
                  (!configFormData.useApiKey && (!configFormData.username || !configFormData.password))
                }
                onClick={handleTestConnection}
              >
                {isTestingConfig ? (
                  <>
                    <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                    Teste...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2 text-sm">link</span>
                    Verbindung testen
                  </>
                )}
              </Button>
              <Button 
                type="submit" 
                disabled={
                  configMutation.isPending || 
                  !configFormData.baseUrl || 
                  (configFormData.useApiKey && !configFormData.apiKey) ||
                  (!configFormData.useApiKey && (!configFormData.username || !configFormData.password))
                }
              >
                {configMutation.isPending ? (
                  <>
                    <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                    Speichern...
                  </>
                ) : (
                  'Speichern'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
