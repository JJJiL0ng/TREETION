'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { processOAuthCallback } from '@/lib/api/auth';

export default function OAuthCallbackPage({
  params,
}: {
  params: { provider: string };
}) {
  const router = useRouter();
  const setUser = useUserStore(state => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const { provider } = params;

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 현재는 Google만 지원하므로 다른 제공자는 오류 표시
        if (provider !== 'google') {
          throw new Error(`지원되지 않는 로그인 제공자입니다: ${provider}`);
        }
        
        // URL에서 코드 매개변수 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('인증 코드가 제공되지 않았습니다.');
        }
        
        // 서버에 코드 전송하여 토큰 받기
        const userData = await processOAuthCallback(provider, code);
        
        // 사용자 정보 저장 및 대시보드로 리다이렉트
        setUser(userData);
        router.push('/dashboard');
      } catch (err) {
        console.error(`${provider} 로그인 처리 중 오류 발생:`, err);
        setError(err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleCallback();
  }, [provider, router, setUser]);

  return (
    <div className="p-8 text-center">
      {error ? (
        <div className="space-y-4">
          <div className="text-red-600 text-xl font-medium">로그인 오류</div>
          <p>{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg">{provider} 로그인 처리 중입니다...</p>
        </div>
      )}
    </div>
  );
}