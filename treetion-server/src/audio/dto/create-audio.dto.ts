import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray, IsUUID, Matches } from 'class-validator';

export class CreateAudioDto {
  @ApiProperty({ description: '오디오 파일', example: 'example.webm', format: 'binary' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\.webm$/, { message: '오디오 파일은 .webm 형식이어야 합니다.' })
  audioFile: string; // 파일은 Express.Multer.File 타입으로 처리됩니다

  @ApiProperty({ description: '오디오 제목', example: '수학 1강 - 미적분 기초' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '녹음 날짜', example: '2025-04-29T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  recordedAt: string;

  @ApiProperty({ description: '사용자 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}