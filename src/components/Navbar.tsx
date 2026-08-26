'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

interface NavbarProps {
  user: User | null;
}

interface UserProfile {
  full_name?: string;
  role?: string;
  status?: string;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      const { data } = await supabase
        .from('users')
        .select('full_name, role, status')
        .eq('id', user!.id)
        .maybeSingle();

      if (data) setProfile(data);
    }
    fetchProfile();
  }, [user, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Compute page title based on current route
  const pageTitle = pathname === '/dashboard'
    ? 'GeneratMail'
    : pathname === '/pass'
    ? 'GeneratPass'
    : pathname === '/tools'
    ? 'GeneratPro'
    : pathname === '/sertif'
    ? 'GeneratSertif'
    : pathname === '/nota'
    ? 'Invoc'
    : pathname === '/history'
    ? 'History'
    : 'RandMail';

  const pageBadge = pathname === '/dashboard'
    ? { label: 'Email & Password', color: 'violet' }
    : pathname === '/pass'
    ? { label: 'Password Vault', color: 'cyan' }
    : pathname === '/tools'
    ? { label: 'Form Profiler', color: 'emerald' }
    : pathname === '/sertif'
    ? { label: 'Certificate', color: 'violet' }
    : pathname === '/nota'
    ? { label: 'Nota', color: 'violet' }
    : pathname === '/history'
    ? { label: 'Riwayat Data', color: 'emerald' }
    : null;

  return (
    <header className="navbar">
      <Link href={user ? '/dashboard' : '/login'} className="logo">
        <div className="logo-icon">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="6" width="28" height="20" rx="3" stroke="url(#grad1)" strokeWidth="2"/>
            <path d="M4 8L16 18L28 8" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#a78bfa"/>
                <stop offset="1" stopColor="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="logo-text">
          <h1 className="logo-brand">
            {pageTitle}
          </h1>
          {pageBadge && (
            <span className={`logo-subtitle navbar-page-badge badge-${pageBadge.color}`}>
              {pageBadge.label}
            </span>
          )}
        </div>
      </Link>

      {user && (
        <div className="nav-links">
          <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0z"/></svg>
            GeneratMail
          </Link>
          <Link href="/pass" className={`nav-link ${pathname === '/pass' ? 'active' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            GeneratPass
          </Link>
          <Link href="/tools" className={`nav-link ${pathname === '/tools' ? 'active' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            GeneratPro
          </Link>
          <Link href="/sertif" className={`nav-link ${pathname === '/sertif' ? 'active' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            GeneratSertif
          </Link>
          <Link href="/nota" className={`nav-link ${pathname === '/nota' ? 'active' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Invoc
          </Link>
          <Link href="/history" className={`nav-link ${pathname === '/history' ? 'active' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
            History
          </Link>

          <div className="user-info">
            <span className="user-email" title={`Role: ${profile?.role || 'user'} | Status: ${profile?.status || 'active'}`}>
              {profile?.full_name || user.email}
            </span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
