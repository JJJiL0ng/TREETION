// src/lib/auth/session.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, refreshTokens } from './token';

/**
 * 인증이 필요한 페이지에서 사용할 함수
 * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
 */
export const useRequireAuth = (redirectUrl: string = '/login'): boolean => {
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      // 이미 인증된 경우
      if (isAuthenticated()) {
        return true;
      }
      
      // 토큰 갱신 시도
      const refreshed = await refreshTokens();
      if (!refreshed) {
        router.push(redirectUrl);
        return false;
      }
      
      return true;
    };
    
    checkAuth();
  }, [router, redirectUrl]);
  
  return isAuthenticated();
};

