import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SocialProvider } from './social-auth.dto';

/**
 * 코드 인증 DTO
 * 
 * 코드 인증 데이터를 표현하는 DTO
 * 
 * 
 */
export class CodeAuthDto {
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  redirectUri: string;
}