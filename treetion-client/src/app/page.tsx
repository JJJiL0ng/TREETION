// app/page.tsx
import { Suspense } from 'react';
import HeroSection from '@/components/lendingpage/HeroSection';
import TrustSection from '@/components/lendingpage/TrustSection';
import FeatureSection from '@/components/lendingpage/FeatureSection';
import BenefitSection from '@/components/lendingpage/BenefitSection';
import CTASection from '@/components/lendingpage/CTASection';

// SSG 컴포넌트 래퍼
function StaticContent(): JSX.Element {
 return (
   <>
     <HeroSection />
     <TrustSection />
   </>
 );
}

// SSR 컴포넌트 래퍼 (애니메이션 포함)
function DynamicContent(): JSX.Element {
 return (
   <>
     <FeatureSection />
     <BenefitSection />
     <CTASection />
   </>
 );
}

// 로딩 상태
function LoadingFallback(): JSX.Element {
 return <div className="h-40 flex items-center justify-center">컨텐츠를 불러오는 중...</div>;
}

export default function Home(): JSX.Element {
 return (
   <div className="pt-16 px-0 overflow-x-hidden w-full max-w-full">
     {/* SSG 영역 */}
     <StaticContent />
     
     {/* SSR 영역 (애니메이션) */}
     <Suspense fallback={<LoadingFallback />}>
       <DynamicContent />
     </Suspense>
   </div>
 );
}

