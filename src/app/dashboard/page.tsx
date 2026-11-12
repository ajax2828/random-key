'use client';

import React, { useState, useEffect } from 'react';
import { localApiClient, User } from '@/utils/supabase/client';
import { UsageSummary, USAGE_TOOL_LABELS, summarizeLocalUsage } from '@/lib/usage';

interface HealthInfo {
  ok: boolean;
  time: string;
  db: 'up' | 'down';
  db_version?: string | null;
  provider: string;
}

interface DashboardData {
  user: User | null;
  health: HealthInfo | null;
  counts: { accounts: number; vault: number; profiles: number };
  usage: UsageSummary;
}

const TOOL_ORDER = ['mail', 'pass', 'tools', 'nota', 'sertif', 'doc'];
const TOOL_COLORS: Record<string, string> = {
  mail: '#8b5cf6',
  pass: '#06b6d4',
  tools: '#34d399',
  nota: '#f97316',
  sertif: '#fbbf24',
  doc: '#fb7185',
};

async function fetchDashboardData(): Promise<DashboardData> {
  const [user, health, usageRes, accRes, vltRes, profRes] = await Promise.all([
    localApiClient.getUser(),
    fetch('/api/health').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch('/api/usage').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch('/api/accounts').then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
    fetch('/api/vault').then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
    fetch('/api/profiles').then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
  ]);

  const localUsage = summarizeLocalUsage();
  const byTool = { ...localUsage.byTool };
  let serverTotal = 0;
  if (usageRes?.tools && Array.isArray(usageRes.tools)) {
    usageRes.tools.forEach((t: { tool: string; count: number }) => {
      byTool[t.tool] = (byTool[t.tool] || 0) + t.count;
      serverTotal += t.count;
    });
  }

  const byDay = localUsage.byDay.map((d) => ({ ...d }));
  if (usageRes?.daily && Array.isArray(usageRes.daily)) {
    usageRes.daily.forEach((d: { day: string; count: number }) => {
      const found = byDay.find((x) => x.date === d.day);
      if (found) found.total += d.count;
      else byDay.push({ date: d.day, total: d.count });
    });
  }
  byDay.sort((a, b) => a.date.localeCompare(b.date));

  return {
    user,
    health,
    counts: {
      accounts: (accRes?.data || []).length,
      vault: (vltRes?.data || []).length,
      profiles: (profRes?.data || []).length,
    },
    usage: { byTool, byDay, total: serverTotal + localUsage.total },
  };
}

interface ErrorEntry {
  ts: number;
  msg: string;
}

function StatCard({ label, value, icon, tone }: { label: string; value: number | string; icon: string; tone: string }) {
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-icon" style={{ background: `${tone}1f`, color: tone }}>{icon}</div>
      <div className="dash-stat-meta">
        <span className="dash-stat-value">{value}</span>
        <span className="dash-stat-label">{label}</span>
      </div>
    </div>
  );
}

function UsageChart({ usage }: { usage: UsageSummary }) {
  const maxTool = Math.max(1, ...TOOL_ORDER.map((t) => usage.byTool[t] || 0));
  const maxDay = Math.max(1, ...usage.byDay.map((d) => d.total));

  return (
    <div className="dash-chart-grid">
      <div className="dash-chart-card">
        <h4>Pemakaian per Generator</h4>
        {usage.total === 0 ? (
          <p className="dash-chart-empty">Belum ada aktivitas generate.</p>
        ) : (
          <div className="dash-bar-list">
            {TOOL_ORDER.map((t) => {
              const count = usage.byTool[t] || 0;
              return (
                <div key={t} className="dash-bar-row">
                  <span className="dash-bar-label">{USAGE_TOOL_LABELS[t] || t}</span>
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar-fill"
                      style={{ width: `${(count / maxTool) * 100}%`, background: TOOL_COLORS[t] }}
                    />
                  </div>
                  <span className="dash-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dash-chart-card">
        <h4>7 Hari Terakhir</h4>
        {usage.byDay.every((d) => d.total === 0) ? (
          <p className="dash-chart-empty">Belum ada aktivitas generate.</p>
        ) : (
          <div className="dash-daily-chart">
            {usage.byDay.map((d) => (
              <div key={d.date} className="dash-daily-col">
                <span className="dash-daily-val">{d.total > 0 ? d.total : ''}</span>
                <div className="dash-daily-bar-wrap">
                  <div
                    className="dash-daily-bar"
                    style={{ height: `${Math.max(4, (d.total / maxDay) * 100)}%` }}
                  />
                </div>
                <span className="dash-daily-label">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MonitorCard({
  health,
  network,
  errorLog,
  lastChecked,
  loading,
  onRefresh,
  onClearErrors,
}: {
  health: HealthInfo | null;
  network: 'online' | 'offline';
  errorLog: ErrorEntry[];
  lastChecked: string | null;
  loading: boolean;
  onRefresh: () => void;
  onClearErrors: () => void;
}) {
  const row = (label: string, value: string, ok: boolean) => (
    <div className="dash-mon-row">
      <span className="dash-mon-label">{label}</span>
      <span className={`dash-mon-value ${ok ? 'ok' : 'bad'}`}>
        <span className="dash-dot" /> {value}
      </span>
    </div>
  );

  return (
    <div className="dash-monitor">
      <div className="dash-monitor-grid">
        {row('Koneksi Jaringan', network === 'online' ? 'Online' : 'Offline', network === 'online')}
        {row('Database', health?.db === 'up' ? 'Terhubung' : 'Tidak Terhubung', health?.db === 'up')}
        {row('Versi Database', health?.db === 'up' ? health?.db_version || 'Terhubung' : '—', health?.db === 'up')}
        {row('Provider Data', health?.provider === 'supabase' ? 'Supabase' : 'PostgreSQL Lokal', !!health)}
        {row('Terakhir Dicek', lastChecked || '—', !!lastChecked)}
      </div>

      <div className="dash-mon-errors">
        <div className="dash-mon-errors-head">
          <span>Log Error Terakhir</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {errorLog.length > 0 && (
              <button className="btn-delete-all-profiles" onClick={onClearErrors} type="button">Bersihkan Log</button>
            )}
            <button className="btn-export" onClick={onRefresh} disabled={loading} type="button">
              {loading ? 'Memuat...' : '↻ Refresh'}
            </button>
          </div>
        </div>
        {errorLog.length === 0 ? (
          <p className="dash-chart-empty">Tidak ada error. Aplikasi berjalan normal.</p>
        ) : (
          <ul className="dash-error-list">
            {errorLog.map((e, i) => (
              <li key={i}>
                <span className="dash-error-time">{new Date(e.ts).toLocaleTimeString()}</span>
                <span className="dash-error-msg">{e.msg}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState<'online' | 'offline'>(
    typeof navigator !== 'undefined' ? (navigator.onLine ? 'online' : 'offline') : 'online'
  );
  const [errorLog, setErrorLog] = useState<ErrorEntry[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const d = await fetchDashboardData();
      if (!ignore) {
        setData(d);
        setLastChecked(new Date().toLocaleTimeString());
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Monitor jaringan
  useEffect(() => {
    const onOnline = () => setNetwork('online');
    const onOffline = () => setNetwork('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Monitor error client
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const msg = e.message || 'Unknown error';
      setErrorLog((prev) => [...prev.slice(-19), { ts: Date.now(), msg }]);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason || 'Unhandled rejection');
      setErrorLog((prev) => [...prev.slice(-19), { ts: Date.now(), msg }]);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    const d = await fetchDashboardData();
    setData(d);
    setLastChecked(new Date().toLocaleTimeString());
    setLoading(false);
  };

  const handleClearErrors = () => setErrorLog([]);

  const name = data?.user?.full_name || data?.user?.email || 'Pengguna';
  const total = data?.usage.total ?? 0;

  return (
    <div className="dash-page">
      {/* Hero */}
      <section className="page-hero-header">
        <div className="page-hero-left">
          <div className="page-hero-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M4 8L16 18L28 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="page-hero-title">Selamat datang, {name} 👋</h2>
            <p className="page-hero-sub">Ringkasan pemakaian, monitoring, dan bantuan AI. Mode tanpa login & tanpa database.</p>
          </div>
        </div>
        <div className="page-hero-badges">
          <span className="hero-badge" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}>
            {total} Aktivitas
          </span>
          <span
            className="hero-badge"
            style={{ background: network === 'online' ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)', border: `1px solid ${network === 'online' ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.4)'}`, color: network === 'online' ? '#34d399' : '#fb7185' }}
          >
            {network === 'online' ? '● Online' : '● Offline'}
          </span>
        </div>
      </section>

      {/* Stat cards */}
      <div className="dash-stats">
        <StatCard label="Total Aktivitas" value={total} icon="⚡" tone="#8b5cf6" />
        <StatCard label="Email Tersimpan" value={data?.counts.accounts ?? 0} icon="📧" tone="#06b6d4" />
        <StatCard label="Password Vault" value={data?.counts.vault ?? 0} icon="🔑" tone="#34d399" />
        <StatCard label="Profil Tersimpan" value={data?.counts.profiles ?? 0} icon="👤" tone="#f97316" />
        <StatCard label="Database" value={data?.health?.db === 'up' ? 'Aktif' : 'Tidak Aktif'} icon="🗄️" tone={data?.health?.db === 'up' ? '#34d399' : '#fb7185'} />
      </div>

      {loading && !data && (
        <div className="empty-state"><p>Memuat dashboard...</p></div>
      )}

      {/* Grafik Pemakaian */}
      {data && (
        <section className="tools-card-section">
          <div className="section-header-row">
            <h3>📊 Grafik Pemakaian</h3>
            <span className="info-badge">Per generator &amp; 7 hari</span>
          </div>
          <UsageChart usage={data.usage} />
        </section>
      )}

      {/* Monitoring */}
      {data && (
        <section className="tools-card-section">
          <div className="section-header-row">
            <h3>📡 Monitoring Error &amp; Network</h3>
            <span className="info-badge">Live</span>
          </div>
          <MonitorCard
            health={data.health}
            network={network}
            errorLog={errorLog}
            lastChecked={lastChecked}
            loading={loading}
            onRefresh={handleRefresh}
            onClearErrors={handleClearErrors}
          />
        </section>
      )}

      {/* Quick links */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>🚀 Mulai Generate</h3>
        </div>
        <div className="dash-quick-links">
          <a href="/dashboard/generate" className="dash-quick-link">📧 GeneratMail</a>
          <a href="/pass" className="dash-quick-link">🔑 GeneratPass</a>
          <a href="/tools" className="dash-quick-link">👤 GeneratPro</a>
          <a href="/nota" className="dash-quick-link">🧾 GeneratNota</a>
          <a href="/sertif" className="dash-quick-link">🎓 GeneratSertif</a>
          <a href="/doc" className="dash-quick-link">📝 GeneratDoc</a>
          <a href="/history" className="dash-quick-link">🕘 History</a>
        </div>
      </section>
    </div>
  );
}
