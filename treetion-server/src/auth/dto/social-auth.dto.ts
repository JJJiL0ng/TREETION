// src/auth/dto/social-auth.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SocialProvider {
  GOOGLE = 'google',
  KAKAO = 'kakao',
  NAVER = 'naver',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
}

export class SocialAuthDto {
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsOptional()
  idToken?: string; // Google 등 일부 공급자는 ID 토큰도 제공
}

