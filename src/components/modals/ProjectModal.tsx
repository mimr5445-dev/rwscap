import React, { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from '../icons/CapCutIcons';
import { AlertDialog } from './AlertDialog';

interface MediaAddModalProps {
  onImportFiles: (files: FileList) => void;
  onAddDemoClip: (variant: 'worldmap' | 'radar' | 'horizon') => void;
  onClose: () => void;
}

export const MediaAddModal: React.FC<MediaAddModalProps> = ({
  onImportFiles,
  onAddDemoClip,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[380px] rounded-2xl bg-[#1E2023] border border-[#303338] p-4 space-y-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 id={titleId} className="text-[14px] font-semibold text-white text-balance">
            إضافة وسائط إلى المسار
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1 text-[#9A9A9A] hover:text-white cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/*,image/*"
          multiple
          aria-label="اختيار ملفات فيديو أو صور"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onImportFiles(e.target.files);
              onClose();
            }
            e.target.value = '';
          }}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-3 rounded-xl bg-[#00CAE0] hover:bg-[#1AD4E8] text-[#09181C] font-bold text-[13.5px] cursor-pointer"
        >
          + استيراد فيديو أو صورة من جهازك
        </button>

        <div className="pt-1">
          <p className="text-[11.5px] text-[#8E8E8E] mb-2">أو إضافة مقطع تجريبي جاهز:</p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['worldmap', 'خريطة عالمية'],
                ['radar', 'رادار رقمي'],
                ['horizon', 'أفق ليلي'],
              ] as const
            ).map(([variant, label]) => (
              <button
                key={variant}
                type="button"
                onClick={() => {
                  onAddDemoClip(variant);
                  onClose();
                }}
                className="py-2.5 px-2 rounded-xl bg-[#2A2C30] hover:bg-[#35383E] text-[12px] text-[#E6E6E6] font-medium transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProjectModalProps {
  onSaveDraft: () => void;
  onResetProject: () => void;
  onAddMedia: () => void;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  onSaveDraft,
  onResetProject,
  onAddMedia,
  onClose,
}) => {
  const titleId = useId();
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    if (confirmingReset) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmingReset, onClose]);

  if (confirmingReset) {
    return (
      <AlertDialog
        title="إعادة تعيين المشروع؟"
        description="سيؤدي هذا الإجراء إلى مسح جميع المقاطع المضافة والنصوص والفلاتر وسجل التراجع واستعادة المشروع الافتراضي."
        confirmLabel="نعم، إعادة التعيين"
        cancelLabel="تراجع"
        destructive
        onCancel={() => setConfirmingReset(false)}
        onConfirm={() => {
          setConfirmingReset(false);
          onResetProject();
          onClose();
        }}
      />
    );
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[340px] rounded-2xl bg-[#1E2023] border border-[#303338] p-4 space-y-2.5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-1">
          <h3 id={titleId} className="text-[14px] font-semibold text-white text-balance">
            خيارات المشروع
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1 text-[#9A9A9A] hover:text-white cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onSaveDraft();
            onClose();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-[#292B2F] hover:bg-[#33363B] text-right text-[13px] text-white cursor-pointer"
        >
          حفظ كمسودة محلية
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onAddMedia();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-[#292B2F] hover:bg-[#33363B] text-right text-[13px] text-white cursor-pointer"
        >
          استيراد وسائط جديدة
        </button>

        <button
          type="button"
          onClick={() => setConfirmingReset(true)}
          className="w-full py-2.5 px-3 rounded-xl bg-[#342224] hover:bg-[#442A2D] text-right text-[13px] text-[#FF8080] cursor-pointer"
        >
          إعادة تعيين المشروع إلى الافتراضي
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#00CAE0] text-[#09181C] font-semibold text-[13px] cursor-pointer mt-1"
        >
          الاستمرار في التعديل
        </button>
      </div>
    </div>
  );
};
