// src/stt/stt.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Query, 
    UseGuards, 
    Req,
    BadRequestException,
    NotFoundException,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { Request } from 'express';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { STTService } from './stt.service';
  
  import { STTRequestDto } from './dto/stt-request.dto';
  import { STTRequestQueryDto } from './dto/stt-request-query.dto';
  
  @ApiTags('stt')
  @Controller('stt')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  export class STTController {
    constructor(private readonly sttService: STTService) {}
  
    // 오디오 파일 변환 요청
    @Post('transcribe/:audioId')
    @ApiOperation({ summary: '오디오 파일 STT 변환 요청' })
    @ApiResponse({ status: 201, description: 'STT 변환 요청 성공' })
    @ApiResponse({ status: 404, description: '오디오 파일을 찾을 수 없음' })
    @ApiResponse({ status: 403, description: 'STT 변환 시간 한도 초과' })
    async transcribeAudio(
      @Param('audioId') audioId: string,
      @Body() sttRequestDto: STTRequestDto,
      @Req() req: Request,
    ) {
      const userId = req.user.id;
      return this.sttService.requestTranscription(userId, audioId, sttRequestDto);
    }
  
    // 변환 상태 확인
    @Get('status/:transcriptId')
    @ApiOperation({ summary: 'STT 변환 상태 확인' })
    @ApiResponse({ status: 200, description: '상태 조회 성공' })
    @ApiResponse({ status: 404, description: '변환 작업을 찾을 수 없음' })
    async getTranscriptionStatus(
      @Param('transcriptId') transcriptId: string,
      @Req() req: Request,
    ) {
      const userId = req.user.id;
      return this.sttService.getTranscriptionStatus(userId, transcriptId);
    }
  
    // 변환 결과 조회
    @Get('transcripts/:transcriptId')
    @ApiOperation({ summary: 'STT 변환 결과 조회' })
    @ApiResponse({ status: 200, description: '결과 조회 성공' })
    @ApiResponse({ status: 400, description: '변환이 완료되지 않음' })
    @ApiResponse({ status: 404, description: '변환 작업을 찾을 수 없음' })
    async getTranscriptionResult(
      @Param('transcriptId') transcriptId: string,
      @Req() req: Request,
    ) {
      const userId = req.user.id;
      return this.sttService.getTranscriptionResult(userId, transcriptId);
    }
  
    // 변환 결과 목록 조회
    @Get('transcripts')
    @ApiOperation({ summary: 'STT 변환 결과 목록 조회' })
    @ApiResponse({ status: 200, description: '목록 조회 성공' })
    async getTranscriptionList(
      @Query() query: STTRequestQueryDto,
      @Req() req: Request,
    ) {
      const userId = req.user.id;
      return this.sttService.getTranscriptionList(userId, query);
    }
  
    // 변환 작업 취소
    @Post('cancel/:transcriptId')
    @ApiOperation({ summary: 'STT 변환 작업 취소' })
    @ApiResponse({ status: 200, description: '취소 성공' })
    @ApiResponse({ status: 400, description: '이미 완료되거나 취소된 작업' })
    @ApiResponse({ status: 404, description: '변환 작업을 찾을 수 없음' })
    async cancelTranscription(
      @Param('transcriptId') transcriptId: string,
      @Req() req: Request,
    ) {
      const userId = req.user.id;
      return this.sttService.cancelTranscription(userId, transcriptId);
    }
  
    // STT 프로바이더 상태 확인
    @Get('providers/status')
    @ApiOperation({ summary: 'STT 프로바이더 상태 확인' })
    @ApiResponse({ status: 200, description: '상태 조회 성공' })
    async getProviderStatus() {
      return this.sttService.getProviderStatus();
    }
  }