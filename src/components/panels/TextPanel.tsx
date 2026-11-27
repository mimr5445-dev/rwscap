import React, { useState } from 'react';
import { TextItem } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface TextPanelProps {
  currentTime: number;
  totalDuration: number;
  textItems: TextItem[];
  onAddText: (item: TextItem) => void;
  onDeleteText: (id: string) => void;
  onClose: () => void;
}

const STYLES: Array<{ id: TextItem['stylePreset']; label: string; preview: string }> = [
  { id: 'clean', label: 'أبيض', preview: 'bg-[#2A2C2F] text-white' },
  { id: 'box', label: 'خلفية سوداء', preview: 'bg-black text-white border border-white/20' },
  { id: 'cyan', label: 'سماوي', preview: 'bg-[#00CAE0] text-[#09181C]' },
  { id: 'outline', label: 'حدود بارزة', preview: 'bg-[#2A2C2F] text-white font-bold' },
  { id: 'gold', label: 'ذهبي', preview: 'bg-[#2A2C2F] text-[#FFD447]' },
];

export const TextPanel: React.FC<TextPanelProps> = ({
  currentTime,
  totalDuration,
  textItems,
  onAddText,
  onDeleteText,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [stylePreset, setStylePreset] = useState<TextItem['stylePreset']>('clean');
  const [fontSize, setFontSize] = useState(28);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = text.trim();
    if (!cleaned) return;
    const start = Math.min(currentTime, Math.max(0, totalDuration - 1));
    const dur = Math.min(4, Math.max(1.5, totalDuration - start));
    onAddText({
      id: `txt-${Date.now()}`,
      text: cleaned,
      startTime: Number(start.toFixed(2)),
      duration: Number(dur.toFixed(2)),
      x: 50,
      y: 78,
      fontSize,
      color: '#FFFFFF',
      bgColor: 'transparent',
      stylePreset,
      isCaption: false,
    });
    setText('');
  };

  const normalTexts = textItems.filter((t) => !t.isCaption);

  return (
    <ToolSheet title="إضافة نص" onClose={onClose}>
      <form onSubmit={handleAdd} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب النص هنا..."
            className="flex-1 h-10 px-3 rounded-xl bg-[#27292C] border border-[#383B3F] focus:border-[#00CAE0] outline-none text-[13.5px] text-white placeholder:text-[#7E7E7E]"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-4 h-10 rounded-xl bg-[#00CAE0] disabled:bg-[#2E3033] disabled:text-[#6E6E6E] text-[#09181C] font-semibold text-[13px] cursor-pointer transition"
          >
            إضافة
          </button>
        </div>

        {/* Style presets */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {STYLES.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStylePreset(st.id)}
              className={`px-3 py-1.5 rounded-lg text-[11.5px] shrink-0 transition cursor-pointer ${st.preview} ${
                stylePreset === st.id ? 'ring-2 ring-[#00CAE0]' : 'opacity-80'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Font size */}
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#BDBDBD] shrink-0">الحجم</span>
          <input
            type="range"
            min={16}
            max={48}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="cap-slider flex-1"
            dir="ltr"
          />
          <span className="text-[12px] text-[#00CAE0] tabular-nums w-8 text-left">{fontSize}</span>
        </div>
      </form>

      {normalTexts.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#2C2E31] space-y-1.5">
          {normalTexts.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#27292C] text-[12px]"
            >
              <span className="truncate text-[#EFEFEF]">{t.text}</span>
              <button
                type="button"
                onClick={() => onDeleteText(t.id)}
                className="text-[#FF6B6B] hover:text-[#FF8585] text-[11px] mr-2 cursor-pointer"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </ToolSheet>
  );
};
