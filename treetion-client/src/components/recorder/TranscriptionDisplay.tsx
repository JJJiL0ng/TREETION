'use client';

import React from 'react';
import { Loader2, FileText, Clock, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { TranscriptionResult } from '@/lib/api/audio/record';

interface TranscriptionDisplayProps {
  transcriptionId: string | null;
  status: 'queued' | 'processing' | 'completed' | 'failed' | null;
  result: TranscriptionResult | null;
  progress?: number;
  error?: string | null;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcriptionId,
  status,
  result,
  progress,
  error,
}) => {
  const [copied, setCopied] = React.useState(false);

  // 텍스트 복사
  const handleCopyText = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 로딩 표시
  if (!transcriptionId) {
    return null;
  }

  if (status === 'queued' || status === 'processing') {
    return (
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center mb-4">
          <Loader2 size={24} className="text-blue-500 animate-spin mr-2" />
          <h3 className="text-lg font-medium text-blue-700">
            {status === 'queued' ? '대기 중...' : '음성 변환 진행 중...'}
          </h3>
        </div>
        
        {progress !== undefined && progress > 0 && (
          <div>
            <div className="flex justify-between text-sm text-blue-700 mb-1">
              <span>처리 중...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <p className="text-sm text-blue-600 mt-2">
          변환 시간은 오디오 길이에 따라 달라질 수 있습니다.
        </p>
      </div>
    );
  }

  if (status === 'failed' || error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-100">
        <div className="flex items-center mb-3">
          <AlertCircle size={24} className="text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-700">
            음성 변환에 실패했습니다
          </h3>
        </div>
        <p className="text-sm text-red-600">
          {error || '오류가 발생했습니다. 다시 시도해 주세요.'}
        </p>
      </div>
    );
  }

  if (status === 'completed' && result) {
    return (
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
          <div className="flex items-center">
            <FileText size={18} className="text-gray-500 mr-2" />
            <span className="font-medium text-gray-700">변환 결과</span>
          </div>
          
          <button
            onClick={handleCopyText}
            className="flex items-center px-2 py-1 text-xs bg-white rounded border hover:bg-gray-50"
            title="텍스트 복사"
          >
            {copied ? (
              <>
                <CheckCircle size={14} className="text-green-500 mr-1" />
                <span className="text-green-600">복사됨</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-gray-500 mr-1" />
                <span>복사</span>
              </>
            )}
          </button>
        </div>
        
        <div className="p-4">
          {/* 전체 텍스트 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">전체 텍스트</h4>
            <div className="p-3 bg-gray-50 rounded-md text-gray-800 text-sm whitespace-pre-wrap">
              {result.text}
            </div>
          </div>
          
          {/* 세그먼트 목록 */}
          {result.segments && result.segments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">세그먼트 별 텍스트</h4>
              <div className="space-y-2">
                {result.segments.map((segment) => (
                  <div key={segment.id} className="border rounded-md p-2">
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <Clock size={12} className="mr-1" />
                      <span>
                        {formatTimeCode(segment.start)} - {formatTimeCode(segment.end)}
                      </span>
                      <span className="ml-auto text-xs">
                        신뢰도: {Math.round(segment.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{segment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

// 초 단위 시간을 mm:ss 형식으로 변환
const formatTimeCode = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default TranscriptionDisplay;