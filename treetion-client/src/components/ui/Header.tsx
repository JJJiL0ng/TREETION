"use client";

import { Button } from "./button";
import { Menu, TreesIcon } from "lucide-react";
interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center border-b bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="mr-4"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2 mr-4">
        <h1 className="text-xl font-bold text-blue-600">Treetion</h1>
      </div>
    </header>
  );
}
