// src/audio/dto/update-audio.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAudioDto {
  @ApiProperty({
    description: '오디오 파일 제목',
    example: '인터뷰 녹음 수정',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '오디오 파일 타입',
    example: 'Mp3',
    required: false,
  })
  @IsOptional()
  @IsString()
  audioFileType?: string;
}