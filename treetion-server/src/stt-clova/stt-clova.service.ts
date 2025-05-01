import { Injectable } from '@nestjs/common';
import { CreateSttClovumDto } from './dto/create-stt-clovum.dto';
import { UpdateSttClovumDto } from './dto/update-stt-clovum.dto';

@Injectable()
export class SttClovaService {
  create(createSttClovumDto: CreateSttClovumDto) {
    return 'This action adds a new sttClovum';
  }

  findAll() {
    return `This action returns all sttClova`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sttClovum`;
  }

  update(id: number, updateSttClovumDto: UpdateSttClovumDto) {
    return `This action updates a #${id} sttClovum`;
  }

  remove(id: number) {
    return `This action removes a #${id} sttClovum`;
  }
}
