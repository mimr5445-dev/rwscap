import { ExportSettings, ProjectState } from '../types/editor';
import {
  getAspectDimensions,
  getTotalDuration,
  MediaElementCache,
  renderCompositeFrame,
} from './demoRenderer';

export interface ExportResult {
  blobUrl: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

function getResolutionScale(res: ExportSettings['resolution']): number {
  switch (res) {
    case '480P':
      return 0.75;
    case '540P':
      return 0.85;
    case '720P':
      return 1.0;
    case '1080P':
      return 1.35;
    case '2K/4K':
      return 1.65;
  }
}

export async function exportProjectVideo(
  state: ProjectState,
  settings: ExportSettings,
  mediaCache: MediaElementCache,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ExportResult> {
  const base = getAspectDimensions(state.aspectRatio);
  const scale = getResolutionScale(settings.resolution);
  const width = Math.round((base.width * scale) / 2) * 2;
  const height = Math.round((base.height * scale) / 2) * 2;
  const totalDuration = getTotalDuration(state.clips);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('تعذر تهيئة محرك التصدير');
  }

  const supportsRecorder =
    typeof MediaRecorder !== 'undefined' && typeof canvas.captureStream === 'function';

  if (!supportsRecorder) {
    renderCompositeFrame(ctx, width, height, state, 0, mediaCache);
    onProgress(100);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png');
    });
    return {
      blobUrl: URL.createObjectURL(blob),
      filename: `rwscap-${settings.resolution.toLowerCase()}.png`,
      sizeBytes: blob.size,
      mimeType: 'image/png',
    };
  }

  const fps = Math.min(30, settings.fps);
  const stream = canvas.captureStream(fps);
  const mimeCandidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const bps =
    settings.bitrate === 'high' ? 6_000_000 : settings.bitrate === 'low' ? 1_800_000 : 3_500_000;

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bps,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const finishedPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('فشل التصدير'));
  });

  recorder.start(100);

  // Render faster-than-realtime safely while giving MediaRecorder frames
  const frameStep = 1 / fps;
  const totalFrames = Math.max(1, Math.ceil(totalDuration * fps));
  // Cap wall-clock export render time nicely around ~3–5 seconds for smooth UX
  const delayMs = Math.max(12, Math.min(32, Math.round(3600 / totalFrames)));

  for (let frame = 0; frame <= totalFrames; frame++) {
    if (signal?.aborted) {
      recorder.stop();
      throw new DOMException('Aborted', 'AbortError');
    }
    const t = Math.min(totalDuration, frame * frameStep);
    renderCompositeFrame(ctx, width, height, state, t, mediaCache);
    onProgress(Math.min(99, Math.round((frame / totalFrames) * 100)));
    await new Promise((r) => setTimeout(r, delayMs));
  }

  recorder.stop();
  const blob = await finishedPromise;
  onProgress(100);

  return {
    blobUrl: URL.createObjectURL(blob),
    filename: `rwscap-${settings.resolution.toLowerCase()}-${settings.fps}fps.webm`,
    sizeBytes: blob.size,
    mimeType,
  };
}
