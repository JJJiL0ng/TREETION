// src/audio/audio.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    Query, 
    UseGuards, 
    UploadedFile, 
    UseInterceptors,
    Req,
    Res,
    HttpStatus,
    BadRequestException,
    StreamableFile
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { Request, Response } from 'express';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { AudioService } from './audio.service';
  
  // DTO 임포트
  import { AudioUploadDto } from './dto/audio-upload.dto';
  import { ChunkUploadInitDto } from './dto/chunk-upload-init.dto';
  import { ChunkUploadDto } from './dto/chunk-upload.dto';
  import { ChunkUploadCompleteDto } from './dto/chunk-upload-complete.dto';
  import { AudioFileQueryDto } from './dto/audio-file-query.dto';
  import { AudioUpdateDto } from './dto/audio-update.dto';
  import { TranscribeRequestDto } from './dto/transcribe-request.dto';
  import { AudioStreamQueryDto } from './dto/audio-stream-query.dto';
  import { WaveformQueryDto } from './dto/waveform-query.dto';
  import { UsageStatsQueryDto } from './dto/usage-stats-query.dto';


  import { User } from '../users/entities/user.entity';
  
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { v4 as uuidv4 } from 'uuid';
  
  // Express Request에 user 속성 추가
  interface RequestWithUser extends Request {
    user: User;
  }
  
  @ApiTags('audio')
  @Controller('audio')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  export class AudioController {
    constructor(private readonly audioService: AudioService) {}
  
    // 단일 파일 업로드
    @Post('upload')
    @ApiOperation({ summary: '오디오 파일 업로드' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: '파일 업로드 성공' })
    @ApiResponse({ status: 400, description: '파일 형식 오류 또는 크기 제한 초과' })
    @ApiResponse({ status: 403, description: '스토리지 한도 초과' })
    @UseInterceptors(
      FileInterceptor('file', {
        limits: {
          fileSize: 500 * 1024 * 1024, // 500MB
        },
        fileFilter: (req, file, cb) => {
          // 오디오 파일 형식 검증
          const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'];
          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new BadRequestException('INVALID_FILE_FORMAT'), false);
          }
        },
      }),
    )
    async uploadAudioFile(
      @UploadedFile() file: Express.Multer.File,
      @Body() audioUploadDto: AudioUploadDto,
      @Req() req: RequestWithUser,
    ) {
      if (!file) {
        throw new BadRequestException('파일이 제공되지 않았습니다.');
      }
      
      const userId = req.user.id;
      return this.audioService.uploadAudioFile(file, userId, audioUploadDto);
    }
  
    // 청크 업로드 초기화
    @Post('upload/chunk/init')
    @ApiOperation({ summary: '청크 업로드 세션 초기화' })
    @ApiResponse({ status: 201, description: '청크 업로드 세션 생성 성공' })
    @ApiResponse({ status: 400, description: '파일 크기 제한 초과' })
    @ApiResponse({ status: 403, description: '스토리지 한도 초과' })
    async initChunkUpload(
      @Body() chunkUploadInitDto: ChunkUploadInitDto,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.initChunkUpload(userId, chunkUploadInitDto);
    }
  
    // 청크 업로드
    @Post('upload/chunk')
    @ApiOperation({ summary: '파일 청크 업로드' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 200, description: '청크 업로드 성공' })
    @ApiResponse({ status: 400, description: '유효하지 않은 청크 또는 세션 만료' })
    @ApiResponse({ status: 404, description: '세션 ID를 찾을 수 없음' })
    @UseInterceptors(
      FileInterceptor('chunk', {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB (청크 최대 크기)
        },
      }),
    )
    async uploadChunk(
      @UploadedFile() chunk: Express.Multer.File,
      @Body('uploadId') uploadId: string,
      @Body('chunkNumber') chunkNumber: number,
      @Req() req: RequestWithUser,
    ) {
      if (!chunk) {
        throw new BadRequestException('청크 데이터가 제공되지 않았습니다.');
      }
      
      if (!uploadId) {
        throw new BadRequestException('업로드 ID가 필요합니다.');
      }
      
      if (chunkNumber === undefined || isNaN(Number(chunkNumber))) {
        throw new BadRequestException('유효한 청크 번호가 필요합니다.');
      }
      
      const userId = req.user.id;
      return this.audioService.uploadChunk(userId, uploadId, Number(chunkNumber), chunk.buffer);
    }
  
    // 청크 업로드 완료
    @Post('upload/chunk/complete')
    @ApiOperation({ summary: '청크 업로드 완료' })
    @ApiResponse({ status: 200, description: '파일 병합 성공' })
    @ApiResponse({ status: 400, description: '불완전한 업로드 또는 세션 만료' })
    @ApiResponse({ status: 404, description: '세션 ID를 찾을 수 없음' })
    async completeChunkUpload(
      @Body() chunkUploadCompleteDto: ChunkUploadCompleteDto,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.completeChunkUpload(userId, chunkUploadCompleteDto);
    }
  
    // 오디오 파일 목록 조회
    @Get('files')
    @ApiOperation({ summary: '오디오 파일 목록 조회' })
    @ApiResponse({ status: 200, description: '파일 목록 조회 성공' })
    async getAudioFiles(
      @Query() query: AudioFileQueryDto,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.getAudioFiles(userId, query);
    }
  
    // 오디오 파일 상세 조회
    @Get('files/:audioId')
    @ApiOperation({ summary: '오디오 파일 상세 조회' })
    @ApiResponse({ status: 200, description: '파일 상세 조회 성공' })
    @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
    async getAudioFile(
      @Param('audioId') audioId: string,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.getAudioFile(userId, audioId);
    }
  
    // 오디오 파일 정보 수정
    @Put('files/:audioId')
    @ApiOperation({ summary: '오디오 파일 정보 수정' })
    @ApiResponse({ status: 200, description: '파일 정보 수정 성공' })
    @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
    async updateAudioFile(
      @Param('audioId') audioId: string,
      @Body() updateDto: AudioUpdateDto,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.updateAudioFile(userId, audioId, updateDto);
    }
  
    // 오디오 파일 삭제
    @Delete('files/:audioId')
    @ApiOperation({ summary: '오디오 파일 삭제' })
    @ApiResponse({ status: 200, description: '파일 삭제 성공' })
    @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
    async deleteAudioFile(
      @Param('audioId') audioId: string,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.deleteAudioFile(userId, audioId);
    }
  
    // 음성 인식(STT) 요청
    @Post('transcribe')
    @ApiOperation({ summary: '음성 인식 요청' })
    @ApiResponse({ status: 201, description: '음성 인식 요청 성공' })
    @ApiResponse({ status: 404, description: '오디오 파일을 찾을 수 없음' })
    @ApiResponse({ status: 403, description: '음성 인식 시간 한도 초과' })
    async requestTranscription(
      @Body() transcribeRequest: TranscribeRequestDto,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.requestTranscription(userId, transcribeRequest);
    }
  
    // 음성 인식 상태 확인
    @Get('transcribe/status/:transcriptionId')
    @ApiOperation({ summary: '음성 인식 상태 확인' })
    @ApiResponse({ status: 200, description: '상태 조회 성공' })
    @ApiResponse({ status: 404, description: '변환 작업을 찾을 수 없음' })
    async getTranscriptionStatus(
      @Param('transcriptionId') transcriptionId: string,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.getTranscriptionStatus(userId, transcriptionId);
    }
  
    // 음성 인식 결과 조회
    @Get('transcribe/result/:transcriptionId')
    @ApiOperation({ summary: '음성 인식 결과 조회' })
    @ApiResponse({ status: 200, description: '결과 조회 성공' })
    @ApiResponse({ status: 400, description: '변환이 완료되지 않음' })
    @ApiResponse({ status: 404, description: '변환 작업을 찾을 수 없음' })
    async getTranscriptionResult(
      @Param('transcriptionId') transcriptionId: string,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.getTranscriptionResult(userId, transcriptionId);
    }
  
    // 음성 인식 취소
    @Post('transcribe/cancel/:transcriptionId')
    @ApiOperation({ summary: '음성 인식 취소' })
    @ApiResponse({ status: 200, description: '취소 성공' })
    @ApiResponse({ status: 400, description: '이미 완료되거나 취소된 작업' })
    @ApiResponse({ status: 404, description: '변환 작업을 찾을 수 없음' })
    async cancelTranscription(
      @Param('transcriptionId') transcriptionId: string,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.cancelTranscription(userId, transcriptionId);
    }
  
    // 오디오 스트리밍
    @Get('stream/:audioId')
    @ApiOperation({ summary: '오디오 스트리밍' })
    @ApiResponse({ status: 200, description: '스트리밍 성공' })
    @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
    async streamAudio(
      @Param('audioId') audioId: string,
      @Query() query: AudioStreamQueryDto,
      @Req() req: RequestWithUser,
      @Res({ passthrough: true }) res: Response,
    ) {
      const userId = req.user.id;
      const streamableFile = await this.audioService.streamAudio(userId, audioId, query);
      
      // 적절한 헤더 설정
      res.set({
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
      });
      
      return streamableFile;
    }
  
    // 파형 데이터 조회
    @Get('waveform/:audioId')
    @ApiOperation({ summary: '파형 데이터 조회' })
    @ApiResponse({ status: 200, description: '파형 데이터 조회 성공' })
    @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
    async getWaveformData(
      @Param('audioId') audioId: string,
      @Query() query: WaveformQueryDto,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.getWaveformData(userId, audioId, query);
    }
  
    // 사용량 통계 조회
    @Get('usage/stats')
    @ApiOperation({ summary: '사용량 통계 조회' })
    @ApiResponse({ status: 200, description: '통계 조회 성공' })
    async getUsageStats(
      @Query() query: UsageStatsQueryDto,
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.getUsageStats(userId, query);
    }
  
    // 제한 상태 조회
    @Get('usage/limits')
    @ApiOperation({ summary: '제한 상태 조회' })
    @ApiResponse({ status: 200, description: '제한 상태 조회 성공' })
    async getLimits(
      @Req() req: RequestWithUser,
    ) {
      const userId = req.user.id;
      return this.audioService.getLimits(userId);
    }
  }