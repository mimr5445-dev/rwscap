import React, { useState, useRef, useEffect } from 'react';
import { ExportSettings, ResolutionId } from '../types/editor';
import { CloseIcon, DropdownTriangleIcon, SearchIcon } from './icons/CapCutIcons';

interface TopBarProps {
  exportSettings: ExportSettings;
  onChangeExportSettings: (settings: ExportSettings) => void;
  totalDuration: number;
  onExportClick: () => void;
  onSearchClick: () => void;
  onCloseClick: () => void;
}

const RESOLUTIONS: ResolutionId[] = ['480P', '540P', '720P', '1080P', '2K/4K'];
const FPS_OPTIONS: Array<ExportSettings['fps']> = [24, 25, 30, 50, 60];

export const TopBar: React.FC<TopBarProps> = ({
  exportSettings,
  onChangeExportSettings,
  totalDuration,
  onExportClick,
  onSearchClick,
  onCloseClick,
}) => {
  const [qualityOpen, setQualityOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!qualityOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setQualityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [qualityOpen]);

  const estimateMb = () => {
    const resMult: Record<ResolutionId, number> = {
      '480P': 0.35,
      '540P': 0.5,
      '720P': 0.85,
      '1080P': 1.5,
      '2K/4K': 2.8,
    };
    const bitMult =
      exportSettings.bitrate === 'low' ? 0.65 : exportSettings.bitrate === 'high' ? 1.55 : 1;
    const fpsMult = exportSettings.fps / 30;
    const mb = Math.max(0.8, totalDuration * resMult[exportSettings.resolution] * bitMult * fpsMult);
    return mb.toFixed(1);
  };

  return (
    <header className="relative z-40 flex items-center justify-between bg-[#141414] px-3.5 pt-2.5 pb-2 shrink-0" dir="ltr">
      {/* Left side: Export cyan button + 540P resolution selector */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onExportClick}
          className="h-[34px] px-[18px] rounded-[9px] bg-[#00CAE0] hover:bg-[#16D5EA] active:scale-[0.97] text-[#09181C] font-semibold text-[14.5px] leading-none flex items-center justify-center transition cursor-pointer"
          dir="rtl"
        >
          تصدير
        </button>

        <button
          type="button"
          onClick={() => setQualityOpen((v) => !v)}
          className="h-[34px] px-3 rounded-[9px] bg-[#292A2C] hover:bg-[#323437] active:scale-[0.98] text-white font-semibold text-[13.5px] leading-none flex items-center gap-1.5 transition cursor-pointer tabular-nums"
          aria-expanded={qualityOpen}
          aria-label="إعدادات الدقة"
        >
          <DropdownTriangleIcon size={8} className="text-[#E0E0E0] translate-y-[0.5px]" />
          <span>{exportSettings.resolution}</span>
        </button>
      </div>

      {/* Right side: Search + Close */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSearchClick}
          className="p-1 text-[#D8D8D8] hover:text-white active:scale-90 transition cursor-pointer"
          aria-label="بحث"
        >
          <SearchIcon size={21} />
        </button>
        <button
          type="button"
          onClick={onCloseClick}
          className="p-1 text-[#D8D8D8] hover:text-white active:scale-90 transition cursor-pointer"
          aria-label="إغلاق المشروع"
        >
          <CloseIcon size={21} />
        </button>
      </div>

      {/* CapCut Quality Popover */}
      {qualityOpen && (
        <div
          ref={popoverRef}
          dir="rtl"
          className="absolute top-[52px] left-3 right-3 z-50 rounded-2xl bg-[#222325] border border-[#323437] shadow-2xl p-4 space-y-4 text-right"
        >
          {/* Resolution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#EFEFEF]">الدقة</span>
              <span className="text-[12px] text-[#00CAE0] font-semibold tabular-nums">
                {exportSettings.resolution}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {RESOLUTIONS.map((res) => {
                const active = exportSettings.resolution === res;
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => onChangeExportSettings({ ...exportSettings, resolution: res })}
                    className={`py-1.5 rounded-lg text-[11.5px] font-semibold tabular-nums transition cursor-pointer ${
                      active
                        ? 'bg-[#00CAE0] text-[#09181C]'
                        : 'bg-[#2E3033] text-[#CCCCCC] hover:bg-[#3A3C40]'
                    }`}
                  >
                    {res}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FPS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#EFEFEF]">معدل الإطارات</span>
              <span className="text-[12px] text-[#00CAE0] font-semibold tabular-nums">
                {exportSettings.fps} fps
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {FPS_OPTIONS.map((fps) => {
                const active = exportSettings.fps === fps;
                return (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => onChangeExportSettings({ ...exportSettings, fps })}
                    className={`py-1.5 rounded-lg text-[12px] font-semibold tabular-nums transition cursor-pointer ${
                      active
                        ? 'bg-[#00CAE0] text-[#09181C]'
                        : 'bg-[#2E3033] text-[#CCCCCC] hover:bg-[#3A3C40]'
                    }`}
                  >
                    {fps}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bitrate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#EFEFEF]">معدل البت الذكي</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['low', 'منخفض'],
                  ['recommended', 'موصى به'],
                  ['high', 'مرتفع'],
                ] as const
              ).map(([key, label]) => {
                const active = exportSettings.bitrate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChangeExportSettings({ ...exportSettings, bitrate: key })}
                    className={`py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[#00CAE0] text-[#09181C] font-semibold'
                        : 'bg-[#2E3033] text-[#CCCCCC] hover:bg-[#3A3C40]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#323437] flex items-center justify-between text-[12px] text-[#9A9A9A]">
            <span>حجم الملف المقدر:</span>
            <span className="text-[#EAEAEA] font-semibold tabular-nums" dir="ltr">
              ~ {estimateMb()} MB
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
