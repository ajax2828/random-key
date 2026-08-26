'use client';

import React, { useState, useEffect, useCallback } from 'react';
import EmailSettings from '@/components/EmailSettings';
import PasswordSettings from '@/components/PasswordSettings';
import GenerateControls from '@/components/GenerateControls';
import ResultsList from '@/components/ResultsList';
import Toast from '@/components/Toast';
import {
  EmailOptions,
  PasswordOptions,
  generateEmail,
  generatePassword,
} from '@/lib/generators';
import { CredentialPair } from '@/components/ResultItem';
import { createClient } from '@/utils/supabase/client';
import SecureDeleteModal from '@/components/SecureDeleteModal';

export default function DashboardPage() {
  const [emailOpts, setEmailOpts] = useState<EmailOptions>({
    style: 'random',
    length: 10,
    domain: '@gmail.com',
    includeNumbers: true,
    includeDots: false,
  });

  const [passOpts, setPassOpts] = useState<PasswordOptions>({
    length: 16,
    useUpper: true,
    useLower: true,
    useNumbers: true,
    useSymbols: true,
  });

  const [quantity, setQuantity] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<CredentialPair[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const supabase = createClient();

  // Load existing credentials from Supabase on mount
  const loadCredentials = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('generated_accounts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching credentials:', error);
    } else if (data) {
      setResults(data as CredentialPair[]);
    }
  }, [supabase, setResults]);

  useEffect(() => {
    loadCredentials();
  }, []);

  // Show Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  // Generate & Save to Supabase
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newPairsToInsert = [];
      for (let i = 0; i < quantity; i++) {
        newPairsToInsert.push({
          user_id: user.id,
          email: generateEmail(emailOpts),
          password: generatePassword(passOpts),
        });
      }

      const { data, error } = await supabase
        .from('generated_accounts')
        .insert(newPairsToInsert)
        .select('*');

      if (error) {
        // Fallback: If table RLS or DB error occurs, show local results with notice
        console.error('Supabase save error:', error);
        showToast('Generated locally! (DB error: check RLS policies)');
        const fallbackPairs: CredentialPair[] = newPairsToInsert.map((item, idx) => ({
          id: `local-${Date.now()}-${idx}`,
          email: item.email,
          password: item.password,
        }));
        setResults((prev) => [...fallbackPairs, ...prev]);
      } else if (data) {
        showToast(`Generated & saved ${data.length} pairs!`);
        setResults((prev) => [...(data as CredentialPair[]), ...prev]);
      }
    } catch (err) {
      console.error('Generation error:', err);
      showToast('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [emailOpts, passOpts, quantity, showToast, supabase]);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string; mode?: 'single' | 'all' } | null>(null);

  // Trigger 2-Step Secure Delete Modal — single
  const handleDeleteRequest = (id: string) => {
    const target = results.find((r) => r.id === id);
    if (target) {
      setDeleteTarget({ id: target.id, email: target.email, mode: 'single' });
    }
  };

  // Trigger 2-Step Secure Delete Modal — all
  const handleDeleteAllRequest = () => {
    setDeleteTarget({ id: '__ALL__', email: `Semua ${results.length} akun email & password`, mode: 'all' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.mode === 'all') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('generated_accounts').delete().eq('user_id', user.id);
      }
      setResults([]);
      showToast('Semua akun email & password berhasil dihapus!');
    } else {
      const { id } = deleteTarget;
      setResults((prev) => prev.filter((item) => item.id !== id));
      if (!id.startsWith('local-')) {
        await supabase.from('generated_accounts').delete().eq('id', id);
      }
      showToast('Akun email & password berhasil dihapus!');
    }
  };

  // Copy Handler
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast('Copy failed');
    }
  };

  // Export CSV
  const handleExport = () => {
    if (results.length === 0) {
      showToast('No data to export');
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

    showToast(`Exported ${results.length} pairs!`);
  };

  // Keyboard shortcut (Ctrl/Cmd + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emailOpts, passOpts, quantity]);

  return (
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
            <p className="page-hero-sub">Generator Email & Password acak — Tersimpan otomatis ke Supabase</p>
          </div>
        </div>
        <div className="page-hero-badges">
          <span className="hero-badge badge-violet">📧 Email Generator</span>
          <span className="hero-badge badge-cyan">🔑 Password Secure</span>
          <span className="hero-badge badge-emerald">💾 Supabase Sync</span>
        </div>
      </section>

      <section className="controls-section">
        <div className="controls-grid">
          <EmailSettings options={emailOpts} onChange={setEmailOpts} />
          <PasswordSettings options={passOpts} onChange={setPassOpts} />
        </div>

        <GenerateControls
          quantity={quantity}
          onQuantityChange={setQuantity}
          onGenerate={handleGenerate}
          onExport={handleExport}
          isGenerating={isGenerating}
        />
      </section>

      <section className="results-section">
        <div className="results-header">
          <div className="results-header-left">
            <h2>Generated Credentials</h2>
            {results.length > 0 && (
              <span className="results-count-badge">{results.length} pairs</span>
            )}
          </div>
          {results.length > 0 && (
            <div className="results-toolbar">
              <button
                className="toolbar-btn toolbar-btn-copy"
                onClick={() => {
                  const allText = results.map((r) => `${r.email}\n${r.password}`).join('\n---\n');
                  navigator.clipboard.writeText(allText);
                  showToast('Semua akun berhasil disalin!');
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Salin Semua
              </button>
              <button className="toolbar-btn toolbar-btn-danger" onClick={handleDeleteAllRequest}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Hapus Semua
              </button>
            </div>
          )}
        </div>

        <ResultsList
          pairs={results}
          onCopy={handleCopy}
          onDelete={handleDeleteRequest}
        />
      </section>

      <SecureDeleteModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.mode === 'all' ? 'Hapus Semua Akun' : 'Hapus Akun'}
        itemDescription={deleteTarget?.email || ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
