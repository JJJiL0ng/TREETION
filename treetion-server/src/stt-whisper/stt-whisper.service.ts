import { Injectable } from '@nestjs/common';
import { CreateSttWhisperDto } from './dto/create-stt-whisper.dto';
import { UpdateSttWhisperDto } from './dto/update-stt-whisper.dto';

@Injectable()
export class SttWhisperService {
  create(createSttWhisperDto: CreateSttWhisperDto) {
    return 'This action adds a new sttWhisper';
  }

  findAll() {
    return `This action returns all sttWhisper`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sttWhisper`;
  }

  update(id: number, updateSttWhisperDto: UpdateSttWhisperDto) {
    return `This action updates a #${id} sttWhisper`;
  }

  remove(id: number) {
    return `This action removes a #${id} sttWhisper`;
  }
}
