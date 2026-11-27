import React, { useRef } from 'react';
import { AudioClip } from '../../types/editor';
import { generateWaveformBars } from '../../utils/audioSynth';
import { ToolSheet } from './ToolSheet';

interface AudioPanelProps {
  currentTime: number;
  totalDuration: number;
  audioClips: AudioClip[];
  onAddAudio: (clip: AudioClip) => void;
  onDeleteAudio: (id: string) => void;
  onClose: () => void;
}

const BUILTIN_TRACKS: Array<{
  preset: NonNullable<AudioClip['synthPreset']>;
  name: string;
  tag: string;
  seed: number;
}> = [
  { preset: 'cinematic', name: 'موسيقى سينمائية عميقة', tag: 'سينمائي', seed: 1.2 },
  { preset: 'ambient', name: 'خلفية هادئة فضائية', tag: 'هادئ', seed: 2.7 },
  { preset: 'pulse', name: 'نبض إلكتروني سريع', tag: 'تقني', seed: 4.1 },
  { preset: 'lofi', name: 'إيقاع لو-فاي دافئ', tag: 'ناعم', seed: 5.8 },
];

export const AudioPanel: React.FC<AudioPanelProps> = ({
  currentTime,
  totalDuration,
  audioClips,
  onAddAudio,
  onDeleteAudio,
  onClose,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddBuiltIn = (track: (typeof BUILTIN_TRACKS)[number]) => {
    const start = Math.min(currentTime, Math.max(0, totalDuration - 1));
    const dur = Math.max(2, totalDuration - start);
    onAddAudio({
      id: `aud-${Date.now()}`,
      name: track.name,
      startTime: Number(start.toFixed(2)),
      duration: Number(dur.toFixed(2)),
      volume: 85,
      sourceType: 'synth',
      synthPreset: track.preset,
      waveform: generateWaveformBars(track.seed, 40),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const start = Math.min(currentTime, Math.max(0, totalDuration - 1));
    const dur = Math.max(2, totalDuration - start);
    onAddAudio({
      id: `aud-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ''),
      startTime: Number(start.toFixed(2)),
      duration: Number(dur.toFixed(2)),
      volume: 100,
      sourceType: 'file',
      srcUrl: url,
      waveform: generateWaveformBars(Math.random() * 10, 44),
    });
    e.target.value = '';
  };

  return (
    <ToolSheet title="إضافة صوت" onClose={onClose}>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full py-2.5 mb-3 rounded-xl bg-[#00CAE0] hover:bg-[#19D4E8] text-[#09181C] font-semibold text-[13px] transition cursor-pointer"
      >
        + استيراد ملف صوتي من جهازك
      </button>

      <div className="space-y-2">
        {BUILTIN_TRACKS.map((tr) => (
          <div
            key={tr.preset}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#27292C]"
          >
            <div>
              <div className="text-[13px] font-medium text-[#EFEFEF]">{tr.name}</div>
              <div className="text-[11px] text-[#8E8E8E]">{tr.tag} • جاهز للاستخدام</div>
            </div>
            <button
              type="button"
              onClick={() => handleAddBuiltIn(tr)}
              className="px-3 py-1.5 rounded-lg bg-[#34373B] hover:bg-[#00CAE0] hover:text-[#09181C] text-[#EAEAEA] text-[12px] font-semibold transition cursor-pointer"
            >
              استخدام
            </button>
          </div>
        ))}
      </div>

      {audioClips.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#2C2E31] space-y-1.5">
          {audioClips.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#163A40]/70 text-[12px]"
            >
              <span className="truncate text-[#E6FAFC]">{c.name}</span>
              <button
                type="button"
                onClick={() => onDeleteAudio(c.id)}
                className="text-[#FF6B6B] text-[11px] mr-2 cursor-pointer"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </ToolSheet>
  );
};
