import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { useDocuments } from "@/hooks/useDocuments";
import { Badge } from "@/components/ui/badge";

interface ContentTypeProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

function ContentType({ id, name, description, icon, isSelected, onClick }: ContentTypeProps) {
  return (
    <div className="relative">
      <input type="radio" id={id} name="content-type" className="hidden peer" checked={isSelected} onChange={onClick} />
      <label
        htmlFor={id}
        className={`
          block p-4 bg-neutral-50 dark:bg-neutral-700 border rounded-lg cursor-pointer
          hover:bg-neutral-100 dark:hover:bg-neutral-600
          ${isSelected 
            ? "border-primary border-2" 
            : "border-neutral-200 dark:border-neutral-600"}
        `}
      >
        <div className="flex items-center">
          <span className="material-icons text-primary mr-3">{icon}</span>
          <div>
            <h4 className="font-medium">{name}</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
          </div>
        </div>
      </label>
    </div>
  );
}

export default function ContentGenerator() {
  const [contentType, setContentType] = useState("report");
  const [title, setTitle] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [tone, setTone] = useState("formal");
  const [instructions, setInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  
  const { data: documents } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  const handleGenerate = async () => {
    if (!title) {
      toast({
        title: "Titel fehlt",
        description: "Bitte geben Sie einen Titel für Ihren Inhalt ein",
        variant: "destructive"
      });
      return;
    }
    
    setGenerating(true);
    setGeneratedContent(null);
    
    try {
      const response = await apiRequest("POST", "/api/content/generate", {
        title,
        type: contentType,
        tone,
        instructions,
        dataSources: selectedDocuments.map(doc => doc.title)
      });
      
      const data = await response.json();
      setGeneratedContent(data.text);
      
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      
      toast({
        title: "Inhalt generiert",
        description: "Ihr Inhalt wurde erfolgreich generiert"
      });
    } catch (error) {
      toast({
        title: "Generierung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Es gab einen Fehler bei der Generierung Ihres Inhalts",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  
  const addDocument = (document: Document) => {
    if (!selectedDocuments.find(doc => doc.id === document.id)) {
      setSelectedDocuments([...selectedDocuments, document]);
    }
  };
  
  const removeDocument = (documentId: number) => {
    setSelectedDocuments(selectedDocuments.filter(doc => doc.id !== documentId));
  };
  
  const saveContent = async () => {
    if (!generatedContent) return;
    
    try {
      await apiRequest("PATCH", `/api/content/${generatedContent}`, { 
        isSaved: true 
      });
      
      toast({
        title: "Inhalt gespeichert",
        description: "Ihr Inhalt wurde in Ihrer Bibliothek gespeichert"
      });
    } catch (error) {
      toast({
        title: "Speichern fehlgeschlagen",
        description: "Es gab einen Fehler beim Speichern Ihres Inhalts",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h3 className="font-medium mb-3">Inhaltstyp</h3>
          <div className="space-y-3">
            <ContentType
              id="type-report"
              name="Bericht"
              description="Formelles Dokument mit Erkenntnissen und Empfehlungen"
              icon="description"
              isSelected={contentType === "report"}
              onClick={() => setContentType("report")}
            />
            
            <ContentType
              id="type-social"
              name="Social Media"
              description="Beiträge für Twitter, Facebook, Instagram und LinkedIn"
              icon="share"
              isSelected={contentType === "social media"}
              onClick={() => setContentType("social media")}
            />
            
            <ContentType
              id="type-press"
              name="Pressemitteilung"
              description="Offizielle Erklärung für Medienvertreter"
              icon="newspaper"
              isSelected={contentType === "press release"}
              onClick={() => setContentType("press release")}
            />
            
            <ContentType
              id="type-legal"
              name="Rechtsdokument"
              description="Formelle juristische Einreichungen und Unterlagen"
              icon="gavel"
              isSelected={contentType === "legal document"}
              onClick={() => setContentType("legal document")}
            />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {generatedContent ? (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{title}</h3>
                <div className="flex gap-2">
                  <Button onClick={() => setGeneratedContent(null)} variant="outline">
                    <span className="material-icons mr-1 text-sm">edit</span>
                    Bearbeiten
                  </Button>
                  <Button onClick={saveContent}>
                    <span className="material-icons mr-1 text-sm">save</span>
                    Speichern
                  </Button>
                </div>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 whitespace-pre-wrap">
                {generatedContent}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="content-title" className="block text-sm font-medium mb-1">Titel</label>
                <Input
                  id="content-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                  placeholder="Geben Sie einen Titel für Ihren Inhalt ein"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Datenquellen</label>
                <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md">
                  {selectedDocuments.map((doc) => (
                    <Badge key={doc.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center">
                      {doc.title}
                      <button 
                        onClick={() => removeDocument(doc.id)}
                        className="ml-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full p-1"
                      >
                        <span className="material-icons text-sm">close</span>
                      </button>
                    </Badge>
                  ))}
                  <div className="relative inline-block">
                    <select
                      className="appearance-none bg-neutral-100 dark:bg-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-500 text-sm py-1 px-3 rounded cursor-pointer pr-8"
                      onChange={(e) => {
                        const docId = parseInt(e.target.value);
                        if (docId) {
                          const doc = documents?.find(d => d.id === docId);
                          if (doc) addDocument(doc);
                          e.target.value = ""; // Reset select after adding
                        }
                      }}
                      value=""
                    >
                      <option value="">+ Quelle hinzufügen</option>
                      {documents?.filter(doc => !selectedDocuments.find(d => d.id === doc.id)).map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.title}</option>
                      ))}
                    </select>
                    <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm pointer-events-none">
                      arrow_drop_down
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tonfall & Stil</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button 
                    variant={tone === "formal" ? "default" : "outline"}
                    onClick={() => setTone("formal")}
                    className="px-3 py-2 text-sm"
                  >
                    Formell
                  </Button>
                  <Button 
                    variant={tone === "emotional" ? "default" : "outline"}
                    onClick={() => setTone("emotional")}
                    className="px-3 py-2 text-sm"
                  >
                    Emotional
                  </Button>
                  <Button 
                    variant={tone === "analytical" ? "default" : "outline"}
                    onClick={() => setTone("analytical")}
                    className="px-3 py-2 text-sm"
                  >
                    Analytisch
                  </Button>
                  <Button 
                    variant={tone === "persuasive" ? "default" : "outline"}
                    onClick={() => setTone("persuasive")}
                    className="px-3 py-2 text-sm"
                  >
                    Überzeugend
                  </Button>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Zusätzliche Anweisungen</label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Spezifische Anforderungen oder Schwerpunktbereiche..."
                  className="h-24"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                      Generiere...
                    </>
                  ) : (
                    <>
                      <span className="material-icons mr-2">auto_awesome</span>
                      Generieren
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <span className="material-icons mr-2 text-sm">save</span>
                  Als Entwurf speichern
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
