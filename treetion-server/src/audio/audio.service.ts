import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import { CreateAudioDto } from './dto/create-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { AudioEntity } from './entities/audio.entity';
import { SttWhisperService, SttResult } from '../stt-whisper/stt-whisper.service';
import * as fs from 'fs';
import * as os from 'os';
import { promisify } from 'util';

@Injectable()
export class AudioService {
    private readonly logger = new Logger(AudioService.name);
    private readonly s3Client: S3;
    private readonly writeFileAsync = promisify(fs.writeFile);
    private readonly unlinkAsync = promisify(fs.unlink);

    constructor(
        @InjectRepository(AudioEntity)
        private readonly audioRepository: Repository<AudioEntity>,
        private readonly configService: ConfigService,
        private readonly sttWhisperService: SttWhisperService,
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
     * 1. 파일을 R2에 직접 업로드합니다.
     * 2. 메타데이터와 R2 URL을 Supabase에 저장합니다.
     * 3. 저장된 오디오 정보를 반환합니다.
     * 
     * @param file 업로드된 오디오 파일 (Multer에 의해 제공됨)
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

            // 2. R2에 파일 직접 업로드 (버퍼 사용)
            const uploadResult = await this.uploadBufferToR2(file.buffer, fileKey, file.mimetype);
            this.logger.log(`R2 업로드 완료: ${uploadResult.Location}`);

            // 3. 공개 URL 생성 (ConfigService에서 가져온 PUBLIC_URL 사용)
            const publicUrl = this.generatePublicUrl(fileKey);

            // 4. STT 서비스를 통해 오디오 변환
            let transcriptionResult: SttResult | null = null;
            try {
                // 버퍼를 임시 파일로 저장하고 STT 서비스에 전달
                const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}${fileExtension}`);
                await this.writeFileAsync(tempFilePath, file.buffer);
                
                // 임시 파일을 스트림으로 변환하여 STT 서비스에 전달
                const tempFile: Express.Multer.File = {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    encoding: file.encoding,
                    mimetype: file.mimetype,
                    size: file.size,
                    destination: path.dirname(tempFilePath),
                    filename: path.basename(tempFilePath),
                    path: tempFilePath,
                    buffer: file.buffer,
                    stream: null as any
                };
                
                transcriptionResult = await this.sttWhisperService.transcribeAudio(
                    tempFile,
                    userId,
                    createAudioDto.language || 'ko'
                );
                
                // 임시 파일 정리
                await this.unlinkAsync(tempFilePath);
                
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

            // 7. 응답 DTO 형식으로 변환하여 반환
            return this.mapToResponseDto(savedAudio);

        } catch (error) {
            this.logger.error(`오디오 업로드 중 오류 발생: ${error.message}`, error.stack);

            // 오류 유형에 따라 적절한 예외 발생
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`오디오 저장 실패: ${error.message}`);
        }
    }

    /**
     * 버퍼를 R2에 직접 업로드합니다.
     * 
     * @param buffer 파일 버퍼
     * @param fileKey R2에 저장될 키(경로)
     * @param mimeType 파일의 MIME 타입
     * @returns 업로드 결과
     */
    private async uploadBufferToR2(buffer: Buffer, fileKey: string, mimeType: string = 'audio/webm'): Promise<any> {
        const bucketName = this.configService.get('R2_BUCKET_NAME');

        // MIME 타입에서 기본 유형만 추출 (codecs 부분 제거)
        const cleanMimeType = mimeType.split(';')[0].trim();
        this.logger.log(`파일 MIME 타입: ${mimeType}, 정리된 타입: ${cleanMimeType}`);

        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: bucketName,
                Key: fileKey,
                Body: buffer,
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
}