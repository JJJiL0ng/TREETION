// lib/auth/token.ts
import axios from 'axios';
import { useUserStore } from '@/store/user-store';

/**
 * 리프레시 토큰을 사용하여 액세스 토큰을 갱신하는 함수
 * @returns 토큰 갱신 프로미스
 */
export async function refreshToken(): Promise<void> {
  try {
    // 로컬 스토리지에서 리프레시 토큰 가져오기
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }
    
    // 백엔드 API 형식에 맞게 요청 보내기
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });
    
    // 백엔드 응답 형식에 맞게 데이터 처리
    const { accessToken, refreshToken: newRefreshToken, expiresIn, user } = response.data;
    
    // 로컬 스토리지에 토큰 저장
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    // 만료 시간 저장 (선택적)
    if (expiresIn) {
      const expiryTime = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem('tokenExpiry', expiryTime.toString());
    }
    
    // 사용자 정보가 있으면 갱신 (선택적)
    if (user) {
      // Zustand 스토어를 사용한다면:
      useUserStore.getState().setUser(user);
      // 또는 사용자 정보를 로컬 스토리지에 저장:
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch (error) {
    console.error('토큰 갱신 중 오류:', error);
    // 갱신 실패 시 로그아웃 처리를 고려할 수 있음
    // logout();
    throw new Error('토큰 갱신에 실패했습니다.');
  }
}