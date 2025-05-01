import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SttWhisperService } from './stt-whisper.service';

@Module({
  imports: [ConfigModule],
  providers: [SttWhisperService],
  exports: [SttWhisperService],
})
export class SttWhisperModule {}