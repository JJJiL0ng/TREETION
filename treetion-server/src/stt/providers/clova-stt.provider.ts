// src/stt/providers/clova-stt.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { 
  ISTTProvider, 
  ISTTOptions, 
  ISTTJobStatus, 
  ISTTResult, 
  ISTTSegment,
  ISTTWord 
} from '../../interfaces/stt-provider.interface';

@Injectable()
export class ClovaSTTProvider implements ISTTProvider {
  private readonly logger = new Logger(ClovaSTTProvider.name);
  private readonly invokeUrl: string;
  private readonly secretKey: string;
  private readonly jobs: Map<string, ISTTJobStatus> = new Map();
  private readonly results: Map<string, ISTTResult> = new Map();
  
  constructor(private configService: ConfigService) {
    this.invokeUrl = this.configService.get<string>('api.clova.invokeUrl') || '';
    this.secretKey = this.configService.get<string>('api.clova.secretKey') || '';
    
    if (!this.invokeUrl || !this.secretKey) {
      this.logger.warn('Clova STT API 설정이 완료되지 않았습니다.');
    }
  }
  
  /**
   * STT 변환 요청 시작
   */
  async startTranscription(audioPath: string, options: ISTTOptions): Promise<string> {
    this.logger.log(`STT 변환 시작: ${audioPath}`);
    const jobId = uuidv4();
    
    // 작업 상태 초기화
    this.jobs.set(jobId, {
      jobId,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    });
    
    // 비동기 작업 시작
    this.processTranscription(jobId, audioPath, options).catch(error => {
      this.logger.error(`STT 변환 처리 중 오류 발생: ${error.message}`, error.stack);
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        this.jobs.set(jobId, job);
      }
    });
    
    return jobId;
  }
  
  /**
   * STT 변환 작업 상태 확인
   */
  async getTranscriptionStatus(jobId: string): Promise<ISTTJobStatus> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error('변환 작업을 찾을 수 없습니다.');
    }
    
    return job;
  }
  
  /**
   * STT 변환 결과 조회
   */
  async getTranscriptionResult(jobId: string): Promise<ISTTResult> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error('변환 작업을 찾을 수 없습니다.');
    }
    
    if (job.status !== 'completed') {
      throw new Error('변환 작업이 완료되지 않았습니다.');
    }
    
    const result = this.results.get(jobId);
    
    if (!result) {
      throw new Error('변환 결과를 찾을 수 없습니다.');
    }
    
    return result;
  }
  
  /**
   * STT 변환 작업 취소
   */
  async cancelTranscription(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error('변환 작업을 찾을 수 없습니다.');
    }
    
    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      throw new Error('이미 완료되거나 취소된 작업입니다.');
    }
    
    // 작업 상태 변경
    job.status = 'cancelled';
    this.jobs.set(jobId, job);
    
    // 실제로는 여기서 Clova STT API에 취소 요청 필요
    this.logger.log(`STT 변환 작업 취소: ${jobId}`);
    
    return true;
  }
  
  /**
   * 실제 변환 작업 처리 (비동기)
   */
  private async processTranscription(jobId: string, audioPath: string, options: ISTTOptions): Promise<void> {
    try {
      // 작업 상태 업데이트
      let job = this.jobs.get(jobId);
      if (job) {
        job.status = 'processing';
        job.startedAt = new Date();
        job.progress = 0.1;
        this.jobs.set(jobId, job);
      }
      
      this.logger.log(`STT 변환 처리 중: ${jobId}, 파일: ${audioPath}`);
      
      // 파일 존재 확인
      if (!fs.existsSync(audioPath)) {
        throw new Error(`오디오 파일을 찾을 수 없습니다: ${audioPath}`);
      }
      
      // 파일 읽기
      const fileData = await fs.promises.readFile(audioPath);
      
      // Clova STT API 호출 옵션 설정
      const requestConfig = {
        url: this.invokeUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-CLOVASPEECH-API-KEY': this.secretKey,
          'X-CLOVASPEECH-LANGUAGE': options.language || 'ko',
          'X-CLOVASPEECH-COMPLETION': 'sync', // 또는 'async'
        },
        data: fileData,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000, // 5분 타임아웃
      };
      
      // 추가 옵션 설정
      if (options.punctuation !== undefined) {
        requestConfig.headers['X-CLOVASPEECH-OPTION-DIARIZATION'] = options.punctuation ? 'true' : 'false';
      }
      
      if (options.speakerLabels !== undefined) {
        requestConfig.headers['X-CLOVASPEECH-OPTION-SPEAKERLABEL'] = options.speakerLabels ? 'true' : 'false';
      }
      
      // 진행 상태 업데이트
      job = this.jobs.get(jobId);
      if (job) {
        job.progress = 0.2;
        this.jobs.set(jobId, job);
      }
      
      // 여기서는 실제 API 요청 대신 가상의 처리를 수행 (개발 및 테스트 목적)
      // 실제 환경에서는 아래 주석을 해제하고 실제 API 요청을 수행해야 함
      /*
      this.logger.log(`Clova STT API 요청: ${requestConfig.url}`);
      const response = await axios(requestConfig);
      this.logger.log(`Clova STT API 응답 수신: 상태 코드 ${response.status}`);
      */
      
      // 가상의 처리 (실제 구현에서는 제거 필요)
      // 변환 작업을 시뮬레이션하기 위한 지연
      await this.simulateProcessing(jobId);
      
      // 가상의 응답 데이터 (실제 구현에서는 제거 필요)
      const mockResponse = this.createMockResponse(audioPath, options);
      
      // 진행 상태 업데이트
      job = this.jobs.get(jobId);
      if (job) {
        job.progress = 0.9;
        this.jobs.set(jobId, job);
      }
      
      // 결과 파싱
      const result = this.parseResponse(mockResponse, options);
      
      // 결과 저장
      this.results.set(jobId, result);
      
      // 작업 상태 완료로 업데이트
      job = this.jobs.get(jobId);
      if (job) {
        job.status = 'completed';
        job.completedAt = new Date();
        job.progress = 1.0;
        this.jobs.set(jobId, job);
      }
      
      this.logger.log(`STT 변환 완료: ${jobId}`);
      
    } catch (error) {
      // 오류 처리
      this.logger.error(`STT 변환 오류: ${error.message}`, error.stack);
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        this.jobs.set(jobId, job);
      }
      
      throw error;
    }
  }
  
  /**
   * 가상의 처리 지연 (실제 구현에서는 제거 필요)
   */
  private async simulateProcessing(jobId: string): Promise<void> {
    for (let progress = 0.3; progress <= 0.9; progress += 0.1) {
      // 작업 취소 확인
      let job = this.jobs.get(jobId);
      if (job && job.status === 'cancelled') {
        throw new Error('작업이 취소되었습니다.');
      }
      
      // 진행률 업데이트
      job = this.jobs.get(jobId);
      if (job) {
        job.progress = progress;
        this.jobs.set(jobId, job);
      }
      
      // 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  /**
   * 가상의 응답 데이터 생성 (실제 구현에서는 제거 필요)
   */
  private createMockResponse(audioPath: string, options: ISTTOptions): any {
    // 파일 이름에서 파일명만 추출
    const fileName = audioPath.split('/').pop()?.split('\\').pop();
    
    // 가상의 응답 데이터
    return {
      message: 'success',
      result: 'completed',
      text: `이것은 ${fileName} 파일의 음성 인식 결과입니다. 이 텍스트는 실제 음성 인식 결과가 아닌 테스트용 더미 데이터입니다.`,
      segments: [
        {
          id: 'segment_1',
          text: `이것은 ${fileName} 파일의 음성 인식 결과입니다.`,
          start: 0.0,
          end: 3.5,
          confidence: 0.95,
          speaker: options.speakerLabels ? 'speaker_1' : undefined,
          words: options.wordConfidence ? [
            { text: '이것은', start: 0.0, end: 0.8, confidence: 0.97 },
            { text: fileName, start: 0.9, end: 1.8, confidence: 0.95 },
            { text: '파일의', start: 1.9, end: 2.3, confidence: 0.94 },
            { text: '음성', start: 2.4, end: 2.8, confidence: 0.96 },
            { text: '인식', start: 2.9, end: 3.2, confidence: 0.95 },
            { text: '결과입니다.', start: 3.3, end: 3.5, confidence: 0.93 }
          ] : undefined
        },
        {
          id: 'segment_2',
          text: '이 텍스트는 실제 음성 인식 결과가 아닌 테스트용 더미 데이터입니다.',
          start: 3.8,
          end: 8.5,
          confidence: 0.92,
          speaker: options.speakerLabels ? 'speaker_1' : undefined,
          words: options.wordConfidence ? [
            { text: '이', start: 3.8, end: 3.9, confidence: 0.96 },
            { text: '텍스트는', start: 4.0, end: 4.6, confidence: 0.94 },
            { text: '실제', start: 4.7, end: 5.1, confidence: 0.93 },
            { text: '음성', start: 5.2, end: 5.6, confidence: 0.92 },
            { text: '인식', start: 5.7, end: 6.1, confidence: 0.91 },
            { text: '결과가', start: 6.2, end: 6.6, confidence: 0.90 },
            { text: '아닌', start: 6.7, end: 7.0, confidence: 0.91 },
            { text: '테스트용', start: 7.1, end: 7.7, confidence: 0.89 },
            { text: '더미', start: 7.8, end: 8.1, confidence: 0.88 },
            { text: '데이터입니다.', start: 8.2, end: 8.5, confidence: 0.87 }
          ] : undefined
        }
      ]
    };
  }
  
  /**
   * Clova STT API 응답 파싱
   */
  private parseResponse(responseData: any, options: ISTTOptions): ISTTResult {
    try {
      this.logger.log('STT 응답 파싱 중...');
      
      const segments: ISTTSegment[] = [];
      let fullText = '';
      let totalConfidence = 0;
      
      // 세그먼트 파싱
      if (responseData.segments && responseData.segments.length > 0) {
        responseData.segments.forEach((segment, index) => {
          const sttSegment: ISTTSegment = {
            id: segment.id || `segment_${index + 1}`,
            text: segment.text,
            start: segment.start,
            end: segment.end,
            confidence: segment.confidence,
          };
          
          // 화자 정보 추가
          if (options.speakerLabels && segment.speaker) {
            sttSegment.speaker = segment.speaker;
          }
          
          // 단어 정보 추가
          if (options.wordConfidence && segment.words && segment.words.length > 0) {
            sttSegment.words = segment.words.map(word => ({
              text: word.text,
              start: word.start,
              end: word.end,
              confidence: word.confidence,
            }));
          }
          
          segments.push(sttSegment);
          totalConfidence += segment.confidence;
        });
      } else if (responseData.text) {
        // 세그먼트가 없는 경우 전체 텍스트로 하나의 세그먼트 생성
        segments.push({
          id: 'segment_1',
          text: responseData.text,
          start: 0,
          end: 0, // 실제 지속 시간을 알 수 없음
          confidence: responseData.confidence || 0.8,
        });
        totalConfidence = responseData.confidence || 0.8;
      }
      
      // 전체 텍스트 추출
      fullText = responseData.text || segments.map(segment => segment.text).join(' ');
      
      // 평균 신뢰도 계산
      const avgConfidence = segments.length > 0 ? totalConfidence / segments.length : 0;
      
      // 오디오 파일 길이 계산 (마지막 세그먼트의 끝 시간 또는 기본값)
      const duration = segments.length > 0 ? 
        Math.max(...segments.map(segment => segment.end)) : 
        responseData.duration || 0;
      
      // 최종 결과 구성
      const result: ISTTResult = {
        text: fullText,
        segments,
        confidence: avgConfidence,
        language: options.language || 'ko',
        duration,
      };
      
      this.logger.log(`STT 응답 파싱 완료: ${segments.length} 세그먼트, ${fullText.length} 글자`);
      
      return result;
    } catch (error) {
      this.logger.error('STT 응답 파싱 오류:', error.stack);
      throw new Error(`STT 응답 파싱 오류: ${error.message}`);
    }
  }
}