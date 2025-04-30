// src/components/auth/GoogleButton.tsx
'use client';

import { useState, useCallback } from 'react';
import { getGoogleLoginUrl } from '@/lib/api/auth/utils';

interface GoogleButtonProps {
  isLoading?: boolean;
  redirectUri?: string;
  clientId?: string;
}

export default function GoogleButton({ 
  isLoading = false,
  redirectUri,
  clientId
}: GoogleButtonProps) {
  console.log('[GoogleButton] 렌더링, props:', { isLoading, redirectUri: redirectUri || '기본값', clientId: clientId ? '있음' : '없음' });
  
  const [localLoading, setLocalLoading] = useState(false);
  
  const handleGoogleLogin = useCallback(async () => {
    console.log('[GoogleButton] 구글 로그인 버튼 클릭');
    setLocalLoading(true);
    
    try {
      // 환경 변수에서 클라이언트 ID 사용, 또는 props로 전달된 값 사용
      const googleClientId = clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      console.log('[GoogleButton] NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '설정됨' : '설정되지 않음');
      console.log('[GoogleButton] 사용할 클라이언트 ID:', googleClientId ? '있음' : '없음');
      
      if (!googleClientId) {
        throw new Error('Google 클라이언트 ID가 설정되지 않았습니다.');
      }
      
      // 리다이렉트 URI 설정
      const googleRedirectUri = redirectUri || `${window.location.origin}/auth/callback/google`;
      console.log('[GoogleButton] 리다이렉트 URI:', googleRedirectUri);
      
      // CSRF 보호를 위한 상태 생성
      const state = Math.random().toString(36).substring(2);
      sessionStorage.setItem('oauth_state', state);
      console.log('[GoogleButton] CSRF 상태 생성:', state);
      
      // 인증 유틸리티를 사용하여 로그인 URL 생성
      const loginUrl = getGoogleLoginUrl(googleRedirectUri, googleClientId);
      console.log('[GoogleButton] 생성된 로그인 URL (부분):', loginUrl.substring(0, 100) + '...');
      
      // 상태 파라미터 추가
      const urlWithState = `${loginUrl}&state=${state}`;
      console.log('[GoogleButton] 상태가 추가된 최종 URL로 리다이렉트 준비');
      
      // 구글 로그인 페이지로 리다이렉트
      window.location.href = urlWithState;
    } catch (err) {
      console.error('[GoogleButton] Google 로그인 시작 중 오류 발생:', err);
      setLocalLoading(false);
    }
  }, [clientId, redirectUri]);

  // 외부에서 전달받은 로딩 상태 또는 내부 로딩 상태 사용
  const showLoading = isLoading || localLoading;
  
  return (
    <button
      onClick={handleGoogleLogin}
      disabled={showLoading}
      className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      {showLoading ? (
        <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 계속하기
        </>
      )}
    </button>
  );
}