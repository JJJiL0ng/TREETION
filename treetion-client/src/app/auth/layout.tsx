import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: '로그인 | 트리션',
  description: '트리션 - 음성 STT 기반 AI 필기 서비스의 로그인 페이지입니다.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 섹션 - 로고와 설명 */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="트리션 로고"
              width={180}
              height={60}
              className="invert"
            />
          </div>
          <h1 className="text-4xl font-bold mb-6">
            음성을 텍스트로, 텍스트를 트리로
          </h1>
          <p className="text-xl">
            트리션은 강의, 회의, 아이디어를 쉽게 기록하고 체계적으로 정리할 수 있는
            AI 기반 필기 서비스입니다.
          </p>
        </div>
      </div>

      {/* 오른쪽 섹션 - 인증 폼 */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-6">
        <div className="max-w-md w-full">
          <div className="mb-6 text-center lg:hidden">
            <Image
              src="/logo.png"
              alt="트리션 로고"
              width={140}
              height={45}
              className="inline-block"
            />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}