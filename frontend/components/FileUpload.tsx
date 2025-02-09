"use client"

import React, { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

type Props = {
  onUploadComplete: () => void;
};

const FileUpload: React.FC<Props> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setUploadedFiles(prev => [...prev, file.name]);
        } else {
          console.error('Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setIsUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file !== fileName));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isUploading ? 'Uploading...' : 'Drag & drop PDF files here, or click to select'}
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Uploaded Files:</h3>
          <ul className="space-y-2">
            {uploadedFiles.map((fileName, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span className="flex items-center text-sm text-gray-600">
                  <File className="w-4 h-4 mr-2" />
                  {fileName}
                </span>
                <button
                  onClick={() => removeFile(fileName)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <button
          onClick={onUploadComplete}
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Start Chatting
        </button>
      )}
    </div>
  );
};

export default FileUpload;
