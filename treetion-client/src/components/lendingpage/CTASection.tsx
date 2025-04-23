// app/components/CTASection.tsx
'use client';
import Link from 'next/link';
import { useIntersectionObserver, useTypingEffect } from './animation';

interface CTAPoint {
  id: number;
  text: string;
  icon: string;
}

export default function CTASection(): JSX.Element {
  // 애니메이션 적용
  useIntersectionObserver();
  
  // 타이핑 효과 적용
  useTypingEffect('typing-text', '지금 바로 무료로 시작하고 필기의 혁명을 경험하세요!', 50);

  // CTA 문구 데이터
  const ctaPoints: CTAPoint[] = [
    {
      id: 1,
      text: "14일 무료 프리미엄 체험",
      icon: "🎁"
    },
    {
      id: 2,
      text: "1분 만에 가입하고 첫 강의 녹음",
      icon: "⏱️"
    },
    {
      id: 3,
      text: "시험 기간 특별 할인 적용",
      icon: "💰"
    },
    {
      id: 4,
      text: "만족도 4.8/5.0, 재사용률 93%",
      icon: "⭐"
    }
  ];

  return (
    <section id="cta" className="py-20">
      <div className="container mx-auto px-6">
        <div className="bg-gradient-to-r from-[#005DE9] to-[#004bb7] rounded-3xl p-8 md:p-12 shadow-xl text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 fade-in">
              강의 녹음의 혁명,<br />지금 시작하세요
            </h2>
            
            <div className="h-12 mb-8 font-mono">
              <span id="typing-text" className="text-lg"></span>
              <span className="animate-pulse">|</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {ctaPoints.map((point) => (
                <div key={point.id} className="stagger-item flex items-center bg-white/10 rounded-lg p-4">
                  <span className="text-2xl mr-3">{point.icon}</span>
                  <span className="text-lg">{point.text}</span>
                </div>
              ))}
            </div>
            
            <div className="fade-in">
              <Link href="/comingsoon" className="bg-white text-[#005DE9] text-lg font-bold py-4 px-8 rounded-full hover:bg-gray-100 transition shadow-lg hover:scale-105 text-center flex items-center justify-center">
                지금 무료로 시작하기
              </Link>
              
              <p className="mt-4 text-sm text-white/80">
                이미 <strong>10,000명</strong> 이상의 학생들이 선택한 학습 파트너
              </p>
            </div>
            
            {/* 앱 스토어 배지 */}
            <div className="mt-10 flex justify-center space-x-4 fade-in">
              <Link href="/comingsoon" className="bg-black text-white py-2 px-4 rounded-lg flex items-center justify-center w-40 h-14">
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5"></path>
                    <path d="M16 19h6"></path>
                    <path d="M19 16v6"></path>
                  </svg>
                </span>
                <div className="text-left">
                  <div className="text-xs">다운로드하기</div>
                  <div className="text-sm font-semibold">Apple Store</div>
                </div>
              </Link>
              
              <Link href="/comingsoon" className="bg-black text-white py-2 px-4 rounded-lg flex items-center justify-center w-40 h-14">
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </span>
                <div className="text-left">
                  <div className="text-xs">다운로드하기</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}