import type { SoundDef, SoundNode } from './types';

export const SOUNDS: SoundDef[] = [
  { id: 'rain',   name: 'Rain',        icon: '🌧', desc: 'Gentle rainfall'   },
  { id: 'brown',  name: 'Brown Noise', icon: '📻', desc: 'Deep rumble'       },
  { id: 'forest', name: 'Forest',      icon: '🌲', desc: 'Birds & breeze'    },
  { id: 'cafe',   name: 'Café',        icon: '☕', desc: 'Ambient chatter'   },
  { id: 'ocean',  name: 'Ocean',       icon: '🌊', desc: 'Rolling waves'     },
  { id: 'fire',   name: 'Fireplace',   icon: '🔥', desc: 'Crackling flames'  },
];

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Per-track state
const trackNodes: Record<string, { nodes: AudioNode[]; gain: GainNode }> = {};
const trackVols: Record<string, number> = {};
SOUNDS.forEach(s => { trackVols[s.id] = 0.8; });

let masterVol  = 0.7;
let fadeMinutes = 0;
let fadeTimer  = 0;

// Callback so the UI can re-render when track state changes
let onTrackChange: (() => void) | null = null;
export function setTrackChangeHandler(fn: () => void) { onTrackChange = fn; }

function ensureCtx() {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = masterVol;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

const makeNoiseBuf = (size: number, fn: (d: Float32Array) => void): AudioBufferSourceNode => {
  const buf = ctx!.createBuffer(1, size, ctx!.sampleRate);
  fn(buf.getChannelData(0));
  const src = ctx!.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
};

// ── Sound makers ──────────────────────────────────────────────────────
const MAKERS: Record<string, () => { out: AudioNode; nodes: AudioNode[] }> = {
  rain() {
    const src = makeNoiseBuf(ctx!.sampleRate * 2, d => {
      let l = 0;
      for (let i = 0; i < d.length; i++) { l = .99 * l + .01 * (Math.random() * 2 - 1); d[i] = l * 15; }
    });
    const f = ctx!.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = .5;
    src.connect(f);
    return { out: f, nodes: [src] };
  },
  brown() {
    const src = makeNoiseBuf(ctx!.sampleRate * 4, d => {
      let l = 0;
      for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }
    });
    return { out: src, nodes: [src] };
  },
  forest() {
    const src = makeNoiseBuf(ctx!.sampleRate * 2, d => {
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .04;
    });
    const f = ctx!.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 2;
    const g = ctx!.createGain(); g.gain.value = .3;
    src.connect(f); f.connect(g);
    const oscs: OscillatorNode[] = [];
    [880, 1320, 1760, 2200].forEach((fr, i) => {
      const o = ctx!.createOscillator(); const og = ctx!.createGain();
      o.type = 'sine'; o.frequency.value = fr; og.gain.value = .015 / (i + 1);
      o.connect(og); og.connect(masterGain!); o.start(); oscs.push(o);
    });
    return { out: g, nodes: [src, ...oscs] };
  },
  cafe() {
    const merger = ctx!.createGain(); merger.gain.value = 1;
    const nodes: AudioNode[] = [];
    for (let i = 0; i < 6; i++) {
      const src = makeNoiseBuf(ctx!.sampleRate * 2, d => { for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1; });
      const f = ctx!.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400 + i * 120; f.Q.value = 1.5;
      const g = ctx!.createGain(); g.gain.value = .012 / (i + 1);
      src.connect(f); f.connect(g); g.connect(merger);
      src.start(0, i * .5); nodes.push(src);
    }
    return { out: merger, nodes };
  },
  ocean() {
    const sr = ctx!.sampleRate;
    const src = makeNoiseBuf(sr * 4, d => {
      let l = 0; const per = sr * 4;
      for (let i = 0; i < d.length; i++) { l = .999 * l + .001 * (Math.random() * 2 - 1); d[i] = l * 8 * (Math.sin(i / per * Math.PI * 2) * .5 + .5); }
    });
    const f = ctx!.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
    src.connect(f);
    return { out: f, nodes: [src] };
  },
  fire() {
    const r = makeNoiseBuf(ctx!.sampleRate * 2, d => {
      let l = 0;
      for (let i = 0; i < d.length; i++) { l = .99 * l + .01 * (Math.random() * 2 - 1); d[i] = l * 12; }
    });
    const f1 = ctx!.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 200;
    const f2 = ctx!.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 100; f2.gain.value = 8;
    r.connect(f1); f1.connect(f2);
    const cr = makeNoiseBuf(ctx!.sampleRate, d => {
      for (let i = 0; i < d.length; i++) { const x = Math.random(); d[i] = x > .998 ? (Math.random() * 2 - 1) * 4 : 0; }
    });
    const cg = ctx!.createGain(); cg.gain.value = .8; cr.connect(cg);
    const mg = ctx!.createGain(); mg.gain.value = 1;
    f2.connect(mg); cg.connect(mg);
    return { out: mg, nodes: [r, cr] };
  },
};

// ── Public API ────────────────────────────────────────────────────────
export function playTrack(id: string) {
  if (trackNodes[id]) return;
  ensureCtx();
  const made = MAKERS[id]();
  const g = ctx!.createGain(); g.gain.value = trackVols[id] ?? .8;
  made.out.connect(g); g.connect(masterGain!);
  made.nodes.forEach(n => { if ('start' in n && typeof (n as AudioScheduledSourceNode).start === 'function' && !(n as any)._started) { (n as AudioScheduledSourceNode).start(); (n as any)._started = true; } });
  trackNodes[id] = { nodes: made.nodes, gain: g };
  onTrackChange?.();
  if (fadeMinutes > 0) { clearTimeout(fadeTimer); fadeTimer = window.setTimeout(fadeAll, fadeMinutes * 60_000); }
}

export function stopTrack(id: string) {
  if (!trackNodes[id]) return;
  const t = trackNodes[id];
  t.nodes.forEach(n => { try { (n as AudioScheduledSourceNode).stop(); } catch {} try { n.disconnect(); } catch {} });
  try { t.gain.disconnect(); } catch {}
  delete trackNodes[id];
  onTrackChange?.();
}

export function toggleTrack(id: string) { trackNodes[id] ? stopTrack(id) : playTrack(id); }

export function isPlaying(id: string) { return !!trackNodes[id]; }

export function setTrackVolume(id: string, v: number) {
  trackVols[id] = v;
  if (trackNodes[id]) trackNodes[id].gain.gain.value = v;
}

export function getTrackVolume(id: string) { return trackVols[id] ?? .8; }

export function setMasterVolume(v: number) { masterVol = v; if (masterGain) masterGain.gain.value = v; }
export function getMasterVolume() { return masterVol; }

export function setFade(v: number) { fadeMinutes = v; }

function fadeAll() {
  if (!masterGain) return;
  const start = masterGain.gain.value; let t = 0;
  const step = setInterval(() => {
    t += .05; masterGain!.gain.value = Math.max(0, start * (1 - t));
    if (t >= 1) { SOUNDS.forEach(s => stopTrack(s.id)); clearInterval(step); }
  }, 100);
}

export function playChime() {
  ensureCtx();
  const ac = ctx!;
  ([[880, 0], [1100, 250]] as [number, number][]).forEach(([freq, delay]) => setTimeout(() => {
    const osc = ac.createOscillator(); const g = ac.createGain();
    osc.type = 'sine'; osc.frequency.value = freq; g.gain.value = 0.28;
    osc.connect(g); g.connect(ac.destination); osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2);
    setTimeout(() => { try { osc.stop(); } catch {} }, 1300);
  }, delay));
}

// Legacy single-track API kept for keyboard shortcut 'M' that just opens modal
export const currentId: string | null = null;
export function stop() { SOUNDS.forEach(s => stopTrack(s.id)); }
export function play(id: string) { playTrack(id); }
export function toggle(id: string) { toggleTrack(id); }
export function setVolume(v: number) { setMasterVolume(v); }
