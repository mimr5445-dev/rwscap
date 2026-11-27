import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_EXPORT_SETTINGS,
  ExportSettings,
  ProjectState,
  VideoClip,
} from '../types/editor';

export const AUTOSAVE_STORAGE_KEY = 'rwscap-project-v2';

export interface PersistedProjectEnvelope {
  schemaVersion: 2;
  savedAt: string;
  project: ProjectState;
  exportSettings: ExportSettings;
}

function stripTransientBlobUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Transient blob: URLs cannot survive browser reload or cross-device JSON import
  if (url.startsWith('blob:')) return undefined;
  return url;
}

function sanitizeClipForPersistence(clip: VideoClip): VideoClip {
  const safeSrc = stripTransientBlobUrl(clip.srcUrl);
  const safeFreeze = stripTransientBlobUrl(clip.freezeFrameUrl);
  const safeThumbs = Array.isArray(clip.thumbnails)
    ? clip.thumbnails.filter((t) => typeof t === 'string' && !t.startsWith('blob:')).slice(0, 12)
    : [];

  return {
    ...clip,
    // If an uploaded video/image lost its transient blob URL, fall back safely to a demo clip
    type: !safeSrc && clip.type !== 'demo' ? 'demo' : clip.type,
    demoVariant: clip.demoVariant || (!safeSrc ? 'worldmap' : undefined),
    srcUrl: safeSrc,
    freezeFrameUrl: safeFreeze,
    thumbnails: safeThumbs,
  };
}

/** Serialize full project state + export settings into validated portable `.rwscap.json` */
export function serializeProjectJson(
  project: ProjectState,
  exportSettings: ExportSettings,
): string {
  const sanitizedProject: ProjectState = {
    ...project,
    customCoverUrl: stripTransientBlobUrl(project.customCoverUrl),
    clips: project.clips.map(sanitizeClipForPersistence),
    audioClips: project.audioClips.map((a) => ({
      ...a,
      srcUrl: stripTransientBlobUrl(a.srcUrl),
      sourceType: a.sourceType === 'file' && a.srcUrl?.startsWith('blob:') ? 'synth' : a.sourceType,
      synthPreset: a.synthPreset || 'cinematic',
    })),
    overlays: project.overlays.map((o) => ({
      ...o,
      srcUrl: stripTransientBlobUrl(o.srcUrl),
    })),
  };

  const envelope: PersistedProjectEnvelope = {
    schemaVersion: 2,
    savedAt: new Date().toISOString(),
    project: sanitizedProject,
    exportSettings,
  };

  return JSON.stringify(envelope, null, 2);
}

/** Safely parse and validate a persisted project JSON payload (senior-security hygiene) */
export function deserializeProjectJson(raw: string): {
  data: PersistedProjectEnvelope | null;
  error: string | null;
} {
  if (!raw || typeof raw !== 'string' || raw.length > 5_000_000) {
    return { data: null, error: 'ملف المشروع فارغ أو يتجاوز الحد المسموح' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { data: null, error: 'تنسيق ملف المشروع غير صالح (JSON غير سليم)' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { data: null, error: 'بنية ملف المشروع غير صالحة' };
  }

  const obj = parsed as Partial<PersistedProjectEnvelope>;
  const proj = obj.project;
  if (!proj || typeof proj !== 'object' || !Array.isArray(proj.clips) || proj.clips.length === 0) {
    return { data: null, error: 'ملف المشروع لا يحتوي على مقاطع فيديو صالحة' };
  }

  const ALLOWED_RATIOS = new Set(['16:9', '9:16', '1:1', '4:3', '3:4', '2.35:1']);
  const ALLOWED_BG_MODES = new Set(['none', 'color', 'gradient', 'blur']);
  const ALLOWED_FILTERS = new Set([
    'original', 'cinematic', 'noir', 'slate', 'warm', 'retro', 'vivid', 'bw', 'cyber',
  ]);

  const validClips: VideoClip[] = proj.clips
    .slice(0, 60)
    .filter(
      (c): c is VideoClip =>
        Boolean(
          c &&
            typeof c.id === 'string' &&
            c.id.length > 0 &&
            typeof c.duration === 'number' &&
            Number.isFinite(c.duration) &&
            c.duration > 0,
        ),
    )
    .map((c) => {
      const sanitized = sanitizeClipForPersistence(c);
      return {
        ...sanitized,
        duration: Math.min(300, Math.max(0.5, Number(sanitized.duration.toFixed(2)))),
        maxDuration: Number.isFinite(sanitized.maxDuration)
          ? Math.min(600, Math.max(1, sanitized.maxDuration))
          : 30,
        sourceStart: Number.isFinite(sanitized.sourceStart)
          ? Math.max(0, sanitized.sourceStart)
          : 0,
        speed: Number.isFinite(sanitized.speed)
          ? Math.min(4, Math.max(0.25, sanitized.speed))
          : 1,
        volume: Number.isFinite(sanitized.volume)
          ? Math.min(100, Math.max(0, Math.round(sanitized.volume)))
          : 100,
      };
    });

  if (validClips.length === 0) {
    return { data: null, error: 'تعذر استعادة مقاطع المشروع' };
  }

  const safeRatio =
    typeof proj.aspectRatio === 'string' && ALLOWED_RATIOS.has(proj.aspectRatio)
      ? proj.aspectRatio
      : '16:9';
  const safeBgMode =
    proj.background && typeof proj.background.mode === 'string' && ALLOWED_BG_MODES.has(proj.background.mode)
      ? proj.background.mode
      : 'none';
  const safeFilterId =
    proj.filter && typeof proj.filter.id === 'string' && ALLOWED_FILTERS.has(proj.filter.id)
      ? proj.filter.id
      : 'original';

  const hydratedProject: ProjectState = {
    clips: validClips,
    audioClips: Array.isArray(proj.audioClips) ? proj.audioClips.slice(0, 20) : [],
    textItems: Array.isArray(proj.textItems) ? proj.textItems.slice(0, 40) : [],
    stickers: Array.isArray(proj.stickers) ? proj.stickers.slice(0, 40) : [],
    overlays: Array.isArray(proj.overlays) ? proj.overlays.slice(0, 20) : [],
    mutedMain: Boolean(proj.mutedMain),
    coverTime: typeof proj.coverTime === 'number' && Number.isFinite(proj.coverTime) ? Math.max(0, proj.coverTime) : 0.4,
    customCoverUrl: stripTransientBlobUrl(proj.customCoverUrl),
    aspectRatio: safeRatio,
    background: {
      mode: safeBgMode,
      value: typeof proj.background?.value === 'string' ? proj.background.value : '#000000',
      blurAmount:
        typeof proj.background?.blurAmount === 'number' && Number.isFinite(proj.background.blurAmount)
          ? Math.min(40, Math.max(0, proj.background.blurAmount))
          : 18,
    },
    filter: {
      id: safeFilterId,
      intensity:
        typeof proj.filter?.intensity === 'number' && Number.isFinite(proj.filter.intensity)
          ? Math.min(100, Math.max(0, proj.filter.intensity))
          : 80,
    },
    adjustments: { ...DEFAULT_ADJUSTMENTS, ...(proj.adjustments || {}) },
  };

  const hydratedExport: ExportSettings = {
    ...DEFAULT_EXPORT_SETTINGS,
    ...(obj.exportSettings || {}),
  };

  return {
    data: {
      schemaVersion: 2,
      savedAt: typeof obj.savedAt === 'string' ? obj.savedAt : new Date().toISOString(),
      project: hydratedProject,
      exportSettings: hydratedExport,
    },
    error: null,
  };
}

export function saveProjectToLocalStorage(
  project: ProjectState,
  exportSettings: ExportSettings,
): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(AUTOSAVE_STORAGE_KEY, serializeProjectJson(project, exportSettings));
    return true;
  } catch {
    return false;
  }
}

export function loadProjectFromLocalStorage(): PersistedProjectEnvelope | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return null;
    const { data } = deserializeProjectJson(raw);
    return data;
  } catch {
    return null;
  }
}

export function clearProjectLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
