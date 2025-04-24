// src/stt/stt.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

// 엔티티 및 인터페이스 임포트
import { Transcription } from '../audio/entities/transcription.entity';
import { TranscriptionResult } from '../audio/entities/transcription-result.entity';
import { AudioFile } from '../audio/entities/audio-file.entity';
import { UsageStats } from '../audio/entities/usage-stats.entity';
import { ISTTProvider, ISTTOptions, ISTTResult } from '../interfaces/stt-provider.interface';

// DTO 임포트
import { STTRequestDto } from './dto/stt-request.dto';
import { STTRequestQueryDto } from './dto/stt-request-query.dto';

// STT 프로바이더 임포트
import { ClovaSTTProvider } from './providers/clova-stt.provider';

@Injectable()
export class STTService {
  private readonly sttProvider: ISTTProvider;

  constructor(
    @InjectRepository(Transcription)
    private transcriptionRepository: Repository<Transcription>,
    @InjectRepository(TranscriptionResult)
    private transcriptionResultRepository: Repository<TranscriptionResult>,
    @InjectRepository(AudioFile)
    private audioFileRepository: Repository<AudioFile>,
    @InjectRepository(UsageStats)
    private usageStatsRepository: Repository<UsageStats>,
    private configService: ConfigService,
    private clovaSTTProvider: ClovaSTTProvider,
  ) {
    // 기본 STT 프로바이더 설정
    this.sttProvider = this.clovaSTTProvider;
  }

  /**
   * STT 변환 요청
   */
  async requestTranscription(
    userId: string,
    audioId: string,
    sttRequestDto: STTRequestDto,
  ) {
    // 오디오 파일 확인
    const audioFile = await this.audioFileRepository.findOne({
      where: { audioId, userId },
    });

    if (!audioFile) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    // 사용자 트랜스크립션 시간 제한 확인
    await this.checkTranscriptionLimit(userId, audioFile.duration);

    // 기본 옵션 설정
    const defaultOptions: ISTTOptions = {
      language: 'ko',
      punctuation: true,
      paragraphs: true,
      timestamps: true,
      wordConfidence: false,
      speakerLabels: false,
    };

    // 사용자 옵션 병합
    const options: ISTTOptions = {
      ...defaultOptions,
      ...sttRequestDto,
    };

    // 트랜스크립션 엔티티 생성
    const transcriptionId = uuidv4();
    const transcription = this.transcriptionRepository.create({
      transcriptionId,
      audioId,
      userId,
      language: options.language,
      options: options,
      status: 'pending',
      progress: 0,
      estimatedTime: Math.ceil(audioFile.duration / 60), // 대략 오디오 시간의 1/60 정도 소요된다고 가정
      createdAt: new Date(),
    });

    await this.transcriptionRepository.save(transcription);

    // 백그라운드로 STT 변환 작업 시작
    this.processTranscriptionAsync(transcription, audioFile.storagePath)
      .catch(error => {
        console.error(`STT 변환 오류 (${transcriptionId}):`, error);
      });

    return {
      transcriptionId,
      status: transcription.status,
      estimatedTime: transcription.estimatedTime,
    };
  }

  /**
   * STT 변환 상태 확인
   */
  async getTranscriptionStatus(userId: string, transcriptionId: string) {
    const transcription = await this.transcriptionRepository.findOne({
      where: { transcriptionId, userId },
    });

    if (!transcription) {
      throw new NotFoundException('INVALID_TRANSCRIPTION_ID');
    }

    return {
      transcriptionId,
      status: transcription.status,
      progress: transcription.progress,
      audioId: transcription.audioId,
      createdAt: transcription.createdAt,
      startedAt: transcription.startedAt,
      completedAt: transcription.completedAt,
    };
  }

  /**
   * STT 변환 결과 조회
   */
  async getTranscriptionResult(userId: string, transcriptionId: string) {
    // 트랜스크립션 확인
    const transcription = await this.transcriptionRepository.findOne({
      where: { transcriptionId, userId },
    });

    if (!transcription) {
      throw new NotFoundException('INVALID_TRANSCRIPTION_ID');
    }

    if (transcription.status !== 'completed') {
      throw new BadRequestException('TRANSCRIPTION_NOT_COMPLETED');
    }

    // 트랜스크립션 결과 조회
    const result = await this.transcriptionResultRepository.findOne({
      where: { transcriptionId },
    });

    if (!result) {
      throw new NotFoundException('TRANSCRIPTION_RESULT_NOT_FOUND');
    }

    return result;
  }

  /**
   * STT 변환 결과 목록 조회
   */
  async getTranscriptionList(userId: string, query: STTRequestQueryDto) {
    const { page = 1, limit = 20, audioId, status } = query;

    // 페이지네이션 설정
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // 최대 100개로 제한

    // 검색 조건 설정
    const where: FindOptionsWhere<Transcription> = { userId };

    if (audioId) {
      where.audioId = audioId;
    }

    if (status) {
      where.status = status;
    }

    // 전체 건수 조회
    const total = await this.transcriptionRepository.count({ where });

    // 데이터 조회
    const items = await this.transcriptionRepository.find({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    // 페이지네이션 정보
    const pages = Math.ceil(total / take);

    return {
      items,
      pagination: {
        total,
        page,
        limit: take,
        pages,
      },
    };
  }

  /**
   * STT 변환 작업 취소
   */
  async cancelTranscription(userId: string, transcriptionId: string) {
    const transcription = await this.transcriptionRepository.findOne({
      where: { transcriptionId, userId },
    });

    if (!transcription) {
      throw new NotFoundException('INVALID_TRANSCRIPTION_ID');
    }

    if (['completed', 'failed', 'cancelled'].includes(transcription.status)) {
      throw new BadRequestException('CANNOT_CANCEL_TRANSCRIPTION');
    }

    // 상태 변경
    transcription.status = 'cancelled';
    await this.transcriptionRepository.save(transcription);

    // STT 프로바이더에 취소 요청
    try {
      await this.sttProvider.cancelTranscription(transcriptionId);
    } catch (error) {
      // 프로바이더 취소 실패는 무시하고 DB 상태만 변경
      console.warn(`STT 프로바이더 취소 실패 (${transcriptionId}):`, error);
    }

    return {
      message: '변환 작업이 취소되었습니다.',
      transcriptionId,
    };
  }

  /**
   * STT 프로바이더 상태 확인
   */
  async getProviderStatus() {
    // 프로바이더 상태 확인 로직
    // 실제로는 프로바이더 API 연결 상태, 사용량 등을 확인할 수 있음
    const status = {
      provider: 'CLOVA Speech',
      status: 'active',
      healthCheck: true,
    };

    return status;
  }

  /**
   * 트랜스크립션 제한 확인
   */
  private async checkTranscriptionLimit(userId: string, durationSeconds: number): Promise<void> {
    // 현재 월의 처음
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 이번 달 트랜스크립션 사용량 조회
    const monthStats = await this.usageStatsRepository.find({
      where: {
        userId,
        date: Between(firstDayOfMonth, now),
      },
    });

    const totalTranscriptionSeconds = monthStats.reduce((sum, stat) => sum + stat.transcriptionSeconds, 0);

    // 트랜스크립션 제한 (기본 10시간/월)
    const transcriptionLimit = this.configService.get<number>('app.limits.transcription') || 36000;

    // 제한 확인
    if (totalTranscriptionSeconds + durationSeconds > transcriptionLimit) {
      throw new ForbiddenException('TRANSCRIPTION_LIMIT_EXCEEDED');
    }
  }

  /**
   * 비동기 트랜스크립션 처리
   */
  private async processTranscriptionAsync(
    transcription: Transcription,
    audioFilePath: string,
  ): Promise<void> {
    try {
      // 상태 업데이트
      transcription.status = 'processing';
      transcription.startedAt = new Date();
      transcription.progress = 0.1;
      await this.transcriptionRepository.save(transcription);

      // STT 프로바이더에 요청
      const jobId = await this.sttProvider.startTranscription(audioFilePath, transcription.options);

      // 상태 주기적으로 확인
      while (true) {
        // 1초 대기
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 작업 상태 확인
        const jobStatus = await this.sttProvider.getTranscriptionStatus(jobId);

        // 상태 업데이트
        transcription.progress = jobStatus.progress;
        await this.transcriptionRepository.save(transcription);

        // 완료 또는 실패 확인
        if (jobStatus.status === 'completed') {
          // 작업 완료 처리
          const result = await this.sttProvider.getTranscriptionResult(jobId);
          await this.saveTranscriptionResult(transcription, result);
          break;
        } else if (['failed', 'cancelled'].includes(jobStatus.status)) {
          // 작업 실패 처리
          transcription.status = jobStatus.status;
          transcription.errorMessage = jobStatus.error ?? "";
          await this.transcriptionRepository.save(transcription);
          break;
        }

        // 작업 취소 확인
        const freshTranscription = await this.transcriptionRepository.findOne({
          where: { transcriptionId: transcription.transcriptionId },
        });

        if (freshTranscription && freshTranscription.status === 'cancelled') {
          break;
        }
      }
    } catch (error) {
      // 에러 처리
      transcription.status = 'failed';
      transcription.errorMessage = error.message;
      await this.transcriptionRepository.save(transcription);

      throw error;
    }
  }

  /**
   * 트랜스크립션 결과 저장
   */
  private async saveTranscriptionResult(
    transcription: Transcription,
    sttResult: ISTTResult,
  ): Promise<void> {
    // 오디오 파일 정보 가져오기
    const audioFile = await this.audioFileRepository.findOne({
      where: { audioId: transcription.audioId },
    });

    // 트랜스크립션 완료 처리
    transcription.status = 'completed';
    transcription.progress = 1.0;
    transcription.completedAt = new Date();
    await this.transcriptionRepository.save(transcription);

    // 트랜스크립션 결과 저장
    const result = this.transcriptionResultRepository.create({
      transcriptionId: transcription.transcriptionId,
      audioId: transcription.audioId,
      language: sttResult.language,
      text: sttResult.text,
      segments: sttResult.segments,
      paragraphs: this.generateParagraphs(sttResult.segments),
      metadata: {
        wordCount: this.countWords(sttResult.text),
        duration: sttResult.duration,
        createdAt: transcription.createdAt,
        completedAt: transcription.completedAt,
      },
    });

    await this.transcriptionResultRepository.save(result);

    // 오디오 파일 업데이트
    if (audioFile) {
      audioFile.hasTranscription = true;
      await this.audioFileRepository.save(audioFile);
    }

    // 사용량 통계 업데이트
    await this.updateUsageStats(transcription.userId, sttResult.duration);
  }

  /**
   * 텍스트에서 단어 수 계산
   */
  private countWords(text: string): number {
    if (!text) return 0;
    // 공백으로 나누고 빈 요소 제거
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  /**
   * 세그먼트에서 문단 생성
   */
  private generateParagraphs(segments: any[]): any[] {
    if (!segments || segments.length === 0) {
      return [];
    }

    type Paragraph = {
      id: string;
      segments: string[];
      start: number;
      end: number;
    };

    const paragraphs: Paragraph[] = [];
    let currentParagraph: Paragraph = {
      id: `paragraph_1`,
      segments: [],
      start: segments[0].start,
      end: 0,
    };

    // 세그먼트를 돌면서 문단 구성
    // 실제로는 더 복잡한 로직으로 문장의 끝을 감지하거나, 
    // 일정 시간 이상의 간격이 있을 때 새 문단을 시작하는 등의 로직 필요
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentParagraph.segments.push(segment.id);
      currentParagraph.end = segment.end;

      // 문단 구분 조건 (이 부분은 더 정교하게 개선 필요)
      // 예: 마침표로 끝나고 다음 세그먼트와 일정 시간 이상 간격이 있을 때
      const segmentText = segment.text.trim();
      const isEndOfSentence = /[.!?]$/.test(segmentText);
      const isTimeGap = i < segments.length - 1 && (segments[i + 1].start - segment.end > 1.0);

      if ((isEndOfSentence && isTimeGap) || i === segments.length - 1) {
        paragraphs.push(currentParagraph);
        if (i < segments.length - 1) {
          currentParagraph = {
            id: `paragraph_${paragraphs.length + 1}`,
            segments: [],
            start: segments[i + 1].start,
            end: 0,
          };
        }
      }
    }

    return paragraphs;
  }

  /**
   * 사용량 통계 업데이트
   */
  private async updateUsageStats(userId: string, durationSeconds: number): Promise<void> {
    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘의 통계 조회
    let stats = await this.usageStatsRepository.findOne({
      where: {
        userId,
        date: today,
      },
    });

    // 없으면 생성
    if (!stats) {
      stats = this.usageStatsRepository.create({
        userId,
        date: today,
        uploadedBytes: 0,
        transcriptionSeconds: 0,
      });
    }

    // 트랜스크립션 시간 업데이트
    stats.transcriptionSeconds += durationSeconds;
    await this.usageStatsRepository.save(stats);
  }
}