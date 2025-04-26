import { Module } from '@nestjs/common';
import { SttWhisperService } from './stt-whisper.service';
import { SttWhisperController } from './stt-whisper.controller';

@Module({
  controllers: [SttWhisperController],
  providers: [SttWhisperService],
})
export class SttWhisperModule {}
