"use client";

import { useState } from 'react';
import InitialChatInterface from './InitialChatInterface';
import ChatInterface from './ChatInterface';
import FileUpload from './FileUpload';

export default function HomeContent() {
  const [currentView, setCurrentView] = useState<'initial' | 'chat' | 'upload'>('initial');
  const [documentsUploaded, setDocumentsUploaded] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">AI Document Assistant</h1>
      {currentView === 'initial' && (
        <InitialChatInterface
          onUploadRequest={() => setCurrentView('upload')}
          onChatRequest={() => setCurrentView('chat')}
        />
      )}
      {currentView === 'upload' && (
        <>
          <FileUpload onUploadComplete={() => {
            setCurrentView('chat');
            setDocumentsUploaded(true);
          }} />
          <button
            onClick={() => setCurrentView('chat')}
            className="mt-4 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Start Chatting
          </button>
        </>
      )}
      {currentView === 'chat' && (
        <>
          <ChatInterface documentsUploaded={documentsUploaded} />
          <button
            onClick={() => setCurrentView('upload')}
            className="mt-4 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Upload Another Document
          </button>
        </>
      )}
    </div>
  );
}
