import { AudioClip } from '../types/editor';

export function generateWaveformBars(seed: number, count = 48): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const v =
      0.25 +
      0.45 * Math.abs(Math.sin(i * 0.45 + seed * 2.1)) +
      0.25 * Math.abs(Math.cos(i * 1.15 + seed));
    bars.push(Math.min(1, Math.max(0.15, Number(v.toFixed(2)))));
  }
  return bars;
}

/** Computes a lightweight visual level [0..1] for the timeline audio meter */
export function getAudioMeterLevel(
  audioClips: AudioClip[],
  currentTime: number,
  mutedMain: boolean,
  isPlaying: boolean,
): number {
  if (!isPlaying || mutedMain || audioClips.length === 0) return 0;
  let peak = 0;
  for (const clip of audioClips) {
    if (currentTime < clip.startTime || currentTime > clip.startTime + clip.duration) continue;
    const local = currentTime - clip.startTime;
    const fadeIn = clip.fadeIn ?? 0;
    const fadeOut = clip.fadeOut ?? 0;
    let env = 1;
    if (fadeIn > 0 && local < fadeIn) env = Math.min(env, local / fadeIn);
    if (fadeOut > 0 && clip.duration - local < fadeOut) {
      env = Math.min(env, Math.max(0, clip.duration - local) / fadeOut);
    }
    const barIdx = Math.floor((local / Math.max(0.1, clip.duration)) * clip.waveform.length);
    const barVal = clip.waveform[Math.min(clip.waveform.length - 1, Math.max(0, barIdx))] ?? 0.4;
    peak = Math.max(peak, barVal * (clip.volume / 100) * env);
  }
  return Math.min(1, peak);
}

class TimelineAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: Array<AudioNode> = [];
  private htmlAudios: Map<string, HTMLAudioElement> = new Map();
  private timerId: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  stopAll() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // already stopped
      }
    }
    this.activeNodes = [];
    this.htmlAudios.forEach((audio) => {
      try {
        audio.pause();
      } catch {
        // ignore
      }
    });
  }

  startPlayback(audioClips: AudioClip[], startTime: number) {
    this.stopAll();
    if (audioClips.length === 0) return;

    const ctx = this.ensureContext();
    for (const clip of audioClips) {
      const end = clip.startTime + clip.duration;
      if (startTime >= end) continue;

      if (clip.sourceType === 'file' && clip.srcUrl) {
        let el = this.htmlAudios.get(clip.id);
        if (!el) {
          el = new Audio(clip.srcUrl);
          this.htmlAudios.set(clip.id, el);
        }
        el.volume = Math.min(1, Math.max(0, clip.volume / 100));
        const offset = Math.max(0, startTime - clip.startTime);
        el.currentTime = offset;
        el.play().catch(() => {});
      } else if (clip.sourceType === 'synth' && ctx) {
        this.scheduleSynthClip(ctx, ctx.destination, clip, startTime, this.activeNodes);
      }
    }
  }

  /**
   * Builds a live Web Audio MediaStream containing all timeline synth & audio tracks
   * with proper fade-in / fade-out envelopes so exported WebM files include real audio!
   */
  createExportAudioStream(
    audioClips: AudioClip[],
    mutedMain: boolean,
  ): { stream: MediaStream | null; stop: () => void } {
    if (mutedMain || audioClips.length === 0 || typeof window === 'undefined') {
      return { stream: null, stop: () => {} };
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return { stream: null, stop: () => {} };

    try {
      const exportCtx = new AC();
      const dest = exportCtx.createMediaStreamDestination();
      const nodes: AudioNode[] = [];
      const elements: HTMLAudioElement[] = [];

      for (const clip of audioClips) {
        if (clip.sourceType === 'synth') {
          this.scheduleSynthClip(exportCtx, dest, clip, 0, nodes);
        } else if (clip.sourceType === 'file' && clip.srcUrl) {
          const el = new Audio(clip.srcUrl);
          el.crossOrigin = 'anonymous';
          el.volume = Math.min(1, Math.max(0, clip.volume / 100));
          try {
            const srcNode = exportCtx.createMediaElementSource(el);
            srcNode.connect(dest);
            nodes.push(srcNode);
          } catch {
            // fallback if browser blocks media element routing
          }
          el.currentTime = 0;
          el.play().catch(() => {});
          elements.push(el);
        }
      }

      const stop = () => {
        for (const n of nodes) {
          try {
            if ('stop' in n && typeof (n as OscillatorNode).stop === 'function') {
              (n as OscillatorNode).stop();
            }
            n.disconnect();
          } catch {
            // ignore
          }
        }
        elements.forEach((el) => {
          try {
            el.pause();
          } catch {
            // ignore
          }
        });
        exportCtx.close().catch(() => {});
      };

      return { stream: dest.stream, stop };
    } catch {
      return { stream: null, stop: () => {} };
    }
  }

  private scheduleSynthClip(
    ctx: AudioContext,
    destination: AudioNode,
    clip: AudioClip,
    timelineStartTime: number,
    bucket: AudioNode[],
  ) {
    const preset = clip.synthPreset || 'cinematic';
    const gainLevel = clip.volume / 100;
    const peakGain = Math.min(0.28, Math.max(0.02, gainLevel * 0.14));

    const now = ctx.currentTime;
    const delay = Math.max(0, clip.startTime - timelineStartTime);
    const offsetInClip = Math.max(0, timelineStartTime - clip.startTime);
    const remaining = Math.max(0.1, clip.duration - offsetInClip);
    const startAt = now + delay;
    const endAt = startAt + remaining;

    const fadeIn = Math.min(clip.fadeIn ?? 0, remaining * 0.45);
    const fadeOut = Math.min(clip.fadeOut ?? 0, remaining * 0.45);

    const master = ctx.createGain();
    if (fadeIn > 0 && offsetInClip < fadeIn) {
      master.gain.setValueAtTime(0.001, startAt);
      master.gain.linearRampToValueAtTime(peakGain, startAt + (fadeIn - offsetInClip));
    } else {
      master.gain.setValueAtTime(peakGain, startAt);
    }

    if (fadeOut > 0) {
      const fadeOutStart = Math.max(startAt, endAt - fadeOut);
      master.gain.setValueAtTime(peakGain, fadeOutStart);
      master.gain.linearRampToValueAtTime(0.001, endAt);
    }

    master.connect(destination);
    bucket.push(master);

    const freqs =
      preset === 'cinematic'
        ? [110, 164.81, 220]
        : preset === 'ambient'
          ? [130.81, 196, 261.63]
          : preset === 'lofi'
            ? [146.83, 220, 293.66]
            : [98, 146.83, 196];

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const oscGain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      filter.type = 'lowpass';
      filter.frequency.value = preset === 'pulse' ? 620 : 440;
      oscGain.gain.value = idx === 0 ? 0.55 : 0.28;

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(master);
      osc.start(startAt);
      osc.stop(endAt + 0.05);
      bucket.push(osc, filter, oscGain);
    });
  }
}

export const audioEngine = new TimelineAudioEngine();
