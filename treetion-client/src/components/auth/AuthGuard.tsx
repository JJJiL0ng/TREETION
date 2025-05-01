// src/components/auth/AuthGuard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * 인증된 사용자만 접근 가능한 컴포넌트를 감싸는 가드 컴포넌트
 * 
 * @example
 * ```tsx
 * <AuthGuard>
 *   <ProtectedComponent />
 * </AuthGuard>
 * ```
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = null,
  redirectTo = '/auth/login',
}) => {
  console.log('[AuthGuard] 렌더링, redirectTo:', redirectTo);
  
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  // Zustand 스토어에서 인증 상태 가져오기
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const checkAuthStatus = useUserStore(state => state.checkAuthStatus);
  const refreshTokenIfNeeded = useUserStore(state => state.refreshTokenIfNeeded);
  
  console.log('[AuthGuard] 초기 상태 - 인증:', isAuthenticated, '확인 중:', isChecking);
  
  useEffect(() => {
    console.log('[AuthGuard] useEffect 실행');
    let isMounted = true;
    
    const verifyAuth = async () => {
      console.log('[AuthGuard] 인증 검증 시작');
      setIsChecking(true);
      
      // 먼저 현재 인증 상태 확인
      console.log('[AuthGuard] 인증 상태 확인');
      try {
        const isAuthValid = await checkAuthStatus();
        console.log('[AuthGuard] 인증 상태 확인 결과:', isAuthValid);
        
        if (isAuthValid) {
          console.log('[AuthGuard] 인증 유효함');
          if (isMounted) {
            setIsChecking(false);
          }
          return;
        }
        
        // 만료된 경우 토큰 갱신 시도
        console.log('[AuthGuard] 인증 만료됨, 토큰 갱신 시도');
        const refreshed = await refreshTokenIfNeeded().catch(error => {
          console.error('[AuthGuard] 토큰 갱신 중 오류:', error);
          return false;
        });
        
        console.log('[AuthGuard] 토큰 갱신 결과:', refreshed ? '성공' : '실패');
        
        if (!refreshed && redirectTo && isMounted) {
          console.log('[AuthGuard] 토큰 갱신 실패, 리다이렉트:', redirectTo);
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('[AuthGuard] 인증 확인 중 오류:', error);
        if (redirectTo && isMounted) {
          router.push(redirectTo);
        }
      }
      
      if (isMounted) {
        console.log('[AuthGuard] 인증 검증 완료, 확인 상태 해제');
        setIsChecking(false);
      }
    };
    
    verifyAuth();
    
    return () => {
      console.log('[AuthGuard] useEffect 클린업');
      isMounted = false;
    };
  }, [router, redirectTo, checkAuthStatus, refreshTokenIfNeeded]);
  
  // 인증 검사 중이면 로딩 표시 또는 fallback 컴포넌트
  if (isChecking) {
    console.log('[AuthGuard] 인증 검사 중, fallback 렌더링');
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // 인증되지 않았고 리다이렉트 URL이 없는 경우 fallback 컴포넌트
  if (!isAuthenticated && !redirectTo) {
    console.log('[AuthGuard] 인증되지 않음, 리다이렉트 URL 없음, fallback 렌더링');
    return fallback || null;
  }
  
  // 인증되지 않았고 리다이렉트 URL이 있는 경우 리다이렉트는 이미 useEffect에서 처리됨
  
  // 인증된 경우 자식 컴포넌트 렌더링
  console.log('[AuthGuard] 인증됨, 자식 컴포넌트 렌더링');
  return <>{children}</>;
};

export default AuthGuard;