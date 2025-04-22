// src/audio/dto/audio-update.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class AudioUpdateDto {
  @ApiPropertyOptional({ description: '오디오 파일 제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '오디오 파일 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '오디오 파일 태그' })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
