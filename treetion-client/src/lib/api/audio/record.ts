import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 백엔드 응답에 맞게 인터페이스 수정
interface UploadAudioResponse {
    // 기존 예상 구조
    success?: boolean;
    file?: {
      id: string;
      filename: string;
      originalName: string;
      path: string;
      size: number;
      mimeType: string;
      url: string;
      createdAt: string;
    };
    
    // 실제 응답 구조
    status?: boolean;
    data?: {
      id: string;
      // 필요한 다른 필드들에 대한 타입을 명시합니다.
      [key: string]: unknown;
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
    // 토큰 가져오기
    const token = getAuthToken();
    
    // 요청 헤더 설정
    const headers: Record<string, string> = {};
    
    // 인증 토큰이 있으면 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // userId를 formData에서 제거 (백엔드에서 토큰으로 사용자 정보를 가져오기 때문)
    if (formData.has('userId')) {
      formData.delete('userId');
    }
    
    const response = await axios.post<UploadAudioResponse>(
      `${API_BASE_URL}/api/audio/upload`, // 수정된 엔드포인트 경로
      formData,
      {
        headers,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );
    
    return response.data;
  } catch (error: unknown) {
    console.error('Error uploading audio:', error);
    
    // 상세 에러 정보 출력
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    
    throw error;
  }
};

// 인증된 토큰을 가져오는 유틸리티 함수
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};