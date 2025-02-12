import { AlertCircle, FileText, Trash2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface Document {
  file_name: string;
  file_url: string;
}

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  onDelete: () => void;
  onLastDocumentDeleted?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  error,
  fetchDocuments,
  onDelete,
  onLastDocumentDeleted
}) => {
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const router = useRouter();

  const deleteDocument = async (filename: string) => {
    setDeletingFiles(prev => new Set(prev).add(filename));
    try {
      const response = await fetch(`/api/delete/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      // Optimistically remove the document from the list
      onDelete(); // Notify parent to re-fetch
    } catch (err) {
      console.error("Error deleting document:", err);
      // Consider displaying an error message within this component if necessary
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(filename);
        return newSet;
      });
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
                  disabled={deletingFiles.has(doc.file_name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-50"
                  aria-label="Delete document"
                >
                  {deletingFiles.has(doc.file_name) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
