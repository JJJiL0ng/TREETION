"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/util";
import { ChevronDown, FileAudio, Play, Pause } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import StopRecordingModal from "./StopRecordingModal";
import { api } from "@/lib/api/auth/client";
import { useAudioStore } from "@/store/audio-store";

interface RecordingItemProps {
  title: string;
  duration: string;
  date: string;
  color: string;
}

function RecordingItem({ title, duration, date, color }: RecordingItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-white",
          color === "blue" ? "bg-blue-600" : "bg-gray-600"
        )}
      >
        <FileAudio className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {duration} | {date}
        </p>
      </div>
    </div>
  );
}

export default function VoiceWritingPage() {
  // 녹음 관련 상태 및 로직
  const { isRecording, setIsRecording, isPaused, setIsPaused } =
    useAudioStore();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [draggedFileName, setDraggedFileName] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldUploadAfterStop, setShouldUploadAfterStop] = useState(false);

  // API URL 설정
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // 녹음 시간 업데이트
  useEffect(() => {
    if (isRecording && !isPaused) {
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
  }, [isRecording, isPaused]);

  // 시간을 mm:ss 형식으로 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 브라우저가 MediaRecorder를 지원하는지 확인하고 사용 가능한 MIME 타입 확인
  const getSupportedMimeType = () => {
    if (typeof window === "undefined" || !window.MediaRecorder) {
      return null;
    }
    const mimeTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/webm;codecs=mp3",
      "audio/webm",
    ];
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "audio/webm";
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      setIsPaused(false);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: actualMimeType,
        });
        setAudioBlob(audioBlob);
        setDraggedFileName("");
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start(1000);
      setIsRecording(true);
      setUploadStatus("");
    } catch (error) {
      setUploadStatus("마이크 접근 오류. 권한을 확인해주세요.");
    }
  };

  // 일시정지
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // 재개
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  // 완전 종료
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // 녹음이 완전히 stop된 후 업로드 예약이 있으면 업로드 실행
  useEffect(() => {
    if (shouldUploadAfterStop && audioBlob) {
      uploadAudio();
      setShouldUploadAfterStop(false);
    }
  }, [audioBlob, shouldUploadAfterStop]);

  // 서버에 오디오 업로드 (실제 API 연동)
  const uploadAudio = async () => {
    if (!audioBlob) {
      setUploadStatus("업로드할 오디오가 없습니다.");
      return;
    }
    try {
      setIsUploading(true);
      setUploadStatus("업로드 중...");

      // 파일 확장자 결정
      let fileExtension = ".webm";
      if (audioBlob.type.includes("mp3") || audioBlob.type.includes("mpeg")) {
        fileExtension = ".mp3";
      } else if (audioBlob.type.includes("wav")) {
        fileExtension = ".wav";
      }

      // FormData 생성 및 파일 추가
      const formData = new FormData();
      const fileName =
        draggedFileName || `recording_${Date.now()}${fileExtension}`;
      const audioFile = new File([audioBlob], fileName, {
        type: audioBlob.type,
      });
      formData.append("audioFile", audioFile);
      formData.append(
        "title",
        draggedFileName || `녹음_${new Date().toISOString()}`
      );
      formData.append("recordedAt", new Date().toISOString());

      // 실제 업로드
      const response = await api.upload("/audio/upload", formData);
      setUploadStatus("업로드 성공! 오디오 ID: " + response.id);
      setAudioBlob(null);
      setDraggedFileName("");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "알 수 없는 오류";
      setUploadStatus(`업로드 실패: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 삭제 함수
  const handleDeleteAudio = () => {
    setAudioBlob(null);
    setDraggedFileName("");
    setRecordingTime(0);
    setIsModalOpen(false);
    setIsPaused(false);
    setIsRecording(false);
    setUploadStatus("");
    setShouldUploadAfterStop(false);
  };

  // stopRecording 버튼 클릭 시 모달 오픈
  const handleStopButtonClick = () => {
    if (isRecording && !isPaused) {
      pauseRecording();
      setIsModalOpen(true);
    } else if (isRecording && isPaused) {
      setIsModalOpen(true);
    }
  };

  // 모달 내 저장 클릭 시
  const handleSaveAudio = () => {
    setIsModalOpen(false);
    if (isRecording) {
      stopRecording();
      setUploadStatus("녹음 정리 중...");
      setShouldUploadAfterStop(true);
    } else {
      uploadAudio();
    }
  };

  // 모달 내 취소 클릭 시
  const handleCancelAudio = () => {
    setIsModalOpen(false);
  };

  // 파란 버튼 클릭 핸들러
  const handleMainRecordButton = () => {
    if (!isRecording) {
      startRecording();
    } else if (isRecording && !isPaused) {
      pauseRecording();
    } else if (isRecording && isPaused) {
      resumeRecording();
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-6 w-full">
        <h2 className="text-2xl font-bold">음성 녹음</h2>
        {/* <div className="flex flex-col md:flex-row gap-4">
          <Input placeholder="녹음 제목 입력..." className="flex-1" />
          <div className="relative">
            <Button
              variant="outline"
              className="w-full md:w-auto justify-between min-w-[200px]"
            >
              <span>데이터 과학</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div> */}
        {/* 녹음 인터페이스 카드 */}
        <Card className="w-full">
          <CardHeader className="pb-3"></CardHeader>
          <CardContent>
            {/* 녹음 컨트롤 */}
            <div className="flex flex-col items-center justify-center py-8">
              {/* 녹음 버튼 */}
              <div className="relative mb-4">
                <div className="w-36 h-36 rounded-full bg-blue-100 flex items-center justify-center">
                  <button
                    onClick={handleMainRecordButton}
                    className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors p-0 gap-0"
                  >
                    {isRecording ? (
                      isPaused ? (
                        <Play className="h-12 w-12 block" fill="white" />
                      ) : (
                        <Pause className="h-12 w-12 block" />
                      )
                    ) : (
                      <Play className="h-12 w-12 block" fill="white" />
                    )}
                  </button>
                </div>
              </div>
              {/* 녹음 상태 */}
              <h3 className="text-xl font-medium mb-2">
                {isRecording
                  ? isPaused
                    ? "일시정지 중"
                    : "녹음 중"
                  : "녹음 대기중"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isRecording
                  ? isPaused
                    ? "버튼을 클릭하여 녹음을 재개하세요"
                    : "녹음을 일시정지하려면 버튼을 클릭하세요"
                  : "버튼을 클릭하여 녹음을 시작하세요"}
              </p>
              {/* 타이머 */}
              <div className="text-3xl font-mono mb-8">
                {formatTime(recordingTime)}
              </div>
              {/* 녹음 컨트롤 버튼 */}
              <div className="w-full flex justify-center">
                <div className="flex gap-4">
                  <Button variant="outline" className="rounded-full px-8 py-2">
                    녹음 설정
                  </Button>
                  <Button
                    className={cn(
                      "rounded-full w-16 h-16 flex items-center justify-center",
                      isRecording ? "bg-red-500 hover:bg-red-600" : "bg-red-400"
                    )}
                    disabled={!isRecording}
                    onClick={handleStopButtonClick}
                  >
                    <div className="w-6 h-6 rounded-full bg-white" />
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full px-8 py-2"
                    onClick={uploadAudio}
                    disabled={!audioBlob || isUploading}
                  >
                    파일 업로드
                  </Button>
                </div>
              </div>
              {/* 오디오 미리듣기 */}
              {audioBlob && !isRecording && (
                <div className="w-full flex flex-col items-center mt-6">
                  <audio
                    controls
                    src={URL.createObjectURL(audioBlob)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {draggedFileName
                      ? `파일명: ${draggedFileName}`
                      : "녹음된 오디오"}{" "}
                    {"| 형식: "}
                    {audioBlob.type || "알 수 없음"}
                  </p>
                </div>
              )}
              {/* 업로드 상태 메시지 */}
              {uploadStatus && (
                <div
                  className={`p-4 rounded-lg mt-4 ${
                    uploadStatus.includes("성공")
                      ? "bg-green-100 text-green-800"
                      : uploadStatus.includes("오류") ||
                        uploadStatus.includes("실패")
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  <p>{uploadStatus}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* 최근 녹음 파일 카드 */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle>최근 녹음 파일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <RecordingItem
                title="데이터 분석 강의"
                duration="45:12"
                date="방금 전"
                color="blue"
              />
              <RecordingItem
                title="AI 기초 개념"
                duration="32:18"
                date="24시간 전"
                color="blue"
              />
              <RecordingItem
                title="독일어 회화 연습"
                duration="15:45"
                date="어제"
                color="blue"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 모달 팝업 */}
      <StopRecordingModal
        isOpen={isModalOpen}
        onSave={handleSaveAudio}
        onDelete={handleDeleteAudio}
        onCancel={handleCancelAudio}
      />
    </div>
  );
}
