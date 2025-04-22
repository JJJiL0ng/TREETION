// src/interfaces/audio.interface.ts
export interface IAudioFile {
    audioId: string;
    fileName: string;
    title?: string;
    description?: string;
    fileSize: number;
    format: string;
    sampleRate?: number;
    channels?: number;
    bitrate?: number;
    duration: number;
    createdAt: Date;
    updatedAt: Date;
    hasTranscription: boolean;
    transcriptionId?: string;
    waveformData?: number[];
    tags?: string[];
    url: string;
  }
  
  export interface IPaginatedResponse<T> {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }
  
  export interface IChunkUploadSession {
    uploadId: string;
    userId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    title?: string;
    description?: string;
    tags?: string[];
    chunkSize: number;
    chunks: {
      [chunkNumber: number]: {
        received: boolean;
        timestamp: Date;
      };
    };
    expiresAt: Date;
    createdAt: Date;
  }
  
  export interface ITranscriptionOptions {
    punctuation?: boolean;
    paragraphs?: boolean;
    timestamps?: boolean;
  }
  
  export interface ITranscriptionRequest {
    transcriptionId: string;
    audioId: string;
    userId: string;
    language: string;
    options: ITranscriptionOptions;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    estimatedTime?: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
  }
  
  export interface ITranscriptionSegment {
    id: string;
    text: string;
    start: number;
    end: number;
    confidence: number;
  }
  
  export interface ITranscriptionParagraph {
    id: string;
    segments: string[];
    start: number;
    end: number;
  }
  
  export interface ITranscriptionResult {
    transcriptionId: string;
    audioId: string;
    language: string;
    text: string;
    segments: ITranscriptionSegment[];
    paragraphs: ITranscriptionParagraph[];
    metadata: {
      wordCount: number;
      duration: number;
      createdAt: Date;
      completedAt: Date;
    };
  }
  
  export interface IStorageUsage {
    used: number;
    total: number;
    percentage: number;
  }
  
  export interface ITranscriptionUsage {
    used: number;
    total: number;
    percentage: number;
  }
  
  export interface IFilesUsage {
    count: number;
    totalDuration: number;
  }
  
  export interface IUsageHistoryEntry {
    date: string;
    transcriptionSeconds: number;
    uploadedBytes: number;
  }
  
  export interface IUsageStats {
    storage: IStorageUsage;
    transcription: ITranscriptionUsage;
    files: IFilesUsage;
    history: IUsageHistoryEntry[];
  }
  
  export interface IUserLimits {
    plan: string;
    storage: {
      limit: number;
      used: number;
      available: number;
    };
    transcription: {
      limitPerMonth: number;
      usedThisMonth: number;
      available: number;
      resetDate: Date;
    };
    upload: {
      maxFileSize: number;
      maxDuration: number;
    };
  }
  