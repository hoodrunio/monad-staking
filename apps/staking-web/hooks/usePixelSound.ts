'use client';

import { useCallback, useRef } from 'react';

type PixelSound = 'coin' | 'chest' | 'chain';

type ToneStep = {
  readonly time: number;
  readonly frequency: number;
  readonly duration: number;
  readonly type?: OscillatorType;
};

type NoiseStep = {
  readonly time: number;
  readonly duration: number;
};

const COIN_SEQUENCE: readonly ToneStep[] = [
  { time: 0, frequency: 1046.5, duration: 0.08 },
  { time: 0.08, frequency: 1567.9, duration: 0.06 },
  { time: 0.14, frequency: 2093, duration: 0.08 },
];

const CHEST_SEQUENCE: readonly ToneStep[] = [
  { time: 0, frequency: 523.3, duration: 0.12, type: 'triangle' },
  { time: 0.12, frequency: 659.3, duration: 0.12, type: 'triangle' },
  { time: 0.24, frequency: 783.9, duration: 0.16, type: 'sine' },
  { time: 0.4, frequency: 987.8, duration: 0.2, type: 'sine' },
];

const CHAIN_SEQUENCE: readonly ToneStep[] = [
  { time: 0, frequency: 220, duration: 0.12, type: 'square' },
  { time: 0.12, frequency: 196, duration: 0.12, type: 'square' },
  { time: 0.24, frequency: 174.6, duration: 0.16, type: 'square' },
];

const CHAIN_NOISE: readonly NoiseStep[] = [
  { time: 0, duration: 0.18 },
];

function ensureContext(contextRef: React.MutableRefObject<AudioContext | null>) {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!contextRef.current) {
    contextRef.current = new AudioCtx();
  }
  return contextRef.current;
}

function scheduleTone(ctx: AudioContext, baseTime: number, step: ToneStep) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = step.type ?? 'square';
  oscillator.frequency.setValueAtTime(step.frequency, baseTime + step.time);

  gain.gain.setValueAtTime(0, baseTime + step.time);
  gain.gain.linearRampToValueAtTime(0.2, baseTime + step.time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, baseTime + step.time + step.duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(baseTime + step.time);
  oscillator.stop(baseTime + step.time + step.duration + 0.05);
}

function scheduleNoise(ctx: AudioContext, baseTime: number, step: NoiseStep) {
  const bufferSize = ctx.sampleRate * step.duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, baseTime + step.time);
  gain.gain.linearRampToValueAtTime(0.0001, baseTime + step.time + step.duration);
  noise.connect(gain);
  gain.connect(ctx.destination);
  noise.start(baseTime + step.time);
  noise.stop(baseTime + step.time + step.duration);
}

export function usePixelSound() {
  const contextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: PixelSound) => {
    const ctx = ensureContext(contextRef);
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    switch (type) {
      case 'coin':
        COIN_SEQUENCE.forEach((step) => scheduleTone(ctx, now, step));
        break;
      case 'chest':
        CHEST_SEQUENCE.forEach((step) => scheduleTone(ctx, now, step));
        break;
      case 'chain':
        CHAIN_SEQUENCE.forEach((step) => scheduleTone(ctx, now, step));
        CHAIN_NOISE.forEach((step) => scheduleNoise(ctx, now, step));
        break;
      default:
        break;
    }
  }, []);

  return playSound;
}

export type { PixelSound };
