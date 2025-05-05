// src/chat-gpt/chat-gpt.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatGptService } from './chat-gpt.service';

@Module({
  imports: [ConfigModule],
  providers: [ChatGptService],
  exports: [ChatGptService],
})
export class ChatGptModule {}