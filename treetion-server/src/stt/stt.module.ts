// src/stt/stt.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { STTService } from './stt.service';
import { STTController } from './stt.controller';
import { ClovaSTTProvider } from './providers/clova-stt.provider';

// 공통 엔티티 임포트
import { Transcription } from '../audio/entities/transcription.entity';
import { TranscriptionResult } from '../audio/entities/transcription-result.entity';
import { AudioFile } from '../audio/entities/audio-file.entity';
import { UsageStats } from '../audio/entities/usage-stats.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Transcription,
      TranscriptionResult,
      AudioFile,
      UsageStats,
    ]),
  ],
  controllers: [STTController],
  providers: [
    STTService,
    ClovaSTTProvider
  ],
  exports: [STTService],
})
export class SttModule {}