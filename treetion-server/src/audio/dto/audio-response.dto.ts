import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../users/dto/user.dto';

export class AudioResponseDto {
    @ApiProperty({ description: '오디오 고유 ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    id: string;
    @ApiProperty({ description: '오디오 고유 ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    id: string;

    @ApiProperty({ description: 'R2에 저장된 오디오 파일 URL', example: 'https://your-bucket.r2.dev/audios/lecture-123.mp3' })
    audioUrl: string;
    @ApiProperty({ description: 'R2에 저장된 오디오 파일 URL', example: 'https://your-bucket.r2.dev/audios/lecture-123.mp3' })
    audioUrl: string;

    @ApiProperty({ description: '오디오 제목', example: '수학 1강 - 미적분 기초' })
    title: string;
    @ApiProperty({ description: '오디오 제목', example: '수학 1강 - 미적분 기초' })
    title: string;

    @ApiProperty({ type: UserDto, description: '오디오 소유자 정보' })
    user: UserDto;
    @ApiProperty({ type: UserDto, description: '오디오 소유자 정보' })
    user: UserDto;

    @ApiProperty({ description: '사용자 ID', example: 'b2c3d4e5-f6g7-8901-hijk-lm2345678901' })
    userId: string;

    @ApiProperty({ description: '오디오 파일의 텍스트 변환 결과', required: false })
    transcriptionText?: string;

    @ApiProperty({ description: '텍스트 변환 파일의 R2 스토리지 키', required: false })
    transcriptionKey?: string;

    @ApiProperty({ description: '텍스트 변환 파일의 공개 URL', required: false })
    transcriptionUrl?: string;

    @ApiProperty({ description: '오디오 파일의 길이(초)', required: false })
    duration?: number;

    @ApiProperty({ description: '오디오 파일의 언어', required: false })
    language?: string;
    
    // STT 업그레이드 관련 필드 추가
    @ApiProperty({ description: '업그레이드된 텍스트 변환 결과', required: false })
    upgradedText?: string;

    @ApiProperty({ description: '업그레이드된 텍스트 파일의 R2 스토리지 키', required: false })
    upgradedTextKey?: string;

    @ApiProperty({ description: '업그레이드된 텍스트 파일의 공개 URL', required: false })
    upgradedTextUrl?: string;

    @ApiProperty({ description: 'STT 텍스트 업그레이드 여부', required: false, default: false })
    isUpgraded?: boolean;

    @ApiProperty({ description: 'STT 텍스트 업그레이드 완료 시간', required: false })
    upgradedAt?: Date;

    @ApiProperty({ description: 'STT 텍스트 개선율 (%)', required: false })
    improvedPercentage?: number;
}