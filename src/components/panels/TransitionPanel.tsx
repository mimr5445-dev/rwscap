import React from 'react';
import { ClipTransition, TransitionId, VideoClip } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface TransitionPanelProps {
  clip: VideoClip;
  clipIndex: number;
  hasMultipleJunctions: boolean;
  onChangeTransition: (transition: ClipTransition) => void;
  onApplyAll: (transition: ClipTransition) => void;
  onClose: () => void;
}

const TRANSITION_OPTIONS: Array<{ id: TransitionId; label: string; badge: string }> = [
  { id: 'none', label: 'بدون', badge: '∅' },
  { id: 'dissolve', label: 'تلاشي ناعم', badge: '◐' },
  { id: 'fade', label: 'تلاشي أسود', badge: '●' },
  { id: 'slide-left', label: 'انزلاق أفقي', badge: '⇄' },
  { id: 'slide-up', label: 'انزلاق عمودي', badge: '⇅' },
  { id: 'zoom-in', label: 'تكبير سينمائي', badge: '⊕' },
  { id: 'wipe', label: 'مسح جانبي', badge: '◧' },
];

export const TransitionPanel: React.FC<TransitionPanelProps> = ({
  clip,
  clipIndex,
  hasMultipleJunctions,
  onChangeTransition,
  onApplyAll,
  onClose,
}) => {
  const current: ClipTransition = clip.transitionOut ?? { id: 'none', duration: 0.6 };

  return (
    <ToolSheet
      title={`انتقال بعد المقطع ${clipIndex + 1}`}
      onClose={onClose}
      onReset={
        current.id !== 'none'
          ? () => onChangeTransition({ id: 'none', duration: 0.6 })
          : undefined
      }
    >
      <div className="grid grid-cols-4 gap-2 mb-3">
        {TRANSITION_OPTIONS.map((opt) => {
          const active = current.id === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeTransition({ id: opt.id, duration: current.duration || 0.6 })}
              className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl text-[11.5px] transition-colors cursor-pointer ${
                active
                  ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
                  : 'bg-[#27292C] text-[#DCDCDC] hover:bg-[#323539]'
              }`}
            >
              <span className="text-[16px] leading-none mb-1" aria-hidden="true">
                {opt.badge}
              </span>
              <span className="truncate max-w-full">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {current.id !== 'none' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#BDBDBD] shrink-0">المدة</span>
            <input
              type="range"
              min={0.2}
              max={1.5}
              step={0.1}
              value={current.duration}
              onChange={(e) =>
                onChangeTransition({ id: current.id, duration: Number(e.target.value) })
              }
              aria-label="مدة الانتقال"
              className="cap-slider flex-1"
              dir="ltr"
            />
            <span className="text-[12px] text-[#00CAE0] tabular-nums w-12 text-left">
              {current.duration.toFixed(1)}s
            </span>
          </div>

          {hasMultipleJunctions && (
            <button
              type="button"
              onClick={() => onApplyAll(current)}
              className="w-full py-2 rounded-xl bg-[#27292C] hover:bg-[#323539] text-[#00CAE0] text-[12.5px] font-medium transition-colors cursor-pointer"
            >
              تطبيق على جميع الانتقالات
            </button>
          )}
        </div>
      )}
    </ToolSheet>
  );
};
