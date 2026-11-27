import React, { useRef } from 'react';
import { OverlayItem } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface OverlayPanelProps {
  currentTime: number;
  totalDuration: number;
  overlays: OverlayItem[];
  onAddOverlay: (item: OverlayItem) => void;
  onUpdateOverlayOpacity: (id: string, opacity: number) => void;
  onDeleteOverlay: (id: string) => void;
  onClose: () => void;
}

const PRESETS: Array<{ preset: NonNullable<OverlayItem['preset']>; name: string; desc: string }> = [
  { preset: 'rec', name: 'مؤشر تسجيل REC', desc: 'شارة كاميرا متحركة' },
  { preset: 'hud', name: 'إطار HUD تقني', desc: 'زوايا رقمية سماوية' },
  { preset: 'frame', name: 'أشرطة سينمائية', desc: 'إطار Letterbox علوي وسفلي' },
  { preset: 'grid', name: 'شبكة التكوين', desc: 'قاعدة الأثلاث' },
];

export const OverlayPanel: React.FC<OverlayPanelProps> = ({
  currentTime,
  totalDuration,
  overlays,
  onAddOverlay,
  onUpdateOverlayOpacity,
  onDeleteOverlay,
  onClose,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddPreset = (p: (typeof PRESETS)[number]) => {
    const start = Math.min(currentTime, Math.max(0, totalDuration - 1));
    onAddOverlay({
      id: `ov-${Date.now()}`,
      name: p.name,
      preset: p.preset,
      startTime: Number(start.toFixed(2)),
      duration: Number(Math.max(2, totalDuration - start).toFixed(2)),
      x: 50,
      y: 50,
      scale: 1,
      opacity: 90,
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const start = Math.min(currentTime, Math.max(0, totalDuration - 1));
    onAddOverlay({
      id: `ov-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ''),
      srcUrl: url,
      startTime: Number(start.toFixed(2)),
      duration: Number(Math.max(2.5, totalDuration - start).toFixed(2)),
      x: 72,
      y: 28,
      scale: 1,
      opacity: 95,
    });
    e.target.value = '';
  };

  return (
    <ToolSheet title="تراكب" onClose={onClose}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full py-2.5 mb-3 rounded-xl bg-[#00CAE0] hover:bg-[#19D4E8] text-[#09181C] font-semibold text-[13px] cursor-pointer"
      >
        + إضافة صورة كتراكب (PIP)
      </button>

      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.preset}
            type="button"
            onClick={() => handleAddPreset(p)}
            className="text-right p-2.5 rounded-xl bg-[#27292C] hover:bg-[#313438] transition cursor-pointer"
          >
            <div className="text-[12.5px] font-medium text-[#EFEFEF]">{p.name}</div>
            <div className="text-[10.5px] text-[#8E8E8E] mt-0.5">{p.desc}</div>
          </button>
        ))}
      </div>

      {overlays.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#2C2E31] space-y-2">
          {overlays.map((ov) => (
            <div key={ov.id} className="p-2.5 rounded-xl bg-[#242830] space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#EAEAEA] font-medium">{ov.name}</span>
                <button
                  type="button"
                  onClick={() => onDeleteOverlay(ov.id)}
                  className="text-[#FF6B6B] text-[11px] cursor-pointer"
                >
                  حذف
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#9A9A9A]">الشفافية</span>
                <input
                  type="range"
                  min={15}
                  max={100}
                  value={ov.opacity}
                  onChange={(e) => onUpdateOverlayOpacity(ov.id, Number(e.target.value))}
                  className="cap-slider flex-1"
                  dir="ltr"
                />
                <span className="text-[11px] text-[#00CAE0] tabular-nums w-8 text-left">
                  {ov.opacity}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolSheet>
  );
};
