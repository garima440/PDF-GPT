"use client"

import React from 'react';
import { Upload, MessageSquare } from 'lucide-react';

interface InitialChatInterfaceProps {
  onUploadRequest: () => void;
  onChatRequest: () => void;
  documentsUploaded: boolean; // Added this prop
}

const InitialChatInterface: React.FC<InitialChatInterfaceProps> = ({
  onUploadRequest,
  onChatRequest,
  documentsUploaded
}) => {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Welcome Message */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-white">
            Welcome to your AI Document Assistant
          </h2>
          <p className="text-lg text-gray-400">
            Upload your documents and start a conversation to get instant insights and answers.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Card */}
          <button
            onClick={onUploadRequest}
            className="group relative bg-gray-800/50 rounded-xl p-6 hover:bg-gray-800 
              transition-all duration-200 border border-gray-700/50
              hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent 
              rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative space-y-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Upload Documents</h3>
              <p className="text-gray-400">
                Upload your documents to get started. Support for various file formats including PDFs.
              </p>
            </div>
          </button>

          {/* Chat Card */}
          <button
            onClick={onChatRequest}
            className={`group relative bg-gray-800/50 rounded-xl p-6
              transition-all duration-200 border border-gray-700/50
              ${documentsUploaded 
                ? 'hover:bg-gray-800 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20' 
                : 'opacity-75 cursor-help'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent 
              rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative space-y-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Chat About Documents</h3>
              <p className="text-gray-400">
                {documentsUploaded 
                  ? "Ask questions about your documents and get instant, AI-powered responses and insights."
                  : "Upload documents first to start chatting with the AI about your content."}
              </p>
            </div>
          </button>
        </div>

        {/* Features Section */}
        <div className="pt-8 border-t border-gray-700/50">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <h4 className="font-medium text-white">Smart Analysis</h4>
              <p className="text-sm text-gray-400">Advanced AI-powered document analysis</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">Quick Responses</h4>
              <p className="text-sm text-gray-400">Get instant answers to your questions</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">Secure Processing</h4>
              <p className="text-sm text-gray-400">Your documents are processed securely</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialChatInterface;