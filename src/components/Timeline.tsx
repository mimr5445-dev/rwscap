import React, { useRef, useState } from 'react';
import { ProjectState } from '../types/editor';
import { getAudioMeterLevel } from '../utils/audioSynth';
import { clamp, formatTimecode } from '../utils/time';
import {
  CoverEditIcon,
  MusicNoteIcon,
  PlusIcon,
  TextTIcon,
  VolumeMutedIcon,
  VolumeOnIcon,
} from './icons/CapCutIcons';

interface TimelineProps {
  state: ProjectState;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedLayerId: string | null;
  selectedActorId: string | null;
  coverPreviewUrl: string;
  onSeek: (time: number) => void;
  onScrubStart: () => void;
  onSelectClip: (id: string | null) => void;
  onSelectLayer: (id: string | null) => void;
  onSelectActor: (id: string | null) => void;
  onTrimClip: (clipId: string, edge: 'left' | 'right', deltaSeconds: number) => void;
  onOpenTransition: (clipId: string) => void;
  onToggleMuteMain: () => void;
  onOpenCover: () => void;
  onAddMediaClick: () => void;
  onOpenAudio: () => void;
  onOpenText: () => void;
  onOpenStudio: () => void;
  onDeleteAudio: (id: string) => void;
  onDeleteOverlay: (id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  state,
  currentTime,
  totalDuration,
  isPlaying,
  selectedClipId,
  selectedLayerId,
  selectedActorId,
  coverPreviewUrl,
  onSeek,
  onScrubStart,
  onSelectClip,
  onSelectLayer,
  onSelectActor,
  onTrimClip,
  onOpenTransition,
  onToggleMuteMain,
  onOpenCover,
  onAddMediaClick,
  onOpenAudio,
  onOpenText,
  onOpenStudio,
  onDeleteAudio,
  onDeleteOverlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pxPerSec, setPxPerSec] = useState<number>(52);
  const dragStateRef = useRef<{
    mode: 'scrub' | 'trim-left' | 'trim-right';
    clipId?: string;
    startX: number;
    startTime: number;
    lastX: number;
    moved: boolean;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    onScrubStart();
    dragStateRef.current = {
      mode: 'scrub',
      startX: e.clientX,
      lastX: e.clientX,
      startTime: currentTime,
      moved: false,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleTrimPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    clipId: string,
    edge: 'left' | 'right',
  ) => {
    e.stopPropagation();
    onScrubStart();
    dragStateRef.current = {
      mode: edge === 'left' ? 'trim-left' : 'trim-right',
      clipId,
      startX: e.clientX,
      lastX: e.clientX,
      startTime: currentTime,
      moved: true,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 3) drag.moved = true;

    if (drag.mode === 'scrub') {
      const nextTime = clamp(drag.startTime - dx / pxPerSec, 0, totalDuration);
      onSeek(nextTime);
    } else if (drag.clipId) {
      const stepDx = e.clientX - drag.lastX;
      drag.lastX = e.clientX;
      if (Math.abs(stepDx) > 0.5) {
        onTrimClip(drag.clipId, drag.mode === 'trim-left' ? 'left' : 'right', stepDx / pxPerSec);
      }
    }
  };

  const handlePointerUp = () => {
    dragStateRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setPxPerSec((prev) => clamp(prev - e.deltaY * 0.08, 32, 110));
    } else {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      onSeek(clamp(currentTime + delta / (pxPerSec * 2.5), 0, totalDuration));
    }
  };

  // Compute ruler marks
  const maxSeconds = Math.max(8, Math.ceil(totalDuration) + 4);
  const rulerMarks: Array<{ t: number; major: boolean }> = [];
  for (let s = 0; s <= maxSeconds; s++) {
    rulerMarks.push({ t: s, major: true });
    if (s < maxSeconds) {
      rulerMarks.push({ t: s + 0.5, major: false });
    }
  }

  // Offset of t=0 relative to horizontal center (50%)
  const zeroOffsetPx = -currentTime * pxPerSec;
  const totalTrackPx = Math.max(260, totalDuration * pxPerSec);

  const hasTextOrStickers = state.textItems.length > 0 || state.stickers.length > 0;
  const audioLevel = getAudioMeterLevel(state.audioClips, currentTime, state.mutedMain, isPlaying);

  return (
    <section
      ref={containerRef}
      dir="ltr"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="relative h-[37%] min-h-[240px] max-h-[330px] bg-[#1C1C1C] flex flex-col overflow-hidden shrink-0 touch-none select-none"
    >
      {/* Top Timecode & Ruler Row */}
      <div className="relative h-[34px] flex items-center justify-between shrink-0 overflow-hidden">
        {/* Left pinned current / total timecode (clean CapCut tabular style) */}
        <div className="relative z-20 h-full flex items-center pl-3.5 pr-4 bg-gradient-to-r from-[#1C1C1C] via-[#1C1C1C] to-transparent text-[11.5px] tabular-nums">
          <span className="text-white font-medium">{formatTimecode(currentTime)}</span>
          <span className="text-[#888888] ml-1">/ {formatTimecode(totalDuration)}</span>
        </div>

        {/* Compact Timeline Zoom Controls on right corner */}
        <div className="relative z-20 h-full flex items-center gap-1 pr-2.5 pl-4 bg-gradient-to-l from-[#1C1C1C] via-[#1C1C1C] to-transparent">
          {audioLevel > 0.04 && (
            <div
              aria-hidden="true"
              className="flex items-end gap-[1.5px] h-3 mr-1.5"
              title="مستوى الصوت"
            >
              {[0.4, 0.75, 1, 0.6].map((mult, idx) => (
                <span
                  key={idx}
                  style={{ height: `${Math.max(20, Math.round(audioLevel * mult * 100))}%` }}
                  className="w-[2px] rounded-full bg-[#00CAE0] transition-all duration-75"
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPxPerSec((p) => clamp(p - 12, 32, 110));
            }}
            aria-label="تصغير المخطط الزمني"
            className="w-5 h-5 rounded bg-[#262626] hover:bg-[#333333] text-[#9A9A9A] hover:text-white text-[12px] leading-none flex items-center justify-center cursor-pointer"
          >
            −
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPxPerSec((p) => clamp(p + 12, 32, 110));
            }}
            aria-label="تكبير المخطط الزمني"
            className="w-5 h-5 rounded bg-[#262626] hover:bg-[#333333] text-[#9A9A9A] hover:text-white text-[12px] leading-none flex items-center justify-center cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Dynamic Ruler ticks synchronized with center playhead */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 bottom-0 left-1/2"
            style={{ transform: `translate3d(${zeroOffsetPx}px, 0, 0)` }}
          >
            {rulerMarks.map((mark) => (
              <div
                key={mark.t}
                style={{ left: `${mark.t * pxPerSec}px` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
              >
                {mark.major ? (
                  <span className="text-[11px] text-[#8A8A8A] tabular-nums font-normal">
                    {formatTimecode(mark.t)}
                  </span>
                ) : (
                  <span className="w-[3px] h-[3px] rounded-full bg-[#777777]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Center White Playhead Line */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[34px] bottom-[4px] w-[2px] rounded-full bg-[#FEFEFE] z-30 shadow-[0_0_4px_rgba(0,0,0,0.65)]" />

      {/* Floating White '+' Add Clip Button on Right Edge of Main Track Row */}
      <button
        type="button"
        onClick={onAddMediaClick}
        className="absolute right-3 top-[53px] z-30 w-[32px] h-[32px] rounded-[7px] bg-white hover:bg-[#F0F0F0] active:scale-90 text-[#1C1C1C] shadow-[0_2px_10px_rgba(0,0,0,0.55)] flex items-center justify-center transition cursor-pointer"
        aria-label="إضافة مقطع فيديو أو صورة"
        title="إضافة وسائط"
      >
        <PlusIcon size={18} />
      </button>

      {/* Scrollable Track Rows Container */}
      <div
        className="relative flex-1 overflow-x-clip overflow-y-auto no-scrollbar pt-2 pb-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectClip(null);
            onSelectLayer(null);
          }
        }}
      >
        {/* Origin wrapper anchored at horizontal center (50%) and shifted by -currentTime * pxPerSec */}
        <div
          className="relative left-1/2 w-0"
          style={{ transform: `translate3d(${zeroOffsetPx}px, 0, 0)` }}
        >
          {/* ===== PRE-ZERO LEFT CONTROLS (left of t=0) ===== */}
          {/* Row 1 Left: كتم صوت المقطع + الغلاف */}
          <div
            className="absolute top-0 right-[14px] h-[54px] flex items-center gap-3.5"
            dir="ltr"
          >
            {/* Mute clip audio button */}
            <button
              type="button"
              onClick={onToggleMuteMain}
              className="flex flex-col items-center justify-center w-[54px] gap-0.5 text-[#D2D2D2] hover:text-white active:scale-95 transition cursor-pointer"
              aria-label="كتم صوت المقطع"
            >
              {state.mutedMain ? (
                <VolumeMutedIcon size={19} className="text-[#00CAE0]" />
              ) : (
                <VolumeOnIcon size={19} className="text-[#D4D4D4]" />
              )}
              <span
                dir="rtl"
                className={`text-[10px] leading-[1.22] text-center font-normal ${
                  state.mutedMain ? 'text-[#00CAE0]' : 'text-[#C8C8C8]'
                }`}
              >
                كتم صوت
                <br />
                المقطع
              </span>
            </button>

            {/* Cover card (الغلاف) */}
            <button
              type="button"
              onClick={onOpenCover}
              className="relative w-[50px] h-[52px] rounded-[7px] overflow-hidden bg-[#262626] border border-white/10 hover:border-white/30 active:scale-95 transition cursor-pointer shrink-0"
              aria-label="تعديل الغلاف"
            >
              {coverPreviewUrl && (
                <img
                  src={coverPreviewUrl}
                  alt="الغلاف"
                  className="w-full h-full object-cover brightness-[0.45]"
                  draggable={false}
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <CoverEditIcon size={15} className="text-[#EAEAEA]" />
                <span dir="rtl" className="text-[10px] text-[#EAEAEA] font-medium leading-none">
                  الغلاف
                </span>
              </div>
            </button>
          </div>

          {/* Row 2 Left: Music Note quick button flush with right edge of الغلاف */}
          <div className="absolute top-[63px] right-[14px] w-[50px] flex justify-end">
            <button
              type="button"
              onClick={onOpenAudio}
              className="w-[36px] h-[36px] rounded-[6px] bg-[#262626] hover:bg-[#303030] active:scale-95 text-[#8A8A8A] hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="إضافة صوت"
            >
              <MusicNoteIcon size={17} />
            </button>
          </div>

          {/* Row 3 Left: T quick button flush with right edge directly beneath Music Note */}
          <div className="absolute top-[108px] right-[14px] w-[50px] flex justify-end">
            <button
              type="button"
              onClick={onOpenText}
              className="w-[36px] h-[36px] rounded-[6px] bg-[#262626] hover:bg-[#303030] active:scale-95 text-[#8A8A8A] hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="إضافة نص"
            >
              <TextTIcon size={17} />
            </button>
          </div>

          {/* ===== ROW 1: MAIN VIDEO FILMSTRIP TRACK (t >= 0) ===== */}
          <div className="relative flex items-center h-[54px]" style={{ width: `${totalTrackPx}px` }}>
            {state.clips.map((clip, clipIdx) => {
              const clipWidth = Math.max(28, clip.duration * pxPerSec);
              const isSelected = selectedClipId === clip.id;
              const thumbCount = Math.max(1, Math.ceil(clipWidth / 52));
              const hasActiveTransition = Boolean(clip.transitionOut && clip.transitionOut.id !== 'none');
              const hasMotionOrTransform = Boolean(
                (clip.animation && clip.animation.id !== 'none') ||
                  (clip.transform &&
                    (clip.transform.rotation !== 0 ||
                      clip.transform.flipH ||
                      clip.transform.flipV ||
                      clip.transform.scale !== 1 ||
                      clip.transform.opacity !== 100)),
              );

              return (
                <div key={clip.id} className="relative flex items-center shrink-0">
                  <div
                    style={{ width: `${clipWidth}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(isSelected ? null : clip.id);
                      onSelectLayer(null);
                    }}
                    className={`relative h-[52px] shrink-0 overflow-hidden cursor-pointer transition-shadow ${
                      isSelected
                        ? 'rounded-[6px] ring-2 ring-white z-20'
                        : 'rounded-[4px] border-r border-[#141414]'
                    }`}
                  >
                    {/* Filmstrip frame images */}
                    <div className="flex w-full h-full bg-[#24282C]">
                      {Array.from({ length: thumbCount }).map((_, idx) => {
                        const src =
                          clip.thumbnails.length > 0
                            ? clip.thumbnails[
                                Math.min(
                                  clip.thumbnails.length - 1,
                                  Math.floor((idx / thumbCount) * clip.thumbnails.length),
                                )
                              ]
                            : '';
                        return (
                          <div key={idx} className="flex-1 h-full overflow-hidden min-w-0">
                            {src ? (
                              <img
                                src={src}
                                alt=""
                                className="w-full h-full object-cover block"
                                draggable={false}
                              />
                            ) : (
                              <div className="w-full h-full bg-[#2B3137]" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Speed / Motion badges */}
                    <div className="absolute bottom-1 left-1.5 flex items-center gap-1 pointer-events-none">
                      {clip.speed !== 1 && (
                        <span className="px-1 py-0.5 rounded bg-black/75 text-[9px] text-[#00CAE0] font-semibold tabular-nums">
                          {clip.speed}x
                        </span>
                      )}
                      {hasMotionOrTransform && (
                        <span className="px-1 py-0.5 rounded bg-black/75 text-[9px] text-[#FFD447] font-semibold">
                          FX
                        </span>
                      )}
                      {clip.freezeFrameUrl && (
                        <span className="px-1 py-0.5 rounded bg-black/75 text-[9px] text-[#7BE8F6] font-semibold">
                          ❄
                        </span>
                      )}
                    </div>

                    {/* Left & Right CapCut Trim Handles when clip is selected */}
                    {isSelected && (
                      <>
                        <div
                          onPointerDown={(e) => handleTrimPointerDown(e, clip.id, 'left')}
                          className="absolute left-0 top-0 bottom-0 w-[13px] bg-white flex items-center justify-center cursor-ew-resize z-30"
                        >
                          <span className="w-[2px] h-4 rounded-full bg-[#1C1C1C]" />
                        </div>
                        <div
                          onPointerDown={(e) => handleTrimPointerDown(e, clip.id, 'right')}
                          className="absolute right-0 top-0 bottom-0 w-[13px] bg-white flex items-center justify-center cursor-ew-resize z-30"
                        >
                          <span className="w-[2px] h-4 rounded-full bg-[#1C1C1C]" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* CapCut Transition Junction Pill between adjacent clips */}
                  {clipIdx < state.clips.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTransition(clip.id);
                      }}
                      title="انتقال بين المقاطع"
                      aria-label={`إضافة أو تعديل الانتقال بعد المقطع ${clipIdx + 1}`}
                      className={`absolute -right-[11px] top-1/2 -translate-y-1/2 z-30 w-[22px] h-[22px] rounded-[6px] border text-[11px] font-bold flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer ${
                        hasActiveTransition
                          ? 'bg-[#00CAE0] border-[#09181C] text-[#09181C]'
                          : 'bg-[#F0F0F0] border-[#141414] text-[#1C1C1C] hover:bg-white'
                      }`}
                    >
                      ⇄
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ===== ROW 2: AUDIO TRACK ===== */}
          <div className="relative h-[36px] mt-[9px]" style={{ width: `${totalTrackPx}px` }}>
            {state.audioClips.length === 0 ? (
              <button
                type="button"
                onClick={onOpenAudio}
                className="w-full h-full rounded-[6px] bg-[#262626] hover:bg-[#2C2C2C] px-3 flex items-center gap-2 text-[#989898] hover:text-[#CCCCCC] transition cursor-pointer"
                dir="ltr"
              >
                <PlusIcon size={14} className="text-[#9A9A9A] shrink-0" />
                <span dir="rtl" className="text-[12.5px] font-normal">
                  إضافة صوت
                </span>
              </button>
            ) : (
              <div className="relative w-full h-full">
                {state.audioClips.map((ac) => (
                  <div
                    key={ac.id}
                    style={{
                      left: `${ac.startTime * pxPerSec}px`,
                      width: `${Math.max(70, ac.duration * pxPerSec)}px`,
                    }}
                    className="absolute top-0 bottom-0 rounded-[6px] bg-[#163A40] border border-[#00CAE0]/50 px-2 flex items-center justify-between gap-2 overflow-hidden"
                  >
                    <div className="flex items-end gap-[2px] h-[18px] opacity-75 overflow-hidden">
                      {ac.waveform.slice(0, 28).map((bar, i) => (
                        <span
                          key={i}
                          style={{ height: `${Math.round(bar * 100)}%` }}
                          className="w-[2px] rounded-full bg-[#00CAE0]"
                        />
                      ))}
                    </div>
                    <span dir="rtl" className="text-[11px] text-[#E8FAFC] truncate font-medium">
                      {ac.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAudio(ac.id);
                      }}
                      className="text-[10px] text-white/70 hover:text-white px-1 cursor-pointer"
                      aria-label="حذف الصوت"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== ROW 3: TEXT / CAPTIONS / STICKERS TRACK ===== */}
          <div className="relative h-[36px] mt-[9px]" style={{ width: `${totalTrackPx}px` }}>
            {!hasTextOrStickers ? (
              <button
                type="button"
                onClick={onOpenText}
                className="w-full h-full rounded-[6px] bg-[#262626] hover:bg-[#2C2C2C] px-3 flex items-center gap-2 text-[#989898] hover:text-[#CCCCCC] transition cursor-pointer"
                dir="ltr"
              >
                <PlusIcon size={14} className="text-[#9A9A9A] shrink-0" />
                <span dir="rtl" className="text-[12.5px] font-normal">
                  إضافة نص
                </span>
              </button>
            ) : (
              <div className="relative w-full h-full">
                {state.textItems.map((txt) => {
                  const selected = selectedLayerId === txt.id;
                  return (
                    <button
                      key={txt.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLayer(txt.id);
                        onSelectClip(null);
                      }}
                      style={{
                        left: `${txt.startTime * pxPerSec}px`,
                        width: `${Math.max(58, txt.duration * pxPerSec)}px`,
                      }}
                      className={`absolute top-0 bottom-0 rounded-[6px] px-2 flex items-center justify-end overflow-hidden transition cursor-pointer ${
                        txt.isCaption
                          ? 'bg-[#6F4318] border border-[#E59745]/60'
                          : 'bg-[#7A351C] border border-[#F07D4F]/60'
                      } ${selected ? 'ring-1.5 ring-white' : ''}`}
                    >
                      <span dir="rtl" className="text-[11px] text-white truncate font-medium">
                        {txt.text}
                      </span>
                    </button>
                  );
                })}
                {state.stickers.map((st) => {
                  const selected = selectedLayerId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLayer(st.id);
                        onSelectClip(null);
                      }}
                      style={{
                        left: `${st.startTime * pxPerSec}px`,
                        width: `${Math.max(54, st.duration * pxPerSec)}px`,
                      }}
                      className={`absolute top-0 bottom-0 rounded-[6px] bg-[#4B2868] border border-[#B072E8]/60 px-2 flex items-center justify-center gap-1 overflow-hidden cursor-pointer ${
                        selected ? 'ring-1.5 ring-white' : ''
                      }`}
                    >
                      <span className="text-[13px]">{st.glyph}</span>
                      <span dir="rtl" className="text-[10.5px] text-white truncate">
                        {st.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== OPTIONAL ROW 4: INTERACTIVE STUDIO ACTORS TRACK (with keyframe action diamonds) ===== */}
          {(state.sceneActors?.length ?? 0) > 0 && (
            <div className="space-y-1.5 mt-[9px]" style={{ width: `${totalTrackPx}px` }}>
              {state.sceneActors!.map((actor) => {
                const isSelected = selectedActorId === actor.id;
                const startT = actor.keyframes[0]?.time ?? actor.appearTime;
                const endT = Math.max(
                  startT + 1.5,
                  actor.keyframes[actor.keyframes.length - 1]?.time ?? totalDuration,
                );
                const stride = actor.keyframes.length > 16 ? Math.ceil(actor.keyframes.length / 12) : 1;
                return (
                  <div
                    key={actor.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectActor(actor.id);
                      onSelectClip(null);
                      onSelectLayer(null);
                    }}
                    className={`relative h-[28px] rounded-[6px] border flex items-center cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#15363D] border-[#00CAE0]'
                        : 'bg-[#25282D] border-white/10 hover:border-white/25'
                    }`}
                  >
                    {/* Active motion range highlight bar */}
                    <div
                      style={{
                        left: `${startT * pxPerSec}px`,
                        width: `${Math.max(24, (endT - startT) * pxPerSec)}px`,
                        backgroundColor: `${actor.primaryColor}38`,
                      }}
                      className="absolute top-0.5 bottom-0.5 rounded-[4px] pointer-events-none"
                    />

                    {/* Keyframe action diamonds along recorded timestamps */}
                    {actor.keyframes.map((kf, idx) => {
                      if (idx !== 0 && idx !== actor.keyframes.length - 1 && idx % stride !== 0) {
                        return null;
                      }
                      return (
                        <button
                          key={`${kf.time}-${idx}`}
                          type="button"
                          title={kf.actionLabel || `${actor.name} (${formatTimecode(kf.time)})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectActor(actor.id);
                            onSeek(kf.time);
                          }}
                          style={{ left: `${kf.time * pxPerSec}px` }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[9px] h-[9px] rotate-45 bg-[#00CAE0] border border-[#0B181C] hover:scale-125 transition-transform cursor-pointer z-10"
                          aria-label={`انتقال إلى إجراء ${actor.name} عند ${formatTimecode(kf.time)}`}
                        />
                      );
                    })}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectActor(actor.id);
                        onOpenStudio();
                      }}
                      dir="rtl"
                      className="sticky left-2 z-20 px-2 py-0.5 rounded bg-[#141619]/90 text-[10px] text-[#E9F6F8] font-medium whitespace-nowrap cursor-pointer"
                    >
                      {actor.kind === 'car' ? '🚗' : '🚶'} {actor.name}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===== OPTIONAL ROW 5: OVERLAYS TRACK (only shown when overlays exist) ===== */}
          {state.overlays.length > 0 && (
            <div className="relative h-[30px] mt-[8px]" style={{ width: `${totalTrackPx}px` }}>
              {state.overlays.map((ov) => (
                <div
                  key={ov.id}
                  style={{
                    left: `${ov.startTime * pxPerSec}px`,
                    width: `${Math.max(70, ov.duration * pxPerSec)}px`,
                  }}
                  className="absolute top-0 bottom-0 rounded-[6px] bg-[#24324A] border border-[#5B8DEF]/60 px-2 flex items-center justify-between gap-2"
                >
                  <span dir="rtl" className="text-[10.5px] text-[#DCE8FF] truncate">
                    تراكب: {ov.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOverlay(ov.id);
                    }}
                    className="text-[10px] text-white/70 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
