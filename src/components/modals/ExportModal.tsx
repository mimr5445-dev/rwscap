import React, { useEffect, useRef, useState } from 'react';
import { ExportSettings, ProjectState } from '../../types/editor';
import { MediaElementCache } from '../../utils/demoRenderer';
import { exportProjectVideo, ExportResult } from '../../utils/exportVideo';
import { CloseIcon } from '../icons/CapCutIcons';

interface ExportModalProps {
  state: ProjectState;
  settings: ExportSettings;
  mediaCache: MediaElementCache;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  state,
  settings,
  mediaCache,
  onClose,
}) => {
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    exportProjectVideo(state, settings, mediaCache, setProgress, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setResult(res);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التصدير');
      });

    return () => {
      controller.abort();
    };
  }, [state, settings, mediaCache]);

  const handleCancel = () => {
    abortRef.current?.abort();
    onClose();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[360px] rounded-2xl bg-[#1E2023] border border-[#303338] p-5 text-center shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-semibold text-white">تصدير الفيديو</span>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-[#9A9A9A] hover:text-white cursor-pointer"
            aria-label="إغلاق"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {error ? (
          <div className="py-6 space-y-3">
            <p className="text-[13px] text-[#FF7B7B]">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#2E3035] text-white text-[13px] cursor-pointer"
            >
              رجوع
            </button>
          </div>
        ) : result ? (
          <div className="py-3 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#00CAE0]/15 border-2 border-[#00CAE0] flex items-center justify-center text-[#00CAE0] text-2xl">
              ✓
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white">تم التصدير بنجاح!</h3>
              <p className="text-[12px] text-[#9A9A9A] mt-1 tabular-nums" dir="ltr">
                {settings.resolution} • {settings.fps} FPS • {(result.sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <a
                href={result.blobUrl}
                download={result.filename}
                className="w-full py-2.5 rounded-xl bg-[#00CAE0] hover:bg-[#19D4E8] text-[#09181C] font-bold text-[13.5px] transition block"
              >
                حفظ في الجهاز
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#2B2D31] hover:bg-[#35383D] text-[#E0E0E0] text-[13px] font-medium cursor-pointer"
              >
                تم
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="text-[36px] font-bold text-white tabular-nums" dir="ltr">
              {progress}%
            </div>
            <div className="w-full h-2 rounded-full bg-[#2E3035] overflow-hidden" dir="ltr">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-[#00CAE0] transition-all duration-150 rounded-full"
              />
            </div>
            <p className="text-[12px] text-[#9A9A9A]">
              جارٍ تصدير المشروع بدقة {settings.resolution} ({settings.fps} إطار/ث)...
            </p>
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2 rounded-xl bg-[#2B2D31] hover:bg-[#35383D] text-[#D0D0D0] text-[12.5px] cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
