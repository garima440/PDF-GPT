"use client"

// components/InitialChatInterface.tsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';

type Props = {
  onUploadRequest: () => void;
  onChatRequest: () => void;
};

const InitialChatInterface: React.FC<Props> = ({ onUploadRequest, onChatRequest }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm an AI assistant that can analyze documents you upload. You can ask me questions about your documents or upload new ones. Would you like to upload a document or chat about existing ones?" }
  ]);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    // Simple logic to handle user's choice
    if (input.toLowerCase().includes('upload')) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Great! Let's upload a document." }]);
      onUploadRequest();
    } else if (input.toLowerCase().includes('chat') || input.toLowerCase().includes('existing')) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Alright, let's chat about the existing documents." }]);
      onChatRequest();
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm not sure what you'd like to do. Would you like to upload a new document or chat about existing ones?" }]);
    }

    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-gray-50 rounded-lg shadow-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white shadow-md'}`}>
              <p>{message.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your response..."
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200">
            <Send className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InitialChatInterface;
