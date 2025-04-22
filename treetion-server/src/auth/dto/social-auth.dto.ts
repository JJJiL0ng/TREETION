// src/auth/dto/social-auth.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 소셜 인증 공급자
 * 
 * 소셜 인증 공급자를 나타내는 열거형
 * 
 * 
 */
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

