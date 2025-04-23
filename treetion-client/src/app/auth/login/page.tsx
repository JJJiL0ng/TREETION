'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleButton from '@/components/auth/GoogleButton';
import { useUserStore } from '@/store/user-store';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * 사용자 인증 상태를 조회하는 훅
   */
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  useEffect(() => {
    // 사용자가 이미 인증되어 있으면 대시보드로 리디렉션
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 실제 구현에서는 서버에 데모 로그인 요청을 보내고 응답을 처리합니다
      // 여기서는 단순히 대시보드로 리다이렉트하는 것으로 대체합니다
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch {
      setError('데모 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

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
        <GoogleButton isLoading={isLoading} />
        
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