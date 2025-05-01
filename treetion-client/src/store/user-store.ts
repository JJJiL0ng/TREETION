// src/store/user-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';
import { getAccessToken, getRefreshToken, saveTokens, clearAuth, isTokenExpired, getUser as getStoredUser } from '@/lib/api/auth/token';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null; // JWT 토큰
  
  // 액션
  setUser: (user: User | null, token?: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  refreshTokenIfNeeded: () => Promise<boolean>;
  checkAuthStatus: () => Promise<boolean>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      token: null,
      
      // 사용자 정보와 토큰 설정
      setUser: (user, token = null) => {
        console.log('[UserStore] 사용자 정보 설정:', user ? 'user 있음' : 'user 없음', token ? 'token 있음' : 'token 없음');
        // 토큰이 제공되었을 경우 저장
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          // 리프레시 토큰이 별도로 있는 경우 저장 로직 추가 필요
        }
        
        set({
          user,
          token,
          isAuthenticated: !!user,
          isLoading: false,
          error: null
        });
      },
      
      // 에러 설정
      setError: (error) => {
        console.log('[UserStore] 오류 설정:', error);
        set({ error });
      },
      
      // 로딩 상태 설정
      setLoading: (isLoading) => {
        console.log('[UserStore] 로딩 상태 설정:', isLoading);
        set({ isLoading });
      },
      
      // 로그아웃
      logout: () => {
        console.log('[UserStore] 로그아웃 실행');
        // 인증 유틸리티 사용하여 토큰 제거
        clearAuth();
        
        // 상태 초기화
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isLoading: false
        });
      },
      
      // 토큰 갱신 (필요 시)
      refreshTokenIfNeeded: async () => {
        console.log('[UserStore] 토큰 갱신 확인 시작');
        const currentToken = getAccessToken();
        
        console.log('[UserStore] 현재 토큰:', currentToken ? '있음' : '없음');
        if (currentToken) {
          console.log('[UserStore] 토큰 만료 여부:', isTokenExpired(currentToken) ? '만료됨' : '유효함');
        }
        
        // 토큰이 없거나 만료되지 않았으면 갱신할 필요 없음
        if (!currentToken) {
          console.log('[UserStore] 토큰 없음, 인증 실패 상태로 설정');
          set({ isAuthenticated: false, isLoading: false });
          return false;
        }
        
        // 토큰이 유효하면 갱신이 필요 없음
        if (!isTokenExpired(currentToken)) {
          console.log('[UserStore] 유효한 토큰 있음, 갱신 불필요');
          return true;
        }
        
        try {
          const refreshToken = getRefreshToken();
          console.log('[UserStore] 리프레시 토큰:', refreshToken ? '있음' : '없음');
          
          if (!refreshToken) {
            // 리프레시 토큰이 없으면 로그아웃
            console.log('[UserStore] 리프레시 토큰 없음, 로그아웃');
            get().logout();
            return false;
          }
          
          // API 요청으로 토큰 갱신
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
          console.log('[UserStore] 토큰 갱신 API 요청 시작:', baseUrl + '/auth/refresh');
          
          const response = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });
          
          console.log('[UserStore] 토큰 갱신 응답 상태:', response.status);
          
          if (!response.ok) {
            throw new Error('토큰 갱신 실패');
          }
          
          const data = await response.json();
          console.log('[UserStore] 토큰 갱신 응답 데이터:', data ? '데이터 있음' : '데이터 없음');
          
          const { accessToken, refreshToken: newRefreshToken, user } = data;
          
          // 새 토큰 저장
          saveTokens(accessToken, newRefreshToken);
          console.log('[UserStore] 새 토큰 저장 완료');
          
          // 상태 업데이트
          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          console.log('[UserStore] 토큰 갱신 성공');
          return true;
        } catch (error) {
          console.error('[UserStore] 토큰 갱신 실패:', error);
          get().logout();
          return false;
        }
      },
      
      // 인증 상태 확인
      checkAuthStatus: async () => {
        console.log('[UserStore] 인증 상태 확인 시작');
        set({ isLoading: true });
        const token = getAccessToken();
        
        console.log('[UserStore] 토큰 확인:', token ? '있음' : '없음');
        if (token) {
          console.log('[UserStore] 토큰 만료 여부:', isTokenExpired(token) ? '만료됨' : '유효함');
        }
        
        if (token && !isTokenExpired(token)) {
          // 저장된 사용자 정보 가져오기
          const storedUser = getStoredUser();
          console.log('[UserStore] 저장된 사용자 정보:', storedUser ? '있음' : '없음');
          
          if (storedUser) {
            console.log('[UserStore] 유효한 토큰과 사용자 정보 있음, 인증 상태 설정');
            set({
              user: storedUser as User,
              token,
              isAuthenticated: true,
              isLoading: false
            });
            return true;
          }
        }
        
        // 유효한 토큰이 없으면 갱신 시도
        console.log('[UserStore] 유효한 토큰 없음, 토큰 갱신 시도');
        try {
          const refreshed = await get().refreshTokenIfNeeded();
          console.log('[UserStore] 토큰 갱신 결과:', refreshed ? '성공' : '실패');
          
          if (!refreshed) {
            console.log('[UserStore] 토큰 갱신 실패, 인증되지 않은 상태로 설정');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false
            });
            return false;
          }
          return get().isAuthenticated;
        } catch (error) {
          console.error('[UserStore] 인증 상태 확인 중 오류 발생:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
          return false;
        }
      }
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

// 초기 로드 시 인증 상태 확인 (클라이언트 사이드에서만 실행)
if (typeof window !== 'undefined') {
  console.log('[UserStore] 초기 인증 상태 확인 예약');
  // Next.js 하이드레이션 후 인증 상태 확인을 위해 setTimeout 사용
  setTimeout(() => {
    console.log('[UserStore] 초기 인증 상태 확인 실행');
    useUserStore.getState().checkAuthStatus();
  }, 0);
}