import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function LegalResources() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your document is being prepared for download."
    });
  };
  
  const handleAskAI = () => {
    toast({
      title: "AI Assistant",
      description: "The AI Legal Assistant feature is in development."
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Legal Resources</h1>
          <p className="text-muted-foreground">Access human rights laws, precedents and templates</p>
        </div>
        <div className="relative mt-4 md:mt-0 w-full md:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-icons text-neutral-400 text-sm">search</span>
          </span>
          <Input
            placeholder="Search legal resources..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="international" className="w-full mb-8">
        <TabsList>
          <TabsTrigger value="international">International Law</TabsTrigger>
          <TabsTrigger value="regional">Regional Systems</TabsTrigger>
          <TabsTrigger value="templates">Legal Templates</TabsTrigger>
          <TabsTrigger value="cases">Case Studies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="international" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Universal Declaration of Human Rights</CardTitle>
                  <span className="material-icons text-primary">description</span>
                </div>
                <CardDescription>United Nations • 1948</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">The foundation document establishing human rights standards and norms. Adopted by the UN General Assembly in 1948.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    UN System
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    Foundational
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    All Rights
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>International Covenant on Civil and Political Rights</CardTitle>
                  <span className="material-icons text-primary">description</span>
                </div>
                <CardDescription>United Nations • 1966</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Treaty committing nations to protect individuals' civil and political rights, including the right to life, freedom of religion and speech.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    UN Treaty
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    Civil Rights
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Convention on the Rights of the Child</CardTitle>
                  <span className="material-icons text-primary">description</span>
                </div>
                <CardDescription>United Nations • 1989</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Human rights treaty setting out the civil, political, economic, social, health and cultural rights of children.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    UN Treaty
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    Children
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="regional" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>European Convention on Human Rights</CardTitle>
                  <span className="material-icons text-primary">description</span>
                </div>
                <CardDescription>Council of Europe • 1950</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">International convention to protect human rights and political freedoms in Europe.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    European
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    Treaty
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>American Convention on Human Rights</CardTitle>
                  <span className="material-icons text-primary">description</span>
                </div>
                <CardDescription>Organization of American States • 1969</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">International human rights instrument for the Americas focusing on civil and political rights.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    Americas
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    Treaty
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>African Charter on Human and Peoples' Rights</CardTitle>
                  <span className="material-icons text-primary">description</span>
                </div>
                <CardDescription>African Union • 1981</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">International human rights instrument intended to promote and protect human rights and basic freedoms in Africa.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    African
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    Treaty
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Legal Brief Template</CardTitle>
                  <span className="material-icons text-secondary">description</span>
                </div>
                <CardDescription>Editable Document • DOCX</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Standard format for legal briefs with sections for facts, legal issues, arguments, and conclusions.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                    Template
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                    Legal
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">edit</span>
                  Edit
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Human Rights Complaint Form</CardTitle>
                  <span className="material-icons text-secondary">description</span>
                </div>
                <CardDescription>Editable Document • DOCX</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Template for filing human rights complaints with international bodies and national institutions.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                    Template
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                    Complaint
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">edit</span>
                  Edit
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Affidavit Template</CardTitle>
                  <span className="material-icons text-secondary">description</span>
                </div>
                <CardDescription>Editable Document • DOCX</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Standard format for sworn statements with proper legal terminology and oath clauses.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                    Template
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                    Testimony
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">edit</span>
                  Edit
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cases" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Velasquez Rodriguez v. Honduras</CardTitle>
                  <span className="material-icons text-purple-600">gavel</span>
                </div>
                <CardDescription>Inter-American Court • 1988</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Landmark decision on forced disappearances and state obligations to prevent human rights violations.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                    Case Study
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                    Americas
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>S.A.S. v. France</CardTitle>
                  <span className="material-icons text-purple-600">gavel</span>
                </div>
                <CardDescription>European Court of Human Rights • 2014</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Case on religious freedom and the ban on face coverings in public spaces in France.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                    Case Study
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                    Europe
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Social and Economic Rights Action Center v. Nigeria</CardTitle>
                  <span className="material-icons text-purple-600">gavel</span>
                </div>
                <CardDescription>African Commission • 2001</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Case regarding environmental damage in Ogoniland and violations of economic, social and cultural rights.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                    Case Study
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                    Africa
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
                <Button>
                  <span className="material-icons mr-1 text-sm">visibility</span>
                  View
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Legal Assistant</CardTitle>
            <CardDescription>Get guidance on legal questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg mb-4">
              <p className="text-sm mb-2">Sample questions:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-neutral-600 dark:text-neutral-300">
                <li>What international treaties protect the right to clean water?</li>
                <li>How can I document human rights violations for a UN complaint?</li>
                <li>What are the elements of a successful asylum claim?</li>
              </ul>
            </div>
            <div className="flex space-x-2">
              <Input placeholder="Ask a legal question..." className="flex-1" />
              <Button onClick={handleAskAI}>
                <span className="material-icons mr-1 text-sm">smart_toy</span>
                Ask
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              AI responses are for informational purposes only and do not constitute legal advice
            </p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Legal Research Guide</CardTitle>
            <CardDescription>Effective strategies for human rights research</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary mr-3">
                  <span className="material-icons">search</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Find Relevant Treaties</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Identify international and regional treaties applicable to your specific case
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary mr-3">
                  <span className="material-icons">gavel</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Research Case Law</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Examine prior decisions from international courts and treaty bodies
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 mr-3">
                  <span className="material-icons">published_with_changes</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Document Violations</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Collect evidence following established protocols for documentation
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 mr-3">
                  <span className="material-icons">lightbulb</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Develop Legal Strategy</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Create comprehensive advocacy plans using multiple legal mechanisms
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleDownload}>
              Download Complete Guide
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
