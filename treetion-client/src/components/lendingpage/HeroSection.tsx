// app/components/HeroSection.tsx
import Link from 'next/link';

export default function HeroSection(): JSX.Element {
    return (
      <section className="hero-section">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
              더이상 필기하지 마요. <br />
              <span className="text-[#005DE9]">듣기만 해도 완성되는</span> <br />
              시험 대비
            </h1>
            
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              강의를 듣고, 녹음하는 것만으로 완벽한 학습 노트가 만들어져요.
              이제 필기에 쏟는 시간을 진짜 공부에 투자해요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/login" className="cta-button text-center flex items-center justify-center">
                지금 무료로 시작하기
              </Link>
              <Link href="/comingsoon" className="bg-white border-2 border-[#005DE9] text-[#005DE9] font-semibold py-4 px-8 rounded-full hover:bg-blue-50 transition-colors text-center flex items-center justify-center">
                설치하러 가기
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
}