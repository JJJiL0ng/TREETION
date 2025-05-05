import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import { CreateAudioDto } from './dto/create-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { AudioEntity } from './entities/audio.entity';
import { SttWhisperService, SttResult } from '../stt-whisper/stt-whisper.service';
import { SttUpgradeService } from '../stt-upgrade/stt-upgrade.service'; // STT 업그레이드 서비스 추가
import { NotFoundException } from '@nestjs/common';
import { ClassEntity } from '../class/entities/class.entity';

@Injectable()
export class AudioService {
    private readonly logger = new Logger(AudioService.name);
    private readonly s3Client: S3;
    private readonly unlinkAsync = promisify(fs.unlink);

    constructor(
        @InjectRepository(AudioEntity)
        private readonly audioRepository: Repository<AudioEntity>,
        @InjectRepository(ClassEntity)
        private readonly classRepository: Repository<ClassEntity>,
        private readonly configService: ConfigService,
        private readonly sttWhisperService: SttWhisperService,
        private readonly sttUpgradeService: SttUpgradeService, // 의존성 주입
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
    }

    /**
     * 오디오 파일을 R2에 업로드하고 메타데이터를 Supabase에 저장합니다.
     * 
     * 프로세스:
     * 1. 임시 저장된 파일을 읽습니다.
     * 2. R2에 파일을 업로드합니다.
     * 3. 메타데이터와 R2 URL을 Supabase에 저장합니다.
     * 4. 임시 파일을 삭제합니다.
     * 5. 저장된 오디오 정보를 반환합니다.
     * 
     * @param file 업로드된 오디오 파일 (Multer에 의해 임시 저장됨)
     * @param createAudioDto 오디오 메타데이터 (제목, 녹음 날짜)
     * @param userId JWT에서 추출한 사용자 ID
     * @returns 저장된 오디오 정보와 URL을 포함한 DTO
     */
    async create(
        file: Express.Multer.File,
        createAudioDto: CreateAudioDto,
        userId: string
    ): Promise<AudioResponseDto> {
        this.logger.log(`사용자 ${userId}의 오디오 파일 업로드 시작: ${file.originalname}, 타입: ${file.mimetype}, 크기: ${file.size}바이트`);

        try {
            // 1. 파일 정보 준비
            const fileExtension = path.extname(file.originalname) || this.getExtensionFromMimeType(file.mimetype);
            const fileKey = `audios/${userId}/${Date.now()}${fileExtension}`;

            this.logger.log(`사용할 파일 확장자: ${fileExtension}, 저장 경로: ${fileKey}`);

            // 2. R2에 파일 업로드 (파일의 MIME 타입 전달)
            const uploadResult = await this.uploadFileToR2(file.path, fileKey, file.mimetype);
            this.logger.log(`R2 업로드 완료: ${uploadResult.Location}`);

            // 3. 공개 URL 생성 (ConfigService에서 가져온 PUBLIC_URL 사용)
            const publicUrl = this.generatePublicUrl(fileKey);

            // 4. STT 서비스를 통해 오디오 변환 - 청크 처리 지원
            let transcriptionResult: SttResult | null = null;
            try {
                // 청크 업로드 지원 메서드 호출
                transcriptionResult = await this.sttWhisperService.transcribeAudio(
                    file,
                    userId,
                    createAudioDto.language || 'ko'
                );
                this.logger.log(`STT 변환 완료: ${transcriptionResult.text.substring(0, 50)}...`);
            } catch (sttError) {
                this.logger.error(`STT 변환 실패, 오디오 저장은 계속 진행: ${sttError.message}`);
                // STT 실패해도 오디오 저장은 계속 진행
            }

            // 5. Supabase에 메타데이터 저장 (STT 결과 포함)
            const audioData = {
                title: createAudioDto.title,
                userId: userId,
                audioUrl: publicUrl,
                audioKey: fileKey,
                recordedAt: new Date(createAudioDto.recordedAt),
                originalFilename: file.originalname, // 원본 파일명 저장 (STT 업그레이드에 활용)
                // STT 관련 필드 추가
                transcriptionText: transcriptionResult?.text || undefined,
                transcriptionKey: transcriptionResult?.textKey || undefined,
                transcriptionUrl: transcriptionResult?.textKey
                    ? this.sttWhisperService.getTranscriptionPublicUrl(transcriptionResult.textKey)
                    : undefined,
                duration: transcriptionResult?.duration || undefined,
                language: transcriptionResult?.language || createAudioDto.language || 'ko',
            };

            const audioEntity = this.audioRepository.create(audioData);
            const savedAudio = await this.audioRepository.save(audioEntity) as AudioEntity;
            this.logger.log(`사용자 ${userId}의 오디오 메타데이터 저장 완료: ID ${savedAudio.id}`);

            // 6. 임시 파일 삭제
            await this.unlinkAsync(file.path);
            this.logger.log(`임시 파일 삭제 완료: ${file.path}`);

            // 7. 응답 DTO 형식으로 변환하여 반환
            return this.mapToResponseDto(savedAudio);

        } catch (error) {
            this.logger.error(`오디오 업로드 중 오류 발생: ${error.message}`, error.stack);

            // 임시 파일이 존재하는 경우 삭제 시도
            try {
                if (file && file.path && fs.existsSync(file.path)) {
                    await this.unlinkAsync(file.path);
                    this.logger.log(`오류 후 임시 파일 삭제 완료: ${file.path}`);
                }
            } catch (cleanupError) {
                this.logger.error(`임시 파일 삭제 중 오류: ${cleanupError.message}`);
            }

            // 오류 유형에 따라 적절한 예외 발생
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`오디오 저장 실패: ${error.message}`);
        }
    }

    /**
     * STT 업그레이드가 적용된 오디오 파일 업로드 및 저장
     * 기존 create 메서드와 동일한 프로세스에 STT 업그레이드 과정이 추가됨
     * 
     * @param file 업로드된 오디오 파일
     * @param createAudioDto 오디오 메타데이터
     * @param userId 사용자 ID
     * @returns 업그레이드된 STT 결과가 포함된 오디오 정보
     */
    async createWithUpgradedStt(
        file: Express.Multer.File,
        createAudioDto: CreateAudioDto,
        userId: string
    ): Promise<AudioResponseDto> {
        this.logger.log(`STT 업그레이드 적용 - 사용자 ${userId}의 오디오 파일 업로드 시작: ${file.originalname}`);

        try {
            // 1. 기본 오디오 저장 로직 수행 (기존 create 메서드와 동일)
            const fileExtension = path.extname(file.originalname) || this.getExtensionFromMimeType(file.mimetype);
            const fileKey = `audios/${userId}/${Date.now()}${fileExtension}`;
            
            const uploadResult = await this.uploadFileToR2(file.path, fileKey, file.mimetype);
            const publicUrl = this.generatePublicUrl(fileKey);
            
            // 2. STT 서비스를 통해 오디오 변환
            let transcriptionResult: SttResult | null = null;
            try {
                transcriptionResult = await this.sttWhisperService.transcribeAudio(
                    file,
                    userId,
                    createAudioDto.language || 'ko'
                );
                this.logger.log(`STT 변환 완료: ${transcriptionResult.text.substring(0, 50)}...`);
            } catch (sttError) {
                this.logger.error(`STT 변환 실패, 오디오 저장은 계속 진행: ${sttError.message}`);
                // STT 실패 시 업그레이드 없이 진행
            }
            
            // 3. 기본 오디오 데이터 생성
            const audioData = {
                title: createAudioDto.title,
                userId: userId,
                audioUrl: publicUrl,
                audioKey: fileKey,
                recordedAt: new Date(createAudioDto.recordedAt),
                originalFilename: file.originalname,
                transcriptionText: transcriptionResult?.text || undefined,
                transcriptionKey: transcriptionResult?.textKey || undefined,
                transcriptionUrl: transcriptionResult?.textKey
                    ? this.sttWhisperService.getTranscriptionPublicUrl(transcriptionResult.textKey)
                    : undefined,
                duration: transcriptionResult?.duration || undefined,
                language: transcriptionResult?.language || createAudioDto.language || 'ko',
            };
            
            // 4. 데이터베이스에 저장
            let audioEntity = this.audioRepository.create(audioData);
            audioEntity = await this.audioRepository.save(audioEntity);
            
            // 5. STT 변환 결과가 있는 경우, STT 업그레이드 수행
            if (transcriptionResult && transcriptionResult.text) {
                try {
                    this.logger.log(`STT 업그레이드 시작: ${audioEntity.id}`);
                    
                    // 비동기로 업그레이드 요청 (업로드 응답은 대기하지 않음)
                    const upgradePromise = this.sttUpgradeService.upgradeSttText(audioEntity.id, userId)
                        .then(upgradeResult => {
                            this.logger.log(`STT 업그레이드 완료: ${audioEntity.id}`);
                            return upgradeResult;
                        })
                        .catch(error => {
                            this.logger.error(`STT 업그레이드 실패: ${error.message}`, error.stack);
                        });
                    
                    // 업그레이드 작업이 시작되었음을 표시
                    audioEntity.isUpgraded = false; // 진행 중임을 표시
                    await this.audioRepository.save(audioEntity);
                } catch (upgradeError) {
                    this.logger.error(`STT 업그레이드 초기화 실패: ${upgradeError.message}`, upgradeError.stack);
                    // 업그레이드 실패해도 기본 오디오는 계속 반환
                }
            }
            
            // 6. 임시 파일 삭제
            await this.unlinkAsync(file.path);
            
            // 7. 최신 정보로 엔티티 다시 조회 (업그레이드 상태가 변경되었을 수 있음)
            const refreshedAudio = await this.audioRepository.findOne({ where: { id: audioEntity.id } });
            
            // 8. 응답 반환
            return this.mapToResponseDto(refreshedAudio || audioEntity);

        } catch (error) {
            this.logger.error(`업그레이드 STT 오디오 업로드 중 오류 발생: ${error.message}`, error.stack);

            // 임시 파일 정리
            try {
                if (file && file.path && fs.existsSync(file.path)) {
                    await this.unlinkAsync(file.path);
                }
            } catch (cleanupError) {
                this.logger.error(`임시 파일 삭제 중 오류: ${cleanupError.message}`);
            }

            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`업그레이드 STT 오디오 저장 실패: ${error.message}`);
        }
    }

    /**
     * 기존에 저장된 오디오의 STT 텍스트를 업그레이드합니다.
     * 
     * @param audioId 업그레이드할 오디오 ID
     * @param userId 사용자 ID
     * @returns 업그레이드된 STT 결과가 포함된 오디오 정보
     */
    async upgradeAudioStt(audioId: string, userId: string): Promise<AudioResponseDto> {
        try {
            // 1. 오디오 엔티티 조회
            const audioEntity = await this.audioRepository.findOne({ where: { id: audioId } });
            if (!audioEntity) {
                throw new BadRequestException(`오디오를 찾을 수 없습니다: ${audioId}`);
            }
            
            // 2. 권한 확인
            if (audioEntity.userId !== userId) {
                throw new BadRequestException('이 오디오에 대한 업그레이드 권한이 없습니다.');
            }
            
            // 3. 기존 STT 결과 확인
            if (!audioEntity.transcriptionText) {
                throw new BadRequestException('업그레이드할 STT 텍스트가 없습니다.');
            }
            
            // 4. 업그레이드 수행
            const upgradeResult = await this.sttUpgradeService.upgradeSttText(audioId, userId);
            
            // 5. 최신 정보로 엔티티 다시 조회
            const refreshedAudio = await this.audioRepository.findOne({ where: { id: audioId } });
            
            // 6. 응답 반환
            return this.mapToResponseDto(refreshedAudio || audioEntity);
            
        } catch (error) {
            this.logger.error(`STT 업그레이드 중 오류 발생: ${error.message}`, error.stack);
            
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`STT 업그레이드 실패: ${error.message}`);
        }
    }

    /**
     * 파일을 R2에 업로드합니다.
     * 
     * @param filePath 로컬 파일 경로
     * @param fileKey R2에 저장될 키(경로)
     * @param mimeType 파일의 MIME 타입
     * @returns 업로드 결과
     */
    private async uploadFileToR2(filePath: string, fileKey: string, mimeType: string = 'audio/webm'): Promise<any> {
        const fileStream = fs.createReadStream(filePath);
        const bucketName = this.configService.get('R2_BUCKET_NAME');

        // MIME 타입에서 기본 유형만 추출 (codecs 부분 제거)
        const cleanMimeType = mimeType.split(';')[0].trim();
        this.logger.log(`파일 MIME 타입: ${mimeType}, 정리된 타입: ${cleanMimeType}`);

        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: bucketName,
                Key: fileKey,
                Body: fileStream,
                ContentType: cleanMimeType,
            },
        });

        try {
            const result = await upload.done();
            return {
                ...result,
                Location: `https://${this.configService.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com/${bucketName}/${fileKey}`,
            };
        } catch (error) {
            this.logger.error(`R2 업로드 실패: ${error.message}`, error.stack);
            throw new Error(`R2 업로드 실패: ${error.message}`);
        }
    }
    
    /**
     * R2 오브젝트의 공개 URL을 생성합니다.
     * 
     * @param fileKey R2에 저장된 파일 키
     * @returns 공개 접근 가능한 URL
     */
    private generatePublicUrl(fileKey: string): string {
        const r2PublicUrl = this.configService.get('R2_PUBLIC_URL');

        // R2_PUBLIC_URL이 설정된 경우 (Cloudflare Workers 등으로 공개 접근 가능한 경우)
        if (r2PublicUrl) {
            // 슬래시가 중복되지 않도록 처리
            if (r2PublicUrl.endsWith('/')) {
                return `${r2PublicUrl}${fileKey}`;
            } else {
                return `${r2PublicUrl}/${fileKey}`;
            }
        }

        // 기본 R2 URL 형식 (버킷 이름은 URL에 포함하지 않음)
        const accountId = this.configService.get('R2_ACCOUNT_ID');
        return `https://${accountId}.r2.cloudflarestorage.com/${fileKey}`;
    }
    
    /**
     * 엔티티 객체를 응답 DTO로 변환합니다.
     * STT 업그레이드 필드를 포함하도록 수정
     * 
     * @param entity AudioEntity 객체
     * @returns AudioResponseDto 객체
     */
    private mapToResponseDto(entity: AudioEntity): AudioResponseDto {
        const responseDto = new AudioResponseDto();
        responseDto.id = entity.id;
        responseDto.title = entity.title;
        responseDto.audioUrl = entity.audioUrl;
        responseDto.userId = entity.userId;

        // STT 관련 필드 추가
        responseDto.transcriptionText = entity.transcriptionText;
        responseDto.transcriptionKey = entity.transcriptionKey;
        responseDto.transcriptionUrl = entity.transcriptionUrl;
        responseDto.duration = entity.duration;
        responseDto.language = entity.language;
        
        // STT 업그레이드 관련 필드 추가
        responseDto.upgradedText = entity.upgradedText;
        responseDto.upgradedTextKey = entity.upgradedTextKey;
        responseDto.upgradedTextUrl = entity.upgradedTextUrl;
        responseDto.isUpgraded = entity.isUpgraded;
        responseDto.upgradedAt = entity.upgradedAt;
        
        // 개선율 계산 (optional)
        if (entity.transcriptionText && entity.upgradedText) {
            responseDto.improvedPercentage = this.calculateImprovement(
                entity.transcriptionText, 
                entity.upgradedText
            );
        }

        // user 관계가 로드된 경우에만 user 정보 포함
        if (entity.user) {
            responseDto.user = {
                id: entity.user.id,
                email: entity.user.email,
                name: entity.user.name,
                firstName: entity.user.firstName,
                lastName: entity.user.lastName,
                profilePicture: entity.user.profilePicture,
                isEmailVerified: entity.user.isEmailVerified,
            };
        }

        return responseDto;
    }

    /**
     * 텍스트 개선율을 계산합니다.
     * 
     * @param originalText 원본 텍스트
     * @param upgradedText 업그레이드된 텍스트
     * @returns 개선율 (%)
     */
    private calculateImprovement(originalText: string, upgradedText: string): number {
        if (!originalText || !upgradedText) return 0;
        
        // 텍스트 정규화
        const normalizeText = (text: string) => {
            return text
                .replace(/\s+/g, ' ')
                .replace(/[.,;!?]+/g, '')
                .toLowerCase()
                .trim();
        };
        
        const normalizedOriginal = normalizeText(originalText);
        const normalizedUpgraded = normalizeText(upgradedText);
        
        // 변경된 문자 수 계산
        let changedChars = 0;
        const minLength = Math.min(normalizedOriginal.length, normalizedUpgraded.length);
        
        for (let i = 0; i < minLength; i++) {
            if (normalizedOriginal[i] !== normalizedUpgraded[i]) {
                changedChars++;
            }
        }
        
        // 길이 차이 반영
        changedChars += Math.abs(normalizedOriginal.length - normalizedUpgraded.length);
        
        // 변경률 계산 (최대 100%)
        const changePercentage = Math.min(
            100, 
            (changedChars / Math.max(normalizedOriginal.length, 1)) * 100
        );
        
        return Math.round(changePercentage * 10) / 10; // 소수점 한 자리까지
    }

    /**
     * MIME 타입을 기반으로 적절한 파일 확장자 반환
     */
    private getExtensionFromMimeType(mimeType: string): string {
        // MIME 타입에서 codecs 부분 제거
        const baseMimeType = mimeType.split(';')[0].trim();

        // MIME 타입별 확장자 매핑
        const mimeToExtension = {
            'audio/webm': '.webm',
            'audio/mp3': '.mp3',
            'audio/mpeg': '.mp3',
            'audio/wav': '.wav',
            'audio/x-wav': '.wav',
            'audio/ogg': '.ogg'
        };

        return mimeToExtension[baseMimeType] || '.audio';
    }
    /**
 * 오디오 정보를 조회합니다 (업그레이드된 STT 정보 포함).
 * 
 * @param audioId 조회할 오디오 ID
 * @param userId 사용자 ID (권한 확인용)
 * @returns 오디오 정보 (업그레이드된 STT 결과 포함)
 */
async findOneWithUpgradedStt(audioId: string, userId: string): Promise<AudioResponseDto> {
    const audio = await this.audioRepository.findOne({ 
      where: { id: audioId } 
    });
    
    if (!audio) {
      throw new NotFoundException(`오디오를 찾을 수 없습니다: ${audioId}`);
    }
    
    // 권한 확인 (해당 사용자의 오디오인지)
    if (audio.userId !== userId) {
      throw new BadRequestException('이 오디오에 대한 접근 권한이 없습니다.');
    }
    
    // DTO로 변환하여 반환
    return this.mapToResponseDto(audio);
  }
  // src/audio/audio.service.ts에 추가할 메서드들

// 특정 클래스에 오디오 추가
async addAudioToClass(audioId: string, classId: string, userId: string): Promise<AudioEntity> {
    // 오디오와 클래스가 모두 해당 사용자의 것인지 확인
    const audio = await this.audioRepository.findOne({ where: { id: audioId, userId } });
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found or does not belong to user`);
    }
  
    const classEntity = await this.classRepository.findOne({ where: { id: classId, userId } });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${classId} not found or does not belong to user`);
    }
  
    // 오디오에 클래스 ID 할당
    audio.classId = classId;
    return this.audioRepository.save(audio);
  }
  
  // 특정 클래스에서 오디오 제거 (클래스에서만 제거하고 오디오는 삭제하지 않음)
  async removeAudioFromClass(audioId: string, userId: string): Promise<AudioEntity> {
    const audio = await this.audioRepository.findOne({ where: { id: audioId, userId } });
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found or does not belong to user`);
    }
  
    audio.classId = null as any;
    return this.audioRepository.save(audio);
  }
  
  // 특정 클래스의 모든 오디오 조회
  async findAllAudiosByClass(classId: string, userId: string): Promise<AudioEntity[]> {
    // 클래스가 해당 사용자의 것인지 확인
    const classEntity = await this.classRepository.findOne({ where: { id: classId, userId } });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${classId} not found or does not belong to user`);
    }
  
    return this.audioRepository.find({
      where: { classId, userId },
      order: { createdAt: 'DESC' }
    });
  }
  
  // 클래스에 속하지 않은 모든 오디오 조회
  async findAllUnclassifiedAudios(userId: string): Promise<AudioEntity[]> {
    return this.audioRepository.find({
      where: { 
        userId,
        classId: IsNull() 
      },
      order: { createdAt: 'DESC' }
    });
  }
}