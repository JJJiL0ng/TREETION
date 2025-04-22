// src/audio/dto/audio-stream-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AudioStreamQueryDto {
  @ApiPropertyOptional({ description: '시작 시간(초)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  start?: number;
  
  @ApiPropertyOptional({ description: '종료 시간(초)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  end?: number;
  
  @ApiPropertyOptional({ description: '오디오 품질', enum: ['high', 'medium', 'low'] })
  @IsOptional()
  @IsString()
  @IsIn(['high', 'medium', 'low'])
  quality?: string;
}