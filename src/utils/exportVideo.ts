import { ExportSettings, ProjectState } from '../types/editor';
import { audioEngine } from './audioSynth';
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
  durationSec: number;
  hasAudio: boolean;
}

function getExportSize(aspectRatio: ProjectState['aspectRatio'], resolution: ExportSettings['resolution']) {
  const base = getAspectDimensions(aspectRatio);
  const scale = resolution === '2K/4K' ? 2 : resolution === '1080P' ? 1.5 : 1;
  return {
    width: Math.round((base.width * scale) / 2) * 2,
    height: Math.round((base.height * scale) / 2) * 2,
  };
}

export async function exportProjectVideo(
  state: ProjectState,
  settings: ExportSettings,
  mediaCache: MediaElementCache,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ExportResult> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('المتصفح الحالي لا يدعم تصدير الفيديو عبر MediaRecorder');
  }

  const { width, height } = getExportSize(state.aspectRatio, settings.resolution);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('تعذر تهيئة محرك الرسم للتصدير');

  const totalDuration = getTotalDuration(state.clips);
  const fps = settings.fps;

  // Combine canvas video stream with live Web Audio stream when audio tracks are active
  const videoStream = canvas.captureStream(fps);
  const audioMux = audioEngine.createExportAudioStream(state.audioClips, state.mutedMain);
  const hasAudio = Boolean(audioMux.stream && audioMux.stream.getAudioTracks().length > 0);

  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...(audioMux.stream ? audioMux.stream.getAudioTracks() : []),
  ]);

  const preferredMimes = hasAudio
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

  const mimeType = preferredMimes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  // Ensure image clips are decoded before recording
  await Promise.all(
    state.clips
      .filter((c) => c.type === 'image' && c.srcUrl && !mediaCache.images.has(c.srcUrl))
      .map(
        (c) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              mediaCache.images.set(c.srcUrl!, img);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = c.srcUrl!;
          }),
      ),
  );

  return new Promise<ExportResult>((resolve, reject) => {
    const chunks: BlobPart[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond:
          settings.resolution === '2K/4K'
            ? 12_000_000
            : settings.resolution === '1080P'
              ? 6_000_000
              : 3_000_000,
      });
    } catch {
      recorder = new MediaRecorder(combinedStream);
    }

    const cleanupMedia = () => {
      audioMux.stop();
      videoStream.getTracks().forEach((t) => t.stop());
    };

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    recorder.onerror = () => {
      cleanupMedia();
      reject(new Error('حدث خطأ أثناء تسجيل الفيديو'));
    };

    recorder.onstop = () => {
      cleanupMedia();
      if (signal?.aborted) {
        reject(new DOMException('تم إلغاء التصدير', 'AbortError'));
        return;
      }
      const blob = new Blob(chunks, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      resolve({
        blobUrl,
        filename: `RWSCap-${settings.resolution}-${settings.fps}fps-${stamp}.webm`,
        sizeBytes: blob.size,
        durationSec: totalDuration,
        hasAudio,
      });
    };

    recorder.start(200);
    const startWall = performance.now();

    const step = (now: number) => {
      if (signal?.aborted) {
        if (recorder.state !== 'inactive') recorder.stop();
        cleanupMedia();
        return;
      }

      const elapsedSec = (now - startWall) / 1000;
      const t = Math.min(totalDuration, elapsedSec);

      renderCompositeFrame(ctx, width, height, state, t, mediaCache);
      onProgress(Math.min(99, Math.round((t / totalDuration) * 100)));

      if (elapsedSec >= totalDuration) {
        onProgress(100);
        if (recorder.state !== 'inactive') recorder.stop();
        return;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}
