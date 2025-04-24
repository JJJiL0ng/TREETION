'use client';

import React, { useState, useEffect } from 'react';
import useRecorder from '@/hooks/recoder/useRecorder';
import RecordButton from '@/components/recorder/RecorderButton';
import { Upload, Clock, Save, RefreshCw, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete?: (audioId: string | null) => void;
  onRecordingCancel?: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  // onRecordingCancel,
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioUrl,
    audioBlob,
    uploadedAudioId,
    isUploading,
    uploadProgress,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadRecording,
  } = useRecorder();

  const [showControls, setShowControls] = useState(false);

  // 녹음이 중지되면 컨트롤 표시
  useEffect(() => {
    if (!isRecording && audioBlob) {
      setShowControls(true);
    } else {
      setShowControls(false);
    }
  }, [isRecording, audioBlob]);

  // 업로드 완료 후 콜백 호출
  useEffect(() => {
    if (uploadedAudioId && onRecordingComplete) {
      onRecordingComplete(uploadedAudioId);
    }
  }, [uploadedAudioId, onRecordingComplete]);

  // 녹음 시간 포맷팅 (mm:ss)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 녹음 다시 시작
  const handleReset = () => {
    setShowControls(false);
    setTimeout(() => {
      startRecording();
    }, 300);
  };

  // 녹음 취소
//   const handleCancel = () => {
//     setShowControls(false);
//     if (onRecordingCancel) {
//       onRecordingCancel();
//     }
//   };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        {/* 녹음 상태 표시 */}
        <div className="mb-6 text-center">
          {isRecording && (
            <div className="flex items-center gap-2 text-red-500">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <span className="font-medium">
                {isPaused ? '일시 정지됨' : '녹음 중...'}
              </span>
            </div>
          )}
          {isRecording && (
            <div className="mt-2 flex items-center justify-center text-gray-600">
              <Clock size={16} className="mr-1" />
              <span>{formatTime(recordingTime)}</span>
            </div>
          )}
          {!isRecording && !showControls && (
            <p className="text-gray-600">녹음 버튼을 누르면 시작됩니다</p>
          )}
          {!isRecording && showControls && (
            <p className="text-gray-600">녹음 완료 ({formatTime(recordingTime)})</p>
          )}
        </div>

        {/* 녹음 버튼 */}
        {!showControls && (
          <RecordButton
            isRecording={isRecording}
            isPaused={isPaused}
            isLoading={isUploading}
            onStart={startRecording}
            onStop={stopRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            size="lg"
          />
        )}

        {/* 녹음 완료 후 컨트롤 */}
        {showControls && audioUrl && (
          <>
            {/* 오디오 플레이어 */}
            <div className="w-full mb-4">
              <audio 
                src={audioUrl} 
                controls 
                className="w-full" 
              />
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                <RefreshCw size={18} className="mr-2" />
                다시 녹음
              </button>

              <button
                onClick={uploadRecording}
                disabled={isUploading || !!uploadedAudioId}
                className={`flex items-center px-4 py-2 rounded-lg 
                  ${isUploading || uploadedAudioId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
              >
                {isUploading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    업로드 중 {uploadProgress}%
                  </>
                ) : uploadedAudioId ? (
                  <>
                    <Save size={18} className="mr-2" />
                    저장됨
                  </>
                ) : (
                  <>
                    <Upload size={18} className="mr-2" />
                    업로드
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-start">
            <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
            <span>
              {error.message || '오류가 발생했습니다. 다시 시도해주세요.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;