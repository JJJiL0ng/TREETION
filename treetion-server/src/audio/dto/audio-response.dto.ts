import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../users/dto/user.dto';

export class AudioResponseDto {
  @ApiProperty({ description: '오디오 고유 ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'R2에 저장된 오디오 파일 URL', example: 'https://your-bucket.r2.dev/audios/lecture-123.mp3' })
  audioUrl: string;

  @ApiProperty({ description: '오디오 제목', example: '수학 1강 - 미적분 기초' })
  title: string;

  @ApiProperty({ type: UserDto, description: '오디오 소유자 정보' })
  user: UserDto;

  @ApiProperty({ description: '사용자 ID', example: 'b2c3d4e5-f6g7-8901-hijk-lm2345678901' })
  userId: string;
}