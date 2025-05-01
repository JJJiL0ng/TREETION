// app/components/TrustSection.tsx
import React from 'react';

interface TrustPhrase {
    id: number;
    title: string;
    description: string;
  }
  
  export default function TrustSection(): JSX.Element {
      // 신뢰 구축 문구 데이터
      const trustPhrases: TrustPhrase[] = [
        {
          id: 1,
          title: "강의는 듣기만 하세요. 필기는 Treetion가 완성합니다",
          description: "Treetion가 녹음된 강의를 텍스트로 변환하고 구조화된 노트로 정리해드립니다."
        },
        {
          id: 2, 
          title: "녹음 한 번으로 완성되는 완벽한 학습 노트",
          description: "강의를 듣는 동안 녹음만 하세요. 나머지는 Treetion가 모두 처리합니다."
        },
        {
          id: 3,
          title: "시험기간의 새로운 비밀 무기, Treetion",
          description: "이미 10,000명 이상의 학생들이 시험 대비에 Treetion를 활용하고 있습니다."
        },
        {
          id: 4,
          title: "두 배 빠른 학습, 절반의 노력. 녹음만으로 시험 완벽 대비",
          description: "필기 시간을 80% 줄이고, 학습 효율을 2배 높이세요."
        }
      ];
    
      return (
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                <span className="text-[#005DE9]">Treetion</span>으로 완벽한 학습
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                학생들이 직접 경험하고 검증한 혁신적인 학습 도구, Treetion이 학습 효율을 높이는 방법을 알아봐요.
              </p>
            </div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {trustPhrases.map((phrase) => (
                <div key={phrase.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#005DE9]">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{phrase.title}</h3>
                  <p className="text-gray-600">{phrase.description}</p>
                </div>
              ))}
            </div>
    
            <div className="mt-16 text-center">
              <div className="inline-flex items-center px-6 py-3 bg-blue-100 text-[#005DE9] rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>국내 상위 10개 대학 학생들이 추천하는 앱</span>
              </div>
            </div>
          </div>
        </section>
      );
  }