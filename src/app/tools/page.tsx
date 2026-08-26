'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  generateFormFillerProfile,
  FormFillerProfileOptions,
  GeneratedProfile,
  buildFormQueryString,
  buildFormAutofillScript,
} from '@/lib/formFillerGenerator';
import Toast from '@/components/Toast';
import SecureDeleteModal from '@/components/SecureDeleteModal';
import { createClient } from '@/utils/supabase/client';

export default function ToolsPage() {
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({
    fullname: true,
    email: true,
    password: true,
    phone: true,
    birthdate: false,
    username: false,
    address: false,
    job: false,
    nik: false,
    hobby: false,
    education: false,
    religion: false,
  });

  const [options, setOptions] = useState<FormFillerProfileOptions>({
    gender: 'random',
    nameStyle: 'full',
    emailDomain: 'random',
    emailStyle: 'name',
    passOpts: {
      length: 12,
      useUpper: true,
      useLower: true,
      useNumbers: true,
      useSymbols: false,
    },
    phonePrefix: 'random',
    phoneFormat: 'dash',
    ageMin: 18,
    ageMax: 35,
    dateFormat: 'id',
    usernameStyle: 'name_num',
    addressType: 'full',
    jobSector: 'random',
    nikProvince: 'random',
    hobbyCount: 2,
    educationLevel: 'random',
    religionVal: 'random',
  });

  const [quantity, setQuantity] = useState(5);
  const [results, setResults] = useState<GeneratedProfile[]>([]);
  const [formLink, setFormLink] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Delete state for SecureDeleteModal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string; mode: 'single' | 'all' } | null>(null);

  const supabase = createClient();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  // Load profiles from Supabase database on page load
  const loadProfilesFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('form_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Supabase form_profiles fetch notice:', error.message);
      } else if (data && data.length > 0) {
        setResults(data as GeneratedProfile[]);
        setSelectedProfileId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
    }
  }, [supabase]);

  useEffect(() => {
    loadProfilesFromSupabase();
  }, [loadProfilesFromSupabase]);

  const handleToggleField = (field: string) => {
    setActiveFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Generate & Save Profiles to Supabase
  const handleGenerate = async () => {
    const hasActiveField = Object.values(activeFields).some((val) => val);
    if (!hasActiveField) {
      showToast('Pilih minimal satu field!');
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const generatedList: GeneratedProfile[] = [];

      for (let i = 0; i < quantity; i++) {
        const p = generateFormFillerProfile(activeFields, options);
        if (formLink.trim()) p.form_link = formLink.trim();
        generatedList.push(p);
      }

      if (user) {
        // Prepare items for Supabase insert
        const toInsert = generatedList.map((item) => ({
          user_id: user.id,
          gender: item.gender,
          fullname: item.fullname || null,
          email: item.email || null,
          password: item.password || null,
          phone: item.phone || null,
          birthdate: item.birthdate || null,
          username: item.username || null,
          address: item.address || null,
          job: item.job || null,
          nik: item.nik || null,
          hobby: item.hobby || null,
          education: item.education || null,
          religion: item.religion || null,
          form_link: item.form_link || null,
        }));

        const { data, error } = await supabase
          .from('form_profiles')
          .insert(toInsert)
          .select('*');

        if (error) {
          console.warn('Supabase save notice (falling back locally):', error.message);
          showToast(`Generated ${quantity} data secara lokal! (Notice DB)`);
          setResults((prev) => [...generatedList, ...prev]);
        } else if (data) {
          showToast(`Tersimpan ${data.length} profil di Supabase!`);
          setResults((prev) => [...(data as GeneratedProfile[]), ...prev]);
        }
      } else {
        setResults((prev) => [...generatedList, ...prev]);
        showToast(`Generated ${quantity} data!`);
      }

      if (generatedList.length > 0) {
        setSelectedProfileId(generatedList[0].id);
      }
    } catch (err) {
      console.error('Generation error:', err);
      showToast('Gagal generate data');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast('Gagal menyalin teks');
    }
  };

  const handleCopyProfile = async (profile: GeneratedProfile) => {
    const lines: string[] = [];
    lines.push(`=== Profil Data (${profile.gender}) ===`);
    if (profile.fullname) lines.push(`Nama Lengkap: ${profile.fullname}`);
    if (profile.email) lines.push(`Email: ${profile.email}`);
    if (profile.password) lines.push(`Password: ${profile.password}`);
    if (profile.phone) lines.push(`No. Telepon: ${profile.phone}`);
    if (profile.username) lines.push(`Username: ${profile.username}`);
    if (profile.birthdate) lines.push(`Tanggal Lahir: ${profile.birthdate}`);
    if (profile.nik) lines.push(`NIK (KTP): ${profile.nik}`);
    if (profile.address) lines.push(`Alamat: ${profile.address}`);
    if (profile.job) lines.push(`Pekerjaan: ${profile.job}`);
    if (profile.education) lines.push(`Pendidikan: ${profile.education}`);
    if (profile.religion) lines.push(`Agama: ${profile.religion}`);
    if (profile.hobby) lines.push(`Hobi: ${profile.hobby}`);
    if (profile.form_link) lines.push(`Form Link: ${profile.form_link}`);

    await handleCopyText(lines.join('\n'), 'Seluruh profil berhasil disalin!');
  };

  const handleCopyAll = async () => {
    if (results.length === 0) {
      showToast('Tidak ada data untuk disalin');
      return;
    }

    const allProfilesText = results
      .map((profile, index) => {
        const lines = [`[Data #${index + 1} - ${profile.gender}]`];
        if (profile.fullname) lines.push(`Nama: ${profile.fullname}`);
        if (profile.email) lines.push(`Email: ${profile.email}`);
        if (profile.password) lines.push(`Pass: ${profile.password}`);
        if (profile.phone) lines.push(`Telp: ${profile.phone}`);
        if (profile.username) lines.push(`User: ${profile.username}`);
        if (profile.birthdate) lines.push(`Tgl Lahir: ${profile.birthdate}`);
        if (profile.nik) lines.push(`NIK: ${profile.nik}`);
        if (profile.address) lines.push(`Alamat: ${profile.address}`);
        if (profile.job) lines.push(`Kerja: ${profile.job}`);
        if (profile.education) lines.push(`Pendidikan: ${profile.education}`);
        if (profile.religion) lines.push(`Agama: ${profile.religion}`);
        if (profile.hobby) lines.push(`Hobi: ${profile.hobby}`);
        return lines.join('\n');
      })
      .join('\n\n=========================\n\n');

    await handleCopyText(allProfilesText, 'Semua data profil berhasil disalin!');
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      showToast('Tidak ada data untuk diexport');
      return;
    }

    const headers = ['No', 'Gender'];
    const activeKeys = Object.keys(activeFields).filter((k) => activeFields[k]);
    headers.push(...activeKeys);

    let csvContent = headers.map((h) => `"${h}"`).join(',') + '\n';

    results.forEach((profile, index) => {
      const row = [String(index + 1), profile.gender];
      activeKeys.forEach((key) => {
        const val = (profile as any)[key] || '';
        row.push(`"${val.replace(/"/g, '""')}"`);
      });
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formfill_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Berhasil export ${results.length} data ke CSV!`);
  };

  const handleExportJSON = () => {
    if (results.length === 0) {
      showToast('Tidak ada data untuk diexport');
      return;
    }

    const cleanData = results.map(({ id, created_at, ...rest }) => rest);
    const jsonStr = JSON.stringify(cleanData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formfill_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Berhasil export ${results.length} data ke JSON!`);
  };

  // ---- Delete Handlers ----
  const handleDeleteProfileRequest = (profile: GeneratedProfile) => {
    setDeleteTarget({
      id: profile.id,
      label: profile.fullname || profile.email || `Profil #${profile.id.slice(0, 8)}`,
      mode: 'single',
    });
  };

  const handleDeleteAllRequest = () => {
    setDeleteTarget({
      id: '__ALL__',
      label: `Semua ${results.length} profil`,
      mode: 'all',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.mode === 'all') {
      // Delete all profiles from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('form_profiles')
          .delete()
          .eq('user_id', user.id);
        if (error) console.error('Supabase delete all error:', error);
      }
      setResults([]);
      setSelectedProfileId('');
      showToast('Semua profil berhasil dihapus dari Supabase!');
    } else {
      // Delete single profile
      const { id } = deleteTarget;
      const { error } = await supabase
        .from('form_profiles')
        .delete()
        .eq('id', id);
      if (error) console.error('Supabase delete error:', error);

      setResults((prev) => prev.filter((p) => p.id !== id));
      if (selectedProfileId === id) {
        const remaining = results.filter((p) => p.id !== id);
        setSelectedProfileId(remaining[0]?.id || '');
      }
      showToast('Profil berhasil dihapus dari Supabase!');
    }
  };

  // Launch / Pre-fill Form with Target URL & Selected Profile
  const selectedProfile = results.find((p) => p.id === selectedProfileId) || results[0];

  const handleOpenPrefilledForm = () => {
    if (!formLink.trim()) {
      showToast('Masukkan link form terlebih dahulu!');
      return;
    }
    if (!selectedProfile) {
      showToast('Generate atau pilih data profil terlebih dahulu!');
      return;
    }

    const queryString = buildFormQueryString(selectedProfile);
    let targetUrl = formLink.trim();
    const hasQuery = targetUrl.includes('?');
    targetUrl += (hasQuery ? '&' : '?') + queryString;

    window.open(targetUrl, '_blank');
    showToast(`Membuka form dengan data ${selectedProfile.fullname || 'profil'}!`);
  };

  const handleCopyAutofillScript = () => {
    if (!selectedProfile) {
      showToast('Pilih atau generate profil terlebih dahulu!');
      return;
    }
    const script = buildFormAutofillScript(selectedProfile);
    handleCopyText(script, 'Bookmarklet Auto-Fill berhasil disalin!');
  };

  return (
    <div className="formfill-container">
      {/* Page Hero Header */}
      <section className="page-hero-header">
        <div className="page-hero-left">
          <div className="page-hero-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div>
            <h2 className="page-hero-title">GeneratPro</h2>
            <p className="page-hero-sub">Generator Profil & Form Auto-Fill — Data tersimpan langsung ke Supabase</p>
          </div>
        </div>
        <div className="page-hero-badges">
          <span className="hero-badge badge-cyan">👤 Form Profiler</span>
          <span className="hero-badge badge-emerald">💾 Supabase Sync</span>
          <span className="hero-badge badge-violet">🚀 Auto-Fill</span>
        </div>
      </section>

      {/* Target Form Link & Quick Auto-Fill Section */}
      <section className="form-link-launcher-card">
        <div className="section-header-row">
          <h3>🔗 Link Form & Auto-Fill Launcher</h3>
          <span className="info-badge">🚀 Supabase Connected</span>
        </div>

        <div className="form-launcher-body">
          <div className="form-input-group">
            <label htmlFor="form-url-input">Masukkan Link Form (Google Form / Pendaftaran):</label>
            <div className="url-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <input
                id="form-url-input"
                type="url"
                placeholder="https://docs.google.com/forms/d/e/.../viewform atau https://form-pendaftaran.com"
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
              />
            </div>
          </div>

          {results.length > 0 && (
            <div className="profile-select-row">
              <label htmlFor="select-profile">Pilih Data Profil Supabase:</label>
              <select
                id="select-profile"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
              >
                {results.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    #{idx + 1} - {p.fullname || p.email || 'Profil'} ({p.gender})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="launcher-actions-row">
            <button className="btn-launch-form" onClick={handleOpenPrefilledForm}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Buka & Auto-Fill Form</span>
            </button>

            <button className="btn-bookmarklet" onClick={handleCopyAutofillScript}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>Salin Bookmarklet Auto-Fill</span>
            </button>
          </div>
        </div>
      </section>

      {/* Field Picker Grid */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>Konfigurasi & Generator Profil Supabase</h3>
          <span className="info-badge">💾 Supabase Database Connected</span>
        </div>

        <div className="fields-grid">
          {/* NAMA LENGKAP */}
          <div className={`field-toggle-card ${activeFields.fullname ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet fn-bullet"></span>
                <label className="field-title-label">Nama Lengkap</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.fullname}
                  onChange={() => handleToggleField('fullname')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.fullname && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Gender:</label>
                  <select
                    value={options.gender}
                    onChange={(e) => setOptions({ ...options, gender: e.target.value as any })}
                  >
                    <option value="random">Acak</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
                <div className="option-row">
                  <label>Format:</label>
                  <select
                    value={options.nameStyle}
                    onChange={(e) => setOptions({ ...options, nameStyle: e.target.value as any })}
                  >
                    <option value="full">Nama Lengkap</option>
                    <option value="first">Nama Depan</option>
                    <option value="last">Nama Belakang</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* EMAIL */}
          <div className={`field-toggle-card ${activeFields.email ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet em-bullet"></span>
                <label className="field-title-label">Email</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.email}
                  onChange={() => handleToggleField('email')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.email && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Domain:</label>
                  <select
                    value={options.emailDomain}
                    onChange={(e) => setOptions({ ...options, emailDomain: e.target.value })}
                  >
                    <option value="random">Acak</option>
                    <option value="gmail.com">gmail.com</option>
                    <option value="yahoo.com">yahoo.com</option>
                    <option value="outlook.com">outlook.com</option>
                    <option value="hotmail.com">hotmail.com</option>
                  </select>
                </div>
                <div className="option-row">
                  <label>Gaya:</label>
                  <select
                    value={options.emailStyle}
                    onChange={(e) => setOptions({ ...options, emailStyle: e.target.value as any })}
                  >
                    <option value="name">Sesuai Nama</option>
                    <option value="word">Kombinasi Kata</option>
                    <option value="random">Karakter Acak</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* PASSWORD */}
          <div className={`field-toggle-card ${activeFields.password ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet pw-bullet"></span>
                <label className="field-title-label">Password</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.password}
                  onChange={() => handleToggleField('password')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.password && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Panjang ({options.passOpts.length}):</label>
                  <input
                    type="range"
                    min="8"
                    max="24"
                    value={options.passOpts.length}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        passOpts: { ...options.passOpts, length: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="checkbox-row-options">
                  <label className="checkbox-mini">
                    <input
                      type="checkbox"
                      checked={options.passOpts.useUpper}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          passOpts: { ...options.passOpts, useUpper: e.target.checked },
                        })
                      }
                    />
                    A-Z
                  </label>
                  <label className="checkbox-mini">
                    <input
                      type="checkbox"
                      checked={options.passOpts.useNumbers}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          passOpts: { ...options.passOpts, useNumbers: e.target.checked },
                        })
                      }
                    />
                    0-9
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* NO HP */}
          <div className={`field-toggle-card ${activeFields.phone ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet ph-bullet"></span>
                <label className="field-title-label">Nomor Telepon</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.phone}
                  onChange={() => handleToggleField('phone')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.phone && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Operator:</label>
                  <select
                    value={options.phonePrefix}
                    onChange={(e) => setOptions({ ...options, phonePrefix: e.target.value })}
                  >
                    <option value="random">Acak</option>
                    <option value="tsel">Telkomsel</option>
                    <option value="isat">Indosat</option>
                    <option value="xl">XL Axiata</option>
                    <option value="sf">Smartfren</option>
                  </select>
                </div>
                <div className="option-row">
                  <label>Format:</label>
                  <select
                    value={options.phoneFormat}
                    onChange={(e) => setOptions({ ...options, phoneFormat: e.target.value as any })}
                  >
                    <option value="dash">0812-3456-7890</option>
                    <option value="space">0812 3456 7890</option>
                    <option value="plain">081234567890</option>
                    <option value="plus62">+6281234567890</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* TANGGAL LAHIR */}
          <div className={`field-toggle-card ${activeFields.birthdate ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet bd-bullet"></span>
                <label className="field-title-label">Tanggal Lahir</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.birthdate}
                  onChange={() => handleToggleField('birthdate')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.birthdate && (
              <div className="field-options-inner">
                <div className="option-row-double">
                  <div className="inner-opt-column">
                    <label>Umur Min ({options.ageMin}):</label>
                    <input
                      type="range"
                      min="12"
                      max="70"
                      value={options.ageMin}
                      onChange={(e) =>
                        setOptions({ ...options, ageMin: Math.min(parseInt(e.target.value), options.ageMax) })
                      }
                    />
                  </div>
                  <div className="inner-opt-column">
                    <label>Umur Max ({options.ageMax}):</label>
                    <input
                      type="range"
                      min="12"
                      max="70"
                      value={options.ageMax}
                      onChange={(e) =>
                        setOptions({ ...options, ageMax: Math.max(parseInt(e.target.value), options.ageMin) })
                      }
                    />
                  </div>
                </div>
                <div className="option-row">
                  <label>Format:</label>
                  <select
                    value={options.dateFormat}
                    onChange={(e) => setOptions({ ...options, dateFormat: e.target.value as any })}
                  >
                    <option value="id">15 Januari 1995</option>
                    <option value="iso">1995-01-15</option>
                    <option value="slash">15/01/1995</option>
                    <option value="dash">15-01-1995</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* USERNAME */}
          <div className={`field-toggle-card ${activeFields.username ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet un-bullet"></span>
                <label className="field-title-label">Username</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.username}
                  onChange={() => handleToggleField('username')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.username && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Gaya:</label>
                  <select
                    value={options.usernameStyle}
                    onChange={(e) => setOptions({ ...options, usernameStyle: e.target.value as any })}
                  >
                    <option value="name_num">nama_angka (budi_12)</option>
                    <option value="word_word">kata_kata (cool_wolf)</option>
                    <option value="camel">camelCase (budiWijaya)</option>
                    <option value="random">Acak</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ALAMAT */}
          <div className={`field-toggle-card ${activeFields.address ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet ad-bullet"></span>
                <label className="field-title-label">Alamat Lengkap</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.address}
                  onChange={() => handleToggleField('address')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.address && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Detil:</label>
                  <select
                    value={options.addressType}
                    onChange={(e) => setOptions({ ...options, addressType: e.target.value as any })}
                  >
                    <option value="full">Lengkap (Jl + Kota + Prov)</option>
                    <option value="street">Nama Jalan Saja</option>
                    <option value="city">Kota & Prov Saja</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* PEKERJAAN */}
          <div className={`field-toggle-card ${activeFields.job ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet jb-bullet"></span>
                <label className="field-title-label">Pekerjaan</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.job}
                  onChange={() => handleToggleField('job')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.job && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Sektor:</label>
                  <select
                    value={options.jobSector}
                    onChange={(e) => setOptions({ ...options, jobSector: e.target.value })}
                  >
                    <option value="random">Acak Sektor</option>
                    <option value="tech">Teknologi</option>
                    <option value="health">Kesehatan</option>
                    <option value="edu">Pendidikan</option>
                    <option value="finance">Keuangan</option>
                    <option value="gov">PNS / Pemerintahan</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* NIK */}
          <div className={`field-toggle-card ${activeFields.nik ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet nk-bullet"></span>
                <label className="field-title-label">NIK (KTP)</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.nik}
                  onChange={() => handleToggleField('nik')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.nik && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Kode Prov:</label>
                  <select
                    value={options.nikProvince}
                    onChange={(e) => setOptions({ ...options, nikProvince: e.target.value })}
                  >
                    <option value="random">Acak</option>
                    <option value="31">DKI Jakarta (31)</option>
                    <option value="32">Jawa Barat (32)</option>
                    <option value="33">Jawa Tengah (33)</option>
                    <option value="34">DI Yogyakarta (34)</option>
                    <option value="35">Jawa Timur (35)</option>
                    <option value="36">Banten (36)</option>
                    <option value="51">Bali (51)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* HOBI */}
          <div className={`field-toggle-card ${activeFields.hobby ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet hb-bullet"></span>
                <label className="field-title-label">Hobi</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.hobby}
                  onChange={() => handleToggleField('hobby')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.hobby && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Jumlah:</label>
                  <select
                    value={options.hobbyCount}
                    onChange={(e) => setOptions({ ...options, hobbyCount: parseInt(e.target.value) })}
                  >
                    <option value={1}>1 Hobi</option>
                    <option value={2}>2 Hobi</option>
                    <option value={3}>3 Hobi</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* PENDIDIKAN */}
          <div className={`field-toggle-card ${activeFields.education ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet ed-bullet"></span>
                <label className="field-title-label">Pendidikan</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.education}
                  onChange={() => handleToggleField('education')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.education && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Tingkat:</label>
                  <select
                    value={options.educationLevel}
                    onChange={(e) => setOptions({ ...options, educationLevel: e.target.value })}
                  >
                    <option value="random">Acak</option>
                    <option value="sd">SD</option>
                    <option value="smp">SMP</option>
                    <option value="sma/smk">SMA/SMK</option>
                    <option value="d3">Diploma 3 (D3)</option>
                    <option value="s1">Sarjana (S1)</option>
                    <option value="s2">Magister (S2)</option>
                    <option value="s3">Doktor (S3)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* AGAMA */}
          <div className={`field-toggle-card ${activeFields.religion ? 'active' : ''}`}>
            <div className="field-toggle-header">
              <div className="field-meta">
                <span className="field-bullet rl-bullet"></span>
                <label className="field-title-label">Agama</label>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activeFields.religion}
                  onChange={() => handleToggleField('religion')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {activeFields.religion && (
              <div className="field-options-inner">
                <div className="option-row">
                  <label>Pilihan:</label>
                  <select
                    value={options.religionVal}
                    onChange={(e) => setOptions({ ...options, religionVal: e.target.value })}
                  >
                    <option value="random">Acak (Proporsional)</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Controls Row */}
        <div className="tools-generation-actions-row">
          <div className="quantity-select-box">
            <label>Jumlah Data:</label>
            <div className="quantity-input-group">
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                min="1"
                max="50"
              />
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.min(50, quantity + 1))}
              >
                +
              </button>
            </div>
          </div>

          <button className="btn-generate btn-tools-gen" onClick={handleGenerate} disabled={isGenerating}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            <span>{isGenerating ? 'Menyimpan...' : 'Generate & Simpan Supabase'}</span>
          </button>

          <div className="export-btn-group">
            <button className="btn-export csv-btn" onClick={handleExportCSV}>
              CSV
            </button>
            <button className="btn-export json-btn" onClick={handleExportJSON}>
              JSON
            </button>
          </div>
        </div>
      </section>

      {/* Generated / Saved Profiles List */}
      <section className="results-section">
        <div className="results-header">
          <div className="results-header-left">
            <h3>Profil Tersimpan</h3>
            {results.length > 0 && (
              <span className="results-count-badge">{results.length} profil</span>
            )}
          </div>
          {results.length > 0 && (
            <div className="results-toolbar">
              <button className="toolbar-btn toolbar-btn-copy" onClick={handleCopyAll}>
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
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 8h10M7 12h8M7 16h6" />
              </svg>
            </div>
            <p>Belum ada data. Silakan pilih field lalu tekan "Generate & Simpan Supabase".</p>
          </div>
        ) : (
          <div className="profile-cards-list">
            {results.map((profile, index) => (
              <div className="profile-detail-card" key={profile.id}>
                <div className="profile-detail-header">
                  <div className="profile-avatar-info">
                    <span className={`gender-avatar-icon ${profile.gender === 'Laki-laki' ? 'male' : 'female'}`}>
                      {profile.gender === 'Laki-laki' ? '👨' : '👩'}
                    </span>
                    <span className="profile-number"># Profil {index + 1}</span>
                    <span className="profile-gender-badge">{profile.gender}</span>
                    {profile.form_link && (
                      <span className="form-link-badge" title={profile.form_link}>
                        🔗 Form Connected
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button className="btn-copy-profile-card" onClick={() => handleCopyProfile(profile)}>
                      Salin Profil
                    </button>
                    <button className="btn-delete-profile-card" onClick={() => handleDeleteProfileRequest(profile)} title="Hapus Profil">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="profile-fields-grid">
                  {profile.fullname && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.fullname!, 'Nama disalin!')}>
                      <span className="profile-item-label">Nama Lengkap</span>
                      <span className="profile-item-value">{profile.fullname}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.email!, 'Email disalin!')}>
                      <span className="profile-item-label">Email</span>
                      <span className="profile-item-value">{profile.email}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.password && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.password!, 'Password disalin!')}>
                      <span className="profile-item-label">Password</span>
                      <span className="profile-item-value font-mono">{profile.password}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.phone!, 'No Telepon disalin!')}>
                      <span className="profile-item-label">No. Telepon</span>
                      <span className="profile-item-value">{profile.phone}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.username && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.username!, 'Username disalin!')}>
                      <span className="profile-item-label">Username</span>
                      <span className="profile-item-value font-mono">{profile.username}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.birthdate && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.birthdate!, 'Tanggal Lahir disalin!')}>
                      <span className="profile-item-label">Tanggal Lahir</span>
                      <span className="profile-item-value">{profile.birthdate}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.nik && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.nik!, 'NIK disalin!')}>
                      <span className="profile-item-label">NIK (KTP)</span>
                      <span className="profile-item-value font-mono">{profile.nik}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="profile-data-item full-width-field" onClick={() => handleCopyText(profile.address!, 'Alamat disalin!')}>
                      <span className="profile-item-label">Alamat Lengkap</span>
                      <span className="profile-item-value">{profile.address}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.job && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.job!, 'Pekerjaan disalin!')}>
                      <span className="profile-item-label">Pekerjaan</span>
                      <span className="profile-item-value">{profile.job}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.education && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.education!, 'Pendidikan disalin!')}>
                      <span className="profile-item-label">Pendidikan</span>
                      <span className="profile-item-value">{profile.education}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.religion && (
                    <div className="profile-data-item" onClick={() => handleCopyText(profile.religion!, 'Agama disalin!')}>
                      <span className="profile-item-label">Agama</span>
                      <span className="profile-item-value">{profile.religion}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                  {profile.hobby && (
                    <div className="profile-data-item full-width-field" onClick={() => handleCopyText(profile.hobby!, 'Hobi disalin!')}>
                      <span className="profile-item-label">Hobi</span>
                      <span className="profile-item-value">{profile.hobby}</span>
                      <span className="field-copy-hint">Copy</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SecureDeleteModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.mode === 'all' ? 'Hapus Semua Profil' : 'Hapus Profil'}
        itemDescription={deleteTarget?.label || ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
