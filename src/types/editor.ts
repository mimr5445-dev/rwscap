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
  | 'volume';

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
}

export interface AudioClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  volume: number; // 0..200
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
