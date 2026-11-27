import React, { useState } from 'react';
import { Adjustments, DEFAULT_ADJUSTMENTS } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface AdjustPanelProps {
  adjustments: Adjustments;
  onChange: (next: Adjustments) => void;
  onClose: () => void;
}

const SLIDERS: Array<{
  key: keyof Adjustments;
  label: string;
  min: number;
  max: number;
}> = [
  { key: 'brightness', label: 'السطوع', min: -50, max: 50 },
  { key: 'contrast', label: 'التباين', min: -50, max: 50 },
  { key: 'saturation', label: 'التشبع', min: -50, max: 50 },
  { key: 'exposure', label: 'التعرض', min: -50, max: 50 },
  { key: 'sharpen', label: 'الحدة', min: 0, max: 100 },
  { key: 'temperature', label: 'الحرارة', min: -50, max: 50 },
  { key: 'vignette', label: 'التظليل', min: 0, max: 100 },
];

export const AdjustPanel: React.FC<AdjustPanelProps> = ({
  adjustments,
  onChange,
  onClose,
}) => {
  const [selectedKey, setSelectedKey] = useState<keyof Adjustments>('brightness');
  const active = SLIDERS.find((s) => s.key === selectedKey) || SLIDERS[0];
  const val = adjustments[active.key];

  return (
    <ToolSheet
      title="ضبط"
      onClose={onClose}
      onReset={() => onChange({ ...DEFAULT_ADJUSTMENTS })}
    >
      {/* Active Slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12.5px] text-[#CFCFCF]">{active.label}</span>
          <span className="text-[12.5px] font-semibold text-[#00CAE0] tabular-nums" dir="ltr">
            {val > 0 ? `+${val}` : val}
          </span>
        </div>
        <input
          type="range"
          min={active.min}
          max={active.max}
          value={val}
          onChange={(e) =>
            onChange({ ...adjustments, [active.key]: Number(e.target.value) })
          }
          className="cap-slider w-full"
          dir="ltr"
        />
      </div>

      {/* Parameter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {SLIDERS.map((s) => {
          const isSel = s.key === selectedKey;
          const modified = adjustments[s.key] !== 0;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSelectedKey(s.key)}
              className={`relative shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-medium transition cursor-pointer ${
                isSel
                  ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
                  : 'bg-[#27292C] text-[#D2D2D2] hover:bg-[#323438]'
              }`}
            >
              {s.label}
              {modified && !isSel && (
                <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#00CAE0]" />
              )}
            </button>
          );
        })}
      </div>
    </ToolSheet>
  );
};
