// lib/api/audio/record.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 백엔드 응답 타입
interface UploadAudioResponse {
  success: boolean;
  file: {
    id: string;
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
    url: string;
    createdAt: string;
  };
}

/**
 * 오디오 파일을 서버에 업로드합니다.
 * @param formData 오디오 파일과 메타데이터를 포함한 FormData
 * @param onProgress 업로드 진행 상태를 보고받을 콜백 함수
 * @returns 업로드된 오디오 파일 정보
 */
export const uploadAudio = async (
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<UploadAudioResponse> => {
  try {
    // 인증 토큰 가져오기
    const token = getAuthToken();
    
    console.log('API 요청 URL:', `${API_BASE_URL}/api/audio/upload`);
    
    // 요청 설정
    const config = {
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    // API 요청 전송
    const response = await axios.post<UploadAudioResponse>(
      `${API_BASE_URL}/api/audio/upload`,
      formData,
      config
    );
    
    console.log('서버 응답:', response.status, response.statusText);
    console.log('응답 데이터:', response.data);
    
    return response.data;
  } catch (error: unknown) {
    console.error('오디오 업로드 중 오류 발생:', error);
    
    // 세부 오류 정보 확인
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 서버가 응답을 반환한 경우
        console.error('오류 상태:', error.response.status);
        console.error('오류 데이터:', error.response.data);
        console.error('오류 헤더:', error.response.headers);
      } else if (error.request) {
        // 요청은 전송됐지만 응답을 받지 못한 경우
        console.error('응답 없음:', error.request);
      } else {
        // 요청 설정 중 오류 발생
        console.error('요청 설정 오류:', error.message);
      }
      console.error('요청 구성:', error.config);
    }
    
    throw error;
  }
};

/**
 * 인증 토큰을 가져옵니다.
 * @returns JWT 토큰 또는 null
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};