// hooks/recoder/useRecorder.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { uploadChunk, initChunkUpload, completeChunkUpload } from '@/lib/api/audio/record';

interface UseRecorderOptions {
  mimeType?: string;
  timeslice?: number;
  onUploadProgress?: (progress: number) => void;
}

interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  uploadedAudioId: string | null;
  isUploading: boolean;
  uploadProgress: number;
  error: Error | null;
}

export default function useRecorder({
  mimeType = 'audio/webm',
  timeslice = 1000,
  onUploadProgress,
}: UseRecorderOptions = {}) {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    audioUrl: null,
    audioBlob: null,
    uploadedAudioId: null,
    isUploading: false,
    uploadProgress: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 레코더 초기화
  const initRecorder = useCallback(async () => {
    try {
      // 사용자 미디어 접근 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 미디어 레코더 초기화
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // 데이터 수집 이벤트 핸들러
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // 레코딩 중지 이벤트 핸들러
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }));

        // 스트림 트랙 중지
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      console.error('Error initializing recorder:', error);
      return false;
    }
  }, [mimeType]);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    // 이미 녹음 중이면 무시
    if (state.isRecording) return;

    // 레코더 초기화
    const isInitialized = await initRecorder();
    if (!isInitialized || !mediaRecorderRef.current) return;

    try {
      // 이전 데이터 초기화
      chunksRef.current = [];
      
      // 녹음 시작
      mediaRecorderRef.current.start(timeslice);
      startTimeRef.current = Date.now();
      
      // 타이머 시작 (녹음 시간 업데이트)
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingTime: Date.now() - startTimeRef.current,
        }));
      }, 100);

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
        audioUrl: null,
        audioBlob: null,
        uploadedAudioId: null,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      console.error('Error starting recording:', error);
    }
  }, [state.isRecording, initRecorder, timeslice]);

  // 녹음 일시 정지
  const pauseRecording = useCallback(() => {
    if (!state.isRecording || state.isPaused || !mediaRecorderRef.current) return;

    try {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        
        // 타이머 정지
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setState(prev => ({ ...prev, isPaused: true }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      console.error('Error pausing recording:', error);
    }
  }, [state.isRecording, state.isPaused]);

  // 녹음 재개
  const resumeRecording = useCallback(() => {
    if (!state.isRecording || !state.isPaused || !mediaRecorderRef.current) return;

    try {
      if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        
        // 타이머 재시작
        timerRef.current = setInterval(() => {
          setState(prev => ({
            ...prev,
            recordingTime: prev.recordingTime + 100,
          }));
        }, 100);

        setState(prev => ({ ...prev, isPaused: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      console.error('Error resuming recording:', error);
    }
  }, [state.isRecording, state.isPaused]);

  // 녹음 중지
  const stopRecording = useCallback(() => {
    if (!state.isRecording || !mediaRecorderRef.current) return;

    try {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // 타이머 정지
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      console.error('Error stopping recording:', error);
    }
  }, [state.isRecording]);

  // 청크 업로드 함수
  const uploadRecording = useCallback(async () => {
    if (!state.audioBlob) return null;

    try {
      setState(prev => ({ 
        ...prev, 
        isUploading: true,
        uploadProgress: 0,
        error: null 
      }));

      const file = state.audioBlob;
      const fileName = `recording_${new Date().toISOString()}.webm`;
      
      // 1. 청크 업로드 세션 초기화
      const session = await initChunkUpload(fileName, file.size, file.type);
      
      // 2. 청크 크기 설정 (500KB)
      const chunkSize = 500 * 1024;
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      // 3. 청크로 분할하여 업로드
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        
        await uploadChunk(session.sessionId, chunk, i, totalChunks);
        
        // 업로드 진행률 업데이트
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setState(prev => ({ ...prev, uploadProgress: progress }));
        if (onUploadProgress) onUploadProgress(progress);
      }
      
      // 4. 업로드 완료 요청
      const result = await completeChunkUpload(session.sessionId);
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 100,
        uploadedAudioId: result.audioId
      }));
      
      return result.audioId;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        error: error as Error 
      }));
      console.error('Error uploading recording:', error);
      return null;
    }
  }, [state.audioBlob, onUploadProgress]);

  // 리소스 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadRecording,
  };
}