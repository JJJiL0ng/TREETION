// 오디오 업로드 시 사용되는 DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray, IsUUID } from 'class-validator';

export class CreateAudioDto {
  @ApiProperty({ description: '오디오 제목', example: '수학 1강 - 미적분 기초' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '녹음 날짜', example: '2025-04-29T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  recordedAt: string;
  
  @ApiProperty({ 
    description: '오디오 언어 코드 (기본값: ko)', 
    required: false,
    example: 'ko' 
  })
  @IsOptional()
  @IsString()
  language?: string;
}