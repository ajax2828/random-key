'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast';
import SecureDeleteModal from '@/components/SecureDeleteModal';
import EmailSettings from '@/components/EmailSettings';
import PasswordSettings from '@/components/PasswordSettings';
import GenerateControls from '@/components/GenerateControls';
import ResultsList from '@/components/ResultsList';
import { NoticeProvider, useNotice } from '@/components/NoticeNotification';
import AiAssistant from '@/components/AiAssistant';
import { CredentialPair } from '@/components/ResultItem';
import { localApiClient } from '@/utils/supabase/client';
import { EmailOptions, PasswordOptions, generateEmail, generatePassword } from '@/lib/generators';
import { trackUsage } from '@/lib/usage';

interface ApiCredential {
  id: string;
  email: string;
  password: string;
  created_at: string;
}

export default function GeneratePage() {
  const [emailOpts, setEmailOpts] = useState<EmailOptions>({
    style: 'name',
    length: 8,
    domain: 'random',
    includeNumbers: true,
    includeDots: true,
  });

  const [passOpts, setPassOpts] = useState<PasswordOptions>({
    length: 14,
    useUpper: true,
    useLower: true,
    useNumbers: true,
    useSymbols: false,
  });

  const [quantity, setQuantity] = useState(5);
  const [results, setResults] = useState<CredentialPair[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string; mode?: 'single' | 'all' } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  }, []);

  const { showNotice } = useNotice();

  // Load existing credentials from local API on mount
  useEffect(() => {
    let ignore = false;

    (async () => {
      const user = await localApiClient.getUser();
      if (!user || ignore) return;

      try {
        const res = await fetch('/api/accounts');
        if (!res.ok) return;
        const { data } = await res.json() as { data: ApiCredential[] };
        if (!ignore) {
          setResults(data.map((d) => ({
            id: d.id,
            email: d.email,
            password: d.password,
            created_at: d.created_at,
          })));
        }
      } catch (err) {
        console.error('Error fetching credentials:', err);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // Generate emails & passwords
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const user = await localApiClient.getUser();
      const generatedList: CredentialPair[] = [];

      for (let i = 0; i < quantity; i++) {
        const email = generateEmail(emailOpts);
        const password = generatePassword(passOpts);
        generatedList.push({
          id: `local-${Date.now()}-${i}`,
          email,
          password,
          created_at: new Date().toISOString(),
        });
      }
      trackUsage('mail', 'generate');

      if (user) {
        const toInsert = generatedList.map((item) => ({
          email: item.email,
          password: item.password,
        }));

        try {
          const res = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toInsert),
          });
          const result = await res.json();
          if (res.ok && result.data) {
            setResults((prev) => [...result.data, ...prev]);
            showNotice('Data Tersimpan', `Tersimpan ${result.data.length} pasangan ke database!`);
          } else {
            // Fallback to local-only
            setResults((prev) => [...generatedList, ...prev]);
            showToast(`Generated ${quantity} data secara lokal! (Notice DB)`);
            showToast('Data tidak tersimpan ke database: koneksi tidak tersedia.');
          }
        } catch (err) {
          console.warn('Save fallback (local):', err);
          setResults((prev) => [...generatedList, ...prev]);
          showToast(`Generated ${quantity} data secara lokal! (Notice DB)`);
          showToast('Data tidak tersimpan ke database: koneksi tidak dapat dijangkau.');
        }
      } else {
        setResults((prev) => [...generatedList, ...prev]);
        showToast(`Generated ${quantity} pasangan!`);
        showToast('Data tidak tersimpan ke database: belum login. Log in terlebih dahulu.');
      }
    } catch (err) {
      console.error('Generation error:', err);
      showToast('Gagal generate data');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete handlers
  const handleDeleteRequest = (id: string) => {
    const target = results.find((r) => r.id === id);
    if (target) {
      setDeleteTarget({ id: target.id, email: target.email, mode: 'single' });
    }
  };

  const handleDeleteAllRequest = () => {
    setDeleteTarget({ id: '__ALL__', email: `Semua ${results.length} akun email & password`, mode: 'all' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.mode === 'all') {
      await fetch('/api/accounts?all=true', { method: 'DELETE' });
      setResults([]);
      showToast('Semua akun email & password berhasil dihapus!');
    } else {
      const { id } = deleteTarget;
      setResults((prev) => prev.filter((item) => item.id !== id));
      if (!id.startsWith('local-')) {
        await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
      }
      showToast('Akun email & password berhasil dihapus!');
    }
  };

  // Copy handler
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast('Gagal menyalin!');
    }
  };

  // Export CSV
  const handleExport = () => {
    if (results.length === 0) {
      showToast('Tidak ada data untuk diekspor');
      return;
    }

    let csv = 'No,Email,Password,CreatedAt\n';
    results.forEach((item, index) => {
      csv += `${index + 1},"${item.email}","${item.password}","${item.created_at || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `randmail_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Berhasil mengekspor ${results.length} pasangan!`);
  };

  return (
    <NoticeProvider>
    <div>
      {/* Page Hero Header */}
      <section className="page-hero-header">
        <div className="page-hero-left">
          <div className="page-hero-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 8L16 18L28 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="page-hero-title">GeneratMail</h2>
            <p className="page-hero-sub">Generate email & password acak — langsung tersimpan ke database lokal</p>
          </div>
        </div>
        <div className="page-hero-badges">
          <span className="hero-badge" style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>✉️ Email</span>
          <span className="hero-badge" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4' }}>🔐 Password</span>
          <span className="hero-badge" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>💾 Local DB</span>
        </div>
      </section>

      {/* Settings Grid */}
      <div className="controls-grid">
        <EmailSettings options={emailOpts} onChange={setEmailOpts} />
        <PasswordSettings options={passOpts} onChange={setPassOpts} />
      </div>

      {/* Generate Controls */}
      <GenerateControls
        quantity={quantity}
        onQuantityChange={setQuantity}
        onGenerate={handleGenerate}
        onExport={handleExport}
        isGenerating={isGenerating}
      />

      {/* Results */}
      <section className="results-section">
        <div className="results-header">
          <div className="results-header-left">
            <h3>Hasil GeneratMail</h3>
            {results.length > 0 && (
              <span className="results-count-badge">{results.length} pasangan</span>
            )}
          </div>
          {results.length > 0 && (
            <div className="results-toolbar">
              <button className="toolbar-btn toolbar-btn-copy" onClick={() => {
                const all = results.map((r) => `${r.email},${r.password}`).join('\n');
                handleCopy(all, 'Semua email & password berhasil disalin!');
              }}>Salin Semua</button>
              <button className="toolbar-btn toolbar-btn-danger" onClick={handleDeleteAllRequest}>Hapus Semua</button>
            </div>
          )}
        </div>

        <ResultsList
          pairs={results}
          onCopy={handleCopy}
          onDelete={handleDeleteRequest}
        />
      </section>

      {deleteTarget && (
        <SecureDeleteModal
          isOpen={!!deleteTarget}
          title={deleteTarget?.mode === 'all' ? 'Hapus Semua Akun' : 'Hapus Akun'}
          itemDescription={deleteTarget?.email || ''}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <Toast message={toastMessage} />

      <AiAssistant topic="mail" title="AI Bantuan GeneratMail" />
    </div>
    </NoticeProvider>
  );
}
