import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SocialProvider } from './social-auth.dto';

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