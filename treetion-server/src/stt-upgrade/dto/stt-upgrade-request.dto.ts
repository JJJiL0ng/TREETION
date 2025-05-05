// src/stt-upgrade/dto/stt-upgrade-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class SttUpgradeRequestDto {
  @ApiProperty({ description: '업그레이드할 STT가 포함된 오디오 ID' })
  @IsUUID()
  audioId: string;

  @ApiProperty({ description: '언어 코드 (기본값: ko)', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ description: '사용자 정의 프롬프트 템플릿', required: false })
  @IsOptional()
  @IsString()
  customPrompt?: string;
}