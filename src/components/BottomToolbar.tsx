import React from 'react';
import { ActiveTool } from '../types/editor';
import {
  AdjustIcon,
  AspectRatioIcon,
  BackgroundIcon,
  CaptionsIcon,
  ChevronRightIcon,
  DuplicateIcon,
  EditSplitIcon,
  FiltersIcon,
  MusicNoteIcon,
  OverlayIcon,
  SpeedIcon,
  StickersIcon,
  TextTIcon,
  TrashIcon,
  VolumeOnIcon,
} from './icons/CapCutIcons';

interface BottomToolbarProps {
  activeTool: ActiveTool;
  selectedClipId: string | null;
  hasFilter: boolean;
  hasAdjustments: boolean;
  hasBackground: boolean;
  onSelectTool: (tool: ActiveTool) => void;
  onDeselectClip: () => void;
  onSplitClip: () => void;
  onDuplicateClip: () => void;
  onDeleteClip: () => void;
}

interface ToolDef {
  id: Exclude<ActiveTool, null>;
  label: string;
  twoLine?: [string, string];
  icon: React.ReactNode;
  dot?: boolean;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeTool,
  selectedClipId,
  hasFilter,
  hasAdjustments,
  hasBackground,
  onSelectTool,
  onDeselectClip,
  onSplitClip,
  onDuplicateClip,
  onDeleteClip,
}) => {
  // Exact left-to-right physical order matching the CapCut Arabic screenshot
  const mainTools: ToolDef[] = [
    {
      id: 'background',
      label: 'الخلفية',
      icon: <BackgroundIcon size={22} />,
      dot: hasBackground,
    },
    {
      id: 'aspect',
      label: 'نسبة العرض إلى الارتفاع',
      twoLine: ['نسبة العرض إلى', 'الارتفاع'],
      icon: <AspectRatioIcon size={22} />,
    },
    {
      id: 'stickers',
      label: 'ملصقات',
      icon: <StickersIcon size={22} />,
    },
    {
      id: 'adjust',
      label: 'ضبط',
      icon: <AdjustIcon size={22} />,
      dot: hasAdjustments,
    },
    {
      id: 'filters',
      label: 'الفلاتر',
      icon: <FiltersIcon size={22} />,
      dot: hasFilter,
    },
    {
      id: 'captions',
      label: 'الشروحات',
      icon: <CaptionsIcon size={22} />,
    },
    {
      id: 'overlay',
      label: 'تراكب',
      icon: <OverlayIcon size={22} />,
    },
    {
      id: 'text',
      label: 'نص',
      icon: <TextTIcon size={21} />,
    },
    {
      id: 'audio',
      label: 'صوت',
      icon: <MusicNoteIcon size={21} />,
    },
    {
      id: 'edit',
      label: 'تعديل',
      icon: <EditSplitIcon size={21} />,
    },
  ];

  // Contextual Clip Edit Toolbar when a timeline video clip is selected
  if (selectedClipId) {
    return (
      <nav
        aria-label="أدوات تعديل المقطع"
        dir="rtl"
        className="h-[74px] bg-[#1C1C1C] border-t border-[#2A2A2A] flex items-center shrink-0 px-2 pb-[env(safe-area-inset-bottom)]"
      >
        <button
          type="button"
          onClick={onDeselectClip}
          className="h-[46px] w-[34px] rounded-lg bg-[#262626] hover:bg-[#323232] text-[#E0E0E0] flex items-center justify-center shrink-0 ml-2 cursor-pointer"
          aria-label="رجوع إلى الأدوات الرئيسية"
        >
          <ChevronRightIcon size={18} />
        </button>

        <div className="flex items-center overflow-x-auto no-scrollbar flex-1 gap-1">
          <ClipActionButton
            icon={<EditSplitIcon size={21} />}
            label="تقسيم"
            onClick={onSplitClip}
          />
          <ClipActionButton
            icon={<SpeedIcon size={21} />}
            label="السرعة"
            active={activeTool === 'speed'}
            onClick={() => onSelectTool('speed')}
          />
          <ClipActionButton
            icon={<VolumeOnIcon size={21} />}
            label="الصوت"
            active={activeTool === 'volume'}
            onClick={() => onSelectTool('volume')}
          />
          <ClipActionButton
            icon={<FiltersIcon size={21} />}
            label="الفلاتر"
            active={activeTool === 'filters'}
            onClick={() => onSelectTool('filters')}
          />
          <ClipActionButton
            icon={<AdjustIcon size={21} />}
            label="ضبط"
            active={activeTool === 'adjust'}
            onClick={() => onSelectTool('adjust')}
          />
          <ClipActionButton
            icon={<DuplicateIcon size={20} />}
            label="تكرار"
            onClick={onDuplicateClip}
          />
          <ClipActionButton
            icon={<TrashIcon size={20} />}
            label="حذف"
            danger
            onClick={onDeleteClip}
          />
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="شريط الأدوات الرئيسي"
      dir="ltr"
      className="h-[76px] bg-[#1C1C1C] border-t border-[#2A2A2A] flex items-start shrink-0 overflow-x-auto no-scrollbar pt-2.5 px-1.5 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-start min-w-max">
        {mainTools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(isActive ? null : tool.id)}
              className={`relative flex flex-col items-center justify-start px-1.5 min-w-[63px] active:scale-95 transition cursor-pointer ${
                isActive ? 'text-[#00CAE0]' : 'text-[#DCDCDC] hover:text-white'
              }`}
            >
              <div className="relative h-[26px] flex items-center justify-center">
                {tool.icon}
                {tool.dot && !isActive && (
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-[#00CAE0]" />
                )}
              </div>

              <span
                dir="rtl"
                className={`mt-1 text-[10.5px] leading-[1.28] text-center whitespace-nowrap font-normal ${
                  isActive ? 'text-[#00CAE0] font-medium' : 'text-[#D0D0D0]'
                }`}
              >
                {tool.twoLine ? (
                  <>
                    {tool.twoLine[0]}
                    <br />
                    {tool.twoLine[1]}
                  </>
                ) : (
                  tool.label
                )}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

interface ClipActionButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}

const ClipActionButton: React.FC<ClipActionButtonProps> = ({
  icon,
  label,
  active,
  danger,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center min-w-[60px] py-1.5 rounded-lg active:scale-95 transition cursor-pointer ${
      active
        ? 'text-[#00CAE0]'
        : danger
          ? 'text-[#FF6B6B] hover:text-[#FF8585]'
          : 'text-[#DCDCDC] hover:text-white'
    }`}
  >
    <div className="h-[24px] flex items-center justify-center">{icon}</div>
    <span className="mt-1 text-[10.5px] leading-tight whitespace-nowrap">{label}</span>
  </button>
);
