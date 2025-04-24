// src/stt/dto/stt-result.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class STTWordDto {
  @ApiProperty({ description: '단어 텍스트' })
  text: string;

  @ApiProperty({ description: '시작 시간(초)' })
  start: number;

  @ApiProperty({ description: '종료 시간(초)' })
  end: number;

  @ApiProperty({ description: '신뢰도', minimum: 0, maximum: 1 })
  confidence: number;
}

export class STTSegmentDto {
  @ApiProperty({ description: '세그먼트 ID' })
  id: string;

  @ApiProperty({ description: '세그먼트 텍스트' })
  text: string;

  @ApiProperty({ description: '시작 시간(초)' })
  start: number;

  @ApiProperty({ description: '종료 시간(초)' })
  end: number;

  @ApiProperty({ description: '신뢰도', minimum: 0, maximum: 1 })
  confidence: number;

  @ApiPropertyOptional({ description: '화자 ID', required: false })
  speaker?: string;

  @ApiPropertyOptional({ description: '단어 정보', type: [STTWordDto], required: false })
  words?: STTWordDto[];
}

export class STTParagraphDto {
  @ApiProperty({ description: '문단 ID' })
  id: string;

  @ApiProperty({ description: '세그먼트 ID 목록' })
  segments: string[];

  @ApiProperty({ description: '시작 시간(초)' })
  start: number;

  @ApiProperty({ description: '종료 시간(초)' })
  end: number;
}

export class STTMetadataDto {
  @ApiProperty({ description: '단어 수' })
  wordCount: number;

  @ApiProperty({ description: '오디오 길이(초)' })
  duration: number;

  @ApiProperty({ description: '생성 시간' })
  createdAt: Date;

  @ApiProperty({ description: '완료 시간' })
  completedAt: Date;
}

export class STTResultDto {
  @ApiProperty({ description: '트랜스크립션 ID' })
  transcriptionId: string;

  @ApiProperty({ description: '오디오 파일 ID' })
  audioId: string;

  @ApiProperty({ description: '언어' })
  language: string;

  @ApiProperty({ description: '전체 텍스트' })
  text: string;

  @ApiProperty({ description: '세그먼트 목록', type: [STTSegmentDto] })
  segments: STTSegmentDto[];

  @ApiProperty({ description: '문단 목록', type: [STTParagraphDto] })
  paragraphs: STTParagraphDto[];

  @ApiProperty({ description: '메타데이터', type: STTMetadataDto })
  metadata: STTMetadataDto;
}