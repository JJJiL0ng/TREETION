
// src/auth/dto/auth-response.dto.ts
import { Expose, Exclude } from 'class-transformer';
import { UserDto } from '../../users/dto/user.dto';

@Exclude()
/**
 * 인증 응답 DTO
 * 
 * 인증 응답 데이터를 표현하는 DTO
 * 
 * 
 */
export class AuthResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  expiresIn: number;

  @Expose()
  user: UserDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}