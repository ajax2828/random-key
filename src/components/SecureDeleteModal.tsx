'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { localApiClient } from '@/utils/supabase/client';

interface SecureDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemDescription?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function generateCaptchaText(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export default function SecureDeleteModal({
  isOpen,
  title,
  itemDescription,
  onConfirm,
  onClose,
}: SecureDeleteModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [passwordInput, setPasswordInput] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0d0f1c');
    bgGrad.addColorStop(0.5, '#141829');
    bgGrad.addColorStop(1, '#0d0f1c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${200 + Math.random() * 55}, ${0.15 + Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let l = 0; l < 4; l++) {
      ctx.strokeStyle = `rgba(${150 + Math.random() * 105}, ${100 + Math.random() * 100}, 250, ${0.12 + Math.random() * 0.15})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      const startY = Math.random() * h;
      ctx.moveTo(0, startY);
      for (let x = 0; x < w; x += 10) {
        ctx.lineTo(x, startY + Math.sin(x * 0.04 + l) * (8 + Math.random() * 12));
      }
      ctx.stroke();
    }

    const charWidth = w / (text.length + 1.5);
    const colors = ['#a78bfa', '#06b6d4', '#34d399', '#fb7185', '#fbbf24', '#818cf8'];

    for (let i = 0; i < text.length; i++) {
      ctx.save();
      const x = charWidth * (i + 1);
      const y = h / 2 + (Math.random() - 0.5) * 14;
      const angle = (Math.random() - 0.5) * 0.5;
      ctx.translate(x, y);
      ctx.rotate(angle);
      const fontSize = 26 + Math.random() * 6;
      ctx.font = `bold ${fontSize}px 'JetBrains Mono', 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const color = colors[i % colors.length];
      ctx.shadowColor = color;
      ctx.shadowBlur = 6 + Math.random() * 6;
      ctx.fillStyle = color;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, y, w, 1);
    }
  }, []);

  useEffect(() => {
    if (step === 2 && captchaText) {
      const t = setTimeout(() => drawCaptcha(captchaText), 50);
      return () => clearTimeout(t);
    }
  }, [step, captchaText, drawCaptcha]);

  useEffect(() => {
    if (isOpen) {
      const text = generateCaptchaText(6);
      setCaptchaText(text);
      setCaptchaInput('');
      setErrorMsg(null);
      setStep(1);
      setPasswordInput('');
    }
  }, [isOpen]);

  const handleRefreshCaptcha = () => {
    const text = generateCaptchaText(6);
    setCaptchaText(text);
    setCaptchaInput('');
    setErrorMsg(null);
    setTimeout(() => drawCaptcha(text), 50);
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passwordInput) {
      setErrorMsg('Masukkan password akun login Anda!');
      return;
    }

    setIsVerifying(true);
    try {
      const user = await localApiClient.getUser();
      if (!user?.email) {
        setErrorMsg('Gagal mengambil email akun Anda. Silakan login ulang.');
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: passwordInput,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || 'Password akun login salah!');
      } else {
        setStep(2);
        setErrorMsg(null);
      }
    } catch {
      setErrorMsg('Gagal memverifikasi password.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (captchaInput.trim().toUpperCase() !== captchaText.toUpperCase()) {
      setErrorMsg('Captcha tidak cocok! Periksa dan coba lagi.');
      return;
    }

    setIsVerifying(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus data.';
      setErrorMsg(message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-icon-warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3>{title}</h3>
            <span className="modal-subtitle">Verifikasi Keamanan 2-Langkah</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {itemDescription && (
            <div className="modal-target-info">
              <span className="target-label">Target Data:</span>
              <span className="target-value">{itemDescription}</span>
            </div>
          )}

          <div className="modal-stepper">
            <div className={`step-item ${step === 1 ? 'active' : 'completed'}`}>
              <span className="step-num">{step > 1 ? '✓' : '1'}</span>
              <span className="step-name">Password Login</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step === 2 ? 'active' : ''}`}>
              <span className="step-num">2</span>
              <span className="step-name">Captcha</span>
            </div>
          </div>

          {errorMsg && <div className="modal-error-box" role="alert">{errorMsg}</div>}

          {step === 1 && (
            <form onSubmit={handleVerifyPassword} className="modal-form-step">
              <p className="step-desc">
                Masukkan password akun RandMail Anda untuk mengonfirmasi identitas sebelum menghapus.
              </p>
              <div className="form-group">
                <label htmlFor="delete-modal-pass">Password Login Akun:</label>
                <input
                  id="delete-modal-pass"
                  type="password"
                  placeholder="Masukkan password akun Anda"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn-modal-cancel" onClick={onClose}>
                  Batal
                </button>
                <button type="submit" className="btn-modal-next" disabled={isVerifying}>
                  {isVerifying ? 'Memverifikasi...' : 'Lanjut ke Captcha →'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleConfirmDelete} className="modal-form-step">
              <p className="step-desc">
                Ketik kode captcha yang terlihat pada gambar di bawah untuk konfirmasi penghapusan permanen.
              </p>

              <div className="captcha-container">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={70}
                  className="captcha-canvas"
                  aria-label="Captcha verification code"
                />
                <button
                  type="button"
                  className="captcha-refresh-btn"
                  onClick={handleRefreshCaptcha}
                  title="Refresh Captcha"
                  aria-label="Refresh captcha"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="delete-modal-captcha">Masukkan Kode Captcha:</label>
                <input
                  id="delete-modal-captcha"
                  type="text"
                  placeholder="Ketik kode dari gambar di atas"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  maxLength={6}
                  autoFocus
                  required
                  autoComplete="off"
                  className="captcha-input"
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => { setStep(1); setErrorMsg(null); }}>
                  ← Kembali
                </button>
                <button type="submit" className="btn-modal-danger" disabled={isVerifying}>
                  {isVerifying ? 'Menghapus...' : '🗑️ Hapus Permanen'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
