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
  
      console.log('Google API response:', data);
  
      return {
        id: data.id || data.sub, // id 필드 우선 사용, 없으면 sub 사용
        email: data.email,
        name: data.name,
        firstName: data.given_name,
        lastName: data.family_name,
        picture: data.picture,
        provider: SocialProvider.GOOGLE,
        providerId: data.id || data.sub, // providerId도 설정
        raw: data,
      };
    } catch (error) {
      console.error('Google profile fetch error:', error);
      throw new UnauthorizedException('Invalid Google access token');
    }
  }

  async findOrCreateUser(socialProfile: SocialProfileDto): Promise<User> {
    console.log('Finding user with email:', socialProfile.email);
    
    // 이메일로 정확히 검색
    let user = await this.userRepository.findOne({
      where: { email: socialProfile.email }
    });
    
    console.log('User found by email:', user ? 'Yes' : 'No');
    
    // 이메일로 찾지 못한 경우, provider와 providerId 모두 사용하여 검색
    if (!user) {
      const providerId = socialProfile.id || socialProfile.providerId;
      if (providerId) {
        user = await this.userRepository.findOne({
          where: { 
            provider: socialProfile.provider,
            providerId: providerId
          }
        });
        console.log('User found by provider and providerId:', user ? 'Yes' : 'No');
      }
    }
    
    if (user) {
      console.log('Existing user found:', user.id);
    } else {
      console.log('No user found, creating new user');
      
      const newUser = new User();
      newUser.email = socialProfile.email;
      newUser.name = socialProfile.name || '';
      newUser.firstName = socialProfile.firstName || '';
      newUser.lastName = socialProfile.lastName || '';
      newUser.profilePicture = socialProfile.picture || '';
      newUser.provider = socialProfile.provider;
      
      // Google 사용자의 경우 raw 데이터에서 id 필드 사용
      if (socialProfile.provider === SocialProvider.GOOGLE && socialProfile.raw) {
        newUser.providerId = socialProfile.raw.id || socialProfile.id || `google-${Date.now()}`;
      } else {
        newUser.providerId = socialProfile.id || socialProfile.providerId || `${socialProfile.provider}-${Date.now()}`;
      }
      
      console.log('Creating user with providerId:', newUser.providerId);
      
      try {
        // 사용자 저장 시도
        user = await this.userRepository.save(newUser);
        console.log('User created successfully with ID:', user.id);
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
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
