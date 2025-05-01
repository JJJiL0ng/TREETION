// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { getAccessToken, getRefreshToken, isTokenExpired, saveTokens, saveUser } from '@/lib/api/auth/token';
import axios from 'axios';

/**
 * 인증 관련 기능을 제공하는 커스텀 훅
 * Zustand 스토어와 인증 유틸리티를 결합하여 사용
 */
export const useAuth = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Zustand 스토어에서 상태 및 액션 가져오기
  const user = useUserStore(state => state.user);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const token = useUserStore(state => state.token);
  const storeError = useUserStore(state => state.error);
  const storeLoading = useUserStore(state => state.isLoading);
  
  const setUser = useUserStore(state => state.setUser);
  const setError = useUserStore(state => state.setError);
  const logout = useUserStore(state => state.logout);
  const checkAuthStatus = useUserStore(state => state.checkAuthStatus);
  const refreshTokenIfNeeded = useUserStore(state => state.refreshTokenIfNeeded);
  
  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    const verifyAuth = async () => {
      setLoading(true);
      
      try {
        // 현재 인증 상태 확인
        const isValid = checkAuthStatus();
        
        if (!isValid) {
          // 만료된 경우 토큰 갱신 시도
          await refreshTokenIfNeeded();
        }
      } catch (error) {
        console.error('인증 검증 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    verifyAuth();
  }, [checkAuthStatus, refreshTokenIfNeeded]);
  
  /**
   * 구글 로그인 처리 함수
   */
  const loginWithGoogle = useCallback((clientId?: string, redirectUri?: string) => {
    try {
      // 올바른 클라이언트 ID 사용 확인
      const googleClientId = clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      if (!googleClientId) {
        throw new Error('Google 클라이언트 ID가 설정되지 않았습니다.');
      }
      
      // 정확한 리다이렉트 URI 설정
      const googleRedirectUri = redirectUri || `${window.location.origin}/auth/callback/google`;
      
      // 상태 파라미터 추가 (CSRF 보호)
      const state = Math.random().toString(36).substring(2);
      sessionStorage.setItem('oauth_state', state);
      
      // 올바른 스코프 설정
      const scope = encodeURIComponent('email profile');
      
      // 완성된 인증 URL
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${googleClientId}&redirect_uri=${encodeURIComponent(googleRedirectUri)}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
      
      // 구글 로그인 페이지로 리다이렉트
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google 로그인 시작 오류:', error);
      setError(error instanceof Error ? error.message : '로그인 시작 중 오류가 발생했습니다.');
    }
  }, [setError]);
  
  /**
   * 구글 콜백 처리 함수
   */
  const handleGoogleLogin = useCallback(async (
    code: string,
    clientId: string,
    redirectUri: string,
    onSuccess?: () => void
  ) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const apiUrl = `${baseUrl}/auth/code`;
      
      const response = await axios.post(apiUrl, {
        provider: 'google',
        code,
        redirectUri,
        clientId
      });
      
      // 응답에서 토큰 및 사용자 정보 추출
      const { accessToken, refreshToken, user } = response.data.data;
      
      if (!accessToken || !refreshToken) {
        throw new Error('인증 토큰이 반환되지 않았습니다.');
      }
      
      // 인증 유틸리티를 사용하여 토큰 저장
      saveTokens(accessToken, refreshToken);
      saveUser(user);
      
      // 기존 방식도 유지 (하위 호환성)
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Zustand 스토어에 사용자 정보 설정
      setUser(user, accessToken);
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('Google 로그인 처리 오류:', error);
      setError(error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.');
      return false;
    }
  }, [setUser, setError]);
  
  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = useCallback((redirectTo: string = '/auth/login') => {
    logout();
    router.push(redirectTo);
  }, [logout, router]);
  
  /**
   * 보호된 경로 접근 시 인증 확인 함수
   */
  const requireAuth = useCallback(async (redirectTo: string = '/auth/login') => {
    // 이미 인증된 경우
    if (isAuthenticated) {
      return true;
    }
    
    // 토큰 갱신 시도
    const refreshed = await refreshTokenIfNeeded();
    if (!refreshed) {
      router.push(redirectTo);
      return false;
    }
    
    return true;
  }, [isAuthenticated, refreshTokenIfNeeded, router]);
  
  return {
    // 상태
    user,
    isLoggedIn: isAuthenticated,
    token,
    error: storeError,
    loading: loading || storeLoading,
    
    // 액션
    loginWithGoogle,
    handleGoogleLogin,
    logout: handleLogout,
    requireAuth,
    refreshTokenIfNeeded,
    
    // 유틸리티
    checkAuthStatus
  };
};