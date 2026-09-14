'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast';
import SecureDeleteModal from '@/components/SecureDeleteModal';

interface HistoryItem {
  id: string;
  email: string;
  password: string;
  created_at: string;
  source: 'account' | 'profile' | 'vault';
  fullname?: string;
  phone?: string;
  username?: string;
  label?: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'account' | 'profile' | 'vault'>('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string; source: 'account' | 'profile' | 'vault'; mode: 'single' | 'all' } | null>(null);

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);

      try {
        // Fetch from all three local API endpoints
        const [accRes, profRes, vaultRes] = await Promise.all([
          fetch('/api/accounts').then((r) => (r.ok ? r.json() : { data: [] })),
          fetch('/api/profiles').then((r) => (r.ok ? r.json() : { data: [] })),
          fetch('/api/vault').then((r) => (r.ok ? r.json() : { data: [] })),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accounts: any[] = (await accRes.data) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profiles: any[] = (await profRes.data) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vaultItems: any[] = (await vaultRes.data) || [];

        // Merge into unified HistoryItem list
        const accountItems: HistoryItem[] = accounts.map((a) => ({
          id: a.id,
          email: a.email,
          password: a.password,
          created_at: a.created_at,
          source: 'account' as const,
        }));

        const profileItems: HistoryItem[] = profiles
          .filter((p) => p.email || p.fullname)
          .map((p) => ({
            id: p.id,
            email: p.email || '',
            password: p.password || '',
            created_at: p.created_at,
            source: 'profile' as const,
            fullname: p.fullname || undefined,
            phone: p.phone || undefined,
            username: p.username || undefined,
          }));

        const vaultHistoryItems: HistoryItem[] = vaultItems.map((v) => ({
          id: v.id,
          email: v.label ? `[Vault] ${v.label}` : '[Password Vault]',
          password: v.password,
          created_at: v.created_at,
          source: 'vault' as const,
          label: v.label || undefined,
        }));

        // Combine and sort by created_at descending
        const merged = [...accountItems, ...profileItems, ...vaultHistoryItems].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        if (!ignore) {
          setHistory(merged);
        }
      } catch (err) {
        console.error('History load error:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  }, []);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast('Copy failed');
    }
  };

  // Delete single - triggers SecureDeleteModal
  const handleDeleteRequest = (item: HistoryItem) => {
    setDeleteTarget({
      id: item.id,
      email: item.email || item.fullname || 'Unknown',
      source: item.source,
      mode: 'single',
    });
  };

  // Delete all - triggers SecureDeleteModal
  const handleClearAllRequest = () => {
    setDeleteTarget({
      id: '__ALL__',
      email: `Semua ${filteredHistory.length} data`,
      source: 'account',
      mode: 'all',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.mode === 'all') {
      // Delete from all local API tables
      await fetch('/api/accounts?all=true', { method: 'DELETE' });
      await fetch('/api/profiles?all=true', { method: 'DELETE' });
      await fetch('/api/vault?all=true', { method: 'DELETE' });
      setHistory([]);
      showToast('Semua history berhasil dihapus!');
    } else {
      const { id, source } = deleteTarget;
      const tableMap = {
        account: '/api/accounts',
        profile: '/api/profiles',
        vault: '/api/vault',
      };
      const base = tableMap[source];
      await fetch(`${base}?id=${id}`, { method: 'DELETE' });
      setHistory((prev) => prev.filter((item) => item.id !== id));
      showToast('Data berhasil dihapus!');
    }
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      showToast('No history to export');
      return;
    }

    let csv = 'No,Source,Email/Label,Password,Nama,Username,CreatedAt\n';
    filteredHistory.forEach((item, index) => {
      const srcName =
        item.source === 'account'
          ? 'Email Generator'
          : item.source === 'profile'
          ? 'Form Profiler'
          : 'Password Vault';

      csv += `${index + 1},"${srcName}","${item.email}","${item.password}","${item.fullname || ''}","${item.username || ''}","${item.created_at}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `randmail_history_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredHistory.length} items`);
  };

  // Filter by search term + source type
  const filteredHistory = history.filter((item) => {
    const matchSearch =
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.password.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fullname && item.fullname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.label && item.label.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchSource = sourceFilter === 'all' || item.source === sourceFilter;

    return matchSearch && matchSource;
  });

  const accountCount = history.filter((i) => i.source === 'account').length;
  const profileCount = history.filter((i) => i.source === 'profile').length;
  const vaultCount = history.filter((i) => i.source === 'vault').length;

  return (
    <div className="results-section">
      <div className="results-header">
        <div>
          <h2>Account &amp; Password History</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Data dari GeneratMail ({accountCount}), GeneratPass ({vaultCount}), &amp; GeneratPro ({profileCount})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-export" onClick={handleExportCSV} type="button">
            Export CSV
          </button>
          {history.length > 0 && (
            <button className="btn-delete-all-profiles" onClick={handleClearAllRequest} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="history-search-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Cari berdasarkan email, label, password, nama, atau username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <div className="history-source-filter">
          <button
            className={`source-filter-btn ${sourceFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSourceFilter('all')}
            type="button"
          >
            Semua ({history.length})
          </button>
          <button
            className={`source-filter-btn ${sourceFilter === 'account' ? 'active' : ''}`}
            onClick={() => setSourceFilter('account')}
            type="button"
          >
            📧 Email ({accountCount})
          </button>
          <button
            className={`source-filter-btn ${sourceFilter === 'vault' ? 'active' : ''}`}
            onClick={() => setSourceFilter('vault')}
            type="button"
          >
            🔑 Vault ({vaultCount})
          </button>
          <button
            className={`source-filter-btn ${sourceFilter === 'profile' ? 'active' : ''}`}
            onClick={() => setSourceFilter('profile')}
            type="button"
          >
            👤 Profil ({profileCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading history dari database...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state">
          <p>{searchTerm ? 'Tidak ada data yang cocok.' : 'Belum ada data tersimpan.'}</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Sumber</th>
                <th>Email / Label</th>
                <th>Password</th>
                <th>Info Tambahan</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, idx) => (
                <tr key={`${item.source}-${item.id}`}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <span
                      className={`source-badge ${
                        item.source === 'account'
                          ? 'source-account'
                          : item.source === 'vault'
                          ? 'source-vault'
                          : 'source-profile'
                      }`}
                    >
                      {item.source === 'account' ? '📧 Email' : item.source === 'vault' ? '🔑 Vault' : '👤 Profil'}
                    </span>
                  </td>
                  <td>
                    {item.email ? (
                      <span
                        className="result-value"
                        title="Copy Email/Label"
                        onClick={() => handleCopy(item.email, 'Email/Label copied!')}
                      >
                        {item.email}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {item.password ? (
                      <span
                        className="result-value"
                        title="Copy Password"
                        onClick={() => handleCopy(item.password, 'Password copied!')}
                      >
                        {item.password}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {item.source === 'profile' && (item.fullname || item.username) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {item.fullname && (
                          <span
                            className="result-value"
                            title="Copy Nama"
                            onClick={() => handleCopy(item.fullname!, 'Nama copied!')}
                            style={{ fontSize: '0.78rem' }}
                          >
                            {item.fullname}
                          </span>
                        )}
                        {item.username && (
                          <span
                            style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                          >
                            @{item.username}
                          </span>
                        )}
                      </div>
                    ) : item.source === 'vault' && item.label ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                        🏷️ {item.label}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-action"
                        title="Copy Email & Password"
                        onClick={() =>
                          handleCopy(
                            [item.email, item.password, item.fullname || item.label].filter(Boolean).join('\n'),
                            'Copied!'
                          )
                        }
                        type="button"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                      <button
                        className="btn-action delete"
                        title="Delete"
                        onClick={() => handleDeleteRequest(item)}
                        type="button"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <SecureDeleteModal
          isOpen={!!deleteTarget}
          title={deleteTarget?.mode === 'all' ? 'Hapus Semua History' : 'Hapus Data'}
          itemDescription={deleteTarget?.email || ''}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
