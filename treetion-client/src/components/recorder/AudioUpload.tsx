'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileAudio, AlertCircle, File } from 'lucide-react';
import { uploadAudioFile } from '@/lib/api/audio/record';

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);

  // 파일 선택 이벤트 핸들러
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  }, []);

  // 파일 유효성 검사
  const validateAndSetFile = useCallback((file: File) => {
    setError(null);
    
    // 파일 타입 체크
    if (!file.type.startsWith('audio/')) {
      setError('오디오 파일만 업로드 가능합니다.');
      return;
    }
    
    // 파일 크기 체크
    if (file.size > maxSize) {
      setError(`파일 크기는 ${formatFileSize(maxSize)}를 초과할 수 없습니다.`);
      return;
    }
    
    setFile(file);
  }, [maxSize]);

  // 파일 제거
  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // 파일 업로드 버튼 클릭
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // 업로드 실행
  const handleUpload = useCallback(async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // FormData로 파일 업로드
      const result = await uploadAudioFile(file);
      
      setUploadProgress(100);
      setIsUploading(false);
      
      // 업로드 완료 콜백 호출
      if (onUploadComplete) {
        onUploadComplete(result.audioId);
      }
      
      // 업로드 후 파일 정보 초기화
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setIsUploading(false);
      setError('파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Upload error:', error);
    }
  }, [file, onUploadComplete]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 파일 입력 (숨김) */}
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* 드래그 앤 드롭 영역 */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging 
              ? 'border-primary bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'}`}
        >
          <div className="mx-auto flex flex-col items-center">
            <Upload 
              size={36} 
              className={isDragging ? 'text-primary' : 'text-gray-400'} 
            />
            <p className="mt-2 text-sm font-medium text-gray-900">
              오디오 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="mt-1 text-xs text-gray-500">
              MP3, WAV, M4A, WEBM 등 (최대 {formatFileSize(maxSize)})
            </p>
          </div>
        </div>
      )}
      
      {/* 파일 선택 후 정보 표시 */}
      {file && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex items-center p-4">
            <div className="mr-3 flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <FileAudio size={20} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)} • {file.type || '알 수 없는 유형'}
              </p>
            </div>
            <div className="ml-2">
              <button
                onClick={handleRemoveFile}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                title="파일 제거"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* 업로드 버튼 */}
          <div className="px-4 py-3 bg-gray-50 text-right border-t">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                ${isUploading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary-dark'}`}
            >
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  {uploadProgress > 0 
                    ? `업로드 중 ${uploadProgress}%` 
                    : '업로드 중...'}
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  업로드
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default AudioUpload;