import React from 'react';
import { AspectRatioId } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface AspectPanelProps {
  aspectRatio: AspectRatioId;
  onChange: (next: AspectRatioId) => void;
  onClose: () => void;
}

const RATIOS: Array<{ id: AspectRatioId; label: string; box: string }> = [
  { id: 'fit', label: 'ملاءمة', box: 'w-7 h-5' },
  { id: '16:9', label: '16:9', box: 'w-8 h-4.5' },
  { id: '9:16', label: '9:16', box: 'w-4.5 h-8' },
  { id: '1:1', label: '1:1', box: 'w-6 h-6' },
  { id: '4:3', label: '4:3', box: 'w-7 h-5' },
  { id: '3:4', label: '3:4', box: 'w-5 h-7' },
  { id: '2.35:1', label: '2.35:1', box: 'w-9 h-3.5' },
];

export const AspectPanel: React.FC<AspectPanelProps> = ({
  aspectRatio,
  onChange,
  onClose,
}) => {
  return (
    <ToolSheet title="نسبة العرض إلى الارتفاع" onClose={onClose}>
      <div className="flex items-end gap-3 overflow-x-auto no-scrollbar pb-1">
        {RATIOS.map((r) => {
          const active = aspectRatio === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(r.id)}
              className="flex flex-col items-center gap-2 shrink-0 min-w-[54px] py-1 cursor-pointer"
            >
              <div className="h-9 flex items-center justify-center">
                <div
                  className={`${r.box} rounded-[4px] border-2 transition ${
                    active
                      ? 'border-[#00CAE0] bg-[#00CAE0]/20'
                      : 'border-[#7E7E7E] hover:border-white'
                  }`}
                />
              </div>
              <span
                className={`text-[11.5px] tabular-nums ${
                  active ? 'text-[#00CAE0] font-semibold' : 'text-[#CFCFCF]'
                }`}
              >
                {r.label}
              </span>
            </button>
          );
        })}
      </div>
    </ToolSheet>
  );
};
