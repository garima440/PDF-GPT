"use client";

import { useState, useEffect, useCallback } from 'react';
import InitialChatInterface from './InitialChatInterface';
import ChatInterface from './ChatInterface';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';
import { Bot, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

type DocumentType = {
  file_name: string;
  file_url: string;
}

export default function HomeContent() {
  const [currentView, setCurrentView] = useState<'initial' | 'chat' | 'upload'>('initial');
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previousView, setPreviousView] = useState<'initial' | 'chat' | 'upload'>('initial');
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [chatKey, setChatKey] = useState(0);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("HomeContent - Fetching documents...");
      const response = await fetch('/api/list');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("HomeContent - Fetched documents:", data.documents);
      if (data.documents && Array.isArray(data.documents)) {
        setDocuments(data.documents);
        setDocumentsUploaded(data.documents.length > 0);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to fetch documents. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDocumentDelete = async () => {
    await fetchDocuments();
  };

  const handleLastDocumentDeleted = () => {
    setCurrentView('initial');
    setDocumentsUploaded(false);
  };

  useEffect(() => {
    if (isFirstRender) {
      fetchDocuments();
      setIsFirstRender(false);
    }
  }, [fetchDocuments, isFirstRender]);

  useEffect(() => {
    if (currentView === 'chat') {
      checkDocuments();
    }
  }, [currentView]);

  const checkDocuments = async () => {
    try {
      console.log("HomeContent - Checking documents...");
      const response = await fetch('/api/list');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const hasDocuments = data.documents && data.documents.length > 0;
      console.log("HomeContent - Document check result:", {
        hasDocuments,
        documents: data.documents
      });
      setDocumentsUploaded(hasDocuments);
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error checking documents:', error);
    }
  };

  const handleUploadComplete = async () => {
    try {
      await fetchDocuments();
      setDocumentsUploaded(true);
      setChatKey(prev => prev + 1);
      navigateTo('chat');
    } catch (error) {
      console.error('Error handling upload complete:', error);
    }
  };

  const navigateTo = async (view: 'initial' | 'chat' | 'upload') => {
    console.log("HomeContent - Navigating to:", view);
    setPreviousView(currentView);
    if (view === 'chat') {
      await checkDocuments();
    }
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView(previousView);
  };

  const handleUploadStatusChange = (status: boolean) => {
    setIsUploading(status);
  };

  const handleChatRequest = async () => {
    await checkDocuments();
    
    if (documentsUploaded) {
      navigateTo('chat');
    } else {
      navigateTo('upload');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900/0 to-gray-900/0 pointer-events-none"></div>
      
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative z-10 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentView !== 'initial' && (
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-2"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                  </button>
                )}
                <div className="relative">
                  <Bot className="w-8 h-8 text-purple-400" />
                  <div className="absolute inset-0 animate-pulse bg-purple-500/20 rounded-full blur-xl"></div>
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
                  AI Document Assistant
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {currentView !== 'upload' && (
                  <button
                    onClick={() => navigateTo('upload')}
                    className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors"
                  >
                    Upload Documents
                  </button>
                )}
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span className="text-sm text-gray-400">Powered by AI</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              {currentView === 'initial' && (
                <div className="absolute inset-0">
                  <InitialChatInterface
                    onUploadRequest={() => navigateTo('upload')}
                    onChatRequest={handleChatRequest}
                    documentsUploaded={documentsUploaded}
                  />
                </div>
              )}
              {currentView === 'upload' && (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="w-full max-w-lg space-y-6">
                    <FileUpload
                      onUploadComplete={handleUploadComplete}
                      onUploadStatusChange={handleUploadStatusChange}
                    />
                    <button
                      onClick={() => navigateTo('chat')}
                      disabled={!documentsUploaded || isUploading}
                      className="w-full bg-purple-600 text-white p-3 rounded-lg transition-all duration-200 
                        hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/20
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600
                        disabled:hover:shadow-none"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing Document...</span>
                        </div>
                      ) : !documentsUploaded ? (
                        "Upload a Document to Start"
                      ) : (
                        "Start Chatting"
                      )}
                    </button>
                  </div>
                </div>
              )}
              {currentView === 'chat' && (
                <div className="absolute inset-0">
                  <ChatInterface
                    key={chatKey}
                    onUploadRequest={() => navigateTo('upload')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          {(currentView === 'chat' || currentView === 'upload') && (
            <aside className="w-80 border-l border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
              <div className="h-full">
                <DocumentList
                  key={chatKey}
                  documents={documents}
                  isLoading={isLoading}
                  error={error}
                  onDelete={handleDocumentDelete}
                  onLastDocumentDeleted={handleLastDocumentDeleted}
                />
              </div>
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}