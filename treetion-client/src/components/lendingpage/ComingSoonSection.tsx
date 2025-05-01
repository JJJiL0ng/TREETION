'use client';

import { useState, useEffect, useMemo } from 'react';
import { useIntersectionObserver } from './animation';
import { saveContact } from '../../hooks/firebase/firebase';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface ContactStatus {
  message: string;
  isError: boolean;
}

export default function ComingSoonSection(): JSX.Element {
  // 애니메이션 적용
  useIntersectionObserver();
  
  // 상태 관리
  const [copied, setCopied] = useState<boolean>(false);
  const [contactValue, setContactValue] = useState<string>('');
  const [contactStatus, setContactStatus] = useState<ContactStatus>({ message: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [remainingSpots, setRemainingSpots] = useState<number>(50);
  const [isAccessGranted, setIsAccessGranted] = useState<boolean>(false);
  
  // 특정 날짜와 시간으로 설정
  const deadline = useMemo(() => new Date('2025-04-20T00:00:00'), []);
  
  // 날짜 포맷팅 함수
  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };
  
  // 남은 시간 계산을 위한 상태
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // 카운트다운 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [deadline]);
  
  // 쿠폰 코드
  const couponCode = "EARLY2025";
  
  // 쿠폰 코드 복사 함수
  const copyCouponCode = (): void => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    
    // 3초 후에 복사 상태 리셋
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  // 연락처 제출 핸들러
  const handleSubmitContact = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!contactValue) {
      setContactStatus({ 
        message: '전화번호를 입력해주세요', 
        isError: true 
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await saveContact(contactValue, 'phone');
      
      if (result.success) {
        setContactStatus({ 
          message: '🎉 성공! 얼리 액세스 및 특별 혜택이 확정되었습니다!', 
          isError: false 
        });
        setContactValue('');
        // 남은 자리 감소
        setRemainingSpots(prev => Math.max(0, prev - 1));
        setIsAccessGranted(true);
      } else {
        setContactStatus({ 
          message: result.error || '신청 중 오류가 발생했습니다', 
          isError: true 
        });
      }
    } catch  {
      setContactStatus({ 
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요', 
        isError: true 
      });
    } finally {
      setIsSubmitting(false);
      
      // 5초 후 상태 메시지 제거
      setTimeout(() => {
        setContactStatus({ message: '', isError: false });
      }, 5000);
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-100 fade-in">
          {/* 상단 배너 */}
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg mb-8">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium text-yellow-700">
                얼리 액세스 신청 마감까지 {timeLeft.days}일 {timeLeft.hours}시간 {timeLeft.minutes}분 {timeLeft.seconds}초 남았습니다!
              </span>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-2 bg-[#005DE9] text-white text-sm font-semibold rounded-full mb-4">
              얼리 액세스 신청
            </span>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Treetion <span className="text-[#005DE9]">얼리 액세스</span> <br />특별 초대
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              단 <span className="font-bold text-[#005DE9]">{remainingSpots}명</span>만 선착순 초대합니다! 이메일을 남기시면 다음 혜택을 모두 받으실 수 있습니다.
            </p>
          </div>
          
          {/* 얼리 액세스 신청 폼 (상단 배치) */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2 text-gray-800">얼리 액세스 신청하기</h3>
              <p className="text-gray-600 text-center mb-1">
                이메일을 남기시면 다음 혜택을 모두 받으실 수 있습니다:
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 mb-4">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><b className="text-[#005DE9]">베타 테스트 우선 초대</b> (출시 1개월 전)</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><b className="text-[#005DE9]">프리미엄 플랜 30일 무료</b> (일반 출시 후 14일 대신)</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><b className="text-[#005DE9]">20% 할인</b> 혜택</span>
                </li>
              </ul>
            </div>
            
            <form onSubmit={handleSubmitContact} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="tel"
                  placeholder="전화번호를 입력하세요"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005DE9] focus:border-[#005DE9]"
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  disabled={isSubmitting}
                />
                <button 
                  type="submit" 
                  className={`bg-[#005DE9] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#004bb7] transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '처리 중...' : '얼리 액세스 신청하기'}
                </button>
              </div>
              
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500">남은 자리 <b className="text-[#005DE9]">{remainingSpots}</b>명 | 마감: {formatDate(deadline)}</p>
              </div>
            </form>
            
            {contactStatus.message && (
              <div className={`mt-3 p-3 rounded-lg ${contactStatus.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {contactStatus.message}
              </div>
            )}
            
            <p className="text-gray-500 text-sm mt-4 text-center">
              개인정보는 안전하게 보호되며, 마케팅 목적으로 사용되지 않습니다.
            </p>
          </div>
          
          {/* 설문 작성 및 커피쿠폰 받기 섹션 */}
          {isAccessGranted && (
            <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 mb-8">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2 text-gray-800">설문 작성하고 커피쿠폰 받기</h3>
                <p className="text-gray-600 text-center mb-4">
                  설문을 작성하시면 커피쿠폰을 받으실 수 있습니다.
                </p>
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLScP40JH2BHsCDm7Gf4lRupfeRMTlyWjCEMg3HVLyqASUhtf8Q/viewform?usp=dialog" 
                  className="bg-[#005DE9] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#004bb7] transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  설문 작성하기
                </a>
              </div>
            </div>
          )}
          
          {/* 프리미엄 쿠폰 섹션 (하단으로 이동) */}
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-6 shadow-md border border-indigo-200 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center text-[#005DE9] mb-2 text-3xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">VIP 프리미엄 쿠폰</h3>
              <p className="text-gray-700 text-center mb-4">
                얼리 액세스 신청자만을 위한 특별 쿠폰 코드입니다. 앱 출시 시 이 코드를 입력하세요.
              </p>
              
              <div className="relative w-full max-w-md mx-auto">
                <div className="bg-white border-2 border-indigo-300 rounded-lg p-4 font-mono text-center text-sm mb-2 flex items-center justify-center relative">
                  <span className="font-semibold tracking-wider text-gray-800">
                    {isAccessGranted ? <span className="text-lg">{couponCode}</span> : <span className="text-sm text-gray-500">얼리 액세스 신청 시 오픈</span>}
                  </span>
                  <button 
                    onClick={copyCouponCode} 
                    className={`absolute right-3 text-gray-500 hover:text-[#005DE9] transition-colors ${isAccessGranted ? '' : 'hidden'}`}
                    aria-label="쿠폰 코드 복사"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                    </svg>
                  </button>
                </div>
                {copied && (
                  <div className="text-[#005DE9] text-sm text-center">
                    쿠폰 코드가 클립보드에 복사되었습니다!
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 사용자 증언 */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
            <h4 className="font-semibold text-gray-800 mb-4 text-center">베타 테스터 후기</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-700 font-bold">JK</span>
                  </div>
                  <div>
                    <p className="font-medium">김지훈</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">Treetion으로 학습 시간을 40% 줄이면서도 더 효율적으로 공부할 수 있었습니다. 특히 시험 준비에 큰 도움이 되었어요.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <span className="text-green-700 font-bold">YJ</span>
                  </div>
                  <div>
                    <p className="font-medium">이유진</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">녹음과 동시에 정리까지 되는 기능이 정말 혁신적입니다. 학교 수업에서 놓친 내용 없이 완벽하게 정리할 수 있었어요!</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-gray-600 mb-4 sm:mb-0">
              <p>출시 예상 시기: <b>2025년 5월 중순</b></p>
              <p className="text-sm text-gray-500 mt-1">이미 <b>347명</b>의 얼리 액세스 신청자가 있습니다</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-[#005DE9] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
                
              </a>
              <a href="#" className="text-gray-600 hover:text-[#005DE9] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}