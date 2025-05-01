// 오디오 업로드 시 사용되는 DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray, IsUUID } from 'class-validator';

export class CreateAudioDto {
  // audioFile 필드 제거 - 파일은 FileInterceptor에 의해 처리됨

  @ApiProperty({ description: '오디오 제목', example: '수학 1강 - 미적분 기초' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '녹음 날짜', example: '2025-04-29T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  recordedAt: string;
}