'use client';

import { useEffect, useState } from 'react';
import useRecorder from '@/hooks/recoder/useRecorder';
import { useUserStore } from '@/store/user-store';
import { useRouter } from 'next/navigation';
import { getAudioById } from '@/lib/api/audio/record';

export default function RecordPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const [uploadedAudioDetails, setUploadedAudioDetails] = useState<any>(null);
  
  // 인증 상태 체크
  useEffect(() => {
    if (!isAuthenticated) {
      alert('로그인이 필요한 기능입니다.');
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);
  
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
    uploadRecording
  } = useRecorder();

  // 업로드된 오디오 정보 가져오기
  useEffect(() => {
    const fetchAudioDetails = async () => {
      if (uploadedAudioId) {
        try {
          const details = await getAudioById(uploadedAudioId);
          setUploadedAudioDetails(details);
        } catch (err) {
          console.error('오디오 상세 정보를 가져오는 중 오류 발생:', err);
        }
      }
    };

    fetchAudioDetails();
  }, [uploadedAudioId]);

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
        
        // 업로드 성공 후 필요한 처리 (예: 목록 페이지로 이동)
        // router.push('/audio/list');
      }
    } catch (err) {
      console.error('업로드 중 오류 발생:', err);
      alert('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
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

  // 분석 페이지로 이동
  const navigateToAnalysis = () => {
    if (uploadedAudioId) {
      router.push(`/audio/analysis/${uploadedAudioId}`);
    }
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
          
          {audioBlob && !isUploading && !uploadedAudioId && (
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
          
          {uploadedAudioId && uploadedAudioDetails && (
            <button
              onClick={navigateToAnalysis}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded"
            >
              분석 시작
            </button>
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
        
        {/* 업로드 완료 후 정보 표시 */}
        {uploadedAudioId && uploadedAudioDetails && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">
              업로드 완료
            </h3>
            <p className="text-sm text-gray-600">
              파일명: {uploadedAudioDetails.originalName || '(이름 없음)'}
            </p>
            <p className="text-sm text-gray-600">
              크기: {(uploadedAudioDetails.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {uploadedAudioDetails.url && (
              <div className="mt-2">
                <audio src={uploadedAudioDetails.url} controls className="w-full" />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}