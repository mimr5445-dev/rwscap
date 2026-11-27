import { VideoClip } from '../types/editor';
import { getActiveClipAtTime } from './demoRenderer';
import { clamp } from './time';

export interface SplitClipResult {
  clips: VideoClip[];
  newSelectedId: string | null;
  error: string | null;
}

export interface DuplicateClipResult {
  clips: VideoClip[];
  newSelectedId: string | null;
}

export interface DeleteClipResult {
  clips: VideoClip[];
  error: string | null;
}

const MIN_SPLIT_MARGIN_SEC = 0.35;
const MIN_CLIP_DURATION_SEC = 0.5;
const MAX_SPEED_DURATION_SEC = 60;

/** Split the clip underneath `currentTime` into two continuous clips */
export function splitClipAtTime(
  clips: VideoClip[],
  currentTime: number,
  idPrefix = `${Date.now()}`,
): SplitClipResult {
  const info = getActiveClipAtTime(clips, currentTime);
  if (!info) {
    return { clips, newSelectedId: null, error: 'لا يوجد مقطع نشط للتقسيم' };
  }

  if (
    info.localTime < MIN_SPLIT_MARGIN_SEC ||
    info.clip.duration - info.localTime < MIN_SPLIT_MARGIN_SEC
  ) {
    return {
      clips,
      newSelectedId: null,
      error: 'حرّك مؤشر التشغيل داخل المقطع لتقسيمه',
    };
  }

  const firstDur = Number(info.localTime.toFixed(2));
  const secondDur = Number((info.clip.duration - firstDur).toFixed(2));
  const splitIndex = Math.max(
    1,
    Math.round((firstDur / info.clip.duration) * info.clip.thumbnails.length),
  );

  const firstHalf: VideoClip = {
    ...info.clip,
    id: `${info.clip.id}-a-${idPrefix}`,
    duration: firstDur,
    thumbnails: info.clip.thumbnails.slice(0, splitIndex),
  };

  const secondThumbs = info.clip.thumbnails.slice(splitIndex);
  const secondHalf: VideoClip = {
    ...info.clip,
    id: `${info.clip.id}-b-${idPrefix}`,
    sourceStart: Number((info.clip.sourceStart + firstDur * info.clip.speed).toFixed(2)),
    duration: secondDur,
    thumbnails: secondThumbs.length > 0 ? secondThumbs : info.clip.thumbnails,
  };

  const nextClips = [...clips];
  nextClips.splice(info.clipIndex, 1, firstHalf, secondHalf);

  return {
    clips: nextClips,
    newSelectedId: secondHalf.id,
    error: null,
  };
}

/** Trim either the left or right edge of a clip while clamping safely within source bounds */
export function trimClipEdge(
  clips: VideoClip[],
  clipId: string,
  edge: 'left' | 'right',
  deltaSeconds: number,
): VideoClip[] {
  return clips.map((c) => {
    if (c.id !== clipId) return c;
    if (edge === 'right') {
      const nextDur = clamp(c.duration + deltaSeconds, MIN_CLIP_DURATION_SEC, c.maxDuration);
      return { ...c, duration: Number(nextDur.toFixed(2)) };
    }
    const maxShift = c.duration - MIN_CLIP_DURATION_SEC;
    const shift = clamp(deltaSeconds, -c.sourceStart, maxShift);
    return {
      ...c,
      sourceStart: Number(Math.max(0, c.sourceStart + shift).toFixed(2)),
      duration: Number(Math.max(MIN_CLIP_DURATION_SEC, c.duration - shift).toFixed(2)),
    };
  });
}

/** Insert an identical clone directly after the target clip */
export function duplicateClipById(
  clips: VideoClip[],
  clipId: string,
  newId = `dup-${Date.now()}`,
): DuplicateClipResult {
  const idx = clips.findIndex((c) => c.id === clipId);
  if (idx === -1) return { clips, newSelectedId: null };
  const copy: VideoClip = { ...clips[idx], id: newId };
  const next = [...clips];
  next.splice(idx + 1, 0, copy);
  return { clips: next, newSelectedId: copy.id };
}

/** Remove a clip by ID while enforcing at least one remaining clip on the timeline */
export function deleteClipById(clips: VideoClip[], clipId: string): DeleteClipResult {
  if (clips.length <= 1) {
    return { clips, error: 'يجب بقاء مقطع واحد على الأقل' };
  }
  return {
    clips: clips.filter((c) => c.id !== clipId),
    error: null,
  };
}

/** Adjust a clip's speed and scale its timeline duration proportionally */
export function changeClipSpeed(clips: VideoClip[], clipId: string, speed: number): VideoClip[] {
  const safeSpeed = clamp(speed, 0.25, 4);
  return clips.map((c) => {
    if (c.id !== clipId) return c;
    const ratio = c.speed / safeSpeed;
    return {
      ...c,
      speed: safeSpeed,
      duration: Number(clamp(c.duration * ratio, MIN_CLIP_DURATION_SEC, MAX_SPEED_DURATION_SEC).toFixed(2)),
    };
  });
}
