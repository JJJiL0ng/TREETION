// src/auth/dto/social-profile.dto.ts
import { SocialProvider } from './social-auth.dto';

/**
 * 소셜 프로필 DTO
 * 
 * 소셜 프로필 데이터를 표현하는 DTO
 * 
 * 
 */
export class SocialProfileDto {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    provider: SocialProvider;
    providerId: string;
    raw?: any; // 원본 응답 데이터 저장 (필요에 따라 사용)
  }