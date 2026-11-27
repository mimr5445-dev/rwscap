import React from 'react';
import {
  FullscreenIcon,
  PauseOutlineIcon,
  PlayOutlineIcon,
  RedoIcon,
  SyncToggleIcon,
  UndoIcon,
} from './icons/CapCutIcons';

interface TransportBarProps {
  isPlaying: boolean;
  canUndo: boolean;
  canRedo: boolean;
  syncEnabled: boolean;
  onTogglePlay: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleSync: () => void;
  onFullscreen: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  canUndo,
  canRedo,
  syncEnabled,
  onTogglePlay,
  onUndo,
  onRedo,
  onToggleSync,
  onFullscreen,
}) => {
  return (
    <div
      className="relative h-[48px] bg-[#141414] px-3.5 flex items-center justify-between shrink-0"
      dir="ltr"
    >
      {/* Left controls: Redo, Undo, Dual-Frame Sync ON/OFF (matches screenshot exact order) */}
      <div className="flex items-center gap-[18px]">
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1 transition ${
            canRedo
              ? 'text-[#E0E0E0] hover:text-white active:scale-90 cursor-pointer'
              : 'text-[#666666] cursor-default'
          }`}
          aria-label="إعادة"
          title="إعادة"
        >
          <RedoIcon size={20} />
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1 transition ${
            canUndo
              ? 'text-[#E0E0E0] hover:text-white active:scale-90 cursor-pointer'
              : 'text-[#666666] cursor-default'
          }`}
          aria-label="تراجع"
          title="تراجع"
        >
          <UndoIcon size={20} />
        </button>

        <button
          type="button"
          onClick={onToggleSync}
          className={`p-0.5 transition active:scale-90 cursor-pointer ${
            syncEnabled ? 'text-[#DCDCDC] hover:text-white' : 'text-[#6E6E6E] hover:text-[#9A9A9A]'
          }`}
          aria-label={syncEnabled ? 'ربط المسارات مفعل' : 'ربط المسارات متوقف'}
          title={syncEnabled ? 'ربط المسارات: ON' : 'ربط المسارات: OFF'}
        >
          <SyncToggleIcon size={24} enabled={syncEnabled} />
        </button>
      </div>

      {/* Center: Play / Pause hollow triangle */}
      <button
        type="button"
        onClick={onTogglePlay}
        className="absolute left-1/2 -translate-x-1/2 p-2 text-[#E4E4E4] hover:text-white active:scale-90 transition cursor-pointer"
        aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
      >
        {isPlaying ? <PauseOutlineIcon size={22} /> : <PlayOutlineIcon size={23} />}
      </button>

      {/* Right: Fullscreen */}
      <button
        type="button"
        onClick={onFullscreen}
        className="p-1 text-[#DCDCDC] hover:text-white active:scale-90 transition cursor-pointer"
        aria-label="ملء الشاشة"
        title="ملء الشاشة"
      >
        <FullscreenIcon size={21} />
      </button>
    </div>
  );
};
