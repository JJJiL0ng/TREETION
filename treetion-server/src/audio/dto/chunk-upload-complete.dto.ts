// src/audio/dto/chunk-upload-complete.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChunkUploadCompleteDto {
  @ApiProperty({ description: '청크 업로드 세션 ID' })
  @IsNotEmpty()
  @IsString()
  uploadId: string;
}