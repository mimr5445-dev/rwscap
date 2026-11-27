import React, { useEffect, useRef, useState } from 'react';
import { ProjectState } from '../../types/editor';
import { MediaElementCache, renderCompositeFrame } from '../../utils/demoRenderer';
import { formatTimecode } from '../../utils/time';
import { CheckIcon, CloseIcon } from '../icons/CapCutIcons';

interface CoverModalProps {
  state: ProjectState;
  totalDuration: number;
  mediaCache: MediaElementCache;
  onSaveCover: (coverTime: number, customCoverUrl?: string) => void;
  onClose: () => void;
}

export const CoverModal: React.FC<CoverModalProps> = ({
  state,
  totalDuration,
  mediaCache,
  onSaveCover,
  onClose,
}) => {
  const [time, setTime] = useState(state.coverTime);
  const [customUrl, setCustomUrl] = useState<string | undefined>(state.customCoverUrl);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customUrl || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    renderCompositeFrame(ctx, 480, 270, state, time, mediaCache);
  }, [time, customUrl, state, mediaCache]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[360px] rounded-2xl bg-[#1E2023] border border-[#303338] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2E32]">
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#A8A8A8] hover:text-white cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
          <span className="text-[14px] font-semibold text-white">تعديل الغلاف</span>
          <button
            type="button"
            onClick={() => {
              onSaveCover(time, customUrl);
              onClose();
            }}
            className="p-1 text-[#00CAE0] hover:text-[#3CE4F5] cursor-pointer"
          >
            <CheckIcon size={19} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
            {customUrl ? (
              <img src={customUrl} alt="غلاف مخصص" className="w-full h-full object-cover" />
            ) : (
              <canvas ref={canvasRef} width={480} height={270} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#CCCCCC]">اختر إطاراً من الفيديو</span>
              <span className="text-[#00CAE0] tabular-nums">{formatTimecode(time)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={time}
              onChange={(e) => {
                setCustomUrl(undefined);
                setTime(Number(e.target.value));
              }}
              className="cap-slider w-full"
              dir="ltr"
            />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 rounded-xl bg-[#2A2C30] hover:bg-[#35383D] text-[#E6E6E6] text-[12.5px] font-medium cursor-pointer"
          >
            أو رفع صورة غلاف من جهازك
          </button>
        </div>
      </div>
    </div>
  );
};
