// src/audio/dto/responses/audio-upload-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AudioUploadResponseDto {
  @ApiProperty({ description: '업로드 성공 여부' })
  status: boolean;
  
  @ApiProperty({
    description: '업로드된 오디오 파일 정보',
    type: 'object',
    properties: {
      audioId: { type: 'string', example: 'audio_uuid' },
      fileName: { type: 'string', example: 'recorded_lecture.mp3' },
      fileSize: { type: 'number', example: 15482752 },
      duration: { type: 'number', example: 3720 },
      createdAt: { type: 'string', format: 'date-time', example: '2025-04-21T10:30:45Z' },
      url: { type: 'string', example: '/audio/files/audio_uuid' }
    }
  })
  data: {
    audioId: string;
    fileName: string;
    fileSize: number;
    duration: number;
    createdAt: string;
    url: string;
  };
}