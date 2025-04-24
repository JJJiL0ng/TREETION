// src/stt/dto/stt-request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class STTRequestDto {
  @ApiPropertyOptional({ description: '변환 언어', default: 'ko' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: '문장 부호 포함 여부', default: true })
  @IsOptional()
  @IsBoolean()
  punctuation?: boolean;

  @ApiPropertyOptional({ description: '문단 분리 여부', default: true })
  @IsOptional()
  @IsBoolean()
  paragraphs?: boolean;

  @ApiPropertyOptional({ description: '타임스탬프 포함 여부', default: true })
  @IsOptional()
  @IsBoolean()
  timestamps?: boolean;

  @ApiPropertyOptional({ description: '단어별 신뢰도 포함 여부', default: false })
  @IsOptional()
  @IsBoolean()
  wordConfidence?: boolean;

  @ApiPropertyOptional({ description: '화자 분리 여부', default: false })
  @IsOptional()
  @IsBoolean()
  speakerLabels?: boolean;
}
