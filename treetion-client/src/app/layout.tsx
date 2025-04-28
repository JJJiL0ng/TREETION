// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { Metadata } from "next";
import RootHeader from "@/components/RootHeader";

export const metadata: Metadata = {
  title: "Treetion - 녹음을 통한 효율적인 학습",
  description:
    "녹음만으로 강의 내용을 자동으로 구조화하고 요약해주는 학습 도구",
  keywords: "학습, 녹음, AI, 노트, 요약, 강의, 시험 대비",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
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
        <RootHeader />
        <main className="pt-20">{children}</main>

        <footer className="bg-gray-100 py-8 mt-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <span className="font-bold text-xl text-[#005DE9]">
                  Treetion
                </span>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
                <a
                  href="#"
                  className="text-gray-600 hover:text-[#005DE9] transition-colors"
                >
                  이용약관
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:text-[#005DE9] transition-colors"
                >
                  개인정보처리방침
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:text-[#005DE9] transition-colors"
                >
                  고객센터
                </a>
              </div>
            </div>
            <div className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Treetion. All rights reserved.
            </div>
          </div>
        </footer>

        <script
          dangerouslySetInnerHTML={{
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
         `,
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
