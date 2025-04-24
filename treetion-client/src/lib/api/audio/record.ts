// lib/api/audio/record.ts
import apiClient from '@/lib/api/client';

// 오디오 파일 관련 타입
export interface AudioFile {
  id: string;
  fileName: string;
  duration: number;
  size: number;
  url: string;
  createdAt: string;
  status: 'processed' | 'processing' | 'failed';
}

// 청크 업로드 세션 타입
export interface ChunkUploadSession {
  sessionId: string;
  expiresAt: string;
}

// 트랜스크립션 상태 타입
export interface TranscriptionStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

// 트랜스크립션 결과 타입
export interface TranscriptionResult {
  id: string;
  text: string;
  segments: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
}

// 사용 통계 타입
export interface UsageStats {
  totalRecordings: number;
  totalDuration: number;
  totalTranscriptions: number;
  storageUsed: number;
}

// 사용 제한 타입
export interface UsageLimits {
  maxRecordings: number;
  maxDuration: number;
  maxStorage: number;
  remainingQuota: number;
}

// 1. 오디오 파일 직접 업로드
export const uploadAudioFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/api/audio/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 2. 청크 업로드 초기화
export const initChunkUpload = async (fileName: string, fileSize: number, mimeType: string) => {
  const response = await apiClient.post('/api/audio/upload/chunk/init', {
    fileName,
    fileSize,
    mimeType,
  });
  return response.data as ChunkUploadSession;
};

// 3. 청크 업로드
export const uploadChunk = async (sessionId: string, chunk: Blob, chunkIndex: number, totalChunks: number) => {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());

  const response = await apiClient.post(`/api/audio/upload/chunk?sessionId=${sessionId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 4. 청크 업로드 완료
export const completeChunkUpload = async (sessionId: string) => {
  const response = await apiClient.post(`/api/audio/upload/chunk/complete?sessionId=${sessionId}`);
  return response.data;
};

// 5. 오디오 파일 목록 조회
export const getAudioFiles = async () => {
  const response = await apiClient.get('/api/audio/files');
  return response.data as AudioFile[];
};

// 6. 특정 오디오 파일 조회
export const getAudioFile = async (audioId: string) => {
  const response = await apiClient.get(`/api/audio/files/${audioId}`);
  return response.data as AudioFile;
};

// 7. 오디오 파일 정보 수정
export const updateAudioFile = async (audioId: string, data: { fileName?: string }) => {
  const response = await apiClient.put(`/api/audio/files/${audioId}`, data);
  return response.data;
};

// 8. 오디오 파일 삭제
export const deleteAudioFile = async (audioId: string) => {
  const response = await apiClient.delete(`/api/audio/files/${audioId}`);
  return response.data;
};

// 9. 음성 인식 요청
export const transcribeAudio = async (audioId: string, options?: { language?: string }) => {
  const response = await apiClient.post('/api/audio/transcribe', {
    audioId,
    ...options,
  });
  return response.data;
};

// 10. 음성 인식 상태 확인
export const getTranscriptionStatus = async (transcriptionId: string) => {
  const response = await apiClient.get(`/api/audio/transcribe/status/${transcriptionId}`);
  return response.data as TranscriptionStatus;
};

// 11. 음성 인식 결과 조회
export const getTranscriptionResult = async (transcriptionId: string) => {
  const response = await apiClient.get(`/api/audio/transcribe/result/${transcriptionId}`);
  return response.data as TranscriptionResult;
};

// 12. 음성 인식 취소
export const cancelTranscription = async (transcriptionId: string) => {
  const response = await apiClient.post(`/api/audio/transcribe/cancel/${transcriptionId}`);
  return response.data;
};

// 13. 오디오 스트리밍 URL 가져오기
export const getAudioStreamUrl = (audioId: string) => {
  return `${apiClient.defaults.baseURL}/api/audio/stream/${audioId}`;
};

// 14. 오디오 파형 데이터 가져오기
export const getAudioWaveform = async (audioId: string) => {
  const response = await apiClient.get(`/api/audio/waveform/${audioId}`);
  return response.data;
};

// 15. 사용 통계 조회
export const getUsageStats = async () => {
  const response = await apiClient.get('/api/audio/usage/stats');
  return response.data as UsageStats;
};

// 16. 사용 제한 조회
export const getUsageLimits = async () => {
  const response = await apiClient.get('/api/audio/usage/limits');
  return response.data as UsageLimits;
};