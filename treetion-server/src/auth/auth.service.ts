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
  ) {}

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
        'https://www.googleapis.com/oauth2/v3/userinfo',
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
    if (!user) {
      user = new User();
      user.email = socialProfile.email;
      user.name = socialProfile.name || '';
      user.firstName = socialProfile.firstName || '';
      user.lastName = socialProfile.lastName || '';
      user.profilePicture = socialProfile.picture || '';
      user.provider = socialProfile.provider;
      user.providerId = socialProfile.providerId;
      
      user = await this.userRepository.save(user);
    } else {
      // 이미 존재하는 사용자의 경우 소셜 정보 업데이트
      user.name = socialProfile.name || user.name;
      user.firstName = socialProfile.firstName || user.firstName;
      user.lastName = socialProfile.lastName || user.lastName;
      user.profilePicture = socialProfile.picture || user.profilePicture;
      
      // 다른 소셜 계정으로 가입했었는데 이메일이 같은 경우
      // 가장 최근에 로그인한 소셜 계정 정보로 업데이트
      user.provider = socialProfile.provider;
      user.providerId = socialProfile.providerId;
      
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
}