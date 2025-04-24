// src/stt/dto/stt-request-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class STTRequestQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '오디오 파일 ID' })
  @IsOptional()
  @IsString()
  audioId?: string;

  @ApiPropertyOptional({ 
    description: '변환 상태', 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] 
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}