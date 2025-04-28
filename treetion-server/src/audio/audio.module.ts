import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid'; // uuid 라이브러리 import
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { Audio } from './entities/audio.entity';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    TypeOrmModule.forFeature([Audio]),
    ConfigModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/audio',
        filename: (req, file, callback) => {
          // UUID를 사용하여 고유한 파일명 생성
          const uuid = uuidv4();
          const ext = extname(file.originalname);
          callback(null, `${uuid}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [AudioController],
  providers: [AudioService],
})
export class AudioModule {}