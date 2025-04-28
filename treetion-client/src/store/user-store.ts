import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null; // JWT 토큰 추가
  setUser: (user: User | null, token?: string | null) => void;
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
      token: null,
      setUser: (user, token = null) => {
        // 토큰이 제공되면 로컬 스토리지에 저장
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        
        set({ 
          user, 
          token,
          isAuthenticated: !!user,
          error: null
        });
      },
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        // 로컬 스토리지에서 토큰 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
        
        // 상태 초기화
        set({ 
          user: null, 
          token: null,
          isAuthenticated: false,
          error: null
        });
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          name: state.user.name,
          email: state.user.email,
          profileImage: state.user.profileImage,
        } : null,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);