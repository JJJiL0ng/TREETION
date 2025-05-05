'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/auth/client';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/auth/client';
import { useUserStore } from '@/store/user-store';
import { useRequiredAuth } from '@/hooks/auth/useRequiredAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRequiredAuth } from '@/hooks/auth/useRequiredAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';

const RecordPage = () => {
  // 인증 관련 훅 사용
  const { user, isLoading: authLoading } = useRequiredAuth('/auth/login');
  const router = useRouter();
  
  // 인증 관련 훅 사용
  const { user, isLoading: authLoading } = useRequiredAuth('/auth/login');
  const router = useRouter();
  
  // 상태 관리
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUpgradeUploading, setIsUpgradeUploading] = useState(false); // 업그레이드 업로드 상태
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFileName, setDraggedFileName] = useState('');
  const [compareResults, setCompareResults] = useState<{
    standard?: any;
    upgraded?: any;
  }>({});
  
  // API URL 설정
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  // 레퍼런스
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // 녹음 시간 업데이트
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  // 시간을 mm:ss 형식으로 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 브라우저가 MediaRecorder를 지원하는지 확인하고 사용 가능한 MIME 타입 확인
  const getSupportedMimeType = () => {
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      return null;
    }

    // 선호하는 MIME 타입 순서
    const mimeTypes = [
      'audio/mp3',
      'audio/mpeg',
      'audio/webm;codecs=mp3',
      'audio/webm'
    ];

    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('지원되는 MIME 타입:', type);
        return type;
      }
    }

    // 기본값
    return 'audio/webm';
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      // 오디오 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 지원되는 MIME 타입 가져오기
      const mimeType = getSupportedMimeType();
      console.log('사용할 MIME 타입:', mimeType);
      
      // MediaRecorder 설정
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // 청크 초기화
      setRecordingTime(0); // 녹음 시간 초기화
      
      // 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 녹음 종료 처리
      mediaRecorder.onstop = () => {
        // 실제 사용된 MIME 타입
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        console.log('녹음에 사용된 실제 MIME 타입:', actualMimeType);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        setAudioBlob(audioBlob);
        setDraggedFileName('');
        setDraggedFileName('');
        
        // 스트림의 모든 트랙 중지
        stream.getTracks().forEach(track => track.stop());
      };
      
      // 녹음 시작
      mediaRecorder.start(1000); // 1초 간격으로 데이터 수집
      setIsRecording(true);
      setUploadStatus('');
      
    } catch (error) {
      console.error('녹음을 시작할 수 없습니다:', error);
      setUploadStatus('마이크 접근 오류. 권한을 확인해주세요.');
    }
  };
  
  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRecording) {
      setIsDragging(true);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRecording) {
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isRecording) {
      setUploadStatus('녹음 중에는 파일을 업로드할 수 없습니다. 먼저 녹음을 중지해주세요.');
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // 파일이 오디오 파일인지 확인
      if (!file.type.startsWith('audio/')) {
        setUploadStatus('오디오 파일만 업로드할 수 있습니다.');
        return;
      }
      
      console.log('드롭된 파일:', file.name, file.type, file.size);
      setDraggedFileName(file.name);
      
      // Blob 설정
      setAudioBlob(file);
      setUploadStatus('');
    }
  };
  
  // 파일 입력을 통한 파일 선택 처리
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // 파일이 오디오 파일인지 확인
      if (!file.type.startsWith('audio/')) {
        setUploadStatus('오디오 파일만 업로드할 수 있습니다.');
        e.target.value = '';
        return;
      }
      
      console.log('선택된 파일:', file.name, file.type, file.size);
      setDraggedFileName(file.name);
      
      // Blob 설정
      setAudioBlob(file);
      setUploadStatus('');
    }
  };
  
  // 준비된 FormData 생성 함수
  const prepareFormData = () => {
    if (!audioBlob) {
      return null;
    }

    // 파일 확장자 결정
    let fileExtension = '.webm';
    if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
      fileExtension = '.mp3';
    } else if (audioBlob.type.includes('wav')) {
      fileExtension = '.wav';
    }
    
    // FormData 생성 및 파일 추가
    const formData = new FormData();
    const fileName = draggedFileName || `recording_${Date.now()}${fileExtension}`;
    
    // 오디오 파일을 원본 형식 그대로 사용
    const audioFile = new File([audioBlob], fileName, { 
      type: audioBlob.type 
    });
    
    console.log('업로드할 오디오 파일 정보:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });
    
    // FormData에 파일 추가 - 필드명을 audioFile로 설정
    formData.append('audioFile', audioFile);
    
    // 메타데이터 추가 - CreateAudioDto에 맞게 필드 설정
    formData.append('title', draggedFileName || `녹음_${new Date().toISOString()}`);
    formData.append('recordedAt', new Date().toISOString());

    return formData;
  };
  
  // 서버에 오디오 업로드
  const uploadAudio = async () => {
    if (!audioBlob) {
      setUploadStatus('업로드할 오디오가 없습니다.');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadStatus('업로드 중...');
      
      const formData = prepareFormData();
      if (!formData) {
        throw new Error('FormData 생성 실패');
      }
      
      // FormData 내용 로깅
      console.log('FormData 내용:');
      for (const pair of formData.entries()) {
        const value = pair[1];
        if (value instanceof File) {
          console.log(pair[0], `File: ${value.name}, 타입: ${value.type}, 크기: ${value.size} 바이트`);
        } else {
          console.log(pair[0], value);
        }
      }
      
      // 인증을 처리하는 API 클라이언트를 사용하여 업로드
      console.log('API 엔드포인트:', `${API_URL}/audio/upload`);
      const response = await api.upload('/audio/upload', formData);
      
      console.log('업로드 응답:', response);
      setUploadStatus('업로드 성공! 오디오 ID: ' + response.id);
      
      // 비교 결과에 일반 업로드 결과 저장
      setCompareResults(prev => ({
        ...prev,
        standard: response
      }));
      
      // 업로드 후 상태 초기화
      setAudioBlob(null);
      setDraggedFileName('');
      
    } catch (error: any) {
      console.error('업로드 오류:', error);
      
      // API 클라이언트가 이미 토큰 갱신을 처리하므로 여기서는 오류 메시지만 표시
      const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
      setUploadStatus(`업로드 실패: ${errorMessage}`);
      
      // 권한 오류인 경우 (401)
      if (error.response?.status === 401) {
        setUploadStatus('인증이 필요합니다. 다시 로그인해주세요.');
        
        // 로그아웃 처리 및 로그인 페이지로 리다이렉트
        useUserStore.getState().logout();
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 업그레이드된 STT를 활용하여 오디오 업로드
  const uploadWithUpgradedStt = async () => {
    if (!audioBlob) {
      setUploadStatus('업로드할 오디오가 없습니다.');
      return;
    }
    
    try {
      setIsUpgradeUploading(true);
      setUploadStatus('향상된 STT 기능으로 업로드 중...');
      
      const formData = prepareFormData();
      if (!formData) {
        throw new Error('FormData 생성 실패');
      }
      
      // 추가 언어 정보 설정 (필요시)
      formData.append('language', 'ko');
      
      // 업그레이드 업로드 엔드포인트로 전송
      console.log('API 엔드포인트:', `${API_URL}/audio/upgrade-upload`);
      const response = await api.upload('/audio/upgrade-upload', formData);
      
      console.log('업그레이드 업로드 응답:', response);
      setUploadStatus('향상된 STT로 업로드 성공! 오디오 ID: ' + response.id);
      
      // 비교 결과에 업그레이드 업로드 결과 저장
      setCompareResults(prev => ({
        ...prev,
        upgraded: response
      }));
      
      // 업로드 후 상태 초기화
      setAudioBlob(null);
      setDraggedFileName('');
      setDraggedFileName('');
      
    } catch (error: any) {
      console.error('업그레이드 업로드 오류:', error);
      
      const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
      setUploadStatus(`향상된 STT 업로드 실패: ${errorMessage}`);
      
      if (error.response?.status === 401) {
        setUploadStatus('인증이 필요합니다. 다시 로그인해주세요.');
        useUserStore.getState().logout();
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } finally {
      setIsUpgradeUploading(false);
    }
  };
  
  // 인증 로딩 중일 때 표시할 내용
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AuthGuard>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">오디오 녹음 및 업로드</h1>
        
        {user && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700">
              <span className="font-medium">{user.name || user.email}</span>님으로 로그인됨
            </p>
          </div>
        )}
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p>녹음 상태: {isRecording ? '녹음 중' : '중지됨'}</p>
          {isRecording && <p className="text-red-500 font-semibold">녹음 시간: {formatTime(recordingTime)}</p>}
        </div>
        
        <div className="mb-6 flex flex-col items-center">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="mb-4 px-6 py-2 text-2xl bg-primary text-blue-500 rounded hover:bg-primary-dark transition-colors"
              disabled={isUploading || isUpgradeUploading}
            >
              녹음 시작
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="mb-4 px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              녹음 중지
            </button>
          )}
          
          {audioBlob && !isRecording && (
            <div className="w-full flex flex-col items-center">
              <div className="mb-4 w-full">
                <audio 
                  controls 
                  src={URL.createObjectURL(audioBlob)} 
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {draggedFileName ? `파일명: ${draggedFileName}` : '녹음된 오디오'} | 형식: {audioBlob.type || '알 수 없음'}
                </p>
              </div>
              
              {/* 업로드 버튼 그룹 */}
              <div className="flex space-x-4">
                {/* 일반 업로드 버튼 */}
                <button 
                  onClick={uploadAudio}
                  disabled={isUploading || isUpgradeUploading}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      업로드 중...
                    </span>
                  ) : '일반 업로드'}
                </button>
                
                {/* 업그레이드 STT 업로드 버튼 */}
                <button 
                  onClick={uploadWithUpgradedStt}
                  disabled={isUploading || isUpgradeUploading}
                  className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUpgradeUploading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      향상된 STT로 업로드 중...
                    </span>
                  ) : '향상된 STT로 업로드'}
                </button>
              </div>
              
              {/* 업로드 버튼 아래 설명 */}
              <div className="mt-2 text-xs text-center text-gray-600 max-w-md">
                <p>일반 업로드: 기본 STT 변환만 적용</p>
                <p>향상된 STT 업로드: AI 기반 텍스트 품질 개선 적용</p>
              </div>
            </div>
          )}
        </div>
        
        {/* 드래그 앤 드롭 영역 */}
        {!isRecording && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">오디오 파일 업로드</h2>
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed p-8 rounded-lg text-center transition-colors ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="mb-4">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-lg mb-2">오디오 파일을 여기에 드래그하세요</p>
              <p className="text-sm text-gray-500 mb-4">또는</p>
              <label className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                파일 선택
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={handleFileInputChange}
                  disabled={isRecording || isUploading || isUpgradeUploading}
                />
              </label>
              <p className="mt-2 text-xs text-gray-500">지원 형식: MP3, WAV, WebM 등 브라우저에서 지원하는 오디오 파일</p>
            </div>
          </div>
        )}
        
        {uploadStatus && (
          <div className={`p-4 rounded-lg mb-6 ${
            uploadStatus.includes('성공') ? 'bg-green-100 text-green-800' :
            uploadStatus.includes('오류') || uploadStatus.includes('실패') ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <p>{uploadStatus}</p>
          </div>
        )}
        
        {/* 비교 결과 표시 영역 */}
        {(compareResults.standard || compareResults.upgraded) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">STT 변환 결과 비교</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 일반 STT 결과 */}
              {compareResults.standard && (
                <div className="border p-3 rounded-lg bg-white">
                  <h3 className="font-medium mb-2 text-green-700">일반 STT 결과</h3>
                  <div className="text-sm mb-2">
                    <p><span className="font-semibold">ID:</span> {compareResults.standard.id}</p>
                    <p><span className="font-semibold">제목:</span> {compareResults.standard.title}</p>
                  </div>
                  {compareResults.standard.transcriptionText && (
                    <div className="mt-2">
                      <p className="font-semibold text-sm">변환된 텍스트:</p>
                      <div className="p-2 bg-gray-50 rounded-md text-xs overflow-auto max-h-40">
                        {compareResults.standard.transcriptionText}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 업그레이드된 STT 결과 */}
              {compareResults.upgraded && (
                <div className="border p-3 rounded-lg bg-white">
                  <h3 className="font-medium mb-2 text-purple-700">향상된 STT 결과</h3>
                  <div className="text-sm mb-2">
                    <p><span className="font-semibold">ID:</span> {compareResults.upgraded.id}</p>
                    <p><span className="font-semibold">제목:</span> {compareResults.upgraded.title}</p>
                    {compareResults.upgraded.improvedPercentage && (
                      <p><span className="font-semibold">개선율:</span> {compareResults.upgraded.improvedPercentage}%</p>
                    )}
                  </div>
                  {compareResults.upgraded.upgradedText && (
                    <div className="mt-2">
                      <p className="font-semibold text-sm">변환된 텍스트:</p>
                      <div className="p-2 bg-gray-50 rounded-md text-xs overflow-auto max-h-40">
                        {compareResults.upgraded.upgradedText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">사용 방법:</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>녹음 시작 버튼을 클릭하여 오디오 녹음을 시작합니다.</li>
            <li>녹음 중지 버튼을 클릭하여 녹음을 종료합니다.</li>
            <li>녹음된 오디오를 확인하고 업로드 버튼을 클릭합니다:</li>
            <ul className="list-disc pl-6 mt-1">
              <li><strong>일반 업로드</strong>: 기본 STT 변환만 적용</li>
              <li><strong>향상된 STT로 업로드</strong>: AI 기반 텍스트 품질 개선 적용</li>
            </ul>
            <li>또는, 기존 오디오 파일을 드래그하여 드롭존에 놓거나 파일 선택 버튼을 클릭하여 업로드할 수 있습니다.</li>
            <li>업로드 성공 시 두 방식의 STT 결과를 비교할 수 있습니다.</li>
          </ol>
        </div>
      </div>
    </AuthGuard>
  );
};

export default RecordPage;