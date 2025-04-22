// src/stt/interfaces/stt-provider.interface.ts
export interface ISTTOptions {
    language?: string;
    punctuation?: boolean;
    paragraphs?: boolean;
    timestamps?: boolean;
    maxAlternatives?: number;
    wordConfidence?: boolean;
    speakerLabels?: boolean;
  }
  
  export interface ISTTResult {
    text: string;
    segments: ISTTSegment[];
    confidence: number;
    language: string;
    duration: number;
  }
  
  export interface ISTTSegment {
    id: string;
    text: string;
    start: number;
    end: number;
    confidence: number;
    words?: ISTTWord[];
    speaker?: string;
  }
  
  export interface ISTTWord {
    text: string;
    start: number;
    end: number;
    confidence: number;
  }
  
  export interface ISTTJobStatus {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
  }
  
  export interface ISTTProvider {
    /**
     * STT 변환 요청 시작
     * @param audioPath 오디오 파일 경로
     * @param options 변환 옵션
     * @returns 작업 ID
     */
    startTranscription(audioPath: string, options: ISTTOptions): Promise<string>;
    
    /**
     * STT 변환 작업 상태 확인
     * @param jobId 작업 ID
     * @returns 작업 상태 정보
     */
    getTranscriptionStatus(jobId: string): Promise<ISTTJobStatus>;
    
    /**
     * STT 변환 결과 조회
     * @param jobId 작업 ID
     * @returns 변환 결과
     */
    getTranscriptionResult(jobId: string): Promise<ISTTResult>;
    
    /**
     * STT 변환 작업 취소
     * @param jobId 작업 ID
     * @returns 취소 성공 여부
     */
    cancelTranscription(jobId: string): Promise<boolean>;
  }