'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { localApiClient } from '@/utils/supabase/client';
import { useNotice } from './NoticeNotification';

interface AuthFormProps {
  type: 'login' | 'register';
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { showNotice } = useNotice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (type === 'login') {
        const { user, error: authError } = await localApiClient.signIn(email, password);

        if (authError) {
          throw new Error(authError);
        }

        if (user) {
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        const { user, error: authError } = await localApiClient.signUp(email, password, fullName);

        if (authError) {
          throw new Error(authError);
        }

        if (user) {
          setSuccess('Pendaftaran berhasil! Mengalihkan ke dashboard...');
          showNotice('Pendaftaran berhasil', 'Akun terdaftar dan data tersimpan di database.');
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1500);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat otentikasi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{type === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun'}</h2>
          <p>
            {type === 'login'
              ? 'Masukkan email & password untuk masuk ke RandMail'
              : 'Daftar akun baru di RandMail'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="auth-error" role="alert">{error}</div>}
          {success && <div className="auth-success" role="status">{success}</div>}

          {type === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-fullname">Nama Lengkap</label>
              <input
                type="text"
                id="auth-fullname"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Alamat Email</label>
            <input
              type="email"
              id="auth-email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              type="password"
              id="auth-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={type === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Memproses...' : type === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <div className="auth-footer">
          {type === 'login' ? (
            <p>
              Belum punya akun? <Link href="/register">Daftar di sini</Link>
            </p>
          ) : (
            <p>
              Sudah punya akun? <Link href="/login">Masuk di sini</Link>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
