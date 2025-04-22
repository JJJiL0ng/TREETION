// src/audio/dto/audio-upload.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class AudioUploadDto {
  @ApiProperty({ description: '오디오 파일 제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '오디오 파일 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '오디오 파일 태그 (콤마로 구분)' })
  @IsOptional()
  @IsArray()
  tags?: string[];
}