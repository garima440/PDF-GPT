"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

type Props = {
  onUploadComplete: () => void;
};

const FileUpload: React.FC<Props> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; status: 'success' | 'error' }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');

  const funMessages = [
    "Feeding the PDF to our hungry AI... 🤖",
    "Teaching our robots to read... 📚",
    "Converting coffee into analysis... ☕",
    "Discovering hidden knowledge... 🔍",
    "Warming up the neural networks... 🧠",
    "Assembling the document puzzle... 🧩",
    "Brewing some digital magic... ✨",
    "Making our AI smarter... 📈",
  ];

  const simulateProgress = async (file: File) => {
    for (let progress = 0; progress <= 100; progress += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(progress);
      
      // Change message at certain progress points
      if (progress % 25 === 0) {
        setUploadMessage(funMessages[Math.floor(Math.random() * funMessages.length)]);
      }
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Start progress simulation
        simulateProgress(file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setUploadedFiles(prev => [...prev, { name: file.name, status: 'success' }]);
        } else {
          setUploadedFiles(prev => [...prev, { name: file.name, status: 'error' }]);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => [...prev, { name: file.name, status: 'error' }]);
      }
    }

    setIsUploading(false);
    setUploadMessage('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-gray-900 rounded-xl shadow-lg text-gray-100">
      <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Upload Your Documents</h2>
      
      <div
        {...getRootProps()}
        className={`border-3 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${
          isDragActive 
            ? 'border-purple-500 bg-purple-900 scale-105' 
            : 'border-gray-700 hover:border-purple-400 hover:bg-gray-800'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto h-20 w-20 text-purple-400 mb-4 transition-transform duration-300 ${
          isDragActive ? 'scale-110' : ''
        }`} />
        <p className="text-lg text-gray-300 font-semibold">
          {isUploading ? 'Uploading...' : isDragActive ? 'Drop it like it\'s hot! 🔥' : 'Drag & drop PDF files here'}
        </p>
        <p className="mt-2 text-sm text-gray-400">or click to select files</p>
      </div>

      {isUploading && (
        <div className="mt-6 space-y-3">
          <div className="relative w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-full transition-all duration-300"
              style={{ 
                width: `${uploadProgress}%`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <p className="text-center text-sm text-gray-400">
              {uploadMessage || `Uploading... ${Math.round(uploadProgress)}%`}
            </p>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-4 text-purple-300 text-lg">Uploaded Files:</h3>
          <ul className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                <span className="flex items-center text-sm text-gray-300">
                  <File className="w-5 h-5 mr-3 text-purple-400" />
                  {file.name}
                </span>
                <div className="flex items-center">
                  {file.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  )}
                  <button
                    onClick={() => removeFile(file.name)}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploadedFiles.length > 0 && !isUploading && (
        <button
          onClick={onUploadComplete}
          className="mt-8 w-full bg-purple-600 text-white py-4 px-6 rounded-xl hover:bg-purple-700 transition-all duration-300 text-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          Start Analyzing Documents
        </button>
      )}
    </div>
  );
};

export default FileUpload;
