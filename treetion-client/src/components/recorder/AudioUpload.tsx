'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileAudio, AlertCircle, File } from 'lucide-react';
// import { uploadAudioFile } from '@/lib/api/audio/record';

interface AudioUploadProps {
  onUploadComplete?: (audioId: string) => void;
  accept?: string;
  maxSize?: number; // bytes
}

const AudioUpload: React.FC<AudioUploadProps> = ({
  onUploadComplete,
  accept = 'audio/*',
  maxSize = 50 * 1024 * 1024, // 50MB default
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 크기 포맷팅 (MB, KB)
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000) {
      return `${(bytes / 1000000).toFixed(2)} MB`;
    }
    return `${(bytes / 1000).toFixed(2)} KB`;
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);

  // 파일 검증
  const validateAndSetFile = (file: File) => {
    // 파일 타입 검증
    if (!file.type.startsWith('audio/')) {
      setError('오디오 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 검증
    if (file.size > maxSize) {
      setError(`파일 크기는 ${formatFileSize(maxSize)}를 초과할 수 없습니다.`);
      return;
    }

    setFile(file);
    setError(null);
  };

  // 파일 선택 이벤트 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // 파일 선택 버튼 클릭 핸들러
  const handleSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 선택된 파일 제거 핸들러
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 업로드 핸들러
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // XMLHttpRequest를 사용하여 진행률 추적
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          if (onUploadComplete) {
            onUploadComplete(response.audioId);
          }
          setIsUploading(false);
        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        setError('업로드 중 오류가 발생했습니다.');
        setIsUploading(false);
      });

      xhr.open('POST', '/api/audio/upload');
      
      // 인증 토큰 추가 (클라이언트 사이드에서만 실행)
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
      }

      xhr.send(formData);
    } catch (error) {
      setError('업로드 중 오류가 발생했습니다.');
      setIsUploading(false);
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* 파일 입력 필드 (숨김) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {/* 드롭 영역 */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectClick}
          className={`
            border-2 border-dashed rounded-lg p-6
            flex flex-col items-center justify-center
            cursor-pointer transition-colors
            ${isDragging 
              ? 'border-primary bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
          `}
        >
          <FileAudio size={40} className={`mb-2 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
          <p className="text-sm text-center text-gray-600 mb-1">
            {isDragging ? '파일을 여기에 놓으세요' : '오디오 파일을 끌어다 놓거나 클릭하여 업로드'}
          </p>
          <p className="text-xs text-gray-500">
            최대 파일 크기: {formatFileSize(maxSize)}
          </p>
        </div>
      )}

      {/* 선택된 파일 표시 */}
      {file && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex items-center p-3 bg-gray-50 border-b">
            <File size={18} className="text-gray-500 mr-2" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              disabled={isUploading}
              className={`p-1 rounded-full ${
                isUploading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          {/* 업로드 버튼 및 진행 상태 */}
          <div className="p-3">
            {isUploading ? (
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                  <span>업로드 중...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleUpload}
                className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Upload size={18} className="mr-2" />
                업로드
              </button>
            )}
          </div>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 flex items-center">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioUpload;