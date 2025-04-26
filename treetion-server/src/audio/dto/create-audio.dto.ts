// create-audio.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UserDto } from 'src/users/dto/user.dto';

export class CreateAudioDto {

  @ApiProperty({
    description: '오디오 파일 제목',
    example: '인터뷰 녹음',
    required: true,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '오디오 파일 타입',
    example: 'webm',
    required: true,
  })
  @IsString()
  audioFileType: string;

  @ApiProperty({
    description: 'user id',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsString()
  user: UserDto;
}
