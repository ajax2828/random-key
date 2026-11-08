'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { localApiClient, User } from '@/utils/supabase/client';
import Toast from '@/components/Toast';
import SecureDeleteModal from '@/components/SecureDeleteModal';
import { UsageSummary, USAGE_TOOL_LABELS, summarizeLocalUsage, clearLocalUsage } from '@/lib/usage';
import { AI_PROVIDERS, resolveAiProvider } from '@/lib/ai';

interface HealthInfo {
  ok: boolean;
  time: string;
  db: 'up' | 'down';
  db_version?: string | null;
  provider: string;
}

interface DbTestResult {
  db: { ok: boolean; message: string; version?: string };
  ai: { ok: boolean; message: string };
}

interface SettingsInfo {
  db_provider: 'local' | 'supabase';
  supabase_url: string;
  supabase_has_anon: boolean;
  supabase_has_service: boolean;
  supabase_anon_key_preview: string;
  supabase_service_key_preview: string;
  local_host: string;
  local_port: string;
  local_database: string;
  local_user: string;
  local_has_password: boolean;
  local_password_preview: string;
  ai_provider: string;
  ai_model: string;
  ai_has_key: boolean;
  ai_key_preview: string;
  ai_base_url: string;
}

interface DashboardData {
  user: User | null;
  health: HealthInfo | null;
  settings: SettingsInfo | null;
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

const SUPABASE_TABLES_SQL = `-- Buat tabel di Supabase SQL Editor
create table if not exists generated_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  password text not null,
  created_at timestamptz default now()
);
create index if not exists idx_generated_accounts_user on generated_accounts (user_id);
create index if not exists idx_generated_accounts_created on generated_accounts (created_at desc);

create table if not exists password_vault (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  label text,
  password text not null,
  length int default 18,
  strength text default 'Sedang',
  use_upper boolean default true,
  use_lower boolean default true,
  use_numbers boolean default true,
  use_symbols boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_password_vault_user on password_vault (user_id);
create index if not exists idx_password_vault_created on password_vault (created_at desc);

create table if not exists form_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  gender text default 'Laki-laki',
  fullname text, email text, password text, phone text, birthdate text,
  username text, address text, job text, nik text, hobby text, education text, religion text,
  form_link text,
  created_at timestamptz default now()
);
create index if not exists idx_form_profiles_user on form_profiles (user_id);
create index if not exists idx_form_profiles_created on form_profiles (created_at desc);`;

async function fetchDashboardData(): Promise<DashboardData> {
  const [user, health, settingsRes, usageRes, accRes, vltRes, profRes] = await Promise.all([
    localApiClient.getUser(),
    fetch('/api/health').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch('/api/admin/settings').then((r) => (r.ok ? r.json() : null)).catch(() => null),
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
    settings: settingsRes?.settings ?? null,
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

function DbSettingsCard({
  saved,
  onSaved,
  showToast,
}: {
  saved: SettingsInfo | null;
  onSaved: (s: SettingsInfo) => void;
  showToast: (msg: string) => void;
}) {
  const [provider, setProvider] = useState<'local' | 'supabase'>(saved?.db_provider || 'local');
  const [url, setUrl] = useState(saved?.supabase_url || '');
  const [anonKey, setAnonKey] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [localHost, setLocalHost] = useState(saved?.local_host || '');
  const [localPort, setLocalPort] = useState(saved?.local_port || '');
  const [localDatabase, setLocalDatabase] = useState(saved?.local_database || '');
  const [localUser, setLocalUser] = useState(saved?.local_user || '');
  const [localPassword, setLocalPassword] = useState('');
  const [localPassDirty, setLocalPassDirty] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>(saved?.ai_provider || 'openai');
  const [aiModel, setAiModel] = useState(saved?.ai_model || 'gpt-4o-mini');
  const [aiBaseUrl, setAiBaseUrl] = useState(saved?.ai_base_url || '');
  const [aiKey, setAiKey] = useState('');
  const [keysDirty, setKeysDirty] = useState(false);
  const [testResult, setTestResult] = useState<DbTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_provider: provider,
          supabase_url: url,
          supabase_service_key: serviceKey,
          local_host: localHost,
          local_port: localPort,
          local_database: localDatabase,
          local_user: localUser,
          local_password: localPassword,
          ai_provider: aiProvider,
          ai_model: aiModel,
          ai_api_key: aiKey,
          ai_base_url: aiBaseUrl,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({
        db: { ok: false, message: 'Gagal menghubungi server.' },
        ai: { ok: false, message: 'Gagal menghubungi server.' },
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_provider: provider,
          supabase_url: url,
          local_host: localHost,
          local_port: localPort,
          local_database: localDatabase,
          local_user: localUser,
          ...(keysDirty || localPassDirty
            ? {
                supabase_anon_key: anonKey,
                supabase_service_key: serviceKey,
                ai_api_key: aiKey,
              }
            : {}),
          ...(localPassDirty ? { local_password: localPassword } : {}),
          ai_provider: aiProvider,
          ai_model: aiModel,
          ai_base_url: aiBaseUrl,
        }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      const data = await res.json();
      onSaved(data.settings);
      setAnonKey('');
      setServiceKey('');
      setAiKey('');
      setLocalPassword('');
      setLocalPassDirty(false);
      setKeysDirty(false);
      showToast(
        data.persisted
          ? 'Pengaturan database & AI berhasil disimpan!'
          : 'Tersimpan sementara di memori: hubungkan database agar tersimpan permanen.'
      );
    } catch {
      showToast('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_TABLES_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast('Gagal menyalin SQL.');
    }
  };

  return (
    <div className="dash-db">
      <div className="dash-form-grid">
        <div className="doc-field">
          <label>Provider Database</label>
          <select
            className="doc-font-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'local' | 'supabase')}
          >
            <option value="local">PostgreSQL Lokal</option>
            <option value="supabase">Supabase</option>
          </select>
          <p className="dash-hint">
            Data (email, vault, profil) disimpan ke provider ini. Login/session tetap memakai PostgreSQL lokal.
          </p>
        </div>

        <div className="dash-info-box">
          <strong>Kebutuhan Versi Database</strong>
          <ul>
            <li>
              <b>PostgreSQL Lokal</b> — versi <b>14.0 atau lebih baru</b> (direkomendasikan 15+).
              Isi kolom koneksi di bawah, atau biarkan kosong agar memakai <code>DATABASE_URL</code> dari
              <code> .env.local</code>. Versi terdeteksi akan tampil saat tes koneksi &amp; monitoring berhasil.
            </li>
            <li>
              <b>Supabase</b> — memakai <b>PostgreSQL 17</b> yang dikelola otomatis. Cukup isi Project URL,
              Anon Key, dan Service Role Key; database dibuatnya via tombol <i>Buat tabel di Supabase</i> di bawah.
            </li>
          </ul>
        </div>

        {provider === 'local' && (
          <>
            <div className="doc-field">
              <label>Host</label>
              <input
                className="doc-input"
                value={localHost}
                onChange={(e) => setLocalHost(e.target.value)}
                placeholder="localhost (default dari DATABASE_URL)"
              />
            </div>
            <div className="doc-field">
              <label>Port</label>
              <input
                className="doc-input"
                value={localPort}
                onChange={(e) => setLocalPort(e.target.value)}
                placeholder="5432"
              />
            </div>
            <div className="doc-field">
              <label>Nama Database</label>
              <input
                className="doc-input"
                value={localDatabase}
                onChange={(e) => setLocalDatabase(e.target.value)}
                placeholder="mis. randmail (default dari DATABASE_URL)"
              />
            </div>
            <div className="doc-field">
              <label>User</label>
              <input
                className="doc-input"
                value={localUser}
                onChange={(e) => setLocalUser(e.target.value)}
                placeholder="mis. postgres (default dari DATABASE_URL)"
              />
            </div>
            <div className="doc-field">
              <label>Password {saved?.local_has_password ? <span className="dash-saved-badge">tersimpan</span> : null}</label>
              <input
                className="doc-input"
                type="password"
                value={localPassword}
                onChange={(e) => { setLocalPassword(e.target.value); setLocalPassDirty(true); }}
                placeholder={saved?.local_password_preview || 'Biarkan kosong: default dari DATABASE_URL'}
              />
            </div>
          </>
        )}

        {provider === 'supabase' && (
          <>
            <div className="doc-field">
              <label>Supabase URL</label>
              <input
                className="doc-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxx.supabase.co"
              />
            </div>
            <div className="doc-field">
              <label>Anon Key {saved?.supabase_has_anon ? <span className="dash-saved-badge">tersimpan</span> : null}</label>
              <input
                className="doc-input"
                type="password"
                value={anonKey}
                onChange={(e) => { setAnonKey(e.target.value); setKeysDirty(true); }}
                placeholder={saved?.supabase_anon_key_preview || 'Kosongkan jika tidak diubah'}
              />
            </div>
            <div className="doc-field">
              <label>Service Role Key {saved?.supabase_has_service ? <span className="dash-saved-badge">tersimpan</span> : null}</label>
              <input
                className="doc-input"
                type="password"
                value={serviceKey}
                onChange={(e) => { setServiceKey(e.target.value); setKeysDirty(true); }}
                placeholder={saved?.supabase_service_key_preview || 'Wajib diisi untuk akses data server'}
              />
            </div>
            <details className="dash-details">
              <summary>Buat tabel di Supabase (SQL Editor)</summary>
              <p className="dash-hint">
                Jalankan SQL ini sekali di Supabase → SQL Editor, lalu klik salin di bawah:
              </p>
              <button className="btn-add-doc-row" onClick={handleCopySql} type="button">
                {copied ? '✓ Tersalin' : 'Salin SQL Tabel'}
              </button>
            </details>
          </>
        )}

        <div className="doc-field">
          <label>Provider AI</label>
          <select
            className="doc-font-select"
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {resolveAiProvider(aiProvider).requiresKey && (
            <p className="dash-hint">
              {resolveAiProvider(aiProvider).label} membutuhkan API key (bersifat rahasia).
            </p>
          )}
          {!resolveAiProvider(aiProvider).requiresKey && (
            <p className="dash-hint">
              Provider lokal — tidak membutuhkan API key eksternal.
            </p>
          )}
        </div>

        <div className="doc-field">
          <label>Model AI</label>
          <input
            className="doc-input"
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            placeholder={resolveAiProvider(aiProvider).defaultModel || 'Masukkan nama model'}
          />
        </div>

        {aiProvider === 'custom' && (
          <div className="doc-field">
            <label>Base URL API</label>
            <input
              className="doc-input"
              value={aiBaseUrl}
              onChange={(e) => setAiBaseUrl(e.target.value)}
              placeholder="https://your-api.example.com/v1"
            />
            <p className="dash-hint">Harus kompatibel format OpenAI (/chat/completions).</p>
          </div>
        )}

        {aiProvider !== 'custom' && resolveAiProvider(aiProvider).baseUrl && (
          <div className="doc-field">
            <label>Base URL (opsional)</label>
            <input
              className="doc-input"
              value={aiBaseUrl}
              onChange={(e) => setAiBaseUrl(e.target.value)}
              placeholder={resolveAiProvider(aiProvider).baseUrl}
            />
            <p className="dash-hint">
              Kosongkan untuk memakai default.
              {resolveAiProvider(aiProvider).requiresKey && ' Berganti server proxy? Isi URL baru.'}
            </p>
          </div>
        )}

        <div className="doc-field">
          <label>API Key AI {saved?.ai_has_key ? <span className="dash-saved-badge">tersimpan</span> : null}</label>
          <input
            className="doc-input"
            type="password"
            value={aiKey}
            onChange={(e) => { setAiKey(e.target.value); setKeysDirty(true); }}
            placeholder={saved?.ai_key_preview || (resolveAiProvider(aiProvider).requiresKey ? 'Wajib diisi' : 'Opsional untuk provider ini')}
          />
          <p className="dash-hint">
            {resolveAiProvider(aiProvider).requiresKey
              ? 'Kosongkan untuk memakai mode panduan offline (FAQ).'
              : 'Provider ini tidak membutuhkan key; tinggalkan kolom ini kosong saja.'}
          </p>
        </div>
      </div>

      <div className="dash-form-actions">
        <button className="btn-export" onClick={handleTest} disabled={testing} type="button">
          {testing ? 'Menguji...' : '🧪 Tes Koneksi'}
        </button>
        <button className="btn-generate" onClick={handleSave} disabled={saving} type="button">
          {saving ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
        </button>
      </div>

      {testResult && (
        <div className="dash-test-results">
          <div className={`dash-test-row ${testResult.db.ok ? 'ok' : 'bad'}`}>
            <span>Database:</span> {testResult.db.message}
          </div>
          {testResult.db.ok && testResult.db.version && (
            <div className="dash-test-row ok" style={{ opacity: 0.75 }}>
              <span>Versi Terdeteksi:</span> {testResult.db.version}
            </div>
          )}
          <div className={`dash-test-row ${testResult.ai.ok ? 'ok' : 'bad'}`}>
            <span>AI:</span> {testResult.ai.message}
          </div>
        </div>
      )}
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
  const [confirmClean, setConfirmClean] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  }, []);

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

  const handleCleanupConfirm = async () => {
    setCleaning(true);
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeHistory: true }),
      });
      const result = await res.json();

      // Bersihkan cache browser
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        // ignore
      }
      clearLocalUsage();

      showToast(`Bersih: ${result.expiredSessions} session expired & semua history dihapus.`);
      const d = await fetchDashboardData();
      setData(d);
    } catch {
      showToast('Gagal membersihkan. Database mungkin tidak aktif.');
    } finally {
      setCleaning(false);
    }
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
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M4 8L16 18L28 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="page-hero-title">Selamat datang, {name} 👋</h2>
            <p className="page-hero-sub">Ringkasan pemakaian, monitoring, koneksi database, dan AI bantuan.</p>
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

      {/* Cache & History */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>🧹 Cache &amp; History</h3>
          <span className="info-badge">Pembersihan backend</span>
        </div>
        <p className="dash-hint">
          Bersihkan sampah backend: session yang sudah kadaluarsa (di semua user), semua history
          data Anda (email, vault, profil), dan cache aplikasi di browser ini.
        </p>
        <div className="dash-form-actions">
          <button
            className="btn-delete-all-profiles"
            onClick={() => setConfirmClean(true)}
            disabled={cleaning}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {cleaning ? 'Membersihkan...' : 'Bersihkan Cache & History'}
          </button>
        </div>
      </section>

      {/* Database & AI */}
      {data && (
        <section className="tools-card-section">
          <div className="section-header-row">
            <h3>🗄️ Koneksi Database &amp; AI Chatbot</h3>
            <span className="info-badge">{data.settings?.db_provider === 'supabase' ? 'Supabase' : 'Lokal'}</span>
          </div>
          <DbSettingsCard
            key={JSON.stringify(data.settings)}
            saved={data.settings}
            onSaved={(s) => setData((prev) => (prev ? { ...prev, settings: s } : prev))}
            showToast={showToast}
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

      {confirmClean && (
        <SecureDeleteModal
          isOpen={confirmClean}
          title="Bersihkan Cache & History"
          itemDescription="Semua data history + session expired + cache browser"
          onConfirm={handleCleanupConfirm}
          onClose={() => setConfirmClean(false)}
        />
      )}

      <Toast message={toastMessage} />
    </div>
  );
}