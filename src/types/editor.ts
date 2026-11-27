export type ResolutionId = '480P' | '540P' | '720P' | '1080P' | '2K/4K';

export type AspectRatioId = 'fit' | '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '2.35:1';

export type FilterId =
  | 'original'
  | 'cinematic'
  | 'noir'
  | 'slate'
  | 'warm'
  | 'retro'
  | 'vivid'
  | 'bw'
  | 'cyber';

export type TransitionId =
  | 'none'
  | 'fade'
  | 'dissolve'
  | 'slide-left'
  | 'slide-up'
  | 'zoom-in'
  | 'wipe';

export type ClipAnimationId =
  | 'none'
  | 'fade-in'
  | 'zoom-in'
  | 'slide-up'
  | 'ken-burns';

export type LayerAnimationId = 'none' | 'fade' | 'pop' | 'slide-up' | 'typewriter';

export type ActiveTool =
  | null
  | 'background'
  | 'aspect'
  | 'stickers'
  | 'adjust'
  | 'filters'
  | 'captions'
  | 'overlay'
  | 'text'
  | 'audio'
  | 'edit'
  | 'speed'
  | 'volume'
  | 'transform'
  | 'animation'
  | 'transition';

export interface ClipTransform {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  scale: number; // 0.5..2.0
  opacity: number; // 0..100
  offsetX: number; // -50..50 (% of canvas)
  offsetY: number; // -50..50 (% of canvas)
}

export interface ClipTransition {
  id: TransitionId;
  duration: number; // 0.2..1.5 seconds
}

export interface ClipAnimation {
  id: ClipAnimationId;
  duration: number; // 0.3..2.0 seconds
}

export interface VideoClip {
  id: string;
  type: 'demo' | 'video' | 'image';
  name: string;
  /** Seconds trimmed from the start of the underlying source */
  sourceStart: number;
  /** Effective duration on timeline in seconds */
  duration: number;
  /** Maximum available source duration (for video/demo) */
  maxDuration: number;
  speed: number;
  volume: number; // 0..200
  srcUrl?: string;
  demoVariant?: 'worldmap' | 'radar' | 'horizon';
  thumbnails: string[];
  /** Optional frozen frame data URL (when clip is a freeze-frame snapshot) */
  freezeFrameUrl?: string;
  /** Spatial transform (rotation, flip, scale, opacity, pan) */
  transform?: ClipTransform;
  /** Transition applied INTO the next clip after this clip */
  transitionOut?: ClipTransition;
  /** Entrance / Ken Burns motion animation */
  animation?: ClipAnimation;
}

export interface AudioClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  volume: number; // 0..200
  fadeIn?: number; // 0..3s
  fadeOut?: number; // 0..3s
  sourceType: 'file' | 'synth';
  synthPreset?: 'cinematic' | 'ambient' | 'pulse' | 'lofi';
  srcUrl?: string;
  waveform: number[];
}

export interface TextItem {
  id: string;
  text: string;
  startTime: number;
  duration: number;
  x: number; // 0..100 percentage of canvas width
  y: number; // 0..100 percentage of canvas height
  fontSize: number;
  color: string;
  bgColor: string;
  stylePreset: 'clean' | 'box' | 'cyan' | 'outline' | 'gold';
  animation?: LayerAnimationId;
  isCaption?: boolean;
}

export interface StickerItem {
  id: string;
  stickerId: string;
  label: string;
  glyph: string;
  startTime: number;
  duration: number;
  x: number;
  y: number;
  scale: number;
  animation?: Exclude<LayerAnimationId, 'typewriter'>;
}

export interface OverlayItem {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  x: number;
  y: number;
  scale: number;
  opacity: number; // 0..100
  srcUrl?: string;
  preset?: 'hud' | 'rec' | 'grid' | 'frame';
}

export interface Adjustments {
  brightness: number; // -50..50
  contrast: number; // -50..50
  saturation: number; // -50..50
  exposure: number; // -50..50
  sharpen: number; // 0..100
  temperature: number; // -50..50
  vignette: number; // 0..100
}

export interface FilterState {
  id: FilterId;
  intensity: number; // 0..100
}

export interface BackgroundConfig {
  mode: 'none' | 'color' | 'blur' | 'gradient';
  value: string;
  blurAmount: number;
}

export interface ExportSettings {
  resolution: ResolutionId;
  fps: 24 | 25 | 30 | 50 | 60;
  bitrate: 'low' | 'recommended' | 'high';
}

export interface ProjectState {
  clips: VideoClip[];
  audioClips: AudioClip[];
  textItems: TextItem[];
  stickers: StickerItem[];
  overlays: OverlayItem[];
  mutedMain: boolean;
  coverTime: number;
  customCoverUrl?: string;
  aspectRatio: AspectRatioId;
  background: BackgroundConfig;
  filter: FilterState;
  adjustments: Adjustments;
}

export const DEFAULT_CLIP_TRANSFORM: ClipTransform = {
  rotation: 0,
  flipH: false,
  flipV: false,
  scale: 1,
  opacity: 100,
  offsetX: 0,
  offsetY: 0,
};

export const DEFAULT_CLIP_TRANSITION: ClipTransition = {
  id: 'none',
  duration: 0.6,
};

export const DEFAULT_CLIP_ANIMATION: ClipAnimation = {
  id: 'none',
  duration: 0.7,
};

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  sharpen: 0,
  temperature: 0,
  vignette: 0,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  resolution: '540P',
  fps: 30,
  bitrate: 'recommended',
};
