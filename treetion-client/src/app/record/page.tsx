'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/taps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards';
import AudioRecorder from '@/components/recorder/AudioRecorder';
import AudioUpload from '@/components/recorder/AudioUpload';
import AudioFileList from '@/components/recorder/AudioFileList';
import TranscriptionDisplay from '@/components/recorder/TranscriptionDisplay';
import useAudioStore from '@/store/audio-store';
import useSTTStore from '@/store/stt-store';
import { ArrowDown, FileAudio, Mic, FileText, RefreshCw, X } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

export default function RecorderPage() {
  const [selectedTab, setSelectedTab] = useState<string>('record');
  const [showTranscription, setShowTranscription] = useState<boolean>(false);
  const router = useRouter();
  // 오디오 스토어
  const { 
    currentAudio,
    transcriptionId,
    transcriptionStatus,
    transcriptionResult,
    isTranscribing,
    fetchAudioFile,
    startTranscription,
    cancelCurrentTranscription,
    clearTranscriptionData
  } = useAudioStore();

  // STT 스토어
  const {
    transcriptId: sttTranscriptId,
    status: sttStatus,
    transcript: sttTranscript,
    isProcessing: sttIsProcessing,
    startSTT,
    cancelSTTProcess,
    clearSTTData
  } = useSTTStore();

  // 토큰 검증
  useEffect(() => {
    const validateToken = async () => {
      try {
        // 토큰 검증 API 호출
        await apiClient.get('/api/auth/validate');
      } catch (error) {
        // 로컬스토리지에 토큰이 있는지 확인
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!token && !refreshToken) {
          console.error('인증 정보가 없습니다');
          router.push('/auth/login');
          return;
        }
        
        if (error instanceof AxiosError) {
          console.error('Token validation failed:', error.message);
          
          // 401 에러가 아닌 경우 (서버 오류 등)는 리다이렉트하지 않음
          if (error.response && error.response.status === 401) {
            router.push('/auth/login');
          }
        }
      }
    };

    validateToken();
  }, [router]);

  // 녹음 완료 핸들러
  const handleRecordingComplete = (audioId: string | null) => {
    if (audioId) {
      fetchAudioFile(audioId);
    }
  };

  // 파일 업로드 완료 핸들러
  const handleUploadComplete = (audioId: string) => {
    fetchAudioFile(audioId);
    setSelectedTab('files');
  };

  // 파일 선택 핸들러
  const handleSelectFile = (audioId: string) => {
    fetchAudioFile(audioId);
  };

  // STT 변환 시작 핸들러 (내부 API 사용)
  const handleInternalTranscribe = (audioId: string) => {
    clearTranscriptionData();
    startTranscription(audioId);
    setShowTranscription(true);
  };

  // STT 변환 시작 핸들러 (외부 API 사용)
  const handleExternalTranscribe = (audioId: string) => {
    clearSTTData();
    startSTT(audioId);
    setShowTranscription(true);
  };

  // 트랜스크립션 취소 핸들러
  const handleCancelTranscription = () => {
    if (isTranscribing) {
      cancelCurrentTranscription();
    }
    
    if (sttIsProcessing) {
      cancelSTTProcess();
    }
  };

  // 트랜스크립션 결과 닫기
  const handleCloseTranscription = () => {
    setShowTranscription(false);
    clearTranscriptionData();
    clearSTTData();
  };

  // 파일 크기 포맷팅 (MB, KB)
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000) {
      return `${(bytes / 1000000).toFixed(2)} MB`;
    }
    return `${(bytes / 1000).toFixed(2)} KB`;
  };

  // 오디오 길이 포맷팅 (mm:ss)
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">오디오 레코더 및 STT 테스트</h1>
      <p className="text-gray-500 mb-8">
        오디오 녹음, 파일 업로드, STT 변환 기능을 테스트합니다.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 오디오 캡처/업로드 영역 */}
        <div className="lg:col-span-2">
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="record" className="flex items-center">
                <Mic size={16} className="mr-2" /> 녹음하기
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center">
                <FileAudio size={16} className="mr-2" /> 파일 업로드
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="record" className="mt-0 focus:outline-none">
              <Card>
                <CardHeader>
                  <CardTitle>오디오 녹음</CardTitle>
                  <CardDescription>
                    마이크를 사용하여 음성을 녹음합니다. 녹음을 마치면 자동으로 저장됩니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upload" className="mt-0 focus:outline-none">
              <Card>
                <CardHeader>
                  <CardTitle>오디오 파일 업로드</CardTitle>
                  <CardDescription>
                    오디오 파일을 드래그 앤 드롭하거나 파일 선택 버튼을 클릭하여 업로드합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudioUpload 
                    onUploadComplete={handleUploadComplete}
                    accept="audio/*"
                    maxSize={50 * 1024 * 1024} // 50 MB
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 파일 목록 */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">내 녹음 파일</h2>
            <AudioFileList 
              onSelectFile={handleSelectFile}
              onTranscribe={handleInternalTranscribe}
            />
          </div>
        </div>

        {/* 오른쪽: STT 변환 결과 영역 */}
        <div>
          <div className="sticky top-8">
            {/* 현재 선택된 오디오 정보 */}
            {currentAudio ? (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">선택된 오디오</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <p className="font-medium truncate">{currentAudio.fileName}</p>
                    <p className="text-sm text-gray-500">
                      길이: {formatDuration(currentAudio.duration)} | 
                      크기: {formatFileSize(currentAudio.size)}
                    </p>
                  </div>
                  
                  {/* 오디오 플레이어 */}
                  <audio 
                    src={`/api/audio/stream/${currentAudio.id}`} 
                    controls 
                    className="w-full mb-4"
                  />

                  {/* STT 변환 버튼 */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleInternalTranscribe(currentAudio.id)}
                      disabled={isTranscribing}
                      className={`flex items-center justify-center px-3 py-2 rounded-md text-sm
                        ${isTranscribing 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-primary text-white hover:bg-primary-dark'
                        }`}
                    >
                      {isTranscribing ? (
                        <>
                          <RefreshCw size={16} className="animate-spin mr-2" />
                          변환 중...
                        </>
                      ) : (
                        <>
                          <FileText size={16} className="mr-2" />
                          내부 API 변환
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleExternalTranscribe(currentAudio.id)}
                      disabled={sttIsProcessing}
                      className={`flex items-center justify-center px-3 py-2 rounded-md text-sm
                        ${sttIsProcessing 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-secondary text-white hover:bg-indigo-600'
                        }`}
                    >
                      {sttIsProcessing ? (
                        <>
                          <RefreshCw size={16} className="animate-spin mr-2" />
                          변환 중...
                        </>
                      ) : (
                        <>
                          <FileText size={16} className="mr-2" />
                          외부 STT 변환
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 border-dashed border-2">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <ArrowDown size={40} className="text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    왼쪽에서 오디오를 녹음하거나 업로드한 후 선택하세요
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 트랜스크립션 결과 표시 */}
            {showTranscription && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">트랜스크립션 결과</h3>
                  <button
                    onClick={handleCloseTranscription}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    title="닫기"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* 진행 중인 경우 취소 버튼 */}
                {(isTranscribing || sttIsProcessing) && (
                  <div className="mb-4">
                    <button
                      onClick={handleCancelTranscription}
                      className="w-full py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center justify-center"
                    >
                      <X size={16} className="mr-2" />
                      변환 취소
                    </button>
                  </div>
                )}
                
                {/* 내부 API 트랜스크립션 결과 */}
                {transcriptionId && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">내부 API 트랜스크립션</h4>
                    <TranscriptionDisplay 
                      transcriptionId={transcriptionId}
                      status={transcriptionStatus?.status || null}
                      result={transcriptionResult}
                      progress={transcriptionStatus?.progress}
                      error={transcriptionStatus?.error}
                    />
                  </div>
                )}

                {/* 외부 STT API 결과 */}
                {sttTranscriptId && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">외부 STT API</h4>
                    <TranscriptionDisplay 
                      transcriptionId={sttTranscriptId}
                      status={sttStatus?.status || null}
                      result={sttTranscript}
                      progress={sttStatus?.progress}
                      error={sttStatus?.error}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}