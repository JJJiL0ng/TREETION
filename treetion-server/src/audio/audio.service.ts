// src/audio/audio.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between } from 'typeorm';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';

import { AudioFile } from './entities/audio-file.entity';
import { ChunkUpload } from './entities/chunk-upload.entity';
import { UsageStats } from './entities/usage-stats.entity';
import { Transcription } from './entities/transcription.entity';
import { TranscriptionResult } from './entities/transcription-result.entity';

import { AudioUploadDto } from './dto/audio-upload.dto';
import { ChunkUploadInitDto } from './dto/chunk-upload-init.dto';
import { ChunkUploadCompleteDto } from './dto/chunk-upload-complete.dto';
import { AudioFileQueryDto } from './dto/audio-file-query.dto';
import { AudioUpdateDto } from './dto/audio-update.dto';
import { UsageStatsQueryDto } from './dto/usage-stats-query.dto';
import { AudioStreamQueryDto } from './dto/audio-stream-query.dto';
import { WaveformQueryDto } from './dto/waveform-query.dto';
import { TranscribeRequestDto } from './dto/transcribe-request.dto';

import { ConfigService } from '@nestjs/config';
import { StreamableFile } from '@nestjs/common';

@Injectable()
export class AudioService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;

  constructor(
    @InjectRepository(AudioFile)
    private audioFileRepository: Repository<AudioFile>,
    @InjectRepository(ChunkUpload)
    private chunkUploadRepository: Repository<ChunkUpload>,
    @InjectRepository(UsageStats)
    private usageStatsRepository: Repository<UsageStats>,
    @InjectRepository(Transcription)
    private transcriptionRepository: Repository<Transcription>,
    @InjectRepository(TranscriptionResult)
    private transcriptionResultRepository: Repository<TranscriptionResult>,
    private configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || 'uploads';
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 500 * 1024 * 1024; // 500MB
    
    // 업로드 디렉토리가 없으면 생성
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
    // 청크 디렉토리 생성
    if (!existsSync(join(this.uploadDir, 'chunks'))) {
      mkdirSync(join(this.uploadDir, 'chunks'), { recursive: true });
    }
  }

  /**
   * 단일 오디오 파일 업로드 처리
   */
  async uploadAudioFile(
    file: Express.Multer.File,
    userId: string,
    audioUploadDto: AudioUploadDto,
  ) {
    // 파일 형식 검증 (mp3, wav, m4a, ogg만 허용)
    const allowedFormats = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'];
    if (!allowedFormats.includes(file.mimetype)) {
      throw new BadRequestException('INVALID_FILE_FORMAT');
    }

    // 파일 크기 제한 확인
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('FILE_TOO_LARGE');
    }

    // 사용자 스토리지 사용량 및 제한 확인
    await this.checkStorageLimit(userId, file.size);

    // 파일 저장 경로 설정
    const fileId = uuidv4();
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${fileId}.${fileExt}`;
    const filePath = join(this.uploadDir, fileName);

    // 오디오 메타데이터 추출 (실제로는 ffprobe 등 사용)
    // 여기서는 더미 데이터로 대체
    const duration = 180; // 3분 (실제로는 파일에서 추출)
    const format = fileExt;
    const sampleRate = 44100;
    const channels = 2;
    const bitrate = 128000;

    // 파일 저장
    await fs.writeFile(filePath, file.buffer);

    // 파형 데이터 생성 (실제로는 파일 분석 필요)
    // 여기서는 더미 데이터로 대체
    const waveformData = Array(100).fill(0).map(() => Math.random());

    // DB에 오디오 파일 정보 저장
    const audioFile = this.audioFileRepository.create({
      audioId: fileId,
      fileName: file.originalname,
      title: audioUploadDto.title,
      description: audioUploadDto.description,
      fileSize: file.size,
      format,
      sampleRate,
      channels,
      bitrate,
      duration,
      tags: audioUploadDto.tags,
      storagePath: filePath,
      waveformData,
      userId,
    });

    await this.audioFileRepository.save(audioFile);

    // 사용량 통계 업데이트
    await this.updateUsageStats(userId, { uploadedBytes: file.size });

    // 응답 데이터 생성
    return {
      audioId: fileId,
      fileName: file.originalname,
      fileSize: file.size,
      duration,
      createdAt: audioFile.createdAt,
      url: `/audio/files/${fileId}`,
    };
  }

  /**
   * 청크 업로드 세션 초기화
   */
  async initChunkUpload(
    userId: string,
    chunkUploadInitDto: ChunkUploadInitDto,
  ) {
    // 파일 크기 제한 확인
    if (chunkUploadInitDto.fileSize > this.maxFileSize) {
      throw new BadRequestException('FILE_TOO_LARGE');
    }

    // 사용자 스토리지 사용량 및 제한 확인
    await this.checkStorageLimit(userId, chunkUploadInitDto.fileSize);

    // 청크 크기 설정 (5MB)
    const chunkSize = 5 * 1024 * 1024;

    // 업로드 세션 만료 시간 설정 (2시간 후)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    // 업로드 세션 생성
    const uploadId = uuidv4();
    const chunkUpload = this.chunkUploadRepository.create({
      uploadId,
      userId,
      fileName: chunkUploadInitDto.fileName,
      fileSize: chunkUploadInitDto.fileSize,
      mimeType: chunkUploadInitDto.mimeType,
      title: chunkUploadInitDto.title,
      description: chunkUploadInitDto.description,
      tags: chunkUploadInitDto.tags,
      chunkSize,
      chunks: {},
      expiresAt,
    });

    await this.chunkUploadRepository.save(chunkUpload);

    return {
      uploadId,
      chunkSize,
      expiresAt,
    };
  }

  /**
   * 파일 청크 업로드 처리
   */
  async uploadChunk(
    userId: string,
    uploadId: string,
    chunkNumber: number,
    chunk: Buffer,
  ) {
    // 업로드 세션 확인
    const chunkUpload = await this.chunkUploadRepository.findOne({
      where: { uploadId, userId },
    });

    if (!chunkUpload) {
      throw new NotFoundException('INVALID_UPLOAD_ID');
    }

    // 세션 만료 확인
    if (new Date() > chunkUpload.expiresAt) {
      throw new BadRequestException('UPLOAD_EXPIRED');
    }

    // 청크 저장 디렉토리 설정
    const chunkDir = join(this.uploadDir, 'chunks', uploadId);
    if (!existsSync(chunkDir)) {
      mkdirSync(chunkDir, { recursive: true });
    }

    // 청크 파일 저장
    const chunkPath = join(chunkDir, `${chunkNumber}`);
    await fs.writeFile(chunkPath, chunk);

    // 청크 정보 업데이트
    if (!chunkUpload.chunks) {
      chunkUpload.chunks = {};
    }
    chunkUpload.chunks[chunkNumber] = {
      received: true,
      timestamp: new Date(),
    };

    await this.chunkUploadRepository.save(chunkUpload);

    // 업로드 진행률 계산
    const totalChunks = Math.ceil(chunkUpload.fileSize / chunkUpload.chunkSize);
    const receivedChunks = Object.keys(chunkUpload.chunks).length;
    const progress = receivedChunks / totalChunks;

    return {
      uploadId,
      chunkNumber,
      received: true,
      progress,
    };
  }

  /**
   * 청크 업로드 완료 처리
   */
  async completeChunkUpload(
    userId: string,
    chunkUploadCompleteDto: ChunkUploadCompleteDto,
  ) {
    const { uploadId } = chunkUploadCompleteDto;

    // 업로드 세션 확인
    const chunkUpload = await this.chunkUploadRepository.findOne({
      where: { uploadId, userId },
    });

    if (!chunkUpload) {
      throw new NotFoundException('INVALID_UPLOAD_ID');
    }

    // 세션 만료 확인
    if (new Date() > chunkUpload.expiresAt) {
      throw new BadRequestException('UPLOAD_EXPIRED');
    }

    // 모든 청크가 업로드되었는지 확인
    const totalChunks = Math.ceil(chunkUpload.fileSize / chunkUpload.chunkSize);
    const receivedChunks = Object.keys(chunkUpload.chunks).length;

    if (receivedChunks < totalChunks) {
      throw new BadRequestException('INCOMPLETE_UPLOAD');
    }

    // 청크 디렉토리 설정
    const chunkDir = join(this.uploadDir, 'chunks', uploadId);

    // 최종 파일 경로 설정
    const fileId = uuidv4();
    const fileExt = chunkUpload.fileName.split('.').pop();
    const fileName = `${fileId}.${fileExt}`;
    const filePath = join(this.uploadDir, fileName);

    // 청크 파일을 하나로 합치기
    const writeStream = createWriteStream(filePath);
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(chunkDir, `${i}`);
        const chunkData = await fs.readFile(chunkPath);
        writeStream.write(chunkData);
      }
      
      writeStream.end();
      
      // 모든 데이터가 디스크에 쓰여지기를 기다림
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // 오디오 메타데이터 추출 (실제로는 ffprobe 등 사용)
      // 여기서는 더미 데이터로 대체
      const duration = 180; // 3분 (실제로는 파일에서 추출)
      const format = fileExt;
      const sampleRate = 44100;
      const channels = 2;
      const bitrate = 128000;

      // 파형 데이터 생성 (실제로는 파일 분석 필요)
      // 여기서는 더미 데이터로 대체
      const waveformData = Array(100).fill(0).map(() => Math.random());

      // DB에 오디오 파일 정보 저장
      const audioFile = this.audioFileRepository.create({
        audioId: fileId,
        fileName: chunkUpload.fileName,
        title: chunkUpload.title,
        description: chunkUpload.description,
        fileSize: chunkUpload.fileSize,
        format,
        sampleRate,
        channels,
        bitrate,
        duration,
        tags: chunkUpload.tags,
        storagePath: filePath,
        waveformData,
        userId,
      });

      await this.audioFileRepository.save(audioFile);

      // 사용량 통계 업데이트
      await this.updateUsageStats(userId, { uploadedBytes: chunkUpload.fileSize });

      // 청크 디렉토리 삭제
      await fs.rm(chunkDir, { recursive: true, force: true });

      // 업로드 세션 삭제
      await this.chunkUploadRepository.remove(chunkUpload);

      // 응답 데이터 생성
      return {
        audioId: fileId,
        fileName: chunkUpload.fileName,
        fileSize: chunkUpload.fileSize,
        duration,
        createdAt: audioFile.createdAt,
        url: `/audio/files/${fileId}`,
      };
    } catch (error) {
      // 오류 발생 시 파일 삭제
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        // 파일 삭제 실패 무시
      }
      throw error;
    }
  }

  /**
   * 오디오 파일 목록 조회
   */
  async getAudioFiles(userId: string, query: AudioFileQueryDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    
    // 페이지네이션 설정
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // 최대 100개로 제한
    
    // 검색 조건 설정
    const where: FindOptionsWhere<AudioFile> = { userId };
    
    if (search) {
      where.title = Like(`%${search}%`);
      // 실제로는 OR 조건으로 title, description, tags를 검색해야 함
      // TypeORM의 OR 조건은 쿼리 빌더를 사용해야 함
    }
    
    // 전체 건수 조회
    const total = await this.audioFileRepository.count({ where });
    
    // 데이터 조회
    const items = await this.audioFileRepository.find({
      where,
      order: { [sort]: order },
      skip,
      take,
      select: ['audioId', 'fileName', 'title', 'fileSize', 'duration', 'createdAt', 'hasTranscription', 'tags'],
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
   * 오디오 파일 상세 조회
   */
  async getAudioFile(userId: string, audioId: string) {
    const audioFile = await this.audioFileRepository.findOne({
      where: { audioId, userId },
    });
    
    if (!audioFile) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    
    // 가장 최근의 완료된 트랜스크립션 ID 조회
    const latestTranscription = await this.transcriptionRepository.findOne({
      where: { audioId, userId, status: 'completed' },
      order: { completedAt: 'DESC' },
    });
    
    const transcriptionId = latestTranscription ? latestTranscription.transcriptionId : null;
    
    return {
      ...audioFile,
      transcriptionId,
      url: `/audio/files/${audioId}`,
    };
  }

  /**
   * 오디오 파일 정보 수정
   */
  async updateAudioFile(userId: string, audioId: string, updateDto: AudioUpdateDto) {
    const audioFile = await this.audioFileRepository.findOne({
      where: { audioId, userId },
    });
    
    if (!audioFile) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    
    // 업데이트할 필드 설정
    if (updateDto.title !== undefined) {
      audioFile.title = updateDto.title;
    }
    
    if (updateDto.description !== undefined) {
      audioFile.description = updateDto.description;
    }
    
    if (updateDto.tags !== undefined) {
      audioFile.tags = updateDto.tags;
    }
    
    await this.audioFileRepository.save(audioFile);
    
    return {
      audioId,
      title: audioFile.title,
      description: audioFile.description,
      updatedAt: audioFile.updatedAt,
      tags: audioFile.tags,
    };
  }

  /**
   * 오디오 파일 삭제
   */
  async deleteAudioFile(userId: string, audioId: string) {
    const audioFile = await this.audioFileRepository.findOne({
      where: { audioId, userId },
    });
    
    if (!audioFile) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    
    // 파일 삭제
    try {
      await fs.unlink(audioFile.storagePath);
    } catch (error) {
      // 파일 삭제 실패 무시
    }
    
    // 관련 트랜스크립션 조회
    const transcriptions = await this.transcriptionRepository.find({
      where: { audioId, userId },
    });
    
    // 트랜스크립션 결과 삭제
    for (const transcription of transcriptions) {
      await this.transcriptionResultRepository.delete({ transcriptionId: transcription.transcriptionId });
    }
    
    // 트랜스크립션 삭제
    await this.transcriptionRepository.remove(transcriptions);
    
    // 오디오 파일 정보 삭제
    await this.audioFileRepository.remove(audioFile);
    
    return {
      message: '오디오 파일이 성공적으로 삭제되었습니다.',
    };
  }

  /**
   * 음성 인식(STT) 요청
   */
  async requestTranscription(userId: string, transcribeRequest: TranscribeRequestDto) {
    const { audioId, language = 'ko', options } = transcribeRequest;
    
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
    const defaultOptions = {
      punctuation: true,
      paragraphs: true,
      timestamps: true,
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // 트랜스크립션 작업 생성
    const transcriptionId = uuidv4();
    const transcription = this.transcriptionRepository.create({
      transcriptionId,
      audioId,
      userId,
      language,
      options: mergedOptions,
      status: 'pending',
      progress: 0,
      estimatedTime: Math.ceil(audioFile.duration / 60), // 대략 오디오 시간의 1/60 정도 소요된다고 가정
      createdAt: new Date(),
    });
    
    await this.transcriptionRepository.save(transcription);
    
    // 실제로는 여기서 STT 작업을 큐에 추가하거나 백그라운드 작업으로 시작
    // 여기서는 생략
    
    return {
      transcriptionId,
      status: transcription.status,
      estimatedTime: transcription.estimatedTime,
    };
  }

  /**
   * 음성 인식 상태 확인
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
      completedAt: transcription.completedAt,
    };
  }

  /**
   * 음성 인식 결과 조회
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
   * 음성 인식 취소
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
    
    // 실제로는 여기서 STT 작업 취소 로직 필요
    
    return {
      message: '변환 작업이 취소되었습니다.',
      transcriptionId,
    };
  }

  /**
   * 오디오 스트리밍
   */
  async streamAudio(
    userId: string,
    audioId: string,
    query: AudioStreamQueryDto,
  ): Promise<StreamableFile> {
    const { start, end, quality } = query;
    
    const audioFile = await this.audioFileRepository.findOne({
      where: { audioId, userId },
    });
    
    if (!audioFile) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    
    // 파일 존재 확인
    try {
      await fs.access(audioFile.storagePath);
    } catch (error) {
      throw new NotFoundException('FILE_NOT_FOUND');
    }
    
    // 실제로는 여기서 start, end, quality에 따라 스트리밍 처리
    // 예를 들면 ffmpeg를 사용하여 오디오 품질 변경이나 구간 추출 등
    
    // 간단한 파일 스트리밍
    const fileStream = createReadStream(audioFile.storagePath);
    return new StreamableFile(fileStream);
  }

  /**
   * 파형 데이터 조회
   */
  async getWaveformData(userId: string, audioId: string, query: WaveformQueryDto) {
    const { points = 800 } = query;
    
    const audioFile = await this.audioFileRepository.findOne({
      where: { audioId, userId },
    });
    
    if (!audioFile) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }
    
    // 파형 데이터가 없으면 생성 (실제로는 파일 분석 필요)
    if (!audioFile.waveformData || audioFile.waveformData.length === 0) {
      audioFile.waveformData = Array(points).fill(0).map(() => Math.random());
      await this.audioFileRepository.save(audioFile);
    }
    
    // 요청된 포인트 수에 맞게 데이터 리샘플링
    // 실제로는 필요에 따라 데이터 리샘플링 로직 구현
    const waveform = audioFile.waveformData;
    // 피크 데이터 (최대값) - 실제로는 계산 필요
    const peaks = audioFile.waveformData.map(val => val * 1.5).map(val => Math.min(val, 1.0));
    
    return {
      audioId,
      duration: audioFile.duration,
      sampleRate: audioFile.sampleRate,
      points: waveform.length,
      waveform,
      peaks,
    };
  }

  /**
   * 사용량 통계 조회
   */
  async getUsageStats(userId: string, query: UsageStatsQueryDto) {
    const { period = 'month' } = query;
    
    // 기간 설정
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        // 이번 주 월요일
        const day = now.getDay();
        const diff = (day === 0 ? 6 : day - 1); // 0이 일요일이므로 조정
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // 사용량 통계 조회
    const stats = await this.usageStatsRepository.find({
      where: {
        userId,
        date: Between(startDate, now),
      },
      order: {
        date: 'ASC',
      },
    });
    
    // 총 사용량 계산
    const totalUploadedBytes = stats.reduce((sum, stat) => sum + Number(stat.uploadedBytes), 0);
    const totalTranscriptionSeconds = stats.reduce((sum, stat) => sum + stat.transcriptionSeconds, 0);
    
    // 오디오 파일 수와 총 재생 시간 조회
    const audioFiles = await this.audioFileRepository.find({
      where: { userId },
      select: ['duration'],
    });
    
    const fileCount = audioFiles.length;
    const totalDuration = audioFiles.reduce((sum, file) => sum + file.duration, 0);
    
    // 스토리지 및 트랜스크립션 제한 조회 (실제로는 사용자 플랜에 따라 다름)
    const storageLimit = this.configService.get<number>('STORAGE_LIMIT') || 5 * 1024 * 1024 * 1024; // 5GB
    const transcriptionLimit = this.configService.get<number>('TRANSCRIPTION_LIMIT') || 36000; // 10시간
    
    // 히스토리 데이터 생성
    const history = stats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      transcriptionSeconds: stat.transcriptionSeconds,
      uploadedBytes: Number(stat.uploadedBytes),
    }));
    
    return {
      storage: {
        used: totalUploadedBytes,
        total: storageLimit,
        percentage: (totalUploadedBytes / storageLimit) * 100,
      },
      transcription: {
        used: totalTranscriptionSeconds,
        total: transcriptionLimit,
        percentage: (totalTranscriptionSeconds / transcriptionLimit) * 100,
      },
      files: {
        count: fileCount,
        totalDuration,
      },
      history,
    };
  }

  /**
   * 제한 상태 조회
   */
  async getLimits(userId: string) {
    // 사용자 플랜 정보 조회 (실제로는 사용자 서비스나 구독 서비스에서 조회)
    const plan = 'standard'; // 기본값
    
    // 스토리지 제한 (기본 5GB)
    const storageLimit = this.configService.get<number>('STORAGE_LIMIT') || 5 * 1024 * 1024 * 1024;
    
    // 현재 월의 처음
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 이번 달 사용량 통계 조회
    const monthStats = await this.usageStatsRepository.find({
      where: {
        userId,
        date: Between(firstDayOfMonth, now),
      },
    });
    
    // 총 사용량 계산
    const totalUploadedBytes = monthStats.reduce((sum, stat) => sum + Number(stat.uploadedBytes), 0);
    const totalTranscriptionSeconds = monthStats.reduce((sum, stat) => sum + stat.transcriptionSeconds, 0);
    
    // 트랜스크립션 제한 (기본 10시간/월)
    const transcriptionLimit = this.configService.get<number>('TRANSCRIPTION_LIMIT') || 36000;
    
    // 다음 달 1일 (초기화 날짜)
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // 업로드 제한
    const maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 500 * 1024 * 1024; // 500MB
    const maxDuration = this.configService.get<number>('MAX_DURATION') || 18000; // 5시간
    
    return {
      plan,
      storage: {
        limit: storageLimit,
        used: totalUploadedBytes,
        available: storageLimit - totalUploadedBytes,
      },
      transcription: {
        limitPerMonth: transcriptionLimit,
        usedThisMonth: totalTranscriptionSeconds,
        available: transcriptionLimit - totalTranscriptionSeconds,
        resetDate,
      },
      upload: {
        maxFileSize,
        maxDuration,
      },
    };
  }

  /**
   * 스토리지 사용량 제한 확인
   */
  private async checkStorageLimit(userId: string, fileSize: number): Promise<void> {
    // 사용자 파일 총 크기 조회
    const audioFiles = await this.audioFileRepository.find({
      where: { userId },
      select: ['fileSize'],
    });
    
    const totalSize = audioFiles.reduce((sum, file) => sum + file.fileSize, 0);
    
    // 스토리지 제한 (기본 5GB)
    const storageLimit = this.configService.get<number>('STORAGE_LIMIT') || 5 * 1024 * 1024 * 1024;
    
    // 제한 확인
    if (totalSize + fileSize > storageLimit) {
      throw new ForbiddenException('STORAGE_LIMIT_EXCEEDED');
    }
  }

  /**
   * 트랜스크립션 시간 제한 확인
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
    const transcriptionLimit = this.configService.get<number>('TRANSCRIPTION_LIMIT') || 36000;
    
    // 제한 확인
    if (totalTranscriptionSeconds + durationSeconds > transcriptionLimit) {
      throw new ForbiddenException('TRANSCRIPTION_LIMIT_EXCEEDED');
    }
  }

  /**
   * 사용량 통계 업데이트
   */
  private async updateUsageStats(
    userId: string,
    data: { uploadedBytes?: number; transcriptionSeconds?: number },
  ): Promise<void> {
    const { uploadedBytes = 0, transcriptionSeconds = 0 } = data;
    
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
    
    // 업데이트
    stats.uploadedBytes = Number(stats.uploadedBytes) + uploadedBytes;
    stats.transcriptionSeconds += transcriptionSeconds;
    
    await this.usageStatsRepository.save(stats);
  }
}