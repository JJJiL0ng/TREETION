// // src/auth/auth.service.spec.ts
// import { Test, TestingModule } from '@nestjs/testing';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { UnauthorizedException } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { User } from '../users/entities/user.entity';
// import { SocialProvider, SocialAuthDto } from './dto';
// import axios from 'axios';

// // axios 모킹
// jest.mock('axios');
// const mockedAxios = axios as jest.Mocked<typeof axios>;

// describe('AuthService', () => {
//   let service: AuthService;
//   let jwtService: JwtService;
//   let userRepository: Repository<User>;

//   const mockUser = {
//     id: 'test-uuid',
//     email: 'test@example.com',
//     name: 'Test User',
//     firstName: 'Test',
//     lastName: 'User',
//     profilePicture: 'https://example.com/pic.jpg',
//     provider: SocialProvider.GOOGLE,
//     providerId: 'google-123',
//     isEmailVerified: false,
//     isActive: true,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   const mockJwtService = {
//     sign: jest.fn().mockReturnValue('mocked-token'),
//     verify: jest.fn().mockReturnValue({ sub: 'test-uuid', email: 'test@example.com' }),
//   };

//   const mockConfigService = {
//     get: jest.fn().mockImplementation((key: string) => {
//       if (key === 'JWT_SECRET') return 'test-secret';
//       if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
//       if (key === 'JWT_ACCESS_EXPIRATION') return '1h';
//       if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
//       return null;
//     }),
//   };

//   const mockUserRepository = {
//     findOne: jest.fn(),
//     save: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: JwtService,
//           useValue: mockJwtService,
//         },
//         {
//           provide: ConfigService,
//           useValue: mockConfigService,
//         },
//         {
//           provide: getRepositoryToken(User),
//           useValue: mockUserRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<AuthService>(AuthService);
//     jwtService = module.get<JwtService>(JwtService);
//     userRepository = module.get<Repository<User>>(getRepositoryToken(User));
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('validateSocialLogin', () => {
//     it('should validate Google login and return tokens', async () => {
//       // Google API 응답 모킹
//       mockedAxios.get.mockResolvedValueOnce({
//         data: {
//           sub: 'google-123',
//           email: 'test@example.com',
//           name: 'Test User',
//           given_name: 'Test',
//           family_name: 'User',
//           picture: 'https://example.com/pic.jpg',
//         },
//       });

//       // 사용자 찾기 결과 모킹
//       mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

//       // 서비스 메서드 모킹
//       jest.spyOn(service, 'getSocialProfile').mockResolvedValueOnce({
//         id: 'google-123',
//         email: 'test@example.com',
//         name: 'Test User',
//         firstName: 'Test',
//         lastName: 'User',
//         picture: 'https://example.com/pic.jpg',
//         provider: SocialProvider.GOOGLE,
//         providerId: 'google-123',
//       });

//       jest.spyOn(service, 'findOrCreateUser').mockResolvedValueOnce(mockUser);
//       jest.spyOn(service, 'generateTokens').mockReturnValueOnce({
//         accessToken: 'mocked-access-token',
//         refreshToken: 'mocked-refresh-token',
//         expiresIn: 3600,
//       });

//       const socialAuthDto: SocialAuthDto = {
//         provider: SocialProvider.GOOGLE,
//         accessToken: 'google-access-token',
//       };

//       const result = await service.validateSocialLogin(socialAuthDto);

//       expect(service.getSocialProfile).toHaveBeenCalledWith(
//         SocialProvider.GOOGLE,
//         'google-access-token',
//         undefined
//       );
//       expect(service.findOrCreateUser).toHaveBeenCalled();
//       expect(service.generateTokens).toHaveBeenCalledWith(mockUser);
//       expect(result).toHaveProperty('accessToken');
//       expect(result).toHaveProperty('refreshToken');
//       expect(result).toHaveProperty('expiresIn');
//       expect(result).toHaveProperty('user');
//     });

//     it('should create new user if not found', async () => {
//       const newUser = {
//         id: 'new-uuid',
//         email: 'new@example.com',
//         name: 'New User',
//         firstName: 'New',
//         lastName: 'User',
//         profilePicture: 'https://example.com/pic.jpg',
//         provider: SocialProvider.GOOGLE,
//         providerId: 'google-123',
//       };

//       // 소셜 프로필 모킹
//       jest.spyOn(service, 'getSocialProfile').mockResolvedValueOnce({
//         id: 'google-123',
//         email: 'new@example.com',
//         name: 'New User',
//         firstName: 'New',
//         lastName: 'User',
//         picture: 'https://example.com/pic.jpg',
//         provider: SocialProvider.GOOGLE,
//         providerId: 'google-123',
//       });

//       // 사용자 찾기 및 생성 모킹
//       mockUserRepository.findOne.mockResolvedValueOnce(null);
//       mockUserRepository.save.mockResolvedValueOnce(newUser);

//       // 토큰 생성 모킹
//       jest.spyOn(service, 'generateTokens').mockReturnValueOnce({
//         accessToken: 'new-access-token',
//         refreshToken: 'new-refresh-token',
//         expiresIn: 3600,
//       });

//       const socialAuthDto: SocialAuthDto = {
//         provider: SocialProvider.GOOGLE,
//         accessToken: 'google-access-token',
//       };

//       const result = await service.validateSocialLogin(socialAuthDto);

//       expect(mockUserRepository.findOne).toHaveBeenCalled();
//       expect(mockUserRepository.save).toHaveBeenCalled();
//       expect(result).toHaveProperty('accessToken', 'new-access-token');
//       expect(result).toHaveProperty('user', newUser);
//     });

//     it('should throw UnauthorizedException for invalid Google token', async () => {
//       // Google API 오류 모킹
//       jest.spyOn(service, 'getSocialProfile').mockRejectedValueOnce(
//         new UnauthorizedException('Invalid Google access token')
//       );

//       const socialAuthDto: SocialAuthDto = {
//         provider: SocialProvider.GOOGLE,
//         accessToken: 'invalid-token',
//       };

//       await expect(service.validateSocialLogin(socialAuthDto)).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });

//     it('should throw UnauthorizedException for unsupported provider', async () => {
//       const socialAuthDto: SocialAuthDto = {
//         provider: 'unsupported' as SocialProvider,
//         accessToken: 'some-token',
//       };

//       // getSocialProfile 메서드가 예외를 던지도록 모킹
//       jest.spyOn(service, 'getSocialProfile').mockRejectedValueOnce(
//         new UnauthorizedException('Unsupported social provider')
//       );

//       await expect(service.validateSocialLogin(socialAuthDto)).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });
//   });

//   describe('refreshTokens', () => {
//     it('should refresh tokens with valid refresh token', async () => {
//       // JWT verify 메서드 모킹
//       jest.spyOn(jwtService, 'verify').mockReturnValueOnce({
//         sub: 'test-uuid',
//         email: 'test@example.com',
//       });

//       // 사용자 조회 모킹
//       mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

//       // 토큰 생성 모킹
//       jest.spyOn(service, 'generateTokens').mockReturnValueOnce({
//         accessToken: 'new-access-token',
//         refreshToken: 'new-refresh-token',
//         expiresIn: 3600,
//       });

//       const result = await service.refreshTokens('valid-refresh-token');

//       expect(jwtService.verify).toHaveBeenCalledWith(
//         'valid-refresh-token',
//         { secret: 'test-refresh-secret' },
//       );
//       expect(mockUserRepository.findOne).toHaveBeenCalledWith({
//         where: { id: 'test-uuid' }
//       });
//       expect(service.generateTokens).toHaveBeenCalledWith(mockUser);
//       expect(result).toHaveProperty('accessToken', 'new-access-token');
//       expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
//       expect(result).toHaveProperty('expiresIn', 3600);
//       expect(result).toHaveProperty('user', mockUser);
//     });

//     it('should throw UnauthorizedException with invalid refresh token', async () => {
//       // JWT verify가 예외를 던지도록 모킹
//       jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
//         throw new Error('Invalid token');
//       });

//       await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });

//     it('should throw UnauthorizedException when user not found', async () => {
//       // JWT verify 메서드 모킹
//       jest.spyOn(jwtService, 'verify').mockReturnValueOnce({
//         sub: 'test-uuid',
//         email: 'test@example.com',
//       });
      
//       // 사용자를 찾지 못하는 상황 모킹
//       mockUserRepository.findOne.mockResolvedValueOnce(null);

//       await expect(service.refreshTokens('valid-token')).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });
//   });
// });