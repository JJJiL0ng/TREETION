import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import axios from 'axios';
import { FormData, File as FormFile } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import { S3, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';

@Injectable()
export class SttWhisperService {
  private readonly logger = new Logger(SttWhisperService.name);
  private readonly readFileAsync = promisify(fs.readFile);
  private readonly writeFileAsync = promisify(fs.writeFile);
  private readonly mkdirAsync = promisify(fs.mkdir);
  private readonly unlinkAsync = promisify(fs.unlink);
  private readonly execAsync = promisify(exec);
  private readonly s3Client: S3;
  
  // 청크 크기 설정 (10MB)
  private readonly CHUNK_SIZE_MB = 10;
  private readonly CHUNK_SIZE_BYTES = this.CHUNK_SIZE_MB * 1024 * 1024;
  private readonly TEMP_DIR = path.join(process.cwd(), 'temp', 'chunks');

  constructor(
    private readonly configService: ConfigService,
  ) {
    // R2 클라이언트 초기화
    this.s3Client = new S3({
      region: 'auto',
      endpoint: `https://${this.configService.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
    
    // 임시 디렉토리 생성
    this.ensureTempDirectory();
  }

  /**
   * 임시 디렉토리가 존재하는지 확인하고, 없으면 생성합니다.
   */
  private async ensureTempDirectory(): Promise<void> {
    try {
      await this.mkdirAsync(this.TEMP_DIR, { recursive: true });
      this.logger.log(`임시 디렉토리 확인: ${this.TEMP_DIR}`);
    } catch (error) {
      this.logger.error(`임시 디렉토리 생성 실패: ${error.message}`, error.stack);
    }
  }

  /**
   * 오디오 파일을 Whisper API를 통해 텍스트로 변환합니다.
   * 대용량 파일의 경우 청크로 분할하여 처리합니다.
   * 
   * @param file 오디오 파일 (Multer에 의해 임시 저장된 파일)
   * @param userId 사용자 ID
   * @param language 오디오의 언어 코드 (기본값: 'ko')
   * @returns 텍스트 변환 결과와 메타데이터
   */
  async transcribeAudio(
    file: Express.Multer.File,
    userId: string,
    language: string = 'ko'
  ): Promise<SttResult> {
    this.logger.log(`사용자 ${userId}의 오디오 파일 STT 변환 시작: ${file.originalname}, 크기: ${file.size} 바이트`);
    
    try {
      const fileStats = fs.statSync(file.path);
      
      // 파일 크기가 청크 크기보다 크면 청크 분할 처리
      if (fileStats.size > this.CHUNK_SIZE_BYTES) {
        this.logger.log(`파일 크기(${fileStats.size} 바이트)가 청크 크기(${this.CHUNK_SIZE_BYTES} 바이트)보다 큽니다. 청크 처리를 시작합니다.`);
        return await this.processLargeAudioFile(file, userId, language);
      } else {
        // 작은 파일은 한 번에 처리
        this.logger.log(`파일 크기(${fileStats.size} 바이트)가 청크 크기 이하입니다. 단일 요청으로 처리합니다.`);
        return await this.processSingleAudioFile(file, userId, language);
      }
    } catch (error) {
      this.logger.error(`STT 변환 중 오류 발생: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`STT 변환 실패: ${error.message}`);
    }
  }

  /**
   * 단일 오디오 파일(작은 파일)을 처리합니다.
   */
  private async processSingleAudioFile(
    file: Express.Multer.File,
    userId: string,
    language: string
  ): Promise<SttResult> {
    // Whisper API 호출
    const transcription = await this.callWhisperApi(file.path, language);
    this.logger.log(`Whisper API 호출 완료, 텍스트 길이: ${transcription.text.length} 자`);
    
    // 텍스트 파일을 R2에 저장
    const textKey = await this.saveTranscriptionToR2(
      transcription.text,
      userId,
      path.parse(file.originalname).name
    );
    
    return {
      text: transcription.text,
      language: transcription.language || language,
      duration: transcription.duration || 0,
      textKey,
      segments: transcription.segments || [],
    };
  }

  /**
   * 대용량 오디오 파일을 청크로 분할하여 처리합니다.
   */
  private async processLargeAudioFile(
    file: Express.Multer.File,
    userId: string,
    language: string
  ): Promise<SttResult> {
    // 고유한 세션 ID 생성
    const sessionId = crypto.randomUUID();
    const sessionDir = path.join(this.TEMP_DIR, sessionId);
    
    try {
      // 세션 디렉토리 생성
      await this.mkdirAsync(sessionDir, { recursive: true });
      
      // 1. 오디오 파일을 청크로 분할
      const audioChunks = await this.splitAudioFileIntoChunks(file.path, sessionDir);
      this.logger.log(`오디오 파일을 ${audioChunks.length}개의 청크로 분할 완료`);
      
      // 2. 각 청크에 대해 Whisper API 호출
      const chunkTranscriptions = await this.processAudioChunks(audioChunks, language);
      
      // 3. 모든 청크의 변환 결과 병합
      const mergedResult = this.mergeTranscriptionResults(chunkTranscriptions);
      this.logger.log(`총 ${mergedResult.text.length}자의 텍스트 변환 완료`);
      
      // 4. 병합된 텍스트를 R2에 저장
      const textKey = await this.saveTranscriptionToR2(
        mergedResult.text,
        userId,
        path.parse(file.originalname).name
      );
      
      // 5. 최종 결과 반환
      return {
        text: mergedResult.text,
        language: mergedResult.language || language,
        duration: mergedResult.duration,
        textKey,
        segments: mergedResult.segments,
      };
    } catch (error) {
      this.logger.error(`대용량 오디오 처리 중 오류: ${error.message}`, error.stack);
      throw error;
    } finally {
      // 임시 파일 정리
      this.cleanupSessionFiles(sessionDir);
    }
  }

  /**
   * 오디오 파일을 청크로 분할합니다.
   * ffmpeg를 사용하여 시간 기반으로 분할합니다.
   */
  private async splitAudioFileIntoChunks(
    filePath: string,
    outputDir: string
  ): Promise<string[]> {
    try {
      // 1. 오디오 파일 정보 가져오기 (길이 등)
      const audioInfo = await this.getAudioFileInfo(filePath);
      const totalDuration = audioInfo.duration;
      
      // 2. 청크 지속 시간 계산 (예: 25MB 파일이 1분이면, 10MB는 약 24초)
      // 오디오 비트레이트를 기준으로 계산 (평균 비트레이트 사용)
      const fileSizeBytes = fs.statSync(filePath).size;
      const bytesPerSecond = fileSizeBytes / totalDuration;
      const chunkDuration = this.CHUNK_SIZE_BYTES / bytesPerSecond;
      
      // 청크 개수 계산
      const numberOfChunks = Math.ceil(totalDuration / chunkDuration);
      this.logger.log(`오디오 파일 정보: 길이=${totalDuration}초, 평균 비트레이트=${bytesPerSecond}B/s, 청크 길이=${chunkDuration}초, 청크 수=${numberOfChunks}`);
      
      // 3. 각 청크에 대한 시작 시간과 종료 시간 계산
      interface ChunkDefinition {
        startTime: number;
        endTime: number;
        outputFile: string;
      }
      
      const chunkDefinitions: ChunkDefinition[] = [];
      for (let i = 0; i < numberOfChunks; i++) {
        const startTime = i * chunkDuration;
        const endTime = Math.min((i + 1) * chunkDuration, totalDuration);
        const outputFile = path.join(outputDir, `chunk-${i.toString().padStart(3, '0')}.mp3`);
        
        chunkDefinitions.push({
          startTime,
          endTime,
          outputFile,
        });
      }
      
      // 4. ffmpeg 사용하여 각 청크 생성
      for (const chunk of chunkDefinitions) {
        await this.extractAudioChunk(filePath, chunk.startTime, chunk.endTime, chunk.outputFile);
      }
      
      // 5. 생성된 청크 파일 경로 반환
      return chunkDefinitions.map(chunk => chunk.outputFile);
    } catch (error) {
      this.logger.error(`오디오 파일 분할 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 오디오 파일 정보를 가져옵니다.
   */
  private async getAudioFileInfo(filePath: string): Promise<{ duration: number; format: string }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        
        resolve({
          duration: metadata.format.duration || 0,
          format: metadata.format.format_name || '',
        });
      });
    });
  }

  /**
   * 오디오 파일에서 특정 시간 범위의 청크를 추출합니다.
   */
  private async extractAudioChunk(
    inputFile: string,
    startTime: number,
    endTime: number,
    outputFile: string
  ): Promise<void> {
    try {
      const duration = endTime - startTime;
      
      // ffmpeg 명령 실행
      const command = `ffmpeg -i "${inputFile}" -ss ${startTime} -t ${duration} -c:a libmp3lame -q:a 4 "${outputFile}" -y`;
      this.logger.log(`ffmpeg 명령 실행: ${command}`);
      
      await this.execAsync(command);
      this.logger.log(`청크 추출 완료: ${outputFile}`);
    } catch (error) {
      this.logger.error(`청크 추출 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 생성된 오디오 청크들을 처리하여 텍스트로 변환합니다.
   */
  private async processAudioChunks(
    chunkPaths: string[],
    language: string
  ): Promise<WhisperApiResponse[]> {
    // 청크별로 병렬 처리
    const transcriptionPromises = chunkPaths.map(async (chunkPath, index) => {
      try {
        this.logger.log(`청크 ${index + 1}/${chunkPaths.length} 처리 시작: ${chunkPath}`);
        const result = await this.callWhisperApi(chunkPath, language);
        this.logger.log(`청크 ${index + 1}/${chunkPaths.length} 처리 완료: ${result.text.length}자`);
        return result;
      } catch (error) {
        this.logger.error(`청크 ${index + 1} 처리 실패: ${error.message}`, error.stack);
        // 실패한 청크는 빈 텍스트로 처리
        return {
          text: '',
          language: language,
          duration: 0,
          segments: [],
          task: 'transcribe'
        };
      }
    });
    
    return Promise.all(transcriptionPromises);
  }

  /**
   * 청크별 변환 결과를 하나로 병합합니다.
   */
  private mergeTranscriptionResults(results: WhisperApiResponse[]): WhisperApiResponse {
    if (results.length === 0) {
      return {
        text: '',
        language: '',
        duration: 0,
        segments: [],
        task: 'transcribe'
      };
    }
    
    // 텍스트 병합
    let mergedText = '';
    let totalDuration = 0;
    const allSegments: WhisperSegment[] = [];
    
    // 결과가 있는 청크만 처리
    const validResults = results.filter(result => result && result.text);
    
    for (let i = 0; i < validResults.length; i++) {
      const result = validResults[i];
      
      // 텍스트 병합 (중복 및 연결 처리)
      if (i > 0) {
        // 연결 부분에서 중복된 문장 제거를 위한 간단한 처리
        // 실제 구현에서는 더 정교한 알고리즘 필요
        const prevResult = validResults[i - 1];
        const overlap = this.findOverlappingText(prevResult.text, result.text);
        
        if (overlap && overlap.length > 0) {
          // 중복 부분 제거하고 병합
          mergedText += result.text.substring(overlap.length);
        } else {
          // 중복 없이 텍스트 추가 (공백 포함)
          if (mergedText && !mergedText.endsWith(' ') && !result.text.startsWith(' ')) {
            mergedText += ' ' + result.text;
          } else {
            mergedText += result.text;
          }
        }
      } else {
        // 첫 번째 청크는 그대로 사용
        mergedText = result.text;
      }
      
      // 길이 누적
      totalDuration += result.duration || 0;
      
      // 세그먼트 정보 병합 (시간 오프셋 조정)
      if (result.segments && result.segments.length > 0) {
        // 이전 청크들의 지속 시간을 오프셋으로 사용
        const timeOffset = i > 0 ? 
          validResults.slice(0, i).reduce((sum, r) => sum + (r.duration || 0), 0) : 0;
        
        // 세그먼트 시간 정보 조정
        const adjustedSegments = result.segments.map(segment => ({
          ...segment,
          start: segment.start + timeOffset,
          end: segment.end + timeOffset,
        }));
        
        allSegments.push(...adjustedSegments);
      }
    }
    
    // 병합된 결과 반환
    return {
      text: mergedText,
      language: validResults[0]?.language || '',
      duration: totalDuration,
      segments: allSegments,
      task: 'transcribe'
    };
  }

  /**
   * 두 텍스트 사이의 중복 부분을 찾습니다.
   */
  private findOverlappingText(text1: string, text2: string): string {
    // 간단한 중복 탐지 알고리즘 (문장 단위)
    const sentences1 = text1.split(/(?<=[.!?])\s+/);
    const sentences2 = text2.split(/(?<=[.!?])\s+/);
    
    // 마지막 문장 1-3개와 처음 문장 1-3개 비교
    const lastSentences = sentences1.slice(-3);
    const firstSentences = sentences2.slice(0, 3);
    
    for (const last of lastSentences) {
      for (const first of firstSentences) {
        if (last.trim() === first.trim() && last.trim().length > 10) {
          return first;
        }
      }
    }
    
    // 단어 수준에서 중복 검사 (간단한 구현)
    const words1 = text1.split(/\s+/).slice(-10);
    const words2 = text2.split(/\s+/).slice(0, 10);
    
    for (let i = 5; i >= 2; i--) {
      // 마지막 i개 단어와 처음 i개 단어 비교
      const phrase1 = words1.slice(-i).join(' ');
      const phrase2 = words2.slice(0, i).join(' ');
      
      if (phrase1 === phrase2 && phrase1.length > 5) {
        return phrase2;
      }
    }
    
    return '';
  }

  /**
   * 임시 파일들을 정리합니다.
   */
  private async cleanupSessionFiles(sessionDir: string): Promise<void> {
    try {
      // 디렉토리 내의 모든 파일 삭제
      const files = fs.readdirSync(sessionDir);
      for (const file of files) {
        await this.unlinkAsync(path.join(sessionDir, file));
      }
      
      // 디렉토리 자체 삭제
      fs.rmdirSync(sessionDir);
      this.logger.log(`세션 디렉토리 정리 완료: ${sessionDir}`);
    } catch (error) {
      this.logger.error(`임시 파일 정리 중 오류: ${error.message}`, error.stack);
      // 정리 실패해도 전체 프로세스는 성공한 것으로 처리
    }
  }

  /**
   * Whisper API를 호출하여 오디오를 텍스트로 변환합니다.
   * 
   * @param filePath 오디오 파일 경로
   * @param language 언어 코드
   * @returns Whisper API 응답 (텍스트 및 메타데이터)
   */
  private async callWhisperApi(filePath: string, language: string): Promise<WhisperApiResponse> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }

    try {
      // FormData 생성
      const formData = new FormData();
      const fileStats = fs.statSync(filePath);
      
      this.logger.log(`오디오 파일 정보: 경로=${filePath}, 크기=${fileStats.size} 바이트`);
      
      // 파일 추가
      const audioFile = await fileFromPath(filePath);
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      
      // 언어 설정 (ko: 한국어)
      if (language) {
        formData.append('language', language);
      }
      
      // 추가 옵션 설정
      formData.append('temperature', '0');
      formData.append('timestamp_granularities[]', 'segment');
      
      this.logger.log('Whisper API 호출 시작...');
      
      // API 호출
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': `multipart/form-data; boundary=${(formData as any).getBoundary?.() || ''}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );
      
      this.logger.log('Whisper API 호출 성공, 응답 처리 중...');
      
      // API 응답 반환
      return response.data as WhisperApiResponse;
      
    } catch (error) {
      // axios 오류 상세 로깅
      if (error.response) {
        this.logger.error(`Whisper API 응답 오류: 상태 코드=${error.response.status}, 데이터=${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        this.logger.error(`Whisper API 요청 오류: 응답 없음`);
      }
      throw new Error(`Whisper API 호출 실패: ${error.message}`);
    }
  }

  /**
   * 변환된 텍스트를 R2에 저장합니다.
   * 
   * @param text 변환된 텍스트
   * @param userId 사용자 ID
   * @param baseFilename 기본 파일명 (확장자 제외)
   * @returns 저장된 텍스트 파일의 키
   */
  private async saveTranscriptionToR2(
    text: string,
    userId: string,
    baseFilename: string
  ): Promise<string> {
    const timestamp = Date.now();
    const textKey = `transcriptions/${userId}/${baseFilename}_${timestamp}.txt`;
    const bucketName = this.configService.get('R2_BUCKET_NAME');
    
    try {
      this.logger.log(`텍스트 파일 R2 저장 시작: ${textKey}`);
      
      // R2에 텍스트 파일 업로드
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: textKey,
          Body: text,
          ContentType: 'text/plain; charset=utf-8',
        })
      );
      
      this.logger.log(`텍스트 파일 R2 저장 완료: ${textKey}`);
      return textKey;
    } catch (error) {
      this.logger.error(`텍스트 파일 R2 저장 오류: ${error.message}`, error.stack);
      throw new Error(`텍스트 파일 저장 실패: ${error.message}`);
    }
  }

  /**
   * R2에 저장된 텍스트의 공개 URL을 생성합니다.
   * 
   * @param textKey R2에 저장된 텍스트 파일의 키
   * @returns 공개 접근 가능한 URL
   */
  getTranscriptionPublicUrl(textKey: string): string {
    const r2PublicUrl = this.configService.get('R2_PUBLIC_URL');
    
    // R2_PUBLIC_URL이 설정된 경우
    if (r2PublicUrl) {
      // 슬래시가 중복되지 않도록 처리
      if (r2PublicUrl.endsWith('/')) {
        return `${r2PublicUrl}${textKey}`;
      } else {
        return `${r2PublicUrl}/${textKey}`;
      }
    }
    
    // 기본 R2 URL 형식
    const accountId = this.configService.get('R2_ACCOUNT_ID');
    const bucketName = this.configService.get('R2_BUCKET_NAME');
    return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${textKey}`;
  }
}

// Whisper API 응답 인터페이스
export interface WhisperApiResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
}

// Whisper 세그먼트 인터페이스
export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

// STT 결과 인터페이스
export interface SttResult {
  text: string;
  language: string;
  duration: number;
  textKey: string;
  segments?: WhisperSegment[];
}
