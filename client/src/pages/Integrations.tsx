import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UwaziIntegration from "@/components/integrations/UwaziIntegration";

export default function Integrations() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrationen</h1>
        <p className="text-muted-foreground mt-1">
          Verbinden Sie die Plattform mit externen Datenquellen und Diensten
        </p>
      </div>
      
      <Tabs defaultValue="uwazi" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="uwazi">Uwazi</TabsTrigger>
          <TabsTrigger value="other" disabled>Weitere (demnächst verfügbar)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="uwazi">
          <UwaziIntegration />
        </TabsContent>
        
        <TabsContent value="other">
          <div className="p-4 text-center text-muted-foreground">
            Weitere Integrationen werden in zukünftigen Updates verfügbar sein.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
