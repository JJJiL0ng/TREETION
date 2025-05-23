'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/auth/client';
import { useUserStore } from '@/store/user-store';
import { useRequiredAuth } from '@/hooks/auth/useRequiredAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';

const RecordPage = () => {
  // 인증 관련 훅 사용
  const { user, isLoading: authLoading } = useRequiredAuth('/auth/login');
  const router = useRouter();
  
  // 상태 관리
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFileName, setDraggedFileName] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('ko');
  const [processingStatus, setProcessingStatus] = useState('');
  
  // API URL 설정
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  // 레퍼런스
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
    formData.append('language', selectedLanguage);

    return formData;
  };
  
  // 서버에 오디오 업로드 - STT + GPT 처리가 자동으로 적용됨
  const uploadAudio = async () => {
    if (!audioBlob) {
      setUploadStatus('업로드할 오디오가 없습니다.');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadStatus('업로드 중...');
      setProcessingStatus('processing');
      
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
      // 새로운 통합 엔드포인트 (/audio/upload)를 사용
      console.log('API 엔드포인트:', `${API_URL}/audio/upload`);
      const response = await api.upload('/audio/upload', formData);
      
      console.log('업로드 응답:', response);
      setUploadStatus('업로드 성공! STT 변환 및 GPT 품질 향상이 적용되었습니다. 오디오 ID: ' + response.id);
      setProcessingStatus('completed');
      
      // 업로드 결과 저장
      setUploadResult(response);
      
      // 업로드 후 상태 초기화
      setAudioBlob(null);
      setDraggedFileName('');
      
    } catch (error: any) {
      console.error('업로드 오류:', error);
      setProcessingStatus('failed');
      
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

  // 기존 오디오에 대한 STT 업그레이드 요청
  const upgradeExistingAudio = async (audioId: string) => {
    if (!audioId) {
      setUploadStatus('업그레이드할 오디오 ID가 필요합니다.');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadStatus(`오디오 ID: ${audioId}에 대한 STT 업그레이드 처리 중...`);
      
      // PUT 요청을 통해 업그레이드 요청
      const response = await api.put(`/audio/${audioId}/upgrade-stt`);
      
      console.log('업그레이드 응답:', response);
      setUploadStatus('STT 업그레이드 성공! 오디오 ID: ' + response.id);
      
      // 업로드 결과 업데이트
      setUploadResult(response);
      
    } catch (error: any) {
      console.error('업그레이드 오류:', error);
      
      const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
      setUploadStatus(`STT 업그레이드 실패: ${errorMessage}`);
      
      if (error.response?.status === 401) {
        setUploadStatus('인증이 필요합니다. 다시 로그인해주세요.');
        useUserStore.getState().logout();
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  // 업로드된 오디오 조회
  const fetchAudioDetails = async (audioId: string) => {
    if (!audioId) {
      setUploadStatus('조회할 오디오 ID가 필요합니다.');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadStatus(`오디오 ID: ${audioId} 정보 조회 중...`);
      
      // GET 요청을 통해 오디오 정보 조회
      const response = await api.get(`/audio/${audioId}`);
      
      console.log('오디오 정보:', response);
      setUploadStatus('오디오 정보 조회 성공! 오디오 ID: ' + response.id);
      
      // 업로드 결과 업데이트
      setUploadResult(response);
      
    } catch (error: any) {
      console.error('조회 오류:', error);
      
      const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
      setUploadStatus(`오디오 정보 조회 실패: ${errorMessage}`);
    } finally {
      setIsUploading(false);
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
        <h1 className="text-2xl font-bold mb-6">오디오 녹음 및 STT+GPT 변환</h1>
        
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
        
        {/* 언어 선택 옵션 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">오디오 언어:</label>
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={isRecording || isUploading}
          >
            <option value="ko">한국어 (Korean)</option>
            <option value="en">영어 (English)</option>
            <option value="ja">일본어 (Japanese)</option>
            <option value="zh">중국어 (Chinese)</option>
            <option value="es">스페인어 (Spanish)</option>
            <option value="fr">프랑스어 (French)</option>
            <option value="de">독일어 (German)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">STT 변환 시 사용될 언어를 선택하세요.</p>
        </div>
        
        <div className="mb-6 flex flex-col items-center">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="mb-4 px-6 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isUploading}
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
              
              {/* 업로드 버튼 */}
              <button 
                onClick={uploadAudio}
                disabled={isUploading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </span>
                ) : 'STT+GPT 변환 업로드'}
              </button>
              
              {/* 업로드 버튼 아래 설명 */}
              <div className="mt-2 text-xs text-center text-gray-600 max-w-md">
                <p>STT+GPT 변환 업로드: 음성 인식(STT) 변환 및 GPT를 활용한 텍스트 품질 향상이 모두 적용됩니다.</p>
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
                  disabled={isRecording || isUploading}
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
        
        {/* 처리 상태 표시기 */}
        {processingStatus === 'processing' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <svg className="animate-spin mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              STT+GPT 처리 중...
            </h3>
            <p className="text-sm text-blue-700">오디오 파일을 텍스트로 변환하고 GPT로 품질을 향상시키는 중입니다. 이 과정은 오디오 길이에 따라 몇 분이 소요될 수 있습니다.</p>
          </div>
        )}
        
        {/* 업로드 결과 표시 영역 */}
        {uploadResult && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">STT+GPT 변환 결과</h2>
            
            <div className="border p-3 rounded-lg bg-white mb-4">
              <h3 className="font-medium mb-2 text-blue-700">오디오 정보</h3>
              <div className="text-sm mb-2">
                <p><span className="font-semibold">ID:</span> {uploadResult.id}</p>
                <p><span className="font-semibold">제목:</span> {uploadResult.title}</p>
                <p><span className="font-semibold">상태:</span> {uploadResult.processingStatus === 'completed' ? '완료됨' : 
                  uploadResult.processingStatus === 'processing' ? '처리 중' : 
                  uploadResult.processingStatus === 'failed' ? '실패' : 
                  uploadResult.isUpgraded ? '업그레이드됨' : '처리됨'}</p>
                {uploadResult.duration && <p><span className="font-semibold">길이:</span> {Math.round(uploadResult.duration)}초</p>}
                {uploadResult.language && <p><span className="font-semibold">언어:</span> {uploadResult.language}</p>}
                {uploadResult.improvedPercentage && <p><span className="font-semibold">텍스트 개선율:</span> {uploadResult.improvedPercentage}%</p>}
              </div>
              
              {/* 오디오 재생 */}
              {uploadResult.audioUrl && (
                <div className="my-3">
                  <p className="font-semibold text-sm mb-1">오디오:</p>
                  <audio 
                    controls 
                    src={uploadResult.audioUrl} 
                    className="w-full"
                  />
                </div>
              )}
              
              {/* 원본 STT 텍스트 표시 */}
              {uploadResult.transcriptionText && (
                <div className="mt-4">
                  <p className="font-semibold text-sm">원본 STT 텍스트:</p>
                  <div className="p-3 bg-gray-50 rounded-md text-sm overflow-auto max-h-60 mt-1 whitespace-pre-wrap">
                    {uploadResult.transcriptionText}
                  </div>
                </div>
              )}
              
              {/* 업그레이드된 텍스트 표시 */}
              {uploadResult.upgradedText && (
                <div className="mt-4">
                  <p className="font-semibold text-sm">GPT로 향상된 텍스트:</p>
                  <div className="p-3 bg-green-50 rounded-md text-sm overflow-auto max-h-60 mt-1 whitespace-pre-wrap border border-green-100">
                    {uploadResult.upgradedText}
                  </div>
                </div>
              )}
              
              {/* STT 업그레이드 버튼 - 이미 변환된 텍스트가 있지만 업그레이드가 안된 경우 표시 */}
              {uploadResult.transcriptionText && !uploadResult.upgradedText && (
                <div className="mt-4">
                  <button
                    onClick={() => upgradeExistingAudio(uploadResult.id)}
                    disabled={isUploading}
                    className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        처리 중...
                      </span>
                    ) : 'GPT로 텍스트 품질 향상하기'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">GPT를 사용하여 STT 텍스트의 품질을 향상시킵니다.</p>
                </div>
              )}
              
              {/* 오디오 정보 다시 조회 버튼 */}
              <div className="mt-4">
                <button
                  onClick={() => fetchAudioDetails(uploadResult.id)}
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUploading ? '로딩 중...' : '정보 새로고침'}
                </button>
                <p className="text-xs text-gray-500 mt-1">처리 상태 및 결과를 최신 정보로 업데이트합니다.</p>
              </div>
            </div>
            
            {/* 텍스트 비교 뷰 - 원본과 향상된 텍스트가 모두 있는 경우 */}
            {uploadResult.transcriptionText && uploadResult.upgradedText && (
              <div className="border p-3 rounded-lg bg-white">
                <h3 className="font-medium mb-2 text-indigo-700">텍스트 비교</h3>
                <p className="text-sm text-gray-600 mb-2">원본 STT와 GPT로 향상된 텍스트의 차이점을 비교합니다.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-semibold text-sm mb-1 text-gray-700">원본 STT:</p>
                    <div className="text-sm overflow-auto max-h-60 whitespace-pre-wrap">
                      {uploadResult.transcriptionText}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-md border border-green-100">
                    <p className="font-semibold text-sm mb-1 text-green-700">GPT 향상 텍스트:</p>
                    <div className="text-sm overflow-auto max-h-60 whitespace-pre-wrap">
                      {uploadResult.upgradedText}
                    </div>
                  </div>
                </div>
                
                {uploadResult.improvedPercentage && (
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-indigo-700">텍스트 개선율: {uploadResult.improvedPercentage}%</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* 수동으로 오디오 ID 조회 섹션 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">기존 오디오 조회</h2>
          <p className="text-sm mb-3">이전에 업로드한 오디오의 ID를 입력하여 STT 및 GPT 처리 결과를 확인할 수 있습니다.</p>
          
          <div className="flex">
            <input
              type="text"
              placeholder="오디오 ID 입력"
              className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="audioIdInput"
            />
            <button
              onClick={() => {
                const input = document.getElementById('audioIdInput') as HTMLInputElement;
                if (input && input.value) {
                  fetchAudioDetails(input.value);
                } else {
                  setUploadStatus('오디오 ID를 입력해주세요.');
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
              disabled={isUploading}
            >
              조회
            </button>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">사용 방법:</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>녹음 시작 버튼을 클릭하여 오디오 녹음을 시작합니다.</li>
            <li>녹음 중지 버튼을 클릭하여 녹음을 종료합니다.</li>
            <li>업로드 전 오디오 언어를 선택합니다 (한국어, 영어 등).</li>
            <li>STT+GPT 변환 업로드 버튼을 클릭하여 파일을 업로드합니다:</li>
            <ul className="list-disc pl-6 mt-1">
              <li>음성 인식(STT) 변환과 GPT 텍스트 품질 향상이 자동으로 적용됩니다.</li>
              <li>처리 시간은 오디오 길이에 따라 달라질 수 있습니다.</li>
            </ul>
            <li>또는, 기존 오디오 파일을 드래그하여 드롭존에 놓거나 파일 선택 버튼을 클릭하여 업로드할 수 있습니다.</li>
            <li>업로드 후 처리 결과를 확인할 수 있으며, 원본 STT와 GPT로 향상된 텍스트를 비교할 수 있습니다.</li>
            <li>이미 업로드한 오디오의 ID를 입력하여 기존 처리 결과를 조회할 수 있습니다.</li>
          </ol>
        </div>
      </div>
    </AuthGuard>
  );
};

export default RecordPage;