import React from 'react';
import { FilterState } from '../../types/editor';
import { FILTER_PRESETS } from '../../utils/demoRenderer';
import { ToolSheet } from './ToolSheet';

interface FilterPanelProps {
  filter: FilterState;
  onChange: (next: FilterState) => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filter,
  onChange,
  onClose,
}) => {
  return (
    <ToolSheet
      title="الفلاتر"
      onClose={onClose}
      onReset={() => onChange({ id: 'original', intensity: 80 })}
    >
      {/* Intensity slider */}
      {filter.id !== 'original' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] text-[#BDBDBD]">شدة الفلتر</span>
            <span className="text-[12px] text-[#00CAE0] font-semibold tabular-nums">
              {filter.intensity}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={filter.intensity}
            onChange={(e) => onChange({ ...filter, intensity: Number(e.target.value) })}
            className="cap-slider w-full"
            dir="ltr"
          />
        </div>
      )}

      {/* Filter preset cards */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {FILTER_PRESETS.map((preset) => {
          const active = filter.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...filter, id: preset.id })}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div
                style={{ background: preset.swatch }}
                className={`w-[58px] h-[58px] rounded-xl flex items-center justify-center transition ${
                  active
                    ? 'ring-2 ring-[#00CAE0] scale-[1.03]'
                    : 'ring-1 ring-white/10 group-hover:ring-white/30'
                }`}
              >
                {preset.id === 'original' && (
                  <span className="text-[11px] text-white/75 font-medium">Ø</span>
                )}
              </div>
              <span
                className={`text-[11px] ${
                  active ? 'text-[#00CAE0] font-semibold' : 'text-[#CCCCCC]'
                }`}
              >
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </ToolSheet>
  );
};
