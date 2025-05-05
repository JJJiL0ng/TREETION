// src/class/class.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { ClassEntity } from './entities/class.entity';
import { AudioEntity } from '../audio/entities/audio.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassEntity, AudioEntity]),
    AuthModule,
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}