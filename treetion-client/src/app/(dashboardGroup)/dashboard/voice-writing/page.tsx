"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/util";
import { ChevronDown, FileAudio, Play } from "lucide-react";
import { useState } from "react";

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
  const [isRecording, setIsRecording] = useState(false);
  // const [timer, setTimer] = useState("00:00:00");

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-6 w-full">
        <h2 className="text-2xl font-bold">음성 녹음</h2>
        <div className="flex flex-col md:flex-row gap-4">
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
        </div>

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
                    onClick={toggleRecording}
                    className="w-24 h-24  rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 bg-white rounded-sm" />
                    ) : (
                      <Play className="h-12 w-12 ml-2" fill="white" />
                    )}
                  </button>
                </div>
              </div>

              {/* 녹음 상태 */}
              <h3 className="text-xl font-medium mb-2">
                {isRecording ? "녹음 중" : "녹음 대기중"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isRecording
                  ? "녹음을 중지하려면 버튼을 클릭하세요"
                  : "버튼을 클릭하여 녹음을 시작하세요"}
              </p>

              {/* 타이머 */}
              <div className="text-3xl font-mono mb-8">1:00:00</div>

              {/* 녹음 컨트롤 버튼 */}
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
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </Button>
                <Button variant="outline" className="rounded-full px-8 py-2">
                  파일 업로드
                </Button>
              </div>
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
    </div>
  );
}
