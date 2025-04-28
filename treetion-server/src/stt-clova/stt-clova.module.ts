import { Module } from '@nestjs/common';
import { SttClovaService } from './stt-clova.service';
import { SttClovaController } from './stt-clova.controller';

@Module({
  controllers: [SttClovaController],
  providers: [SttClovaService],
})
export class SttClovaModule {}
