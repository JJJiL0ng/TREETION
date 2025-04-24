'use client';

import React, { useEffect } from 'react';
import { 
  File, 
  Play, 
  Trash2, 
  ExternalLink, 
  Clock, 
  FileText,
  RefreshCw,
//   Check,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import useAudioStore from '@/store/audio-store';
import { getAudioStreamUrl, AudioFile } from '@/lib/api/audio/record';

interface AudioFileListProps {
  onSelectFile?: (audioId: string) => void;
  onTranscribe?: (audioId: string) => void;
}

const AudioFileList: React.FC<AudioFileListProps> = ({
  onSelectFile,
  onTranscribe,
}) => {
  const { 
    audioFiles, 
    isLoading, 
    error, 
    currentAudio,
    fetchAudioFiles, 
    deleteAudio,
    // setCurrentAudio,
    startTranscription,
    isTranscribing,
    transcriptionStatus
  } = useAudioStore();

  // 컴포넌트 마운트 시 오디오 파일 목록 가져오기
  useEffect(() => {
    fetchAudioFiles();
  }, [fetchAudioFiles]);

  // 파일 크기 포맷팅 (MB, KB)
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000) {
      return `${(bytes / 1000000).toFixed(2)} MB`;
    }
    return `${(bytes / 1000).toFixed(2)} KB`;
  };

  // 오디오 재생 시간 포맷팅 (mm:ss)
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 오디오 파일 삭제
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 녹음을 삭제하시겠습니까?')) {
      deleteAudio(id);
    }
  };

  // 오디오 파일 선택
  const handleSelect = (audioId: string) => {
    if (onSelectFile) {
      onSelectFile(audioId);
    }
  };

  // 오디오 파일 트랜스크립션
  const handleTranscribe = (audioId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 이미 진행 중인 트랜스크립션이 있으면 경고
    if (isTranscribing) {
      alert('이미 처리 중인 트랜스크립션이 있습니다.');
      return;
    }

    startTranscription(audioId);
    
    if (onTranscribe) {
      onTranscribe(audioId);
    }
  };

  // 목록 새로고침
  const handleRefresh = () => {
    fetchAudioFiles();
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-700 flex items-center">
        <AlertCircle size={20} className="mr-2" />
        <span>
          오디오 파일을 불러오는 중 오류가 발생했습니다. 
          <button 
            onClick={handleRefresh}
            className="ml-2 underline"
          >
            다시 시도
          </button>
        </span>
      </div>
    );
  }

  if (isLoading && audioFiles.length === 0) {
    return (
      <div className="p-6 flex justify-center">
        <div className="flex items-center">
          <RefreshCw size={20} className="animate-spin mr-2" />
          <span>오디오 파일 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (audioFiles.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg">
        <File size={40} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">녹음된 오디오 파일이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-1">새 오디오를 녹음하거나 업로드해보세요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-medium">내 녹음 목록</h3>
        <button 
          onClick={handleRefresh}
          className="text-gray-500 hover:text-gray-700"
          title="새로고침"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <ul className="divide-y divide-gray-200">
        {Array.isArray(audioFiles) && audioFiles.map((file: AudioFile) => (
          <li 
            key={file.id}
            onClick={() => handleSelect(file.id)}
            className={`hover:bg-gray-50 cursor-pointer transition-colors p-3
              ${currentAudio?.id === file.id ? 'bg-blue-50' : ''}
            `}
          >
            <div className="flex items-center">
              <div className="mr-3 flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                  <Play size={20} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.fileName}
                </p>
                <div className="flex text-xs text-gray-500 mt-1">
                  <span className="flex items-center mr-3">
                    <Clock size={12} className="mr-1" />
                    {formatDuration(file.duration)}
                  </span>
                  <span className="mr-3">
                    {formatFileSize(file.size)}
                  </span>
                  <span className="flex items-center">
                    {formatDistanceToNow(new Date(file.createdAt), { 
                      addSuffix: true,
                      locale: ko 
                    })}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-1">
                {/* STT 변환 버튼 */}
                <button 
                  onClick={(e) => handleTranscribe(file.id, e)}
                  disabled={isTranscribing && transcriptionStatus?.id === file.id}
                  className={`p-2 rounded-full ${
                    isTranscribing && transcriptionStatus?.id === file.id
                      ? 'text-green-400 bg-green-50 cursor-not-allowed'
                      : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                  }`}
                  title="STT 변환"
                >
                  {isTranscribing && transcriptionStatus?.id === file.id ? (
                    <div className="flex items-center">
                      <RefreshCw size={18} className="animate-spin" />
                    </div>
                  ) : (
                    <FileText size={18} />
                  )}
                </button>

                {/* 스트리밍 링크 버튼 */}
                <a 
                  href={getAudioStreamUrl(file.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                  title="오디오 열기"
                >
                  <ExternalLink size={18} />
                </a>
                
                {/* 삭제 버튼 */}
                <button 
                  onClick={(e) => handleDelete(file.id, e)}
                  className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                  title="삭제"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AudioFileList;