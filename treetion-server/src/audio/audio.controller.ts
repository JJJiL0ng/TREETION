import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    Query,
    HttpStatus,
    ParseUUIDPipe,
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiConsumes,
    ApiBody,
    ApiBearerAuth,
    ApiQuery,
  } from '@nestjs/swagger';
  import { AudioService } from './audio.service';
  import { CreateAudioDto } from './dto/create-audio.dto';
  import { AudioResponseDto } from './dto/audio-response.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { v4 as uuidv4 } from 'uuid';
  
  // WebM 파일만 허용하는 필터
  const webmFileFilter = (req, file, callback) => {
    // MIME 타입과 확장자 모두 확인
    if (file.mimetype !== 'audio/webm' && !file.originalname.toLowerCase().endsWith('.webm')) {
      return callback(new BadRequestException('WebM 형식의 오디오 파일만 업로드할 수 있습니다.'), false);
    }
    callback(null, true);
  };
  
  // 임시 저장을 위한 디스크 스토리지 설정
  const multerStorage = diskStorage({
    destination: './uploads/temp', // 임시 저장 경로 (실제 프로젝트에서는 설정 파일에서 관리하는 것이 좋습니다)
    filename: (req, file, callback) => {
      // UUID를 사용하여 고유한 파일명 생성
      const uniqueFileName = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueFileName);
    }
  });
  
  @ApiTags('audio')
  @Controller('audio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class AudioController {
    constructor(private readonly audioService: AudioService) {}
  
    /**
     * 오디오 파일을 업로드하고 메타데이터와 함께 저장합니다.
     * 
     * 1. FileInterceptor를 사용하여 WebM 형식의 오디오 파일만 받습니다.
     * 2. 파일을 임시로 저장합니다.
     * 3. R2에 파일을 업로드하고 URL을 받습니다.
     * 4. Supabase에 메타데이터와 R2 URL을 저장합니다.
     * 5. 임시 파일은 삭제합니다.
     * 
     * @param file 업로드된 WebM 오디오 파일
     * @param createAudioDto 오디오 메타데이터 (제목, 녹음 날짜, 사용자 ID)
     * @returns 저장된 오디오 정보와 URL
     */
    @Post('upload')
    @ApiOperation({ summary: 'WebM 오디오 파일 업로드' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      description: 'WebM 오디오 파일과 메타데이터',
      type: CreateAudioDto,
    })
    @ApiResponse({
      status: 201,
      description: '오디오 업로드 성공',
      type: AudioResponseDto,
    })
    @UseInterceptors(FileInterceptor('audioFile', {
      storage: multerStorage,
      fileFilter: webmFileFilter,
      limits: {
        fileSize: 1024 * 1024 * 55, // 55MB 제한 (1시간 오디오 가정 + 여유분)
      },
    }))
    async create(
      @UploadedFile() file: Express.Multer.File,
      @Body() createAudioDto: CreateAudioDto,
    ): Promise<AudioResponseDto> {
      try {
        // 파일이 없는 경우 예외 처리
        if (!file) {
          throw new BadRequestException('오디오 파일이 필요합니다.');
        }
  
        // 서비스 호출하여 R2에 업로드 및 Supabase에 저장
        return await this.audioService.create(file, createAudioDto);
      } catch (error) {
        // 오류 발생 시 적절한 예외 처리 및 로깅
        if (error.status) {
          // NestJS HTTP 예외는 그대로 전달
          throw error;
        }
        
        // 기타 예외는 BadRequestException으로 변환
        throw new BadRequestException(`오디오 업로드 실패: ${error.message}`);
      }
    }
}
//     /**
//      * 사용자 ID를 기준으로 오디오 목록을 페이지네이션하여 조회합니다.
//      * 
//      * @param userId 사용자 ID
//      * @param page 페이지 번호 (기본값: 1)
//      * @param limit 페이지당 항목 수 (기본값: 10)
//      * @returns 오디오 목록과 페이지네이션 메타 정보
//      */
//     @Get('user/:userId')
//     @ApiOperation({ summary: '사용자의 오디오 목록 조회' })
//     @ApiQuery({ name: 'page', required: false, type: Number })
//     @ApiQuery({ name: 'limit', required: false, type: Number })
//     @ApiResponse({
//       status: 200,
//       description: '오디오 목록 조회 성공',
//       type: [AudioResponseDto],
//     })
//     async findAllByUser(
//       @Param('userId', ParseUUIDPipe) userId: string,
//       @Query('page') page = 1,
//       @Query('limit') limit = 10,
//     ): Promise<{ data: AudioResponseDto[]; meta: { total: number; page: number; limit: number } }> {
//       try {
//         // 페이지 및 제한 값이 양수인지 확인
//         if (page < 1 || limit < 1) {
//           throw new BadRequestException('페이지와 제한 값은 1 이상이어야 합니다.');
//         }
  
//         return await this.audioService.findAllByUser(userId, page, limit);
//       } catch (error) {
//         if (error.status) throw error;
//         throw new BadRequestException(`조회 실패: ${error.message}`);
//       }
//     }
  
//     /**
//      * 특정 ID의 오디오를 조회합니다.
//      * 
//      * @param id 오디오 ID (UUID)
//      * @returns 오디오 정보와 URL
//      */
//     @Get(':id')
//     @ApiOperation({ summary: '특정 오디오 조회' })
//     @ApiResponse({
//       status: 200,
//       description: '오디오 조회 성공',
//       type: AudioResponseDto,
//     })
//     @ApiResponse({ status: 404, description: '오디오를 찾을 수 없습니다' })
//     async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AudioResponseDto> {
//       try {
//         const audio = await this.audioService.findOne(id);
//         if (!audio) {
//           throw new NotFoundException(`ID ${id}의 오디오를 찾을 수 없습니다.`);
//         }
//         return audio;
//       } catch (error) {
//         if (error.status) throw error;
//         throw new BadRequestException(`조회 실패: ${error.message}`);
//       }
//     }
  
//     /**
//      * 특정 ID의 오디오를 삭제합니다.
//      * R2의 파일과 Supabase의 메타데이터 모두 삭제합니다.
//      * 
//      * @param id 오디오 ID (UUID)
//      * @param userId 삭제 요청 사용자 ID (소유자 확인용) 
//      */
//     @Delete(':id')
//     @ApiOperation({ summary: '오디오 삭제' })
//     @ApiResponse({
//       status: HttpStatus.NO_CONTENT,
//       description: '오디오 삭제 성공',
//     })
//     @ApiResponse({ status: 404, description: '오디오를 찾을 수 없습니다' })
//     @ApiResponse({ status: 403, description: '삭제 권한이 없습니다' })
//     async remove(
//       @Param('id', ParseUUIDPipe) id: string,
//       @Query('userId', ParseUUIDPipe) userId: string,
//     ): Promise<void> {
//       try {
//         // 오디오 존재 여부 확인
//         const audio = await this.audioService.findOne(id);
//         if (!audio) {
//           throw new NotFoundException(`ID ${id}의 오디오를 찾을 수 없습니다.`);
//         }
        
//         // 소유자 권한 확인
//         if (audio.userId !== userId) {
//           throw new UnauthorizedException('이 오디오를 삭제할 권한이 없습니다.');
//         }
        
//         // R2 및 Supabase에서 삭제
//         await this.audioService.remove(id);
//       } catch (error) {
//         if (error.status) throw error;
//         throw new BadRequestException(`삭제 실패: ${error.message}`);
//       }
//     }
    