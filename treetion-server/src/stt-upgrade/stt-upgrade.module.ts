// src/stt-upgrade/stt-upgrade.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SttUpgradeService } from './stt-upgrade.service';
import { SttUpgradeController } from './stt-upgrade.controller';
import { AudioEntity } from '../audio/entities/audio.entity';
import { ChatGptService } from '../chat-gpt/chat-gpt.service';
import { ChatGptModule } from '../chat-gpt/chat-gpt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioEntity]),
    ConfigModule,
    ChatGptModule,
  ],
  controllers: [SttUpgradeController],
  providers: [SttUpgradeService],
  exports: [SttUpgradeService],
})
export class SttUpgradeModule {}