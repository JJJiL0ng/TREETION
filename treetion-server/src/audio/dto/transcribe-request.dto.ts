// src/audio/dto/transcribe-request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class TranscriptionOptionsDto {
  @ApiPropertyOptional({ description: '문장 부호 포함 여부', default: true })
  @IsOptional()
  @IsBoolean()
  punctuation?: boolean = true;
  
  @ApiPropertyOptional({ description: '문단 분리 여부', default: true })
  @IsOptional()
  @IsBoolean()
  paragraphs?: boolean = true;
  
  @ApiPropertyOptional({ description: '타임스탬프 포함 여부', default: true })
  @IsOptional()
  @IsBoolean()
  timestamps?: boolean = true;
}

export class TranscribeRequestDto {
  @ApiProperty({ description: '오디오 파일 ID' })
  @IsNotEmpty()
  @IsString()
  audioId: string;
  
  @ApiProperty({ description: '변환 언어', default: 'ko' })
  @IsOptional()
  @IsString()
  language?: string = 'ko';
  
  @ApiPropertyOptional({ description: '변환 옵션', type: TranscriptionOptionsDto })
  @IsOptional()
  @IsObject()
  options?: TranscriptionOptionsDto;
}