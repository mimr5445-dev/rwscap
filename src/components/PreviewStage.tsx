import React, { useEffect, useRef, useState } from 'react';
import { ProjectState } from '../types/editor';
import {
  getAspectDimensions,
  MediaElementCache,
  renderCompositeFrame,
} from '../utils/demoRenderer';
import { snapCoordinate } from '../utils/easing';
import { evaluateActorAtTime } from '../utils/sceneActors';
import { clamp, formatTimecode } from '../utils/time';
import { CloseIcon, PauseOutlineIcon, PlayOutlineIcon } from './icons/CapCutIcons';

interface PreviewStageProps {
  state: ProjectState;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  fullscreen: boolean;
  onExitFullscreen: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  mediaCache: MediaElementCache;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onMoveText: (id: string, x: number, y: number) => void;
  onMoveSticker: (id: string, x: number, y: number) => void;
  onDeleteText: (id: string) => void;
  onDeleteSticker: (id: string) => void;
  // Interactive Scene Studio direct-touch props
  selectedActorId: string | null;
  isRecordingMotion: boolean;
  onSelectActor: (id: string | null) => void;
  onToggleRecordMotion: () => void;
  onOpenStudioVault: () => void;
  onMoveActorAtCurrentTime: (actorId: string, x: number, y: number) => void;
  onTapSceneDestination: (actorId: string, x: number, y: number) => void;
  onLiveDragStart: (actorId: string, x: number, y: number) => void;
  onLiveDragMove: (actorId: string, x: number, y: number) => void;
  onLiveDragEnd: () => void;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  state,
  currentTime,
  totalDuration,
  isPlaying,
  fullscreen,
  onExitFullscreen,
  onTogglePlay,
  onSeek,
  mediaCache,
  selectedLayerId,
  onSelectLayer,
  onMoveText,
  onMoveSticker,
  onDeleteText,
  onDeleteSticker,
  selectedActorId,
  isRecordingMotion,
  onSelectActor,
  onToggleRecordMotion,
  onOpenStudioVault,
  onMoveActorAtCurrentTime,
  onTapSceneDestination,
  onLiveDragStart,
  onLiveDragMove,
  onLiveDragEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState<{
    kind: 'text' | 'sticker' | 'actor';
    id: string;
    startClientX: number;
    startClientY: number;
    moved: boolean;
    liveRecording: boolean;
  } | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [mediaTick, setMediaTick] = useState(0);
  const [tapRipple, setTapRipple] = useState<{ x: number; y: number; progress: number } | null>(
    null,
  );

  const dims = getAspectDimensions(state.aspectRatio);
  const actors = state.sceneActors ?? [];
  const selectedActor = actors.find((a) => a.id === selectedActorId) || null;

  // Animate tap destination ripple cleanly (~420ms)
  const triggerTapRipple = (x: number, y: number) => {
    const started = performance.now();
    const step = (now: number) => {
      const p = (now - started) / 420;
      if (p >= 1) {
        setTapRipple(null);
        return;
      }
      setTapRipple({ x, y, progress: p });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Preload uploaded & studio scene images & sync video elements playback/mute state
  useEffect(() => {
    for (const clip of state.clips) {
      if (clip.type === 'image' && clip.srcUrl && !mediaCache.images.has(clip.srcUrl)) {
        const img = new Image();
        img.onload = () => setMediaTick((v) => v + 1);
        img.src = clip.srcUrl;
        mediaCache.images.set(clip.srcUrl, img);
      }
      if (clip.type === 'video' && clip.srcUrl && !mediaCache.videos.has(clip.srcUrl)) {
        const vid = document.createElement('video');
        vid.src = clip.srcUrl;
        vid.playsInline = true;
        vid.preload = 'auto';
        vid.onloadeddata = () => setMediaTick((v) => v + 1);
        vid.onseeked = () => setMediaTick((v) => v + 1);
        mediaCache.videos.set(clip.srcUrl, vid);
      }
    }
    for (const ov of state.overlays) {
      if (ov.srcUrl && !mediaCache.images.has(ov.srcUrl)) {
        const img = new Image();
        img.onload = () => setMediaTick((v) => v + 1);
        img.src = ov.srcUrl;
        mediaCache.images.set(ov.srcUrl, img);
      }
    }
  }, [state.clips, state.overlays, mediaCache]);

  // Keep uploaded video audio in sync with play/pause and mutedMain
  useEffect(() => {
    mediaCache.videos.forEach((vid, srcUrl) => {
      const clip = state.clips.find((c) => c.srcUrl === srcUrl);
      vid.muted = state.mutedMain || !isPlaying || !clip || clip.volume === 0;
      if (clip) {
        vid.volume = Math.min(1, Math.max(0, clip.volume / 100));
        vid.playbackRate = clip.speed;
      }
      if (!isPlaying && !vid.paused) {
        vid.pause();
      }
    });
  }, [isPlaying, state.mutedMain, state.clips, mediaCache]);

  // Redraw canvas whenever frame/state/actor selection updates
  useEffect(() => {
    const drawTo = (canvas: HTMLCanvasElement | null, showGuides: boolean) => {
      if (!canvas) return;
      if (canvas.width !== dims.width || canvas.height !== dims.height) {
        canvas.width = dims.width;
        canvas.height = dims.height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderCompositeFrame(ctx, dims.width, dims.height, state, currentTime, mediaCache, {
        showGuides,
        selectedActorId,
        tapRipple,
      });
    };

    drawTo(canvasRef.current, true);
    if (fullscreen) {
      drawTo(fullCanvasRef.current, false);
    }
  }, [
    state,
    currentTime,
    dims.width,
    dims.height,
    fullscreen,
    mediaCache,
    mediaTick,
    selectedActorId,
    tapRipple,
  ]);

  const activeTexts = state.textItems.filter(
    (t) => currentTime >= t.startTime && currentTime <= t.startTime + t.duration,
  );
  const activeStickers = state.stickers.filter(
    (s) => currentTime >= s.startTime && currentTime <= s.startTime + s.duration,
  );

  const clientToCanvasPercent = (clientX: number, clientY: number) => {
    if (!boxRef.current) return null;
    const rect = boxRef.current.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 4, 96);
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 8, 95);
    return { x, y };
  };

  /** Hit-test visible studio actors (closest within touch radius wins) */
  const hitTestActor = (xPct: number, yPct: number): string | null => {
    let bestId: string | null = null;
    let bestDist = 9.5; // generous touch radius in %
    for (const actor of actors) {
      const pose = evaluateActorAtTime(actor, currentTime);
      if (!pose.visible) continue;
      const dist = Math.hypot(pose.x - xPct, pose.y - yPct);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = actor.id;
      }
    }
    return bestId;
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on floating HUD buttons
    if ((e.target as HTMLElement).closest('button')) return;
    const pos = clientToCanvasPercent(e.clientX, e.clientY);
    if (!pos) return;

    const hitActorId = hitTestActor(pos.x, pos.y);
    if (hitActorId) {
      e.stopPropagation();
      onSelectLayer(null);
      onSelectActor(hitActorId);
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      setDragging({
        kind: 'actor',
        id: hitActorId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        moved: false,
        liveRecording: isRecordingMotion,
      });
      if (isRecordingMotion) {
        onLiveDragStart(hitActorId, pos.x, pos.y);
      }
      return;
    }

    // Tapping an empty spot on the scene while an actor is selected directs that actor there!
    if (selectedActorId) {
      e.stopPropagation();
      onSelectLayer(null);
      if (isRecordingMotion) {
        // In live record mode, touching anywhere starts live-guiding the selected actor from there
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        setDragging({
          kind: 'actor',
          id: selectedActorId,
          startClientX: e.clientX,
          startClientY: e.clientY,
          moved: true,
          liveRecording: true,
        });
        onLiveDragStart(selectedActorId, pos.x, pos.y);
      } else {
        triggerTapRipple(pos.x, pos.y);
        onTapSceneDestination(selectedActorId, pos.x, pos.y);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const pos = clientToCanvasPercent(e.clientX, e.clientY);
    if (!pos) return;

    const distPx = Math.hypot(e.clientX - dragging.startClientX, e.clientY - dragging.startClientY);
    if (distPx > 3 && !dragging.moved) {
      setDragging((prev) => (prev ? { ...prev, moved: true } : null));
    }

    if (dragging.kind === 'actor') {
      if (dragging.liveRecording) {
        onLiveDragMove(dragging.id, pos.x, pos.y);
      } else if (distPx > 3) {
        onMoveActorAtCurrentTime(dragging.id, pos.x, pos.y);
      }
      return;
    }

    const sx = snapCoordinate(pos.x, 50, 2);
    const sy = snapCoordinate(pos.y, 50, 2);
    setSnapGuides({ x: sx.snapped, y: sy.snapped });
    if (dragging.kind === 'text') {
      onMoveText(dragging.id, sx.value, sy.value);
    } else {
      onMoveSticker(dragging.id, sx.value, sy.value);
    }
  };

  const handlePointerUp = () => {
    if (dragging?.kind === 'actor' && dragging.liveRecording) {
      onLiveDragEnd();
    }
    if (dragging) setDragging(null);
    if (snapGuides.x || snapGuides.y) setSnapGuides({ x: false, y: false });
  };

  const aspectRatioCss = `${dims.width} / ${dims.height}`;

  return (
    <>
      <section
        className="relative flex-1 min-h-0 bg-[#141414] flex items-center justify-center overflow-hidden px-0"
        onClick={() => onSelectLayer(null)}
      >
        <div
          ref={boxRef}
          style={{ aspectRatio: aspectRatioCss }}
          className={`relative max-w-full max-h-full flex items-center justify-center overflow-hidden touch-none select-none ${
            dims.height > dims.width ? 'h-full' : 'w-full'
          }`}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={dims.width}
            height={dims.height}
            className="w-full h-full object-contain block cursor-crosshair"
          />

          {/* Magnetic Center Snap Guides (shown only while dragging text/stickers near 50% center) */}
          {dragging && dragging.kind !== 'actor' && snapGuides.x && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[#00CAE0]/90 shadow-[0_0_6px_#00CAE0]"
            />
          )}
          {dragging && dragging.kind !== 'actor' && snapGuides.y && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-[#00CAE0]/90 shadow-[0_0_6px_#00CAE0]"
            />
          )}

          {/* Interactive hitboxes for active Text & Sticker layers */}
          {activeTexts.map((txt) => {
            const selected = selectedLayerId === txt.id;
            return (
              <div
                key={txt.id}
                style={{ left: `${txt.x}%`, top: `${txt.y}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                  onSelectLayer(txt.id);
                  onSelectActor(null);
                  setDragging({
                    kind: 'text',
                    id: txt.id,
                    startClientX: e.clientX,
                    startClientY: e.clientY,
                    moved: false,
                    liveRecording: false,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 min-w-[70px] min-h-[28px] cursor-grab active:cursor-grabbing rounded-md transition-colors ${
                  selected
                    ? 'border border-dashed border-[#00CAE0] bg-[#00CAE0]/10'
                    : 'border border-transparent hover:border-white/30'
                }`}
              >
                {selected && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteText(txt.id);
                    }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#1C1C1C] border border-white/60 text-white flex items-center justify-center text-[10px] cursor-pointer"
                    aria-label="حذف النص"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          {activeStickers.map((st) => {
            const selected = selectedLayerId === st.id;
            return (
              <div
                key={st.id}
                style={{ left: `${st.x}%`, top: `${st.y}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                  onSelectLayer(st.id);
                  onSelectActor(null);
                  setDragging({
                    kind: 'sticker',
                    id: st.id,
                    startClientX: e.clientX,
                    startClientY: e.clientY,
                    moved: false,
                    liveRecording: false,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 cursor-grab active:cursor-grabbing rounded-lg transition-colors ${
                  selected
                    ? 'border border-dashed border-[#00CAE0] bg-[#00CAE0]/10'
                    : 'border border-transparent hover:border-white/30'
                }`}
              >
                {selected && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSticker(st.id);
                    }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#1C1C1C] border border-white/60 text-white flex items-center justify-center text-[10px] cursor-pointer"
                    aria-label="حذف الملصق"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Compact Floating Studio Director Controls (1-tap Vault + Live Touch Recording) */}
        <div
          dir="rtl"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#141414]/85 backdrop-blur-md border border-white/12 shadow-lg max-w-[95%]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onOpenStudioVault}
            className="px-2.5 py-1 rounded-full bg-[#00CAE0] hover:bg-[#19D4E8] text-[#09181C] font-semibold text-[11px] whitespace-nowrap cursor-pointer transition-colors"
          >
            خزنة السيارات والأشخاص
          </button>

          <button
            type="button"
            onClick={onToggleRecordMotion}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              isRecordingMotion
                ? 'bg-[#E53945] text-white animate-pulse'
                : 'bg-[#26282C] text-[#EAEAEA] hover:bg-[#32353B]'
            }`}
          >
            {isRecordingMotion ? '● جاري التسجيل' : '● تسجيل حركة'}
          </button>

          {selectedActor && (
            <span className="hidden sm:inline text-[10.5px] text-[#B8D8DE] truncate max-w-[130px] pl-1">
              {isRecordingMotion ? `اسحب «${selectedActor.name}»` : `المس لتوجيه «${selectedActor.name}»`}
            </span>
          )}
        </div>
      </section>

      {/* Fullscreen Theater Modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-[13px] text-[#A8A8A8] tabular-nums" dir="ltr">
              {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
            </span>
            <button
              type="button"
              onClick={onExitFullscreen}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              aria-label="إغلاق ملء الشاشة"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="flex-1 w-full flex items-center justify-center min-h-0 my-3">
            <canvas
              ref={fullCanvasRef}
              width={dims.width}
              height={dims.height}
              className="max-w-full max-h-full object-contain rounded-sm"
            />
          </div>

          <div className="w-full max-w-md flex items-center gap-3 pb-2" dir="ltr">
            <button
              type="button"
              onClick={onTogglePlay}
              className="p-2 text-white hover:text-[#00CAE0] cursor-pointer"
              aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <PauseOutlineIcon size={22} /> : <PlayOutlineIcon size={22} />}
            </button>
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.05}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="cap-slider flex-1"
            />
            <span className="text-[12px] text-[#9A9A9A] tabular-nums w-11 text-right">
              {formatTimecode(totalDuration)}
            </span>
          </div>
        </div>
      )}
    </>
  );
};
