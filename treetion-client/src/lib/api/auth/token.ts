// src/lib/auth/token.ts
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { setCookie, deleteCookie } from 'cookies-next';

// 토큰 저장 키
const ACCESS_TOKEN_KEY = 'treetion_access_token';
const REFRESH_TOKEN_KEY = 'treetion_refresh_token';
const USER_KEY = 'treetion_user';

console.log('[TokenUtils] 토큰 관련 상수 초기화:', { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY });

/**
 * JWT 토큰 페이로드 타입
 */
export interface TokenPayload {
  sub: string; // 사용자 ID
  email: string;
  exp: number; // 만료 시간
  iat: number; // 발급 시간
}

/**
 * 사용자 정보 타입
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  provider?: string;
  providerId?: string;
}

/**
 * 인증 응답 타입
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/**
 * 토큰을 로컬 스토리지와 쿠키에 저장
 */
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  console.log('[TokenUtils] 토큰 저장 시도');
  if (typeof window !== 'undefined') {
    // 로컬 스토리지에 저장
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    
    // 쿠키에도 저장 (미들웨어가 접근할 수 있도록)
    try {
      const tokenExpiry = new Date();
      // JWT 토큰에서 만료 시간 추출
      const decoded = jwtDecode<TokenPayload>(accessToken);
      tokenExpiry.setTime(decoded.exp * 1000); // exp는 초 단위, JavaScript는 밀리초 사용
      
      // 액세스 토큰을 쿠키에 저장
      setCookie(ACCESS_TOKEN_KEY, accessToken, {
        expires: tokenExpiry,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });
      
      // 리프레시 토큰도 쿠키에 저장 (더 긴 만료 시간)
      const refreshExpiry = new Date();
      refreshExpiry.setDate(refreshExpiry.getDate() + 30); // 30일 동안 유효
      setCookie(REFRESH_TOKEN_KEY, refreshToken, {
        expires: refreshExpiry,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });
      
      console.log('[TokenUtils] 토큰 쿠키 저장 완료');
    } catch (error) {
      console.error('[TokenUtils] 토큰 쿠키 저장 실패:', error);
    }
    
    console.log('[TokenUtils] 토큰 저장 완료');
  } else {
    console.log('[TokenUtils] window 객체 없음, 토큰 저장 실패');
  }
};

/**
 * 사용자 정보를 로컬 스토리지에 저장
 */
export const saveUser = (user: User): void => {
  console.log('[TokenUtils] 사용자 정보 저장 시도:', user ? user.email : '없음');
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('[TokenUtils] 사용자 정보 저장 완료');
  } else {
    console.log('[TokenUtils] window 객체 없음, 사용자 정보 저장 실패');
  }
};

/**
 * 저장된 엑세스 토큰 가져오기
 */
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    console.log('[TokenUtils] 액세스 토큰 조회:', token ? '있음' : '없음');
    return token;
  }
  console.log('[TokenUtils] window 객체 없음, 액세스 토큰 조회 실패');
  return null;
};

/**
 * 저장된 리프레시 토큰 가져오기
 */
export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY);
    console.log('[TokenUtils] 리프레시 토큰 조회:', token ? '있음' : '없음');
    return token;
  }
  console.log('[TokenUtils] window 객체 없음, 리프레시 토큰 조회 실패');
  return null;
};

/**
 * 저장된 사용자 정보 가져오기
 */
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        console.log('[TokenUtils] 사용자 정보 조회 성공:', user.email);
        return user;
      } catch (error) {
        console.error('[TokenUtils] 사용자 정보 파싱 오류:', error);
        return null;
      }
    }
    console.log('[TokenUtils] 저장된 사용자 정보 없음');
  } else {
    console.log('[TokenUtils] window 객체 없음, 사용자 정보 조회 실패');
  }
  return null;
};

/**
 * 모든 인증 데이터 제거 (로그아웃)
 */
export const clearAuth = (): void => {
  console.log('[TokenUtils] 인증 데이터 제거 시도');
  if (typeof window !== 'undefined') {
    // 로컬 스토리지에서 제거
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // 쿠키에서도 제거
    try {
      deleteCookie(ACCESS_TOKEN_KEY);
      deleteCookie(REFRESH_TOKEN_KEY);
      console.log('[TokenUtils] 쿠키에서 토큰 제거 완료');
    } catch (error) {
      console.error('[TokenUtils] 쿠키에서 토큰 제거 실패:', error);
    }
    
    console.log('[TokenUtils] 인증 데이터 제거 완료');
  } else {
    console.log('[TokenUtils] window 객체 없음, 인증 데이터 제거 실패');
  }
};

/**
 * 토큰이 만료되었는지 확인
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    console.log('[TokenUtils] 토큰 만료 확인');
    const decoded = jwtDecode<TokenPayload>(token);
    const now = Date.now();
    const expiryTime = decoded.exp * 1000;
    const isExpired = expiryTime < now;
    
    console.log('[TokenUtils] 토큰 디코딩 성공 -', 
      '만료시간:', new Date(expiryTime).toISOString(),
      '현재시간:', new Date(now).toISOString(),
      '만료여부:', isExpired ? '만료됨' : '유효함');
    
    // 현재 시간이 만료 시간을 지났는지 확인 (초 단위)
    return isExpired;
  } catch (error) {
    console.error('[TokenUtils] 토큰 디코딩 실패:', error);
    return true; // 디코딩 실패 시 만료된 것으로 간주
  }
};

/**
 * 사용자가 로그인되어 있는지 확인
 */
export const isAuthenticated = (): boolean => {
  console.log('[TokenUtils] 인증 상태 확인');
  const token = getAccessToken();
  const isAuth = !!token && !isTokenExpired(token);
  console.log('[TokenUtils] 인증 상태:', isAuth ? '인증됨' : '인증되지 않음');
  return isAuth;
};

/**
 * API 요청에 사용할 인증 헤더 생성
 */
export const getAuthHeader = (): { Authorization: string } | undefined => {
  console.log('[TokenUtils] 인증 헤더 생성');
  const token = getAccessToken();
  if (token) {
    console.log('[TokenUtils] 인증 헤더 생성 성공');
    return { Authorization: `Bearer ${token}` };
  }
  console.log('[TokenUtils] 인증 헤더 생성 실패 (토큰 없음)');
  return undefined;
};

/**
 * 토큰 갱신 요청
 */
export const refreshTokens = async (baseUrl: string = '/api'): Promise<boolean> => {
  console.log('[TokenUtils] 토큰 갱신 요청 시작');
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.log('[TokenUtils] 리프레시 토큰 없음, 갱신 실패');
    return false;
  }
  
  try {
    console.log('[TokenUtils] 토큰 갱신 API 요청:', baseUrl + '/auth/refresh');
    const response = await axios.post<AuthResponse>(`${baseUrl}/auth/refresh`, { refreshToken });
    console.log('[TokenUtils] 토큰 갱신 응답 상태:', response.status);
    
    const { accessToken, refreshToken: newRefreshToken, user } = response.data;
    
    saveTokens(accessToken, newRefreshToken);
    saveUser(user);
    
    console.log('[TokenUtils] 토큰 갱신 성공');
    return true;
  } catch (error) {
    console.error('[TokenUtils] 토큰 갱신 실패:', error);
    clearAuth();
    return false;
  }
};
