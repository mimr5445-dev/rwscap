import {
  Adjustments,
  AspectRatioId,
  BackgroundConfig,
  DEFAULT_CLIP_TRANSFORM,
  FilterId,
  FilterState,
  OverlayItem,
  ProjectState,
  StickerItem,
  TextItem,
  TransitionId,
  VideoClip,
} from '../types/editor';
import {
  computeClipMotion,
  computeLayerMotion,
  computeTransitionWindow,
} from './easing';
import { ActorRenderOptions, renderSceneActors } from './actorRenderer';

export interface ActiveClipInfo {
  clip: VideoClip;
  clipIndex: number;
  clipStartTime: number;
  localTime: number; // time within the clip on timeline
  sourceTime: number; // source time accounting for sourceStart & speed
}

export function getTotalDuration(clips: VideoClip[]): number {
  const sum = clips.reduce((acc, c) => acc + c.duration, 0);
  return Math.max(0.5, Number(sum.toFixed(2)));
}

export function getActiveClipAtTime(clips: VideoClip[], time: number): ActiveClipInfo | null {
  if (clips.length === 0) return null;
  let cursor = 0;
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const end = cursor + clip.duration;
    if (time < end || i === clips.length - 1) {
      const localTime = Math.max(0, Math.min(clip.duration, time - cursor));
      const sourceTime = clip.sourceStart + localTime * clip.speed;
      return {
        clip,
        clipIndex: i,
        clipStartTime: cursor,
        localTime,
        sourceTime,
      };
    }
    cursor = end;
  }
  return null;
}

export function getAspectDimensions(ratio: AspectRatioId): { width: number; height: number } {
  switch (ratio) {
    case '9:16':
      return { width: 540, height: 960 };
    case '1:1':
      return { width: 720, height: 720 };
    case '4:3':
      return { width: 800, height: 600 };
    case '3:4':
      return { width: 600, height: 800 };
    case '2.35:1':
      return { width: 960, height: 408 };
    case 'fit':
    case '16:9':
    default:
      return { width: 960, height: 540 };
  }
}

/** Simplified vector silhouettes of continents for the sleek dark telemetry world-map demo clip */
const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  // North America
  [
    [0.14, 0.24], [0.22, 0.20], [0.31, 0.22], [0.35, 0.29], [0.31, 0.36],
    [0.27, 0.44], [0.24, 0.50], [0.21, 0.48], [0.19, 0.40], [0.15, 0.34],
  ],
  // Greenland
  [
    [0.37, 0.14], [0.43, 0.13], [0.45, 0.20], [0.40, 0.24], [0.37, 0.20],
  ],
  // South America
  [
    [0.27, 0.52], [0.33, 0.54], [0.38, 0.62], [0.36, 0.72], [0.31, 0.85],
    [0.28, 0.84], [0.27, 0.71], [0.25, 0.60],
  ],
  // Europe
  [
    [0.46, 0.22], [0.53, 0.19], [0.58, 0.23], [0.57, 0.32], [0.51, 0.36],
    [0.46, 0.35], [0.45, 0.28],
  ],
  // Africa
  [
    [0.45, 0.40], [0.54, 0.39], [0.60, 0.46], [0.62, 0.56], [0.58, 0.68],
    [0.54, 0.78], [0.50, 0.77], [0.47, 0.63], [0.43, 0.52], [0.43, 0.44],
  ],
  // Middle East + Asia
  [
    [0.57, 0.22], [0.69, 0.19], [0.81, 0.23], [0.87, 0.31], [0.83, 0.42],
    [0.78, 0.50], [0.72, 0.54], [0.67, 0.52], [0.63, 0.45], [0.58, 0.43],
    [0.57, 0.34],
  ],
  // Southeast Asia islands
  [
    [0.75, 0.56], [0.81, 0.57], [0.84, 0.61], [0.76, 0.61],
  ],
  // Australia
  [
    [0.77, 0.66], [0.86, 0.65], [0.89, 0.73], [0.85, 0.80], [0.77, 0.77],
    [0.75, 0.71],
  ],
];

const CITY_NODES: Array<[number, number, number]> = [
  [0.23, 0.33, 0.0],
  [0.29, 0.35, 0.4],
  [0.32, 0.60, 0.8],
  [0.49, 0.29, 0.2],
  [0.53, 0.31, 0.6],
  [0.57, 0.43, 1.0], // Sanaa / Arabian Peninsula
  [0.54, 0.48, 1.2],
  [0.53, 0.72, 1.5],
  [0.67, 0.42, 0.3],
  [0.76, 0.36, 0.9],
  [0.82, 0.38, 1.4],
  [0.82, 0.73, 1.8],
  [0.62, 0.33, 0.5],
  [0.72, 0.47, 1.1],
];

function drawWorldMapDemo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
) {
  // Deep cosmic slate backdrop
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.46, w * 0.05, w * 0.5, h * 0.5, w * 0.72);
  bg.addColorStop(0, '#232c33');
  bg.addColorStop(0.55, '#151b20');
  bg.addColorStop(1, '#0c1013');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle atmospheric dust & star particles
  ctx.save();
  for (let i = 0; i < 95; i++) {
    const seed = i * 197.31;
    const px = ((Math.sin(seed) * 0.5 + 0.5) * w + time * (2 + (i % 4))) % w;
    const py = ((Math.cos(seed * 1.37) * 0.5 + 0.5) * h + Math.sin(time + i) * 2 + h) % h;
    const alpha = 0.08 + ((i % 7) / 7) * 0.22;
    ctx.fillStyle = `rgba(180, 205, 220, ${alpha})`;
    ctx.fillRect(px, py, i % 3 === 0 ? 1.8 : 1.1, i % 3 === 0 ? 1.8 : 1.1);
  }
  ctx.restore();

  // Outer blueprint tactical card border
  const padX = w * 0.085;
  const padY = h * 0.06;
  const cardW = w - padX * 2;
  const cardH = h - padY * 2;

  ctx.save();
  ctx.strokeStyle = 'rgba(148, 175, 190, 0.28)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(padX, padY, cardW, cardH);

  // Corner L-brackets
  const br = Math.min(w, h) * 0.025;
  ctx.strokeStyle = 'rgba(185, 215, 228, 0.6)';
  ctx.lineWidth = 2;
  const corners = [
    [padX, padY, 1, 1],
    [padX + cardW, padY, -1, 1],
    [padX, padY + cardH, 1, -1],
    [padX + cardW, padY + cardH, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * br);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * br, cy);
    ctx.stroke();
  }

  // Top Header Strip inside blueprint card
  const headerH = cardH * 0.34;
  ctx.fillStyle = 'rgba(20, 27, 32, 0.72)';
  ctx.fillRect(padX + 1, padY + 1, cardW - 2, headerH);

  // Subtle divider line
  ctx.strokeStyle = 'rgba(155, 180, 195, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, padY + headerH);
  ctx.lineTo(padX + cardW, padY + headerH);
  ctx.stroke();

  // Title text in top-left of card
  ctx.fillStyle = 'rgba(225, 238, 245, 0.88)';
  ctx.font = `600 ${Math.max(10, w * 0.024)}px Inter, monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('ATLAS TELEMETRY CARD', padX + cardW * 0.028, padY + cardH * 0.07);

  // Barcode / telemetry lines top-center
  ctx.fillStyle = 'rgba(170, 196, 210, 0.35)';
  for (let b = 0; b < 24; b++) {
    const bw = (b % 3 === 0 ? 3 : 1.5) * (w / 960);
    ctx.fillRect(padX + cardW * 0.44 + b * (w * 0.0055), padY + cardH * 0.035, bw, cardH * 0.035);
  }

  // Three top telemetry sub-panels (Left: Data Table, Center: Globe Orbital Icon, Right: Signal Waveform)
  const subY = padY + cardH * 0.11;
  const subH = headerH - cardH * 0.13;
  const col1W = cardW * 0.34;
  const col2W = cardW * 0.22;
  const col3W = cardW * 0.37;

  // Sub-panel borders
  ctx.strokeStyle = 'rgba(145, 175, 190, 0.22)';
  ctx.strokeRect(padX + cardW * 0.02, subY, col1W, subH);
  ctx.strokeRect(padX + cardW * 0.375, subY, col2W, subH);
  ctx.strokeRect(padX + cardW * 0.61, subY, col3W, subH);

  // Col 1: Data readout bars
  ctx.fillStyle = 'rgba(175, 200, 215, 0.55)';
  ctx.font = `500 ${Math.max(7, w * 0.011)}px monospace`;
  ctx.fillText('01 / ORBITAL TELEMETRY', padX + cardW * 0.032, subY + subH * 0.18);
  for (let r = 0; r < 5; r++) {
    const ry = subY + subH * (0.31 + r * 0.13);
    const barVal = 0.35 + 0.55 * (Math.sin(time * 1.4 + r * 1.2) * 0.5 + 0.5);
    ctx.fillStyle = 'rgba(140, 170, 185, 0.18)';
    ctx.fillRect(padX + cardW * 0.035, ry, col1W * 0.85, subH * 0.075);
    ctx.fillStyle = r === 2 ? 'rgba(0, 202, 224, 0.55)' : 'rgba(185, 210, 225, 0.45)';
    ctx.fillRect(padX + cardW * 0.035, ry, col1W * 0.85 * barVal, subH * 0.075);
  }

  // Col 2: Wireframe rotating globe emblem
  const gx = padX + cardW * 0.375 + col2W * 0.5;
  const gy = subY + subH * 0.52;
  const gr = Math.min(col2W, subH) * 0.36;
  ctx.strokeStyle = 'rgba(195, 220, 232, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(gx, gy, gr, 0, Math.PI * 2);
  ctx.stroke();
  for (let m = -2; m <= 2; m++) {
    const rx = Math.max(2, Math.abs(Math.cos(time * 0.5 + m * 0.5)) * gr);
    ctx.beginPath();
    ctx.ellipse(gx, gy, rx, gr, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(150, 185, 202, 0.26)';
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(gx, gy, gr, gr * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Col 3: Animated frequency waveform & horizon readout
  ctx.fillStyle = 'rgba(175, 200, 215, 0.55)';
  ctx.fillText('02 / SIGNAL SPECTRUM', padX + cardW * 0.625, subY + subH * 0.18);
  ctx.beginPath();
  const waveX0 = padX + cardW * 0.63;
  const waveW = col3W * 0.88;
  const waveMidY = subY + subH * 0.58;
  for (let s = 0; s <= 48; s++) {
    const frac = s / 48;
    const x = waveX0 + frac * waveW;
    const amp =
      Math.sin(frac * Math.PI) *
      (Math.sin(frac * 14 - time * 4.5) * 0.55 + Math.cos(frac * 27 + time * 3.1) * 0.35);
    const y = waveMidY + amp * subH * 0.27;
    if (s === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(195, 225, 238, 0.72)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Bottom Map Viewport Area
  const mapX = padX + cardW * 0.02;
  const mapY = padY + headerH + cardH * 0.03;
  const mapW = cardW * 0.96;
  const mapH = cardH - headerH - cardH * 0.055;

  // Map container with subtle dark slate gradient
  const mapBg = ctx.createLinearGradient(mapX, mapY, mapX, mapY + mapH);
  mapBg.addColorStop(0, '#182127');
  mapBg.addColorStop(0.5, '#1f2a31');
  mapBg.addColorStop(1, '#141c21');
  ctx.fillStyle = mapBg;
  ctx.fillRect(mapX, mapY, mapW, mapH);

  // Subtle lat/lon grid inside map
  ctx.strokeStyle = 'rgba(155, 185, 200, 0.1)';
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 10; i++) {
    const x = mapX + (mapW * i) / 10;
    ctx.beginPath();
    ctx.moveTo(x, mapY);
    ctx.lineTo(x, mapY + mapH);
    ctx.stroke();
  }
  for (let j = 1; j < 6; j++) {
    const y = mapY + (mapH * j) / 6;
    ctx.beginPath();
    ctx.moveTo(mapX, y);
    ctx.lineTo(mapX + mapW, y);
    ctx.stroke();
  }

  // Subtle camera Ken Burns pan/zoom on map
  ctx.save();
  ctx.beginPath();
  ctx.rect(mapX, mapY, mapW, mapH);
  ctx.clip();

  const zoom = 1 + Math.sin(time * 0.35) * 0.045;
  const panX = Math.sin(time * 0.4) * mapW * 0.015;
  const panY = Math.cos(time * 0.3) * mapH * 0.01;
  ctx.translate(mapX + mapW / 2 + panX, mapY + mapH / 2 + panY);
  ctx.scale(zoom, zoom);
  ctx.translate(-(mapX + mapW / 2), -(mapY + mapH / 2));

  // Render stylized textured continents
  for (const poly of CONTINENT_POLYGONS) {
    ctx.beginPath();
    poly.forEach(([nx, ny], idx) => {
      const px = mapX + nx * mapW;
      const py = mapY + ny * mapH;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();

    const grad = ctx.createLinearGradient(mapX, mapY, mapX + mapW, mapY + mapH);
    grad.addColorStop(0, 'rgba(116, 134, 144, 0.56)');
    grad.addColorStop(0.5, 'rgba(148, 168, 178, 0.62)');
    grad.addColorStop(1, 'rgba(98, 118, 128, 0.5)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 224, 236, 0.38)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Animated glowing pulse sweep across the map (creates bright glowing city nodes around t=2..4s!)
  const sweepFrac = (time % 6) / 6;
  const sweepX = mapX + sweepFrac * mapW;
  const sweepGrad = ctx.createLinearGradient(sweepX - mapW * 0.14, 0, sweepX + mapW * 0.04, 0);
  sweepGrad.addColorStop(0, 'rgba(0, 202, 224, 0)');
  sweepGrad.addColorStop(0.75, 'rgba(185, 235, 248, 0.13)');
  sweepGrad.addColorStop(1, 'rgba(0, 202, 224, 0)');
  ctx.fillStyle = sweepGrad;
  ctx.fillRect(sweepX - mapW * 0.14, mapY, mapW * 0.18, mapH);

  // Connecting geodesic arcs between nodes
  ctx.strokeStyle = 'rgba(160, 220, 238, 0.25)';
  ctx.lineWidth = 1;
  const links: Array<[number, number]> = [
    [0, 3], [3, 5], [5, 8], [8, 9], [1, 2], [5, 7], [9, 11],
  ];
  for (const [a, b] of links) {
    const [ax, ay] = CITY_NODES[a];
    const [bx, by] = CITY_NODES[b];
    const x1 = mapX + ax * mapW;
    const y1 = mapY + ay * mapH;
    const x2 = mapX + bx * mapW;
    const y2 = mapY + by * mapH;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - mapH * 0.12, x2, y2);
    ctx.stroke();
  }

  // Glowing city nodes (brighter around t=2..4.5s for rich filmstrip variety!)
  const glowBoost = 0.55 + 0.45 * Math.sin(Math.max(0, time - 1.2) * 1.1);
  for (const [nx, ny, phase] of CITY_NODES) {
    const cx = mapX + nx * mapW;
    const cy = mapY + ny * mapH;
    const pulse = (Math.sin(time * 3 + phase * 3) * 0.5 + 0.5) * glowBoost;
    const radius = (3 + pulse * 8) * (w / 960);

    const glow = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, radius * 2.2);
    glow.addColorStop(0, `rgba(240, 252, 255, ${0.75 + pulse * 0.25})`);
    glow.addColorStop(0.4, `rgba(120, 220, 240, ${0.35 + pulse * 0.35})`);
    glow.addColorStop(1, 'rgba(0, 202, 224, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.8 * (w / 960), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Map labels
  ctx.fillStyle = 'rgba(205, 225, 235, 0.55)';
  ctx.font = `600 ${Math.max(9, w * 0.018)}px Inter, monospace`;
  ctx.fillText('MAP', mapX + mapW * 0.022, mapY + mapH * 0.11);
  ctx.fillText('MAP', mapX + mapW * 0.022, mapY + mapH * 0.94);
  ctx.textAlign = 'right';
  ctx.fillText(`SEC ${time.toFixed(1)}`, mapX + mapW * 0.98, mapY + mapH * 0.11);
  ctx.textAlign = 'left';

  ctx.restore();
}

function drawRadarDemo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.65);
  grad.addColorStop(0, '#102933');
  grad.addColorStop(1, '#090e12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.4;

  ctx.strokeStyle = 'rgba(0, 202, 224, 0.25)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (maxR * i) / 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  const angle = time * 1.8;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const sweep = ctx.createLinearGradient(0, 0, maxR, 0);
  sweep.addColorStop(0, 'rgba(0, 202, 224, 0.55)');
  sweep.addColorStop(1, 'rgba(0, 202, 224, 0.02)');
  ctx.fillStyle = sweep;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, maxR, -0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHorizonDemo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0d1324');
  sky.addColorStop(0.55, '#1d2b44');
  sky.addColorStop(0.75, '#3b3c58');
  sky.addColorStop(1, '#10141c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Subtle glowing horizon orb
  const orbY = h * (0.56 - Math.sin(time * 0.4) * 0.04);
  const orb = ctx.createRadialGradient(w * 0.5, orbY, 4, w * 0.5, orbY, h * 0.28);
  orb.addColorStop(0, 'rgba(255, 220, 175, 0.9)');
  orb.addColorStop(0.35, 'rgba(0, 202, 224, 0.35)');
  orb.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, w, h);

  // Layered silhouettes
  ctx.fillStyle = '#0c1118';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += w / 24) {
    const ridge = Math.sin(x * 0.012 + time * 0.25) * h * 0.06 + Math.cos(x * 0.025) * h * 0.03;
    ctx.lineTo(x, h * 0.68 + ridge);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

export function drawDemoClipFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  variant: VideoClip['demoVariant'],
  time: number,
) {
  if (variant === 'radar') {
    drawRadarDemo(ctx, w, h, time);
  } else if (variant === 'horizon') {
    drawHorizonDemo(ctx, w, h, time);
  } else {
    drawWorldMapDemo(ctx, w, h, time);
  }
}

export function generateDemoThumbnails(
  variant: VideoClip['demoVariant'],
  duration: number,
  count = 9,
): string[] {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  const thumbs: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / Math.max(1, count - 1)) * duration;
    drawDemoClipFrame(ctx, canvas.width, canvas.height, variant, t);
    thumbs.push(canvas.toDataURL('image/jpeg', 0.72));
  }
  return thumbs;
}

export async function extractVideoMetadataAndThumbs(
  srcUrl: string,
): Promise<{ duration: number; thumbnails: string[] }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = srcUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const fallback = () => resolve({ duration: 5, thumbnails: [] });

    video.onloadedmetadata = async () => {
      const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 5;
      const count = Math.min(12, Math.max(4, Math.ceil(dur)));
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 72;
      const ctx = canvas.getContext('2d');
      const thumbs: string[] = [];

      if (ctx) {
        for (let i = 0; i < count; i++) {
          const seekTime = Math.min(dur - 0.05, (i / count) * dur);
          await new Promise<void>((res) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                thumbs.push(canvas.toDataURL('image/jpeg', 0.65));
              } catch {
                // ignore taint errors
              }
              res();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = Math.max(0, seekTime);
          });
        }
      }
      resolve({ duration: Number(dur.toFixed(2)), thumbnails: thumbs });
    };

    video.onerror = fallback;
  });
}

export function buildCssFilterString(filter: FilterState, adjustments: Adjustments): string {
  const b = 100 + adjustments.brightness + adjustments.exposure * 0.7;
  const c = 100 + adjustments.contrast + adjustments.sharpen * 0.22;
  const s = 100 + adjustments.saturation;

  const isNeutralAdjustments = b === 100 && c === 100 && s === 100;
  const isNeutralFilter = filter.id === 'original' || filter.intensity <= 0;
  if (isNeutralAdjustments && isNeutralFilter) {
    return 'none';
  }

  const parts: string[] = [];
  if (b !== 100) parts.push(`brightness(${Math.max(20, b)}%)`);
  if (c !== 100) parts.push(`contrast(${Math.max(30, c)}%)`);
  if (s !== 100) parts.push(`saturate(${Math.max(0, s)}%)`);

  const k = filter.intensity / 100;
  switch (filter.id) {
    case 'cinematic':
      parts.push(`contrast(${100 + 16 * k}%)`, `saturate(${100 - 12 * k}%)`, `sepia(${12 * k}%)`);
      break;
    case 'noir':
      parts.push(`grayscale(${85 * k}%)`, `contrast(${100 + 30 * k}%)`, `brightness(${100 - 8 * k}%)`);
      break;
    case 'slate':
      parts.push(`saturate(${100 - 25 * k}%)`, `hue-rotate(${16 * k}deg)`, `contrast(${100 + 10 * k}%)`);
      break;
    case 'warm':
      parts.push(`sepia(${28 * k}%)`, `saturate(${100 + 22 * k}%)`, `brightness(${100 + 5 * k}%)`);
      break;
    case 'retro':
      parts.push(`sepia(${42 * k}%)`, `contrast(${100 - 6 * k}%)`, `saturate(${100 - 18 * k}%)`);
      break;
    case 'vivid':
      parts.push(`saturate(${100 + 48 * k}%)`, `contrast(${100 + 15 * k}%)`);
      break;
    case 'bw':
      parts.push(`grayscale(${100 * k}%)`, `contrast(${100 + 18 * k}%)`);
      break;
    case 'cyber':
      parts.push(`hue-rotate(${-24 * k}deg)`, `saturate(${100 + 40 * k}%)`, `contrast(${100 + 18 * k}%)`);
      break;
    case 'original':
    default:
      break;
  }

  return parts.join(' ');
}

export interface MediaElementCache {
  videos: Map<string, HTMLVideoElement>;
  images: Map<string, HTMLImageElement>;
}

/**
 * Unified Canvas Compositor used by BOTH live PreviewStage and Export MediaRecorder!
 */
export function renderCompositeFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: ProjectState,
  currentTime: number,
  mediaCache: MediaElementCache,
  actorOptions?: ActorRenderOptions,
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // 1. Background fill
  drawBackground(ctx, w, h, state.background, state, currentTime, mediaCache);

  // 2. Main video / image / demo clip layer with transitions, transforms, clip motion & filters
  const active = getActiveClipAtTime(state.clips, currentTime);
  const activeTransition = computeTransitionWindow(state.clips, currentTime);

  if (active || activeTransition) {
    ctx.save();
    ctx.filter = buildCssFilterString(state.filter, state.adjustments);

    // Inset slightly if user chose a colored/gradient/blur background so the frame effect is visible!
    const hasBackdropFrame = state.background.mode !== 'none';
    const scaleFactor = hasBackdropFrame ? 0.88 : 1;
    const drawW = w * scaleFactor;
    const drawH = h * scaleFactor;
    const offsetX = (w - drawW) / 2;
    const offsetY = (h - drawH) / 2;

    ctx.save();
    if (hasBackdropFrame) {
      roundRectPath(ctx, offsetX, offsetY, drawW, drawH, 10);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(offsetX, offsetY, drawW, drawH);
      ctx.clip();
    }

    if (activeTransition) {
      renderTransitionBlend(
        ctx,
        activeTransition.transitionId,
        activeTransition.eased,
        activeTransition.fromClip,
        activeTransition.fromSourceTime,
        activeTransition.toClip,
        activeTransition.toSourceTime,
        offsetX,
        offsetY,
        drawW,
        drawH,
        mediaCache,
      );
    } else if (active) {
      drawTransformedClip(
        ctx,
        active.clip,
        active.sourceTime,
        active.localTime,
        offsetX,
        offsetY,
        drawW,
        drawH,
        mediaCache,
      );
    }

    ctx.restore();
    ctx.restore();
  }

  // 3. Temperature tint overlay
  if (state.adjustments.temperature !== 0) {
    const t = state.adjustments.temperature / 50;
    ctx.fillStyle =
      t > 0
        ? `rgba(255, 165, 70, ${Math.abs(t) * 0.16})`
        : `rgba(70, 175, 255, ${Math.abs(t) * 0.16})`;
    ctx.fillRect(0, 0, w, h);
  }

  // 4. Vignette overlay
  if (state.adjustments.vignette > 0) {
    const v = state.adjustments.vignette / 100;
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${v * 0.85})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  // 4.5. Interactive Studio Scene Actors (cars & characters with timed motion paths)
  if (state.sceneActors && state.sceneActors.length > 0) {
    renderSceneActors(ctx, w, h, state.sceneActors, currentTime, actorOptions);
  }

  // 5. Overlays (PIP)
  for (const ov of state.overlays) {
    if (currentTime >= ov.startTime && currentTime <= ov.startTime + ov.duration) {
      drawOverlayItem(ctx, w, h, ov, currentTime, mediaCache);
    }
  }

  // 6. Stickers (with clamped entrance/exit animations)
  for (const st of state.stickers) {
    if (currentTime >= st.startTime && currentTime <= st.startTime + st.duration) {
      drawStickerItem(ctx, w, h, st, currentTime - st.startTime);
    }
  }

  // 7. Text & Captions (with clamped entrance/exit + typewriter animations)
  for (const txt of state.textItems) {
    if (currentTime >= txt.startTime && currentTime <= txt.startTime + txt.duration) {
      drawTextItem(ctx, w, h, txt, currentTime - txt.startTime);
    }
  }

  ctx.restore();
}

function drawTransformedClip(
  ctx: CanvasRenderingContext2D,
  clip: VideoClip,
  sourceTime: number,
  localTime: number,
  x: number,
  y: number,
  w: number,
  h: number,
  mediaCache: MediaElementCache,
) {
  const tr = clip.transform ? { ...DEFAULT_CLIP_TRANSFORM, ...clip.transform } : DEFAULT_CLIP_TRANSFORM;
  const motion = computeClipMotion(clip.animation, localTime, clip.duration);

  const combinedOpacity = (tr.opacity / 100) * motion.opacity;
  const combinedScale = tr.scale * motion.scale;
  const tx = (tr.offsetX / 100) * w + motion.offsetX * w;
  const ty = (tr.offsetY / 100) * h + motion.offsetY * h;
  const rad = (tr.rotation * Math.PI) / 180;
  const sx = (tr.flipH ? -1 : 1) * combinedScale;
  const sy = (tr.flipV ? -1 : 1) * combinedScale;

  ctx.save();
  ctx.globalAlpha *= Math.max(0, Math.min(1, combinedOpacity));
  ctx.translate(x + w / 2 + tx, y + h / 2 + ty);
  if (rad !== 0) ctx.rotate(rad);
  ctx.scale(sx, sy);
  drawClipSource(ctx, clip, sourceTime, -w / 2, -h / 2, w, h, mediaCache);
  ctx.restore();
}

function renderTransitionBlend(
  ctx: CanvasRenderingContext2D,
  transitionId: Exclude<TransitionId, 'none'>,
  p: number,
  fromClip: VideoClip,
  fromSourceTime: number,
  toClip: VideoClip,
  toSourceTime: number,
  x: number,
  y: number,
  w: number,
  h: number,
  mediaCache: MediaElementCache,
) {
  switch (transitionId) {
    case 'dissolve': {
      ctx.save();
      ctx.globalAlpha = 1 - p;
      drawTransformedClip(ctx, fromClip, fromSourceTime, fromClip.duration, x, y, w, h, mediaCache);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = p;
      drawTransformedClip(ctx, toClip, toSourceTime, 0, x, y, w, h, mediaCache);
      ctx.restore();
      break;
    }
    case 'fade': {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, w, h);
      if (p < 0.5) {
        ctx.save();
        ctx.globalAlpha = 1 - p * 2;
        drawTransformedClip(ctx, fromClip, fromSourceTime, fromClip.duration, x, y, w, h, mediaCache);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = (p - 0.5) * 2;
        drawTransformedClip(ctx, toClip, toSourceTime, 0, x, y, w, h, mediaCache);
        ctx.restore();
      }
      break;
    }
    case 'slide-left': {
      drawTransformedClip(ctx, fromClip, fromSourceTime, fromClip.duration, x - p * w, y, w, h, mediaCache);
      drawTransformedClip(ctx, toClip, toSourceTime, 0, x + (1 - p) * w, y, w, h, mediaCache);
      break;
    }
    case 'slide-up': {
      drawTransformedClip(ctx, fromClip, fromSourceTime, fromClip.duration, x, y - p * h, w, h, mediaCache);
      drawTransformedClip(ctx, toClip, toSourceTime, 0, x, y + (1 - p) * h, w, h, mediaCache);
      break;
    }
    case 'zoom-in': {
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(1 + p * 0.25, 1 + p * 0.25);
      drawTransformedClip(ctx, fromClip, fromSourceTime, fromClip.duration, -w / 2, -h / 2, w, h, mediaCache);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(0.85 + p * 0.15, 0.85 + p * 0.15);
      drawTransformedClip(ctx, toClip, toSourceTime, 0, -w / 2, -h / 2, w, h, mediaCache);
      ctx.restore();
      break;
    }
    case 'wipe': {
      drawTransformedClip(ctx, fromClip, fromSourceTime, fromClip.duration, x, y, w, h, mediaCache);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w * p, h);
      ctx.clip();
      drawTransformedClip(ctx, toClip, toSourceTime, 0, x, y, w, h, mediaCache);
      ctx.restore();
      break;
    }
  }
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: BackgroundConfig,
  state: ProjectState,
  currentTime: number,
  mediaCache: MediaElementCache,
) {
  if (bg.mode === 'color') {
    ctx.fillStyle = bg.value || '#000000';
    ctx.fillRect(0, 0, w, h);
  } else if (bg.mode === 'gradient') {
    const [c1, c2] = (bg.value || '#0f2027,#2c5364').split(',');
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, c1);
    grd.addColorStop(1, c2 || c1);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  } else if (bg.mode === 'blur') {
    const active = getActiveClipAtTime(state.clips, currentTime);
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(0, 0, w, h);
    if (active) {
      ctx.save();
      ctx.filter = `blur(${Math.max(8, bg.blurAmount)}px) brightness(72%)`;
      drawClipSource(ctx, active.clip, active.sourceTime, -20, -20, w + 40, h + 40, mediaCache);
      ctx.restore();
    }
  } else {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
  }
}

function drawClipSource(
  ctx: CanvasRenderingContext2D,
  clip: VideoClip,
  sourceTime: number,
  x: number,
  y: number,
  w: number,
  h: number,
  mediaCache: MediaElementCache,
) {
  if (clip.type === 'demo') {
    ctx.save();
    ctx.translate(x, y);
    drawDemoClipFrame(ctx, w, h, clip.demoVariant, sourceTime);
    ctx.restore();
    return;
  }

  if (clip.type === 'image' && clip.srcUrl) {
    let img = mediaCache.images.get(clip.srcUrl);
    if (!img) {
      img = new Image();
      img.src = clip.srcUrl;
      mediaCache.images.set(clip.srcUrl, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      drawCoverImage(ctx, img, img.naturalWidth, img.naturalHeight, x, y, w, h);
      return;
    }
  }

  if (clip.type === 'video' && clip.srcUrl) {
    let vid = mediaCache.videos.get(clip.srcUrl);
    if (!vid) {
      vid = document.createElement('video');
      vid.src = clip.srcUrl;
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'auto';
      mediaCache.videos.set(clip.srcUrl, vid);
    }
    if (vid.readyState >= 2 && vid.videoWidth > 0) {
      if (Math.abs(vid.currentTime - sourceTime) > 0.12 && !vid.seeking) {
        vid.currentTime = Math.min(vid.duration || sourceTime, Math.max(0, sourceTime));
      }
      drawCoverImage(ctx, vid, vid.videoWidth, vid.videoHeight, x, y, w, h);
      return;
    }
  }

  // Placeholder while image/video decodes
  ctx.fillStyle = '#181c20';
  ctx.fillRect(x, y, w, h);
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const srcRatio = srcW / srcH;
  const dstRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;
  if (srcRatio > dstRatio) {
    sw = srcH * dstRatio;
    sx = (srcW - sw) / 2;
  } else {
    sh = srcW / dstRatio;
    sy = (srcH - sh) / 2;
  }
  ctx.drawImage(source, sx, sy, sw, sh, x, y, w, h);
}

function drawOverlayItem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ov: OverlayItem,
  time: number,
  mediaCache: MediaElementCache,
) {
  ctx.save();
  ctx.globalAlpha = ov.opacity / 100;

  if (ov.srcUrl) {
    let img = mediaCache.images.get(ov.srcUrl);
    if (!img) {
      img = new Image();
      img.src = ov.srcUrl;
      mediaCache.images.set(ov.srcUrl, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      const boxW = w * 0.36 * ov.scale;
      const boxH = boxW * (img.naturalHeight / img.naturalWidth);
      const cx = (ov.x / 100) * w - boxW / 2;
      const cy = (ov.y / 100) * h - boxH / 2;
      roundRectPath(ctx, cx, cy, boxW, boxH, 10);
      ctx.clip();
      ctx.drawImage(img, cx, cy, boxW, boxH);
      ctx.restore();
      return;
    }
  }

  if (ov.preset === 'rec') {
    const blink = Math.floor(time * 2) % 2 === 0;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRectPath(ctx, w * 0.04, h * 0.06, 98, 34, 8);
    ctx.fill();
    if (blink) {
      ctx.fillStyle = '#ff3b3b';
      ctx.beginPath();
      ctx.arc(w * 0.04 + 20, h * 0.06 + 17, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px Inter, monospace';
    ctx.fillText('REC', w * 0.04 + 34, h * 0.06 + 22);
  } else if (ov.preset === 'hud') {
    ctx.strokeStyle = 'rgba(0, 202, 224, 0.72)';
    ctx.lineWidth = 2;
    const m = 24;
    const len = 34;
    ctx.beginPath();
    ctx.moveTo(m, m + len); ctx.lineTo(m, m); ctx.lineTo(m + len, m);
    ctx.moveTo(w - m - len, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, m + len);
    ctx.moveTo(m, h - m - len); ctx.lineTo(m, h - m); ctx.lineTo(m + len, h - m);
    ctx.moveTo(w - m - len, h - m); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m, h - m - len);
    ctx.stroke();
  } else if (ov.preset === 'grid') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h);
    ctx.moveTo((2 * w) / 3, 0); ctx.lineTo((2 * w) / 3, h);
    ctx.moveTo(0, h / 3); ctx.lineTo(w, h / 3);
    ctx.moveTo(0, (2 * h) / 3); ctx.lineTo(w, (2 * h) / 3);
    ctx.stroke();
  } else if (ov.preset === 'frame') {
    ctx.fillStyle = '#000000';
    const barH = h * 0.11;
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);
  }

  ctx.restore();
}

function drawStickerItem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  st: StickerItem,
  localTime: number,
) {
  const motion = computeLayerMotion(st.animation, localTime, st.duration);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, motion.opacity));
  const cx = (st.x / 100) * w + motion.offsetX * w;
  const cy = (st.y / 100) * h + motion.offsetY * h;
  const size = Math.round(54 * st.scale * motion.scale * (w / 960));
  ctx.font = `${Math.max(18, size)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.fillText(st.glyph, cx, cy);
  ctx.restore();
}

function drawTextItem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  item: TextItem,
  localTime: number,
) {
  const motion = computeLayerMotion(item.animation, localTime, item.duration);
  const chars = Array.from(item.text);
  const visibleCount =
    item.animation === 'typewriter'
      ? Math.max(1, Math.round(chars.length * motion.visibleCharRatio))
      : chars.length;
  const visibleText = chars.slice(0, visibleCount).join('');

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, motion.opacity));
  const scale = w / 960;
  const fontSize = Math.max(16, Math.round(item.fontSize * scale * 1.45));
  ctx.font = `700 ${fontSize}px "IBM Plex Sans Arabic", Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = (item.x / 100) * w + motion.offsetX * w;
  const cy = (item.y / 100) * h + motion.offsetY * h;
  ctx.translate(cx, cy);
  if (motion.scale !== 1) {
    ctx.scale(motion.scale, motion.scale);
  }

  const metrics = ctx.measureText(visibleText);
  const padX = fontSize * 0.55;
  const padY = fontSize * 0.32;
  const boxW = metrics.width + padX * 2;
  const boxH = fontSize + padY * 2;

  if (item.stylePreset === 'box' || item.bgColor !== 'transparent') {
    ctx.fillStyle = item.stylePreset === 'box' ? 'rgba(0, 0, 0, 0.72)' : item.bgColor;
    roundRectPath(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 10 * scale);
    ctx.fill();
  } else if (item.stylePreset === 'cyan') {
    ctx.fillStyle = '#00CAE0';
    roundRectPath(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 10 * scale);
    ctx.fill();
  }

  if (item.stylePreset === 'outline') {
    ctx.lineWidth = Math.max(3, fontSize * 0.14);
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';
    ctx.strokeText(visibleText, 0, 0);
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetY = 2 * scale;
  }

  ctx.fillStyle =
    item.stylePreset === 'cyan'
      ? '#091418'
      : item.stylePreset === 'gold'
        ? '#FFD447'
        : item.color || '#FFFFFF';
  ctx.fillText(visibleText, 0, 0);
  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export const FILTER_PRESETS: Array<{ id: FilterId; label: string; swatch: string }> = [
  { id: 'original', label: 'أصلي', swatch: 'linear-gradient(135deg,#2a343b,#141a1f)' },
  { id: 'cinematic', label: 'سينمائي', swatch: 'linear-gradient(135deg,#26404a,#1a2229)' },
  { id: 'noir', label: 'ليلي', swatch: 'linear-gradient(135deg,#333333,#0a0a0a)' },
  { id: 'slate', label: 'بارد', swatch: 'linear-gradient(135deg,#3b5368,#16202a)' },
  { id: 'warm', label: 'دافئ', swatch: 'linear-gradient(135deg,#7c5432,#281c14)' },
  { id: 'retro', label: 'ريترو', swatch: 'linear-gradient(135deg,#766549,#29231b)' },
  { id: 'vivid', label: 'حيوي', swatch: 'linear-gradient(135deg,#00a6c0,#2d3b8c)' },
  { id: 'bw', label: 'أبيض وأسود', swatch: 'linear-gradient(135deg,#777777,#181818)' },
  { id: 'cyber', label: 'سايبر', swatch: 'linear-gradient(135deg,#00cae0,#591d78)' },
];
