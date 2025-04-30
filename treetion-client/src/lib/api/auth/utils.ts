// src/lib/auth/utils.ts
import { useRouter } from 'next/navigation';
import { getAccessToken, isTokenExpired, refreshTokens, saveTokens, saveUser, AuthResponse } from './token';
/**
 * 인증이 필요한 API 요청을 위한 래퍼 함수
 * 필요시 토큰을 자동으로 갱신
 */
export const authFetch = async <T>(
  url: string,
  options?: RequestInit,
  baseUrl: string = '/api'
): Promise<T> => {
  // 현재 엑세스 토큰 확인
  let accessToken = getAccessToken();
  
  // 토큰이 만료되었으면 갱신 시도
  if (accessToken && isTokenExpired(accessToken)) {
    const refreshed = await refreshTokens(baseUrl);
    if (refreshed) {
      accessToken = getAccessToken();
    } else {
      throw new Error('Authentication required');
    }
  }
  
  // API 요청 실행
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      ...options?.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    // 401 에러일 경우 토큰 갱신 시도
    if (response.status === 401) {
      const refreshed = await refreshTokens(baseUrl);
      if (refreshed) {
        // 토큰 갱신 성공 시 요청 재시도
        return authFetch<T>(url, options, baseUrl);
      }
    }
    
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
};

/**
 * 구글 소셜 로그인 URL 생성
 */
export const getGoogleLoginUrl = (redirectUri: string, clientId: string): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * 구글 인증 코드로 로그인 처리
 */
export const handleGoogleCallback = async (
  code: string,
  clientId: string,
  redirectUri: string,
  baseUrl: string = '/api'
): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl}/auth/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'google',
        code,
        redirectUri,
        clientId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Google auth failed');
    }
    
    const data = await response.json() as AuthResponse;
    const { accessToken, refreshToken, user } = data;
    
    // 토큰과 사용자 정보 저장
    saveTokens(accessToken, refreshToken);
    saveUser(user);
    
    return true;
  } catch (error) {
    console.error('Google auth error:', error);
    return false;
  }
};
