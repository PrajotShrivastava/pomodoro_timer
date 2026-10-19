const DAY_MS = 24 * 60 * 60 * 1000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar day key, e.g. "2026-10-19". */
export function dayKey(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start of the local day `days` days before the given one (DST-safe). */
export function addDays(epochMs: number, days: number): number {
  const d = new Date(startOfDay(epochMs));
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** "24:59" or "1:04:59" for countdowns. Rounds up so 0:00 only shows at the end. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** "2h 15m", "45m", "0m". */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatTimeOfDay(epochMs: number): string {
  const d = new Date(epochMs);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayShort(epochMs: number): string {
  return WEEKDAYS[new Date(epochMs).getDay()];
}

/** "Today", "Yesterday", or "Mon, Oct 13". */
export function formatDayLabel(epochMs: number, now: number): string {
  const diff = Math.round((startOfDay(now) - startOfDay(epochMs)) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const d = new Date(epochMs);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
