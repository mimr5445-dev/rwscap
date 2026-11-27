import React from 'react';
import { BackgroundConfig } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface BackgroundPanelProps {
  background: BackgroundConfig;
  onChange: (next: BackgroundConfig) => void;
  onClose: () => void;
}

const COLORS = [
  '#000000',
  '#14181F',
  '#1E293B',
  '#0F3A42',
  '#00CAE0',
  '#F8FAFC',
  '#7F1D1D',
  '#4C1D95',
  '#78350F',
];

const GRADIENTS = [
  { label: 'أزرق عميق', value: '#0f2027,#2c5364' },
  { label: 'نيون', value: '#00cae0,#3b1d75' },
  { label: 'غروب', value: '#3a1c71,#d76d77' },
  { label: 'فحمي', value: '#232526,#414345' },
];

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  background,
  onChange,
  onClose,
}) => {
  return (
    <ToolSheet
      title="الخلفية"
      onClose={onClose}
      onReset={() => onChange({ mode: 'none', value: '#000000', blurAmount: 18 })}
    >
      {/* Mode tabs */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {(
          [
            ['none', 'بلا'],
            ['color', 'لون'],
            ['blur', 'تمويه'],
            ['gradient', 'تدرج'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() =>
              onChange({
                ...background,
                mode,
                value:
                  mode === 'gradient'
                    ? GRADIENTS[0].value
                    : mode === 'color'
                      ? '#1E293B'
                      : background.value,
              })
            }
            className={`py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer ${
              background.mode === mode
                ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
                : 'bg-[#282A2D] text-[#D0D0D0]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {background.mode === 'color' && (
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onChange({ ...background, mode: 'color', value: hex })}
              style={{ backgroundColor: hex }}
              className={`w-10 h-10 rounded-full shrink-0 border-2 transition cursor-pointer ${
                background.value === hex ? 'border-[#00CAE0] scale-105' : 'border-white/20'
              }`}
              aria-label={`لون ${hex}`}
            />
          ))}
        </div>
      )}

      {background.mode === 'blur' && (
        <div className="py-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#CFCFCF]">درجة التمويه</span>
            <span className="text-[12px] text-[#00CAE0] tabular-nums">{background.blurAmount}px</span>
          </div>
          <input
            type="range"
            min={8}
            max={40}
            value={background.blurAmount}
            onChange={(e) =>
              onChange({ ...background, mode: 'blur', blurAmount: Number(e.target.value) })
            }
            className="cap-slider w-full"
            dir="ltr"
          />
        </div>
      )}

      {background.mode === 'gradient' && (
        <div className="grid grid-cols-4 gap-2">
          {GRADIENTS.map((g) => {
            const [c1, c2] = g.value.split(',');
            const active = background.value === g.value;
            return (
              <button
                key={g.label}
                type="button"
                onClick={() => onChange({ ...background, mode: 'gradient', value: g.value })}
                className="flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  className={`w-full h-11 rounded-xl border-2 ${
                    active ? 'border-[#00CAE0]' : 'border-white/10'
                  }`}
                />
                <span className="text-[11px] text-[#CFCFCF]">{g.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {background.mode === 'none' && (
        <p className="text-[12px] text-[#8E8E8E] text-center py-2">
          اختر لوناً أو تمويهاً أو تدرجاً لإظهار إطار خلفية حول الفيديو.
        </p>
      )}
    </ToolSheet>
  );
};
