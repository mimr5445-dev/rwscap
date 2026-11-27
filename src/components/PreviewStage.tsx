import React, { useEffect, useRef, useState } from 'react';
import { ProjectState } from '../types/editor';
import {
  getAspectDimensions,
  MediaElementCache,
  renderCompositeFrame,
} from '../utils/demoRenderer';
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    kind: 'text' | 'sticker';
    id: string;
  } | null>(null);
  const [mediaTick, setMediaTick] = useState(0);

  const dims = getAspectDimensions(state.aspectRatio);

  // Preload uploaded images & sync video elements playback/mute state
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

  // Redraw canvas whenever frame/state updates
  useEffect(() => {
    const drawTo = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      if (canvas.width !== dims.width || canvas.height !== dims.height) {
        canvas.width = dims.width;
        canvas.height = dims.height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderCompositeFrame(ctx, dims.width, dims.height, state, currentTime, mediaCache);
    };

    drawTo(canvasRef.current);
    if (fullscreen) {
      drawTo(fullCanvasRef.current);
    }
  }, [state, currentTime, dims.width, dims.height, fullscreen, mediaCache, mediaTick]);

  const activeTexts = state.textItems.filter(
    (t) => currentTime >= t.startTime && currentTime <= t.startTime + t.duration,
  );
  const activeStickers = state.stickers.filter(
    (s) => currentTime >= s.startTime && currentTime <= s.startTime + s.duration,
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 6, 94);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 8, 92);
    if (dragging.kind === 'text') {
      onMoveText(dragging.id, x, y);
    } else {
      onMoveSticker(dragging.id, x, y);
    }
  };

  const handlePointerUp = () => {
    if (dragging) setDragging(null);
  };

  // Compute CSS aspect ratio style
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
          className="relative max-w-full max-h-full w-full flex items-center justify-center overflow-hidden"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={dims.width}
            height={dims.height}
            className="w-full h-full object-contain block"
          />

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
                  setDragging({ kind: 'text', id: txt.id });
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
                  setDragging({ kind: 'sticker', id: st.id });
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
