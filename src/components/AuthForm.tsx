'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (type === 'login') {
        // 1. Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            throw new Error('Email atau password salah. Jika belum daftar, silakan Register terlebih dahulu.');
          } else if (authError.message.includes('Email not confirmed')) {
            throw new Error('Email belum dikonfirmasi. Silakan matikan "Confirm email" di Supabase Dashboard -> Authentication -> Providers -> Email.');
          }
          throw authError;
        }

        if (authData.user) {
          // 2. Validate against public.users table in Supabase (if table exists)
          try {
            const { data: userProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .maybeSingle();

            if (!userProfile) {
              await supabase.from('users').upsert({
                id: authData.user.id,
                email: authData.user.email!,
                full_name: authData.user.user_metadata?.full_name || email.split('@')[0],
                status: 'active',
                role: 'user',
              });
            } else if (userProfile.status === 'blocked' || userProfile.status === 'inactive') {
              await supabase.auth.signOut();
              throw new Error(`Akun Anda di-status '${userProfile.status}'. Hubungi admin.`);
            }
          } catch (profileErr) {
            console.warn('Public users table check skipped/error:', profileErr);
          }
        }

        router.push('/dashboard');
        router.refresh();
      } else {
        // 1. Register with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
            },
          },
        });

        if (authError) {
          if (authError.message.includes('rate limit')) {
            throw new Error('Supabase Email Rate Limit tercapai! Silakan matikan "Confirm email" di Dashboard Supabase (Authentication -> Providers -> Email -> Confirm Email = OFF).');
          }
          throw authError;
        }

        // Check if user session was created immediately (meaning email confirmation is OFF)
        if (authData.session) {
          // Profile table sync
          try {
            await supabase.from('users').upsert({
              id: authData.user!.id,
              email: authData.user!.email!,
              full_name: fullName || email.split('@')[0],
              role: 'user',
              status: 'active',
            });
          } catch (e) {
            console.warn('Users table sync warning:', e);
          }

          setSuccess('Pendaftaran berhasil! Mengalihkan ke dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1500);
        } else if (authData.user) {
          setSuccess('Pendaftaran berhasil! Jika tombol "Confirm Email" aktif di Supabase Anda, cek inbox email atau matikan "Confirm email" di Supabase Dashboard.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat otentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {type === 'login'
              ? 'Masukkan email & password untuk masuk ke RandMail'
              : 'Daftar akun baru di RandMail & Supabase'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {type === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-fullname">Nama Lengkap</label>
              <input
                type="text"
                id="auth-fullname"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              type="email"
              id="auth-email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Memproses...' : type === 'login' ? 'Sign In' : 'Sign Up'}
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
