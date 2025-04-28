import { create } from 'zustand';
import {
  transcribeSTT,
  getSTTStatus,
  getSTTTranscript,
  cancelSTT,
  getSTTProviders,
  STTStatus,
  STTTranscript,
  STTProvider
} from '@/lib/api/stt/stt';

interface STTStore {
  // 상태
  transcriptId: string | null;
  status: STTStatus | null;
  transcript: STTTranscript | null;
  providers: STTProvider[];
  isProcessing: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // 액션
  startSTT: (audioId: string, options?: { language?: string; model?: string }) => Promise<void>;
  checkSTTStatus: () => Promise<void>;
  fetchSTTTranscript: () => Promise<void>;
  cancelSTTProcess: () => Promise<void>;
  fetchSTTProviders: () => Promise<void>;
  clearSTTData: () => void;
  clearError: () => void;
}

const useSTTStore = create<STTStore>((set, get) => ({
  // 초기 상태
  transcriptId: null,
  status: null,
  transcript: null,
  providers: [],
  isProcessing: false,
  isLoading: false,
  error: null,
  
  // STT 변환 시작
  startSTT: async (audioId: string, options?: { language?: string; model?: string }) => {
    set({ isLoading: true, isProcessing: true, error: null });
    try {
      const result = await transcribeSTT(audioId, options);
      set({ 
        transcriptId: result.transcriptId,
        isLoading: false 
      });
      
      // 자동으로 상태 확인 시작
      get().checkSTTStatus();
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false,
        isProcessing: false
      });
      console.error('Failed to start STT:', error);
    }
  },
  
  // STT 상태 확인
  checkSTTStatus: async () => {
    const { transcriptId, isProcessing } = get();
    if (!transcriptId || !isProcessing) return;
    
    try {
      const status = await getSTTStatus(transcriptId);
      set({ status });
      
      // 완료되었으면 결과 가져오기
      if (status.status === 'completed') {
        get().fetchSTTTranscript();
      } 
      // 실패했으면 상태 초기화
      else if (status.status === 'failed') {
        set({ 
          isProcessing: false,
          error: new Error(status.error || 'STT processing failed')
        });
      }
      // 진행 중이면 2초 후 다시 확인
      else if (status.status === 'queued' || status.status === 'processing') {
        setTimeout(() => {
          get().checkSTTStatus();
        }, 2000);
      }
    } catch (error) {
      set({ 
        error: error as Error,
        isProcessing: false
      });
      console.error('Failed to check STT status:', error);
    }
  },
  
  // STT 결과 가져오기
  fetchSTTTranscript: async () => {
    const { transcriptId } = get();
    if (!transcriptId) return;
    
    set({ isLoading: true });
    try {
      const transcript = await getSTTTranscript(transcriptId);
      set({ 
        transcript,
        isLoading: false,
        isProcessing: false
      });
    } catch (error) {
      set({ 
        error: error as Error,
        isLoading: false,
        isProcessing: false
      });
      console.error('Failed to fetch STT transcript:', error);
    }
  },
  
  // STT 변환 취소
  cancelSTTProcess: async () => {
    const { transcriptId } = get();
    if (!transcriptId) return;
    
    set({ isLoading: true });
    try {
      await cancelSTT(transcriptId);
      set({
        isProcessing: false,
        isLoading: false,
        status: {
          id: transcriptId,
          status: 'failed',
          error: 'Cancelled by user'
        }
      });
    } catch (error) {
      set({ 
        error: error as Error,
        isLoading: false
      });
      console.error('Failed to cancel STT:', error);
    }
  },
  
  // STT 프로바이더 정보 가져오기
  fetchSTTProviders: async () => {
    set({ isLoading: true });
    try {
      const providers = await getSTTProviders();
      set({ providers, isLoading: false });
    } catch (error) {
      set({ 
        error: error as Error,
        isLoading: false
      });
      console.error('Failed to fetch STT providers:', error);
    }
  },
  
  // STT 데이터 초기화
  clearSTTData: () => {
    set({
      transcriptId: null,
      status: null,
      transcript: null,
      isProcessing: false
    });
  },
  
  // 에러 초기화
  clearError: () => {
    set({ error: null });
  }
}));

export default useSTTStore;