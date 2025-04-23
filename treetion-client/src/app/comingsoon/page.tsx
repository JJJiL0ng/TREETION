// app/comingsoon/page.tsx
import ComingSoonSection from '@/components/lendingpage/ComingSoonSection';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Treetion - 학습 혁명 | 얼리 액세스 특별 초대',
  description: '단 50명만 초대합니다! 얼리 액세스에 참여하고 베타 테스트, 45일 무료 이용권, 평생 20% 할인 혜택을 모두 받으세요.',
};

export default function ComingSoonPage(): JSX.Element {
  return (
    <div className="min-h-screen pt-16 pb-10 flex flex-col overflow-x-hidden w-full bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-6 mb-8">
        <div className="text-center">
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium mb-4">
            단 50명 선착순 초대
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            <span className="text-[#005DE9]">Treetion</span> 얼리 액세스
          </h1>
          <p className="text-gray-700 max-w-2xl mx-auto text-lg">
            <span className="font-medium">30일 무료 프리미엄 + 20% 할인 혜택</span>을 지금 신청하세요
          </p>
          
          <div className="flex justify-center mt-6 mb-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-700">이미 <b>347명</b>이 대기 중입니다 · 평균 학습 효율 <b>37% 향상</b></span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-[#005DE9] mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">베타 테스트 우선 초대</h3>
              <p className="text-gray-600 text-sm mt-1">출시 1개월 전부터 베타 테스트에 참여할 수 있습니다</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-[#005DE9] mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">30일 무료 프리미엄</h3>
              <p className="text-gray-600 text-sm mt-1">일반 사용자 보다 더 긴 무료 체험 기간</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-[#005DE9] mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">평생 20% 할인</h3>
              <p className="text-gray-600 text-sm mt-1">얼리 액세스 참여자만의 특별 혜택입니다</p>
            </div>
          </div>
        </div>
      </div>
      
      <ComingSoonSection />
      
      {/* 트리노트 특징 섹션 */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Treetion으로 <span className="text-[#005DE9]">학습을 혁신</span>하세요
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#005DE9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">실시간 녹음 및 요약</h3>
                  <p className="text-gray-600">강의나 회의 녹음을 자동으로 텍스트화하고 핵심 요약을 제공합니다</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#005DE9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">AI 지식 구조화</h3>
                  <p className="text-gray-600">복잡한 개념을 트리 구조로 체계화하여 학습 효율을 높입니다</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#005DE9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">스마트 복습 기능</h3>
                  <p className="text-gray-600">잊어버리기 쉬운 시점에 맞춰 개인화된 복습 알림을 제공합니다</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#005DE9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">멀티 디바이스 동기화</h3>
                  <p className="text-gray-600">모든 기기에서 끊김 없이 학습 내용을 이어서 확인할 수 있습니다</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ 섹션 */}
      <div className="container mx-auto px-6 py-6 bg-gray-50 rounded-xl max-w-4xl mb-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">자주 묻는 질문</h2>
        
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-1">Treetion는 언제 출시되나요?</h3>
            <p className="text-gray-600">2025년 5월 중순에 정식 출시 예정이며, 얼리 액세스 신청자는 4월 중순부터 베타 테스트에 참여하실 수 있습니다.</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-1">얼리 액세스 혜택은 무엇인가요?</h3>
            <p className="text-gray-600">베타 테스트 우선 초대, 30일 무료 프리미엄 이용권, 20% 할인 혜택을 모두 제공해 드립니다. 이는 한정된 인원에게만 제공되는 특별 혜택입니다.</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-1">다른 노트 앱과 무엇이 다른가요?</h3>
            <p className="text-gray-600">Treetion은 편리한 필기와 함께 녹음을 통해 동시에 AI가 내용을 정리하고, 지식을 트리 구조로 체계화하여 학습 효율을 높이는 유일한 앱입니다. 복잡한 개념도 명확하게 이해할 수 있습니다.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <div className="container mx-auto px-6 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <span className="text-gray-500 text-sm">© 2025 Treetion. All rights reserved.</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-[#005DE9] hover:text-[#004bb7] transition-colors md:mr-6 mb-3 md:mb-0"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
              메인 페이지로 돌아가기
            </Link>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-[#005DE9]">개인정보 처리방침</a>
              <a href="#" className="text-gray-500 hover:text-[#005DE9]">이용약관</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}