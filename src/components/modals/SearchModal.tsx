import React, { useState } from 'react';
import { ActiveTool } from '../../types/editor';
import { CloseIcon, SearchIcon } from '../icons/CapCutIcons';

interface SearchModalProps {
  onSelectTool: (tool: Exclude<ActiveTool, null>) => void;
  onAddMedia: () => void;
  onExport: () => void;
  onClose: () => void;
}

const ITEMS: Array<{
  label: string;
  keywords: string;
  action: 'tool' | 'media' | 'export';
  tool?: Exclude<ActiveTool, null>;
}> = [
  { label: 'استوديو المشهد · خزنة السيارات والأشخاص', keywords: 'استوديو خزنة سيارة سيارات اشخاص شخص مشهد حركة تسجيل studio car person', action: 'tool', tool: 'studio' },
  { label: 'الخلفية', keywords: 'خلفية لون تمويه تدرج background', action: 'tool', tool: 'background' },
  { label: 'نسبة العرض إلى الارتفاع', keywords: 'ابعاد مقاس 16:9 9:16 1:1 aspect', action: 'tool', tool: 'aspect' },
  { label: 'ملصقات', keywords: 'ملصق ايموجي sticker', action: 'tool', tool: 'stickers' },
  { label: 'ضبط الألوان', keywords: 'ضبط سطوع تباين تشبع حرارة adjust', action: 'tool', tool: 'adjust' },
  { label: 'الفلاتر', keywords: 'فلتر سينمائي ابيض واسود filter', action: 'tool', tool: 'filters' },
  { label: 'الشروحات', keywords: 'ترجمة شروحات نصوص تلقائية captions', action: 'tool', tool: 'captions' },
  { label: 'تراكب', keywords: 'تراكب صورة فوق صورة overlay pip', action: 'tool', tool: 'overlay' },
  { label: 'إضافة نص متحرك', keywords: 'نص كتابة عنوان حركة آلة كاتبة text', action: 'tool', tool: 'text' },
  { label: 'تحويل المقطع (تدوير / قلب / تكبير)', keywords: 'تحويل تدوير عكس قلب تكبير شفافية transform rotate flip', action: 'tool', tool: 'transform' },
  { label: 'تحريك المقطع (كين بيرنز)', keywords: 'تحريك حركة كين بيرنز تلاشي animation ken burns', action: 'tool', tool: 'animation' },
  { label: 'إضافة صوت وموسيقى', keywords: 'صوت موسيقى اغنية تلاشي audio', action: 'tool', tool: 'audio' },
  { label: 'استيراد فيديو أو صورة', keywords: 'اضافة مقطع وسائط فيديو صورة import', action: 'media' },
  { label: 'تصدير الفيديو', keywords: 'حفظ تصدير تنزيل export', action: 'export' },
];

export const SearchModal: React.FC<SearchModalProps> = ({
  onSelectTool,
  onAddMedia,
  onExport,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? ITEMS.filter((it) => it.label.toLowerCase().includes(q) || it.keywords.includes(q))
    : ITEMS;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-14 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="البحث عن أداة أو فلتر"
        className="w-full max-w-[380px] rounded-2xl bg-[#1E2023] border border-[#303338] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#2C2E32]">
          <SearchIcon size={18} className="text-[#8E8E8E] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="ابحث عن أداة أو فلتر"
            placeholder="ابحث عن أداة أو فلتر..."
            className="flex-1 bg-transparent outline-none text-[13.5px] text-white placeholder:text-[#7A7A7A]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1 text-[#9A9A9A] hover:text-white cursor-pointer"
          >
            <CloseIcon size={17} />
          </button>
        </div>

        <div className="max-h-[280px] overflow-y-auto no-scrollbar p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-[12.5px] text-[#8A8A8A] py-6">لا توجد نتائج مطابقة</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  onClose();
                  if (item.action === 'tool' && item.tool) onSelectTool(item.tool);
                  else if (item.action === 'media') onAddMedia();
                  else if (item.action === 'export') onExport();
                }}
                className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-[#2A2D31] text-[13px] text-[#EAEAEA] flex items-center justify-between transition cursor-pointer"
              >
                <span>{item.label}</span>
                <span className="text-[11px] text-[#00CAE0]">فتح</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
