import axios, { AxiosError } from 'axios';
import { User } from '@/types/auth';
import apiClient from './client';

// API 엔드포인트 기본 URL (환경 변수에서 가져옴)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * 소셜 로그인 처리
 */
export async function socialLogin(
    provider: string,
    code: string,
    redirectUri?: string
): Promise<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
        console.log('socialLogin 함수 호출됨:', { provider, code });

        // 1단계: 인증 코드를 액세스 토큰으로 교환 (Google OAuth API 사용)
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET; // 주의: 보안상 이 방식은 권장되지 않음
        const tokenEndpoint = 'https://oauth2.googleapis.com/token';

        const tokenResponse = await axios.post(tokenEndpoint, {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri || `${window.location.origin}/auth/callback/google`,
            grant_type: 'authorization_code'
        });

        console.log('Token exchange response:', tokenResponse.data);

        // 액세스 토큰과 ID 토큰 추출
        const { access_token: accessToken, id_token: idToken } = tokenResponse.data;

        // 2단계: 백엔드에 소셜 로그인 요청 (올바른 DTO 형식 사용)
        const response = await axios.post(`${API_URL}/auth/social`, {
            provider,
            accessToken,
            idToken // Google의 경우 idToken도 같이 전송
        });

        console.log('백엔드 API 응답:', response.data);

        // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        return response.data;
    } catch (error: unknown) {
        const axiosError = error as AxiosError;
        // 오류 상세 로깅
        console.error('소셜 로그인 처리 중 오류:', axiosError);

        if (axiosError.response) {
            console.error('서버 응답 오류:', {
                status: axiosError.response.status,
                data: axiosError.response.data,
                headers: axiosError.response.headers
            });

            if (axiosError.response && axiosError.response.data && (axiosError.response.data as { message: string }).message) {
                throw new Error(`${provider} 로그인 오류: ${(axiosError.response.data as { message: string }).message}`);
            }
        } else if (axiosError.request) {
            console.error('서버 응답 없음:', axiosError.request);
            throw new Error(`${provider} 로그인 요청 후 서버 응답이 없습니다.`);
        }

        throw new Error(`${provider} 로그인을 처리하는 중 오류가 발생했습니다: ${axiosError.message}`);
    }
}

/**
 * 코드를 사용한 소셜 로그인 처리
 */
export async function socialLoginWithCode(
    provider: string,
    code: string,
    redirectUri?: string
): Promise<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
        console.log('socialLoginWithCode 함수 호출됨:', { provider, code });

        // 백엔드 API 호출 (백엔드에서 구현된 경우)
        const response = await axios.post(`${API_URL}/auth/code`, {
            provider,
            code,
            redirectUri: redirectUri || `${window.location.origin}/auth/callback/${provider}`
        });

        console.log('백엔드 API 응답:', response.data);

        // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        return response.data;
    } catch (error: unknown) {
        const axiosError = error as AxiosError;
        console.error('소셜 로그인 처리 중 오류:', axiosError);

        if (axiosError.response) {
            console.error('서버 응답 오류:', {
                status: axiosError.response.status,
                data: axiosError.response.data,
                headers: axiosError.response.headers
            });

            if (axiosError.response && axiosError.response.data && (axiosError.response.data as { message: string }).message) {
                throw new Error(`${provider} 로그인 오류: ${(axiosError.response.data as { message: string }).message}`);
            }
        } else if (axiosError.request) {
            console.error('서버 응답 없음:', axiosError.request);
            throw new Error(`${provider} 로그인 요청 후 서버 응답이 없습니다.`);
        }

        // 백엔드에 /auth/code 엔드포인트가 없다면 기존 방식으로 시도
        try {
            return await socialLogin(provider, code, redirectUri);
        } catch (fallbackError) {
            console.error('기존 방식으로 로그인 시도 중 오류:', fallbackError);
            throw new Error(`${provider} 로그인을 처리하는 중 오류가 발생했습니다: ${axiosError.message}`);
        }
    }
}

/**
 * 토큰 새로고침
 */
export async function refreshToken(): Promise<string> {
    try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            throw new Error('리프레시 토큰이 없습니다.');
        }

        const response = await apiClient.post(`${API_URL}/auth/refresh`, {
            refreshToken
        });

        const newToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;
        
        // 토큰 저장
        localStorage.setItem('token', newToken);
        // 새 리프레시 토큰이 있으면 저장
        if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
        }

        return newToken;
    } catch (error) {
        console.error('토큰 새로고침 오류:', error);
        // 토큰 갱신 실패 시 로그아웃 처리
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        throw error;
    }
}

/**
 * 현재 인증된 사용자 정보 가져오기
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            return null;
        }

        const response = await apiClient.get(`${API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data.user;
    } catch (error: unknown) {
        const axiosError = error as AxiosError;
        console.error('사용자 정보 가져오기 오류:', axiosError);

        // 401 에러인 경우 토큰 새로고침 시도
        if (axiosError.response && axiosError.response.status === 401) {
            try {
                const newToken = await refreshToken();

                // 새 토큰으로 다시 요청
                const response = await apiClient.get(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${newToken}`
                    }
                });

                return response.data.user;
            } catch {
                // 토큰 갱신도 실패한 경우 로그아웃
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                return null;
            }
        }

        // 다른 에러인 경우
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return null;
    }
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
    try {
        const token = localStorage.getItem('token');

        if (token) {
            // 서버에 로그아웃 요청
            await axios.post(`${API_URL}/auth/logout`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error('로그아웃 오류:', error);
    } finally {
        // 로컬 스토리지에서 토큰 제거
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }
}

// 수정된 프론트엔드 인증 처리 함수
export async function processOAuthCallback(provider: string, code: string): Promise<User> {
    try {
      // 직접 백엔드의 /auth/code 엔드포인트만 사용
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const response = await axios.post(`${API_URL}/auth/code`, {
        provider,
        code,
        redirectUri
      });
      
      console.log('OAuth 처리 응답:', response.data);
      
      // 응답에서 토큰 저장 (응답 형식 확인하고 토큰 키 값 수정)
      if (response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response.data.user;
    } catch (error) {
      console.error(`${provider} OAuth 처리 중 오류:`, error);
      throw new Error(`${provider} 로그인을 처리하는 중 오류가 발생했습니다.`);
    }
}

// Google 콜백 특화 함수도 간소화
export async function processGoogleCallback(code: string): Promise<User> {
  return processOAuthCallback('google', code);
}