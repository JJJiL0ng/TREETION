import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Req,
  Body,
  Get,
  Param,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AudioService } from './audio.service';
import { CreateAudioDto } from './dto/create-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// 오디오 파일 필터 - 허용된 형식만 통과
const audioFileFilter = (req, file, callback) => {
  // 다양한 오디오 형식 허용
  const allowedMimeTypes = [
    'audio/webm', 
    'audio/webm;codecs=opus',  // 명시적으로 codecs=opus 지원 추가
    'audio/mp3', 
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav'
  ];
  
  console.log('업로드된 파일 MIME 타입:', file.mimetype);
  
  // MIME 타입에 codecs가 포함된 경우 (예: audio/webm;codecs=opus)
  // 기본 MIME 타입만 추출하여 확인
  const baseMimeType = file.mimetype.split(';')[0].trim();
  
  // 전체 MIME 타입이 허용 목록에 있는지 먼저 확인
  if (allowedMimeTypes.includes(file.mimetype)) {
    // 전체 MIME 타입(codecs 포함)이 허용 목록에 있으면 통과
    return callback(null, true);
  }
  
  // 기본 MIME 타입이 허용 목록에 있는지 확인
  if (!allowedMimeTypes.includes(baseMimeType)) {
    // 오디오 형식이 아닌 경우에만 거부
    if (!baseMimeType.startsWith('audio/')) {
      return callback(new BadRequestException('지원되는 오디오 형식이 아닙니다. 오디오 파일만 업로드 가능합니다.'), false);
    }
  }
  
  // 허용된 형식이거나 audio/ 접두사가 있으면 통과
  callback(null, true);
};

// 임시 저장을 위한 디스크 스토리지 설정
const multerStorage = diskStorage({
  destination: './uploads/temp', // 임시 저장 경로
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
   * 오디오 파일을 업로드하고 STT 변환 및 GPT 품질 향상을 자동으로 수행합니다.
   * 인증된 사용자의 정보는 JWT 토큰에서 추출됩니다.
   * 
   * 프로세스:
   * 1. 파일 업로드 및 임시 저장
   * 2. STT+GPT 처리 시작 (우선)
   * 3. R2에 오디오 파일 업로드 (병렬)
   * 4. 메타데이터 및 결과 저장
   * 
   * @param file 업로드된 오디오 파일
   * @param createAudioDto 오디오 메타데이터 (제목, 녹음 날짜)
   * @param req 요청 객체 (JWT 토큰에서 사용자 정보 추출용)
   * @returns 저장된 오디오 정보와 URL
   */
  @Post('upload')
  @ApiOperation({ summary: '오디오 파일 업로드 및 STT+GPT 처리' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audioFile: {
          type: 'string',
          format: 'binary',
          description: '업로드할 오디오 파일'
        },
        title: {
          type: 'string',
          description: '오디오 제목'
        },
        recordedAt: {
          type: 'string',
          format: 'date-time',
          description: '녹음 날짜 (ISO 형식)'
        },
        language: {
          type: 'string', 
          description: '오디오 언어 코드 (기본값: ko)',
          default: 'ko'
        }
      },
      required: ['audioFile', 'title', 'recordedAt']
    }
  })
  @ApiResponse({
    status: 201,
    description: '오디오 업로드 및 STT+GPT 처리 성공',
    type: AudioResponseDto,
  })
  @UseInterceptors(FileInterceptor('audioFile', {
    storage: multerStorage,
    fileFilter: audioFileFilter,
    limits: {
      fileSize: 1024 * 1024 * 100, // 100MB 제한
    },
  }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createAudioDto: CreateAudioDto,
    @Req() req: Request,
  ): Promise<AudioResponseDto> {
    try {
      // 파일이 없는 경우 예외 처리
      if (!file) {
        throw new BadRequestException('오디오 파일이 필요합니다. multipart/form-data 형식으로 audioFile 필드에 파일을 첨부해주세요.');
      }

      console.log('받은 파일 정보:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });
      
      console.log('받은 DTO 정보:', createAudioDto);

      // JWT에서 사용자 정보 추출
      const user = req.user as { id: string, [key: string]: any };
      
      if (!user || !user.id) {
        throw new BadRequestException('인증된 사용자 정보를 찾을 수 없습니다.');
      }

      // 서비스 호출 시 JWT에서 추출한 사용자 ID 전달
      return await this.audioService.create(file, createAudioDto, user.id);
    } catch (error) {
      // 오류 발생 시 적절한 예외 처리 및 로깅
      console.error('오디오 업로드 오류:', error);
      
      if (error.status) {
        // NestJS HTTP 예외는 그대로 전달
        throw error;
      }
      
      // 기타 예외는 BadRequestException으로 변환
      throw new BadRequestException(`오디오 업로드 실패: ${error.message}`);
    }
  }

  /**
   * 오디오 파일 상세 정보 조회 (STT 및 GPT 처리 결과 포함)
   * 
   * @param id 조회할 오디오 ID
   * @param req 요청 객체 (JWT 토큰에서 사용자 정보 추출용)
   * @returns 오디오 상세 정보 (STT 및 GPT 처리 결과 포함)
   */
  @Get(':id')
  @ApiOperation({ summary: '오디오 상세 정보 조회' })
  @ApiParam({ name: 'id', description: '조회할 오디오 ID' })
  @ApiResponse({
    status: 200,
    description: '오디오 정보 조회 성공',
    type: AudioResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<AudioResponseDto> {
    const user = req.user as { id: string, [key: string]: any };
    
    if (!user || !user.id) {
      throw new BadRequestException('인증된 사용자 정보를 찾을 수 없습니다.');
    }
    
    return await this.audioService.findOneWithStt(id, user.id);
  }

  /**
   * 기존 STT 텍스트의 품질을 GPT로 향상시킵니다.
   * 
   * @param id 업그레이드할 오디오 ID
   * @param req 요청 객체 (JWT 토큰에서 사용자 정보 추출용)
   * @returns 업그레이드된 오디오 정보
   */
  @Put(':id/upgrade-stt')
  @ApiOperation({ summary: '기존 STT 텍스트 품질 향상' })
  @ApiParam({ name: 'id', description: '업그레이드할 오디오 ID' })
  @ApiResponse({
    status: 200,
    description: 'STT 텍스트 업그레이드 성공',
    type: AudioResponseDto,
  })
  async upgradeStt(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<AudioResponseDto> {
    const user = req.user as { id: string, [key: string]: any };
    
    if (!user || !user.id) {
      throw new BadRequestException('인증된 사용자 정보를 찾을 수 없습니다.');
    }
    
    return await this.audioService.upgradeAudioStt(id, user.id);
  }
}
// import {
//     Controller,
//     Post,
//     UseInterceptors,
//     UploadedFile,
//     UseGuards,
//     BadRequestException,
//     Req,
//     Body,
//   } from '@nestjs/common';
//   import { FileInterceptor } from '@nestjs/platform-express';
//   import {
//     ApiTags,
//     ApiOperation,
//     ApiResponse,
//     ApiConsumes,
//     ApiBody,
//     ApiBearerAuth,
//   } from '@nestjs/swagger';
//   import { AudioService } from './audio.service';
//   import { CreateAudioDto } from './dto/create-audio.dto';
//   import { AudioResponseDto } from './dto/audio-response.dto';
//   import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
//   import { diskStorage } from 'multer';
//   import { extname } from 'path';
//   import { v4 as uuidv4 } from 'uuid';
//   import { Request } from 'express';
  
//   // 오디오 파일 필터 - 허용된 형식만 통과
//   const audioFileFilter = (req, file, callback) => {
//     // 다양한 오디오 형식 허용
//     const allowedMimeTypes = [
//       'audio/webm', 
//       'audio/webm;codecs=opus',  // 명시적으로 codecs=opus 지원 추가
//       'audio/mp3', 
//       'audio/mpeg',
//       'audio/wav',
//       'audio/x-wav'
//     ];
    
//     console.log('업로드된 파일 MIME 타입:', file.mimetype);
    
//     // MIME 타입에 codecs가 포함된 경우 (예: audio/webm;codecs=opus)
//     // 기본 MIME 타입만 추출하여 확인
//     const baseMimeType = file.mimetype.split(';')[0].trim();
    
//     // 전체 MIME 타입이 허용 목록에 있는지 먼저 확인
//     if (allowedMimeTypes.includes(file.mimetype)) {
//       // 전체 MIME 타입(codecs 포함)이 허용 목록에 있으면 통과
//       return callback(null, true);
//     }
    
//     // 기본 MIME 타입이 허용 목록에 있는지 확인
//     if (!allowedMimeTypes.includes(baseMimeType)) {
//       // 오디오 형식이 아닌 경우에만 거부
//       if (!baseMimeType.startsWith('audio/')) {
//         return callback(new BadRequestException('지원되는 오디오 형식이 아닙니다. 오디오 파일만 업로드 가능합니다.'), false);
//       }
//     }
    
//     // 허용된 형식이거나 audio/ 접두사가 있으면 통과
//     callback(null, true);
//   };
  
//   // 임시 저장을 위한 디스크 스토리지 설정
//   const multerStorage = diskStorage({
//     destination: './uploads/temp', // 임시 저장 경로
//     filename: (req, file, callback) => {
//       // UUID를 사용하여 고유한 파일명 생성
//       const uniqueFileName = `${uuidv4()}${extname(file.originalname)}`;
//       callback(null, uniqueFileName);
//     }
//   });
  
//   @ApiTags('audio')
//   @Controller('audio')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
//   export class AudioController {
//     constructor(private readonly audioService: AudioService) {}
  
//     /**
//      * 오디오 파일을 업로드하고 메타데이터와 함께 저장합니다.
//      * 인증된 사용자의 정보는 JWT 토큰에서 추출됩니다.
//      * 
//      * 1. FileInterceptor를 사용하여 허용된 오디오 형식만 받습니다.
//      * 2. 파일을 임시로 저장합니다.
//      * 3. JWT 토큰에서 사용자 ID를 추출합니다.
//      * 4. R2에 파일을 업로드하고 URL을 받습니다.
//      * 5. Supabase에 메타데이터와 R2 URL을 저장합니다.
//      * 6. 임시 파일은 삭제합니다.
//      * 
//      * @param file 업로드된 오디오 파일
//      * @param createAudioDto 오디오 메타데이터 (제목, 녹음 날짜)
//      * @param req 요청 객체 (JWT 토큰에서 사용자 정보 추출용)
//      * @returns 저장된 오디오 정보와 URL
//      */
//     @Post('upload')
//     @ApiOperation({ summary: '오디오 파일 업로드' })
//     @ApiConsumes('multipart/form-data')
//     @ApiBody({
//       schema: {
//         type: 'object',
//         properties: {
//           audioFile: {
//             type: 'string',
//             format: 'binary',
//             description: '업로드할 오디오 파일'
//           },
//           title: {
//             type: 'string',
//             description: '오디오 제목'
//           },
//           recordedAt: {
//             type: 'string',
//             format: 'date-time',
//             description: '녹음 날짜 (ISO 형식)'
//           }
//         },
//         required: ['audioFile', 'title', 'recordedAt']
//       }
//     })
//     @ApiResponse({
//       status: 201,
//       description: '오디오 업로드 성공',
//       type: AudioResponseDto,
//     })
//     @UseInterceptors(FileInterceptor('audioFile', {
//       storage: multerStorage,
//       fileFilter: audioFileFilter,
//       limits: {
//         fileSize: 1024 * 1024 * 100, // 55MB 제한 (1시간 오디오 가정 + 여유분)
//       },
//     }))
//     async create(
//       @UploadedFile() file: Express.Multer.File,
//       @Body() createAudioDto: CreateAudioDto,
//       @Req() req: Request,
//     ): Promise<AudioResponseDto> {
//       try {
//         // 파일이 없는 경우 예외 처리
//         if (!file) {
//           throw new BadRequestException('오디오 파일이 필요합니다. multipart/form-data 형식으로 audioFile 필드에 파일을 첨부해주세요.');
//         }
  
//         console.log('받은 파일 정보:', {
//           filename: file.originalname,
//           mimetype: file.mimetype,
//           size: file.size,
//           path: file.path
//         });
        
//         console.log('받은 DTO 정보:', createAudioDto);
  
//         // JWT에서 사용자 정보 추출
//         // req.user는 JwtAuthGuard에 의해 설정됨
//         // 타입 단언을 통해 user 객체에 접근
//         const user = req.user as { id: string, [key: string]: any };
        
//         if (!user || !user.id) {
//           throw new BadRequestException('인증된 사용자 정보를 찾을 수 없습니다.');
//         }
  
//         // 서비스 호출 시 JWT에서 추출한 사용자 ID 전달
//         return await this.audioService.create(file, createAudioDto, user.id);
//       } catch (error) {
//         // 오류 발생 시 적절한 예외 처리 및 로깅
//         console.error('오디오 업로드 오류:', error);
        
//         if (error.status) {
//           // NestJS HTTP 예외는 그대로 전달
//           throw error;
//         }
        
//         // 기타 예외는 BadRequestException으로 변환
//         throw new BadRequestException(`오디오 업로드 실패: ${error.message}`);
//       }
//     }
  
//     /**
//      * STT 업그레이드가 적용된 오디오 파일 업로드
//      * 기존 업로드 로직과 동일하지만 STT 변환 후 LLM을 통한 품질 향상이 추가됨
//      * 
//      * @param file 업로드된 오디오 파일
//      * @param createAudioDto 오디오 메타데이터 (제목, 녹음 날짜)
//      * @param req 요청 객체 (JWT 토큰에서 사용자 정보 추출용)
//      * @returns 저장된 오디오 정보와 URL (업그레이드된 STT 포함)
//      */
//     @Post('upgrade-upload')
//     @ApiOperation({ summary: '품질 향상된 STT가 적용된 오디오 파일 업로드' })
//     @ApiConsumes('multipart/form-data')
//     @ApiBody({
//       schema: {
//         type: 'object',
//         properties: {
//           audioFile: {
//             type: 'string',
//             format: 'binary',
//             description: '업로드할 오디오 파일'
//           },
//           title: {
//             type: 'string',
//             description: '오디오 제목'
//           },
//           recordedAt: {
//             type: 'string',
//             format: 'date-time',
//             description: '녹음 날짜 (ISO 형식)'
//           },
//           language: {
//             type: 'string',
//             description: '오디오 언어 (기본값: ko)',
//             default: 'ko'
//           }
//         },
//         required: ['audioFile', 'title', 'recordedAt']
//       }
//     })
//     @ApiResponse({
//       status: 201,
//       description: '향상된 STT가 적용된 오디오 업로드 성공',
//       type: AudioResponseDto,
//     })
//     @UseInterceptors(FileInterceptor('audioFile', {
//       storage: multerStorage,
//       fileFilter: audioFileFilter,
//       limits: {
//         fileSize: 1024 * 1024 * 100, // 55MB 제한
//       },
//     }))
//     async createWithUpgradedStt(
//       @UploadedFile() file: Express.Multer.File,
//       @Body() createAudioDto: CreateAudioDto,
//       @Req() req: Request,
//     ): Promise<AudioResponseDto> {
//       try {
//         // 파일이 없는 경우 예외 처리
//         if (!file) {
//           throw new BadRequestException('오디오 파일이 필요합니다. multipart/form-data 형식으로 audioFile 필드에 파일을 첨부해주세요.');
//         }
  
//         console.log('향상된 STT 적용 오디오 업로드 - 받은 파일 정보:', {
//           filename: file.originalname,
//           mimetype: file.mimetype,
//           size: file.size,
//           path: file.path
//         });
        
//         console.log('향상된 STT 적용 오디오 업로드 - 받은 DTO 정보:', createAudioDto);
  
//         // JWT에서 사용자 정보 추출
//         const user = req.user as { id: string, [key: string]: any };
        
//         if (!user || !user.id) {
//           throw new BadRequestException('인증된 사용자 정보를 찾을 수 없습니다.');
//         }
  
//         // STT 업그레이드가 적용된 서비스 메서드 호출
//         return await this.audioService.createWithUpgradedStt(file, createAudioDto, user.id);
//       } catch (error) {
//         console.error('향상된 STT 적용 오디오 업로드 오류:', error);
        
//         if (error.status) {
//           throw error;
//         }
        
//         throw new BadRequestException(`향상된 STT 적용 오디오 업로드 실패: ${error.message}`);
//       }
//     }
//   }