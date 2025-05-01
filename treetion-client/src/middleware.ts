// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호된 경로 목록
const protectedPaths = [
  '/dashboard',
  '/recorder',
  '/ai-process',
  '/notes',
  '/tree',
  '/svg',
];

// 공개 경로 목록
const publicPaths = [
  '/',
  '/auth/login',
  '/callback/google',
];

// 경로가 보호된 경로인지 확인
const isProtectedPath = (path: string): boolean => {
  return protectedPaths.some(protectedPath => path.startsWith(protectedPath));
};

// 경로가 공개 경로인지 확인
const isPublicPath = (path: string): boolean => {
  return publicPaths.some(publicPath => path === publicPath || path.startsWith(`${publicPath}/`));
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('미들웨어 실행: 현재 경로 =', pathname);
  console.log('요청 URL 전체:', request.url);
  
  // API 경로는 처리하지 않음
  if (pathname.startsWith('/api')) {
    console.log('API 경로 감지, 미들웨어 건너뜀');
    return NextResponse.next();
  }
  
  // `/login` 경로를 `/auth/login`으로 영구 리다이렉트
  if (pathname === '/login') {
    console.log('`/login` 경로 감지, `/auth/login`으로 리다이렉트');
    const loginUrl = new URL('/auth/login', request.url);
    // 원래 URL의 쿼리 파라미터 전달
    const params = new URL(request.url).searchParams;
    params.forEach((value, key) => {
      loginUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(loginUrl);
  }
  
  // 쿠키에서 토큰 확인 (클라이언트 측 localStorage 대신 서버 측에서 쿠키 사용)
  // 참고: 실제로는 서버에서 localStorage에 직접 접근할 수 없습니다.
  // 여기서는 미들웨어에서 쿠키 기반 인증 확인을 합니다.
  const accessToken = request.cookies.get('treetion_access_token')?.value;
  console.log('쿠키 토큰 확인:', accessToken ? '토큰 있음' : '토큰 없음');
  const isLoggedIn = !!accessToken; // 더 정확한 검증은 토큰 디코딩 및 만료 확인이 필요
  
  // 보호된 경로에 인증되지 않은 사용자 접근 차단
  if (isProtectedPath(pathname) && !isLoggedIn) {
    console.log('보호된 경로 접근 시도, 로그인 페이지로 리다이렉트:', pathname);
    const url = new URL('/auth/login', request.url);
    
    // URL인코딩 없이 원래 URL을 callbackUrl로 설정
    url.searchParams.set('callbackUrl', pathname);
    console.log('리다이렉트 URL:', url.toString());
    return NextResponse.redirect(url);
  }
  
  // 로그인된 사용자가 로그인 페이지 접근 시 대시보드로 리다이렉트 (선택적)
  if (pathname === '/auth/login' && isLoggedIn) {
    console.log('로그인된 사용자가 로그인 페이지 접근, 대시보드로 리다이렉트');
    
    // callbackUrl이 있으면 해당 URL로 리다이렉트, 없으면 대시보드로 리다이렉트
    const callbackUrl = new URL(request.url).searchParams.get('callbackUrl');
    const redirectUrl = callbackUrl || '/dashboard';
    console.log('리다이렉트 URL:', redirectUrl);
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
  
  console.log('미들웨어 검사 통과, 다음 단계로 진행');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 아래 경로에 미들웨어를 적용:
     * - /dashboard, /recorder, /ai-process, /notes, /tree, /svg로 시작하는 모든 경로
     * - / (홈 페이지)
     * - /auth/login
     * - /callback/google 경로
     */
    '/dashboard/:path*',
    '/recorder/:path*',
    '/ai-process/:path*',
    '/notes/:path*',
    '/tree/:path*',
    '/svg/:path*',
    '/',
    '/auth/login',
    '/callback/:path*',
    '/login', // '/login' 경로도 미들웨어에서 처리하도록 추가
  ],
};