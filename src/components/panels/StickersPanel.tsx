import React from 'react';
import { StickerItem } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface StickersPanelProps {
  currentTime: number;
  totalDuration: number;
  stickers: StickerItem[];
  onAddSticker: (item: StickerItem) => void;
  onDeleteSticker: (id: string) => void;
  onClose: () => void;
}

const STICKER_LIBRARY = [
  { stickerId: 'spark', glyph: '✨', label: 'بريق' },
  { stickerId: 'fire', glyph: '🔥', label: 'حماس' },
  { stickerId: 'target', glyph: '🎯', label: 'هدف' },
  { stickerId: 'pin', glyph: '📍', label: 'موقع' },
  { stickerId: 'globe', glyph: '🌍', label: 'عالم' },
  { stickerId: 'cam', glyph: '🎬', label: 'مشهد' },
  { stickerId: 'star', glyph: '⭐', label: 'نجمة' },
  { stickerId: 'bolt', glyph: '⚡', label: 'طاقة' },
  { stickerId: 'arrow', glyph: '➡️', label: 'سهم' },
  { stickerId: 'heart', glyph: '❤️', label: 'إعجاب' },
  { stickerId: 'check', glyph: '✅', label: 'مؤكد' },
  { stickerId: 'radar', glyph: '📡', label: 'إشارة' },
];

export const StickersPanel: React.FC<StickersPanelProps> = ({
  currentTime,
  totalDuration,
  stickers,
  onAddSticker,
  onDeleteSticker,
  onClose,
}) => {
  const handlePick = (entry: (typeof STICKER_LIBRARY)[number]) => {
    const start = Math.min(currentTime, Math.max(0, totalDuration - 1));
    const dur = Math.min(3.5, Math.max(1.2, totalDuration - start));
    onAddSticker({
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stickerId: entry.stickerId,
      label: entry.label,
      glyph: entry.glyph,
      startTime: Number(start.toFixed(2)),
      duration: Number(dur.toFixed(2)),
      x: 50 + (Math.random() * 20 - 10),
      y: 45 + (Math.random() * 18 - 9),
      scale: 1,
    });
  };

  return (
    <ToolSheet title="ملصقات" onClose={onClose}>
      <div className="grid grid-cols-6 gap-2 mb-3">
        {STICKER_LIBRARY.map((item) => (
          <button
            key={item.stickerId}
            type="button"
            onClick={() => handlePick(item)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#27292C] hover:bg-[#33363A] active:scale-95 transition cursor-pointer"
          >
            <span className="text-[24px] leading-none">{item.glyph}</span>
            <span className="text-[10px] text-[#BDBDBD] mt-1">{item.label}</span>
          </button>
        ))}
      </div>

      {stickers.length > 0 && (
        <div className="pt-2.5 border-t border-[#2C2E31]">
          <p className="text-[11px] text-[#8E8E8E] mb-2">
            الملصقات المضافة (اسحب الملصق على الشاشة لتغيير موقعه):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stickers.map((st) => (
              <span
                key={st.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2B2538] text-[12px] text-[#EAEAEA]"
              >
                <span>{st.glyph}</span>
                <span>{st.label}</span>
                <button
                  type="button"
                  onClick={() => onDeleteSticker(st.id)}
                  className="text-white/60 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </ToolSheet>
  );
};
