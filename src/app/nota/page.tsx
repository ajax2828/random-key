'use client';

import React, { useState, useRef } from 'react';
import AiAssistant from '@/components/AiAssistant';
import { trackUsage } from '@/lib/usage';

interface Barang {
  id: string;
  nama: string;
  jumlah: number;
  harga: number;
}

let _idCounter = 0;
function nextId() {
  return `item_${++_idCounter}_${Date.now()}`;
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function NotaPage() {
  const [namaToko, setNamaToko] = useState('Toko Saya');
  const [alamatToko, setAlamatToko] = useState('');
  const [judulNota, setJudulNota] = useState('INVOC');
  const [noNota, setNoNota] = useState(`INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [namaPembeli, setNamaPembeli] = useState('');
  const [kotaPembeli, setKotaPembeli] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [barangList, setBarangList] = useState<Barang[]>([
    { id: nextId(), nama: '', jumlah: 1, harga: 0 },
  ]);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const totalKeseluruhan = barangList.reduce((sum, b) => sum + b.jumlah * b.harga, 0);

  const tambahBarang = () => {
    setBarangList([...barangList, { id: nextId(), nama: '', jumlah: 1, harga: 0 }]);
  };

  const hapusBarang = (id: string) => {
    if (barangList.length <= 1) return;
    setBarangList(barangList.filter((b) => b.id !== id));
  };

  const updateBarang = (id: string, key: 'nama' | 'jumlah' | 'harga', value: string | number) => {
    setBarangList(barangList.map((b) => (b.id === id ? { ...b, [key]: value } : b)));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    trackUsage('nota', 'print');
    window.print();
  };

  return (
    <div className="nota-page">
      <div className="nota-header">
        <h1 className="nota-header-title">Invoc</h1>
        <p className="nota-header-sub">Buat & Cetak Nota</p>
      </div>

      <div className="nota-editor">
        {/* Logo & Info Toko */}
        <div className="nota-section">
          <div className="nota-section-title">Toko (Penjual)</div>
          <div className="nota-toko-row">
            <div className="nota-logo-box" onClick={() => logoInputRef.current?.click()}>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} hidden />
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="nota-logo-preview" />
              ) : (
                <div className="nota-logo-placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Logo</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="nota-info-field">
                <label>Nama Toko</label>
                <input value={namaToko} onChange={(e) => setNamaToko(e.target.value)} />
              </div>
              <div className="nota-info-field">
                <label>Alamat Toko</label>
                <input value={alamatToko} onChange={(e) => setAlamatToko(e.target.value)} placeholder="Jl. ..." />
              </div>
            </div>
          </div>
        </div>

        {/* Judul Nota & No */}
        <div className="nota-info-grid">
          <div className="nota-info-field">
            <label>Judul Nota</label>
            <input value={judulNota} onChange={(e) => setJudulNota(e.target.value)} placeholder="INVOC" />
          </div>
          <div className="nota-info-field">
            <label>No. Nota</label>
            <input value={noNota} onChange={(e) => setNoNota(e.target.value)} />
          </div>
          <div className="nota-info-field">
            <label>Tanggal</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
        </div>

        {/* Pembeli */}
        <div className="nota-section">
          <div className="nota-section-title">Pembeli</div>
          <div className="nota-info-grid">
            <div className="nota-info-field">
              <label>Nama / Toko</label>
              <input value={namaPembeli} onChange={(e) => setNamaPembeli(e.target.value)} placeholder="Nama pembeli" />
            </div>
            <div className="nota-info-field">
              <label>Kota</label>
              <input value={kotaPembeli} onChange={(e) => setKotaPembeli(e.target.value)} placeholder="Kota" />
            </div>
          </div>
        </div>

        {/* Tabel Barang */}
        <div className="nota-table-wrap">
          <table className="nota-table">
            <thead>
              <tr>
                <th className="col-no">No</th>
                <th className="col-nama">Nama Barang</th>
                <th className="col-jumlah">Jumlah</th>
                <th className="col-harga">Harga</th>
                <th className="col-total">Total</th>
                <th className="col-act"></th>
              </tr>
            </thead>
            <tbody>
              {barangList.map((b, idx) => (
                <tr key={b.id}>
                  <td className="col-no">{idx + 1}</td>
                  <td className="col-nama">
                    <input value={b.nama} onChange={(e) => updateBarang(b.id, 'nama', e.target.value)}
                      placeholder="Nama barang" />
                  </td>
                  <td className="col-jumlah">
                    <input type="number" min="1" value={b.jumlah}
                      onChange={(e) => updateBarang(b.id, 'jumlah', Math.max(1, parseInt(e.target.value) || 1))} />
                  </td>
                  <td className="col-harga">
                    <input type="number" min="0" value={b.harga}
                      onChange={(e) => updateBarang(b.id, 'harga', Math.max(0, parseInt(e.target.value) || 0))} />
                  </td>
                  <td className="col-total">{formatRupiah(b.jumlah * b.harga)}</td>
                  <td className="col-act">
                    <button className="nota-del-btn" onClick={() => hapusBarang(b.id)}
                      disabled={barangList.length <= 1}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="nota-actions">
          <button className="nota-add-btn" onClick={tambahBarang}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Barang
          </button>
          <div className="nota-grand-total">
            <span>Total</span>
            <strong>{formatRupiah(totalKeseluruhan)}</strong>
          </div>
        </div>
      </div>

      <div className="nota-print-bar">
        <button className="nota-print-btn" onClick={handlePrint}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Cetak Nota
        </button>
      </div>

      {/* Printable template */}
      <div className="nota-print-template">
        <div className="nota-print-top">
          <div className="nota-print-left">
            {logoUrl && <img src={logoUrl} alt="Logo" className="nota-print-logo" />}
            <div className="nota-print-store">
              <h1 className="nota-print-store-name">{namaToko}</h1>
              {alamatToko && <p className="nota-print-store-addr">{alamatToko}</p>}
            </div>
          </div>
          <div className="nota-print-right">
            <div className="nota-print-title-invoc">{judulNota || 'INVOC'}</div>
            <div className="nota-print-no">No: {noNota}</div>
            <div className="nota-print-date">{new Date(tanggal).toLocaleDateString('id-ID')}</div>
          </div>
        </div>

        <div className="nota-print-buyer">
          <span className="nota-print-buyer-label">Kepada Yth,</span>
          <span className="nota-print-buyer-name">{namaPembeli || '______________'}</span>
          {kotaPembeli && <span className="nota-print-buyer-city">{kotaPembeli}</span>}
        </div>

        <table className="nota-print-table">
          <thead>
            <tr><th>No</th><th>Nama Barang</th><th>Jumlah</th><th>Harga</th><th>Total</th></tr>
          </thead>
          <tbody>
            {barangList.map((b, idx) => (
              <tr key={b.id}>
                <td>{idx + 1}</td>
                <td>{b.nama || '-'}</td>
                <td>{b.jumlah}</td>
                <td>{formatRupiah(b.harga)}</td>
                <td>{formatRupiah(b.jumlah * b.harga)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="nota-print-footer">
          <div className="nota-print-total">
            <span>Total</span>
            <strong>{formatRupiah(totalKeseluruhan)}</strong>
          </div>
        </div>

        <div className="nota-print-sign-row">
          <div className="nota-print-sign-box">
            <span>Hormat Kami,</span>
            <div className="nota-print-sign-line"></div>
            <span className="nota-print-sign-name">{namaToko}</span>
          </div>
          <div className="nota-print-sign-box">
            <span>Penerima,</span>
            <div className="nota-print-sign-line"></div>
            <span className="nota-print-sign-name">{namaPembeli || '______________'}</span>
          </div>
        </div>
      </div>

      <AiAssistant topic="nota" title="AI Bantuan GeneratNota" />
    </div>
  );
}
