import { useQuery, useMutation } from "@tanstack/react-query";
import { Document, InsertDocument } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export function useDocuments() {
  // Fetch all documents
  const { 
    data: documents,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  // Create document mutation
  const createDocument = useMutation({
    mutationFn: async (document: Omit<InsertDocument, "userId">) => {
      const response = await apiRequest("POST", "/api/documents", document);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document created",
        description: "The document was created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create document",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });
  
  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: "The document was deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete document",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });
  
  return {
    documents,
    isLoading,
    isError,
    error,
    refetch,
    createDocument,
    deleteDocument
  };
}
