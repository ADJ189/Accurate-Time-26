import type { SoundDef, SoundNode } from './types';

export const SOUNDS: SoundDef[] = [
  { id: 'rain',   name: 'Rain',        icon: '🌧' },
  { id: 'brown',  name: 'Brown Noise', icon: '📻' },
  { id: 'forest', name: 'Forest',      icon: '🌲' },
  { id: 'cafe',   name: 'Café',        icon: '☕' },
  { id: 'ocean',  name: 'Ocean',       icon: '🌊' },
  { id: 'fire',   name: 'Fireplace',   icon: '🔥' },
];

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentNode: SoundNode | null = null;
export let currentId: string | null = null;
let volume = 0.4;
let fadeMinutes = 0;
let fadeTimer = 0;

function ensureCtx() {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

const makeNoise = (size: number, filter: (buf: Float32Array) => void): AudioBufferSourceNode => {
  const buf = ctx!.createBuffer(1, size, ctx!.sampleRate);
  filter(buf.getChannelData(0));
  const src = ctx!.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
};

function makeRain(): SoundNode {
  const src = makeNoise(ctx!.sampleRate * 2, d => {
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = 0.99 * last + 0.01 * (Math.random() * 2 - 1); d[i] = last * 15; }
  });
  const f = ctx!.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.5;
  src.connect(f); f.connect(masterGain!); src.start();
  return { stop: () => { try { src.stop(); } catch {} } };
}

function makeBrownNoise(): SoundNode {
  const src = makeNoise(ctx!.sampleRate * 4, d => {
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  });
  src.connect(masterGain!); src.start();
  return { stop: () => { try { src.stop(); } catch {} } };
}

function makeForest(): SoundNode {
  const oscs: OscillatorNode[] = [];
  const freqs = [880, 1320, 1760, 2200];
  freqs.forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const g = ctx!.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    g.gain.value = 0.02 / (i + 1);
    osc.connect(g); g.connect(masterGain!); osc.start();
    oscs.push(osc);
  });
  const src = makeNoise(ctx!.sampleRate * 2, d => {
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.04;
  });
  const f = ctx!.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 2;
  const g2 = ctx!.createGain(); g2.gain.value = 0.3;
  src.connect(f); f.connect(g2); g2.connect(masterGain!); src.start();
  return { stop: () => { oscs.forEach(o => { try { o.stop(); } catch {} }); try { src.stop(); } catch {} } };
}

function makeCafe(): SoundNode {
  const nodes: AudioBufferSourceNode[] = [];
  for (let i = 0; i < 6; i++) {
    const src = makeNoise(ctx!.sampleRate * 2, d => { for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1; });
    const f = ctx!.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400 + i * 120; f.Q.value = 1.5;
    const g = ctx!.createGain(); g.gain.value = 0.015 / (i + 1);
    src.connect(f); f.connect(g); g.connect(masterGain!); src.start(0, i * 0.5);
    nodes.push(src);
  }
  return { stop: () => nodes.forEach(n => { try { n.stop(); } catch {} }) };
}

function makeOcean(): SoundNode {
  const sr = ctx!.sampleRate;
  const src = makeNoise(sr * 4, d => {
    let last = 0;
    const period = sr * 4;
    for (let i = 0; i < d.length; i++) {
      last = 0.999 * last + 0.001 * (Math.random() * 2 - 1);
      const wave = Math.sin(i / period * Math.PI * 2) * 0.5 + 0.5;
      d[i] = last * 8 * wave;
    }
  });
  const f = ctx!.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
  src.connect(f); f.connect(masterGain!); src.start();
  return { stop: () => { try { src.stop(); } catch {} } };
}

function makeFire(): SoundNode {
  const rumble = makeNoise(ctx!.sampleRate * 2, d => {
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = 0.99 * last + 0.01 * (Math.random() * 2 - 1); d[i] = last * 12; }
  });
  const f1 = ctx!.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 200;
  const f2 = ctx!.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 100; f2.gain.value = 8;
  rumble.connect(f1); f1.connect(f2); f2.connect(masterGain!); rumble.start();

  const crackle = makeNoise(ctx!.sampleRate, d => {
    for (let i = 0; i < d.length; i++) { const r = Math.random(); d[i] = r > 0.998 ? (Math.random() * 2 - 1) * 4 : 0; }
  });
  const cg = ctx!.createGain(); cg.gain.value = 0.8;
  crackle.connect(cg); cg.connect(masterGain!); crackle.start();

  return { stop: () => { [rumble, crackle].forEach(n => { try { n.stop(); } catch {} }); } };
}

const MAKERS: Record<string, () => SoundNode> = { rain: makeRain, brown: makeBrownNoise, forest: makeForest, cafe: makeCafe, ocean: makeOcean, fire: makeFire };

function fadeOut() {
  if (!masterGain) return;
  const g = masterGain.gain;
  const start = g.value;
  let t = 0;
  const step = setInterval(() => {
    t += 0.05; g.value = Math.max(0, start * (1 - t));
    if (t >= 1) { stop(); clearInterval(step); }
  }, 100);
}

export function stop() {
  currentNode?.stop(); currentNode = null; currentId = null;
}

export function play(id: string) {
  stop(); ensureCtx();
  currentNode = MAKERS[id](); currentId = id;
  clearTimeout(fadeTimer);
  if (fadeMinutes > 0) fadeTimer = window.setTimeout(fadeOut, fadeMinutes * 60_000);
}

export function toggle(id: string) { currentId === id ? stop() : play(id); }

export function setVolume(v: number) {
  volume = v;
  if (masterGain) masterGain.gain.value = v;
}

export function setFade(v: number) { fadeMinutes = v; }

export function playChime() {
  ensureCtx();
  const audioCtx = ctx!;
  const play1 = (freq: number, delay: number) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq; g.gain.value = 0.3;
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      setTimeout(() => { try { osc.stop(); } catch {} }, 1300);
    }, delay);
  };
  play1(880, 0); play1(1100, 250);
}
