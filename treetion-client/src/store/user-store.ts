import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null
      }),
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        error: null
      }),
    }),
    {
      name: 'user-store',
      // 사용자 정보는 민감할 수 있으므로 실제 구현에서는 
      // 필요한 정보만 선택적으로 유지하거나 
      // 다른 인증 패턴을 사용할 수 있습니다.
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          name: state.user.name,
          email: state.user.email,
          profileImage: state.user.profileImage,
        } : null,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);