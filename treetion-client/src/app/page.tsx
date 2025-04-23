import Link from 'next/link';


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <header className="fixed w-full bg-white/90 backdrop-blur-sm z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboards?id=${id}" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[var(--primary)]">트리션</h1>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/dashboard" className="font-medium hover:text-[var(--primary)]">
              대시보드
            </Link>
            <Link href="/recorder" className="font-medium hover:text-[var(--primary)]">
              녹음하기
            </Link>
            <Link href="/transcript" className="font-medium hover:text-[var(--primary)]">
              텍스트 변환
            </Link>
            <Link href="/tree" className="font-medium hover:text-[var(--primary)]">
              트리 구조화
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="font-medium hover:text-[var(--primary)] hidden md:block">
              로그인 / 회원가입
            </Link>
            <button className="md:hidden focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="hero-section pt-24">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
              <span className="text-[var(--primary)]">음성</span>을 똑똑하게 <span className="text-[var(--primary)]">AI</span>가 필기해 주는 서비스
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              강의, 회의, 아이디어를 말하기만 하세요. 트리션이 텍스트로 변환하고 트리 구조로 정리해 드립니다.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/recorder" className="cta-button">
                지금 바로 시작하기
              </Link>
              <Link href="#features" className="bg-white text-[var(--primary)] font-semibold py-4 px-8 rounded-full border border-[var(--primary-light)] hover:bg-gray-50 transition duration-300">
                서비스 더 알아보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">트리션의 주요 기능</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* 기능 1 */}
            <div className="p-6 bg-white rounded-xl shadow-md transition-transform hover:scale-105">
              <div className="feature-icon mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">실시간 음성 녹음</h3>
              <p className="text-gray-600 text-center">
                브라우저에서 바로 녹음하고 저장할 수 있습니다. 외부 녹음 도구가 필요 없어요.
              </p>
            </div>
            
            {/* 기능 2 */}
            <div className="p-6 bg-white rounded-xl shadow-md transition-transform hover:scale-105">
              <div className="feature-icon mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">정확한 STT 변환</h3>
              <p className="text-gray-600 text-center">
                고급 AI 모델로 음성을 정확하게 텍스트로 변환합니다. 한국어에 최적화되어 있습니다.
              </p>
            </div>
            
            {/* 기능 3 */}
            <div className="p-6 bg-white rounded-xl shadow-md transition-transform hover:scale-105">
              <div className="feature-icon mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">트리 구조화</h3>
              <p className="text-gray-600 text-center">
                변환된 텍스트를 AI가 자동으로 트리 구조로 정리하여 정보를 체계적으로 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 사용 예시 섹션 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">이럴 때 트리션을 사용해보세요</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* 예시 1 */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-[var(--primary-light)] text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">학습 및 강의 정리</h3>
                <p className="text-gray-600 mb-4">
                  온라인 강의, 오프라인 강의, 세미나 등에서 녹음만 하세요. 
                  트리션이 주요 내용을 체계적으로 정리해 드립니다.
                </p>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500 italic">
                    컴퓨터공학 수업을 들으면서 트리션으로 녹음했더니 알고리즘 개념이 트리 구조로 
                    깔끔하게 정리되어서 복습이 훨씬 쉬워졌어요!
                  </p>
                </div>
              </div>
            </div>
            
            {/* 예시 2 */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-[var(--primary-light)] text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">회의 및 인터뷰 기록</h3>
                <p className="text-gray-600 mb-4">
                  중요한 회의나 인터뷰 내용을 놓치지 마세요. 
                  트리션이 모든 대화를 기록하고 핵심 내용을 구조화합니다.
                </p>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500 italic">
                    팀 회의 때마다 트리션을 사용해서 모든 결정사항과 할일을 자동으로 정리해요. 
                    이제 회의록 작성으로 시간을 낭비하지 않아도 돼요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 bg-[var(--primary)]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">지금 바로 시작해보세요</h2>
          <p className="text-white text-xl mb-8 max-w-2xl mx-auto">
            무료 체험으로 트리션의 강력한 기능을 경험해보세요. 
            복잡한 설정 없이 바로 사용할 수 있습니다.
          </p>
          <Link href="/recorder" className="bg-white text-[var(--primary)] font-bold py-4 px-8 rounded-full hover:bg-gray-100 transition duration-300 inline-block">
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">트리션</h3>
              <p className="text-gray-400">
                음성을 텍스트로, 텍스트를 트리로.
                여러분의 생각을 체계적으로 정리하는 AI 필기 서비스입니다.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">서비스</h4>
              <ul className="space-y-2">
                <li><Link href="/recorder" className="text-gray-400 hover:text-white">음성 녹음</Link></li>
                <li><Link href="/transcript" className="text-gray-400 hover:text-white">텍스트 변환</Link></li>
                <li><Link href="/tree" className="text-gray-400 hover:text-white">트리 구조화</Link></li>
                <li><Link href="/svg" className="text-gray-400 hover:text-white">SVG 생성</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">회사</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">소개</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white">요금제</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white">자주 묻는 질문</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">문의하기</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">문의</h4>
              <p className="text-gray-400 mb-2">이메일: info@treetion.com</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>© 2025 트리션(Treetion). All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}