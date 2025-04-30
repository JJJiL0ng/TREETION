// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import axios from 'axios';
// import { useUserStore } from '@/store/user-store';
// import { refreshToken } from '@/lib/api/auth/auth';
// import { useRouter } from 'next/navigation';
// import { jwtDecode } from 'jwt-decode';

// const RecordPage = () => {
//   // 상태 관리
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
//   const [recordingTime, setRecordingTime] = useState(0);
//   const [uploadStatus, setUploadStatus] = useState('');
//   const router = useRouter();
  
//   // API URL 설정
//   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
//   // 레퍼런스
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const audioChunksRef = useRef<Blob[]>([]);
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
  
//   // 토큰 확인
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setUploadStatus('인증 정보가 없습니다. 로그인이 필요합니다.');
//     } else {
//       try {
//         // 토큰 디코딩하여 만료 여부 확인
//         const decoded = jwtDecode(token);
//         const currentTime = Date.now() / 1000;
        
//         if (decoded.exp && decoded.exp < currentTime) {
//           // 토큰이 만료된 경우
//           setUploadStatus('인증 토큰이 만료되었습니다. 갱신 중...');
//           refreshToken()
//             .then(() => setUploadStatus(''))
//             .catch(() => {
//               setUploadStatus('토큰 갱신에 실패했습니다. 다시 로그인하세요.');
//               setTimeout(() => router.push('/auth/login'), 3000);
//             });
//         }
//       } catch (error) {
//         console.error('토큰 검증 오류:', error);
//       }
//     }
//   }, [router]);
  
//   // 녹음 시간 업데이트
//   useEffect(() => {
//     if (isRecording) {
//       timerRef.current = setInterval(() => {
//         setRecordingTime((prevTime) => prevTime + 1);
//       }, 1000);
      
//     } else if (timerRef.current) {
//       clearInterval(timerRef.current);
//     }
    
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//       }
//     };
//   }, [isRecording]);
  
//   // 시간을 mm:ss 형식으로 포맷팅
//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   // 브라우저가 MediaRecorder를 지원하는지 확인하고 사용 가능한 MIME 타입 확인
//   const getSupportedMimeType = () => {
//     if (typeof window === 'undefined' || !window.MediaRecorder) {
//       return null;
//     }

//     // 선호하는 MIME 타입 순서
//     const mimeTypes = [
//       'audio/mp3',
//       'audio/mpeg',
//       'audio/webm;codecs=mp3',
//       'audio/webm'
//     ];

//     for (const type of mimeTypes) {
//       if (MediaRecorder.isTypeSupported(type)) {
//         console.log('지원되는 MIME 타입:', type);
//         return type;
//       }
//     }

//     // 기본값
//     return 'audio/webm';
//   };

//   // 녹음 시작
//   const startRecording = async () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setUploadStatus('인증 정보가 없습니다. 로그인이 필요합니다.');
//       return;
//     }
    
//     try {
//       // 오디오 스트림 가져오기
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
//       // 지원되는 MIME 타입 가져오기
//       const mimeType = getSupportedMimeType();
//       console.log('사용할 MIME 타입:', mimeType);
      
//       // MediaRecorder 설정
//       const options: MediaRecorderOptions = {};
//       if (mimeType) {
//         options.mimeType = mimeType;
//       }
      
//       const mediaRecorder = new MediaRecorder(stream, options);
      
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = []; // 청크 초기화
//       setRecordingTime(0); // 녹음 시간 초기화
      
//       // 데이터 수집
//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };
      
//       // 녹음 종료 처리
//       mediaRecorder.onstop = () => {
//         // 실제 사용된 MIME 타입
//         const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
//         console.log('녹음에 사용된 실제 MIME 타입:', actualMimeType);
        
//         const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
//         setAudioBlob(audioBlob);
        
//         // 스트림의 모든 트랙 중지
//         stream.getTracks().forEach(track => track.stop());
//       };
      
//       // 녹음 시작
//       mediaRecorder.start(1000); // 1초 간격으로 데이터 수집
//       setIsRecording(true);
//       setUploadStatus('');
      
//     } catch (error) {
//       console.error('녹음을 시작할 수 없습니다:', error);
//       setUploadStatus('마이크 접근 오류. 권한을 확인해주세요.');
//     }
//   };
  
//   // 녹음 중지
//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//     }
//   };
  
//   // 토큰 새로고침 및 재시도 함수
//   const refreshTokenAndRetry = async (callback: () => Promise<any>) => {
//     try {
//       // 토큰 새로고침 시도
//       await refreshToken();
//       // 새로운 토큰으로 재시도
//       return await callback();
//     } catch (refreshError) {
//       console.error('토큰 갱신 오류:', refreshError);
//       setUploadStatus('세션이 만료되었습니다. 다시 로그인해주세요.');
//       // 로그아웃 처리
//       useUserStore.getState().logout();
//       // 3초 후 로그인 페이지로 리다이렉트
//       setTimeout(() => {
//         router.push('/auth/login');
//       }, 3000);
//       throw refreshError;
//     }
//   };
  
//   // 서버에 오디오 업로드
//   const uploadAudio = async () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setUploadStatus('인증 정보가 없습니다. 로그인이 필요합니다.');
//       return;
//     }
    
//     if (!audioBlob) {
//       setUploadStatus('업로드할 오디오가 없습니다.');
//       return;
//     }
    
//     try {
//       setUploadStatus('업로드 중...');
      
//       // 파일 확장자 결정
//       let fileExtension = '.webm';
//       if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
//         fileExtension = '.mp3';
//       } else if (audioBlob.type.includes('wav')) {
//         fileExtension = '.wav';
//       }
      
//       // FormData 생성 및 파일 추가
//       const formData = new FormData();
//       const fileName = `recording_${Date.now()}${fileExtension}`;
      
//       // 오디오 파일을 원본 형식 그대로 사용
//       const audioFile = new File([audioBlob], fileName, { 
//         type: audioBlob.type 
//       });
      
//       console.log('업로드할 오디오 파일 정보:', {
//         name: audioFile.name,
//         type: audioFile.type,
//         size: audioFile.size
//       });
      
//       // FormData에 파일 추가 - 필드명을 audioFile로 설정
//       formData.append('audioFile', audioFile);
      
//       // 메타데이터 추가 - CreateAudioDto에 맞게 필드 설정
//       formData.append('title', `녹음_${new Date().toISOString()}`);
//       formData.append('recordedAt', new Date().toISOString());
      
//       // FormData 내용 로깅
//       console.log('FormData 내용:');
//       for (const pair of formData.entries()) {
//         const value = pair[1];
//         if (value instanceof File) {
//           console.log(pair[0], `File: ${value.name}, 타입: ${value.type}, 크기: ${value.size} 바이트`);
//         } else {
//           console.log(pair[0], value);
//         }
//       }
      
//       // JWT에서 사용자 정보 디코딩
//       let userId = '';
//       try {
//         const decodedToken = jwtDecode<{sub: string}>(token);
//         userId = decodedToken.sub; // JWT 표준은 'sub' 필드에 사용자 ID를 저장
//         console.log('디코딩된 사용자 ID:', userId);
//       } catch (error) {
//         console.error('토큰 디코딩 오류:', error);
//         throw new Error('인증 토큰이 올바르지 않습니다.');
//       }
      
//       // 업로드 함수 정의 - Content-Type 헤더를 설정하지 않음 (브라우저가 자동 설정)
//       const performUpload = async () => {
//         console.log('API 엔드포인트:', `${API_URL}/audio/upload`);
//         return await axios.post(
//           `${API_URL}/audio/upload`, 
//           formData, 
//           { 
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Accept': 'application/json',
//               // Content-Type은 브라우저가 자동으로 설정
//             }
//           }
//         );
//       };
      
//       // 서버에 업로드 시도
//       let response;
//       try {
//         console.log('오디오 업로드 요청 시작...');
//         response = await performUpload();
//         console.log('업로드 성공!');
//       } catch (error) {
//         console.error('업로드 첫 시도 실패:', error);
        
//         // 요청 상세 정보 로깅
//         if (axios.isAxiosError(error) && error.response) {
//           console.error('오류 응답:', {
//             status: error.response.status,
//             statusText: error.response.statusText,
//             data: error.response.data,
//             headers: error.response.headers
//           });
//         }
        
//         // 401 오류인 경우 토큰 갱신 후 재시도
//         if (axios.isAxiosError(error) && error.response?.status === 401) {
//           response = await refreshTokenAndRetry(performUpload);
//         } else {
//           throw error;
//         }
//       }
      
//       console.log('업로드 응답:', response.data);
//       setUploadStatus('업로드 성공! 오디오 ID: ' + response.data.id);
      
//       // 업로드 후 상태 초기화
//       setAudioBlob(null);
      
//     } catch (error) {
//       console.error('업로드 오류:', error);
      
//       // 오류 상태 코드 및 메시지 확인
//       if (axios.isAxiosError(error)) {
//         const statusCode = error.response?.status;
//         const errorMessage = error.response?.data?.message || error.message;
        
//         if (statusCode === 401) {
//           setUploadStatus('인증 오류: 토큰이 유효하지 않거나 만료되었습니다.');
//         } else {
//           setUploadStatus(`업로드 실패 (${statusCode}): ${errorMessage}`);
//         }
//       } else {
//         setUploadStatus(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
//       }
//     }
//   };
  
//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <h1 className="text-2xl font-bold mb-6">오디오 녹음 및 업로드</h1>
      
//       <div className="mb-4 p-4 bg-gray-50 rounded-lg">
//         <p>녹음 상태: {isRecording ? '녹음 중' : '중지됨'}</p>
//         {isRecording && <p className="text-red-500 font-semibold">녹음 시간: {formatTime(recordingTime)}</p>}
//       </div>
      
//       <div className="mb-6 flex flex-col items-center">
//         {!isRecording ? (
//           <button 
//             onClick={startRecording}
//             className="mb-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             녹음 시작
//           </button>
//         ) : (
//           <button 
//             onClick={stopRecording}
//             className="mb-4 px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//           >
//             녹음 중지
//           </button>
//         )}
        
//         {audioBlob && !isRecording && (
//           <div className="w-full flex flex-col items-center">
//             <div className="mb-4 w-full">
//               <audio 
//                 controls 
//                 src={URL.createObjectURL(audioBlob)} 
//                 className="w-full"
//               />
//               <p className="text-xs text-gray-500 mt-1 text-center">
//                 오디오 형식: {audioBlob.type || '알 수 없음'}
//               </p>
//             </div>
//             <button 
//               onClick={uploadAudio}
//               className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
//             >
//               업로드
//             </button>
//           </div>
//         )}
//       </div>
      
//       {uploadStatus && (
//         <div className={`p-4 rounded-lg mb-6 ${
//           uploadStatus.includes('성공') ? 'bg-green-100 text-green-800' :
//           uploadStatus.includes('오류') || uploadStatus.includes('실패') ? 'bg-red-100 text-red-800' :
//           'bg-blue-100 text-blue-800'
//         }`}>
//           <p>{uploadStatus}</p>
//         </div>
//       )}
      
//       <div className="border-t pt-4">
//         <h2 className="text-xl font-semibold mb-2">사용 방법:</h2>
//         <ol className="list-decimal pl-6 space-y-2">
//           <li>녹음 시작 버튼을 클릭하여 오디오 녹음을 시작합니다.</li>
//           <li>녹음 중지 버튼을 클릭하여 녹음을 종료합니다.</li>
//           <li>녹음된 오디오를 확인하고 업로드 버튼을 클릭합니다.</li>
//           <li>업로드 성공/실패 상태가 표시됩니다.</li>
//         </ol>
//       </div>
//     </div>
//   );
// };

// export default RecordPage;
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/auth/client';
import { useUserStore } from '@/store/user-store';
import { useRequiredAuth } from '@/hooks/auth/useRequiredAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';

const RecordPage = () => {
  // 인증 관련 훅 사용
  const { user, isLoading: authLoading } = useRequiredAuth('/auth/login');
  const router = useRouter();
  
  // 상태 관리
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // API URL 설정
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  // 레퍼런스
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 녹음 시간 업데이트
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  // 시간을 mm:ss 형식으로 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 브라우저가 MediaRecorder를 지원하는지 확인하고 사용 가능한 MIME 타입 확인
  const getSupportedMimeType = () => {
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      return null;
    }

    // 선호하는 MIME 타입 순서
    const mimeTypes = [
      'audio/mp3',
      'audio/mpeg',
      'audio/webm;codecs=mp3',
      'audio/webm'
    ];

    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('지원되는 MIME 타입:', type);
        return type;
      }
    }

    // 기본값
    return 'audio/webm';
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      // 오디오 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 지원되는 MIME 타입 가져오기
      const mimeType = getSupportedMimeType();
      console.log('사용할 MIME 타입:', mimeType);
      
      // MediaRecorder 설정
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // 청크 초기화
      setRecordingTime(0); // 녹음 시간 초기화
      
      // 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 녹음 종료 처리
      mediaRecorder.onstop = () => {
        // 실제 사용된 MIME 타입
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        console.log('녹음에 사용된 실제 MIME 타입:', actualMimeType);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        setAudioBlob(audioBlob);
        
        // 스트림의 모든 트랙 중지
        stream.getTracks().forEach(track => track.stop());
      };
      
      // 녹음 시작
      mediaRecorder.start(1000); // 1초 간격으로 데이터 수집
      setIsRecording(true);
      setUploadStatus('');
      
    } catch (error) {
      console.error('녹음을 시작할 수 없습니다:', error);
      setUploadStatus('마이크 접근 오류. 권한을 확인해주세요.');
    }
  };
  
  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // 서버에 오디오 업로드
  const uploadAudio = async () => {
    if (!audioBlob) {
      setUploadStatus('업로드할 오디오가 없습니다.');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadStatus('업로드 중...');
      
      // 파일 확장자 결정
      let fileExtension = '.webm';
      if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
        fileExtension = '.mp3';
      } else if (audioBlob.type.includes('wav')) {
        fileExtension = '.wav';
      }
      
      // FormData 생성 및 파일 추가
      const formData = new FormData();
      const fileName = `recording_${Date.now()}${fileExtension}`;
      
      // 오디오 파일을 원본 형식 그대로 사용
      const audioFile = new File([audioBlob], fileName, { 
        type: audioBlob.type 
      });
      
      console.log('업로드할 오디오 파일 정보:', {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });
      
      // FormData에 파일 추가 - 필드명을 audioFile로 설정
      formData.append('audioFile', audioFile);
      
      // 메타데이터 추가 - CreateAudioDto에 맞게 필드 설정
      formData.append('title', `녹음_${new Date().toISOString()}`);
      formData.append('recordedAt', new Date().toISOString());
      
      // FormData 내용 로깅
      console.log('FormData 내용:');
      for (const pair of formData.entries()) {
        const value = pair[1];
        if (value instanceof File) {
          console.log(pair[0], `File: ${value.name}, 타입: ${value.type}, 크기: ${value.size} 바이트`);
        } else {
          console.log(pair[0], value);
        }
      }
      
      // 인증을 처리하는 API 클라이언트를 사용하여 업로드
      console.log('API 엔드포인트:', `${API_URL}/audio/upload`);
      const response = await api.upload('/audio/upload', formData);
      
      console.log('업로드 응답:', response);
      setUploadStatus('업로드 성공! 오디오 ID: ' + response.id);
      
      // 업로드 후 상태 초기화
      setAudioBlob(null);
      
    } catch (error: any) {
      console.error('업로드 오류:', error);
      
      // API 클라이언트가 이미 토큰 갱신을 처리하므로 여기서는 오류 메시지만 표시
      const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
      setUploadStatus(`업로드 실패: ${errorMessage}`);
      
      // 권한 오류인 경우 (401)
      if (error.response?.status === 401) {
        setUploadStatus('인증이 필요합니다. 다시 로그인해주세요.');
        
        // 로그아웃 처리 및 로그인 페이지로 리다이렉트
        useUserStore.getState().logout();
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  // 인증 로딩 중일 때 표시할 내용
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AuthGuard>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">오디오 녹음 및 업로드</h1>
        
        {user && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700">
              <span className="font-medium">{user.name || user.email}</span>님으로 로그인됨
            </p>
          </div>
        )}
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p>녹음 상태: {isRecording ? '녹음 중' : '중지됨'}</p>
          {isRecording && <p className="text-red-500 font-semibold">녹음 시간: {formatTime(recordingTime)}</p>}
        </div>
        
        <div className="mb-6 flex flex-col items-center">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="mb-4 px-6 py-2 text-2xl bg-primary text-blue-500 rounded hover:bg-primary-dark transition-colors"
              disabled={isUploading}
            >
              녹음 시작
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="mb-4 px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              녹음 중지
            </button>
          )}
          
          {audioBlob && !isRecording && (
            <div className="w-full flex flex-col items-center">
              <div className="mb-4 w-full">
                <audio 
                  controls 
                  src={URL.createObjectURL(audioBlob)} 
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  오디오 형식: {audioBlob.type || '알 수 없음'}
                </p>
              </div>
              <button 
                onClick={uploadAudio}
                disabled={isUploading}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    업로드 중...
                  </span>
                ) : '업로드'}
              </button>
            </div>
          )}
        </div>
        
        {uploadStatus && (
          <div className={`p-4 rounded-lg mb-6 ${
            uploadStatus.includes('성공') ? 'bg-green-100 text-green-800' :
            uploadStatus.includes('오류') || uploadStatus.includes('실패') ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <p>{uploadStatus}</p>
          </div>
        )}
        
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">사용 방법:</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>녹음 시작 버튼을 클릭하여 오디오 녹음을 시작합니다.</li>
            <li>녹음 중지 버튼을 클릭하여 녹음을 종료합니다.</li>
            <li>녹음된 오디오를 확인하고 업로드 버튼을 클릭합니다.</li>
            <li>업로드 성공/실패 상태가 표시됩니다.</li>
          </ol>
        </div>
      </div>
    </AuthGuard>
  );
};

export default RecordPage;