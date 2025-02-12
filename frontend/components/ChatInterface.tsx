"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Upload, Loader2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  isLoading?: boolean;  // New property to indicate loading state
};

type Props = {
  onUploadRequest: () => void;
};

const ChatInterface: React.FC<Props> = ({ onUploadRequest }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I can help you analyze your documents or answer general questions. What would you like to know?",
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

    // Add a temporary loading message
    const loadingMessage: Message = {
      role: 'assistant',
      content: "Engaging Neural Matrix...",
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
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

      setMessages(prev => {
        // Remove the loading message and add the real one
        const newMessages = [...prev];
        newMessages.pop(); // Remove last message (loading message)
        newMessages.push(aiMessage);
        return newMessages;
      });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "System Error. Re-establishing Connection...",
        isLoading: false,
      };
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove loading message
        newMessages.push(errorMessage);
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format sources
  const formatSources = (sources: string[]): React.ReactNode => {
    return (
      <div className="mt-2 text-xs text-gray-300 border-t border-purple-900 pt-2">
        <p className="font-semibold text-purple-400">Transmissions Log:</p>
        <ul className="list-none pl-0 mt-1 space-y-1">
          {sources.map((source, idx) => {
            const parts = source.split('(From: ');
            const context = parts[0];
            const filename = parts[1]?.replace(')', '') || 'Unknown Source';

            return (
              <li key={idx} className="text-gray-300">
                <span className="text-purple-300">// Sector:</span> {filename}<br />
                <span className="text-purple-300">// Context:</span> {context}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderMessageContent = (message: Message) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-lg rounded-full opacity-50 animate-pulse"></div>
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin z-10 relative" />
          </div>
          <span className="text-gray-300">{message.content}</span>
        </div>
      );
    } else {
      return (
        <>
          <p className="text-sm">{message.content}</p>
          {message.sources && message.sources.length > 0 && formatSources(message.sources)}
        </>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 bg-gray-800 border-b border-gray-700">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-purple-400" />
            <span className="font-medium text-gray-200">AI Assistant</span>
          </div>
          <button
            onClick={onUploadRequest}
            className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Messages Area */}
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
                  {renderMessageContent(message)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              placeholder={isLoading ? "Processing..." : "Type your message..."}
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
