import React from 'react';
import { VideoClip } from '../../types/editor';
import { ToolSheet } from './ToolSheet';

interface SpeedPanelProps {
  clip: VideoClip;
  onChangeSpeed: (speed: number) => void;
  onClose: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.5, 2, 3];

export const SpeedPanel: React.FC<SpeedPanelProps> = ({ clip, onChangeSpeed, onClose }) => (
  <ToolSheet title="السرعة" onClose={onClose} onReset={() => onChangeSpeed(1)}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-[#CFCFCF]">سرعة التشغيل</span>
        <span className="text-[14px] font-bold text-[#00CAE0] tabular-nums" dir="ltr">
          {clip.speed}x
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1.5" dir="ltr">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChangeSpeed(s)}
            className={`py-2 rounded-xl text-[12px] font-semibold tabular-nums transition cursor-pointer ${
              clip.speed === s
                ? 'bg-[#00CAE0] text-[#09181C]'
                : 'bg-[#27292C] text-[#D2D2D2] hover:bg-[#323539]'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  </ToolSheet>
);

interface VolumePanelProps {
  clip: VideoClip;
  onChangeVolume: (vol: number) => void;
  onClose: () => void;
}

export const VolumePanel: React.FC<VolumePanelProps> = ({ clip, onChangeVolume, onClose }) => (
  <ToolSheet title="مستوى الصوت" onClose={onClose} onReset={() => onChangeVolume(100)}>
    <div className="space-y-3 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-[#CFCFCF]">صوت المقطع</span>
        <span className="text-[13px] font-semibold text-[#00CAE0] tabular-nums">
          {clip.volume}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={200}
        value={clip.volume}
        onChange={(e) => onChangeVolume(Number(e.target.value))}
        className="cap-slider w-full"
        dir="ltr"
      />
    </div>
  </ToolSheet>
);
