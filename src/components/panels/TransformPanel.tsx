import React from 'react';
import { ClipTransform, DEFAULT_CLIP_TRANSFORM, VideoClip } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface TransformPanelProps {
  clip: VideoClip;
  onChangeTransform: (patch: Partial<ClipTransform>) => void;
  onResetTransform: () => void;
  onClose: () => void;
}

export const TransformPanel: React.FC<TransformPanelProps> = ({
  clip,
  onChangeTransform,
  onResetTransform,
  onClose,
}) => {
  const tr: ClipTransform = { ...DEFAULT_CLIP_TRANSFORM, ...clip.transform };

  return (
    <ToolSheet title={`تحويل: ${clip.name}`} onClose={onClose} onReset={onResetTransform}>
      {/* Quick action buttons: Rotate 90, Flip H, Flip V */}
      <div className="grid grid-cols-3 gap-2 mb-3.5">
        <button
          type="button"
          onClick={() => onChangeTransform({ rotation: (tr.rotation + 90) % 360 })}
          className="py-2 rounded-xl bg-[#27292C] hover:bg-[#33363B] text-[12px] text-[#EFEFEF] font-medium transition-colors cursor-pointer"
        >
          تدوير 90° ({tr.rotation}°)
        </button>
        <button
          type="button"
          onClick={() => onChangeTransform({ flipH: !tr.flipH })}
          className={`py-2 rounded-xl text-[12px] font-medium transition-colors cursor-pointer ${
            tr.flipH
              ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
              : 'bg-[#27292C] hover:bg-[#33363B] text-[#EFEFEF]'
          }`}
        >
          عكس أفقي
        </button>
        <button
          type="button"
          onClick={() => onChangeTransform({ flipV: !tr.flipV })}
          className={`py-2 rounded-xl text-[12px] font-medium transition-colors cursor-pointer ${
            tr.flipV
              ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
              : 'bg-[#27292C] hover:bg-[#33363B] text-[#EFEFEF]'
          }`}
        >
          عكس عمودي
        </button>
      </div>

      {/* Sliders: Scale, Opacity, X/Y Pan */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#BDBDBD] w-16 shrink-0">التكبير</span>
          <input
            type="range"
            min={50}
            max={200}
            step={5}
            value={Math.round(tr.scale * 100)}
            onChange={(e) => onChangeTransform({ scale: Number(e.target.value) / 100 })}
            aria-label="نسبة التكبير"
            className="cap-slider flex-1"
            dir="ltr"
          />
          <span className="text-[12px] text-[#00CAE0] tabular-nums w-12 text-left">
            {Math.round(tr.scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#BDBDBD] w-16 shrink-0">الشفافية</span>
          <input
            type="range"
            min={0}
            max={100}
            value={tr.opacity}
            onChange={(e) => onChangeTransform({ opacity: Number(e.target.value) })}
            aria-label="شفافية المقطع"
            className="cap-slider flex-1"
            dir="ltr"
          />
          <span className="text-[12px] text-[#00CAE0] tabular-nums w-12 text-left">
            {tr.opacity}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-[#9E9E9E] shrink-0">X</span>
            <input
              type="range"
              min={-50}
              max={50}
              value={tr.offsetX}
              onChange={(e) => onChangeTransform({ offsetX: Number(e.target.value) })}
              aria-label="إزاحة أفقية"
              className="cap-slider flex-1"
              dir="ltr"
            />
            <span className="text-[11px] text-[#BDBDBD] tabular-nums w-8 text-left">
              {tr.offsetX}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-[#9E9E9E] shrink-0">Y</span>
            <input
              type="range"
              min={-50}
              max={50}
              value={tr.offsetY}
              onChange={(e) => onChangeTransform({ offsetY: Number(e.target.value) })}
              aria-label="إزاحة عمودية"
              className="cap-slider flex-1"
              dir="ltr"
            />
            <span className="text-[11px] text-[#BDBDBD] tabular-nums w-8 text-left">
              {tr.offsetY}
            </span>
          </div>
        </div>
      </div>
    </ToolSheet>
  );
};
