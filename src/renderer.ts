import type { Theme } from './types';
import { rnd, rndpm, easeIO, MAT_CHARS } from './utils';

// ── Particle pool (SoA Float32Array) ────────────────────────────────────
const PSTRIDE = 6; // x, y, vx, vy, size, alpha
const MAX_PARTICLES = 400;
let pool = new Float32Array(MAX_PARTICLES * PSTRIDE);
let poolN = 0;

export let W = 0, H = 0;
export let tick = 0;

const bgCanvas = document.getElementById('bgCanvas') as HTMLCanvasElement;
const tCanvas  = document.getElementById('transCanvas') as HTMLCanvasElement;
const c  = bgCanvas.getContext('2d')!;
const tc = tCanvas.getContext('2d')!;
let transitioning = false;

export function resize() {
  W = bgCanvas.width  = tCanvas.width  = window.innerWidth;
  H = bgCanvas.height = tCanvas.height = window.innerHeight;
}

// ── Particle initialisation ───────────────────────────────────────────
export function buildParticles(theme: Theme) {
  const bt = theme.bgType;
  poolN = bt === 'aurora' ? 280 : bt === 'matrix' || bt === 'strangerthings' ? 220 : 180;
  poolN = Math.min(poolN, MAX_PARTICLES);
  const p = pool;
  for (let i = 0; i < poolN; i++) {
    const o = i * PSTRIDE;
    p[o]   = rnd(W); p[o+1] = rnd(H);
    p[o+2] = rndpm(0.6); p[o+3] = rndpm(0.6);
    p[o+4] = rnd(2.5) + 0.5; p[o+5] = rnd(0.6) + 0.1;
  }
}

// ── Main draw dispatcher ──────────────────────────────────────────────
export function drawBg(dt: number, theme: Theme) {
  tick += dt;
  const bt = theme.bgType;
  const bg = theme.baseBg;
  const gr = c.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, bg[0]); gr.addColorStop(0.5, bg[1] ?? bg[0]); gr.addColorStop(1, bg[2] ?? bg[0]);
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  (DRAW[bt] ?? drawParticles)(dt, theme);
}

// ── Per-theme draw functions ──────────────────────────────────────────
const DRAW: Record<string, (dt: number, theme: Theme) => void> = {
  aurora(dt, t)  { drawAurora(t); drawParticles(dt, t); },
  sunrise(dt, t) { drawSunrise(t); drawParticles(dt, t); },
  forest(dt, t)  { drawForest(t); drawParticles(dt, t); },
  ocean(dt, t)   { drawOcean(t); drawParticles(dt, t); },
  candy(dt, t)   { drawCandy(t); drawParticles(dt, t); },
  nordic(dt, t)  { drawNordic(); },
  midnight(dt,t) { drawMidnight(t); drawParticles(dt, t); },
  lemon(dt, t)   { drawLemon(); },
  literary(dt,t) { drawLiterary(t); drawParticles(dt, t); },
  supernatural(dt,t){ drawMediaBg(t); drawSymbol('supernatural', t); },
  mentalist(dt,t)   { drawMediaBg(t); drawSymbol('mentalist', t); },
  sopranos(dt,t)    { drawMediaBg(t); drawSymbol('sopranos', t); },
  dark(dt,t)        { drawMediaBg(t); drawSymbol('dark', t); },
  breakingbad(dt,t) { drawMediaBg(t); drawSymbol('breakingbad', t); },
  strangerthings(dt,t){ drawMediaBg(t); drawParticles(dt, t); drawSymbol('strangerthings', t); },
  interstellar(dt,t){ drawMediaBg(t); drawSymbol('interstellar', t); },
  dune(dt,t)        { drawMediaBg(t); drawParticles(dt, t); drawSymbol('dune', t); },
  matrix(dt,t)      { drawMatrix(t); drawSymbol('matrix', t); },
  bladerunner(dt,t) { drawMediaBg(t); drawSymbol('bladerunner', t); },
  inception(dt,t)   { drawMediaBg(t); drawSymbol('inception', t); },
  godfather(dt,t)   { drawMediaBg(t); drawSymbol('godfather', t); },
  redbull(dt,t)     { drawF1Bg(t,'redbull'); },
  ferrari(dt,t)     { drawF1Bg(t,'ferrari'); },
  mercedes(dt,t)    { drawF1Bg(t,'mercedes'); },
  mclaren(dt,t)     { drawF1Bg(t,'mclaren'); },
  astonmartin(dt,t) { drawF1Bg(t,'astonmartin'); },
};

// ── Background animations ─────────────────────────────────────────────
function drawParticles(dt: number, t: Theme) {
  const p = pool;
  for (let i = 0; i < poolN; i++) {
    const o = i * PSTRIDE;
    p[o] += p[o+2]; p[o+1] += p[o+3];
    if (p[o] < -5) p[o] = W + 5; if (p[o] > W+5) p[o] = -5;
    if (p[o+1] < -5) p[o+1] = H + 5; if (p[o+1] > H+5) p[o+1] = -5;
    c.beginPath(); c.arc(p[o], p[o+1], p[o+4], 0, Math.PI*2);
    c.fillStyle = t.accent; c.globalAlpha = p[o+5] * 0.5; c.fill();
  }
  c.globalAlpha = 1;
}

function drawAurora(t: Theme) {
  const cols = t.bgColors as string[] ?? [t.accent, t.accent2];
  for (let i = 0; i < 4; i++) {
    const y = H * (0.15 + i * 0.18) + Math.sin(tick * 0.4 + i) * H * 0.06;
    const g = c.createLinearGradient(0, y - 80, 0, y + 80);
    g.addColorStop(0, 'transparent'); g.addColorStop(0.5, cols[i % cols.length] + '22'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.fillRect(0, y - 80, W, 160);
  }
}

function drawSunrise(t: Theme) {
  const cy = H * 0.65;
  const g = c.createRadialGradient(W/2, cy, 0, W/2, cy, W * 0.7);
  g.addColorStop(0, t.accent + '44'); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

function drawForest(t: Theme) {
  const breath = 0.04 + 0.02 * Math.sin(tick * 0.3);
  const g = c.createRadialGradient(W/2, 0, 0, W/2, 0, H);
  g.addColorStop(0, t.accent + Math.round(breath * 255).toString(16).padStart(2,'0'));
  g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

function drawOcean(t: Theme) {
  const waves = 3;
  for (let w = 0; w < waves; w++) {
    c.beginPath();
    const yBase = H * (0.6 + w * 0.1);
    c.moveTo(0, yBase);
    for (let x = 0; x <= W; x += 4) {
      c.lineTo(x, yBase + Math.sin(x * 0.008 + tick * (0.8 + w * 0.2)) * 18);
    }
    c.lineTo(W, H); c.lineTo(0, H); c.closePath();
    c.fillStyle = t.accent + (w === 0 ? '18' : w === 1 ? '0e' : '08');
    c.fill();
  }
}

function drawCandy(t: Theme) {
  const g = c.createRadialGradient(W*0.3, H*0.3, 0, W*0.5, H*0.5, W*0.7);
  g.addColorStop(0, t.accent + '22'); g.addColorStop(0.5, t.accent2 + '11'); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

function drawNordic() { /* clean white/grey — baseBg is enough */ }
function drawLemon()  { /* yellow baseBg is enough */ }

function drawMidnight(t: Theme) {
  const g = c.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.6);
  g.addColorStop(0, t.accent + '18'); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

function drawLiterary(t: Theme) {
  const g = c.createRadialGradient(W/2, H*0.3, 0, W/2, H*0.5, W*0.6);
  g.addColorStop(0, t.accent + '14'); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

function drawMediaBg(t: Theme) {
  // Just a subtle radial accent vignette — overlay CSS handles the rest
  const g = c.createRadialGradient(W/2, H*0.5, 0, W/2, H*0.5, W*0.55);
  g.addColorStop(0, t.accent + '0a'); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

function drawMatrix(t: Theme) {
  c.fillStyle = 'rgba(0,10,0,0.06)';
  c.fillRect(0, 0, W, H);
  const cols = (W / 14) | 0;
  c.font = '13px monospace';
  for (let i = 0; i < poolN; i++) {
    const o = i * PSTRIDE;
    pool[o+1] += 3 + pool[o+4];
    if (pool[o+1] > H + 200) pool[o+1] = 0;
    const a = pool[o+5] * Math.min(1, tick);
    c.fillStyle = `rgba(0,230,0,${a})`; c.globalAlpha = a;
    c.fillText(MAT_CHARS[(Math.random() * MAT_CHARS.length) | 0], (i % cols) * 14, pool[o+1]);
  }
  c.globalAlpha = 1;
}

function drawF1Bg(t: Theme, teamId: string) {
  drawMediaBg(t);
  const fns: Record<string, () => void> = {
    redbull:     () => drawF1Streaks(t, 1),
    ferrari:     () => drawF1Streaks(t, 0.8),
    mercedes:    () => drawF1Streaks(t, 1),
    mclaren:     () => drawF1Streaks(t, 1.2),
    astonmartin: () => drawF1Streaks(t, 0.7),
  };
  fns[teamId]?.();
  drawF1Symbol(teamId);
}

function drawF1Streaks(t: Theme, speedMult: number) {
  const p = pool;
  for (let i = 0; i < poolN; i++) {
    const o = i * PSTRIDE;
    p[o] += p[o+2] * speedMult * 1.8;
    p[o+1] += p[o+3] * 0.3;
    if (p[o] > W + 20) { p[o] = -20; p[o+1] = rnd(H); }
    const len = p[o+4] * 22;
    const gr = c.createLinearGradient(p[o]-len, 0, p[o], 0);
    gr.addColorStop(0, 'transparent'); gr.addColorStop(1, t.accent);
    c.beginPath(); c.moveTo(p[o], p[o+1]); c.lineTo(p[o]-len, p[o+1]);
    c.strokeStyle = gr; c.globalAlpha = p[o+5]*0.5; c.lineWidth = p[o+4]*0.5; c.stroke();
  }
  c.globalAlpha = 1;
}

// ── Theme symbols ─────────────────────────────────────────────────────
function drawSymbol(id: string, t: Theme) {
  const fn = SYMBOLS[id];
  if (fn) fn(t);
}

const SYMBOLS: Record<string, (t: Theme) => void> = {
  supernatural(t) {
    const cx=W*.5,cy=H*.58,R=Math.min(W,H)*.16,breath=.042+.014*Math.sin(tick*.55);
    c.save(); c.translate(cx,cy);
    const h=c.createRadialGradient(0,0,R*.7,0,0,R*1.5);
    h.addColorStop(0,`rgba(200,60,0,${breath*.22})`); h.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=h; c.beginPath(); c.arc(0,0,R*1.5,0,Math.PI*2); c.fill();
    c.strokeStyle='rgba(180,40,0,1)'; c.lineWidth=1.4; c.globalAlpha=breath*1.1;
    c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.stroke();
    const pts=[...Array(5)].map((_,i)=>{const a=(i*2/5-.5)*Math.PI*2;return[Math.cos(a)*R,Math.sin(a)*R];});
    c.beginPath(); c.globalAlpha=breath; c.strokeStyle='rgba(200,45,0,1)'; c.lineWidth=1.1;
    [0,2,4,1,3,0].forEach((pi,i)=>i===0?c.moveTo(pts[pi][0],pts[pi][1]):c.lineTo(pts[pi][0],pts[pi][1]));
    c.stroke(); c.restore();
  },
  mentalist(t) {
    const cx=W*.5,cy=H*.52,R=Math.min(W,H)*.13,breath=.07+.022*Math.sin(tick*.5);
    c.save(); c.translate(cx,cy);
    c.strokeStyle='rgba(160,8,8,1)'; c.lineWidth=2.8; c.globalAlpha=breath*1.15;
    c.beginPath();
    for(let i=0;i<=60;i++){const a=(i/60)*Math.PI*2,w=1+.032*Math.sin(i*3.7+tick*.08),px=Math.cos(a)*R*w,py=Math.sin(a)*R*w;i===0?c.moveTo(px,py):c.lineTo(px,py);}
    c.closePath(); c.stroke(); c.restore();
  },
  dark(t) {
    const cx=W*.5,cy=H*.56,R=Math.min(W,H)*.14,breath=.038+.012*Math.sin(tick*.42);
    c.save(); c.translate(cx,cy); c.rotate(tick*.014);
    c.strokeStyle='rgba(68,136,204,1)'; c.lineWidth=1.5;
    for(let i=0;i<3;i++){const a=(i/3)*Math.PI*2-Math.PI/2,ox=Math.cos(a)*R*.5,oy=Math.sin(a)*R*.5;c.globalAlpha=breath*(1.4-i*.2);c.beginPath();c.arc(ox,oy,R,a+Math.PI*.42+Math.PI/2,a-Math.PI*.42+Math.PI/2+Math.PI*2);c.stroke();}
    c.restore();
  },
  breakingbad(t) {
    const cx=W*.5,cy=H*.56,R=Math.min(W,H)*.1,breath=.05+.016*Math.sin(tick*.55);
    c.save(); c.translate(cx,cy);
    [{sym:'Br',num:'35',wt:'79.9',x:-R*1.22},{sym:'Ba',num:'56',wt:'137.3',x:R*.12}].forEach(({sym,num,wt,x})=>{
      const hi=sym==='Br'?'#7ec800':'#b8f040'; c.save(); c.translate(x,0);
      c.strokeStyle=hi; c.lineWidth=1.1; c.globalAlpha=breath;
      c.strokeRect(-R*.55,-R*.65,R*1.1,R*1.3);
      c.font=`bold ${R*.72}px 'Bebas Neue',sans-serif`; c.textAlign='center'; c.textBaseline='middle';
      c.fillStyle=hi; c.globalAlpha=breath*1.1; c.fillText(sym,0,0); c.restore();
    });
    c.restore();
  },
  strangerthings(t) {
    const cx=W*.5,cy=H*.55,R=Math.min(W,H)*.13,openAmt=.45+.45*Math.sin(tick*.38),breath=.045+.013*Math.sin(tick*.65);
    c.save(); c.translate(cx,cy);
    for(let i=0;i<5;i++){const pa=(i/5)*Math.PI*2-Math.PI/2,ext=openAmt*R*.58,pw=R*(.36+openAmt*.08);
      c.save(); c.rotate(pa); c.beginPath(); c.moveTo(0,R*.12); c.bezierCurveTo(-pw*.7,R*.18+ext*.25,-pw*.55,R*.15+ext*.8,0,R*.18+ext); c.bezierCurveTo(pw*.55,R*.15+ext*.8,pw*.7,R*.18+ext*.25,0,R*.12); c.closePath();
      c.fillStyle=`rgba(60,0,100,${breath*1.4})`; c.fill(); c.restore();}
    c.restore();
  },
  interstellar(t) {
    const cx=W*.5,cy=H*.54,R=Math.min(W,H)*.15,breath=.032+.01*Math.sin(tick*.55);
    c.save(); c.translate(cx,cy);
    for(let l=3;l>=0;l--){const lr=R*(1+l*.18);c.beginPath();c.ellipse(0,0,lr,lr*.22,tick*.038+l*.15,0,Math.PI*2);c.strokeStyle='rgba(120,190,255,1)';c.globalAlpha=breath*[.12,.085,.055,.03][l]*20;c.lineWidth=l===0?3:l===1?1.8:1;c.stroke();}
    c.beginPath();c.arc(0,0,R*.52,0,Math.PI*2);c.fillStyle='rgba(0,0,0,1)';c.globalAlpha=.97;c.fill();
    c.restore();
  },
  dune(t) {
    const cx=W*.5,cy=H*.55,R=Math.min(W,H)*.1,breath=.04+.012*Math.sin(tick*.5),sb=.4+.6*Math.abs(Math.sin(tick*.18));
    c.save(); c.translate(cx,cy);
    [-R*.5,R*.5].forEach(ex=>{c.save();c.translate(ex,0);c.beginPath();c.ellipse(0,0,R*.38,R*.24,0,0,Math.PI*2);c.fillStyle=`rgba(${(180+sb*40)|0},${(160+sb*60)|0},${(80+sb*160)|0},1)`;c.globalAlpha=breath*1.1;c.fill();c.restore();});
    c.restore();
  },
  matrix(t) {
    const cx=W*.5,cy=H*.64,R=Math.min(W,H)*.044,fl=Math.sin(tick*.5)*R*.18,breath=.06+.018*Math.sin(tick*.6);
    c.save(); c.translate(cx,cy+fl);
    c.font=`bold ${Math.max(9,R*1.1)}px monospace`; c.fillStyle='rgba(0,230,0,1)'; c.textAlign='center'; c.textBaseline='bottom'; c.globalAlpha=breath*1.2;
    c.fillText('CHOOSE',0,-R*1.6);
    [[-.28,'rgba(190,15,15,1)',-2.1],[.28,'rgba(20,75,210,1)',2.1]].forEach(([rot,col,bx])=>{c.save();c.rotate(rot as number);c.beginPath();c.ellipse(bx as number,0,R*1.1,R*.44,0,0,Math.PI*2);c.fillStyle=col as string;c.globalAlpha=breath*1.1;c.fill();c.restore();});
    c.restore();
  },
  bladerunner(t) {
    const cx=W*.5,cy=H*.38,R=Math.min(W,H)*.1,blink=(tick*.14)%Math.PI,openness=Math.max(.05,Math.abs(Math.sin(blink))),breath=.042+.012*Math.sin(tick*.5);
    c.save(); c.translate(cx,cy); c.beginPath(); c.ellipse(0,0,R*1.9,R*openness*.7+R*.03,0,0,Math.PI*2);
    c.fillStyle='rgba(30,12,0,1)'; c.globalAlpha=.85; c.fill();
    c.strokeStyle='rgba(180,120,50,1)'; c.globalAlpha=breath*.9; c.lineWidth=1; c.stroke(); c.restore();
  },
  inception(t) {
    const cx=W*.5,cy=H*.57,R=Math.min(W,H)*.1,wobble=Math.sin(tick*.11)*.07,breath=.042+.012*Math.sin(tick*.65);
    c.save(); c.translate(cx,cy); c.rotate(wobble);
    const tw=R*.52,bw=R*.18,th=R*1.3;
    const bg=c.createLinearGradient(-tw,0,tw,0); bg.addColorStop(.5,`rgba(140,140,220,${breath*1.1})`);
    c.beginPath(); c.moveTo(-tw,-th*.45); c.lineTo(tw,-th*.45); c.lineTo(bw,th*.55); c.lineTo(-bw,th*.55); c.closePath();
    c.fillStyle=bg; c.globalAlpha=.82; c.fill();
    c.strokeStyle='rgba(160,160,230,1)'; c.globalAlpha=breath; c.lineWidth=.9; c.stroke(); c.restore();
  },
  godfather(t) {
    const cx=W*.42,cy=H*.6,R=Math.min(W,H)*.1,bloom=.55+.4*Math.sin(tick*.18),breath=.032+.01*Math.sin(tick*.4);
    c.save(); c.translate(cx,cy);
    for(let i=13;i>=0;i--){const fr=i/14,a=fr*Math.PI*2*2.5+tick*.035,pr=R*(.04+fr*.62*bloom),ps=R*(.1+fr*.28),px=Math.cos(a)*pr,py=Math.sin(a)*pr*.72;c.save();c.translate(px,py);c.rotate(a+.9);c.beginPath();c.ellipse(0,0,ps*.75,ps*.52,0,0,Math.PI*2);c.fillStyle=`rgba(${(80+fr*70)|0},3,8,1)`;c.globalAlpha=breath*(.55+fr*.35);c.fill();c.restore();}
    c.restore();
  },
  sopranos(t) {
    const cx=W*.5,cy=H*.5,R=Math.min(W,H)*.18,breath=.025+.008*Math.sin(tick*.3);
    c.save(); c.translate(cx,cy);
    const g=c.createRadialGradient(0,0,0,0,0,R); g.addColorStop(0,`rgba(120,88,0,${breath})`); g.addColorStop(1,'transparent');
    c.fillStyle=g; c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fill(); c.restore();
  },
};

// ── F1 animated symbol overlays ───────────────────────────────────────
function drawF1Symbol(teamId: string) {
  const fns: Record<string, () => void> = {
    redbull() {
      const cx=W*.5,cy=H*.52,R=Math.min(W,H)*.12,breath=.04+.012*Math.sin(tick*.6);
      c.save(); c.translate(cx,cy); c.strokeStyle='rgba(232,0,45,1)'; c.lineWidth=1.5; c.globalAlpha=breath*1.1;
      c.strokeRect(-R*.35,-R*.425,R*.7,R*.85);
      c.font=`bold ${R*.88}px 'Orbitron',monospace`; c.textAlign='center'; c.textBaseline='middle';
      c.fillStyle='rgba(232,0,45,1)'; c.globalAlpha=breath; c.fillText('1',0,0); c.restore();
    },
    ferrari() {
      const cx=W*.5,cy=H*.54,R=Math.min(W,H)*.13,breath=.042+.012*Math.sin(tick*.5);
      c.save(); c.translate(cx,cy);
      const msg='FORZA FERRARI'; c.font=`${Math.max(6,R*.16)}px 'Cinzel',serif`; c.fillStyle='rgba(255,237,0,1)'; c.textAlign='center'; c.textBaseline='middle';
      for(let i=0;i<msg.length;i++){const a=-Math.PI/2-.5+(i/msg.length)*Math.PI;c.save();c.translate(Math.cos(a)*R*1.35,Math.sin(a)*R*1.35);c.rotate(a+Math.PI/2);c.globalAlpha=breath*1.1;c.fillText(msg[i],0,0);c.restore();}
      c.restore();
    },
    mercedes() {
      const cx=W*.5,cy=H*.53,R=Math.min(W,H)*.13,breath=.038+.01*Math.sin(tick*.5);
      c.save(); c.translate(cx,cy); c.save(); c.rotate(tick*.02);
      c.strokeStyle='rgba(0,210,190,1)'; c.lineWidth=1.4; c.globalAlpha=breath*1.1;
      c.beginPath(); c.arc(0,0,R*.85,0,Math.PI*2); c.stroke();
      for(let i=0;i<3;i++){const a=(i/3)*Math.PI*2-Math.PI/2;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*R*.85,Math.sin(a)*R*.85);c.stroke();}
      c.restore(); c.restore();
    },
    mclaren() {
      const cx=W*.5,cy=H*.53,R=Math.min(W,H)*.13,breath=.042+.012*Math.sin(tick*.55);
      c.save(); c.translate(cx,cy); c.globalAlpha=breath*.9; c.strokeStyle='rgba(255,128,0,1)'; c.lineWidth=2;
      c.beginPath(); c.moveTo(-R*.9,R*.25); c.bezierCurveTo(-R*.6,-R*.35,0,-R*.7,R*.9,R*.25); c.stroke();
      c.restore();
    },
    astonmartin() {
      const cx=W*.5,cy=H*.53,R=Math.min(W,H)*.13,breath=.038+.01*Math.sin(tick*.5);
      c.save(); c.translate(cx,cy); c.strokeStyle='rgba(206,220,0,1)'; c.lineWidth=1.1;
      for(let i=0;i<5;i++){const y=-R*.12+i*R*.06;[[- R*.9+i*R*.05,-R*.22],[R*.9-i*R*.05,R*.22]].forEach(([x1,x2])=>{c.beginPath();c.moveTo(x1,y);c.quadraticCurveTo((x1+x2)/2,-R*.3,x2,-R*.05);c.globalAlpha=breath*(.9-i*.08);c.stroke();});}
      c.restore();
    },
  };
  fns[teamId]?.();
}

// ── Transitions ───────────────────────────────────────────────────────
export function runTransition(type: string, cb: () => void) {
  if (transitioning) { cb(); return; }
  transitioning = true;
  tCanvas.style.display = 'block';
  const fn = TRANS[type] ?? TRANS.defaultFade;
  fn(cb);
}

function finishTrans() {
  let f = 1;
  const step = () => {
    f -= 0.02; tc.clearRect(0, 0, W, H);
    if (f > 0) { tc.fillStyle = `rgba(0,0,0,${f})`; tc.fillRect(0,0,W,H); requestAnimationFrame(step); }
    else { tCanvas.style.display = 'none'; transitioning = false; }
  };
  requestAnimationFrame(step);
}

const TRANS: Record<string, (cb: () => void) => void> = {
  defaultFade(cb) {
    let p = 0, called = false;
    const go = () => { p += 0.015; tc.fillStyle=`rgba(0,0,0,${Math.min(1,p*1.5)})`; tc.fillRect(0,0,W,H); if(!called&&p>=.5){called=true;cb();} p<1?requestAnimationFrame(go):finishTrans(); };
    requestAnimationFrame(go);
  },
  fire(cb) {
    let p=0,called=false;
    const go=()=>{p+=.01;tc.clearRect(0,0,W,H);tc.fillStyle=`rgba(0,0,0,${Math.min(.88,p*1.4)})`;tc.fillRect(0,0,W,H);for(let x=0;x<W;x+=3){const h=(Math.sin(x*.017+p*3.5)*.5+.5)*(Math.sin(x*.034-p*2.5)*.5+.5)*Math.min(1,p*1.8)*H*.9;const gf=tc.createLinearGradient(0,H,0,H-h);gf.addColorStop(0,'rgba(255,120,0,.95)');gf.addColorStop(.3,'rgba(220,50,0,.8)');gf.addColorStop(1,'rgba(80,0,0,0)');tc.fillStyle=gf;tc.fillRect(x,H-h,3,h);}if(!called&&p>=.54){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  redblood(cb) {
    let p=0,called=false;const dr=[...Array(28)].map((_,i)=>({x:(i/28)*W+Math.sin(i*2.5)*20,spd:.5+rnd(.5),w:rnd(4)+2}));
    const go=()=>{p+=.009;tc.clearRect(0,0,W,H);tc.fillStyle=`rgba(0,0,0,${Math.min(.92,p*1.5)})`;tc.fillRect(0,0,W,H);dr.forEach(d=>{const drip=Math.min(H,p*d.spd*H*2.2);const gr=tc.createLinearGradient(0,0,0,drip);gr.addColorStop(0,'rgba(160,0,0,.95)');gr.addColorStop(1,'rgba(80,0,0,.25)');tc.fillStyle=gr;tc.fillRect(d.x,0,d.w,drip);});if(!called&&p>=.5){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  smoke(cb) {
    let p=0,called=false;const ws=[...Array(18)].map(()=>({x:rnd(W),y:rnd(H),r:rnd(60)+20,vx:rndpm(.3),vy:-(rnd(.4)+.1)}));
    const go=()=>{p+=.008;tc.clearRect(0,0,W,H);tc.fillStyle=`rgba(5,4,0,${Math.min(.96,p*1.35)})`;tc.fillRect(0,0,W,H);ws.forEach(w=>{w.x+=w.vx;w.y+=w.vy;w.r+=.45;const wg=tc.createRadialGradient(w.x,w.y,0,w.x,w.y,w.r);wg.addColorStop(0,`rgba(80,65,30,${Math.max(0,.07-p*.04)})`);wg.addColorStop(1,'transparent');tc.fillStyle=wg;tc.fillRect(0,0,W,H);});if(!called&&p>=.54){called=true;cb();}p<1.15?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  timeloop(cb) {
    let p=0,called=false;
    const go=()=>{p+=.009;tc.fillStyle='rgba(0,0,6,.1)';tc.fillRect(0,0,W,H);tc.save();tc.translate(W*.5,H*.5);const mx=Math.sqrt(W*W+H*H)*.55;for(let r=mx*(1-Math.min(1,p*1.8));r>4;r-=2.5){const a=r*.065+p*6;tc.beginPath();tc.arc(Math.cos(a)*r*.008,Math.sin(a)*r*.008,r,0,Math.PI*2);tc.strokeStyle=`hsla(${220+r*.1},70%,60%,.016)`;tc.lineWidth=1.2;tc.stroke();}tc.restore();if(!called&&p>=.52){called=true;cb();}p<1.15?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  chemical(cb) {
    let p=0,called=false;const bs=[...Array(20)].map(()=>({x:W*.5+rndpm(100),y:H*.5+rndpm(80),r:0,maxR:rnd(28)+8,spd:rnd(.02)+.01}));
    const go=()=>{p+=.01;tc.clearRect(0,0,W,H);const R=p*Math.sqrt(W*W+H*H)*.58;const cg=tc.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,R);cg.addColorStop(0,'rgba(0,0,0,.97)');cg.addColorStop(.88,`rgba(${(55*p)|0},${(175*p)|0},0,.5)`);cg.addColorStop(1,'rgba(0,0,0,0)');tc.fillStyle=cg;tc.fillRect(0,0,W,H);bs.forEach(b=>{b.r=Math.min(b.maxR,b.r+b.spd*R*.06);const bx=b.x+Math.cos(p*3+b.r)*R*.4,by=b.y+Math.sin(p*2+b.r)*R*.35;tc.beginPath();tc.arc(bx,by,b.r,0,Math.PI*2);tc.strokeStyle=`rgba(60,220,0,${Math.min(.7,p*1.5)})`;tc.lineWidth=1.5;tc.stroke();});if(!called&&p>=.52){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  updown(cb) {
    let p=0,called=false;
    const go=()=>{p+=.01;tc.clearRect(0,0,W,H);const slide=easeIO(Math.min(1,p*1.6))*H*.5;tc.fillStyle=`rgba(5,0,15,${Math.min(.97,p*1.5)})`;tc.fillRect(0,0,W,H*.5+slide);tc.fillRect(0,H-(H*.5+slide),W,H*.5+slide);if(!called&&p>=.52){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  warp(cb) {
    let p=0,called=false;const stars=[...Array(200)].map(()=>({a:rnd(Math.PI*2),d:rnd(Math.sqrt(W*W+H*H)*.5)}));
    const go=()=>{p+=.009;tc.fillStyle=`rgba(0,3,10,${.1+p*.08})`;tc.fillRect(0,0,W,H);tc.save();tc.translate(W*.5,H*.5);stars.forEach(s=>{const sp=easeIO(Math.min(1,p*1.5)),len=sp*42+2,d=s.d*(1-sp*.6);tc.beginPath();tc.moveTo(Math.cos(s.a)*(d-len),Math.sin(s.a)*(d-len));tc.lineTo(Math.cos(s.a)*d,Math.sin(s.a)*d);tc.strokeStyle=`rgba(150,210,255,${Math.min(1,p*2)*.8})`;tc.lineWidth=Math.max(.5,sp*2);tc.stroke();});tc.restore();if(!called&&p>=.52){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  sandstorm(cb) {
    let p=0,called=false;const gr=[...Array(300)].map(()=>({x:rnd(W),y:rnd(H),vx:3+rnd(5),vy:rndpm(.7),a:rnd(.4)+.1}));
    const go=()=>{p+=.009;tc.fillStyle=`rgba(20,12,0,${Math.min(.94,p*1.35)})`;tc.fillRect(0,0,W,H);gr.forEach(g=>{g.x+=g.vx*(1+p*2);g.y+=g.vy;if(g.x>W+5){g.x=-5;g.y=rnd(H);}tc.beginPath();tc.arc(g.x,g.y,.8,0,Math.PI*2);tc.fillStyle='rgba(200,155,60,1)';tc.globalAlpha=g.a*Math.min(1,p*2);tc.fill();tc.globalAlpha=1;});if(!called&&p>=.52){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  matrixrain(cb) {
    let p=0,called=false;const cols2=(W/14)|0;const drops=[...Array(cols2)].map(()=>({y:rnd(H*.5),spd:3+rnd(5)}));
    const go=()=>{p+=.008;tc.fillStyle=`rgba(0,${(16*p)|0},0,${Math.min(.95,p*1.4)})`;tc.fillRect(0,0,W,H);tc.font='13px monospace';drops.forEach((d,i)=>{d.y+=d.spd;const x=i*14;for(let j=0;j<22;j++){const y=d.y-j*14;if(y<-14||y>H+14)continue;const fa=j===0?.95:Math.max(0,.6-j*.026);tc.fillStyle=j===0?`rgba(180,255,180,${fa})`:`rgba(0,${178-j*6},0,${fa*Math.min(1,p*2)})`;tc.fillText(MAT_CHARS[(Math.random()*MAT_CHARS.length)|0],x,y);}if(d.y>H+200)d.y=0;});if(!called&&p>=.54){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  neon_rain(cb) {
    let p=0,called=false;const drops=[...Array(110)].map(()=>({x:rnd(W),y:rnd(H*.3),vy:3+rnd(4),len:20+rnd(48),hue:rnd(1)<.6?25:200}));
    const go=()=>{p+=.009;tc.fillStyle=`rgba(4,2,0,${Math.min(.96,p*1.35)})`;tc.fillRect(0,0,W,H);drops.forEach(d=>{d.y+=d.vy;if(d.y>H+60){d.y=-60;d.x=rnd(W);}const dg=tc.createLinearGradient(d.x,d.y-d.len,d.x,d.y);dg.addColorStop(0,'transparent');dg.addColorStop(1,`hsla(${d.hue},90%,60%,${.42*Math.min(1,p*2)})`);tc.strokeStyle=dg;tc.beginPath();tc.moveTo(d.x,d.y-d.len);tc.lineTo(d.x,d.y);tc.lineWidth=.8;tc.stroke();});if(!called&&p>=.52){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  dream(cb) {
    let p=0,called=false;
    const go=()=>{p+=.008;tc.fillStyle=`rgba(3,3,6,${Math.min(.95,p*1.35)})`;tc.fillRect(0,0,W,H);tc.save();tc.translate(W*.5,H*.5);for(let i=0;i<6;i++){const a=i/6*Math.PI*2+p*(.05+i*.007),r=W*.3*Math.sin(p*Math.PI*.85)*Math.max(.1,1-i*.12);tc.save();tc.rotate(a);tc.fillStyle=`rgba(70,70,180,${(.038-i*.005)*Math.min(1,p*2)})`;tc.fillRect(-W*.5,-r*.1,W,r*.2);tc.restore();}tc.restore();if(!called&&p>=.52){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  rose(cb) {
    let p=0,called=false;const pts=[...Array(22)].map(()=>({x:W*.5+rndpm(W*.4),y:-(rnd(H*.3)),r:rnd(14)+6,vy:1.5+rnd(2),vx:rndpm(.45),rot:rnd(Math.PI*2),rv:rndpm(.018)}));
    const go=()=>{p+=.008;tc.fillStyle=`rgba(1,1,0,${Math.min(.96,p*1.35)})`;tc.fillRect(0,0,W,H);pts.forEach(pt=>{pt.y+=pt.vy;pt.x+=pt.vx;pt.rot+=pt.rv;tc.save();tc.translate(pt.x,pt.y);tc.rotate(pt.rot);tc.beginPath();tc.ellipse(0,0,pt.r*.6,pt.r,0,0,Math.PI*2);tc.fillStyle=`rgba(128,10,10,${.58*Math.min(1,p*2)})`;tc.fill();tc.restore();});if(!called&&p>=.52){called=true;cb();}p<1.1?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  f1_launch(cb) {
    const LP=[0.2,0.35,0.5,0.65,0.8];const LR=Math.min(W,H)*.042;let elapsed=0,lastT=0,called=false;const totalDur=3500;
    const go=(ts:number)=>{if(!lastT)lastT=ts;elapsed+=ts-lastT;lastT=ts;const p=elapsed/totalDur;tc.clearRect(0,0,W,H);tc.fillStyle=`rgba(0,0,0,${Math.min(.96,p*2.2)})`;tc.fillRect(0,0,W,H);LP.forEach((lx,i)=>{const lx2=W*lx,ly=H*.34,onAt=.15+(i/(LP.length-1))*.4,isOn=p>=onAt&&p<.72+i*.055;if(p>.05){tc.beginPath();tc.arc(lx2,ly,LR*1.2,0,Math.PI*2);tc.fillStyle='rgba(12,12,15,.92)';tc.fill();}if(p>=onAt&&isOn){const inner=tc.createRadialGradient(lx2,ly,0,lx2,ly,LR);inner.addColorStop(0,'rgba(255,160,100,.98)');inner.addColorStop(1,'rgba(80,0,0,.3)');tc.fillStyle=inner;tc.beginPath();tc.arc(lx2,ly,LR,0,Math.PI*2);tc.fill();}});if(p>.72){const loA=Math.min(1,(p-.72)/.07),loF=Math.min(1,(.97-p)/.09);if(loA*loF>.05){tc.font=`bold ${Math.min(W*.07,56)}px 'Orbitron',monospace`;tc.textAlign='center';tc.textBaseline='middle';tc.fillStyle=`rgba(255,255,255,${loA*loF})`;tc.fillText('LIGHTS OUT',W*.5,H*.55);}}tc.globalAlpha=1;if(!called&&p>=.74){called=true;cb();}p<1.0?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
  f1_burnout(cb) {
    const sm=[...Array(48)].map(()=>({x:W*(.28+Math.random()*.44),y:H*(.68+Math.random()*.12),r:Math.random()*22+12,maxR:Math.random()*160+90,vx:(Math.random()-.5)*.9,vy:-(Math.random()*.7+.25),alpha:Math.random()*.18+.08,grey:Math.floor(Math.random()*40+130),delay:Math.random()*.28}));
    let elapsed=0,lastT=0,called=false;const totalDur=3400;
    const go=(ts:number)=>{if(!lastT)lastT=ts;elapsed+=ts-lastT;lastT=ts;const p=Math.min(1,elapsed/totalDur);tc.clearRect(0,0,W,H);tc.fillStyle=`rgba(0,0,0,${Math.min(.92,p*1.1)})`;tc.fillRect(0,0,W,H);if(p>.04){const sp=(p-.04)/.96;sm.forEach(s=>{if(sp<s.delay)return;const lp=Math.min(1,(sp-s.delay)/(1-s.delay)),cx=s.x+s.vx*lp*180,cy=s.y+s.vy*lp*220;s.r=Math.min(s.maxR,s.r+(s.maxR-s.r)*.008);const la=s.alpha*Math.min(1,lp*4)*Math.max(0,1-lp*.5);const sg=tc.createRadialGradient(cx,cy,0,cx,cy,s.r);sg.addColorStop(0,`rgba(${s.grey},${s.grey-8},${s.grey-12},${la*1.1})`);sg.addColorStop(1,'rgba(0,0,0,0)');tc.fillStyle=sg;tc.beginPath();tc.arc(cx,cy,s.r,0,Math.PI*2);tc.fill();});}tc.globalAlpha=1;if(!called&&p>=.52){called=true;cb();}p<1.0?requestAnimationFrame(go):finishTrans();};requestAnimationFrame(go);
  },
};
