import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_EXPORT_SETTINGS,
  ProjectState,
} from '../../types/editor';
import {
  addActorTapWaypoint,
  buildActionTimelineLog,
  CAR_VAULT,
  clearActorPath,
  createActorFromVault,
  evaluateActorAtTime,
  PERSON_VAULT,
  recordActorKeyframe,
} from '../sceneActors';
import {
  deserializeProjectJson,
  serializeProjectJson,
} from '../projectStorage';

describe('Interactive Scene Studio — Vault & Motion Engine', () => {
  it('exposes complete Cars Vault (6 models) and People Vault (6 characters)', () => {
    expect(CAR_VAULT).toHaveLength(6);
    expect(PERSON_VAULT).toHaveLength(6);
    expect(new Set(CAR_VAULT.map((c) => c.modelId)).size).toBe(6);
    expect(new Set(PERSON_VAULT.map((p) => p.modelId)).size).toBe(6);
  });

  it('spawns a car or person cleanly with initial keyframe at startTime', () => {
    const car = createActorFromVault('car', 'sport', 1.5, { x: 20, y: 55 }, 'car-1');
    expect(car.id).toBe('car-1');
    expect(car.kind).toBe('car');
    expect(car.appearTime).toBe(1.5);
    expect(car.keyframes).toEqual([{ time: 1.5, x: 20, y: 55, actionLabel: 'ظهور في المشهد' }]);

    const person = createActorFromVault('person', 'traveler', 0, { x: 56, y: 48 }, 'p-1');
    expect(person.kind).toBe('person');
    expect(person.keyframes[0].x).toBe(56);
  });

  it('evaluates smooth position, heading angle, and walking phase over recorded keyframes', () => {
    let actor = createActorFromVault('person', 'attendant', 0, { x: 20, y: 50 }, 'p-walk');
    actor = recordActorKeyframe(actor, 4, 60, 50, { actionLabel: 'تحرك للمضخة' });

    const startPose = evaluateActorAtTime(actor, 0);
    expect(startPose.visible).toBe(true);
    expect(startPose.x).toBeCloseTo(20, 2);
    expect(startPose.angleDeg).toBeCloseTo(0, 1);

    const midPose = evaluateActorAtTime(actor, 2);
    expect(midPose.x).toBeCloseTo(40, 1);
    expect(midPose.isMoving).toBe(true);
    expect(midPose.walkPhase).toBeGreaterThan(0);

    // After arriving, actor stops walking but preserves final facing direction
    const endPose = evaluateActorAtTime(actor, 5);
    expect(endPose.x).toBeCloseTo(60, 2);
    expect(endPose.isMoving).toBe(false);
    expect(endPose.angleDeg).toBeCloseTo(0, 1);
  });

  it('upserts nearby keyframes and supports truncateFuture for live re-recording', () => {
    let car = createActorFromVault('car', 'sedan', 0, { x: 10, y: 50 }, 'c-rec');
    car = recordActorKeyframe(car, 2, 40, 60);
    car = recordActorKeyframe(car, 4, 80, 75);
    expect(car.keyframes).toHaveLength(3);

    // Updating near t=2 replaces the t=2 keyframe instead of duplicating
    car = recordActorKeyframe(car, 2.02, 45, 62);
    expect(car.keyframes).toHaveLength(3);
    expect(car.keyframes[1].x).toBe(45);

    // Re-recording with truncateFuture removes stale future points
    car = recordActorKeyframe(car, 2.5, 50, 65, { truncateFuture: true });
    expect(car.keyframes).toHaveLength(3);
    expect(car.keyframes[2].time).toBe(2.5);
  });

  it('creates timed tap-to-go waypoints proportional to distance and chains multiple taps', () => {
    const car = createActorFromVault('car', 'pickup', 0, { x: 20, y: 60 }, 'c-tap');
    const step1 = addActorTapWaypoint(car, 0, 50, 60, 12);
    expect(step1.arrivalTime).toBeGreaterThan(0.5);
    expect(step1.arrivalTime).toBeLessThanOrEqual(12);
    expect(step1.actor.keyframes).toHaveLength(2);
    expect(step1.actor.keyframes[1].x).toBe(50);

    const step2 = addActorTapWaypoint(step1.actor, step1.arrivalTime, 80, 80, 12);
    expect(step2.actor.keyframes).toHaveLength(3);
    expect(step2.arrivalTime).toBeGreaterThan(step1.arrivalTime);
  });

  it('clears motion path back to current position and builds chronological action log', () => {
    let car = createActorFromVault('car', 'police', 0, { x: 10, y: 50 }, 'c-log');
    car = recordActorKeyframe(car, 2, 40, 60, { actionLabel: 'اتجاه للمحطة' });
    car = recordActorKeyframe(car, 5, 70, 80, { actionLabel: 'مغادرة الطريق' });

    const log = buildActionTimelineLog([car]);
    expect(log).toHaveLength(2);
    expect(log[0].fromTime).toBe(0);
    expect(log[0].toTime).toBe(2);
    expect(log[1].toTime).toBe(5);

    const cleared = clearActorPath(car, 2);
    expect(cleared.keyframes).toHaveLength(1);
    expect(cleared.keyframes[0].x).toBeCloseTo(40, 1);
  });

  it('persists and restores sceneActors cleanly through projectStorage JSON', () => {
    let car = createActorFromVault('car', 'van', 0, { x: 15, y: 52 }, 'c-save');
    car = recordActorKeyframe(car, 3, 55, 58);

    const state: ProjectState = {
      clips: [
        {
          id: 'scene-1',
          type: 'image',
          name: 'محطة الصحراء',
          sourceStart: 0,
          duration: 12,
          maxDuration: 30,
          speed: 1,
          volume: 0,
          srcUrl: '/scenes/desert-station.jpg',
          thumbnails: ['/scenes/desert-station.jpg'],
        },
      ],
      audioClips: [],
      textItems: [],
      stickers: [],
      overlays: [],
      sceneActors: [car],
      mutedMain: false,
      coverTime: 0,
      aspectRatio: '3:4',
      background: { mode: 'none', value: '#000000', blurAmount: 18 },
      filter: { id: 'original', intensity: 80 },
      adjustments: { ...DEFAULT_ADJUSTMENTS },
    };

    const json = serializeProjectJson(state, DEFAULT_EXPORT_SETTINGS);
    const parsed = deserializeProjectJson(json);
    expect(parsed.error).toBeNull();
    expect(parsed.data?.project.sceneActors).toHaveLength(1);
    expect(parsed.data?.project.sceneActors?.[0].keyframes).toHaveLength(2);
    expect(parsed.data?.project.clips[0].srcUrl).toBe('/scenes/desert-station.jpg');
  });
});
