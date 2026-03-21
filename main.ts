import type { Theme } from './types';
import { THEMES, THEME_BY_ID, THEMES_BY_CAT, NAT_QUOTES } from './themes';
import { LIT_CLOCK } from './litclock';
import { p2, p3, fmtSession, DAYS, MONTHS, GREETS } from './utils';
import { clockOffset, synced, syncTime, setSyncHandler } from './timesync';
import { initWeather } from './weather';
import * as Sound from './sound';
import * as Pom from './pomodoro';
import * as Log from './focuslog';
import { resize, buildParticles, drawBg, runTransition } from './renderer';

// ── SVG Logos ─────────────────────────────────────────────────────────
const LOGOS: Record<string, string> = {
  supernatural: `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#1a0800"/><path d="M6 17L16 5L26 17" stroke="#e05500" stroke-width="1.5" fill="none"/><path d="M10 17L16 9L22 17" stroke="#ff9944" stroke-width="1" fill="none" opacity=".6"/><circle cx="16" cy="14" r="2" fill="#e05500" opacity=".8"/></svg>`,
  mentalist:    `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#180800"/><circle cx="16" cy="11" r="7" stroke="#cc1100" stroke-width="1.2" fill="none"/><circle cx="13" cy="9.5" r="1.2" fill="#cc1100"/><circle cx="19" cy="9.5" r="1.2" fill="#cc1100"/><path d="M12 14Q16 17 20 14" stroke="#cc1100" stroke-width="1.2" fill="none"/></svg>`,
  sopranos:     `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#080808"/><rect x="4" y="6" width="24" height="10" rx="1" stroke="#c8a000" stroke-width="1" fill="none" opacity=".7"/><text x="16" y="14.5" text-anchor="middle" fill="#c8a000" font-size="6" font-family="Georgia,serif" font-weight="700">TS</text></svg>`,
  dark:         `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#000004"/><circle cx="16" cy="11" r="8" stroke="#4488cc" stroke-width=".8" fill="none" opacity=".5"/><circle cx="16" cy="11" r="5" stroke="#4488cc" stroke-width=".6" fill="none" opacity=".35"/><circle cx="16" cy="11" r="2" fill="#4488cc" opacity=".7"/></svg>`,
  breakingbad:  `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#040900"/><text x="4" y="10" fill="#7ec800" font-size="7.5" font-family="Arial,sans-serif" font-weight="900">Br</text><text x="4" y="19" fill="#b8f040" font-size="6" font-family="Arial,sans-serif" font-weight="700" letter-spacing="2">BAD</text></svg>`,
  strangerthings:`<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#04000e"/><text x="16" y="9" text-anchor="middle" fill="#cc44ff" font-size="5.5" font-family="Georgia,serif" font-weight="700" letter-spacing="-.5">STRANGER</text><text x="16" y="17" text-anchor="middle" fill="#ee88ff" font-size="5.5" font-family="Georgia,serif" font-weight="700" letter-spacing="-.5">THINGS</text></svg>`,
  interstellar: `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#000305"/><circle cx="16" cy="11" r="6" fill="none" stroke="#4499ee" stroke-width=".8" opacity=".6"/><ellipse cx="16" cy="11" rx="9" ry="2.5" fill="none" stroke="#88ccff" stroke-width=".7" opacity=".4"/><circle cx="16" cy="11" r="1.2" fill="#4499ee" opacity=".6"/></svg>`,
  dune:         `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#1a1000"/><path d="M2 16Q8 8 16 10Q24 12 30 6" stroke="#d4a020" stroke-width="1.2" fill="none" opacity=".7"/><text x="16" y="21" text-anchor="middle" fill="#d4a020" font-size="4.5" font-family="Georgia,serif" letter-spacing="3" opacity=".8">DUNE</text></svg>`,
  matrix:       `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#000a00"/><text x="4" y="8" fill="#00ee00" font-size="5" font-family="monospace" opacity=".9">10110</text><text x="4" y="14" fill="#00ee00" font-size="5" font-family="monospace" opacity=".6">01001</text><text x="24.5" y="13" text-anchor="middle" fill="#00ee00" font-size="7" font-family="monospace" font-weight="700">M</text></svg>`,
  bladerunner:  `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#0a0500"/><rect x="2" y="14" width="28" height="6" fill="#050200"/><path d="M2 5L5 2L27 2L30 5" stroke="#e87020" stroke-width=".6" fill="none" opacity=".5"/></svg>`,
  inception:    `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#060608"/><circle cx="16" cy="11" r="9" stroke="#9090ee" stroke-width=".6" fill="none" opacity=".35"/><circle cx="16" cy="11" r="5" stroke="#9090ee" stroke-width=".6" fill="none" opacity=".3"/><circle cx="16" cy="11" r="1.5" fill="#9090ee" opacity=".6"/></svg>`,
  godfather:    `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#050500"/><path d="M16 4Q10 8 10 12Q10 17 16 18Q22 17 22 12Q22 8 16 4Z" fill="none" stroke="#b09040" stroke-width=".8" opacity=".6"/></svg>`,
  redbull:      `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#1c1f26"/><text x="16" y="10" text-anchor="middle" fill="#e8002d" font-size="5" font-family="Arial Black,sans-serif" font-weight="900">RED BULL</text><text x="16" y="17" text-anchor="middle" fill="#1e41ff" font-size="3.8" font-family="Arial,sans-serif" font-weight="700" letter-spacing="1">RACING</text></svg>`,
  ferrari:      `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#dc0000"/><text x="16" y="13" text-anchor="middle" fill="#ffed00" font-size="8" font-family="Arial Black,sans-serif" font-weight="900">SF</text></svg>`,
  mercedes:     `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#00d2be"/><text x="16" y="13" text-anchor="middle" fill="#fff" font-size="5" font-family="Arial Black,sans-serif" font-weight="900" letter-spacing=".5">AMG</text><path d="M16 5 L19 9 L16 8 L13 9 Z" fill="white" opacity=".9"/></svg>`,
  mclaren:      `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#ff8000"/><path d="M3 11 Q16 4 29 11 Q16 18 3 11Z" fill="#c86000" opacity=".7"/><text x="16" y="13" text-anchor="middle" fill="white" font-size="5.5" font-family="Arial Black,sans-serif" font-weight="900">MCL</text></svg>`,
  astonmartin:  `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#006f62"/><path d="M8 14 Q16 6 24 14" stroke="#cedc00" stroke-width="1.5" fill="none"/><text x="16" y="19" text-anchor="middle" fill="#cedc00" font-size="3.5" font-family="Arial,sans-serif" font-weight="700" letter-spacing=".5">ASTON MARTIN</text></svg>`,
  literary:     `<svg viewBox="0 0 32 22" fill="none"><rect width="32" height="22" fill="#0d0a06"/><path d="M8 5h16v13H8z" stroke="#c8a870" stroke-width="1" fill="none" opacity=".7"/><path d="M10 9h12M10 12h9M10 15h7" stroke="#c8a870" stroke-width=".7" opacity=".5"/></svg>`,
};

// ── Cached DOM refs ────────────────────────────────────────────────────
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const DOM = {
  timeDis:        $('timeDis'),
  ampmDis:        $('ampmDis'),
  secMs:          $('secMs'),
  dateDis:        $('dateDis'),
  dayPct:         $('dayPct'),
  pFill:          $('progressFill'),
  sTmr:           $('sessionTimer'),
  utcPill:        $('utcPill'),
  greeting:       $('greeting'),
  quoteText:      $('quoteText'),
  litMeta:        $('litMeta'),
  syncDot:        $('syncDot'),
  syncLabel:      $('syncLabel'),
  focusInput:     $<HTMLInputElement>('focusInput'),
  focusInputWrap: $('focusInputWrap'),
  themePanel:     $('themePanel'),
  btnStart:       $('btnStart'),
  btnReset:       $('btnReset'),
  pomPill:        $('pomModePill'),
  sessionLabel:   $('sessionLabel'),
  pomRingSvg:     document.getElementById('pomRingSvg') as unknown as SVGSVGElement,
  pomRingArc:     document.getElementById('pomRingArc') as unknown as SVGCircleElement,
  showBadge:      $('showBadge'),
};

// ── Session timer ──────────────────────────────────────────────────────
let sessionRunning = false;
let sessionStart = 0;
let sessionElapsed = 0;

function startTimer() {
  sessionRunning = true;
  sessionStart = performance.now() - sessionElapsed;
  DOM.btnStart.textContent = 'Pause';
  DOM.focusInputWrap.classList.add('visible');
  if (Pom.isActive()) Pom.onStart();
}

function pauseTimer() {
  sessionRunning = false;
  sessionElapsed = performance.now() - sessionStart;
  DOM.btnStart.textContent = 'Resume';
}

function resetTimer() {
  Log.record(DOM.focusInput.value.trim(), sessionRunning ? performance.now() - sessionStart : sessionElapsed);
  sessionRunning = false; sessionStart = sessionElapsed = 0;
  DOM.btnStart.textContent = 'Start';
  DOM.sTmr.textContent = '00:00:00';
  DOM.focusInputWrap.classList.remove('visible');
  DOM.focusInput.value = '';
  if (Pom.isActive()) Pom.reset();
}

DOM.btnStart.addEventListener('click', () => sessionRunning ? pauseTimer() : startTimer());
DOM.btnReset.addEventListener('click', resetTimer);

// ── Current theme ──────────────────────────────────────────────────────
let currentTheme: Theme = THEMES[0];
const root = document.documentElement;
const cssVar = (name: string, val: string) => root.style.setProperty(name, val);

function applyTheme(theme: Theme, instant = false) {
  const doApply = () => {
    currentTheme = theme;
    buildParticles(theme);
    cssVar('--clr-text',    theme.text);
    cssVar('--clr-accent',  theme.accent);
    cssVar('--clr-accent2', theme.accent2);
    cssVar('--clr-track',   theme.track);
    cssVar('--clr-btn-bg',  theme.btnBg);
    cssVar('--clr-btn-fg',  theme.btnFg);
    cssVar('--clr-pill',    theme.pill);
    cssVar('--clr-panel',   theme.panel);
    cssVar('--font-main',   theme.font);
    cssVar('--glow', theme.glow === 'none' ? 'none' : `0 0 45px ${theme.accent}44,0 0 100px ${theme.accent}18`);
    cssVar('--btn-radius',  theme.isMedia ? '3px' : '99px');
    cssVar('--lb-h', (theme.isMedia && theme.lb) ? '3.8vh' : '0px');

    $('overlay').style.background  = theme.overlay  === 'none' ? '' : theme.overlay;
    $('vignette').style.background = theme.vignette === 'none' ? '' : theme.vignette;
    ($('scanlines') as HTMLElement).style.opacity = theme.scanlines ? '1' : '0';
    const grainEl = $('grain');
    grainEl.style.opacity = theme.grain ? '0.25' : '0';
    if (theme.grain) grainEl.style.backgroundImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")`;
    const hdrEl = $('hdrBloom');
    if (theme.hdr) { hdrEl.style.background = `radial-gradient(ellipse at 50% 50%,${theme.accent}09 0%,transparent 65%)`; hdrEl.style.opacity = '1'; }
    else hdrEl.style.opacity = '0';

    // Show badge for media themes
    if (theme.isMedia && theme.tagline) { DOM.showBadge.textContent = theme.tagline; DOM.showBadge.classList.add('visible'); }
    else DOM.showBadge.classList.remove('visible');

    // Literary mode
    if (theme.id === 'literary') {
      DOM.quoteText.style.fontFamily = "'Lora',serif";
      DOM.quoteText.style.fontSize = 'clamp(.75rem,1.4vw,.95rem)';
      DOM.litMeta.style.display = 'block';
    } else {
      DOM.quoteText.style.fontFamily = DOM.quoteText.style.fontSize = '';
      DOM.litMeta.style.display = 'none';
      const qs = theme.quotes?.length ? theme.quotes : NAT_QUOTES;
      DOM.quoteText.style.opacity = '0';
      setTimeout(() => { DOM.quoteText.textContent = `"${qs[0]}"`; DOM.quoteText.style.opacity = '.38'; }, 420);
    }

    updateSyncDisplay(synced ? 'ok' : 'failed');
    document.querySelectorAll<HTMLElement>('.nat-btn,.media-card').forEach(b => b.classList.toggle('active', b.dataset.id === theme.id));
    lastQKey = '';
    localStorage.setItem('sc_last_theme', theme.id);
  };

  if (instant || !theme.isMedia) { doApply(); return; }
  runTransition(theme.transition ?? 'defaultFade', doApply);
}

// ── Sync UI ────────────────────────────────────────────────────────────
function updateSyncDisplay(state: 'syncing' | 'ok' | 'failed', rtt?: number) {
  if (!DOM.syncDot) return;
  if (state === 'syncing') { DOM.syncDot.style.background = '#f59e0b'; DOM.syncLabel.textContent = 'Syncing…'; }
  else if (state === 'ok') {
    DOM.syncDot.style.background = currentTheme.accent;
    const ms = Math.abs(Math.round(clockOffset));
    DOM.syncLabel.textContent = `Synced · ±${ms}ms${rtt != null ? ` · ${Math.round(rtt)}ms RTT` : ''}`;
  } else { DOM.syncDot.style.background = '#ef4444'; DOM.syncLabel.textContent = 'Local clock'; }
}
setSyncHandler(updateSyncDisplay);

// ── Render loop ────────────────────────────────────────────────────────
let lastTs = 0, lastSec = -1, lastQKey = '';

function renderFrame(ts: number) {
  requestAnimationFrame(renderFrame);
  const dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;
  drawBg(dt, currentTheme);

  const now = new Date(Date.now() + clockOffset);
  const ms = now.getMilliseconds(), sec = now.getSeconds(), min = now.getMinutes(), hr = now.getHours();
  const hr12 = hr % 12 || 12;

  DOM.timeDis.innerHTML = `${p2(hr12)}<span class="colon">:</span>${p2(min)}<span class="colon">:</span>${p2(sec)}`;
  DOM.ampmDis.textContent = hr >= 12 ? 'PM' : 'AM';
  DOM.secMs.textContent = '.' + p3(ms);

  const dp = ((hr * 3600 + min * 60 + sec) * 1000 + ms) / 864e5 * 100;
  DOM.pFill.style.width = dp.toFixed(4) + '%';

  if (sessionRunning) {
    if (Pom.isActive()) Pom.tick(performance.now());
    else DOM.sTmr.textContent = fmtSession(performance.now() - sessionStart);
  }

  if (sec !== lastSec) {
    lastSec = sec;
    const uh = now.getUTCHours(), um = now.getUTCMinutes(), us = now.getUTCSeconds();
    DOM.utcPill.textContent = `UTC ${p2(uh)}:${p2(um)}:${p2(us)}`;
    DOM.dateDis.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    DOM.greeting.textContent = GREETS.find(([s, e]) => hr >= s && hr < e)?.[2] ?? '';
    DOM.dayPct.textContent = dp.toFixed(1) + '%';

    if (currentTheme.id === 'literary') {
      const key = p2(hr) + ':' + p2(Math.floor(min / 5) * 5);
      if (key !== lastQKey) {
        lastQKey = key;
        const entry = LIT_CLOCK[key];
        if (entry) {
          DOM.quoteText.style.opacity = '0';
          setTimeout(() => { DOM.quoteText.textContent = `"${entry.quote}"`; DOM.litMeta.textContent = entry.source; DOM.quoteText.style.opacity = '.55'; }, 400);
        }
      }
    } else {
      const qs = currentTheme.quotes?.length ? currentTheme.quotes : NAT_QUOTES;
      const qi = (((hr * 60 + min) / 5) | 0) % qs.length;
      const qKey = String(qi);
      if (qKey !== lastQKey) { lastQKey = qKey; DOM.quoteText.style.opacity = '0'; setTimeout(() => { DOM.quoteText.textContent = `"${qs[qi]}"`; DOM.quoteText.style.opacity = '.38'; }, 400); }
    }
  }
}

// ── Theme panel ────────────────────────────────────────────────────────
function buildPanel() {
  const panelRows = $('themePanelRows'); panelRows.innerHTML = '';
  const featBar   = $('featBar');       featBar.innerHTML = '';

  const makeNatBtn = (t: Theme) => {
    const btn = document.createElement('button');
    btn.className = 'nat-btn'; btn.dataset.id = t.id; btn.title = t.name;
    btn.style.background = t.swatch ?? t.accent;
    btn.addEventListener('click', () => applyTheme(t));
    return btn;
  };

  const makeCard = (t: Theme) => {
    const card = document.createElement('button'); card.className = 'media-card'; card.dataset.id = t.id;
    card.addEventListener('click', () => applyTheme(t));
    const logo = document.createElement('div'); logo.className = 'media-logo';
    logo.innerHTML = LOGOS[t.id] ?? `<svg viewBox="0 0 32 22"><rect width="32" height="22" fill="${t.baseBg[0]}"/><text x="16" y="14" text-anchor="middle" fill="${t.accent}" font-size="8" font-weight="700">${t.name.slice(0,2).toUpperCase()}</text></svg>`;
    const nm = document.createElement('div'); nm.className = 'media-name'; nm.textContent = t.name;
    const sb = document.createElement('div'); sb.className = 'media-sub'; sb.style.color = t.accent; sb.textContent = t.sub ?? '';
    const txt = document.createElement('div'); txt.append(nm, sb);
    card.append(logo, txt); return card;
  };

  const makeRow = (label: string, items: Theme[], fn: (t: Theme) => HTMLElement) => {
    const row = document.createElement('div'); row.className = 'theme-row';
    const lbl = document.createElement('span'); lbl.className = 'row-label'; lbl.textContent = label;
    row.append(lbl, ...items.map(fn)); return row;
  };
  const divider = () => { const d = document.createElement('div'); d.className = 'row-divider'; return d; };

  const pureNat = THEMES_BY_CAT.nat.filter(t => t.id !== 'literary');
  const litTheme = THEMES_BY_CAT.nat.find(t => t.id === 'literary');

  panelRows.append(makeRow('Themes', pureNat, makeNatBtn), divider());
  if (litTheme) {
    const lr = document.createElement('div'); lr.className = 'theme-row';
    const ll = document.createElement('span'); ll.className = 'row-label'; ll.textContent = 'Literary';
    lr.append(ll, makeCard(litTheme)); panelRows.append(lr, divider());
  }
  panelRows.append(makeRow('F1 Teams', THEMES_BY_CAT.f1, makeCard), divider(),
                   makeRow('TV Shows', THEMES_BY_CAT.tv, makeCard), divider(),
                   makeRow('Movies',   THEMES_BY_CAT.movie, makeCard));

  // Feature bar
  ([ ['btnSound','🎵 Sound',  () => { buildSoundUI(); openModal('soundOverlay'); }],
     ['btnKiosk','⛶ Kiosk',  toggleKiosk],
     ['btnPresent','📺 Present', togglePresent],
     ['btnThemeBuilder','🎨 Custom', openThemeBuilder],
     ['btnKb','⌨ Keys', () => openModal('kbOverlay')],
  ] as [string, string, () => void][]).forEach(([id, label, action]) => {
    const b = document.createElement('button'); b.className = 'feat-btn'; b.id = id; b.textContent = label;
    b.addEventListener('click', action); featBar.appendChild(b);
  });

  $('panelToggle').onclick = () => DOM.themePanel.classList.toggle('collapsed');
}

// ── Modals ─────────────────────────────────────────────────────────────
const openModal  = (id: string) => $(id).classList.add('open');
const closeModal = (id: string) => $(id).classList.remove('open');
document.querySelectorAll('.sc-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) (el as HTMLElement).classList.remove('open'); });
});
(window as any).SC = { modals: { open: openModal, close: closeModal } };

// ── Keyboard shortcuts ─────────────────────────────────────────────────
const SHORTCUTS: [string, string, () => void][] = [
  ['Space', 'Start / Pause session timer', () => DOM.btnStart.click()],
  ['R',     'Reset timer',                  () => DOM.btnReset.click()],
  ['T',     'Cycle to next theme',          () => { const idx = THEMES.indexOf(currentTheme); applyTheme(THEMES[(idx+1)%THEMES.length]); }],
  ['F',     'Toggle fullscreen / kiosk',    toggleKiosk],
  ['P',     'Toggle Pomodoro mode',         () => $('btnPomToggle').click()],
  ['M',     'Open ambient sound mixer',     () => { buildSoundUI(); openModal('soundOverlay'); }],
  ['L',     'Open session focus log',       () => { Log.render($('logEntries')); openModal('logOverlay'); }],
  ['K',     'Collapse / expand panel',      () => DOM.themePanel.classList.toggle('collapsed')],
  ['G',     'Open custom theme builder',    openThemeBuilder],
  ['?',     'Show shortcuts',               () => openModal('kbOverlay')],
  ['Escape','Close any open panel',         () => document.querySelectorAll<HTMLElement>('.sc-overlay.open').forEach(el => el.classList.remove('open'))],
];

// Build keyboard grid
const kbGrid = $('kbGrid'); kbGrid.innerHTML = '';
SHORTCUTS.forEach(([key, desc]) => {
  const k = document.createElement('kbd'); k.textContent = key;
  const d = document.createElement('span'); d.className = 'kb-desc'; d.textContent = desc;
  kbGrid.append(k, d);
});

document.addEventListener('keydown', e => {
  const tag = (document.activeElement as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') { if (e.key === 'Escape') (document.activeElement as HTMLElement).blur(); return; }
  const hasOpen = document.querySelector('.sc-overlay.open');
  if (hasOpen && e.key !== 'Escape') return;
  for (const [key, , action] of SHORTCUTS) {
    const ek = e.code === 'Space' ? 'space' : e.key.toLowerCase();
    if (key.toLowerCase() === ek || (key === 'Space' && e.code === 'Space')) { e.preventDefault(); action(); return; }
  }
});

// ── Display modes ──────────────────────────────────────────────────────
let kioskOn = false, presentOn = false;
function toggleKiosk() {
  kioskOn = !kioskOn;
  document.body.classList.toggle('kiosk', kioskOn);
  if (kioskOn) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.().catch(() => {});
}
function togglePresent() { presentOn = !presentOn; document.body.classList.toggle('present', presentOn); }

// ── Pomodoro UI ────────────────────────────────────────────────────────
Pom.init({
  isRunning: () => sessionRunning,
  getStart:  () => sessionStart,
  timer:     DOM.sTmr,
  arc:       DOM.pomRingArc as unknown as SVGCircleElement,
  ring:      DOM.pomRingSvg as unknown as SVGSVGElement,
  pill:      DOM.pomPill,
  label:     DOM.sessionLabel,
  onPhase:   txt => DOM.pomPill.textContent = txt,
});

$('btnPomToggle').addEventListener('click', () => {
  Pom.toggle();
  buildPomUI();
  openModal('pomOverlay');
});

function buildPomUI() {
  const s = Pom.getSettings();
  const countEl = $('pomCountToday');
  if (countEl) countEl.textContent = String(Pom.todayCount());
  (['pomWorkBtns','pomBreakBtns','pomLongBtns'] as const).forEach((id, i) => {
    const el = $(id); if (!el) return; el.innerHTML = '';
    const opts = i===0?[15,20,25,30,45,60]:i===1?[5,10,15]:[3,4,5,6];
    const cur  = i===0?s.workMins:i===1?s.breakMins:s.longBreakAfter;
    opts.forEach(v => {
      const b = document.createElement('button');
      b.className = 'btn' + (cur===v?' active-btn':'');
      b.textContent = i<2?`${v}m`:`${v}`;
      b.onclick = () => {
        if (i===0) Pom.updateSettings({workMins:v});
        else if (i===1) Pom.updateSettings({breakMins:v});
        else Pom.updateSettings({longBreakAfter:v});
        buildPomUI();
      };
      el.appendChild(b);
    });
  });
}

// ── Sound UI ───────────────────────────────────────────────────────────
function buildSoundUI() {
  const grid = $('soundGrid'); grid.innerHTML = '';
  Sound.SOUNDS.forEach(s => {
    const card = document.createElement('div');
    card.className = 'sound-card' + (Sound.currentId === s.id ? ' playing' : '');
    card.innerHTML = `<span class="sound-icon">${s.icon}</span><div class="sound-name">${s.name}</div>`;
    card.onclick = () => { Sound.toggle(s.id); buildSoundUI(); };
    grid.appendChild(card);
  });
}
($('volSlider') as HTMLInputElement).addEventListener('input', e => {
  const v = +(e.target as HTMLInputElement).value / 100;
  Sound.setVolume(v);
  $('volLabel').textContent = Math.round(v * 100) + '%';
});
($('fadeSlider') as HTMLInputElement).addEventListener('input', e => {
  const v = +(e.target as HTMLInputElement).value;
  Sound.setFade(v);
  $('fadeLabel').textContent = v === 0 ? 'Off' : `${v}m`;
});

// ── Focus log UI ───────────────────────────────────────────────────────
$('btnLog').addEventListener('click', () => { Log.render($('logEntries')); openModal('logOverlay'); });
(window as any).SC = {
  ...(window as any).SC,
  focusLog: { exportCSV: Log.exportCSV, clear: () => { Log.clear(); Log.render($('logEntries')); } },
};

// ── Custom Theme Builder ───────────────────────────────────────────────
const THEME_FIELDS = [
  { key: 'text', label: 'Text color' }, { key: 'accent', label: 'Accent (main)' },
  { key: 'accent2', label: 'Accent 2' }, { key: 'btnFg', label: 'Button text' },
  { key: 'panel', label: 'Panel BG' }, { key: 'baseBg0', label: 'Background' },
];
let draft: Record<string, string> = { text:'#e0f2fe', accent:'#6ee7b7', accent2:'#818cf8', btnFg:'#6ee7b7', panel:'rgba(4,3,18,.7)', baseBg0:'#06030f' };
const rgbaToHex = (s: string) => { const m = s.match(/[\d.]+/g); return m ? '#'+[m[0],m[1],m[2]].map(v=>parseInt(v).toString(16).padStart(2,'0')).join('') : '#ffffff'; };

function buildColorRows() {
  const container = $('colorRows'); if (!container) return;
  container.innerHTML = '';
  THEME_FIELDS.forEach(f => {
    const raw = draft[f.key];
    const hex = (raw.startsWith('rgba')||raw.startsWith('rgb')) ? rgbaToHex(raw) : raw;
    const row = document.createElement('div'); row.className = 'color-row';
    row.innerHTML = `<span class="color-label">${f.label}</span><div class="color-picker-wrap"><input type="color" value="${hex}" data-key="${f.key}"></div><span class="color-hex" id="hex_${f.key}">${hex}</span>`;
    container.appendChild(row);
  });
  container.querySelectorAll<HTMLInputElement>('input[type=color]').forEach(inp => {
    inp.addEventListener('input', e => {
      const el = e.target as HTMLInputElement;
      draft[el.dataset.key!] = el.value;
      ($('hex_'+el.dataset.key) as HTMLElement).textContent = el.value;
    });
  });
  renderSavedSwatches();
}

function previewCustomTheme() {
  cssVar('--clr-text', draft.text); cssVar('--clr-accent', draft.accent);
  cssVar('--clr-accent2', draft.accent2); cssVar('--clr-btn-fg', draft.btnFg);
  cssVar('--clr-panel', draft.panel);
}

function saveCustomTheme() {
  const saved: {id:string; name:string; draft:typeof draft}[] = JSON.parse(localStorage.getItem('sc_custom_themes')||'[]');
  saved.push({ id:'custom_'+Date.now(), name:'Custom '+saved.length, draft:{...draft} });
  if (saved.length > 10) saved.shift();
  localStorage.setItem('sc_custom_themes', JSON.stringify(saved));
  renderSavedSwatches(); alert('Custom theme saved!');
}

function renderSavedSwatches() {
  const row = $('savedThemeRow'); if (!row) return;
  const saved: {id:string; name:string; draft:typeof draft}[] = JSON.parse(localStorage.getItem('sc_custom_themes')||'[]');
  row.innerHTML = '';
  if (!saved.length) { row.innerHTML = '<span style="font-size:.65rem;opacity:.3;color:var(--clr-text)">No saved themes yet</span>'; return; }
  saved.forEach(item => {
    const sw = document.createElement('div'); sw.className = 'saved-swatch'; sw.style.background = item.draft.accent; sw.title = item.name;
    sw.onclick = () => { draft = {...item.draft}; previewCustomTheme(); buildColorRows(); };
    row.appendChild(sw);
  });
}

function openThemeBuilder() { buildColorRows(); openModal('themeBuilderOverlay'); }

(window as any).SC = { ...(window as any).SC, themeBuilder: { preview: previewCustomTheme, save: saveCustomTheme, reset: () => applyTheme(currentTheme, true), openBuilder: openThemeBuilder } };

// ── Init ───────────────────────────────────────────────────────────────
function init() {
  resize();
  window.addEventListener('resize', resize);
  buildPanel();
  const lastId = localStorage.getItem('sc_last_theme');
  applyTheme(lastId && THEME_BY_ID[lastId] ? THEME_BY_ID[lastId] : THEMES[0], true);
  requestAnimationFrame(ts => { lastTs = ts; renderFrame(ts); });
  syncTime();
  initWeather($('weatherIcon'), $('weatherText'), $('weatherPill'));
}

init();
