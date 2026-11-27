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

class TimelineAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: Array<AudioNode> = [];
  private htmlAudios: Map<string, HTMLAudioElement> = new Map();
  private timerId: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
        this.startSynthPreset(ctx, clip.synthPreset || 'cinematic', clip.volume / 100);
      }
    }
  }

  private startSynthPreset(
    ctx: AudioContext,
    preset: NonNullable<AudioClip['synthPreset']>,
    gainLevel: number,
  ) {
    const master = ctx.createGain();
    master.gain.value = Math.min(0.28, Math.max(0.02, gainLevel * 0.14));
    master.connect(ctx.destination);
    this.activeNodes.push(master);

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
      osc.start();
      this.activeNodes.push(osc, filter, oscGain);
    });
  }
}

export const audioEngine = new TimelineAudioEngine();
