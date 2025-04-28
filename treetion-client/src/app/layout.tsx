// app/layout.tsx
import './globals.css';
import Link from 'next/link';
import { Analytics } from "@vercel/analytics/react";
import { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Treetion - 녹음을 통한 효율적인 학습',
 description: '녹음만으로 강의 내용을 자동으로 구조화하고 요약해주는 학습 도구',
 keywords: '학습, 녹음, AI, 노트, 요약, 강의, 시험 대비',
 viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

interface RootLayoutProps {
 children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
 return (
   <html lang="ko" className="overflow-x-hidden">
     <head>
       <link 
         rel="stylesheet" 
         href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" 
       />
       <meta name="theme-color" content="#005DE9" />
     </head>
     <body className="overflow-x-hidden w-full">
       <header className="fixed top-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50 py-4">
         <div className="container mx-auto px-6">
           <div className="flex justify-between items-center">
             <div className="flex items-center">
               <span className="font-bold text-xl text-[#005DE9]">Treetion</span>
             </div>
             
             {/* 모바일 메뉴 버튼 */}
             <button id="menuToggle" className="md:hidden flex flex-col gap-1.5 p-2" aria-label="메뉴 열기">
               <span className="block w-6 h-0.5 bg-gray-800"></span>
               <span className="block w-6 h-0.5 bg-gray-800"></span>
               <span className="block w-6 h-0.5 bg-gray-800"></span>
             </button>
             
             {/* 데스크탑 네비게이션 */}
             <div className="hidden md:flex items-center justify-between flex-1 ml-10">
               <nav>
                 <ul className="flex gap-6">
                   <li><a href="#features" className="hover:text-[#005DE9] transition-colors">기능</a></li>
                   <li><a href="#benefits" className="hover:text-[#005DE9] transition-colors">혜택</a></li>
                   <li><a href="#cta" className="hover:text-[#005DE9] transition-colors">시작하기</a></li>
                 </ul>
               </nav>
               <Link href="/auth/login" className="bg-[#005DE9] text-white px-4 py-2 rounded-full hover:bg-[#004bb7] transition-colors">
                 무료 체험하기
               </Link>
             </div>
           </div>
           
           {/* 모바일 메뉴 (기본적으로 숨겨져 있음) */}
           <div id="mobileMenu" className="hidden mobile-menu mt-4 pb-2">
             <nav>
               <ul className="flex flex-col gap-3">
                 <li><a href="#features" className="block py-2 hover:text-[#005DE9] transition-colors">기능</a></li>
                 <li><a href="#benefits" className="block py-2 hover:text-[#005DE9] transition-colors">혜택</a></li>
                 <li><a href="#cta" className="block py-2 hover:text-[#005DE9] transition-colors">시작하기</a></li>
                 <li className="mt-2">
                   <Link href="/comingsoon" className="w-full bg-[#005DE9] text-white px-4 py-2 rounded-full hover:bg-[#004bb7] transition-colors">
                     무료 체험하기
                   </Link>
                 </li>
               </ul>
             </nav>
           </div>
         </div>
       </header>
       
       <main className="pt-20">{children}</main>
       
       <footer className="bg-gray-100 py-8 mt-12">
         <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-center mb-6">
             <div className="flex items-center mb-4 md:mb-0">
               <span className="font-bold text-xl text-[#005DE9]">Treetion</span>
             </div>
             <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
               <a href="#" className="text-gray-600 hover:text-[#005DE9] transition-colors">이용약관</a>
               <a href="#" className="text-gray-600 hover:text-[#005DE9] transition-colors">개인정보처리방침</a>
               <a href="#" className="text-gray-600 hover:text-[#005DE9] transition-colors">고객센터</a>
             </div>
           </div>
           <div className="text-center text-gray-500 text-sm">
             &copy; {new Date().getFullYear()} Treetion. All rights reserved.
           </div>
         </div>
       </footer>
       
       <script dangerouslySetInnerHTML={{
         __html: `
           (function() {
             if (typeof window !== 'undefined') {
               window.addEventListener('load', function() {
                 const menuToggle = document.getElementById('menuToggle');
                 const mobileMenu = document.getElementById('mobileMenu');
                 
                 if (menuToggle && mobileMenu) {
                   menuToggle.addEventListener('click', function() {
                     mobileMenu.classList.toggle('hidden');
                   });
                 }
               });
             }
           })();
         `
       }} />
       <Analytics />
     </body>
   </html>
 );
}