"use client";

import { useState } from 'react';
import InitialChatInterface from './InitialChatInterface';
import ChatInterface from './ChatInterface';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';
import { Bot, Sparkles, ArrowLeft, Home } from 'lucide-react';

export default function HomeContent() {
  const [currentView, setCurrentView] = useState<'initial' | 'chat' | 'upload'>('initial');
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [previousView, setPreviousView] = useState<'initial' | 'chat' | 'upload'>('initial');

  const handleDocumentDelete = () => {
    setDocumentsUploaded(prev => !prev);
  };

  const navigateTo = (view: 'initial' | 'chat' | 'upload') => {
    setPreviousView(currentView);
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView(previousView);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900/0 to-gray-900/0 pointer-events-none"></div>
      
      <div className="relative min-h-screen flex flex-col">
        {/* Header with navigation */}
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
                <button
                  onClick={() => navigateTo('initial')}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Home className="w-5 h-5 text-gray-400" />
                </button>
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

        {/* Main content area */}
        <main className="flex-1 flex">
          {/* Dynamic width content area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              {currentView === 'initial' && (
                <div className="absolute inset-0">
                  <InitialChatInterface
                    onUploadRequest={() => navigateTo('upload')}
                    onChatRequest={() => navigateTo('chat')}
                  />
                </div>
              )}
              {currentView === 'upload' && (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="w-full max-w-lg space-y-6">
                    <FileUpload
                      onUploadComplete={() => {
                        navigateTo('chat');
                        setDocumentsUploaded(prev => !prev);
                      }} 
                    />
                    <button
                      onClick={() => navigateTo('chat')}
                      className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
                    >
                      Start Chatting
                    </button>
                  </div>
                </div>
              )}
              {currentView === 'chat' && (
                <div className="absolute inset-0">
                  <ChatInterface 
                    documentsUploaded={documentsUploaded}
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
                  refreshTrigger={documentsUploaded} 
                  onDelete={handleDocumentDelete} 
                />
              </div>
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}