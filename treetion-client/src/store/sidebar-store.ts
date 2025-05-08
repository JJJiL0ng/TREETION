import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
