"use client";

import { useSidebarStore } from "@/store/sidebar-store";

export default function Footer() {
  const isSidebarOpen = useSidebarStore((s) => s.isOpen);

  return (
    <footer
      className={`bg-gray-100 py-8 mt-12 transition-all duration-300 ${
        isSidebarOpen ? "md:ml-[240px]" : "ml-0"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="font-bold text-xl text-[#005DE9]">Treetion</span>
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
  );
}
