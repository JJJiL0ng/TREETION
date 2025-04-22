// src/audio/dto/chunk-upload.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChunkUploadDto {
  @ApiProperty({ description: '청크 업로드 세션 ID' })
  @IsNotEmpty()
  @IsString()
  uploadId: string;

  @ApiProperty({ description: '청크 번호 (0부터 시작)' })
  @IsNotEmpty()
  @IsNumber()
  chunkNumber: number;
  
  // 'chunk' 파일은 multipart/form-data로 전송되므로 여기서는 정의하지 않음
}