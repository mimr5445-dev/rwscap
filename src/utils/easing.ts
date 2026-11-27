import {
  ClipAnimation,
  LayerAnimationId,
  TransitionId,
  VideoClip,
} from '../types/editor';
import { clamp } from './time';

/** Cubic ease-out clamped strictly to [0, 1] (remotion-motion-graphics) */
export function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
}

/** Smooth cubic ease-in-out clamped strictly to [0, 1] */
export function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/** Spring-like overshoot ease-out-back clamped at endpoints [0, 1] */
export function easeOutBack(t: number): number {
  const c = clamp(t, 0, 1);
  if (c === 0) return 0;
  if (c === 1) return 1;
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(c - 1, 3) + c1 * Math.pow(c - 1, 2);
}

export interface MotionFrame {
  opacity: number;
  scale: number;
  offsetX: number; // fraction of canvas width
  offsetY: number; // fraction of canvas height
  visibleCharRatio: number; // 0..1 for typewriter text animation
}

/**
 * Computes enter -> hold -> exit motion for a text or sticker overlay.
 * Enforces Remotion craft rules: clamped non-linear easing, faster exit than entrance.
 */
export function computeLayerMotion(
  animation: LayerAnimationId | undefined,
  localTime: number,
  duration: number,
): MotionFrame {
  if (!animation || animation === 'none' || duration <= 0) {
    return { opacity: 1, scale: 1, offsetX: 0, offsetY: 0, visibleCharRatio: 1 };
  }

  const enterDur = Math.min(0.45, duration * 0.35);
  const exitDur = Math.min(0.25, duration * 0.2);
  const enterProgress = enterDur > 0 ? clamp(localTime / enterDur, 0, 1) : 1;
  const remaining = Math.max(0, duration - localTime);
  const exitProgress = exitDur > 0 ? clamp(remaining / exitDur, 0, 1) : 1;

  const enterEased = easeOutCubic(enterProgress);
  const exitEased = easeOutCubic(exitProgress);
  const envelopeOpacity = Math.min(enterEased, exitEased);

  switch (animation) {
    case 'fade':
      return {
        opacity: envelopeOpacity,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        visibleCharRatio: 1,
      };
    case 'pop': {
      const popScale =
        enterProgress < 1
          ? 0.45 + 0.55 * easeOutBack(enterProgress)
          : exitProgress < 1
            ? 0.75 + 0.25 * exitEased
            : 1;
      return {
        opacity: envelopeOpacity,
        scale: popScale,
        offsetX: 0,
        offsetY: 0,
        visibleCharRatio: 1,
      };
    }
    case 'slide-up': {
      const yOffset =
        enterProgress < 1
          ? (1 - enterEased) * 0.08
          : exitProgress < 1
            ? -(1 - exitEased) * 0.05
            : 0;
      return {
        opacity: envelopeOpacity,
        scale: 1,
        offsetX: 0,
        offsetY: yOffset,
        visibleCharRatio: 1,
      };
    }
    case 'typewriter': {
      const typeDur = Math.min(1.4, Math.max(0.4, duration * 0.55));
      const charRatio = clamp(localTime / typeDur, 0, 1);
      return {
        opacity: exitEased,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        visibleCharRatio: charRatio,
      };
    }
  }
}

export interface ClipMotionFrame {
  opacity: number;
  scale: number;
  offsetX: number; // fraction of canvas width
  offsetY: number; // fraction of canvas height
}

/**
 * Computes per-clip entrance or continuous Ken Burns motion.
 */
export function computeClipMotion(
  animation: ClipAnimation | undefined,
  localTime: number,
  clipDuration: number,
): ClipMotionFrame {
  if (!animation || animation.id === 'none' || clipDuration <= 0) {
    return { opacity: 1, scale: 1, offsetX: 0, offsetY: 0 };
  }

  if (animation.id === 'ken-burns') {
    const p = clamp(localTime / clipDuration, 0, 1);
    const smooth = easeInOutCubic(p);
    return {
      opacity: 1,
      scale: 1 + smooth * 0.1,
      offsetX: (smooth - 0.5) * 0.03,
      offsetY: (0.5 - smooth) * 0.02,
    };
  }

  const dur = Math.min(animation.duration, clipDuration * 0.8);
  const p = dur > 0 ? clamp(localTime / dur, 0, 1) : 1;
  const eased = easeOutCubic(p);

  switch (animation.id) {
    case 'fade-in':
      return { opacity: eased, scale: 1, offsetX: 0, offsetY: 0 };
    case 'zoom-in':
      return { opacity: clamp(eased * 1.4, 0, 1), scale: 0.82 + 0.18 * eased, offsetX: 0, offsetY: 0 };
    case 'slide-up':
      return { opacity: eased, scale: 1, offsetX: 0, offsetY: (1 - eased) * 0.16 };
  }
}

export interface ActiveTransitionInfo {
  fromClip: VideoClip;
  fromSourceTime: number;
  toClip: VideoClip;
  toSourceTime: number;
  transitionId: Exclude<TransitionId, 'none'>;
  /** Raw linear progress [0..1] across the transition window */
  progress: number;
  /** Smoothly eased progress [0..1] */
  eased: number;
}

/**
 * Detects whether `currentTime` lies inside a clip-to-clip transition boundary.
 * The transition centers symmetrically across the cut point (half before, half after).
 */
export function computeTransitionWindow(
  clips: VideoClip[],
  currentTime: number,
): ActiveTransitionInfo | null {
  if (clips.length < 2) return null;
  let cursor = 0;
  for (let i = 0; i < clips.length - 1; i++) {
    const fromClip = clips[i];
    const toClip = clips[i + 1];
    const cutTime = cursor + fromClip.duration;
    const trans = fromClip.transitionOut;

    if (trans && trans.id !== 'none' && trans.duration > 0) {
      const maxAllowed = Math.min(fromClip.duration * 0.8, toClip.duration * 0.8);
      const effectiveDur = Math.min(trans.duration, maxAllowed);
      const half = effectiveDur / 2;
      const start = cutTime - half;
      const end = cutTime + half;

      if (currentTime >= start && currentTime <= end && effectiveDur > 0) {
        const progress = clamp((currentTime - start) / effectiveDur, 0, 1);
        const fromLocal = clamp(currentTime - cursor, 0, fromClip.duration);
        const toLocal = clamp(currentTime - start, 0, toClip.duration);
        return {
          fromClip,
          fromSourceTime: fromClip.sourceStart + fromLocal * fromClip.speed,
          toClip,
          toSourceTime: toClip.sourceStart + toLocal * toClip.speed,
          transitionId: trans.id,
          progress,
          eased: easeInOutCubic(progress),
        };
      }
    }
    cursor = cutTime;
  }
  return null;
}

/** Magnetic center snapping for dragging preview layers (e.g. snap to 50% within ±2%) */
export function snapCoordinate(
  value: number,
  target = 50,
  threshold = 2,
): { value: number; snapped: boolean } {
  if (Math.abs(value - target) <= threshold) {
    return { value: target, snapped: true };
  }
  return { value, snapped: false };
}
