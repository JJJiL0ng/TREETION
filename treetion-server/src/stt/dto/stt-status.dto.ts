// src/stt/dto/stt-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class STTProviderStatusDto {
  @ApiProperty({ description: 'STT 공급자명' })
  provider: string;

  @ApiProperty({ description: '상태', enum: ['active', 'inactive', 'maintenance'] })
  status: 'active' | 'inactive' | 'maintenance';

  @ApiProperty({ description: '상태 확인 성공 여부' })
  healthCheck: boolean;
}

