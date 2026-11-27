import React from 'react';
import { CheckIcon, CloseIcon } from '../icons/CapCutIcons';

interface ToolSheetProps {
  title: string;
  onClose: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export const ToolSheet: React.FC<ToolSheetProps> = ({
  title,
  onClose,
  onReset,
  children,
}) => {
  return (
    <div
      dir="rtl"
      className="absolute inset-x-0 bottom-0 z-40 bg-[#1B1C1E] border-t border-[#2E3033] rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.65)] flex flex-col max-h-[54%]"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2A2C2F] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#A8A8A8] hover:text-white cursor-pointer"
          aria-label="إغلاق"
        >
          <CloseIcon size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <h2 className="text-[13.5px] font-semibold text-[#F0F0F0]">{title}</h2>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] px-2 py-0.5 rounded-md bg-[#2A2C2F] hover:bg-[#35383C] text-[#BDBDBD] cursor-pointer"
            >
              إعادة تعيين
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#00CAE0] hover:text-[#35E0F3] cursor-pointer"
          aria-label="تأكيد"
        >
          <CheckIcon size={19} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 overflow-y-auto no-scrollbar">{children}</div>
    </div>
  );
};
