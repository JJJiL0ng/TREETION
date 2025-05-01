import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import axios from 'axios';
import { FormData, File as FormFile } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import { S3, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class SttWhisperService {
  private readonly logger = new Logger(SttWhisperService.name);
  private readonly readFileAsync = promisify(fs.readFile);
  private readonly s3Client: S3;

  constructor(
    private readonly configService: ConfigService,
  ) {
    // R2 클라이언트 초기화 (AudioService와 동일한 클라이언트 설정)
    this.s3Client = new S3({
      region: 'auto',
      endpoint: `https://${this.configService.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * 오디오 파일을 Whisper API를 통해 텍스트로 변환합니다.
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
    this.logger.log(`사용자 ${userId}의 오디오 파일 STT 변환 시작: ${file.originalname}`);
    
    try {
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
    } catch (error) {
      this.logger.error(`STT 변환 중 오류 발생: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`STT 변환 실패: ${error.message}`);
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
            'Content-Type': 'multipart/form-data',
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