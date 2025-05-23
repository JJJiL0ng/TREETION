// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SocialAuthDto, RefreshTokenDto, AuthResponseDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CodeAuthDto } from './dto/code-auth.dto';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // src/auth/auth.controller.ts
  private processingCodes = new Map<string, Promise<AuthResponseDto>>();

  @Post('code')
  @HttpCode(HttpStatus.OK)
  async processAuthCode(@Body() codeAuthDto: CodeAuthDto): Promise<AuthResponseDto> {
    const codeKey = `${codeAuthDto.provider}-${codeAuthDto.code}`;

    // 이미 처리 중인 요청이 있으면 재사용
    if (this.processingCodes.has(codeKey)) {
      console.log('Reusing in-flight request for code:', codeKey);
      return this.processingCodes.get(codeKey) as Promise<AuthResponseDto>;
    }

    // 새 요청 처리
    const resultPromise = this.authService.processAuthCode(codeAuthDto);
    this.processingCodes.set(codeKey, resultPromise);

    try {
      const result = await resultPromise;
      // 일정 시간 후 캐시에서 제거
      setTimeout(() => this.processingCodes.delete(codeKey), 5000);
      return result;
    } catch (error) {
      this.processingCodes.delete(codeKey);
      throw error;
    }
  }

  //초기에 개발하였으나 현재는 /code Auth 방식을 사용하고 있음
  @Post('social')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Social login' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    type: AuthResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async socialLogin(@Body() socialAuthDto: SocialAuthDto): Promise<AuthResponseDto> {
    return this.authService.validateSocialLogin(socialAuthDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Successfully refreshed token',
    type: AuthResponseDto
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: any) {
    // JwtAuthGuard에서 req.user에 사용자 정보를 설정함
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: any) {
    // 여기서는 클라이언트 측에서 토큰을 삭제하는 것이 주요 로직이지만
    // 필요하다면 서버 측에서도 토큰 블랙리스트 처리 등을 구현할 수 있습니다.
    return { message: 'Successfully logged out' };
  }
}