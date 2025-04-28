// src/audio/audio.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { Audio } from './entities/audio.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audio]),
    ConfigModule,
    StorageModule,
    MulterModule.register({
      // 파일 필터링 설정
      fileFilter: (req, file, callback) => {
        // 지원되는 오디오 포맷 필터링
        const allowedMimeTypes = [
          'audio/mp3',
          'audio/mpeg',
          'audio/wav',
          'audio/webm',
          'audio/ogg',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error(`지원되지 않는 파일 형식: ${file.mimetype}`), false);
        }
      },
      // 파일 크기 제한 (30MB)
      limits: {
        fileSize: 30 * 1024 * 1024, // 30MB
      },
      // 메모리에 저장 (스토리지 서비스로 전달할 것이므로 디스크에 저장하지 않음)
      storage: diskStorage({
        destination: (req, file, callback) => {
          callback(null, '/tmp');  // 임시 저장 위치
        },
        filename: (req, file, callback) => {
          // 파일명 생성
          const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  ],
  controllers: [AudioController],
  providers: [AudioService],
  exports: [AudioService],
})
export class AudioModule {}