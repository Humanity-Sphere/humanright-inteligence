import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface CloudStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CloudStorageModal({ isOpen, onClose }: CloudStorageModalProps) {
  const handleConnect = (provider: string) => {
    // In a real implementation, this would initiate OAuth flow
    toast({
      title: "Verbindung initiiert",
      description: `Verbindung zu ${provider} wird hergestellt. Diese Funktion ist im Demonstrationsmodus.`
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cloud-Speicher verbinden</DialogTitle>
          <DialogDescription>
            Wählen Sie einen Cloud-Speicheranbieter, um Ihr Konto für eine nahtlose Dokumentenintegration zu verbinden.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 my-6">
          <button 
            onClick={() => handleConnect("Google Drive")}
            className="w-full flex items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            <span className="material-icons mr-3 text-blue-500">cloud</span>
            <span>Google Drive verbinden</span>
          </button>
          
          <button 
            onClick={() => handleConnect("OneDrive")}
            className="w-full flex items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            <span className="material-icons mr-3 text-blue-700">cloud</span>
            <span>OneDrive verbinden</span>
          </button>
          
          <button 
            onClick={() => handleConnect("Dropbox")}
            className="w-full flex items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            <span className="material-icons mr-3 text-blue-400">cloud</span>
            <span>Dropbox verbinden</span>
          </button>
        </div>
        
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          <p>Ihre Dateien bleiben sicher und privat. Wir greifen nur auf die Dateien zu, die Sie ausdrücklich mit unserer Plattform teilen.</p>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Abbrechen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
