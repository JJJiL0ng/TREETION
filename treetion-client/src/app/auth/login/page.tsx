// src/app/auth/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import GoogleButton from '@/components/auth/GoogleButton';
import { useUserStore } from '@/store/user-store';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true); // 페이지 로딩 상태 추가
  
  console.log('로그인 페이지 렌더링 시작');
  
  // 콜백 URL이 있으면 사용, 없으면 기본 대시보드 경로 사용
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  console.log('콜백 URL:', callbackUrl);
  
  // Zustand 스토어에서 인증 상태 가져오기
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const storeLoading = useUserStore(state => state.isLoading);
  const checkAuthStatus = useUserStore(state => state.checkAuthStatus);

  useEffect(() => {
    let isMounted = true;
    
    console.log('로그인 페이지 useEffect 실행, URL:', window.location.href);
    console.log('현재 인증 상태:', isAuthenticated, '로딩 상태:', storeLoading);
    
    // 한 번만 실행
    const checkAuth = async () => {
      try {
        console.log('인증 상태 확인 시작');
        setPageLoading(true);
        const isAuth = await checkAuthStatus();
        console.log('인증 상태 확인 결과:', isAuth);
        
        // 이미 인증된 경우에만 리다이렉트
        if (isMounted) {
          if (isAuth) {
            console.log('인증됨, 리다이렉트 경로:', callbackUrl);
            router.replace(callbackUrl); // replace 메서드 사용하여 push가 아닌 replace로 이동
          } else {
            console.log('인증되지 않음, 로그인 페이지 유지');
            setPageLoading(false); // 로그인 페이지 준비 완료
          }
        }
      } catch (error) {
        console.error('인증 상태 확인 중 오류 발생:', error);
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };
    
    checkAuth();
    
    // 클린업 함수
    return () => {
      console.log('로그인 페이지 useEffect 클린업');
      isMounted = false;
    };
  }, [router, checkAuthStatus, callbackUrl]); // callbackUrl 의존성 추가
  
  const handleDemoLogin = async () => {
    console.log('데모 로그인 버튼 클릭');
    setIsLoading(true);
    setError(null);
    
    try {
      // 실제 구현에서는 서버에 데모 로그인 요청을 보내고 응답을 처리합니다
      // 여기서는 단순히 대시보드로 리다이렉트하는 것으로 대체합니다
      console.log('데모 로그인 처리 중...');
      setTimeout(() => {
        console.log('데모 로그인 타이머 완료, 리다이렉트 경로:', callbackUrl);
        router.replace(callbackUrl); // replace 메서드 사용
      }, 1000);
    } catch (error) {
      console.error('데모 로그인 오류:', error);
      setError('데모 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 로딩 상태 확인
  if (pageLoading) {
    console.log('페이지 로딩 중, 로딩 UI 표시');
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  console.log('로그인 폼 렌더링');
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">트리션에 오신 것을 환영합니다</h1>
        <p className="text-muted">계정으로 로그인하여 시작하세요</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <GoogleButton 
          isLoading={isLoading}
          redirectUri={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback/google`}
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        />
        
        <button
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L14.5 9H19.5L15.5 13L17 18L12 15L7 18L8.5 13L4.5 9H9.5L12 4Z" fill="currentColor" />
              </svg>
              데모 계정으로 체험하기
            </>
          )}
        </button>
      </div>

      <div className="text-center text-sm text-muted">
        <p>로그인 시 트리션의 <Link href="/terms" className="text-primary hover:underline">이용약관</Link>과 <Link href="/privacy" className="text-primary hover:underline">개인정보 처리방침</Link>에 동의하게 됩니다.</p>
      </div>
    </div>
  );
}