"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/ui/Header";
import { Sidebar } from "@/components/ui/Sidebar";
import { useIsMobile } from "@/hooks/useMobile";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <main
        className={cn(
          "transition-all duration-300",
          !isMobile && sidebarOpen ? "md:ml-[240px]" : "ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}
