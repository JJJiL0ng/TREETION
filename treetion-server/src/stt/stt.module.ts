
import { Module } from '@nestjs/common';
import { SttService } from './stt.service';
import { SttController } from './stt.controller';
import { ChatGptService } from '../chat-gpt/chat-gpt.service';  

@Module({
  controllers: [SttController],
  providers: [SttService, ChatGptService],
  exports: [SttService] // SttService를 내보내도록 추가
})
export class SttModule {}
