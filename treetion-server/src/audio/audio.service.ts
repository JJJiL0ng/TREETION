// src/audio/audio.service.ts
import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { plainToClass } from 'class-transformer';
import * as path from 'path';

import { CreateAudioDto } from './dto/create-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { Audio } from './entities/audio.entity';
import { AudioDto } from './dto/audio.dto';
import { UpdateAudioDto } from './dto/update-audio.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AudioService {
    private readonly logger = new Logger(AudioService.name);

    constructor(
        @InjectRepository(Audio)
        private readonly audioRepository: Repository<Audio>,
        private configService: ConfigService,
        private storageService: StorageService,
        private dataSource: DataSource
    ) {}

    async createAudio(
        file: Express.Multer.File,
        createAudioDto: CreateAudioDto,
    ): Promise<AudioResponseDto> {
        // 파일 검증
        if (!file || !file.buffer) {
            throw new BadRequestException('유효한 파일이 제공되지 않았습니다');
        }

        // 지원되는 오디오 형식 검증
        const supportedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'];
        if (!supportedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(`지원되지 않는 파일 형식입니다: ${file.mimetype}. 지원되는 형식: ${supportedMimeTypes.join(', ')}`);
        }

        // 파일 크기 제한 (30MB)
        const maxSize = 30 * 1024 * 1024; // 30MB in bytes
        if (file.size > maxSize) {
            throw new BadRequestException(`파일 크기가 너무 큽니다. 최대 30MB까지 업로드 가능합니다.`);
        }

        // 트랜잭션 시작
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. 파일명 생성 (항상 .mp3 확장자 사용)
            const fileName = `${uuidv4()}.mp3`;
            this.logger.debug(`생성된 파일명: ${fileName}`);

            // 2. mimeType 설정 (MP3로 취급)
            const mp3MimeType = 'audio/mp3';
            
            // 3. Cloudflare R2에 파일 업로드 
            const uploadResult = await this.storageService.uploadFile(
                'audio', // 버킷 또는 폴더 이름
                fileName, 
                file.buffer, 
                mp3MimeType
            );

            if (!uploadResult.success) {
                throw new InternalServerErrorException(`파일 업로드 실패: ${uploadResult.error}`);
            }

            // 4. 파일의 공개 URL 가져오기
            const publicUrl = this.storageService.getPublicUrl('audio', fileName);

            if (!publicUrl) {
                throw new InternalServerErrorException('공개 URL을 생성할 수 없습니다.');
            }

            // 5. 엔티티 생성
            const audioEntity = this.audioRepository.create({
                filename: fileName,
                originalName: `${path.parse(file.originalname).name}.mp3`, // 원본 파일명 + mp3 확장자
                path: `audio/${fileName}`, // 스토리지 경로
                size: file.size, // 원본 파일 크기 사용
                mimeType: mp3MimeType, // MP3 MIME 타입으로 저장
                url: publicUrl,
                title: createAudioDto.title || path.parse(file.originalname).name, // title이 없으면 원본 파일명 사용
                audioFileType: 'mp3', // 항상 MP3 타입으로 저장
                userId: createAudioDto.user.id,
            });

            // 6. DB에 저장
            const audioRepository = queryRunner.manager.getRepository(Audio);
            const savedAudio = await audioRepository.save(audioEntity);
            
            // 7. 트랜잭션 커밋
            await queryRunner.commitTransaction();

            // 8. DTO로 변환
            const audioDto = plainToClass(AudioDto, savedAudio, {
                excludeExtraneousValues: true
            });

            // 9. 응답 객체 반환
            return {
                success: true,
                file: {
                    id: audioDto.id,
                    filename: audioDto.filename,
                    originalName: audioDto.originalName,
                    path: audioDto.path,
                    size: audioDto.size,
                    mimeType: audioDto.mimeType,
                    url: audioDto.url,
                    createdAt: audioDto.createdAt.toISOString(),
                },
            };
        } catch (error) {
            // 오류 발생 시 트랜잭션 롤백
            await queryRunner.rollbackTransaction();
            
            // 이미 업로드된 파일이 있다면 삭제 시도
            try {
                if (error.message.includes('DB에 저장')) {
                    const fileName = error.fileName;
                    if (fileName) {
                        await this.storageService.deleteFile('audio', fileName);
                        this.logger.warn(`롤백: 파일 삭제 ${fileName}`);
                    }
                }
            } catch (deleteError) {
                this.logger.error(`롤백 중 파일 삭제 실패: ${deleteError.message}`);
            }

            this.logger.error(`오디오 파일 처리 오류: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`오디오 파일 처리 중 오류 발생: ${error.message}`);
        } finally {
            // 항상 쿼리 러너 해제
            await queryRunner.release();
        }
    }

    async findAll(userId: string): Promise<AudioDto[]> {
        try {
            const audios = await this.audioRepository.find({
                where: { userId },
                order: { createdAt: 'DESC' },
            });

            return audios.map(audio => plainToClass(AudioDto, audio, {
                excludeExtraneousValues: true
            }));
        } catch (error) {
            this.logger.error(`오디오 목록 조회 오류: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`오디오 목록 조회 중 오류 발생: ${error.message}`);
        }
    }

    async findOne(id: string, userId: string): Promise<AudioDto> {
        try {
            const audio = await this.audioRepository.findOne({
                where: { id, userId },
            });

            if (!audio) {
                throw new NotFoundException(`ID가 ${id}인 오디오를 찾을 수 없습니다`);
            }

            return plainToClass(AudioDto, audio, {
                excludeExtraneousValues: true
            });
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`오디오 조회 오류: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`오디오 조회 중 오류 발생: ${error.message}`);
        }
    }

    async update(id: string, userId: string, updateAudioDto: UpdateAudioDto): Promise<AudioDto> {
        try {
            const audio = await this.audioRepository.findOne({
                where: { id, userId },
            });

            if (!audio) {
                throw new NotFoundException(`ID가 ${id}인 오디오를 찾을 수 없습니다`);
            }

            // 업데이트할 수 있는 필드만 선택적으로 업데이트
            if (updateAudioDto.title) audio.title = updateAudioDto.title;

            const updatedAudio = await this.audioRepository.save(audio);

            return plainToClass(AudioDto, updatedAudio, {
                excludeExtraneousValues: true
            });
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`오디오 업데이트 오류: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`오디오 업데이트 중 오류 발생: ${error.message}`);
        }
    }

    async remove(id: string, userId: string): Promise<boolean> {
        // 트랜잭션 시작
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. 오디오 엔티티 조회
            const audioRepository = queryRunner.manager.getRepository(Audio);
            const audio = await audioRepository.findOne({
                where: { id, userId },
            });

            if (!audio) {
                throw new NotFoundException(`ID가 ${id}인 오디오를 찾을 수 없습니다`);
            }

            // 2. 파일 이름 추출 (경로에서)
            const fileName = path.basename(audio.path);

            // 3. Cloudflare R2에서 파일 삭제
            const deleteResult = await this.storageService.deleteFile('audio', fileName);
            
            if (!deleteResult.success) {
                throw new InternalServerErrorException(`파일 삭제 실패: ${deleteResult.error}`);
            }

            // 4. DB에서 레코드 삭제
            await audioRepository.remove(audio);

            // 5. 트랜잭션 커밋
            await queryRunner.commitTransaction();

            return true;
        } catch (error) {
            // 오류 발생 시 트랜잭션 롤백
            await queryRunner.rollbackTransaction();
            
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`오디오 삭제 오류: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`오디오 삭제 중 오류 발생: ${error.message}`);
        } finally {
            // 항상 쿼리 러너 해제
            await queryRunner.release();
        }
    }
}