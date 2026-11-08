const STORAGE_KEY = 'randmail_usage_v1';

export interface UsageEvent {
  tool: string;
  action: string;
  ts: number;
}

export const USAGE_TOOL_LABELS: Record<string, string> = {
  mail: 'GeneratMail',
  pass: 'GeneratPass',
  tools: 'GeneratPro',
  nota: 'GeneratNota',
  sertif: 'GeneratSertif',
  doc: 'GeneratDoc',
};

function readLocal(): UsageEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UsageEvent[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e.tool === 'string' && typeof e.ts === 'number');
  } catch {
    return [];
  }
}

function writeLocal(events: UsageEvent[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-500)));
  } catch {
    // storage penuh / private mode — abaikan
  }
}

/**
 * Catat pemakaian generator: POST best-effort ke /api/usage dan selalu
 * mirror ke localStorage sebagai cadangan (bekerja meski tanpa DB).
 */
export function trackUsage(tool: string, action = 'generate'): void {
  const events = readLocal();
  events.push({ tool, action, ts: Date.now() });
  writeLocal(events);

  fetch('/api/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, action }),
  }).catch(() => {
    // DB mati — mirror lokal sudah cukup
  });
}

/** Gabungkan event lokal + server untuk grafik pemakaian. */
export interface UsageSummary {
  byTool: Record<string, number>;
  byDay: { date: string; total: number }[];
  total: number;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function summarizeLocalUsage(): UsageSummary {
  const events = readLocal();
  const byTool: Record<string, number> = {};
  const byDayMap: Record<string, number> = {};
  let total = 0;

  const now = new Date();
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  events.forEach((e) => {
    if (e.ts < cutoff) return;
    total += 1;
    byTool[e.tool] = (byTool[e.tool] || 0) + 1;
    const day = dateKey(new Date(e.ts));
    byDayMap[day] = (byDayMap[day] || 0) + 1;
  });

  const byDay: UsageSummary['byDay'] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    byDay.push({ date: key, total: byDayMap[key] || 0 });
  }

  return { byTool, byDay, total };
}

export function clearLocalUsage(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}