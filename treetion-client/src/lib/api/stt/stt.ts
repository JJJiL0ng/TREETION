// lib/api/stt/stt.ts
import apiClient from '@/lib/api/client';

// STT 트랜스크립션 상태 타입
export interface STTStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

// STT 트랜스크립션 결과 타입
export interface STTTranscript {
  id: string;
  text: string;
  segments: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  metadata?: {
    duration: number;
    language: string;
    model: string;
  };
}

// STT 프로바이더 상태 타입
export interface STTProvider {
  id: string;
  name: string;
  isAvailable: boolean;
  features: string[];
}

// 1. STT 변환 요청
export const transcribeSTT = async (audioId: string, options?: { language?: string; model?: string }) => {
  const response = await apiClient.post('/api/stt/transcribe/${audioId}', options);
  return response.data;
};

// 2. STT 변환 상태 확인
export const getSTTStatus = async (transcriptId: string) => {
  const response = await apiClient.get(`/api/stt/status/${transcriptId}`);
  return response.data as STTStatus;
};

// 3. 특정 STT 트랜스크립션 결과 조회
export const getSTTTranscript = async (transcriptId: string) => {
  const response = await apiClient.get(`/api/stt/transcripts/${transcriptId}`);
  return response.data as STTTranscript;
};

// 4. 모든 STT 트랜스크립션 결과 조회
export const getAllSTTTranscripts = async () => {
  const response = await apiClient.get('/api/stt/transcripts');
  return response.data as STTTranscript[];
};

// 5. STT 변환 취소
export const cancelSTT = async (transcriptId: string) => {
  const response = await apiClient.post(`/api/stt/cancel/${transcriptId}`);
  return response.data;
};

// 6. STT 프로바이더 상태 조회
export const getSTTProviders = async () => {
  const response = await apiClient.get('/api/stt/providers/status');
  return response.data as STTProvider[];
};