// src/lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAccessToken, isTokenExpired } from '@/lib/api/auth/token';
import { useUserStore } from '@/store/user-store';

// API 기본 설정
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 인증 토큰이 포함된 API 클라이언트 인스턴스 생성
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터 설정
  client.interceptors.request.use(
    async (config) => {
      // 브라우저 환경에서만 실행
      if (typeof window !== 'undefined') {
        // 현재 엑세스 토큰 확인
        let accessToken = getAccessToken();
        
        // 토큰이 있지만 만료되었으면 갱신 시도
        if (accessToken && isTokenExpired(accessToken)) {
          try {
            // Zustand 스토어에서 토큰 갱신 함수 호출
            const refreshed = await useUserStore.getState().refreshTokenIfNeeded();
            if (refreshed) {
              // 갱신된 토큰 사용
              accessToken = getAccessToken();
            }
          } catch (error) {
            console.error('토큰 갱신 실패:', error);
          }
        }
        
        // 헤더에 토큰 추가
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터 설정
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // 401 에러이고 재시도하지 않은 경우
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Zustand 스토어에서 토큰 갱신 함수 호출
          const refreshed = await useUserStore.getState().refreshTokenIfNeeded();
          
          if (refreshed) {
            // 새 토큰으로 헤더 업데이트
            originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
            // 요청 재시도
            return client(originalRequest);
          }
        } catch (refreshError) {
          console.error('토큰 갱신 실패:', refreshError);
          
          // 로그아웃 처리
          useUserStore.getState().logout();
          
          // 로그인 페이지로 리다이렉트 (클라이언트 사이드에서만)
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// API 클라이언트 인스턴스
const apiClient = createApiClient();

/**
 * 간소화된 API 요청 함수들
 */
export const api = {
  /**
   * GET 요청
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get<T, AxiosResponse<T>>(url, config)
      .then(response => response.data);
  },
  
  /**
   * POST 요청
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },
  
  /**
   * PUT 요청
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },
  
  /**
   * PATCH 요청
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.patch<T, AxiosResponse<T>>(url, data, config)
      .then(response => response.data);
  },
  
  /**
   * DELETE 요청
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete<T, AxiosResponse<T>>(url, config)
      .then(response => response.data);
  },
  
  /**
   * 파일 업로드 요청
   */
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post<T, AxiosResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => response.data);
  },
};

export default apiClient;