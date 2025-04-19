// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SocialAuthDto, SocialProvider, RefreshTokenDto } from './dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateSocialLogin: jest.fn(),
    refreshTokens: jest.fn(),
  };

  const mockUser = {
    id: 'test-uuid',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('socialLogin', () => {
    it('should return auth response for valid social login', async () => {
      const socialAuthDto: SocialAuthDto = {
        provider: SocialProvider.GOOGLE,
        accessToken: 'valid-token',
      };

      mockAuthService.validateSocialLogin.mockResolvedValueOnce(mockAuthResponse);

      const result = await controller.socialLogin(socialAuthDto);

      expect(authService.validateSocialLogin).toHaveBeenCalledWith(socialAuthDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw exception when service throws', async () => {
      const socialAuthDto: SocialAuthDto = {
        provider: SocialProvider.GOOGLE,
        accessToken: 'invalid-token',
      };

      mockAuthService.validateSocialLogin.mockRejectedValueOnce(
        new UnauthorizedException('Invalid token'),
      );

      await expect(controller.socialLogin(socialAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValueOnce(mockAuthResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(authService.refreshTokens).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw exception for invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };

      mockAuthService.refreshTokens.mockRejectedValueOnce(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user from request', async () => {
      const req = { user: mockUser };
      const result = await controller.getCurrentUser(req);
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should return success message on logout', async () => {
      const req = { user: mockUser };
      const result = await controller.logout(req);
      expect(result).toHaveProperty('message');
      expect(result.message).toEqual('Successfully logged out');
    });
  });
});