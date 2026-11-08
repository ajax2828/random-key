'use client';

import React, { useState, useRef } from 'react';
import {
  DocumentConfig,
  DocumentSection,
  TableData,
  LETTERHEAD_TEMPLATES,
  generateDocumentHTML,
  downloadDOC,
  generateSectionId,
  generateImageId,
  defaultTable,
  ImageBlock,
  PaperSize,
  Orientation,
} from '@/lib/documentGenerator';
import { FONT_FAMILIES } from '@/lib/certificateGenerator';
import Toast from '@/components/Toast';
import AiAssistant from '@/components/AiAssistant';
import { trackUsage } from '@/lib/usage';

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48];
const PAPER_SIZES: { value: PaperSize; label: string; w: number; h: number }[] = [
  { value: 'a4', label: 'A4 (210 x 297 mm)', w: 210, h: 297 },
  { value: 'a3', label: 'A3 (297 x 420 mm)', w: 297, h: 420 },
  { value: 'letter', label: 'Letter (216 x 279 mm)', w: 216, h: 279 },
  { value: 'legal', label: 'Legal (216 x 356 mm)', w: 216, h: 356 },
  { value: 'tabloid', label: 'Tabloid (279 x 432 mm)', w: 279, h: 432 },
];

export default function DocPage() {
  const [config, setConfig] = useState<DocumentConfig>({
    letterhead: '',
    paperSize: 'a4',
    orientation: 'portrait',
    margin: 20,
    images: [],
    sections: [
      {
        id: generateSectionId(),
        title: '',
        subtitle: '',
        includeTable: false,
        table: null,
        description: '',
        fontSize: 12,
        fontFamily: '"Times New Roman",Times,serif',
        pageNumber: 1,
        images: [],
      },
    ],
  });
  const [fileName, setFileName] = useState('dokumen');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfTargetRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const baseFileName = (fileName || 'dokumen').replace(/\.(html?|docx?|pdf)$/i, '') || 'dokumen';

  const updateSection = (id: string, patch: Partial<DocumentSection>) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const addSection = () => {
    const newSection: DocumentSection = {
      id: generateSectionId(),
      title: '',
      subtitle: '',
      includeTable: false,
      table: null,
      description: '',
      fontSize: 12,
      fontFamily: '"Times New Roman",Times,serif',
      pageNumber: config.sections.length + 1,
      images: [],
    };
    setConfig({ ...config, sections: [...config.sections, newSection] });
  };

  const removeSection = (id: string) => {
    if (config.sections.length <= 1) {
      showToast('Minimal harus ada 1 section');
      return;
    }
    setConfig({
      ...config,
      sections: config.sections.filter((s) => s.id !== id),
    });
  };

  const handleToggleTable = (id: string, include: boolean) => {
    const section = config.sections.find((s) => s.id === id);
    if (!section) return;
    if (include && !section.table) {
      updateSection(id, { table: defaultTable() });
    } else if (!include) {
      updateSection(id, { table: null, includeTable: false });
    } else {
      updateSection(id, { includeTable: include });
    }
  };

  const updateTable = (id: string, table: TableData) => {
    updateSection(id, { table });
  };

  const addTableRow = (id: string) => {
    const section = config.sections.find((s) => s.id === id);
    if (!section || !section.table) return;
    const newRow: Record<string, string> = {};
    section.table.headers.forEach((h) => {
      newRow[h.field] = '';
    });
    updateTable(id, {
      ...section.table!,
      rows: [...section.table.rows, newRow],
    });
  };

  const removeTableRow = (id: string, rowIndex: number) => {
    const section = config.sections.find((s) => s.id === id);
    if (!section || !section.table) return;
    if (section.table.rows.length <= 1) return;
    updateTable(id, {
      ...section.table,
      rows: section.table.rows.filter((_, i) => i !== rowIndex),
    });
  };

  const handleDownloadDOC = () => {
    const html = generateDocumentHTML(config);
    downloadDOC(html, baseFileName);
    trackUsage('doc', 'download_doc');
    showToast('Dokumen DOC berhasil didownload!');
  };

  const handleDownloadPDF = async () => {
    if (isExportingPdf) return;
    const el = pdfTargetRef.current;
    if (!el) return;
    setIsExportingPdf(true);
    el.innerHTML = generateDocumentHTML(config);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: [config.margin, config.margin, config.margin, config.margin],
          filename: `${baseFileName}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false },
          jsPDF: { unit: 'mm', format: config.paperSize, orientation: config.orientation as 'portrait' | 'landscape' },
        })
        .from(el)
        .save();
      trackUsage('doc', 'download_pdf');
      showToast('Dokumen PDF berhasil didownload!');
    } catch {
      showToast('Gagal generate PDF. Coba lagi.');
    } finally {
      el.innerHTML = '';
      setIsExportingPdf(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran logo maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setConfig({ ...config, logo: reader.result as string });
      showToast('Logo berhasil ditambahkan');
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newImage: ImageBlock = {
        id: generateImageId(),
        src: reader.result as string,
        alt: file.name,
        width: 0,
        align: 'center',
        caption: '',
      };
      setConfig({ ...config, images: [...config.images, newImage] });
      showToast('Gambar berhasil ditambahkan');
    };
    reader.readAsDataURL(file);
  };

  const updateImage = (id: string, patch: Partial<ImageBlock>) => {
    setConfig({
      ...config,
      images: config.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    });
  };

  const removeImage = (id: string) => {
    setConfig({
      ...config,
      images: config.images.filter((img) => img.id !== id),
    });
    showToast('Gambar dihapus');
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const renderTableEditor = (section: DocumentSection) => {
    if (!section.includeTable || !section.table) return null;
    const t = section.table;

    return (
      <div className="doc-table-editor">
        <div className="doc-table-editor-header">
          <span className="info-badge">📊 Tabel ({t.rows.length} baris)</span>
        </div>

        <table className="doc-table-preview">
          <thead>
            <tr>
              {t.headers.map((h, i) => (
                <th key={i}>
                  <input
                    className="doc-table-header-input"
                    value={h.header}
                    onChange={(e) => {
                      const newHeaders = [...t.headers];
                      newHeaders[i] = { ...h, header: e.target.value, field: e.target.value.toLowerCase().replace(/\s+/g, '_') || h.field };
                      updateTable(section.id, { ...t, headers: newHeaders });
                    }}
                    placeholder="Header"
                  />
                </th>
              ))}
              <th className="doc-table-col-act" />
            </tr>
          </thead>
          <tbody>
            {t.rows.map((row, ridx) => (
              <tr key={ridx}>
                {t.headers.map((h, cidx) => (
                  <td key={cidx}>
                    <input
                      className="doc-table-cell-input"
                      value={row[h.field] || ''}
                      onChange={(e) => {
                        const newRows = [...t.rows];
                        newRows[ridx] = { ...row, [h.field]: e.target.value };
                        updateTable(section.id, { ...t, rows: newRows });
                      }}
                      placeholder={`Baris ${ridx + 1}`}
                    />
                  </td>
                ))}
                <td className="doc-table-col-act">
                  <button
                    className="doc-table-del-btn"
                    onClick={() => removeTableRow(section.id, ridx)}
                    title="Hapus baris"
                    type="button"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc-table-actions">
          <button className="btn-add-doc-row" onClick={() => addTableRow(section.id)} type="button">
            + Tambah Baris
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="doc-container">
      {/* Page Hero Header */}
      <section className="page-hero-header">
        <div className="page-hero-left">
          <div className="page-hero-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h2 className="page-hero-title">GeneratDoc</h2>
            <p className="page-hero-sub">Generate dokumentasi dengan kopsurat, judul, subjudul, tabel opsional, gambar, ukuran kertas custom, dan deskripsi Times New Roman custom size</p>
          </div>
        </div>
        <div className="page-hero-badges">
          <span className="hero-badge" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}>📝 Word-like</span>
          <span className="hero-badge" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4' }}>📊 Tabel Opsional</span>
          <span className="hero-badge" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>🖨️ Page Break</span>
          <span className="hero-badge" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>🖼️ Upload Gambar</span>
          <span className="hero-badge" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>📄 Page Setup</span>
        </div>
      </section>

      {/* Letterhead */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>Kopsurat / Header Dokumen</h3>
          <span className="info-badge">🏢 Logo + Teks</span>
        </div>

        <div className="doc-field">
          <label>Template Kopsurat</label>
          <select
            className="doc-font-select"
            value={config.logoTemplate || 'classic'}
            onChange={(e) => setConfig({ ...config, logoTemplate: e.target.value })}
          >
            {LETTERHEAD_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="doc-field">
          <label>Logo</label>
          <div className="doc-logo-upload">
            {config.logo ? (
              <div className="doc-logo-preview">
                <img src={config.logo} alt="Preview logo" />
                <button
                  className="doc-logo-remove"
                  onClick={() => setConfig({ ...config, logo: undefined })}
                  type="button"
                >✕ Hapus Logo</button>
              </div>
            ) : (
              <label className="btn-doc-logo-upload">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
              </label>
            )}
          </div>
        </div>

        <div className="doc-field">
          <label>Kopsurat</label>
          <textarea
            className="doc-textarea"
            placeholder="Masukkan kopsurat / header dokumen (bisa multiline)..."
            value={config.letterhead}
            onChange={(e) => setConfig({ ...config, letterhead: e.target.value })}
            rows={4}
          />
        </div>
      </section>

      {/* Sections */}
      {config.sections.map((section, idx) => (
        <section key={section.id} className="tools-card-section">
          <div className="section-header-row">
            <h3>Bab {idx + 1} — Section</h3>
            <span className="info-badge">#{idx + 1}</span>
          </div>

          <div className="doc-field">
            <label>Judul</label>
            <input
              className="doc-input"
              placeholder="Judul utama section..."
              value={section.title}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
            />
          </div>

          <div className="doc-field">
            <label>Subjudul</label>
            <input
              className="doc-input"
              placeholder="Subjudul section..."
              value={section.subtitle}
              onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
            />
          </div>

          {/* Table toggle */}
          <div className="doc-table-toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={section.includeTable}
                onChange={(e) => handleToggleTable(section.id, e.target.checked)}
              />
              <span className="slider round" />
            </label>
            <span>Aktifkan Tabel</span>
          </div>

          {renderTableEditor(section)}

          <div className="doc-field">
            <label>Deskripsi</label>
            <textarea
              className="doc-textarea"
              placeholder="Masukkan deskripsi / isi dokumen..."
              value={section.description}
              onChange={(e) => updateSection(section.id, { description: e.target.value })}
              rows={6}
            />
          </div>

          <div className="doc-font-controls">
            <div className="doc-field-sm">
              <label>Font Size (px)</label>
              <select
                className="doc-font-select"
                value={section.fontSize}
                onChange={(e) => updateSection(section.id, { fontSize: parseInt(e.target.value, 10) })}
              >
                {FONT_SIZES.map((sz) => (
                  <option key={sz} value={sz}>{sz} px</option>
                ))}
              </select>
            </div>
            <div className="doc-field-sm">
              <label>Font Family</label>
              <select
                className="doc-font-select"
                value={section.fontFamily}
                onChange={(e) => updateSection(section.id, { fontFamily: e.target.value })}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="doc-field-sm">
              <label>Halaman ke</label>
              <input
                type="number"
                min={1}
                value={section.pageNumber}
                onChange={(e) => updateSection(section.id, { pageNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              />
            </div>
          </div>

          <div className="doc-section-actions">
            <button
              className="btn-doc-remove"
              onClick={() => removeSection(section.id)}
              type="button"
              title="Hapus section ini"
            >× Hapus Section</button>
          </div>
        </section>
      ))}

      <div className="doc-add-section">
        <button className="btn-add-doc-row" onClick={addSection} type="button">+ Tambah Section</button>
      </div>

      {/* Page Settings */}\n
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>Pengaturan Halaman &amp; Margin</h3>
          <span className="info-badge">📄 Page Setup</span>
        </div>
        <div className="doc-field-sm">
          <label>Ukuran Kertas</label>
          <select
            className="doc-font-select"
            value={config.paperSize}
            onChange={(e) => setConfig({ ...config, paperSize: e.target.value as PaperSize })}
          >
            {PAPER_SIZES.map((ps) => (
              <option key={ps.value} value={ps.value}>{ps.label}</option>
            ))}
          </select>
        </div>
        <div className="doc-field-sm">
          <label>Orientasi</label>
          <select
            className="doc-font-select"
            value={config.orientation}
            onChange={(e) => setConfig({ ...config, orientation: e.target.value as Orientation })}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
        <div className="doc-field-sm">
          <label>Margin (mm)</label>
          <input
            type="number"
            min={5}
            max={50}
            value={config.margin}
            onChange={(e) => setConfig({ ...config, margin: Math.max(5, Math.min(50, parseInt(e.target.value, 10) || 20)) })}
          />
        </div>
      </section>

      {/* Image Upload */}\n
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>Gambar Dokumen</h3>
          <span className="info-badge">🖼️ Upload</span>
        </div>
        <div className="doc-field">
          <label>Upload Gambar</label>
          <div className="doc-logo-upload">
            <label className="btn-doc-logo-upload">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Gambar
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            </label>
            <p className="doc-help-text">Maksimal 5MB. Gambar akan ditampilkan setelah letterhead.</p>
          </div>
        </div>

        {config.images.map((img) => (
          <div key={img.id} className="doc-image-item">
            <div className="doc-image-preview">
              <img src={img.src} alt={img.alt || 'Gambar dokumen'} />
              <button
                className="doc-logo-remove"
                onClick={() => removeImage(img.id)}
                type="button"
                title="Hapus gambar"
              >×</button>
            </div>
            <div className="doc-image-controls">
              <div className="doc-field-sm">
                <label>Lebar (px)</label>
                <input
                  type="number"
                  min={0}
                  max={2000}
                  placeholder="Auto (0)"
                  value={img.width === 0 ? '' : img.width}
                  onChange={(e) => updateImage(img.id, { width: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="doc-field-sm">
                <label>Posisi</label>
                <select
                  className="doc-font-select"
                  value={img.align}
                  onChange={(e) => updateImage(img.id, { align: e.target.value as 'left' | 'center' | 'right' })}
                >
                  <option value="left">Kiri</option>
                  <option value="center">Tengah</option>
                  <option value="right">Kanan</option>
                </select>
              </div>
              <div className="doc-field-sm">
                <label>Alt Text</label>
                <input
                  className="doc-input"
                  placeholder="Deskripsi gambar (opsional)"
                  value={img.alt}
                  onChange={(e) => updateImage(img.id, { alt: e.target.value })}
                />
              </div>
              <div className="doc-field-sm">
                <label>Caption</label>
                <input
                  className="doc-input"
                  placeholder="Caption (opsional)"
                  value={img.caption}
                  onChange={(e) => updateImage(img.id, { caption: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Generate Controls */}
      <section className="tools-card-section">
        <div className="section-header-row">
          <h3>Nama File Output</h3>
          <span className="info-badge">📄 DOC / PDF</span>
        </div>
        <div className="doc-file-name">
          <input
            className="doc-input"
            value={fileName}
            onChange={(e) => setFileName(e.target.value || 'dokumen')}
            placeholder="dokumen"
          />
        </div>
        <div className="doc-gen-actions">
          <button className="btn-generate" onClick={handlePreview} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Preview Dokumen</span>
          </button>
          <button className="btn-export" onClick={handleDownloadDOC} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download DOC</span>
          </button>
          <button className="btn-export" onClick={handleDownloadPDF} disabled={isExportingPdf} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{isExportingPdf ? 'Membuat PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </section>

      <Toast message={toastMessage} />

      {/* Hidden render target untuk export PDF */}
      <div
        ref={pdfTargetRef}
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '21cm' }}
        aria-hidden="true"
      />

      <AiAssistant topic="doc" title="AI Bantuan GeneratDoc" />

      {/* Preview Modal */}
      {showPreview && (
        <div className="doc-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="doc-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doc-preview-header">
              <h3>Preview Dokumen</h3>
              <button
                className="doc-preview-close"
                onClick={() => setShowPreview(false)}
                type="button"
              >×</button>
            </div>
            <iframe
              title="Document Preview"
              srcDoc={generateDocumentHTML(config)}
              className="doc-preview-iframe"
            />
          </div>
        </div>
      )}
    </div>
  );
}
