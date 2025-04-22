// src/audio/dto/audio-file-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AudioFileQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: '정렬 기준', enum: ['createdAt', 'fileSize', 'duration'] })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'fileSize', 'duration'])
  sort?: string = 'createdAt';

  @ApiPropertyOptional({ description: '정렬 방향', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: string = 'desc';

  @ApiPropertyOptional({ description: '검색어 (제목, 설명, 태그)' })
  @IsOptional()
  @IsString()
  search?: string;
}