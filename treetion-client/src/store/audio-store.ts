import { create } from 'zustand';
import { 
  getAudioFiles, 
  getAudioFile, 
  deleteAudioFile, 
  transcribeAudio,
  getTranscriptionStatus,
  getTranscriptionResult,
  cancelTranscription,
  AudioFile,
  TranscriptionStatus,
  TranscriptionResult
} from '@/lib/api/audio/record';

interface AudioStore {
  // 상태
  audioFiles: AudioFile[];
  currentAudio: AudioFile | null;
  isLoading: boolean;
  error: Error | null;
  
  // 트랜스크립션 상태
  transcriptionId: string | null;
  transcriptionStatus: TranscriptionStatus | null;
  transcriptionResult: TranscriptionResult | null;
  isTranscribing: boolean;
  
  // 액션
  fetchAudioFiles: () => Promise<void>;
  fetchAudioFile: (id: string) => Promise<void>;
  deleteAudio: (id: string) => Promise<void>;
  setCurrentAudio: (audio: AudioFile | null) => void;
  clearError: () => void;
  
  // 트랜스크립션 액션
  startTranscription: (audioId: string, options?: { language?: string }) => Promise<void>;
  checkTranscriptionStatus: () => Promise<void>;
  fetchTranscriptionResult: () => Promise<void>;
  cancelCurrentTranscription: () => Promise<void>;
  clearTranscriptionData: () => void;
}

const useAudioStore = create<AudioStore>((set, get) => ({
  // 초기 상태
  audioFiles: [],
  currentAudio: null,
  isLoading: false,
  error: null,
  
  transcriptionId: null,
  transcriptionStatus: null,
  transcriptionResult: null,
  isTranscribing: false,
  
  // 오디오 파일 목록 가져오기
  fetchAudioFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await getAudioFiles();
      set({ audioFiles: files, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Failed to fetch audio files:', error);
    }
  },
  
  // 특정 오디오 파일 가져오기
  fetchAudioFile: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const file = await getAudioFile(id);
      set({ currentAudio: file, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Failed to fetch audio file:', error);
    }
  },
  
  // 오디오 파일 삭제
  deleteAudio: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteAudioFile(id);
      // 삭제 성공 시 목록에서 제거
      set(state => ({ 
        audioFiles: state.audioFiles.filter(file => file.id !== id),
        currentAudio: state.currentAudio?.id === id ? null : state.currentAudio,
        isLoading: false 
      }));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Failed to delete audio file:', error);
    }
  },
  
  // 현재 오디오 설정
  setCurrentAudio: (audio: AudioFile | null) => {
    set({ currentAudio: audio });
  },
  
  // 에러 초기화
  clearError: () => {
    set({ error: null });
  },
  
  // 트랜스크립션 시작
  startTranscription: async (audioId: string, options?: { language?: string }) => {
    set({ isLoading: true, isTranscribing: true, error: null });
    try {
      const result = await transcribeAudio(audioId, options);
      set({ 
        transcriptionId: result.transcriptionId,
        isLoading: false 
      });
      
      // 자동으로 상태 확인 시작
      get().checkTranscriptionStatus();
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false,
        isTranscribing: false
      });
      console.error('Failed to start transcription:', error);
    }
  },
  
  // 트랜스크립션 상태 확인
  checkTranscriptionStatus: async () => {
    const { transcriptionId, isTranscribing } = get();
    if (!transcriptionId || !isTranscribing) return;
    
    try {
      const status = await getTranscriptionStatus(transcriptionId);
      set({ transcriptionStatus: status });
      
      // 완료되었으면 결과 가져오기
      if (status.status === 'completed') {
        get().fetchTranscriptionResult();
      } 
      // 실패했으면 트랜스크립션 상태 초기화
      else if (status.status === 'failed') {
        set({ 
          isTranscribing: false,
          error: new Error(status.error || 'Transcription failed')
        });
      }
      // 진행 중이면 2초 후 다시 확인
      else if (status.status === 'queued' || status.status === 'processing') {
        setTimeout(() => {
          get().checkTranscriptionStatus();
        }, 2000);
      }
    } catch (error) {
      set({ 
        error: error as Error,
        isTranscribing: false
      });
      console.error('Failed to check transcription status:', error);
    }
  },
  
  // 트랜스크립션 결과 가져오기
  fetchTranscriptionResult: async () => {
    const { transcriptionId } = get();
    if (!transcriptionId) return;
    
    set({ isLoading: true });
    try {
      const result = await getTranscriptionResult(transcriptionId);
      set({ 
        transcriptionResult: result,
        isLoading: false,
        isTranscribing: false
      });
    } catch (error) {
      set({ 
        error: error as Error,
        isLoading: false,
        isTranscribing: false
      });
      console.error('Failed to fetch transcription result:', error);
    }
  },
  
  // 현재 트랜스크립션 취소
  cancelCurrentTranscription: async () => {
    const { transcriptionId } = get();
    if (!transcriptionId) return;
    
    set({ isLoading: true });
    try {
      await cancelTranscription(transcriptionId);
      set({
        isTranscribing: false,
        isLoading: false,
        transcriptionStatus: {
          id: transcriptionId,
          status: 'failed',
          error: 'Cancelled by user'
        }
      });
    } catch (error) {
      set({ 
        error: error as Error,
        isLoading: false
      });
      console.error('Failed to cancel transcription:', error);
    }
  },
  
  // 트랜스크립션 데이터 초기화
  clearTranscriptionData: () => {
    set({
      transcriptionId: null,
      transcriptionStatus: null,
      transcriptionResult: null,
      isTranscribing: false
    });
  }
}));

export { useAudioStore };
export default useAudioStore;