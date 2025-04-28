// src/audio/audio.service.ts
import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { plainToClass } from 'class-transformer';

import { CreateAudioDto } from './dto/create-audio.dto';
import { AudioResponseDto } from './dto/audio-response.dto';
import { Audio } from './entities/audio.entity';
import { AudioDto } from './dto/audio.dto';
import * as path from 'path';

@Injectable()
export class AudioService {
    private supabase;

    constructor(
        @InjectRepository(Audio)
        private readonly audioRepository: Repository<Audio>,
        private configService: ConfigService,
    ) {
        // Supabase 클라이언트 초기화 - 환경변수 이름 확인 필요
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async createAudio(
        file: Express.Multer.File,
        createAudioDto: CreateAudioDto,
    ): Promise<AudioResponseDto> {
        try {
            console.log('createAudio 호출됨:', { 
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                bufferExists: !!file.buffer,
                bufferLength: file.buffer?.length
            });

            // 파일 검증
            if (!file || !file.buffer) {
                throw new BadRequestException('유효한 파일이 제공되지 않았습니다');
            }

            // 1. 파일명 생성 (항상 .mp3 확장자 사용)
            const fileName = `${uuidv4()}.mp3`;
            console.log('생성된 파일명:', fileName);

            // 2. mimeType 설정 (MP3로 취급, 변환 대신 메타데이터만 수정)
            const mp3MimeType = 'audio/mp3';
            
            // 3. Supabase Storage에 파일 업로드 (원본 그대로 업로드하지만 MP3로 취급)
            console.log('Supabase Storage 업로드 시작');
            const { data, error } = await this.supabase
                .storage
                .from('audio')
                .upload(fileName, file.buffer, {
                    contentType: mp3MimeType, // MP3 MIME 타입으로 설정
                });

            console.log('Supabase 업로드 결과:', data);
            
            if (error) {
                console.error('Supabase 업로드 오류:', error);
                throw new InternalServerErrorException(`Supabase Storage 업로드 실패: ${error.message}`);
            }

            // 4. 파일의 공개 URL 가져오기
            const urlData = this.supabase
                .storage
                .from('audio')
                .getPublicUrl(fileName);

            console.log('URL Data:', urlData);
            const publicUrl = urlData.data.publicUrl;

            if (!publicUrl) {
                throw new InternalServerErrorException('공개 URL을 생성할 수 없습니다.');
            }

            // 5. 엔티티 생성 및 저장
            const audioEntity = this.audioRepository.create({
                filename: fileName,
                originalName: `${path.parse(file.originalname).name}.mp3`, // 원본 파일명 + mp3 확장자
                path: data.path,
                size: file.size, // 원본 파일 크기 사용
                mimeType: mp3MimeType, // MP3 MIME 타입으로 저장
                url: publicUrl,
                title: createAudioDto.title || path.parse(file.originalname).name, // title이 없으면 원본 파일명 사용
                audioFileType: 'mp3', // 항상 MP3 타입으로 저장
                userId: createAudioDto.user.id,
            });

            console.log('저장할 엔티티:', audioEntity);

            // 6. DB에 저장
            const savedAudio = await this.audioRepository.save(audioEntity);
            console.log('DB에 저장된 오디오:', savedAudio);

            // 7. DTO로 변환
            const audioDto = plainToClass(AudioDto, savedAudio, {
                excludeExtraneousValues: true
            });

            // 8. 응답 객체 반환
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
            console.error('오디오 파일 처리 오류:', error);
            throw new InternalServerErrorException(`오디오 파일 처리 중 오류 발생: ${error.message}`);
        }
    }

    async findAll(userId: string): Promise<AudioDto[]> {
        const audios = await this.audioRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });

        return audios.map(audio => plainToClass(AudioDto, audio, {
            excludeExtraneousValues: true
        }));
    }

    async findOne(id: string, userId: string): Promise<AudioDto> {
        const audio = await this.audioRepository.findOne({
            where: { id, userId },
        });

        if (!audio) {
            throw new Error('오디오를 찾을 수 없습니다');
        }

        return plainToClass(AudioDto, audio, {
            excludeExtraneousValues: true
        });
    }

    async update(id: string, userId: string, updateData: Partial<Audio>): Promise<AudioDto> {
        const audio = await this.audioRepository.findOne({
            where: { id, userId },
        });

        if (!audio) {
            throw new Error('오디오를 찾을 수 없습니다');
        }

        // 업데이트할 수 있는 필드만 선택적으로 업데이트
        if (updateData.title) audio.title = updateData.title;
        // audioFileType은 항상 'mp3'로 고정되므로 업데이트하지 않음

        const updatedAudio = await this.audioRepository.save(audio);

        return plainToClass(AudioDto, updatedAudio, {
            excludeExtraneousValues: true
        });
    }

    async remove(id: string, userId: string): Promise<boolean> {
        const audio = await this.audioRepository.findOne({
            where: { id, userId },
        });

        if (!audio) {
            throw new Error('오디오를 찾을 수 없습니다');
        }

        // 1. Supabase Storage에서 파일 삭제
        const { error } = await this.supabase
            .storage
            .from('audio')
            .remove([audio.path]);

        if (error) {
            throw new InternalServerErrorException(`Supabase Storage 파일 삭제 실패: ${error.message}`);
        }

        // 2. DB에서 레코드 삭제
        await this.audioRepository.remove(audio);

        return true;
    }
}