import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SttWhisperService } from './stt-whisper.service';
import { CreateSttWhisperDto } from './dto/create-stt-whisper.dto';
import { UpdateSttWhisperDto } from './dto/update-stt-whisper.dto';

@Controller('stt-whisper')
export class SttWhisperController {
  constructor(private readonly sttWhisperService: SttWhisperService) {}

  @Post()
  create(@Body() createSttWhisperDto: CreateSttWhisperDto) {
    return this.sttWhisperService.create(createSttWhisperDto);
  }

  @Get()
  findAll() {
    return this.sttWhisperService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sttWhisperService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSttWhisperDto: UpdateSttWhisperDto) {
    return this.sttWhisperService.update(+id, updateSttWhisperDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sttWhisperService.remove(+id);
  }
}
