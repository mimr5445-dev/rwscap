import React, { useState } from 'react';
import { LayerAnimationId, TextItem } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface TextPanelProps {
  currentTime: number;
  totalDuration: number;
  textItems: TextItem[];
  onAddText: (item: TextItem) => void;
  onUpdateText: (id: string, patch: Partial<TextItem>) => void;
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

const TEXT_ANIMS: Array<{ id: LayerAnimationId; label: string }> = [
  { id: 'none', label: 'ثابت' },
  { id: 'fade', label: 'تلاشي' },
  { id: 'pop', label: 'انبثاق' },
  { id: 'slide-up', label: 'صعود' },
  { id: 'typewriter', label: 'آلة كاتبة' },
];

export const TextPanel: React.FC<TextPanelProps> = ({
  currentTime,
  totalDuration,
  textItems,
  onAddText,
  onUpdateText,
  onDeleteText,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [stylePreset, setStylePreset] = useState<TextItem['stylePreset']>('clean');
  const [animation, setAnimation] = useState<LayerAnimationId>('pop');
  const [fontSize, setFontSize] = useState(28);
  const [duration, setDuration] = useState(3.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = text.trim();
    if (!cleaned) return;

    if (editingId) {
      onUpdateText(editingId, {
        text: cleaned,
        stylePreset,
        animation,
        fontSize,
        duration,
      });
      setEditingId(null);
      setText('');
      return;
    }

    const start = Math.min(currentTime, Math.max(0, totalDuration - 1));
    const dur = Math.min(duration, Math.max(1, totalDuration - start));
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
      animation,
      isCaption: false,
    });
    setText('');
  };

  const handleSelectForEdit = (item: TextItem) => {
    setEditingId(item.id);
    setText(item.text);
    setStylePreset(item.stylePreset);
    setAnimation(item.animation || 'none');
    setFontSize(item.fontSize);
    setDuration(item.duration);
  };

  const normalTexts = textItems.filter((t) => !t.isCaption);

  return (
    <ToolSheet
      title={editingId ? 'تعديل نص' : 'إضافة نص'}
      onClose={onClose}
      onReset={
        editingId
          ? () => {
              setEditingId(null);
              setText('');
            }
          : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
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
            className="px-4 h-10 rounded-xl bg-[#00CAE0] disabled:bg-[#2E3033] disabled:text-[#6E6E6E] text-[#09181C] font-semibold text-[13px] cursor-pointer transition-colors"
          >
            {editingId ? 'حفظ' : 'إضافة'}
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

        {/* Animation presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-[#8E8E8E] shrink-0 ml-1">حركة:</span>
          {TEXT_ANIMS.map((an) => (
            <button
              key={an.id}
              type="button"
              onClick={() => setAnimation(an.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] shrink-0 transition-colors cursor-pointer ${
                animation === an.id
                  ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
                  : 'bg-[#27292C] text-[#CCCCCC] hover:bg-[#323539]'
              }`}
            >
              {an.label}
            </button>
          ))}
        </div>

        {/* Font size & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-[#BDBDBD] shrink-0">الحجم</span>
            <input
              type="range"
              min={16}
              max={48}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              aria-label="حجم الخط"
              className="cap-slider flex-1"
              dir="ltr"
            />
            <span className="text-[11.5px] text-[#00CAE0] tabular-nums w-6 text-left">{fontSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-[#BDBDBD] shrink-0">المدة</span>
            <input
              type="range"
              min={1}
              max={Math.max(2, Math.min(12, Math.ceil(totalDuration)))}
              step={0.5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              aria-label="مدة ظهور النص"
              className="cap-slider flex-1"
              dir="ltr"
            />
            <span className="text-[11.5px] text-[#00CAE0] tabular-nums w-8 text-left">
              {duration.toFixed(1)}s
            </span>
          </div>
        </div>
      </form>

      {normalTexts.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#2C2E31] space-y-1.5">
          {normalTexts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[12px] ${
                editingId === t.id ? 'bg-[#17363D] ring-1 ring-[#00CAE0]' : 'bg-[#27292C]'
              }`}
            >
              <span className="truncate text-[#EFEFEF] flex-1">{t.text}</span>
              <div className="flex items-center gap-2 mr-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectForEdit(t)}
                  className="text-[#00CAE0] hover:text-[#35DDF0] text-[11px] cursor-pointer"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingId === t.id) {
                      setEditingId(null);
                      setText('');
                    }
                    onDeleteText(t.id);
                  }}
                  className="text-[#FF6B6B] hover:text-[#FF8585] text-[11px] cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolSheet>
  );
};
