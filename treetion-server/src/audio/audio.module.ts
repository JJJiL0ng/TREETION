import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { AudioEntity } from './entities/audio.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { SttWhisperModule } from '../stt-whisper/stt-whisper.module';
import { SttUpgradeModule } from '../stt-upgrade/stt-upgrade.module';
import { SttModule } from '../stt/stt.module';
// 업로드 디렉토리 확인 및 생성
const uploadDir = join(process.cwd(), 'uploads/temp');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}
@Module({
  imports: [
    // Multer 설정
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          // 파일명 처리는 컨트롤러에서 담당
          cb(null, file.originalname);
        },
      }),
    }),
    // TypeORM 엔티티 등록
    TypeOrmModule.forFeature([AudioEntity]),
    // 환경 변수 사용을 위한 ConfigModule
    ConfigModule,
    SttWhisperModule,
    SttUpgradeModule,
    SttModule // SttModule을 imports 배열에 추가
  ],
  controllers: [AudioController],
  providers: [AudioService],
  exports: [AudioService, SttWhisperModule, SttUpgradeModule, SttModule],
})
export class AudioModule {}