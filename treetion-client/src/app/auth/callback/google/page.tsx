//src/app/auth/callback/google/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import axios, { AxiosError } from 'axios';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const setUser = useUserStore(state => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('초기화 중...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setDebugInfo('콜백 URL 파라미터 분석 중...');
        console.log('현재 URL:', window.location.href);
        
        // URL에서 코드 매개변수 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        console.log('인증 코드:', code?.substring(0, 10) + '...');
        setDebugInfo('인증 코드 확인됨');
        
        if (!code) {
          throw new Error('인증 코드가 제공되지 않았습니다.');
        }
        
        // 리다이렉트 URI 설정
        const redirectUri = `${window.location.origin}/auth/callback/google`;
        console.log('리다이렉트 URI:', redirectUri);
        
        setDebugInfo('백엔드 API 요청 준비 중...');
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const apiUrl = `${baseUrl}/api/auth/code`;
        console.log('API URL:', apiUrl);
        
        setDebugInfo('백엔드로 요청 전송 중...');

        // 백엔드 API로 인증 코드 전송
        const response = await axios.post(apiUrl, {
          provider: 'google',
          code: code,
          redirectUri: redirectUri
        });
        
        console.log('백엔드 응답:', response.data);
        setDebugInfo('백엔드 응답 처리 중...');
        
        // 응답에서 토큰 및 사용자 정보 추출
        const { accessToken, refreshToken, user } = response.data.data;
        
        console.log('토큰 정보:', { 
          accessToken: accessToken ? '있음' : '없음', 
          refreshToken: refreshToken ? '있음' : '없음',
          tokenLength: accessToken?.length
        });
        
        // 토큰이 없는 경우 오류 처리
        if (!accessToken || !refreshToken) {
          throw new Error('인증 토큰이 반환되지 않았습니다.');
        }
        
        // 토큰 저장
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // 로컬스토리지 저장 확인
        console.log('저장된 토큰 확인:', { 
          token: localStorage.getItem('token') ? '저장됨' : '저장 실패',
          refreshToken: localStorage.getItem('refreshToken') ? '저장됨' : '저장 실패'
        });
        
        // 사용자 정보 저장
        setUser(user);
        
        setDebugInfo('대시보드로 이동 중...');
        
        // 대시보드로 리다이렉트
        router.push('/dashboard');
      } catch (err: unknown) {
        console.error('Google 로그인 처리 중 오류 발생:', err);
        const errorDetail = (err as AxiosError).response?.data || (err as Error).message || '상세 정보 없음';
        setError(`인증 처리 중 오류가 발생했습니다`);
        setDebugInfo(`오류 내용: ${JSON.stringify(errorDetail)}`);
      }
    };

    handleCallback();
  }, [router, setUser]);

  return (
    <div className="p-8 text-center">
      {error ? (
        <div className="space-y-4">
          <div className="text-red-600 text-xl font-medium">로그인 오류</div>
          <p>{error}</p>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left overflow-auto">
            <p className="font-medium">디버그 정보:</p>
            <p className="font-mono text-sm whitespace-pre-wrap">{debugInfo}</p>
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg">Google 로그인 처리 중입니다...</p>
          <p className="text-sm text-gray-500">{debugInfo}</p>
        </div>
      )}
    </div>
  );
}