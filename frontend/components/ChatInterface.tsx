"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Upload, MessageSquare, Loader2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
};

type Props = {
  documentsUploaded: boolean;
  onUploadRequest: () => void;
};

const ChatInterface: React.FC<Props> = ({ documentsUploaded, onUploadRequest }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: documentsUploaded 
        ? "You can ask me questions about your documents. I'll help you analyze them."
        : "Please upload some documents first, and I'll help you analyze them.",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: input,
          useDocuments: documentsUploaded
        }), 
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        role: 'assistant',
        content: typeof data.response === 'string' ? data.response : data.response.content,
        sources: data.sources
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!documentsUploaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Upload className="w-16 h-16 text-purple-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">No Documents Yet</h2>
        <p className="text-gray-400 mb-4">Upload some documents to start analyzing them</p>
        <button
          onClick={onUploadRequest}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
        >
          Upload Documents
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 bg-gray-800 border-b border-gray-700">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-purple-400" />
            <span className="font-medium text-gray-200">Document Analysis</span>
          </div>
          <button
            onClick={onUploadRequest}
            className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Upload More
          </button>
        </div>
      </div>

      {/* Scrollable Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] rounded-lg p-4 ${
                message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-100'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-6 h-6 mr-2 flex-shrink-0" />
                ) : (
                  <Bot className="w-6 h-6 mr-2 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm">{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 text-xs text-gray-300 border-t border-gray-700 pt-2">
                      <p className="font-medium">Sources:</p>
                      <ul className="list-disc pl-4 mt-1">
                        {message.sources.map((source, idx) => (
                          <li key={idx}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing documents...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              placeholder={isLoading ? "Processing..." : "Ask about your documents..."}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;