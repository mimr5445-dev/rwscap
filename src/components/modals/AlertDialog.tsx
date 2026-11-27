import React, { useEffect, useId, useRef } from 'react';
import { cn } from '../../utils/cn';

interface AlertDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible confirmation AlertDialog for destructive/irreversible actions (baseline-ui + a11y-audit) */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  title,
  description,
  confirmLabel,
  cancelLabel = 'إلغاء',
  destructive = true,
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-[330px] rounded-2xl bg-[#1E2023] border border-[#303338] p-4 space-y-3.5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5">
          <h3 id={titleId} className="text-[14.5px] font-bold text-white text-balance">
            {title}
          </h3>
          <p id={descId} className="text-[12.5px] leading-relaxed text-[#A6A6A6] text-pretty">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-[#2B2D31] hover:bg-[#35383D] text-[#E6E6E6] text-[13px] font-medium transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer',
              destructive
                ? 'bg-[#D93848] hover:bg-[#E54B5A] text-white'
                : 'bg-[#00CAE0] hover:bg-[#19D4E8] text-[#09181C]',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
