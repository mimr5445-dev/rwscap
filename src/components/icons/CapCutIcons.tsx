import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const SearchIcon: React.FC<IconProps> = ({ className = '', size = 22 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="10.5" cy="10.5" r="6.75" stroke="currentColor" strokeWidth="1.85" />
    <path d="M15.6 15.6L20.5 20.5" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ className = '', size = 22 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5.5 5.5L18.5 18.5M18.5 5.5L5.5 18.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const DropdownTriangleIcon: React.FC<IconProps> = ({ className = '', size = 10 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 10 6" fill="none" className={className}>
    <path d="M1 1L5 5L9 1H1Z" fill="currentColor" />
  </svg>
);

/** Curved horizontal U-arrow pointing right (matches far-left arrow in Arabic CapCut transport bar) */
export const RedoIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M15.5 17.5H10C6.96 17.5 4.5 15.04 4.5 12C4.5 8.96 6.96 6.5 10 6.5H16.5"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.8 3.8L17.2 6.5L13.8 9.2"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Curved horizontal U-arrow pointing left (matches second arrow in Arabic CapCut transport bar) */
export const UndoIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M8.5 17.5H14C17.04 17.5 19.5 15.04 19.5 12C19.5 8.96 17.04 6.5 14 6.5H7.5"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.2 3.8L6.8 6.5L10.2 9.2"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Dual overlapping frames with ON / OFF badge (exact match to CapCut transport bar) */
export const SyncToggleIcon: React.FC<IconProps & { enabled: boolean }> = ({
  className = '',
  size = 24,
  enabled,
}) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 26 26" fill="none" className={className}>
    {/* Top-left frame */}
    <rect
      x="3"
      y="3.5"
      width="11"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    {/* Bottom-right overlapping frame open at bottom-right for ON/OFF text */}
    <path
      d="M11 10.5H18.5C19.6 10.5 20.5 11.4 20.5 12.5V14M11 10.5V18.5C11 19.6 11.9 20.5 13 20.5H13.6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <text
      x="14.2"
      y="22.2"
      fill="currentColor"
      fontSize={enabled ? '6.6' : '5.5'}
      fontWeight="700"
      fontFamily="Inter, system-ui, sans-serif"
      letterSpacing="-0.2"
    >
      {enabled ? 'ON' : 'OFF'}
    </text>
  </svg>
);

export const PlayOutlineIcon: React.FC<IconProps> = ({ className = '', size = 22 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M7.5 5.15C7.5 4.35 8.38 3.86 9.06 4.29L19.45 10.89C20.08 11.29 20.08 12.21 19.45 12.61L9.06 19.21C8.38 19.64 7.5 19.15 7.5 18.35V5.15Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
  </svg>
);

export const PauseOutlineIcon: React.FC<IconProps> = ({ className = '', size = 22 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6.5" y="4.5" width="3.8" height="15" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.7" y="4.5" width="3.8" height="15" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

/** Fullscreen brackets with diagonal outward arrows inside (exact match to screenshot) */
export const FullscreenIcon: React.FC<IconProps> = ({ className = '', size = 21 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    {/* Four outer corner brackets */}
    <path
      d="M4 9V5.5C4 4.67 4.67 4 5.5 4H9M15 4H18.5C19.33 4 20 4.67 20 5.5V9M20 15V18.5C20 19.33 19.33 20 18.5 20H15M9 20H5.5C4.67 20 4 19.33 4 18.5V15"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Diagonal double arrow */}
    <path
      d="M14.5 9.5L19.2 4.8M9.5 14.5L4.8 19.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const VolumeOnIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4.5 9.5H8L13.5 5.2V18.8L8 14.5H4.5C3.95 14.5 3.5 14.05 3.5 13.5V10.5C3.5 9.95 3.95 9.5 4.5 9.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M16.8 9.2C17.85 10.35 17.85 13.65 16.8 14.8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M19.3 7C21.1 9.1 21.1 14.9 19.3 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

export const VolumeMutedIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4.5 9.5H8L13.5 5.2V18.8L8 14.5H4.5C3.95 14.5 3.5 14.05 3.5 13.5V10.5C3.5 9.95 3.95 9.5 4.5 9.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 9.5L21 14M21 9.5L16.5 14"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

export const CoverEditIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M15.2 4.8L19.2 8.8L9.6 18.4L4.8 19.2L5.6 14.4L15.2 4.8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M13 7L17 11" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const MusicNoteIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M13 4.5V15.8C13 17.57 11.43 19 9.5 19C7.57 19 6 17.57 6 15.8C6 14.03 7.57 12.6 9.5 12.6C10.9 12.6 12.1 13.25 13 14.2V4.5C15.2 6.2 17.5 6.8 18.8 7"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TextTIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5.5 6H18.5M12 6V18.5"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/* ===== Bottom Toolbar Exact CapCut Icons ===== */

/** الخلفية — Square with 3 diagonal hatch stripes inside */
export const BackgroundIcon: React.FC<IconProps> = ({ className = '', size = 23 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M4.8 11.5L11.5 4.8M4.8 18.2L18.2 4.8M11.8 19.2L19.2 11.8"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

/** نسبة العرض إلى الارتفاع — Clean hollow square */
export const AspectRatioIcon: React.FC<IconProps> = ({ className = '', size = 23 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4.5" y="4.5" width="15" height="15" rx="1.4" stroke="currentColor" strokeWidth="1.85" />
  </svg>
);

/** ملصقات — Circle with peeled sticker corner at top-right */
export const StickersIcon: React.FC<IconProps> = ({ className = '', size = 23 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 3.8C7.47 3.8 3.8 7.47 3.8 12C3.8 16.53 7.47 20.2 12 20.2C16.53 20.2 20.2 16.53 20.2 12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M12 3.8C12 8.4 15.6 12 20.2 12C19.5 8.1 16.1 4.5 12 3.8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

/** ضبط — Two horizontal sliders with hollow circle knobs */
export const AdjustIcon: React.FC<IconProps> = ({ className = '', size = 23 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    {/* Top slider */}
    <path d="M4 8H11.5M16.5 8H20" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
    <circle cx="14" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.85" />
    {/* Bottom slider */}
    <path d="M4 16H7.5M12.5 16H20" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
    <circle cx="10" cy="16" r="2.6" stroke="currentColor" strokeWidth="1.85" />
  </svg>
);

/** الفلاتر — Three overlapping Venn circles (trefoil) */
export const FiltersIcon: React.FC<IconProps> = ({ className = '', size = 23 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="8.5" r="4.4" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="8.6" cy="14.8" r="4.4" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="15.4" cy="14.8" r="4.4" stroke="currentColor" strokeWidth="1.75" />
  </svg>
);

/** الشروحات — Rounded screen rectangle with subtitle bars at bottom */
export const CaptionsIcon: React.FC<IconProps> = ({ className = '', size = 23 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M6.8 13H10.5M13 13H17.2M6.8 16H13.5M15.8 16H17.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

/** تراكب — Stacked photo / PIP frame */
export const OverlayIcon: React.FC<IconProps> = ({ className = '', size = 23 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4.5" width="14.5" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M6.5 14.5L10 10.8L12.8 13.5L14.5 11.8L16.5 14.5"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 20.5H18.5C19.6 20.5 20.5 19.6 20.5 18.5V8.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

/** تعديل / تقسيم — Scissors / Split */
export const EditSplitIcon: React.FC<IconProps> = ({ className = '', size = 22 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3.5V20.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeDasharray="2.5 2.5" />
    <rect x="4" y="6.5" width="5.5" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
    <rect x="14.5" y="6.5" width="5.5" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const SpeedIcon: React.FC<IconProps> = ({ className = '', size = 22 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5 17A8.5 8.5 0 1 1 19 17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M12 14L15.8 9.2" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
    <circle cx="12" cy="14" r="1.6" fill="currentColor" />
  </svg>
);

export const DuplicateIcon: React.FC<IconProps> = ({ className = '', size = 21 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="8" y="8" width="11.5" height="11.5" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <path
      d="M16 8V6.2C16 5.1 15.1 4.2 14 4.2H6.2C5.1 4.2 4.2 5.1 4.2 6.2V14C4.2 15.1 5.1 16 6.2 16H8"
      stroke="currentColor"
      strokeWidth="1.75"
    />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className = '', size = 21 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4.5 7H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9.2 4.5H14.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M6.5 7L7.5 18.8C7.6 19.6 8.2 20.2 9 20.2H15C15.8 20.2 16.4 19.6 16.5 18.8L17.5 7"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path d="M10.2 10.5V16.5M13.8 10.5V16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5 12.5L9.8 17.3L19.5 7.2"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M9.5 5.5L16 12L9.5 18.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
