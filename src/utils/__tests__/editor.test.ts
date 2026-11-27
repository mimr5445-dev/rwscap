import { describe, expect, it } from 'vitest';
import { DEFAULT_ADJUSTMENTS, VideoClip } from '../../types/editor';
import { clamp, formatPreciseTime, formatTimecode } from '../time';
import {
  buildCssFilterString,
  FILTER_PRESETS,
  getActiveClipAtTime,
  getAspectDimensions,
  getTotalDuration,
} from '../demoRenderer';
import { generateWaveformBars } from '../audioSynth';
import { cn } from '../cn';
import {
  changeClipSpeed,
  deleteClipById,
  duplicateClipById,
  splitClipAtTime,
  trimClipEdge,
} from '../timelineOps';

function makeClip(overrides: Partial<VideoClip> = {}): VideoClip {
  return {
    id: 'clip-1',
    type: 'demo',
    name: 'مقطع تجريبي',
    sourceStart: 0,
    duration: 9,
    maxDuration: 18,
    speed: 1,
    volume: 100,
    demoVariant: 'worldmap',
    thumbnails: ['t1', 't2', 't3', 't4', 't5', 't6'],
    ...overrides,
  };
}

describe('cn utility (baseline-ui)', () => {
  it('merges conditional classes and resolves conflicting Tailwind utilities', () => {
    expect(cn('px-2 py-1', false && 'hidden', 'px-4', 'text-white')).toBe('py-1 px-4 text-white');
  });
});

describe('time formatting & clamp', () => {
  it('formats standard MM:SS timecodes safely', () => {
    expect(formatTimecode(0)).toBe('00:00');
    expect(formatTimecode(9.4)).toBe('00:09');
    expect(formatTimecode(65)).toBe('01:05');
    expect(formatTimecode(-3)).toBe('00:00');
    expect(formatTimecode(Number.NaN)).toBe('00:00');
  });

  it('formats precise MM:SS.t timecodes', () => {
    expect(formatPreciseTime(12.76)).toBe('00:12.7');
    expect(formatPreciseTime(-1)).toBe('00:00.0');
  });

  it('clamps numeric values within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(25, 0, 10)).toBe(10);
  });
});

describe('demoRenderer pure timeline & filter calculations', () => {
  it('sums clip durations with minimum floor of 0.5s', () => {
    expect(getTotalDuration([])).toBe(0.5);
    expect(getTotalDuration([makeClip({ duration: 4.5 }), makeClip({ id: 'c2', duration: 3.25 })])).toBe(
      7.75,
    );
  });

  it('resolves active clip and sourceTime accounting for sourceStart and speed', () => {
    const clips = [
      makeClip({ id: 'c1', duration: 4, sourceStart: 1, speed: 1.5 }),
      makeClip({ id: 'c2', duration: 5, sourceStart: 2, speed: 2 }),
    ];

    const inFirst = getActiveClipAtTime(clips, 2);
    expect(inFirst?.clip.id).toBe('c1');
    expect(inFirst?.localTime).toBe(2);
    expect(inFirst?.sourceTime).toBe(4); // 1 + 2 * 1.5

    const inSecond = getActiveClipAtTime(clips, 5.5);
    expect(inSecond?.clip.id).toBe('c2');
    expect(inSecond?.clipStartTime).toBe(4);
    expect(inSecond?.localTime).toBe(1.5);
    expect(inSecond?.sourceTime).toBe(5); // 2 + 1.5 * 2
  });

  it('returns accurate aspect dimensions for supported aspect ratios', () => {
    expect(getAspectDimensions('16:9')).toEqual({ width: 960, height: 540 });
    expect(getAspectDimensions('9:16')).toEqual({ width: 540, height: 960 });
    expect(getAspectDimensions('1:1')).toEqual({ width: 720, height: 720 });
    expect(getAspectDimensions('2.35:1')).toEqual({ width: 960, height: 408 });
  });

  it('returns none when filter is original and adjustments are neutral', () => {
    expect(buildCssFilterString({ id: 'original', intensity: 100 }, DEFAULT_ADJUSTMENTS)).toBe('none');
  });

  it('builds composite CSS filter string when filter or adjustments are active', () => {
    const css = buildCssFilterString(
      { id: 'bw', intensity: 100 },
      { ...DEFAULT_ADJUSTMENTS, brightness: 20, contrast: 10 },
    );
    expect(css).toContain('grayscale(');
    expect(css).toContain('brightness(');
    expect(css).toContain('contrast(');
    expect(FILTER_PRESETS.length).toBeGreaterThanOrEqual(6);
  });
});

describe('audioSynth waveform bars', () => {
  it('generates deterministic bounded bar amplitudes', () => {
    const barsA = generateWaveformBars(1, 32);
    const barsB = generateWaveformBars(1, 32);
    expect(barsA).toEqual(barsB);
    expect(barsA).toHaveLength(32);
    for (const bar of barsA) {
      expect(bar).toBeGreaterThanOrEqual(0.15);
      expect(bar).toBeLessThanOrEqual(1);
    }
  });
});

describe('timelineOps pure clip operations (TDD)', () => {
  it('splits a clip cleanly at a valid playhead time and preserves source continuity', () => {
    const clips = [makeClip({ id: 'c1', duration: 9, sourceStart: 1, speed: 1.5 })];
    const result = splitClipAtTime(clips, 3, 'split');

    expect(result.error).toBeNull();
    expect(result.clips).toHaveLength(2);
    expect(result.clips[0].duration).toBe(3);
    expect(result.clips[0].sourceStart).toBe(1);
    expect(result.clips[1].duration).toBe(6);
    expect(result.clips[1].sourceStart).toBe(5.5); // 1 + 3 * 1.5
    expect(result.newSelectedId).toBe(result.clips[1].id);
  });

  it('refuses to split too close to clip edges (< 0.35s)', () => {
    const clips = [makeClip({ duration: 5 })];
    const nearStart = splitClipAtTime(clips, 0.2);
    const nearEnd = splitClipAtTime(clips, 4.8);
    expect(nearStart.error).toBeTruthy();
    expect(nearStart.clips).toHaveLength(1);
    expect(nearEnd.error).toBeTruthy();
    expect(nearEnd.clips).toHaveLength(1);
  });

  it('trims right and left clip edges safely within [0.5s, maxDuration]', () => {
    const clips = [makeClip({ id: 'c1', duration: 6, sourceStart: 2, maxDuration: 10 })];

    const extendedRight = trimClipEdge(clips, 'c1', 'right', 10);
    expect(extendedRight[0].duration).toBe(10);

    const shrunkRight = trimClipEdge(clips, 'c1', 'right', -20);
    expect(shrunkRight[0].duration).toBe(0.5);

    const trimmedLeft = trimClipEdge(clips, 'c1', 'left', 1.5);
    expect(trimmedLeft[0].sourceStart).toBe(3.5);
    expect(trimmedLeft[0].duration).toBe(4.5);

    const expandedLeftPastZero = trimClipEdge(clips, 'c1', 'left', -5);
    expect(expandedLeftPastZero[0].sourceStart).toBe(0);
    expect(expandedLeftPastZero[0].duration).toBe(8);
  });

  it('duplicates a clip right after the original with a distinct id', () => {
    const clips = [makeClip({ id: 'c1' }), makeClip({ id: 'c2' })];
    const { clips: next, newSelectedId } = duplicateClipById(clips, 'c1', 'dup-test');
    expect(next).toHaveLength(3);
    expect(next[0].id).toBe('c1');
    expect(next[1].id).toBe('dup-test');
    expect(next[2].id).toBe('c2');
    expect(newSelectedId).toBe('dup-test');
  });

  it('prevents deleting the last remaining clip while deleting normally when > 1 clips exist', () => {
    const single = deleteClipById([makeClip({ id: 'c1' })], 'c1');
    expect(single.error).toBeTruthy();
    expect(single.clips).toHaveLength(1);

    const multi = deleteClipById([makeClip({ id: 'c1' }), makeClip({ id: 'c2' })], 'c1');
    expect(multi.error).toBeNull();
    expect(multi.clips.map((c) => c.id)).toEqual(['c2']);
  });

  it('rescales clip duration inversely when playback speed changes', () => {
    const clips = [makeClip({ id: 'c1', duration: 8, speed: 1 })];
    const faster = changeClipSpeed(clips, 'c1', 2);
    expect(faster[0].speed).toBe(2);
    expect(faster[0].duration).toBe(4);

    const slower = changeClipSpeed(clips, 'c1', 0.5);
    expect(slower[0].speed).toBe(0.5);
    expect(slower[0].duration).toBe(16);
  });
});
