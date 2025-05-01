"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function RootHeader() {
  const pathname = usePathname();
  // 루트 경로에서만 헤더 렌더링
  if (pathname !== "/") return null;

  return (
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50 py-4">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-bold text-xl text-[#005DE9]">Treetion</span>
          </div>
          {/* 모바일 메뉴 버튼 */}
          <button
            id="menuToggle"
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="메뉴 열기"
          >
            <span className="block w-6 h-0.5 bg-gray-800"></span>
            <span className="block w-6 h-0.5 bg-gray-800"></span>
            <span className="block w-6 h-0.5 bg-gray-800"></span>
          </button>
          {/* 데스크탑 네비게이션 */}
          <div className="hidden md:flex items-center justify-between flex-1 ml-10">
            <nav>
              <ul className="flex gap-6">
                <li>
                  <a
                    href="#features"
                    className="hover:text-[#005DE9] transition-colors"
                  >
                    기능
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="hover:text-[#005DE9] transition-colors"
                  >
                    혜택
                  </a>
                </li>
                <li>
                  <a
                    href="#cta"
                    className="hover:text-[#005DE9] transition-colors"
                  >
                    시작하기
                  </a>
                </li>
              </ul>
            </nav>
            <Link
              href="/auth/login"
              className="bg-[#005DE9] text-white px-4 py-2 rounded-full hover:bg-[#004bb7] transition-colors"
            >
              무료 체험하기
            </Link>
          </div>
        </div>
        {/* 모바일 메뉴 (기본적으로 숨겨져 있음) */}
        <div id="mobileMenu" className="hidden mobile-menu mt-4 pb-2">
          <nav>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="#features"
                  className="block py-2 hover:text-[#005DE9] transition-colors"
                >
                  기능
                </a>
              </li>
              <li>
                <a
                  href="#benefits"
                  className="block py-2 hover:text-[#005DE9] transition-colors"
                >
                  혜택
                </a>
              </li>
              <li>
                <a
                  href="#cta"
                  className="block py-2 hover:text-[#005DE9] transition-colors"
                >
                  시작하기
                </a>
              </li>
              <li className="mt-2">
                <Link
                  href="/comingsoon"
                  className="w-full bg-[#005DE9] text-white px-4 py-2 rounded-full hover:bg-[#004bb7] transition-colors"
                >
                  무료 체험하기
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
