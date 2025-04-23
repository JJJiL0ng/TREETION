// src/audio/audio.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AudioService } from './audio.service';
import { AudioController } from './audio.controller';

import { AudioFile } from './entities/audio-file.entity';
import { ChunkUpload } from './entities/chunk-upload.entity';
import { UsageStats } from './entities/usage-stats.entity';
import { Transcription } from './entities/transcription.entity';
import { TranscriptionResult } from './entities/transcription-result.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      AudioFile,
      ChunkUpload,
      UsageStats,
      Transcription,
      TranscriptionResult,
    ]),
  ],
  providers: [AudioService],
  controllers: [AudioController], 
  exports: [AudioService],
})
export class AudioModule {}