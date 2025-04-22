// src/interfaces/stt.interface.ts
export interface ISTTResponse {
    jobId: string;
    status: string;
    text?: string;
    segments?: {
      start: number;
      end: number;
      text: string;
    }[];
    error?: string;
  }