// src/stt/dto/stt-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class STTResponseDto {
  @ApiProperty({ description: '변환 작업 ID' })
  transcriptionId: string;

  @ApiProperty({ 
    description: '변환 상태', 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] 
  })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  @ApiProperty({ description: '변환 진행률 (0-1)', minimum: 0, maximum: 1 })
  progress: number;

  @ApiProperty({ description: '오디오 파일 ID' })
  audioId: string;

  @ApiProperty({ description: '작업 생성 시간' })
  createdAt: Date;

  @ApiProperty({ description: '작업 시작 시간', required: false })
  startedAt?: Date;

  @ApiProperty({ description: '작업 완료 시간', required: false })
  completedAt?: Date;
}