// src/audio/audio.controller.ts
import { 
    Controller, 
    Post, 
    Get, 
    Param, 
    Delete, 
    Patch, 
    UseInterceptors, 
    UploadedFile, 
    Body, 
    UseGuards,
    Request,
    ParseUUIDPipe,
    Logger
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { ApiConsumes, ApiBody, ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
  
  import { CreateAudioDto } from './dto/create-audio.dto';
  import { AudioService } from './audio.service';
  import { UpdateAudioDto } from './dto/update-audio.dto';
  import { AudioResponseDto } from './dto/audio-response.dto';
  import { AudioDto } from './dto/audio.dto';
  
  @ApiTags('audio')
  @Controller('audio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class AudioController {
    private readonly logger = new Logger(AudioController.name);
  
    constructor(private readonly audioService: AudioService) {}
  
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: '오디오 파일 업로드' })
    @ApiResponse({ status: 201, description: '오디오 파일 업로드 성공', type: AudioResponseDto })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: '업로드할 오디오 파일',
          },
          title: {
            type: 'string',
            description: '오디오 파일 제목',
          },
          audioFileType: {
            type: 'string',
            description: '원본 오디오 파일 타입 (자동으로 mp3로 변환됨)',
          },
        },
      },
    })
    async uploadAudio(
      @UploadedFile() file: Express.Multer.File,
      @Body('title') title: string,
      @Body('audioFileType') audioFileType: string,
      @Request() req
    ): Promise<AudioResponseDto> {
      this.logger.log(`오디오 파일 업로드 요청: ${file.originalname}, 크기: ${file.size}`);
      
      const createAudioDto = new CreateAudioDto();
      createAudioDto.title = title || file.originalname.split('.')[0];
      createAudioDto.audioFileType = audioFileType || file.mimetype.split('/')[1];
      createAudioDto.user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture,
        isEmailVerified: req.user.isEmailVerified
      };
      
      return this.audioService.createAudio(file, createAudioDto);
    }
  
    @Get()
    @ApiOperation({ summary: '사용자의 모든 오디오 파일 조회' })
    @ApiResponse({ status: 200, description: '오디오 파일 목록 조회 성공', type: [AudioDto] })
    async findAll(@Request() req): Promise<AudioDto[]> {
      this.logger.log(`사용자 ${req.user.id}의 오디오 목록 조회`);
      return this.audioService.findAll(req.user.id);
    }
  
    @Get(':id')
    @ApiOperation({ summary: '특정 오디오 파일 조회' })
    @ApiResponse({ status: 200, description: '오디오 파일 조회 성공', type: AudioDto })
    async findOne(
      @Param('id', ParseUUIDPipe) id: string,
      @Request() req
    ): Promise<AudioDto> {
      this.logger.log(`오디오 ID ${id} 조회`);
      return this.audioService.findOne(id, req.user.id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: '오디오 파일 정보 수정' })
    @ApiResponse({ status: 200, description: '오디오 파일 정보 수정 성공', type: AudioDto })
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateAudioDto: UpdateAudioDto,
      @Request() req
    ): Promise<AudioDto> {
      this.logger.log(`오디오 ID ${id} 정보 수정`);
      return this.audioService.update(id, req.user.id, updateAudioDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: '오디오 파일 삭제' })
    @ApiResponse({ status: 200, description: '오디오 파일 삭제 성공' })
    async remove(
      @Param('id', ParseUUIDPipe) id: string,
      @Request() req
    ): Promise<{ success: boolean }> {
      this.logger.log(`오디오 ID ${id} 삭제 요청`);
      return { success: await this.audioService.remove(id, req.user.id) };
    }
  }