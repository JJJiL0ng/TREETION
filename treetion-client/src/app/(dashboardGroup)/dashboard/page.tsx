import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio, Mic, Plus, Trees, Upload } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-6 w-full">
        <h2 className="text-2xl font-bold">대시보드</h2>
        {/* 빠른 액션 */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle>빠른 액션</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Mic className="h-4 w-4" />
              <span className="hidden md:inline">새 녹음 시작</span>
            </Button>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4" />
              <span className="hidden md:inline">파일 업로드</span>
            </Button>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">새 트리 만들기</span>
            </Button>
          </CardContent>
        </Card>

        {/* 사용 통계 섹션 */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle>사용 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center rounded-lg bg-blue-50 p-4">
                <span className="text-3xl font-bold text-blue-600">15</span>
                <span className="text-sm text-gray-600">총 녹음 수</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-blue-50 p-4">
                <span className="text-3xl font-bold text-blue-600">8</span>
                <span className="text-sm text-gray-600">트리 구조화</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-blue-50 p-4">
                <span className="text-3xl font-bold text-blue-600">5</span>
                <span className="text-sm text-gray-600">생성된 SVG</span>
              </div>
            </div>
            <div className="mt-4 font-bold">최근 7일간 활동 그래프</div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 w-full">
          {/* 최근 녹음 */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle>최근 녹음</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                    <FileAudio className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">강의 노트 - 인공지능 개론</p>
                    <p className="text-xs text-muted-foreground">
                      2025년 4월 18일 | 10:23 | 15분 32초
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                    <FileAudio className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">회의록 - 프로젝트 기획</p>
                    <p className="text-xs text-muted-foreground">
                      2025년 4월 15일 | 14:30 | 45분 12초
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                    <FileAudio className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">아이디어 브레인스토밍</p>
                    <p className="text-xs text-muted-foreground">
                      2025년 4월 10일 | 09:15 | 22분 47초
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 최근 트리 */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle>최근 트리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Trees className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">데이터 과학 마인드맵</p>
                    <p className="text-xs text-muted-foreground">
                      2025년 4월 18일 | 수정됨
                    </p>
                    <div className="mt-2">
                      <svg
                        width="80"
                        height="40"
                        viewBox="0 0 80 40"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="40" cy="20" r="5" fill="#3b82f6" />
                        <circle cx="20" cy="30" r="3" fill="#3b82f6" />
                        <circle cx="60" cy="30" r="3" fill="#3b82f6" />
                        <line
                          x1="40"
                          y1="20"
                          x2="20"
                          y2="30"
                          stroke="#3b82f6"
                          strokeWidth="1"
                        />
                        <line
                          x1="40"
                          y1="20"
                          x2="60"
                          y2="30"
                          stroke="#3b82f6"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Trees className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">프로젝트 일정 트리</p>
                    <p className="text-xs text-muted-foreground">
                      2025년 4월 15일 | SVG 생성됨
                    </p>
                    <div className="mt-2">
                      <svg
                        width="80"
                        height="40"
                        viewBox="0 0 80 40"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="40" cy="20" r="5" fill="#3b82f6" />
                        <circle cx="20" cy="30" r="3" fill="#3b82f6" />
                        <circle cx="60" cy="30" r="3" fill="#3b82f6" />
                        <line
                          x1="40"
                          y1="20"
                          x2="20"
                          y2="30"
                          stroke="#3b82f6"
                          strokeWidth="1"
                        />
                        <line
                          x1="40"
                          y1="20"
                          x2="60"
                          y2="30"
                          stroke="#3b82f6"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
