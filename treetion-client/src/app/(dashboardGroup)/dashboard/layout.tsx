"use client";

import { useSidebarStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils/util";
import { Header } from "@/components/ui/Header";
import { Sidebar } from "@/components/ui/Sidebar";
import { useIsMobile } from "@/hooks/mobile/useMobile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const { isOpen, toggle, setOpen } = useSidebarStore();

  return (
    <div className="min-h-screen">
      <Header toggleSidebar={toggle} />
      <Sidebar isOpen={isOpen} onClose={() => setOpen(false)} />
      <main
        className={cn(
          "transition-all duration-300",
          !isMobile && isOpen ? "md:ml-[240px]" : "ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}
