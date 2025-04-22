// src/audio/dto/usage-stats-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UsageStatsQueryDto {
  @ApiPropertyOptional({ description: '기간', enum: ['day', 'week', 'month', 'year'], default: 'month' })
  @IsOptional()
  @IsString()
  @IsIn(['day', 'week', 'month', 'year'])
  period?: string = 'month';
}
