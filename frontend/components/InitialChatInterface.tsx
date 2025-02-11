"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Upload, MessageSquare } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Props = {
  onUploadRequest: () => void;
  onChatRequest: () => void;
};

const InitialChatInterface: React.FC<Props> = ({ onUploadRequest, onChatRequest }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm an AI assistant. I can help you with general questions or analyze documents if you upload them. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: typeof data.response === 'string' ? data.response : data.response.content
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble processing your request. Please try again in a moment."
      }]);
    } finally {
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Action Buttons */}
      <div className="flex-shrink-0 p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex justify-center space-x-4">
          <button
            onClick={onUploadRequest}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Document
          </button>
          <button
            onClick={onChatRequest}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Chat About Documents
          </button>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
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
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              placeholder="Type your message..."
            />
            <button type="submit" className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitialChatInterface;