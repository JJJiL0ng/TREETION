// src/app/auth/login/layout.tsx
export const metadata = {
    title: '로그인 - 트리션',
    description: '트리션 계정으로 로그인하세요',
    // viewport 속성 제거됨
  };
  
  // 별도로 viewport export 추가
  export const viewport = {
    width: 'device-width',
    initialScale: 1,
  };
  
  export default function LoginLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div>
        {children}
      </div>
    );
  }