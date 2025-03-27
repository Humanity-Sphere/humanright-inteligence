import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CloudStorageModal from "@/components/modals/CloudStorageModal";

interface FileUploaderProps {
  onUploadComplete?: () => void;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [files, setFiles] = useState<{ file: File; progress: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isCloudStorageModalOpen, setIsCloudStorageModalOpen] = useState(false);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });
  
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Upload each file with simulated progress
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simulate upload progress for demo purposes
        for (let progress = 0; progress <= 100; progress += 10) {
          setFiles(prev => 
            prev.map((f, index) => 
              index === i ? { ...f, progress } : f
            )
          );
          await new Promise(r => setTimeout(r, 200));
        }
        
        // In a real implementation, we would use FormData to upload the file
        // and track progress with XMLHttpRequest
        
        // Create document in the backend
        await apiRequest("POST", "/api/documents", {
          title: file.file.name,
          description: "",
          fileType: file.file.name.split('.').pop()?.toLowerCase() || "unknown",
          fileSize: file.file.size,
          filePath: `/uploads/${file.file.name}`,
          source: "local",
          tags: []
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      toast({
        title: "Upload successful",
        description: `${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`
      });
      
      setFiles([]);
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="p-6">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer 
          ${isDragActive ? "border-primary bg-primary/5" : "border-neutral-300 dark:border-neutral-600"} 
          ${isDragActive ? "bg-neutral-50 dark:bg-neutral-700/50" : "hover:bg-neutral-50 dark:hover:bg-neutral-700/50"}
        `}
      >
        <span className="material-icons text-neutral-400 text-4xl">cloud_upload</span>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">
          Drag & drop files here or <span className="text-primary font-medium">browse</span>
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Supports PDF, DOCX, TXT, JPG (max 50MB)
        </p>
        <input {...getInputProps()} />
      </div>
      
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Files to upload ({files.length})</h3>
          
          {files.map((file, index) => (
            <div key={index} className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-md">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="material-icons text-neutral-500 mr-2">
                    {file.file.type.includes('image') ? 'image' : 'description'}
                  </span>
                  <span className="text-sm truncate max-w-xs">{file.file.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-neutral-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button 
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                    disabled={uploading}
                  >
                    <span className="material-icons text-neutral-500 text-sm">close</span>
                  </button>
                </div>
              </div>
              
              <Progress value={file.progress} className="h-1" />
            </div>
          ))}
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                  Uploading...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2 text-sm">upload</span>
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-4 flex items-center">
        <span className="material-icons text-primary mr-2">cloud</span>
        <span className="text-sm text-neutral-600 dark:text-neutral-300">Import from cloud storage</span>
      </div>
      
      <div className="mt-2 flex space-x-2">
        <button 
          onClick={() => setIsCloudStorageModalOpen(true)}
          className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 text-sm py-2 px-3 rounded"
        >
          <span className="material-icons mr-1 text-sm">cloud</span> Google Drive
        </button>
        <button 
          onClick={() => setIsCloudStorageModalOpen(true)}
          className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 text-sm py-2 px-3 rounded"
        >
          <span className="material-icons mr-1 text-sm">cloud</span> OneDrive
        </button>
      </div>
      
      {/* Cloud Storage Modal */}
      <CloudStorageModal
        isOpen={isCloudStorageModalOpen}
        onClose={() => setIsCloudStorageModalOpen(false)}
      />
    </div>
  );
}
