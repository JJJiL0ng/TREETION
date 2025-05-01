import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SttClovaService } from './stt-clova.service';
import { CreateSttClovumDto } from './dto/create-stt-clovum.dto';
import { UpdateSttClovumDto } from './dto/update-stt-clovum.dto';

@Controller('stt-clova')
export class SttClovaController {
  constructor(private readonly sttClovaService: SttClovaService) {}

  @Post()
  create(@Body() createSttClovumDto: CreateSttClovumDto) {
    return this.sttClovaService.create(createSttClovumDto);
  }

  @Get('stt/clova/:audioId')
  findAll(@Param('audioId') audioId: string) {
    
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sttClovaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSttClovumDto: UpdateSttClovumDto) {
    return this.sttClovaService.update(+id, updateSttClovumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sttClovaService.remove(+id);
  }
}
