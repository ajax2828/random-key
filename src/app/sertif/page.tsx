'use client';

import React, { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import Toast from '@/components/Toast';
import {
  CertConfig,
  CertData,
  CustomTextField,
  FONT_FAMILIES,
  parseCSV,
  generateCertificate,
  generateCustomId,
  downloadBlob,
} from '@/lib/certificateGenerator';

export default function SertifPage() {
  const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CertData[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [generatedBlobs, setGeneratedBlobs] = useState<Array<{ name: string; blob: Blob; url: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDataIdx, setPreviewDataIdx] = useState(0);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [config, setConfig] = useState<CertConfig>({
    showCertNo: true,
    nameX: 50,
    nameY: 60,
    nameFontSize: 48,
    nameColor: '#1a1a2e',
    nameFontFamily: '"Inter","Segoe UI",Arial,sans-serif',
    certNoX: 50,
    certNoY: 25,
    certNoFontSize: 24,
    certNoColor: '#4a4a6a',
    certNoFontFamily: '"Inter","Segoe UI",Arial,sans-serif',
    certNoPrefix: '',
    autoNumberStart: 1,
    customTexts: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  }, []);

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (PNG/JPG)');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setTemplateImg(img);
      setTemplateUrl(url);
      showToast('Template berhasil diupload!');
    };
    img.onerror = () => {
      showToast('Gagal memuat gambar');
    };
    img.src = url;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCSV(text, config.autoNumberStart);
      setCsvData(result.data);
      setCsvErrors(result.errors);
      if (result.data.length > 0) {
        showToast(`CSV berhasil diparse: ${result.data.length} data`);
      } else {
        showToast('Tidak ada data valid di CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateAll = async () => {
    if (!templateImg) { showToast('Upload template terlebih dahulu!'); return; }
    if (csvData.length === 0) { showToast('Upload CSV terlebih dahulu!'); return; }

    setIsGenerating(true);
    const results: Array<{ name: string; blob: Blob; url: string }> = [];

    try {
      for (let i = 0; i < csvData.length; i++) {
        const item = csvData[i];
        const blob = await generateCertificate(templateImg, item, config);
        const url = URL.createObjectURL(blob);
        results.push({ name: `sertifikat_${item.certNo}_${item.name.replace(/\s+/g, '_')}.png`, blob, url });
      }
      setGeneratedBlobs(results);
      showToast(`Berhasil generate ${results.length} sertifikat!`);
    } catch (err) {
      showToast('Gagal generate sertifikat');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = () => {
    if (generatedBlobs.length === 0) return;
    generatedBlobs.forEach((item) => {
      downloadBlob(item.blob, item.name);
    });
    showToast(`Download ${generatedBlobs.length} sertifikat dimulai!`);
  };

  const handleDownloadZIP = async () => {
    if (generatedBlobs.length === 0) return;
    const zip = new JSZip();
    for (const item of generatedBlobs) {
      const buf = await item.blob.arrayBuffer();
      zip.file(item.name, buf);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `sertifikat_${new Date().toISOString().slice(0, 10)}.zip`);
    showToast(`Download ZIP ${generatedBlobs.length} sertifikat!`);
  };

  const renderPreviewOnCanvas = useCallback(() => {
    if (!templateImg || !previewCanvasRef.current || csvData.length === 0) return;
    const canvas = previewCanvasRef.current;
    const data = csvData[previewDataIdx % csvData.length];
    const w = templateImg.naturalWidth;
    const h = templateImg.naturalHeight;
    const maxDim = 500;
    const displayScale = Math.min(1, maxDim / Math.max(w, h));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(templateImg, 0, 0, w, h);

    const fontScale = Math.min(w, h) / 1000;
    const drawText = (text: string, xPct: number, yPct: number, fontSize: number, color: string, fontFamily: string) => {
      const x = (xPct / 100) * w;
      const y = (yPct / 100) * h;
      const size = Math.max(8, fontSize * fontScale);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${size}px ${fontFamily}`;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 2;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    if (config.showCertNo) {
      const certText = `${config.certNoPrefix}${data.certNo}`;
      if (certText.trim()) {
        drawText(certText, config.certNoX, config.certNoY, config.certNoFontSize, config.certNoColor, config.certNoFontFamily);
      }
    }
    drawText(data.name, config.nameX, config.nameY, config.nameFontSize, config.nameColor, config.nameFontFamily);
    for (const ct of config.customTexts) {
      if (!ct.enabled || !ct.text.trim()) continue;
      drawText(ct.text, ct.x, ct.y, ct.fontSize, ct.color, ct.fontFamily);
    }

    canvas.style.width = `${w * displayScale}px`;
    canvas.style.height = `${h * displayScale}px`;
  }, [templateImg, csvData, previewDataIdx, config]);

  React.useEffect(() => {
    if (showPreview) renderPreviewOnCanvas();
  }, [showPreview, renderPreviewOnCanvas]);

  return (
    <div className="formfill-container">
      <section className="page-hero-header">
        <div className="page-hero-left">
          <div className="page-hero-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h2 className="page-hero-title">GeneratSertif</h2>
            <p className="page-hero-sub">Generator Sertifikat — Upload template, CSV peserta, lalu generate massal</p>
          </div>
        </div>
        <div className="page-hero-badges">
          <span className="hero-badge" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>🖼️ Template Image</span>
          <span className="hero-badge" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>📋 CSV Import</span>
          <span className="hero-badge" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}>⚡ Batch Generate</span>
        </div>
      </section>

      {/* Upload Section */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>1. Upload Template & Data Peserta</h3>
          <span className="info-badge">📄 PNG / JPG</span>
        </div>

        <div className="sertif-upload-grid">
          <div className="sertif-upload-box">
            <div className="sertif-upload-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Template Sertifikat
            </div>
            <div
              className={`sertif-dropzone ${templateUrl ? 'has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleTemplateUpload}
                hidden
              />
              {templateUrl ? (
                <div className="sertif-preview-wrap">
                  <img src={templateUrl} alt="Template" className="sertif-preview-thumb" />
                  <span className="sertif-change-hint">Klik untuk ganti template</span>
                </div>
              ) : (
                <div className="sertif-dropzone-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p>Klik untuk upload template sertifikat</p>
                  <span className="sertif-dropzone-hint">PNG atau JPG</span>
                </div>
              )}
            </div>
          </div>

          <div className="sertif-upload-box">
            <div className="sertif-upload-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Data CSV Peserta
            </div>
            <div
              className={`sertif-dropzone ${csvData.length > 0 ? 'has-csv' : ''}`}
              onClick={() => csvInputRef.current?.click()}
            >
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                hidden
              />
              {csvData.length > 0 ? (
                <div className="sertif-csv-info">
                  <div className="sertif-csv-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="sertif-csv-detail">
                    <span className="sertif-csv-name">{csvFileName}</span>
                    <span className="sertif-csv-count">{csvData.length} peserta</span>
                  </div>
                  <span className="sertif-change-hint">Klik untuk ganti file</span>
                </div>
              ) : (
                <div className="sertif-dropzone-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p>Klik untuk upload file CSV</p>
                  <span className="sertif-dropzone-hint">Kolom: name (wajib), cert_no (opsional)</span>
                </div>
              )}
            </div>
            {csvErrors.length > 0 && (
              <div className="csv-errors">
                {csvErrors.map((err, i) => (
                  <div key={i} className="csv-error-item">{err}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Configuration Section */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>2. Posisi & Tampilan Teks</h3>
          <span className="info-badge">🎯 Klik preview untuk preview</span>
        </div>

        <div className="sertif-config-body">
          <div className="sertif-layer-grid">
            {/* Nama Peserta */}
            <div className="sertif-layer-card">
              <div className="sertif-layer-top">
                <div className="sertif-layer-label">
                  <span className="config-dot name-dot" />
                  <span>Nama Peserta</span>
                </div>
              </div>
              <div className="sertif-layer-controls">
                <div className="sertif-xy-item-sm">
                  <label>X</label>
                  <input type="number" className="sertif-xy-input" min="0" max="100" value={config.nameX}
                    onChange={(e) => setConfig({ ...config, nameX: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} />
                </div>
                <div className="sertif-xy-item-sm">
                  <label>Y</label>
                  <input type="number" className="sertif-xy-input" min="0" max="100" value={config.nameY}
                    onChange={(e) => setConfig({ ...config, nameY: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} />
                </div>
                <div className="sertif-xy-item-sm">
                  <label>Ukuran</label>
                  <input type="number" className="sertif-xy-input" min="12" max="120" value={config.nameFontSize}
                    onChange={(e) => setConfig({ ...config, nameFontSize: Math.min(120, Math.max(12, parseInt(e.target.value) || 12)) })} />
                </div>
                <div className="sertif-xy-item-sm">
                  <label>Warna</label>
                  <input type="color" className="sertif-color-swatch" value={config.nameColor}
                    onChange={(e) => setConfig({ ...config, nameColor: e.target.value })} />
                </div>
                <div className="sertif-xy-item-lg">
                  <label>Font</label>
                  <select value={config.nameFontFamily}
                    onChange={(e) => setConfig({ ...config, nameFontFamily: e.target.value })}>
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* No. Sertifikat */}
            <div className="sertif-layer-card">
              <div className="sertif-layer-top">
                <div className="sertif-layer-label">
                  <span className="config-dot no-dot" />
                  <span>No. Sertifikat</span>
                </div>
                <label className="switch switch-sm">
                  <input type="checkbox" checked={config.showCertNo}
                    onChange={(e) => setConfig({ ...config, showCertNo: e.target.checked })} />
                  <span className="slider round" />
                </label>
              </div>
              {config.showCertNo && (
                <div className="sertif-layer-controls">
                  <div className="sertif-xy-item-sm">
                    <label>X</label>
                    <input type="number" className="sertif-xy-input" min="0" max="100" value={config.certNoX}
                      onChange={(e) => setConfig({ ...config, certNoX: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} />
                  </div>
                  <div className="sertif-xy-item-sm">
                    <label>Y</label>
                    <input type="number" className="sertif-xy-input" min="0" max="100" value={config.certNoY}
                      onChange={(e) => setConfig({ ...config, certNoY: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} />
                  </div>
                  <div className="sertif-xy-item-sm">
                    <label>Ukuran</label>
                    <input type="number" className="sertif-xy-input" min="8" max="80" value={config.certNoFontSize}
                      onChange={(e) => setConfig({ ...config, certNoFontSize: Math.min(80, Math.max(8, parseInt(e.target.value) || 8)) })} />
                  </div>
                  <div className="sertif-xy-item-sm">
                    <label>Warna</label>
                    <input type="color" className="sertif-color-swatch" value={config.certNoColor}
                      onChange={(e) => setConfig({ ...config, certNoColor: e.target.value })} />
                  </div>
                  <div className="sertif-xy-item-lg">
                    <label>Font</label>
                    <select value={config.certNoFontFamily}
                      onChange={(e) => setConfig({ ...config, certNoFontFamily: e.target.value })}>
                      {FONT_FAMILIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sertif-xy-item-lg">
                    <label>Prefix</label>
                    <input type="text" className="sertif-xy-input" value={config.certNoPrefix}
                      placeholder="CERT-2024-" onChange={(e) => setConfig({ ...config, certNoPrefix: e.target.value })} />
                  </div>
                  <div className="sertif-xy-item-sm">
                    <label>No. Awal</label>
                    <input type="number" className="sertif-xy-input" value={config.autoNumberStart}
                      min={1} onChange={(e) => setConfig({ ...config, autoNumberStart: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
              )}
            </div>

            {/* Teks Kustom */}
            <div className="sertif-layer-card">
              <div className="sertif-layer-top">
                <div className="sertif-layer-label">
                  <span className="config-dot custom-dot" />
                  <span>Teks Kustom</span>
                </div>
                <button className="btn-add-custom-sm"
                  onClick={() => {
                    const newField: CustomTextField = {
                      id: generateCustomId(),
                      text: 'Teks Kustom',
                      x: 50, y: 50, fontSize: 20,
                      color: '#4a4a6a',
                      fontFamily: FONT_FAMILIES[0].value,
                      enabled: true,
                    };
                    setConfig({ ...config, customTexts: [...config.customTexts, newField] });
                  }}>
                  + Tambah
                </button>
              </div>
              {config.customTexts.length === 0 ? (
                <div className="sertif-custom-empty-sm">Belum ada teks kustom.</div>
              ) : (
                <div className="sertif-custom-compact-list">
                  {config.customTexts.map((ct, idx) => (
                    <div key={ct.id} className={`sertif-custom-compact ${ct.enabled ? 'on' : ''}`}>
                      <div className="sertif-custom-compact-row">
                        <label className="switch switch-xs">
                          <input type="checkbox" checked={ct.enabled}
                            onChange={() => {
                              const u = [...config.customTexts];
                              u[idx] = { ...u[idx], enabled: !u[idx].enabled };
                              setConfig({ ...config, customTexts: u });
                            }} />
                          <span className="slider round" />
                        </label>
                        <span className="sertif-ct-idx">#{idx + 1}</span>
                        <input type="text" className="sertif-ct-input" value={ct.text}
                          placeholder="Teks..."
                          onChange={(e) => {
                            const u = [...config.customTexts];
                            u[idx] = { ...u[idx], text: e.target.value };
                            setConfig({ ...config, customTexts: u });
                          }} />
                        <div className="sertif-ct-xy">
                          <input type="number" className="sertif-sm-input" value={ct.x}
                            min="0" max="100" placeholder="X"
                            onChange={(e) => {
                              const u = [...config.customTexts];
                              u[idx] = { ...u[idx], x: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) };
                              setConfig({ ...config, customTexts: u });
                            }} />
                          <span className="sertif-ct-sep">,</span>
                          <input type="number" className="sertif-sm-input" value={ct.y}
                            min="0" max="100" placeholder="Y"
                            onChange={(e) => {
                              const u = [...config.customTexts];
                              u[idx] = { ...u[idx], y: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) };
                              setConfig({ ...config, customTexts: u });
                            }} />
                        </div>
                        <input type="number" className="sertif-sm-input" value={ct.fontSize}
                          min="8" max="80" style={{ width: 52 }}
                          onChange={(e) => {
                            const u = [...config.customTexts];
                            u[idx] = { ...u[idx], fontSize: Math.min(80, Math.max(8, parseInt(e.target.value) || 8)) };
                            setConfig({ ...config, customTexts: u });
                          }} />
                        <input type="color" className="sertif-color-swatch-sm" value={ct.color}
                          onChange={(e) => {
                            const u = [...config.customTexts];
                            u[idx] = { ...u[idx], color: e.target.value };
                            setConfig({ ...config, customTexts: u });
                          }} />
                        <select className="sertif-ct-font" value={ct.fontFamily}
                          onChange={(e) => {
                            const u = [...config.customTexts];
                            u[idx] = { ...u[idx], fontFamily: e.target.value };
                            setConfig({ ...config, customTexts: u });
                          }}>
                          {FONT_FAMILIES.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                        <button className="sertif-ct-del"
                          onClick={() => setConfig({ ...config, customTexts: config.customTexts.filter((_, i) => i !== idx) })}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Preview & Generate */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>3. Preview & Generate</h3>
          {csvData.length > 0 && templateImg && (
            <span className="info-badge">{csvData.length} sertifikat</span>
          )}
        </div>

        <div className="sertif-preview-section">
          {templateImg && csvData.length > 0 ? (
            <>
              <div className="sertif-preview-controls">
                <div className="sertif-preview-nav">
                  <span className="sertif-preview-label">Preview:</span>
                  <button className="sertif-nav-btn" onClick={() => setPreviewDataIdx(Math.max(0, previewDataIdx - 1))}
                    disabled={previewDataIdx <= 0 || !showPreview}>◀</button>
                  <span className="sertif-preview-idx">
                    {showPreview ? `${previewDataIdx + 1}/${csvData.length}` : '—'}
                  </span>
                  <button className="sertif-nav-btn" onClick={() => setPreviewDataIdx(Math.min(csvData.length - 1, previewDataIdx + 1))}
                    disabled={previewDataIdx >= csvData.length - 1 || !showPreview}>▶</button>
                </div>
                <button className="btn-sertif-preview"
                  onClick={() => { setShowPreview(true); setPreviewDataIdx(0); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {showPreview ? 'Refresh Preview' : 'Tampilkan Preview'}
                </button>
              </div>

              {showPreview && (
                <div className="sertif-canvas-wrap">
                  <canvas ref={previewCanvasRef} className="sertif-preview-canvas" />
                </div>
              )}

              <div className="sertif-gen-actions">
                <div className="sertif-gen-info">
                  <strong>{csvData.length}</strong> sertifikat akan dibuat dengan data dari <strong>{csvFileName || 'CSV'}</strong>
                </div>
                <div className="sertif-gen-buttons">
                  {generatedBlobs.length > 0 && (
                    <>
                      <button className="btn-sertif-download-all" onClick={handleDownloadAll} type="button" title="Download satu per satu">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        All ({generatedBlobs.length})
                      </button>
                      <button className="btn-sertif-zip" onClick={handleDownloadZIP} type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                        </svg>
                        ZIP
                      </button>
                    </>
                  )}
                  <button className="btn-generate btn-sertif-gen" onClick={handleGenerateAll} disabled={isGenerating}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" />
                    </svg>
                    <span>{isGenerating ? 'Generating...' : 'Generate Semua Sertifikat'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <p>Upload template sertifikat dan file CSV peserta terlebih dahulu.</p>
            </div>
          )}
        </div>
      </section>

      {/* Results Gallery */}
      {generatedBlobs.length > 0 && (
        <section className="results-section">
          <div className="results-header">
            <div className="results-header-left">
              <h3>Hasil Sertifikat</h3>
              <span className="results-count-badge">{generatedBlobs.length} sertifikat</span>
            </div>
            <div className="results-toolbar">
              <button className="toolbar-btn toolbar-btn-copy" onClick={handleDownloadAll}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                All
              </button>
              <button className="toolbar-btn" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }} onClick={handleDownloadZIP}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                </svg>
                ZIP
              </button>
            </div>
          </div>
          <div className="sertif-gallery">
            {generatedBlobs.map((item, idx) => (
              <div key={idx} className="sertif-gallery-card">
                <img src={item.url} alt={item.name} className="sertif-gallery-img" />
                <div className="sertif-gallery-info">
                  <span className="sertif-gallery-name" title={item.name}>
                    {csvData[idx]?.name || `Sertifikat #${idx + 1}`}
                  </span>
                  <button className="btn-sertif-download-single"
                    onClick={() => downloadBlob(item.blob, item.name)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
