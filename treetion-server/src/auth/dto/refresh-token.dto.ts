// src/auth/dto/refresh-token.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 리프레시 토큰 DTO
 * 
 * 리프레시 토큰 데이터를 표현하는 DTO
 * 
 * 
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}