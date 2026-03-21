import type { LogEntry } from './types';
import { p2, fmtSession } from './utils';

const KEY = 'sc_focus_log';

function load(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(d: LogEntry[]) { localStorage.setItem(KEY, JSON.stringify(d)); }

export function record(task: string, durMs: number) {
  if (durMs < 5000) return;
  const entries = load();
  entries.unshift({ time: Date.now(), task: task || 'Untitled session', dur: Math.round(durMs), date: new Date().toDateString() });
  if (entries.length > 200) entries.pop();
  save(entries);
}

export function render(container: HTMLElement) {
  const entries = load();
  if (!entries.length) {
    container.innerHTML = '<div class="log-empty">No sessions recorded yet. Start the timer to begin logging.</div>';
    return;
  }
  const today = new Date().toDateString();
  const groups: Record<string, LogEntry[]> = {};
  entries.forEach(e => { (groups[e.date] ??= []).push(e); });
  container.innerHTML = '';
  for (const [date, items] of Object.entries(groups)) {
    const hdr = document.createElement('div');
    hdr.className = 'log-date-hdr';
    hdr.textContent = date === today ? 'Today' : date;
    container.appendChild(hdr);
    items.forEach(e => {
      const d = new Date(e.time);
      const row = document.createElement('div');
      row.className = 'log-entry';
      row.innerHTML = `<span class="log-time">${p2(d.getHours())}:${p2(d.getMinutes())}</span><span class="log-task">${e.task}</span><span class="log-dur">${fmtSession(e.dur)}</span>`;
      container.appendChild(row);
    });
  }
}

export function exportCSV() {
  const entries = load();
  if (!entries.length) return;
  const rows = ['Time,Task,Duration,Date', ...entries.map(e => {
    const d = new Date(e.time);
    return `"${d.toLocaleString()}","${e.task.replace(/"/g, '""')}","${fmtSession(e.dur)}","${e.date}"`;
  })];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
  a.download = `session-log-${Date.now()}.csv`;
  a.click();
}

export function clear() {
  if (!confirm('Clear all session log entries?')) return;
  localStorage.removeItem(KEY);
}
