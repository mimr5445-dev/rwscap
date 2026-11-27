import React from 'react';
import { ClipAnimation, ClipAnimationId, VideoClip } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface AnimationPanelProps {
  clip: VideoClip;
  onChangeAnimation: (animation: ClipAnimation) => void;
  onClose: () => void;
}

const ANIM_PRESETS: Array<{ id: ClipAnimationId; label: string; hint: string }> = [
  { id: 'none', label: 'بدون', hint: 'ثابت' },
  { id: 'fade-in', label: 'تلاشي دخول', hint: 'دخول ناعم' },
  { id: 'zoom-in', label: 'تكبير دخول', hint: 'حركة بارزة' },
  { id: 'slide-up', label: 'صعود', hint: 'انزلاق لأعلى' },
  { id: 'ken-burns', label: 'كين بيرنز', hint: 'تقريب سينمائي' },
];

export const AnimationPanel: React.FC<AnimationPanelProps> = ({
  clip,
  onChangeAnimation,
  onClose,
}) => {
  const current: ClipAnimation = clip.animation ?? { id: 'none', duration: 0.7 };

  return (
    <ToolSheet
      title={`تحريك المقطع: ${clip.name}`}
      onClose={onClose}
      onReset={
        current.id !== 'none' ? () => onChangeAnimation({ id: 'none', duration: 0.7 }) : undefined
      }
    >
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
        {ANIM_PRESETS.map((preset) => {
          const active = current.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onChangeAnimation({ id: preset.id, duration: current.duration || 0.7 })
              }
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-colors cursor-pointer ${
                active
                  ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
                  : 'bg-[#27292C] text-[#DCDCDC] hover:bg-[#33363A]'
              }`}
            >
              <span className="text-[12px]">{preset.label}</span>
              <span
                className={`text-[10px] mt-0.5 ${active ? 'text-[#0B2228]' : 'text-[#8C8C8C]'}`}
              >
                {preset.hint}
              </span>
            </button>
          );
        })}
      </div>

      {current.id !== 'none' && current.id !== 'ken-burns' && (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[12px] text-[#BDBDBD] shrink-0">مدة الحركة</span>
          <input
            type="range"
            min={0.3}
            max={2}
            step={0.1}
            value={current.duration}
            onChange={(e) =>
              onChangeAnimation({ id: current.id, duration: Number(e.target.value) })
            }
            aria-label="مدة تحريك المقطع"
            className="cap-slider flex-1"
            dir="ltr"
          />
          <span className="text-[12px] text-[#00CAE0] tabular-nums w-12 text-left">
            {current.duration.toFixed(1)}s
          </span>
        </div>
      )}
    </ToolSheet>
  );
};
