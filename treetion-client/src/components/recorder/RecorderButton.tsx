'use client';

import React from 'react';
import { Mic, MicOff, Pause, Play, Loader2 } from 'lucide-react';

interface RecordButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  isLoading?: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause?: () => void;
  onResume?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isPaused,
  isLoading = false,
  onStart,
  onStop,
  onPause,
  onResume,
  size = 'md',
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-10 w-10';
      case 'lg': return 'h-16 w-16';
      case 'md':
      default: return 'h-12 w-12';
    }
  };

  const sizeClass = getSizeClass();
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;

  if (isLoading) {
    return (
      <button
        className={`${sizeClass} flex items-center justify-center rounded-full bg-gray-300 text-gray-600 cursor-not-allowed`}
        disabled
      >
        <Loader2 size={iconSize} className="animate-spin" />
      </button>
    );
  }

  if (!isRecording) {
    return (
      <button
        className={`${sizeClass} flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400`}
        onClick={onStart}
        title="녹음 시작"
      >
        <Mic size={iconSize} />
      </button>
    );
  }

  if (isPaused) {
    return (
      <div className="flex gap-2">
        <button
          className={`${sizeClass} flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400`}
          onClick={onResume}
          title="녹음 재개"
        >
          <Play size={iconSize} />
        </button>
        <button
          className={`${sizeClass} flex items-center justify-center rounded-full bg-gray-500 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400`}
          onClick={onStop}
          title="녹음 중지"
        >
          <MicOff size={iconSize} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        className={`${sizeClass} flex items-center justify-center rounded-full bg-amber-500 text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400`}
        onClick={onPause}
        title="녹음 일시정지"
      >
        <Pause size={iconSize} />
      </button>
      <button
        className={`${sizeClass} flex items-center justify-center rounded-full bg-gray-500 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400`}
        onClick={onStop}
        title="녹음 중지"
      >
        <MicOff size={iconSize} />
      </button>
    </div>
  );
};

export default RecordButton;