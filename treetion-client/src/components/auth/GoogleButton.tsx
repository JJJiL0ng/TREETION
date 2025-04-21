// components/auth/GoogleButton.tsx 수정
'use client';

import { useState } from 'react';

interface GoogleButtonProps {
  isLoading?: boolean;
}

export default function GoogleButton({ isLoading = false }: GoogleButtonProps) {
  const [localLoading, setLocalLoading] = useState(false);
  
  const handleGoogleLogin = async () => {
    setLocalLoading(true);
    
    try {
      // 올바른 클라이언트 ID 사용 확인
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      // 정확한 리다이렉트 URI 설정
      const redirectUri = `${window.location.origin}/auth/callback/google`;
      
      // 올바른 스코프 설정
      const scope = encodeURIComponent('email profile');
      
      // 상태 파라미터 추가 (CSRF 보호)
      const state = Math.random().toString(36).substring(2);
      sessionStorage.setItem('oauth_state', state);
      
      // 완성된 인증 URL
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
      
      // 구글 로그인 페이지로 리다이렉트
      window.location.href = authUrl;
    } catch (err) {
      console.error('Google 로그인 시작 중 오류 발생:', err);
      setLocalLoading(false);
    }
  };

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