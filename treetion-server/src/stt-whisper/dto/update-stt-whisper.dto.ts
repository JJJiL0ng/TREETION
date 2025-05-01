import { PartialType } from '@nestjs/swagger';
import { CreateSttWhisperDto } from './create-stt-whisper.dto';

export class UpdateSttWhisperDto extends PartialType(CreateSttWhisperDto) {}
