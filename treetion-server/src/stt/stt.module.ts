import { Module } from '@nestjs/common';
import { SttService } from './stt.service';
import { SttController } from './stt.controller';

@Module({
  providers: [SttService],
  controllers: [SttController]
})
export class SttModule {}
