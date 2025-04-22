// src/audio/dto/waveform-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class WaveformQueryDto {
  @ApiPropertyOptional({ description: '반환할 데이터 포인트 수', default: 800, maximum: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(3000)
  points?: number = 800;
}