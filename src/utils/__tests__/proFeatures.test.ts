import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_EXPORT_SETTINGS,
  ProjectState,
  VideoClip,
} from '../../types/editor';
import {
  computeClipMotion,
  computeLayerMotion,
  computeTransitionWindow,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  snapCoordinate,
} from '../easing';
import {
  insertFreezeFrameAtTime,
  reorderClip,
  setClipAnimation,
  setClipTransform,
  setClipTransition,
} from '../timelineOps';
import {
  deserializeProjectJson,
  serializeProjectJson,
} from '../projectStorage';
import { getAudioMeterLevel } from '../audioSynth';

function makeClip(overrides: Partial<VideoClip> = {}): VideoClip {
  return {
    id: 'clip-1',
    type: 'demo',
    name: 'مقطع تجريبي',
    sourceStart: 0,
    duration: 6,
    maxDuration: 18,
    speed: 1,
    volume: 100,
    demoVariant: 'worldmap',
    thumbnails: ['t1', 't2', 't3', 't4'],
    ...overrides,
  };
}

function makeProject(): ProjectState {
  return {
    clips: [makeClip({ id: 'c1', duration: 5 }), makeClip({ id: 'c2', duration: 4 })],
    audioClips: [],
    textItems: [
      {
        id: 'txt-1',
        text: 'عنوان احترافي',
        startTime: 0.5,
        duration: 3,
        x: 50,
        y: 80,
        fontSize: 28,
        color: '#FFFFFF',
        bgColor: 'transparent',
        stylePreset: 'clean',
        animation: 'typewriter',
      },
    ],
    stickers: [],
    overlays: [],
    mutedMain: false,
    coverTime: 0.4,
    aspectRatio: '16:9',
    background: { mode: 'none', value: '#000000', blurAmount: 18 },
    filter: { id: 'original', intensity: 80 },
    adjustments: { ...DEFAULT_ADJUSTMENTS },
  };
}

describe('easing & motion curves (remotion-motion-graphics)', () => {
  it('clamps easing functions cleanly at [0, 1] without runaway extrapolation', () => {
    expect(easeOutCubic(-0.5)).toBe(0);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(2)).toBe(1);

    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
    expect(easeInOutCubic(2)).toBe(1);

    expect(easeOutBack(0)).toBe(0);
    expect(easeOutBack(1)).toBe(1);
    expect(easeOutBack(0.6)).toBeGreaterThan(0.95);
  });

  it('computes clamped layer enter -> hold -> exit animations including typewriter progress', () => {
    const enter = computeLayerMotion('fade', 0.1, 3);
    expect(enter.opacity).toBeGreaterThan(0);
    expect(enter.opacity).toBeLessThan(1);

    const hold = computeLayerMotion('fade', 1.5, 3);
    expect(hold.opacity).toBe(1);
    expect(hold.scale).toBe(1);
    expect(hold.offsetY).toBe(0);

    const exit = computeLayerMotion('fade', 2.95, 3);
    expect(exit.opacity).toBeLessThan(1);
    expect(exit.opacity).toBeGreaterThanOrEqual(0);

    const twMid = computeLayerMotion('typewriter', 0.5, 3);
    expect(twMid.visibleCharRatio).toBeGreaterThan(0);
    expect(twMid.visibleCharRatio).toBeLessThan(1);

    const twDone = computeLayerMotion('typewriter', 2, 3);
    expect(twDone.visibleCharRatio).toBe(1);
  });

  it('computes Ken Burns continuous gentle zoom and clip entrance animations', () => {
    const kbStart = computeClipMotion({ id: 'ken-burns', duration: 0.7 }, 0, 6);
    const kbEnd = computeClipMotion({ id: 'ken-burns', duration: 0.7 }, 6, 6);
    expect(kbStart.scale).toBeCloseTo(1, 3);
    expect(kbEnd.scale).toBeGreaterThan(1.07);
    expect(kbEnd.scale).toBeLessThanOrEqual(1.12);

    const zoomStart = computeClipMotion({ id: 'zoom-in', duration: 1 }, 0, 5);
    const zoomDone = computeClipMotion({ id: 'zoom-in', duration: 1 }, 1.2, 5);
    expect(zoomStart.scale).toBeLessThan(1);
    expect(zoomDone.scale).toBe(1);
  });

  it('detects active clip-to-clip transition windows accurately', () => {
    const clips = [
      makeClip({
        id: 'c1',
        duration: 4,
        transitionOut: { id: 'fade', duration: 0.8 },
      }),
      makeClip({ id: 'c2', duration: 4 }),
    ];

    expect(computeTransitionWindow(clips, 2.0)).toBeNull();
    const mid = computeTransitionWindow(clips, 4.0);
    expect(mid).not.toBeNull();
    expect(mid?.fromClip.id).toBe('c1');
    expect(mid?.toClip.id).toBe('c2');
    expect(mid?.progress).toBeCloseTo(0.5, 2);
    expect(computeTransitionWindow(clips, 5.0)).toBeNull();
  });

  it('snaps coordinates magnetically to 50% center within threshold', () => {
    const snapped = snapCoordinate(51.4, 50, 2);
    expect(snapped.value).toBe(50);
    expect(snapped.snapped).toBe(true);

    const free = snapCoordinate(62, 50, 2);
    expect(free.value).toBe(62);
    expect(free.snapped).toBe(false);
  });
});

describe('timelineOps pro clip editing operations', () => {
  it('reorders clips left and right safely without losing items', () => {
    const clips = [makeClip({ id: 'a' }), makeClip({ id: 'b' }), makeClip({ id: 'c' })];
    expect(reorderClip(clips, 'b', -1).map((c) => c.id)).toEqual(['b', 'a', 'c']);
    expect(reorderClip(clips, 'b', 1).map((c) => c.id)).toEqual(['a', 'c', 'b']);
    expect(reorderClip(clips, 'a', -1).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('updates clip transform, transition, and animation immutably with safe clamping', () => {
    const clips = [makeClip({ id: 'c1' }), makeClip({ id: 'c2' })];
    const rotated = setClipTransform(clips, 'c1', { rotation: 90, flipH: true, scale: 5, opacity: 150 });
    expect(rotated[0].transform?.rotation).toBe(90);
    expect(rotated[0].transform?.flipH).toBe(true);
    expect(rotated[0].transform?.scale).toBe(2); // clamped max
    expect(rotated[0].transform?.opacity).toBe(100); // clamped max

    const trans = setClipTransition(clips, 'c1', { id: 'slide-left', duration: 3 });
    expect(trans[0].transitionOut?.id).toBe('slide-left');
    expect(trans[0].transitionOut?.duration).toBe(1.5); // clamped max

    const anim = setClipAnimation(clips, 'c1', { id: 'ken-burns', duration: 0.1 });
    expect(anim[0].animation?.id).toBe('ken-burns');
    expect(anim[0].animation?.duration).toBe(0.3); // clamped min
  });

  it('inserts a 2.5s freeze frame clip cleanly at the playhead', () => {
    const clips = [makeClip({ id: 'c1', duration: 6 })];
    const res = insertFreezeFrameAtTime(clips, 2, 'data:image/jpeg;base64,abc', 'frz');
    expect(res.error).toBeNull();
    expect(res.clips).toHaveLength(3);
    expect(res.clips[0].duration).toBe(2);
    expect(res.clips[1].type).toBe('image');
    expect(res.clips[1].duration).toBe(2.5);
    expect(res.clips[1].freezeFrameUrl).toBe('data:image/jpeg;base64,abc');
    expect(res.clips[2].duration).toBe(4);
  });
});

describe('projectStorage validated serialization & security hygiene (senior-security)', () => {
  it('round-trips valid project JSON cleanly', () => {
    const proj = makeProject();
    const json = serializeProjectJson(proj, DEFAULT_EXPORT_SETTINGS);
    const parsed = deserializeProjectJson(json);
    expect(parsed.error).toBeNull();
    expect(parsed.data?.project.clips).toHaveLength(2);
    expect(parsed.data?.project.textItems[0].animation).toBe('typewriter');
    expect(parsed.data?.exportSettings.resolution).toBe('540P');
  });

  it('rejects malformed JSON or unsafe/missing clip payloads gracefully', () => {
    expect(deserializeProjectJson('{not-valid-json').error).toBeTruthy();
    expect(deserializeProjectJson(JSON.stringify({ version: 1, project: { clips: [] } })).error).toBeTruthy();
  });

  it('strips transient blob: URLs safely while preserving data: URLs and demo clips', () => {
    const proj = makeProject();
    proj.clips[0].srcUrl = 'blob:https://example.com/123';
    const json = serializeProjectJson(proj, DEFAULT_EXPORT_SETTINGS);
    const parsed = deserializeProjectJson(json);
    expect(parsed.data?.project.clips[0].srcUrl).toBeUndefined();
  });

  it('sanitizes out-of-range numeric clip attributes & invalid enums on import', () => {
    const hostile = JSON.stringify({
      schemaVersion: 2,
      project: {
        clips: [
          {
            id: 'c1',
            type: 'demo',
            name: 'x',
            duration: 99999,
            maxDuration: 10,
            sourceStart: -5,
            speed: 99,
            volume: -40,
            thumbnails: [],
          },
        ],
        aspectRatio: 'INVALID_RATIO',
        filter: { id: 'MALICIOUS', intensity: 500 },
        background: { mode: 'HACK', value: '#000', blurAmount: 999 },
      },
    });
    const parsed = deserializeProjectJson(hostile);
    expect(parsed.error).toBeNull();
    expect(parsed.data!.project.clips[0].duration).toBe(300);
    expect(parsed.data!.project.clips[0].speed).toBe(4);
    expect(parsed.data!.project.clips[0].volume).toBe(0);
    expect(parsed.data!.project.aspectRatio).toBe('16:9');
    expect(parsed.data!.project.filter.id).toBe('original');
    expect(parsed.data!.project.background.mode).toBe('none');
  });
});

describe('audio meter & boundary edge cases', () => {
  it('computes audio meter level honoring fadeIn/fadeOut envelopes and mute state', () => {
    const tracks = [
      {
        id: 'a1',
        name: 'bgm',
        startTime: 0,
        duration: 10,
        volume: 100,
        fadeIn: 2,
        fadeOut: 2,
        sourceType: 'synth' as const,
        waveform: [0.8, 0.8, 0.8, 0.8, 0.8],
      },
    ];
    expect(getAudioMeterLevel(tracks, 5, true, true)).toBe(0);
    expect(getAudioMeterLevel(tracks, 5, false, false)).toBe(0);
    const mid = getAudioMeterLevel(tracks, 5, false, true);
    const fadeStart = getAudioMeterLevel(tracks, 0.5, false, true);
    const fadeEnd = getAudioMeterLevel(tracks, 9.5, false, true);
    expect(mid).toBeGreaterThan(fadeStart);
    expect(mid).toBeGreaterThan(fadeEnd);
  });

  it('inserts freeze frame adjacent instead of micro-splitting near clip boundary', () => {
    const clip = makeClip({ id: 'c1', duration: 5 });
    const res = insertFreezeFrameAtTime([clip], 0.1, 'data:image/jpeg;base64,BBB', 'edge');
    expect(res.error).toBeNull();
    expect(res.clips).toHaveLength(2);
    expect(res.clips[0].freezeFrameUrl).toBe('data:image/jpeg;base64,BBB');
  });

  it('clamps transition window safely when adjacent clips are shorter than transition duration', () => {
    const c1: VideoClip = makeClip({
      id: 'short1',
      duration: 0.8,
      transitionOut: { id: 'fade', duration: 1.5 },
    });
    const c2 = makeClip({ id: 'short2', duration: 0.8 });
    expect(computeTransitionWindow([c1, c2], 0.8)?.progress).toBeCloseTo(0.5, 2);
    expect(computeTransitionWindow([c1, c2], 0.2)).toBeNull();
  });
});
