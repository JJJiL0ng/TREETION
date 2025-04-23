// app/components/FeatureSection.tsx
'use client';

import { useIntersectionObserver } from './animation';

interface Feature {
    id: number;
    icon: string;
    title: string;
    description: string;
}

export default function FeatureSection(): JSX.Element {
    // 애니메이션 적용
    useIntersectionObserver();

    // 핵심 기능 데이터
    const features: Feature[] = [
        {
            id: 1,
            icon: "🎙️",
            title: "녹음 → 텍스트 변환 → 구조화 → AI 요약, 모든 과정이 자동으로",
            description: "강의 녹음부터 최종 노트까지 모든 과정이 자동화되어 학습에만 집중할 수 있습니다."
        },
        {
            id: 2,
            icon: "🌳",
            title: "트리 구조로 한눈에 보는 강의 핵심 내용",
            description: "복잡한 강의 내용도 트리 구조로 정리되어 핵심을 쉽게 파악하고 기억할 수 있습니다."
        },
        {
            id: 3,
            icon: "💾",
            title: "잊어버린 내용도 걱정 없이, 모든 강의를 완벽히 기록",
            description: "모든 강의 내용이 자동으로 저장되고 검색 가능해 필요할 때 언제든지 찾아볼 수 있습니다."
        },
        {
            id: 4,
            icon: "🔄",
            title: "오프라인에서도 끊김 없는 필기, 재연결 시 자동 동기화",
            description: "인터넷 연결이 불안정해도 녹음이 중단되지 않으며, 연결 시 자동으로 동기화됩니다."
        }
    ];

    return (
        <section id="features" className="py-20 bg-white relative">
            {/* 배경 디자인 요소 */}
            <div className="absolute top-0 left-0 w-4 h-32 bg-[#005DE9] opacity-20 rounded-r-full"></div>
            <div className="absolute bottom-0 right-0 w-4 h-32 bg-[#005DE9] opacity-20 rounded-l-full"></div>
            <div className="absolute top-1/4 right-12 w-16 h-16 border-4 border-blue-200 rounded-full opacity-30"></div>
            <div className="absolute bottom-1/4 left-12 w-8 h-8 bg-blue-200 rounded-full opacity-30"></div>
            
            <div className="container mx-auto px-6 relative">
                <div className="text-center mb-16 fade-in">
                    <div className="inline-block relative mb-4">
                        <h2 className="text-3xl font-bold">
                            <span className="text-[#005DE9]">Treetion</span>의 강력한 기능
                        </h2>
                        <div className="h-1 w-24 bg-[#005DE9] mx-auto mt-2 rounded-full"></div>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        강의 필기의 혁명, Treetion만의 특별한 기능들을 살펴보아요.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div key={feature.id} className="benefit-card stagger-item p-6 relative overflow-hidden">
                            {/* 카드 코너 장식 */}
                            <div className="absolute top-0 left-0 w-20 h-1 bg-[#005DE9] opacity-80"></div>
                            <div className="absolute top-0 left-0 w-1 h-20 bg-[#005DE9] opacity-80"></div>
                            
                            <div className="flex items-start mb-4">
                                <div className="feature-icon flex-shrink-0 relative">
                                    <span className="text-3xl relative z-10">{feature.icon}</span>
                                    <div className="absolute inset-0 bg-blue-100 rounded-full transform -rotate-12 scale-90"></div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 ml-4 pt-3 border-b-2 border-blue-200 pb-2">{feature.title}</h3>
                            </div>
                            <p className="text-gray-600 pl-4 border-l border-blue-100">{feature.description}</p>
                            
                            {/* 카드 번호 */}
                            <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <span className="text-[#005DE9] font-bold">{index + 1}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 기능 데모 애니메이션 */}
                <div className="mt-20 fade-in relative">
                    <div className="benefit-card overflow-hidden border-t-4 border-[#005DE9]">
                        <div className="absolute top-1/2 right-0 w-24 h-24 bg-blue-50 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-12 w-16 h-16 border-2 border-blue-200 rounded-full transform -translate-y-1/2 opacity-50"></div>
                        
                        <div className="flex items-center mb-4 relative z-10">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                            <div className="w-3 h-3 rounded-full bg-[#005DE9]"></div>
                            <div className="ml-4 text-gray-600 font-medium">Treetion 실시간 변환 데모</div>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-lg font-mono text-sm relative z-10">
                            <div className="text-blue-400 mb-2"># 녹음 중...</div>
                            <div className="text-gray-300">
                                <p className="mb-1">&gt; 오늘 강의에서는 세 가지 중요한 개념을 배웠습니다.</p>
                                <p className="mb-1">&gt; 첫째, 반응 속도 이론에 대해 학습했습니다.</p>
                                <p className="mb-1">&gt; 둘째, 촉매의 역할과 종류를 살펴보았습니다.</p>
                                <p className="mb-1">&gt; 셋째, 화학 평형 상태에 대해 논의했습니다.</p>
                            </div>
                            <div className="mt-4">
                                <p className="text-[#4d94ff] mb-2"># AI 구조화 중...</p>
                                <pre className="text-yellow-300 pl-4 border-l-2 border-[#005DE9]">
                                    {`● 오늘의 강의
  ├─ 반응 속도 이론
  ├─ 촉매
  │  ├─ 역할
  │  └─ 종류
  └─ 화학 평형 상태`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}