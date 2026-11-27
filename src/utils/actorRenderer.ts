import { ActorKind, CarModelId, PersonModelId, SceneActor } from '../types/editor';
import { evaluateActorAtTime, getVaultEntry } from './sceneActors';

export interface ActorRenderOptions {
  /** Show interactive motion path guides & selection halos (false during final video export) */
  showGuides?: boolean;
  selectedActorId?: string | null;
  /** Optional tap ripple animation when user taps a destination on the scene */
  tapRipple?: { x: number; y: number; progress: number } | null;
}

/**
 * Renders all Scene Studio actors (cars & characters) sorted naturally by Y-depth
 * so foreground actors cleanly pass in front of background actors.
 */
export function renderSceneActors(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  actors: SceneActor[],
  currentTime: number,
  options?: ActorRenderOptions,
) {
  if (!actors || actors.length === 0) return;

  const showGuides = Boolean(options?.showGuides);
  const selectedId = options?.selectedActorId ?? null;

  // 1. Draw motion path trajectories first (underneath actors) in editor preview mode
  if (showGuides) {
    for (const actor of actors) {
      if (actor.keyframes.length < 2) continue;
      drawActorMotionPath(ctx, w, h, actor, actor.id === selectedId);
    }

    // Draw tap destination ripple if active
    if (options?.tapRipple) {
      const { x, y, progress } = options.tapRipple;
      const rx = (x / 100) * w;
      const ry = (y / 100) * h;
      const radius = (10 + progress * 28) * (w / 720);
      ctx.save();
      ctx.strokeStyle = `rgba(0, 202, 224, ${Math.max(0, 1 - progress)})`;
      ctx.lineWidth = 2.5 * (w / 720);
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 202, 224, ${Math.max(0, 0.7 - progress * 0.7)})`;
      ctx.beginPath();
      ctx.arc(rx, ry, 4.5 * (w / 720), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. Evaluate all visible actors and depth-sort by vertical screen Y
  const evaluated = actors
    .map((actor) => ({
      actor,
      pose: evaluateActorAtTime(actor, currentTime),
    }))
    .filter((entry) => entry.pose.visible)
    .sort((a, b) => a.pose.y - b.pose.y);

  // 3. Render each actor with matching desert-station minimalist shading & ground shadow
  for (const { actor, pose } of evaluated) {
    const cx = (pose.x / 100) * w;
    const cy = (pose.y / 100) * h;
    const isSelected = showGuides && actor.id === selectedId;
    const unit = (Math.min(w, h) / 720) * actor.scale;

    if (isSelected) {
      drawSelectionRing(ctx, cx, cy, actor.kind === 'car' ? 32 * unit : 18 * unit, currentTime);
    }

    if (actor.kind === 'car') {
      drawMinimalistCar(
        ctx,
        cx,
        cy,
        unit,
        actor.modelId as CarModelId,
        actor.primaryColor,
        actor.accentColor,
        pose.angleDeg,
        pose.isMoving,
        currentTime,
      );
    } else {
      drawMinimalistPerson(
        ctx,
        cx,
        cy,
        unit,
        actor.modelId as PersonModelId,
        actor.primaryColor,
        actor.accentColor,
        pose.angleDeg,
        pose.isMoving,
        pose.walkPhase,
      );
    }

    if (isSelected) {
      drawActorBadge(ctx, cx, cy - (actor.kind === 'car' ? 28 : 34) * unit, actor.name, w / 720);
    }
  }
}

function drawActorMotionPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  actor: SceneActor,
  isSelected: boolean,
) {
  const kfs = actor.keyframes;
  const scale = w / 720;

  ctx.save();
  ctx.beginPath();
  kfs.forEach((kf, idx) => {
    const px = (kf.x / 100) * w;
    const py = (kf.y / 100) * h;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });

  ctx.strokeStyle = isSelected ? 'rgba(0, 202, 224, 0.92)' : 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = (isSelected ? 2.6 : 1.5) * scale;
  ctx.setLineDash([7 * scale, 5 * scale]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw directional arrows & waypoint dots for the selected actor
  if (isSelected) {
    // Thin out dense live-drag keyframes when drawing waypoint dots
    const stride = kfs.length > 14 ? Math.ceil(kfs.length / 10) : 1;
    for (let i = 0; i < kfs.length; i += stride) {
      const kf = kfs[i];
      const px = (kf.x / 100) * w;
      const py = (kf.y / 100) * h;

      ctx.fillStyle = i === 0 ? '#FFFFFF' : '#00CAE0';
      ctx.strokeStyle = '#0A1A1E';
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.arc(px, py, (i === kfs.length - 1 ? 5 : 3.6) * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw directional chevron midpoint to next waypoint
      if (i + stride < kfs.length) {
        const next = kfs[i + stride];
        const nx = (next.x / 100) * w;
        const ny = (next.y / 100) * h;
        const dist = Math.hypot(nx - px, ny - py);
        if (dist > 34 * scale) {
          const mx = (px + nx) / 2;
          const my = (py + ny) / 2;
          const ang = Math.atan2(ny - py, nx - px);
          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(ang);
          ctx.fillStyle = '#00CAE0';
          ctx.beginPath();
          ctx.moveTo(5 * scale, 0);
          ctx.lineTo(-4 * scale, -4 * scale);
          ctx.lineTo(-4 * scale, 4 * scale);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }

  ctx.restore();
}

function drawSelectionRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  time: number,
) {
  const pulse = 1 + Math.sin(time * 5) * 0.06;
  ctx.save();
  ctx.strokeStyle = '#00CAE0';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.12, radius * pulse, radius * 0.58 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawActorBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  label: string,
  scale: number,
) {
  ctx.save();
  const fontSize = Math.max(10, Math.round(11 * scale));
  ctx.font = `600 ${fontSize}px "IBM Plex Sans Arabic", sans-serif`;
  const padX = 7 * scale;
  const w = ctx.measureText(label).width + padX * 2;
  const h = fontSize + 7 * scale;
  const x = cx - w / 2;
  const y = topY - h;

  ctx.fillStyle = 'rgba(14, 18, 22, 0.85)';
  ctx.strokeStyle = 'rgba(0, 202, 224, 0.85)';
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, y + h / 2);
  ctx.restore();
}

/**
 * Draws minimalist isometric-feel desert editorial cars aligned to their driving heading.
 * Matches the lighting & architectural clean lines of the attached desert gas station art.
 */
function drawMinimalistCar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  unit: number,
  modelId: CarModelId,
  primary: string,
  accent: string,
  angleDeg: number,
  isMoving: boolean,
  time: number,
) {
  const rad = (angleDeg * Math.PI) / 180;
  const bounce = isMoving ? Math.sin(time * 28) * 0.65 * unit : 0;

  ctx.save();
  ctx.translate(cx, cy + bounce);

  // Warm isometric ground shadow angled down-right (matching gas station canopy shadow)
  ctx.save();
  ctx.translate(6 * unit, 5.5 * unit);
  ctx.rotate(rad);
  ctx.fillStyle = 'rgba(42, 38, 34, 0.34)';
  const shadowL = modelId === 'moto' ? 16 * unit : modelId === 'van' || modelId === 'pickup' ? 28 * unit : 25 * unit;
  const shadowW = modelId === 'moto' ? 6.5 * unit : 13.5 * unit;
  ctx.beginPath();
  ctx.roundRect(-shadowL, -shadowW, shadowL * 2, shadowW * 2, 5 * unit);
  ctx.fill();
  ctx.restore();

  ctx.rotate(rad);

  if (modelId === 'moto') {
    // Motorcycle chassis + wheels + rider
    ctx.fillStyle = '#222224';
    ctx.beginPath();
    ctx.roundRect(-16 * unit, -3 * unit, 9 * unit, 6 * unit, 2 * unit);
    ctx.roundRect(7 * unit, -3 * unit, 9 * unit, 6 * unit, 2 * unit);
    ctx.fill();

    // Body frame
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.roundRect(-11 * unit, -4.2 * unit, 22 * unit, 8.4 * unit, 4 * unit);
    ctx.fill();

    // Handlebars
    ctx.strokeStyle = '#E6E2DA';
    ctx.lineWidth = 1.8 * unit;
    ctx.beginPath();
    ctx.moveTo(6 * unit, -7.5 * unit);
    ctx.lineTo(6 * unit, 7.5 * unit);
    ctx.stroke();

    // Rider helmet & jacket
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(-2 * unit, 0, 5.5 * unit, 5 * unit, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EFECE6';
    ctx.beginPath();
    ctx.arc(0, 0, 3.6 * unit, 0, Math.PI * 2);
    ctx.fill();

    // Headlight beam
    if (isMoving) {
      ctx.fillStyle = 'rgba(255, 245, 195, 0.28)';
      ctx.beginPath();
      ctx.moveTo(15 * unit, -2 * unit);
      ctx.lineTo(36 * unit, -9 * unit);
      ctx.lineTo(36 * unit, 9 * unit);
      ctx.lineTo(15 * unit, 2 * unit);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
    return;
  }

  const len = modelId === 'van' || modelId === 'pickup' ? 27 * unit : modelId === 'sport' ? 25 * unit : 24 * unit;
  const halfW = modelId === 'van' ? 12.5 * unit : 11.5 * unit;

  // Wheels peeking slightly at sides
  ctx.fillStyle = '#242321';
  const wheelOffset = len * 0.56;
  ctx.fillRect(-wheelOffset - 4 * unit, -halfW - 1.5 * unit, 8 * unit, 3 * unit);
  ctx.fillRect(wheelOffset - 4 * unit, -halfW - 1.5 * unit, 8 * unit, 3 * unit);
  ctx.fillRect(-wheelOffset - 4 * unit, halfW - 1.5 * unit, 8 * unit, 3 * unit);
  ctx.fillRect(wheelOffset - 4 * unit, halfW - 1.5 * unit, 8 * unit, 3 * unit);

  // Lower body shell (with darker architectural trim outline)
  ctx.fillStyle = primary;
  ctx.strokeStyle = 'rgba(42, 38, 34, 0.65)';
  ctx.lineWidth = 1.2 * unit;
  ctx.beginPath();
  ctx.roundRect(-len, -halfW, len * 2, halfW * 2, (modelId === 'sport' ? 7 : 5) * unit);
  ctx.fill();
  ctx.stroke();

  // Subtle top bevel highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.roundRect(-len + 2 * unit, -halfW + 1.5 * unit, len * 2 - 4 * unit, halfW * 0.8, 3 * unit);
  ctx.fill();

  // Model-specific roof, cabin, windshields & details
  if (modelId === 'pickup') {
    // Cargo bed in rear
    ctx.fillStyle = '#383A3B';
    ctx.beginPath();
    ctx.roundRect(-len + 3 * unit, -halfW + 2.5 * unit, len * 0.78, (halfW - 2.5 * unit) * 2, 2.5 * unit);
    ctx.fill();
    // Forward cabin
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(-2 * unit, -halfW + 2.2 * unit, 13 * unit, (halfW - 2.2 * unit) * 2, 3 * unit);
    ctx.fill();
    ctx.fillStyle = '#263138';
    ctx.fillRect(8 * unit, -halfW + 3 * unit, 4 * unit, (halfW - 3 * unit) * 2);
  } else if (modelId === 'van') {
    // Two-tone camper roof
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(-len + 4 * unit, -halfW + 2.4 * unit, len * 1.55, (halfW - 2.4 * unit) * 2, 3.5 * unit);
    ctx.fill();
    // Front windshield
    ctx.fillStyle = '#2A353D';
    ctx.beginPath();
    ctx.roundRect(len - 9.5 * unit, -halfW + 2.6 * unit, 5.5 * unit, (halfW - 2.6 * unit) * 2, 2 * unit);
    ctx.fill();
    // Roof luggage bars
    ctx.strokeStyle = 'rgba(60, 65, 70, 0.45)';
    ctx.lineWidth = 1.2 * unit;
    ctx.beginPath();
    ctx.moveTo(-14 * unit, -halfW + 4.5 * unit);
    ctx.lineTo(-14 * unit, halfW - 4.5 * unit);
    ctx.moveTo(-4 * unit, -halfW + 4.5 * unit);
    ctx.lineTo(-4 * unit, halfW - 4.5 * unit);
    ctx.stroke();
  } else {
    // Sedan / Sport / Police cabin + front & rear glass
    const glassBack = modelId === 'sport' ? -13 * unit : -14 * unit;
    const glassFront = modelId === 'sport' ? 12 * unit : 11 * unit;
    ctx.fillStyle = '#29323A';
    ctx.beginPath();
    ctx.roundRect(glassBack, -halfW + 2.4 * unit, glassFront - glassBack, (halfW - 2.4 * unit) * 2, 3.5 * unit);
    ctx.fill();

    // Roof cap
    ctx.fillStyle = modelId === 'police' ? accent : primary;
    ctx.beginPath();
    ctx.roundRect(glassBack + 4.5 * unit, -halfW + 3.4 * unit, glassFront - glassBack - 10 * unit, (halfW - 3.4 * unit) * 2, 2.5 * unit);
    ctx.fill();

    // Racing stripe for sport car
    if (modelId === 'sport') {
      ctx.fillStyle = 'rgba(255, 248, 240, 0.72)';
      ctx.fillRect(-len + 1.5 * unit, -1.6 * unit, len * 2 - 3 * unit, 3.2 * unit);
    }

    // Police emergency roof lightbar
    if (modelId === 'police') {
      const flash = Math.floor(time * 7) % 2 === 0;
      ctx.fillStyle = flash ? '#00D8FF' : '#005A70';
      ctx.fillRect(-1.5 * unit, -6 * unit, 3.2 * unit, 5.5 * unit);
      ctx.fillStyle = !flash ? '#FF4B4B' : '#701E1E';
      ctx.fillRect(-1.5 * unit, 0.5 * unit, 3.2 * unit, 5.5 * unit);
      if (isMoving) {
        ctx.fillStyle = flash ? 'rgba(0, 216, 255, 0.25)' : 'rgba(255, 75, 75, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 14 * unit, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Headlights (front = +len) and Taillights (rear = -len)
  ctx.fillStyle = '#FFF4C8';
  ctx.fillRect(len - 2.2 * unit, -halfW + 2.2 * unit, 2.2 * unit, 4 * unit);
  ctx.fillRect(len - 2.2 * unit, halfW - 6.2 * unit, 2.2 * unit, 4 * unit);

  ctx.fillStyle = isMoving ? '#FF5247' : '#B83C34';
  ctx.fillRect(-len, -halfW + 2.2 * unit, 2 * unit, 4 * unit);
  ctx.fillRect(-len, halfW - 6.2 * unit, 2 * unit, 4 * unit);

  // Soft headlight glow cone while moving
  if (isMoving) {
    const grd = ctx.createLinearGradient(len, 0, len + 26 * unit, 0);
    grd.addColorStop(0, 'rgba(255, 246, 200, 0.26)');
    grd.addColorStop(1, 'rgba(255, 246, 200, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(len, -halfW + 2 * unit);
    ctx.lineTo(len + 26 * unit, -halfW - 5 * unit);
    ctx.lineTo(len + 26 * unit, halfW + 5 * unit);
    ctx.lineTo(len, halfW - 2 * unit);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws minimalist stylized isometric characters with animated walking stride & props.
 */
function drawMinimalistPerson(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  unit: number,
  modelId: PersonModelId,
  primary: string,
  accent: string,
  angleDeg: number,
  isMoving: boolean,
  walkPhase: number,
) {
  const facingLeft = Math.cos((angleDeg * Math.PI) / 180) < 0;
  const stride = isMoving ? Math.sin(walkPhase) : 0;
  const bob = isMoving ? Math.abs(Math.cos(walkPhase)) * 2.1 * unit : 0;

  ctx.save();
  ctx.translate(cx, cy);

  // Warm diagonal ground shadow matching the desert station artwork
  ctx.fillStyle = 'rgba(42, 38, 34, 0.34)';
  ctx.beginPath();
  ctx.ellipse(6.5 * unit, 3 * unit, 9.5 * unit, 4.2 * unit, 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(facingLeft ? -1 : 1, 1);

  // Legs with natural walking swing
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3.2 * unit;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-1.8 * unit, -9 * unit - bob);
  ctx.lineTo((-1.8 + stride * 5) * unit, 0);
  ctx.moveTo(1.8 * unit, -9 * unit - bob);
  ctx.lineTo((1.8 - stride * 5) * unit, 0);
  ctx.stroke();

  // Back arm
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.6 * unit;
  ctx.beginPath();
  ctx.moveTo(0, -19 * unit - bob);
  ctx.lineTo((-stride * 5 - 3) * unit, -12 * unit - bob);
  ctx.stroke();

  // Torso / Jacket
  ctx.fillStyle = primary;
  ctx.strokeStyle = 'rgba(32, 28, 25, 0.55)';
  ctx.lineWidth = 0.9 * unit;
  ctx.beginPath();
  ctx.roundRect(-5.2 * unit, -22 * unit - bob, 10.4 * unit, 13.5 * unit, 3.8 * unit);
  ctx.fill();
  ctx.stroke();

  // Front arm + character-specific prop
  const handX = (stride * 5 + 3.8) * unit;
  const handY = -11.5 * unit - bob;
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.6 * unit;
  ctx.beginPath();
  ctx.moveTo(1.5 * unit, -19 * unit - bob);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  if (modelId === 'traveler') {
    // Rolling suitcase
    ctx.fillStyle = '#8C5E44';
    ctx.beginPath();
    ctx.roundRect(handX - 2 * unit, handY, 7.5 * unit, 9.5 * unit, 1.8 * unit);
    ctx.fill();
  } else if (modelId === 'photographer') {
    // Camera in front
    ctx.fillStyle = '#1F2328';
    ctx.fillRect(4 * unit, -18 * unit - bob, 5.5 * unit, 4 * unit);
    ctx.fillStyle = '#00CAE0';
    ctx.beginPath();
    ctx.arc(8.2 * unit, -16 * unit - bob, 1.2 * unit, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = modelId === 'biker' ? '#24272E' : '#EAC5A4';
  ctx.beginPath();
  ctx.arc(0, -26.5 * unit - bob, 4.6 * unit, 0, Math.PI * 2);
  ctx.fill();

  // Headwear / hair details
  if (modelId === 'explorer') {
    ctx.fillStyle = '#735A3D';
    ctx.beginPath();
    ctx.ellipse(0, -29.2 * unit - bob, 7.8 * unit, 2 * unit, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -30 * unit - bob, 4 * unit, Math.PI, 0);
    ctx.fill();
  } else if (modelId === 'attendant') {
    ctx.fillStyle = '#E16D65';
    ctx.beginPath();
    ctx.arc(0, -28.5 * unit - bob, 4.7 * unit, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(0, -29 * unit - bob, 6.2 * unit, 1.6 * unit);
  } else if (modelId === 'biker') {
    // Helmet visor
    ctx.fillStyle = '#00CAE0';
    ctx.fillRect(1 * unit, -28 * unit - bob, 3.8 * unit, 2.2 * unit);
  } else {
    ctx.fillStyle = '#332A26';
    ctx.beginPath();
    ctx.arc(-0.5 * unit, -28 * unit - bob, 4.4 * unit, Math.PI * 0.9, Math.PI * 2.05);
    ctx.fill();
  }

  ctx.restore();
}

const previewCache = new Map<string, string>();

/** Generates a cached crisp miniature preview data URL for the Cars & People Vault UI */
export function getVaultActorPreviewUrl(
  kind: ActorKind,
  modelId: CarModelId | PersonModelId,
): string {
  const key = `${kind}:${modelId}`;
  const cached = previewCache.get(key);
  if (cached) return cached;
  if (typeof document === 'undefined') return '';

  const entry = getVaultEntry(kind, modelId);
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 88;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Subtle desert sand circular pedestal matching the studio scene
  ctx.fillStyle = 'rgba(243, 236, 220, 0.14)';
  ctx.beginPath();
  ctx.ellipse(60, 56, 44, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === 'car') {
    drawMinimalistCar(
      ctx,
      60,
      46,
      1.35,
      modelId as CarModelId,
      entry.primaryColor,
      entry.accentColor,
      20,
      false,
      0,
    );
  } else {
    drawMinimalistPerson(
      ctx,
      60,
      68,
      1.55,
      modelId as PersonModelId,
      entry.primaryColor,
      entry.accentColor,
      0,
      true,
      0.8,
    );
  }

  const url = canvas.toDataURL('image/png');
  previewCache.set(key, url);
  return url;
}
