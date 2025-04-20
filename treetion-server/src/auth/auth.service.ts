// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { UserDto } from '../users/dto/user.dto';
import { CodeAuthDto } from './dto/code-auth.dto';


import {
  SocialAuthDto,
  SocialProvider,
  SocialProfileDto,
  AuthResponseDto
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) { }

  async validateSocialLogin(socialAuthDto: SocialAuthDto): Promise<AuthResponseDto> {
    const { provider, accessToken, idToken } = socialAuthDto;

    // 소셜 로그인 제공자로부터 프로필 정보 가져오기
    const socialProfile = await this.getSocialProfile(provider, accessToken, idToken);

    // 사용자 찾기 또는 생성하기
    const user = await this.findOrCreateUser(socialProfile);


    // JWT 토큰 생성
    const tokens = this.generateTokens(user);

    // 사용자 엔티티를 DTO로 변환
    const userDto = this.usersService.toUserDto(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: userDto,
    };
  }

  async getSocialProfile(
    provider: SocialProvider,
    accessToken: string,
    idToken?: string
  ): Promise<SocialProfileDto> {
    switch (provider) {
      case SocialProvider.GOOGLE:
        return this.getGoogleProfile(accessToken);
      case SocialProvider.KAKAO:
        throw new UnauthorizedException('Kakao login is not implemented yet');
      case SocialProvider.NAVER:
        throw new UnauthorizedException('Naver login is not implemented yet');
      case SocialProvider.APPLE:
        throw new UnauthorizedException('Apple login is not implemented yet');
      case SocialProvider.FACEBOOK:
        throw new UnauthorizedException('Facebook login is not implemented yet');
      default:
        throw new UnauthorizedException('Unsupported social provider');
    }
  }

  async getGoogleProfile(accessToken: string): Promise<SocialProfileDto> {
    try {
      const { data } = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return {
        id: data.sub,
        email: data.email,
        name: data.name,
        firstName: data.given_name,
        lastName: data.family_name,
        picture: data.picture,
        provider: SocialProvider.GOOGLE,
        providerId: data.sub,
        raw: data,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google access token');
    }
  }

  async findOrCreateUser(socialProfile: SocialProfileDto): Promise<User> {
    // 기존 사용자 찾기 시도
    let user = await this.userRepository.findOne({
      where: [
        { email: socialProfile.email },
        {
          providerId: socialProfile.providerId,
          provider: socialProfile.provider
        }
      ]
    });

    // 사용자가 존재하지 않으면 새로 생성
    // 사용자가 존재하지 않으면 새로 생성
    // TODO: Google OAuth 인증 과정에서 providerId가 null로 설정되는 문제가 있음
    // 현재 임시 방편으로 하드코딩된 값을 사용하지만, 이는 일시적인 해결책임
    // 해결 방안:
    // 1. getGoogleProfile 메서드에서 Google API 응답의 'sub' 필드가 정상적으로 반환되는지 확인
    // 2. 토큰 교환 과정(processAuthCode)에서 응답 데이터를 로깅하여 문제 원인 파악
    // 3. Google API 버전 또는 엔드포인트 변경 여부 확인
    // 4. 장기적으로는 DB 스키마를 조정하거나 적절한 예외 처리 구현 필요
    if (!user) {
      user = new User();
      user.email = socialProfile.email;
      user.name = socialProfile.name || '';
      user.firstName = socialProfile.firstName || '';
      user.lastName = socialProfile.lastName || '';
      user.profilePicture = socialProfile.picture || '';
      user.provider = socialProfile.provider;

      // 임시 하드코딩 - 구글 로그인의 경우
      if (socialProfile.provider === SocialProvider.GOOGLE) {
        user.providerId = socialProfile.providerId || 'google-user-id';
      } else {
        user.providerId = socialProfile.providerId || `temp-${Date.now()}`;
      }

      user = await this.userRepository.save(user);
    }

    return user;
  }


  generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });

    // 필요하다면 여기서 리프레시 토큰을 DB에 저장

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1시간 (초 단위)
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // 리프레시 토큰 검증
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // 사용자 조회
      const user = await this.userRepository.findOne({
        where: { id: payload.sub }
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 새 토큰 생성
      const tokens = this.generateTokens(user);

      // 사용자 엔티티를 DTO로 변환
      const userDto = this.usersService.toUserDto(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: userDto,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateJwt(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // AuthService 클래스 내에 추가
  async processAuthCode(codeAuthDto: CodeAuthDto): Promise<AuthResponseDto> {
    const { provider, code, redirectUri } = codeAuthDto;

    try {
      let accessToken: string;
      let idToken: string | undefined;

      switch (provider) {
        case SocialProvider.GOOGLE:
          // Google OAuth 코드를 토큰으로 교환
          const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            {
              code,
              client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
              client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
            }
          );

          accessToken = tokenResponse.data.access_token;
          idToken = tokenResponse.data.id_token;
          break;

        default:
          throw new UnauthorizedException('Unsupported social provider');
      }

      // 기존 소셜 로그인 로직 활용
      return this.validateSocialLogin({
        provider,
        accessToken,
        idToken
      });
    } catch (error) {
      console.error('OAuth code processing error:', error);
      throw new UnauthorizedException(`Failed to process ${provider} authorization code`);
    }
  }
}
