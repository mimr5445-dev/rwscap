import {
  ActorKeyframe,
  ActorKind,
  CarModelId,
  PersonModelId,
  SceneActor,
} from '../types/editor';
import { easeInOutCubic } from './easing';
import { clamp } from './time';

export interface VaultEntry<T extends CarModelId | PersonModelId = CarModelId | PersonModelId> {
  kind: ActorKind;
  modelId: T;
  name: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  defaultScale: number;
  defaultSpeed: number; // canvas-% per second
}

export const CAR_VAULT: VaultEntry<CarModelId>[] = [
  {
    kind: 'car',
    modelId: 'sedan',
    name: 'سيدان كلاسيكية',
    subtitle: 'بيج صحراوي',
    primaryColor: '#C5B49A',
    accentColor: '#6C645A',
    defaultScale: 1,
    defaultSpeed: 18,
  },
  {
    kind: 'car',
    modelId: 'sport',
    name: 'كوبيه رياضية',
    subtitle: 'مرجاني سريع',
    primaryColor: '#E16D65',
    accentColor: '#3A3A40',
    defaultScale: 1,
    defaultSpeed: 24,
  },
  {
    kind: 'car',
    modelId: 'pickup',
    name: 'شاحنة بيك-أب',
    subtitle: 'دفع رباعي',
    primaryColor: '#7D958B',
    accentColor: '#3F4C47',
    defaultScale: 1.08,
    defaultSpeed: 16,
  },
  {
    kind: 'car',
    modelId: 'van',
    name: 'فان رحلات',
    subtitle: 'تخييم وسفر',
    primaryColor: '#7395B5',
    accentColor: '#F2ECE1',
    defaultScale: 1.12,
    defaultSpeed: 14,
  },
  {
    kind: 'car',
    modelId: 'police',
    name: 'دورية الطريق',
    subtitle: 'إضاءة طوارئ',
    primaryColor: '#ECECE8',
    accentColor: '#272D36',
    defaultScale: 1.02,
    defaultSpeed: 22,
  },
  {
    kind: 'car',
    modelId: 'moto',
    name: 'دراجة صحراوية',
    subtitle: 'خفيفة وسريعة',
    primaryColor: '#D98E45',
    accentColor: '#2B2B2E',
    defaultScale: 0.9,
    defaultSpeed: 23,
  },
];

export const PERSON_VAULT: VaultEntry<PersonModelId>[] = [
  {
    kind: 'person',
    modelId: 'traveler',
    name: 'مسافر بحقيبة',
    subtitle: 'رحالة الطريق',
    primaryColor: '#D97262',
    accentColor: '#3D4852',
    defaultScale: 1,
    defaultSpeed: 9,
  },
  {
    kind: 'person',
    modelId: 'attendant',
    name: 'عامل المحطة',
    subtitle: 'زي المحطة',
    primaryColor: '#3C7E8C',
    accentColor: '#E6D4B8',
    defaultScale: 1,
    defaultSpeed: 8.5,
  },
  {
    kind: 'person',
    modelId: 'driver',
    name: 'سائق بالسترة',
    subtitle: 'سترة جلدية',
    primaryColor: '#5B4B44',
    accentColor: '#D9B98B',
    defaultScale: 1,
    defaultSpeed: 9.5,
  },
  {
    kind: 'person',
    modelId: 'explorer',
    name: 'مستكشف الصحراء',
    subtitle: 'قبعة شمسية',
    primaryColor: '#B89B6A',
    accentColor: '#574636',
    defaultScale: 1,
    defaultSpeed: 8.5,
  },
  {
    kind: 'person',
    modelId: 'photographer',
    name: 'مصوّر صحفي',
    subtitle: 'يحمل كاميرا',
    primaryColor: '#53687E',
    accentColor: '#22262B',
    defaultScale: 1,
    defaultSpeed: 8,
  },
  {
    kind: 'person',
    modelId: 'biker',
    name: 'راكب دراجة',
    subtitle: 'بخوذة سوداء',
    primaryColor: '#2F333A',
    accentColor: '#E06C5A',
    defaultScale: 1,
    defaultSpeed: 10,
  },
];

export const DESERT_STATION_SCENE_URL = '/scenes/desert-station.jpg';

/** Smart desert station spawn points along the highway (cars) and station apron (people) */
const CAR_SPAWN_POINTS = [
  { x: 18, y: 55 },
  { x: 76, y: 84 },
  { x: 43, y: 54 },
  { x: 32, y: 62 },
  { x: 64, y: 77 },
];

const PERSON_SPAWN_POINTS = [
  { x: 54, y: 49 },
  { x: 45, y: 52 },
  { x: 60, y: 55 },
  { x: 37, y: 53 },
  { x: 50, y: 57 },
];

export function getVaultEntry(kind: ActorKind, modelId: CarModelId | PersonModelId): VaultEntry {
  const list: VaultEntry[] = kind === 'car' ? CAR_VAULT : PERSON_VAULT;
  return list.find((item) => item.modelId === modelId) || list[0];
}

export function createActorFromVault(
  kind: ActorKind,
  modelId: CarModelId | PersonModelId,
  startTime: number,
  spawnPos?: { x: number; y: number },
  customId?: string,
  existingCount = 0,
): SceneActor {
  const entry = getVaultEntry(kind, modelId);
  const presets = kind === 'car' ? CAR_SPAWN_POINTS : PERSON_SPAWN_POINTS;
  const fallback = presets[existingCount % presets.length];
  const x = clamp(Number((spawnPos?.x ?? fallback.x).toFixed(2)), 4, 96);
  const y = clamp(Number((spawnPos?.y ?? fallback.y).toFixed(2)), 8, 95);
  const safeStart = Math.max(0, Number(startTime.toFixed(2)));

  return {
    id: customId || `actor-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    modelId: entry.modelId,
    name: entry.name,
    primaryColor: entry.primaryColor,
    accentColor: entry.accentColor,
    scale: entry.defaultScale,
    speed: entry.defaultSpeed,
    appearTime: safeStart,
    keyframes: [{ time: safeStart, x, y, actionLabel: 'ظهور في المشهد' }],
  };
}

export interface EvaluatedActorPose {
  visible: boolean;
  x: number;
  y: number;
  /** Facing angle in degrees (0 = right, +28 ≈ down-right along desert highway) */
  angleDeg: number;
  isMoving: boolean;
  walkPhase: number;
  currentSegmentIndex: number;
}

/** Evaluates an actor's smooth position, orientation, and walk phase at `time` */
export function evaluateActorAtTime(actor: SceneActor, time: number): EvaluatedActorPose {
  const kfs = actor.keyframes;
  if (!kfs || kfs.length === 0 || time < actor.appearTime - 0.001) {
    return {
      visible: false,
      x: 50,
      y: 50,
      angleDeg: 28,
      isMoving: false,
      walkPhase: 0,
      currentSegmentIndex: -1,
    };
  }

  // Default natural isometric road angle (+28°) when stationary with a single point
  const defaultAngle = actor.kind === 'car' ? 28 : 20;

  if (kfs.length === 1 || time <= kfs[0].time) {
    let angle = defaultAngle;
    if (kfs.length > 1) {
      const dx = kfs[1].x - kfs[0].x;
      const dy = kfs[1].y - kfs[0].y;
      if (Math.hypot(dx, dy) > 0.25) angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }
    return {
      visible: true,
      x: kfs[0].x,
      y: kfs[0].y,
      angleDeg: angle,
      isMoving: false,
      walkPhase: 0,
      currentSegmentIndex: 0,
    };
  }

  let lastKnownAngle = defaultAngle;
  let cumulativeDist = 0;

  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segDist = Math.hypot(dx, dy);
    if (segDist > 0.25) {
      lastKnownAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    if (time <= b.time) {
      const segDur = Math.max(0.001, b.time - a.time);
      const rawT = clamp((time - a.time) / segDur, 0, 1);
      // Use smooth easeInOutCubic for discrete tap-to-go moves; keep dense live-drawn points linear
      const eased = segDur >= 0.45 ? easeInOutCubic(rawT) : rawT;
      const x = a.x + dx * eased;
      const y = a.y + dy * eased;
      const movedDist = cumulativeDist + segDist * eased;
      const isMoving = segDist > 0.3 && rawT > 0.001 && rawT < 0.999;

      return {
        visible: true,
        x,
        y,
        angleDeg: lastKnownAngle,
        isMoving,
        walkPhase: movedDist * 0.55,
        currentSegmentIndex: i,
      };
    }

    cumulativeDist += segDist;
  }

  const last = kfs[kfs.length - 1];
  return {
    visible: true,
    x: last.x,
    y: last.y,
    angleDeg: lastKnownAngle,
    isMoving: false,
    walkPhase: 0,
    currentSegmentIndex: kfs.length - 1,
  };
}

/** Upserts a timed position keyframe on an actor while keeping keyframes sorted */
export function recordActorKeyframe(
  actor: SceneActor,
  time: number,
  x: number,
  y: number,
  options?: { truncateFuture?: boolean; actionLabel?: string },
): SceneActor {
  const safeT = Math.max(0, Number(time.toFixed(2)));
  const safeX = clamp(Number(x.toFixed(2)), 4, 96);
  const safeY = clamp(Number(y.toFixed(2)), 8, 95);

  let next = [...actor.keyframes];
  if (options?.truncateFuture) {
    next = next.filter((k) => k.time <= safeT + 0.04);
  }

  const existingIdx = next.findIndex((k) => Math.abs(k.time - safeT) <= 0.06);
  const entry: ActorKeyframe = {
    time: safeT,
    x: safeX,
    y: safeY,
    actionLabel: options?.actionLabel,
  };

  if (existingIdx >= 0) {
    next[existingIdx] = {
      ...next[existingIdx],
      ...entry,
      actionLabel: entry.actionLabel ?? next[existingIdx].actionLabel,
    };
  } else {
    next.push(entry);
    next.sort((a, b) => a.time - b.time);
  }

  return {
    ...actor,
    appearTime: Math.min(actor.appearTime, next[0]?.time ?? safeT),
    keyframes: next,
  };
}

/** Suggests a natural Arabic zone label for the desert gas station scene */
export function describeDesertStationSpot(x: number, y: number): string {
  if (x >= 32 && x <= 54 && y >= 43 && y <= 57) return 'مضخات الوقود';
  if (x >= 47 && x <= 68 && y >= 39 && y <= 52) return 'متجر المحطة';
  if (x >= 16 && x <= 30 && y >= 32 && y <= 53) return 'لوحة المحطة';
  if (y >= 46 + x * 0.42 - 9 && y <= 46 + x * 0.42 + 12) return 'الطريق السريع';
  return 'ساحة الصحراء';
}

/**
 * Records a smooth timed tap-to-move action from `fromTime` to `(targetX, targetY)`.
 * Returns the updated actor and the arrival timestamp so the user can chain taps seamlessly.
 */
export function addActorTapWaypoint(
  actor: SceneActor,
  fromTime: number,
  targetX: number,
  targetY: number,
  maxDuration: number,
): { actor: SceneActor; arrivalTime: number; spotLabel: string } {
  const safeFrom = clamp(Number(fromTime.toFixed(2)), 0, Math.max(0.5, maxDuration - 0.3));
  const startPose = evaluateActorAtTime(actor, safeFrom);
  const safeTargetX = clamp(Number(targetX.toFixed(2)), 4, 96);
  const safeTargetY = clamp(Number(targetY.toFixed(2)), 8, 95);

  const dist = Math.hypot(safeTargetX - startPose.x, safeTargetY - startPose.y);
  const rawTravelSec = dist / Math.max(4, actor.speed);
  const remaining = Math.max(0.4, maxDuration - safeFrom);
  const travelSec = clamp(Number(rawTravelSec.toFixed(2)), Math.min(0.65, remaining), Math.min(4.5, remaining));
  const arrivalTime = Number(Math.min(maxDuration, safeFrom + travelSec).toFixed(2));
  const spotLabel = describeDesertStationSpot(safeTargetX, safeTargetY);

  // Anchor actor's current spot at `fromTime`, clearing conflicting future points after `fromTime`
  let updated = recordActorKeyframe(actor, safeFrom, startPose.x, startPose.y, {
    truncateFuture: true,
  });

  updated = recordActorKeyframe(updated, arrivalTime, safeTargetX, safeTargetY, {
    actionLabel: `تحرك إلى ${spotLabel}`,
  });

  return { actor: updated, arrivalTime, spotLabel };
}

/** Resets an actor's recorded path to a single stationary keyframe at `keepAtTime` */
export function clearActorPath(actor: SceneActor, keepAtTime: number): SceneActor {
  const pose = evaluateActorAtTime(actor, keepAtTime);
  const safeT = Math.max(0, Number(keepAtTime.toFixed(2)));
  return {
    ...actor,
    appearTime: safeT,
    keyframes: [{ time: safeT, x: Number(pose.x.toFixed(2)), y: Number(pose.y.toFixed(2)), actionLabel: 'موضع ثابت' }],
  };
}

export interface RecordedActionEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorKind: ActorKind;
  primaryColor: string;
  fromTime: number;
  toTime: number;
  label: string;
}

/** Builds a chronological log of every recorded movement segment across all scene actors */
export function buildActionTimelineLog(actors: SceneActor[]): RecordedActionEntry[] {
  const entries: RecordedActionEntry[] = [];
  for (const actor of actors) {
    // Collapse ultra-dense live-drag trails into readable segments (~0.5s chunks)
    const kfs = actor.keyframes;
    if (kfs.length < 2) continue;

    let segStartIdx = 0;
    for (let i = 1; i < kfs.length; i++) {
      const isLast = i === kfs.length - 1;
      const elapsed = kfs[i].time - kfs[segStartIdx].time;
      const hasExplicitLabel = Boolean(kfs[i].actionLabel);
      if (isLast || hasExplicitLabel || elapsed >= 1.2) {
        const startKf = kfs[segStartIdx];
        const endKf = kfs[i];
        const dist = Math.hypot(endKf.x - startKf.x, endKf.y - startKf.y);
        if (dist > 0.5) {
          entries.push({
            id: `${actor.id}-${startKf.time}-${endKf.time}`,
            actorId: actor.id,
            actorName: actor.name,
            actorKind: actor.kind,
            primaryColor: actor.primaryColor,
            fromTime: startKf.time,
            toTime: endKf.time,
            label:
              endKf.actionLabel ||
              `تحرك إلى ${describeDesertStationSpot(endKf.x, endKf.y)}`,
          });
        }
        segStartIdx = i;
      }
    }
  }
  return entries.sort((a, b) => a.fromTime - b.fromTime);
}
