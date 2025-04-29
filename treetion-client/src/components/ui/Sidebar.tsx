"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "./button";
import Link from "next/link";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  FileAudio,
  FileText,
  Folder,
  Home,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback } from "./avatar";
import { useIsMobile } from "@/hooks/useMobile";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href} className="block">
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className="w-full justify-start px-3 py-2 h-auto"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
      </Button>
    </Link>
  );
}

interface FolderItemProps {
  color: string;
  label: string;
}

function FolderItem({ color, label }: FolderItemProps) {
  const colorMap = {
    orange: "bg-orange-200",
    green: "bg-green-200",
    blue: "bg-blue-200",
  };

  return (
    <Button variant="ghost" className="w-full justify-start px-3 py-2 h-auto">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-3 w-3 rounded-sm",
            colorMap[color as keyof typeof colorMap]
          )}
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Button>
  );
}

export function Sidebar({ isOpen, className, onClose }: SidebarProps) {
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const isMobile = useIsMobile();

  const toggleFolders = () => {
    setFoldersExpanded(!foldersExpanded);
  };

  // Close sidebar when pressing escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed top-16 bottom-0 left-0 w-[240px] border-r bg-background transition-transform duration-300 z-30",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* 메인 메뉴 */}
        <div
          className={cn(
            "flex-1 overflow-auto py-2",
            isMobile ? "h-[calc(100%-60px)]" : "h-full"
          )}
        >
          <nav className="flex flex-col gap-0.5 px-2">
            {/* 메인 네비게이션 */}
            <NavItem
              href="/dashboard"
              icon={<Home className="h-5 w-5" />}
              label="대시보드"
              isActive={true}
            />
            <NavItem
              href="/dashboard/voice-writing"
              icon={<FileAudio className="h-5 w-5" />}
              label="음성 필기"
            />
            <NavItem
              href="/ai-quiz"
              icon={<Brain className="h-5 w-5" />}
              label="AI 퀴즈"
            />
            <NavItem
              href="/note"
              icon={<FileText className="h-5 w-5" />}
              label="노멀노트"
            />
            <NavItem
              href="/setting"
              icon={<Settings className="h-5 w-5" />}
              label="설징"
            />

            {/* 구분선 */}
            <div className="my-2 border-t border-border" />

            {/* 폴더 섹션 */}
            <div className="mb-1">
              <Button
                variant="ghost"
                onClick={toggleFolders}
                className="w-full justify-between px-3 py-2 h-auto"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5" />
                  <span className="text-sm font-medium">수업 폴더</span>
                </div>
                {foldersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 폴더 목록은 아직 구현 안됨 */}
            {foldersExpanded && (
              <div className="ml-2 space-y-1">
                <FolderItem color="orange" label="데이터 과학" />
                <FolderItem color="green" label="AI 수학" />
                <FolderItem color="skyblue" label="독일 문화의 이해" />
              </div>
            )}
          </nav>
        </div>
        {/* 사용자 프로필 부분도 구현 안됨 */}
        <div className="border-t p-3 absolute bottom-0 w-full bg-background">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>사용자</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">사용자 이름</p>
              <p className="text-xs text-muted-foreground truncate">
                user@example.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
