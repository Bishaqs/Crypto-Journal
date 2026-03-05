"use client";

import type { PlaybackSpeed } from "@/lib/simulator/types";
import {
  SkipBack,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  SkipForward,
} from "lucide-react";

const SPEEDS: PlaybackSpeed[] = [1, 2, 5, 10, 25];

interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: PlaybackSpeed;
  currentIndex: number;
  totalCandles: number;
  currentTime: string;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onSeek: (index: number) => void;
}

export default function PlaybackControls({
  isPlaying,
  speed,
  currentIndex,
  totalCandles,
  currentTime,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onJumpStart,
  onJumpEnd,
  onSpeedChange,
  onSeek,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#111118] border-t border-white/5">
      {/* Transport controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onJumpStart}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Jump to start"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={onStepBack}
          disabled={isPlaying}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
          title="Step back"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={onStepForward}
          disabled={isPlaying}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
          title="Step forward"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onJumpEnd}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Jump to end"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Progress slider */}
      <input
        type="range"
        min={0}
        max={Math.max(0, totalCandles - 1)}
        value={currentIndex}
        onChange={(e) => onSeek(parseInt(e.target.value, 10))}
        className="flex-1 h-1 min-w-[100px] accent-white/60 cursor-pointer"
      />

      {/* Speed selector */}
      <div className="flex items-center gap-1 ml-2">
        <span className="text-xs text-gray-500 mr-1">Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              speed === s
                ? "bg-white/15 text-white"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Progress info */}
      <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
        <span>
          {currentIndex + 1} / {totalCandles}
        </span>
        <span className="font-mono">{currentTime}</span>
      </div>

      {/* Keyboard hints */}
      <div className="hidden lg:flex items-center gap-2 ml-4 text-[10px] text-gray-600">
        <Kbd>Space</Kbd>
        <Kbd>B</Kbd>
        <span className="text-gray-700">Buy</span>
        <Kbd>S</Kbd>
        <span className="text-gray-700">Sell</span>
        <Kbd>F</Kbd>
        <span className="text-gray-700">Flat</span>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1 py-0.5 bg-white/5 rounded text-gray-500 font-mono">
      {children}
    </kbd>
  );
}
