// src/audio/dto/chunk-upload-init.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class ChunkUploadInitDto {
  @ApiProperty({ description: '파일 이름' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({ description: '파일 크기 (바이트)' })
  @IsNotEmpty()
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: '파일 MIME 타입' })
  @IsNotEmpty()
  @IsString()
  mimeType: string;

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