// app/record/page.tsx
'use client';

import { useState, useEffect } from 'react';
import useRecorder from '@/hooks/recoder/useRecorder';
import { useUserStore } from '@/store/user-store';
import { useRouter } from 'next/navigation';

export default function RecordPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
   // 인증 상태 체크
   useEffect(() => {
    if (!isAuthenticated) {
      // 로그인 페이지로 리다이렉트하거나 경고 메시지 표시
      alert('로그인이 필요한 기능입니다.');
      router.push('/auth/login'); // 로그인 페이지 경로에 맞게 수정
    }
  }, [isAuthenticated, router]);
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioUrl,
    audioBlob,
    isUploading,
    uploadProgress,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadRecording
  } = useRecorder();

  // 녹음 시간 형식화 (mm:ss)
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 녹음 완료 후 업로드 처리
  const handleUpload = async () => {
    if (!audioBlob) return;
    
    try {
      const audioId = await uploadRecording();
      if (audioId) {
        console.log('녹음 업로드 성공:', audioId);
        alert('녹음이 성공적으로 업로드되었습니다.');
      }
    } catch (err) {
      console.error('업로드 중 오류 발생:', err);
      alert('업로드 중 오류가 발생했습니다.');
    }
  };

  // 녹음 재시작
  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    // 새로운 녹음 시작
    startRecording();
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">음성 녹음</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>오류 발생: {error.message}</p>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        {/* 녹음 상태 표시 */}
        <div className="mb-4">
          <p className="text-lg font-semibold">
            {isRecording 
              ? (isPaused ? "일시 정지됨" : "녹음 중...") 
              : audioBlob ? "녹음 완료" : "녹음 준비"}
          </p>
          
          {/* 녹음 시간 */}
          {(isRecording || audioBlob) && (
            <p className="text-3xl font-mono mt-2">{formatTime(recordingTime)}</p>
          )}
        </div>
        
        {/* 녹음 제어 버튼 */}
        <div className="flex flex-wrap gap-3 mb-4">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            >
              녹음 시작
            </button>
          )}
          
          {isRecording && !isPaused && (
            <button
              onClick={pauseRecording}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded"
            >
              일시 정지
            </button>
          )}
          
          {isRecording && isPaused && (
            <button
              onClick={resumeRecording}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
            >
              녹음 계속
            </button>
          )}
          
          {isRecording && (
            <button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
            >
              녹음 완료
            </button>
          )}
          
          {audioBlob && !isUploading && (
            <>
              <button
                onClick={handleReset}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
              >
                다시 녹음
              </button>
              
              <button
                onClick={handleUpload}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
              >
                업로드
              </button>
            </>
          )}
        </div>
        
        {/* 오디오 미리듣기 */}
        {audioUrl && (
          <div className="mt-4">
            <p className="mb-2 font-medium">미리듣기:</p>
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}
        
        {/* 업로드 진행 상태 */}
        {isUploading && (
          <div className="mt-4">
            <p className="mb-2">업로드 중... {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}