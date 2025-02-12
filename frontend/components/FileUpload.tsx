"use client";

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, Scan, FileTerminal } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: () => void;
  onUploadStatusChange?: (isUploading: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, onUploadStatusChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Simulate progress during upload
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (isUploading) {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 96) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 3; // Reduced from 15 to 3 for slower progress
        });
      }, 500); // Increased from 300ms to 500ms
    } else {
      setProgress(0);
    }
    return () => clearInterval(progressInterval);
  }, [isUploading]);

  // Scanning animation
  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);
    return () => clearInterval(scanInterval);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadError(null);
    onUploadStatusChange?.(true);

    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('file', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      setProgress(100);
      setUploadSuccess(true);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('SYSTEM ERROR: File transfer protocol interrupted. Retry sequence recommended.');
    } finally {
      setIsUploading(false);
      onUploadStatusChange?.(false);
    }
  }, [onUploadComplete, onUploadStatusChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    disabled: isUploading,
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors overflow-hidden
          ${isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-purple-500'}
          ${isUploading ? 'cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {/* Scanning effect */}
        <div 
          className="absolute left-0 w-full h-1 bg-purple-500/30"
          style={{ 
            top: `${scanLine}%`,
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
            transition: 'top 0.05s linear'
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {uploadSuccess ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-pulse"></div>
                <div className="relative w-12 h-12 text-purple-500 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300 font-mono">UPLOAD COMPLETE</p>
                <p className="text-sm text-gray-500 font-mono">Document successfully processed</p>
                {/* <button
                  onClick={() => onUploadComplete()}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                    transition-all duration-200 font-mono flex items-center justify-center space-x-2"
                >
                  <span>START CHATTING</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button> */}
              </div>
            </>
          ) : isUploading ? (
            <>
              <div className="relative">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                <Scan className="absolute top-0 left-0 w-12 h-12 text-purple-500 opacity-50" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 font-mono">ANALYZING DOCUMENT...</p>
                <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ 
                      width: `${progress}%`,
                      boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500 font-mono">{Math.min(100, Math.round(progress))}% COMPLETE</p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <FileTerminal className="w-12 h-12 text-purple-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <p className="text-gray-300 font-mono">INITIATE FILE TRANSFER SEQUENCE</p>
                <p className="text-sm text-gray-500 mt-1 font-mono">ACCEPTED FORMAT: PDF</p>
              </div>
            </>
          )}
        </div>
      </div>
      {uploadError && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm font-mono">[ERROR_CODE_X7]: {uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;