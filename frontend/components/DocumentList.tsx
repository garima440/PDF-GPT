import { useState, useEffect } from "react";
import { AlertCircle, FileText, Trash2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Document {
  file_name: string;
  file_url: string;
}

interface DocumentListProps {
  refreshTrigger: boolean;
  onDelete: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ refreshTrigger, onDelete }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/list');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError("Failed to fetch documents. Please try again later.");
      console.error("Error fetching documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const deleteDocument = async (filename: string) => {
    try {
      const response = await fetch(`/api/delete/${filename}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await response.json();
      onDelete();
      setDocuments((docs) => docs.filter((doc) => doc.file_name !== filename));
    } catch (err) {
      setError("Failed to delete document. Please try again.");
      console.error("Error deleting document:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Documents</h2>
        <div className="px-2 py-1 rounded-full bg-purple-600/20 border border-purple-500/20">
          <span className="text-xs text-purple-400">{documents.length} files</span>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-600/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {documents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {documents.map((doc) => (
            <div 
              key={doc.file_name}
              className="group relative p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 hover:border-purple-500/30 transition-all duration-200"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-md bg-purple-600/20">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">PDF Document</p>
                </div>
                <button
                  onClick={() => deleteDocument(doc.file_name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700/50 transition-all duration-200"
                  aria-label="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;