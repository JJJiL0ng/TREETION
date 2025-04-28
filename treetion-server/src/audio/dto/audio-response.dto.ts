// src/audio/dto/audio-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AudioResponseDto {
  @ApiProperty({
    description: '업로드 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '파일 정보',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      filename: '1619433271893-recording.mp3',
      originalName: 'recording.mp3',
      path: 'uploads/audio/1619433271893-recording.mp3',
      size: 1048576,
      mimeType: 'audio/mp3',
      url: '/api/audio/1619433271893-recording.mp3',
      createdAt: '2023-04-26T12:34:56.789Z',
    },
  })
  file: {
    id: string;
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
    url: string;
    createdAt: string;
  };
}