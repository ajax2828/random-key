'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PasswordOptions, generatePassword } from '@/lib/generators';
import Toast from '@/components/Toast';
import SecureGenerateModal from '@/components/SecureGenerateModal';
import SecureDeleteModal from '@/components/SecureDeleteModal';
import { createClient } from '@/utils/supabase/client';

interface SavedPasswordItem {
  id: string;
  label: string | null;
  password: string;
  length: number;
  strength: string;
  use_upper: boolean;
  use_lower: boolean;
  use_numbers: boolean;
  use_symbols: boolean;
  created_at: string;
}

export default function GeneratPassPage() {
  const [passOpts, setPassOpts] = useState<PasswordOptions>({
    length: 18,
    useUpper: true,
    useLower: true,
    useNumbers: true,
    useSymbols: true,
  });

  const [labelInput, setLabelInput] = useState('');
  const [results, setResults] = useState<SavedPasswordItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Modals state
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string; mode: 'single' | 'all' } | null>(null);

  const supabase = createClient();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  }, []);

  // Fetch passwords from Supabase password_vault
  const loadVaultFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('password_vault')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Supabase password_vault fetch error:', error.message);
      } else if (data) {
        setResults(data as SavedPasswordItem[]);
      }
    } catch (err) {
      console.error('Error loading vault:', err);
    }
  }, [supabase]);

  useEffect(() => {
    loadVaultFromSupabase();
  }, [loadVaultFromSupabase]);

  // Evaluate password strength
  const getStrengthLabel = (opts: PasswordOptions): string => {
    let score = 0;
    if (opts.length >= 12) score += 1;
    if (opts.length >= 18) score += 1;
    if (opts.useUpper) score += 1;
    if (opts.useLower) score += 1;
    if (opts.useNumbers) score += 1;
    if (opts.useSymbols) score += 1;

    if (score >= 5) return 'Sangat Kuat 🛡️';
    if (score >= 3) return 'Kuat 💪';
    return 'Sedang ⚠️';
  };

  // Step 1 of Generation: Open 2-Step Verification Modal
  const handleOpenGenerateModal = () => {
    if (!passOpts.useUpper && !passOpts.useLower && !passOpts.useNumbers && !passOpts.useSymbols) {
      showToast('Pilih minimal 1 opsi karakter password!');
      return;
    }
    setIsGenModalOpen(true);
  };

  // Step 2 of Generation: Confirmed through 2-Step Verification
  const handleConfirmedGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const generatedPass = generatePassword(passOpts);
      const strength = getStrengthLabel(passOpts);

      if (user) {
        const toInsert = {
          user_id: user.id,
          label: labelInput.trim() || null,
          password: generatedPass,
          length: passOpts.length,
          strength: strength.replace(/[^a-zA-Z\s]/g, '').trim(),
          use_upper: passOpts.useUpper,
          use_lower: passOpts.useLower,
          use_numbers: passOpts.useNumbers,
          use_symbols: passOpts.useSymbols,
        };

        const { data, error } = await supabase
          .from('password_vault')
          .insert([toInsert])
          .select('*');

        if (error) {
          console.warn('Supabase insert notice (fallback local):', error.message);
          const fallbackItem: SavedPasswordItem = {
            id: `local-${Date.now()}`,
            label: labelInput.trim() || 'Password Baru',
            password: generatedPass,
            length: passOpts.length,
            strength: strength,
            use_upper: passOpts.useUpper,
            use_lower: passOpts.useLower,
            use_numbers: passOpts.useNumbers,
            use_symbols: passOpts.useSymbols,
            created_at: new Date().toISOString(),
          };
          setResults((prev) => [fallbackItem, ...prev]);
          showToast('Password dibuat secara lokal! (Notice DB)');
        } else if (data && data.length > 0) {
          setResults((prev) => [data[0] as SavedPasswordItem, ...prev]);
          showToast('Password baru berhasil dibuat & tersimpan di Supabase!');
        }
      } else {
        const localItem: SavedPasswordItem = {
          id: `local-${Date.now()}`,
          label: labelInput.trim() || 'Password Baru',
          password: generatedPass,
          length: passOpts.length,
          strength: strength,
          use_upper: passOpts.useUpper,
          use_lower: passOpts.useLower,
          use_numbers: passOpts.useNumbers,
          use_symbols: passOpts.useSymbols,
          created_at: new Date().toISOString(),
        };
        setResults((prev) => [localItem, ...prev]);
        showToast('Password berhasil dibuat!');
      }

      setLabelInput('');
    } catch (err) {
      console.error('Password generation error:', err);
      showToast('Gagal membuat password');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast('Gagal menyalin password');
    }
  };

  const handleCopyAllVault = async () => {
    if (results.length === 0) {
      showToast('Tidak ada data untuk disalin');
      return;
    }
    const allText = results
      .map((item, idx) => `[#${idx + 1}] ${item.label || 'Password'}: ${item.password}`)
      .join('\n');
    await handleCopyText(allText, 'Semua password berhasil disalin!');
  };

  // Delete handlers
  const handleDeleteRequest = (item: SavedPasswordItem) => {
    setDeleteTarget({
      id: item.id,
      label: item.label || `Password (${item.password.slice(0, 4)}***)`,
      mode: 'single',
    });
  };

  const handleDeleteAllRequest = () => {
    setDeleteTarget({
      id: '__ALL__',
      label: `Semua ${results.length} password tersimpan`,
      mode: 'all',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.mode === 'all') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('password_vault').delete().eq('user_id', user.id);
      }
      setResults([]);
      showToast('Semua password di vault berhasil dihapus!');
    } else {
      const { id } = deleteTarget;
      if (!id.startsWith('local-')) {
        await supabase.from('password_vault').delete().eq('id', id);
      }
      setResults((prev) => prev.filter((item) => item.id !== id));
      showToast('Password berhasil dihapus!');
    }
  };

  return (
    <div className="formfill-container">
      {/* Page Hero Header */}
      <section className="page-hero-header">
        <div className="page-hero-left">
          <div className="page-hero-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #34d399)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h2 className="page-hero-title">GeneratPass</h2>
            <p className="page-hero-sub">Generator Password Tunggal (1 per 1) dengan Verifikasi 2-Langkah & Supabase Vault</p>
          </div>
        </div>
        <div className="page-hero-badges">
          <span className="hero-badge badge-cyan">🔒 1-by-1 Secure</span>
          <span className="hero-badge badge-violet">🛡️ Verifikasi 2-Langkah</span>
          <span className="hero-badge badge-emerald">💾 Supabase Vault</span>
        </div>
      </section>

      {/* Generator Form Section */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>Konfigurasi Password Tunggal</h3>
          <span className="info-badge badge-cyan">⚠️ Maksimal 1 Password Per Generate</span>
        </div>

        <div className="pass-config-body">
          {/* Label / Peruntukan Password */}
          <div className="form-input-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="pass-label-input">Label / Catatan Akun (Opsional):</label>
            <div className="url-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              <input
                id="pass-label-input"
                type="text"
                placeholder="Contoh: Akun Instagram Utama, Password Wifi, Email Kerja"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
              />
            </div>
          </div>

          {/* Options Grid */}
          <div className="pass-opts-grid">
            <div className="pass-opt-card">
              <div className="opt-label-row">
                <label>Panjang Password:</label>
                <span className="opt-val-badge">{passOpts.length} Karakter</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={passOpts.length}
                onChange={(e) => setPassOpts({ ...passOpts, length: parseInt(e.target.value) })}
                className="range-slider-pass"
              />
            </div>

            <div className="pass-opt-card">
              <label className="opt-label-title">Kekuatan password:</label>
              <div className="strength-indicator-badge">
                {getStrengthLabel(passOpts)}
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pass-switches-row">
            <label className={`switch-chip ${passOpts.useUpper ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={passOpts.useUpper}
                onChange={(e) => setPassOpts({ ...passOpts, useUpper: e.target.checked })}
              />
              <span>Huruf Besar (A-Z)</span>
            </label>

            <label className={`switch-chip ${passOpts.useLower ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={passOpts.useLower}
                onChange={(e) => setPassOpts({ ...passOpts, useLower: e.target.checked })}
              />
              <span>Huruf Kecil (a-z)</span>
            </label>

            <label className={`switch-chip ${passOpts.useNumbers ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={passOpts.useNumbers}
                onChange={(e) => setPassOpts({ ...passOpts, useNumbers: e.target.checked })}
              />
              <span>Angka (0-9)</span>
            </label>

            <label className={`switch-chip ${passOpts.useSymbols ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={passOpts.useSymbols}
                onChange={(e) => setPassOpts({ ...passOpts, useSymbols: e.target.checked })}
              />
              <span>Simbol (@#$%!*)</span>
            </label>
          </div>

          {/* Action Row */}
          <div className="pass-generate-action-bar">
            <div className="qty-notice-box">
              <span className="qty-lock-icon">🔒</span>
              <span>Jumlah dibatasi <strong>1 per 1</strong> (Verifikasi 2-Langkah Diperlukan)</span>
            </div>

            <button
              className="btn-generate btn-pass-gen"
              onClick={handleOpenGenerateModal}
              disabled={isGenerating}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>{isGenerating ? 'Membuat...' : '🔑 Generate 1 Password (2-Langkah)'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Saved Password Vault List */}
      <section className="results-section">
        <div className="results-header">
          <div className="results-header-left">
            <h3>Vault Password Tersimpan</h3>
            {results.length > 0 && (
              <span className="results-count-badge">{results.length} password</span>
            )}
          </div>
          {results.length > 0 && (
            <div className="results-toolbar">
              <button className="toolbar-btn toolbar-btn-copy" onClick={handleCopyAllVault}>
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

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p>Belum ada password tersimpan di vault. Klik "Generate 1 Password" di atas.</p>
          </div>
        ) : (
          <div className="pass-vault-list">
            {results.map((item, idx) => {
              const isVisible = visiblePasswords[item.id] || false;
              return (
                <div key={item.id} className="pass-vault-card">
                  <div className="vault-card-left">
                    <span className="vault-index">#{idx + 1}</span>
                    <div className="vault-info">
                      <span className="vault-label-text">{item.label || 'Password Tanpa Label'}</span>
                      <span className="vault-meta-text">
                        {item.length} Karakter • {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="vault-card-middle">
                    <div className="password-display-box">
                      <span className="pass-masked-value">
                        {isVisible ? item.password : '•'.repeat(Math.min(item.password.length, 24))}
                      </span>
                      <button
                        type="button"
                        className="btn-toggle-eye"
                        onClick={() => toggleVisibility(item.id)}
                        title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {isVisible ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <div className="vault-card-right">
                    <button
                      className="btn-action-vault copy"
                      onClick={() => handleCopyText(item.password, 'Password berhasil disalin!')}
                      title="Salin Password"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Salin
                    </button>
                    <button
                      className="btn-action-vault delete"
                      onClick={() => handleDeleteRequest(item)}
                      title="Hapus Password"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2-Step Generate Modal */}
      <SecureGenerateModal
        isOpen={isGenModalOpen}
        onConfirm={handleConfirmedGenerate}
        onClose={() => setIsGenModalOpen(false)}
        label={labelInput.trim() || undefined}
      />

      {/* 2-Step Delete Modal */}
      <SecureDeleteModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.mode === 'all' ? 'Hapus Semua Password Vault' : 'Hapus Password Vault'}
        itemDescription={deleteTarget?.label || ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
