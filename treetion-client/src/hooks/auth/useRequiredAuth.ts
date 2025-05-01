// src/hooks/useRequiredAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';

// /**
//  * 인증이 필요한 페이지에서 사용할 훅
//  * 사용자가 인증되지 않았으면 지정된 페이지로 리다이렉트
//  * 
//  * @param redirectUrl 인증되지 않은 경우 리다이렉트할 URL (기본값: /auth/login)
//  * @returns 인증 상태 객체
//  * 
//  * @example
//  * ```tsx
//  * // 대시보드 페이지에서 사용 예시
//  * const DashboardPage = () => {
//  *   const { user, isLoading } = useRequiredAuth();
//  * 
//  *   if (isLoading) {
//  *     return <div>로딩 중...</div>;
//  *   }
//  * 
//  *   return (
//  *     <div>
//  *       <h1>안녕하세요, {user?.name || '사용자'}님</h1>
//  *       {/* 나머지 페이지 내용 */}
//  *     </div>
//  *   );
//  * };
//  */
export const useRequiredAuth = (redirectUrl: string = '/auth/login') => {
  console.log('[useRequiredAuth] 훅 호출, 리다이렉트 URL:', redirectUrl);
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Zustand 스토어에서 상태 및 액션 가져오기
  const user = useUserStore(state => state.user);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const storeLoading = useUserStore(state => state.isLoading);
  const checkAuthStatus = useUserStore(state => state.checkAuthStatus);
  const refreshTokenIfNeeded = useUserStore(state => state.refreshTokenIfNeeded);
  
  console.log('[useRequiredAuth] 초기 상태 -', 
    '인증:', isAuthenticated, 
    '사용자:', user ? '있음' : '없음', 
    '스토어 로딩:', storeLoading);
  
  useEffect(() => {
    console.log('[useRequiredAuth] useEffect 실행');
    let isMounted = true;
    
    const verifyAuth = async () => {
      console.log('[useRequiredAuth] 인증 검증 시작');
      setIsLoading(true);
      
      // 이미 인증되어 있으면 추가 검사 불필요
      if (isAuthenticated && !storeLoading) {
        console.log('[useRequiredAuth] 이미 인증됨, 추가 검사 불필요');
        setIsLoading(false);
        return;
      }
      
      // 현재 인증 상태 확인 (비동기 함수 await 추가)
      console.log('[useRequiredAuth] 인증 상태 확인 중');
      try {
        const isValid = await checkAuthStatus();
        console.log('[useRequiredAuth] 인증 상태 확인 결과:', isValid);
        
        if (!isValid) {
          // 토큰 갱신 시도
          console.log('[useRequiredAuth] 인증 유효하지 않음, 토큰 갱신 시도');
          const refreshed = await refreshTokenIfNeeded().catch((error) => {
            console.error('[useRequiredAuth] 토큰 갱신 중 오류:', error);
            return false;
          });
          
          console.log('[useRequiredAuth] 토큰 갱신 결과:', refreshed ? '성공' : '실패');
          
          // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
          if (!refreshed && isMounted) {
            console.log('[useRequiredAuth] 토큰 갱신 실패, 리다이렉트:', redirectUrl);
            router.replace(redirectUrl);
            return;
          }
        }
      } catch (error) {
        console.error('[useRequiredAuth] 인증 검증 중 오류:', error);
        if (isMounted) {
          router.replace(redirectUrl);
          return;
        }
      }
      
      if (isMounted) {
        console.log('[useRequiredAuth] 인증 검증 완료, 로딩 상태 해제');
        setIsLoading(false);
      }
    };
    
    verifyAuth();
    
    return () => {
      console.log('[useRequiredAuth] useEffect 클린업');
      isMounted = false;
    };
  }, [
    router, 
    redirectUrl, 
    isAuthenticated, 
    storeLoading, 
    checkAuthStatus, 
    refreshTokenIfNeeded
  ]);
  
  console.log('[useRequiredAuth] 반환 값 -', 
    '사용자:', user ? '있음' : '없음', 
    '인증:', isAuthenticated, 
    '로딩:', isLoading || storeLoading);
  
  return {
    user,
    isAuthenticated,
    isLoading: isLoading || storeLoading,
  };
};

export default useRequiredAuth;