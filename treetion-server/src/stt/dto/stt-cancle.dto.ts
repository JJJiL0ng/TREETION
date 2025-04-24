// src/stt/dto/stt-cancel.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class STTCancelResponseDto {
  @ApiProperty({ description: '메시지' })
  message: string;

  @ApiProperty({ description: '트랜스크립션 ID' })
  transcriptionId: string;
}