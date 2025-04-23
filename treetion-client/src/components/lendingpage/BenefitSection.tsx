// app/components/BenefitSection.tsx
'use client';

import { useIntersectionObserver, useCountUp } from './animation';

interface Stat {
  id: string;
  label: string;
  value: string;
  unit: string;
}

interface Benefit {
  id: number;
  title: string;
  description: string;
  icon: string;
  stats?: Stat[];
  image?: string;
}

export default function BenefitSection(): JSX.Element {
  // 애니메이션 적용
  useIntersectionObserver();

  // 카운트업 애니메이션 적용
  useCountUp('save-time-percent', 80);
  useCountUp('efficiency-multiplier', 2);
  useCountUp('gpa-increase', 0.5);
  useCountUp('satisfaction-rate', 96);

  // 사용자 혜택 데이터
  const benefits: Benefit[] = [
    {
      id: 1,
      title: "시간 절약",
      description: "필기 시간 80% 감소, 학습 효율 2배 향상으로 보다 효과적인 시간 활용이 가능합니다.",
      icon: "⏱️",
      stats: [
        { id: 'save-time-percent', label: '필기 시간 감소', value: '80', unit: '%' },
        { id: 'efficiency-multiplier', label: '학습 효율 향상', value: '2', unit: '배' }
      ]
    },
    {
      id: 2,
      title: "스트레스 감소",
      description: "필기 걱정 없이 강의에만 집중하여 학습의 질을 높이고 스트레스를 줄일 수 있습니다.",
      icon: "🧘",
      image: "/images/benefit-stress-reduction.jpg"
    },
    {
      id: 3,
      title: "기억력 향상",
      description: "트리 구조로 정리된 내용으로 효과적인 기억이 가능하며, 복습 시간이 단축됩니다.",
      icon: "🧠",
      image: "/images/benefit-memory.jpg"
    },
    {
      id: 4,
      title: "시험 성적 향상",
      description: "AI 요약과 문제 생성으로 효율적인 시험 대비가 가능하여 성적 향상에 도움됩니다.",
      icon: "📈",
      stats: [
        { id: 'gpa-increase', label: '평균 GPA 상승', value: '0.5', unit: '점' },
        { id: 'satisfaction-rate', label: '사용자 만족도', value: '96', unit: '%' }
      ]
    }
  ];

  return (
    <section id="benefits" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 fade-in">
          <h2 className="text-3xl font-bold mb-4">
            <span className="text-[#005DE9]">Treetion</span>은 이러한 혜택을 제공해요
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            단순한 필기 도구를 넘어, 학습 효율과 성적 향상까지 이끄는 Treetion의 놀라운 혜택들을 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="benefit-card stagger-item">
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">{benefit.title}</h3>
              <p className="text-gray-600 mb-4">{benefit.description}</p>
              
              {/* 통계 표시 */}
              {benefit.stats && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {benefit.stats.map((stat) => (
                    <div key={stat.id} className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <div className="flex items-center justify-center">
                        <span id={stat.id} className="text-3xl font-bold text-[#005DE9]">{stat.value}</span>
                        <span className="text-xl text-[#005DE9]">{stat.unit}</span>
                      </div>
                      <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 이미지 표시 */}
              {benefit.image && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  {/* <img src={benefit.image} alt={benefit.title} className="w-full h-auto" /> */}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 사용자 후기 */}
        <div className="mt-20 fade-in">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl">👨‍🎓</span>
              </div>
              <div>
                <h4 className="font-bold">김준호 / 서울대학교 컴퓨터공학과</h4>
                <div className="flex text-yellow-400">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 italic">
              Treetion는 정말 게임 체인저였습니다. 전공 수업에서 복잡한 알고리즘을 설명할 때도 
              완벽하게 필기를 자동화해주어 이해에만 집중할 수 있었습니다. 덕분에 중간고사에서 A+를 받을 수 있었어요!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}