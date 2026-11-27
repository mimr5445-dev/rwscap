import React, { useState } from 'react';
import { TextItem } from '../../types/editor';
import { formatTimecode } from '../../utils/time';
import { ToolSheet } from './ToolSheet';

interface CaptionsPanelProps {
  currentTime: number;
  totalDuration: number;
  captions: TextItem[];
  onAddCaption: (item: TextItem) => void;
  onDeleteCaption: (id: string) => void;
  onClose: () => void;
}

export const CaptionsPanel: React.FC<CaptionsPanelProps> = ({
  currentTime,
  totalDuration,
  captions,
  onAddCaption,
  onDeleteCaption,
  onClose,
}) => {
  const [line, setLine] = useState('');
  const [stylePreset, setStylePreset] = useState<TextItem['stylePreset']>('box');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = line.trim();
    if (!cleaned) return;
    const start = Math.min(currentTime, Math.max(0, totalDuration - 1));
    const dur = Math.min(3.5, Math.max(1.5, totalDuration - start));
    onAddCaption({
      id: `cap-${Date.now()}`,
      text: cleaned,
      startTime: Number(start.toFixed(2)),
      duration: Number(dur.toFixed(2)),
      x: 50,
      y: 86,
      fontSize: 22,
      color: '#FFFFFF',
      bgColor: 'rgba(0,0,0,0.72)',
      stylePreset,
      isCaption: true,
    });
    setLine('');
  };

  const handleAutoSampleCaptions = () => {
    const sampleLines = [
      { text: 'مرحباً بكم في محرر الفيديو السريع', start: 0, dur: 2.8 },
      { text: 'تحكم كامل بالمسارات والفلاتر والضبط', start: 3.0, dur: 3.0 },
      { text: 'تصدير فوري بجودة عالية', start: 6.2, dur: 2.6 },
    ];
    sampleLines.forEach((s, idx) => {
      if (s.start < totalDuration) {
        onAddCaption({
          id: `autocap-${Date.now()}-${idx}`,
          text: s.text,
          startTime: s.start,
          duration: Math.min(s.dur, totalDuration - s.start),
          x: 50,
          y: 86,
          fontSize: 21,
          color: '#FFFFFF',
          bgColor: 'rgba(0,0,0,0.72)',
          stylePreset: 'box',
          isCaption: true,
        });
      }
    });
  };

  return (
    <ToolSheet title="الشروحات" onClose={onClose}>
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleAutoSampleCaptions}
          className="w-full py-2.5 rounded-xl bg-[#27292C] hover:bg-[#313438] border border-[#00CAE0]/40 text-[#00CAE0] text-[12.5px] font-semibold transition cursor-pointer"
        >
          ✦ إنشاء شروحات تلقائية للمشهد
        </button>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={line}
            onChange={(e) => setLine(e.target.value)}
            placeholder={`إضافة شرح عند ${formatTimecode(currentTime)}...`}
            className="flex-1 h-10 px-3 rounded-xl bg-[#27292C] border border-[#383B3F] focus:border-[#00CAE0] outline-none text-[13px] text-white placeholder:text-[#7E7E7E]"
          />
          <button
            type="submit"
            disabled={!line.trim()}
            className="px-4 h-10 rounded-xl bg-[#00CAE0] disabled:bg-[#2E3033] disabled:text-[#6E6E6E] text-[#09181C] font-semibold text-[12.5px] cursor-pointer"
          >
            إضافة
          </button>
        </form>

        <div className="flex items-center gap-2">
          {(
            [
              ['box', 'صندوق داكن'],
              ['outline', 'خط بارز'],
              ['cyan', 'شريط سماوي'],
              ['gold', 'ذهبي'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStylePreset(id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer ${
                stylePreset === id
                  ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
                  : 'bg-[#27292C] text-[#CCCCCC]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {captions.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#2C2E31]">
            {captions.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#27292C] text-[12px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10.5px] text-[#00CAE0] tabular-nums shrink-0">
                    {formatTimecode(c.startTime)}
                  </span>
                  <span className="truncate text-[#EAEAEA]">{c.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteCaption(c.id)}
                  className="text-[#FF6B6B] text-[11px] mr-2 cursor-pointer"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolSheet>
  );
};
