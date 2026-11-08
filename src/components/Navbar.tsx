'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { localApiClient, User } from '@/utils/supabase/client';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    localApiClient.getUser().then((u) => {
      if (u) setProfile({ full_name: u.full_name ?? undefined, role: u.role, status: u.status });
    });
  }, [user]);

  const handleLogout = async () => {
    setMobileOpen(false);
    setDesktopOpen(false);
    await localApiClient.signOut();
    router.push('/login');
    router.refresh();
  };

  const pageTitle = pathname === '/dashboard'
    ? 'Dashboard'
    : pathname === '/dashboard/generate'
    ? 'GeneratMail'
    : pathname === '/pass'
    ? 'GeneratPass'
    : pathname === '/tools'
    ? 'GeneratPro'
    : pathname === '/sertif'
    ? 'GeneratSertif'
    : pathname === '/doc'
    ? 'GeneratDoc'
    : pathname === '/nota'
    ? 'Invoc'
    : pathname === '/history'
    ? 'History'
    : 'RandMail';

  const pageBadge = pathname === '/dashboard/generate'
    ? { label: 'Email & Password', color: 'violet' as const }
    : null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dash' },
    { href: '/dashboard/generate', label: 'GeneratMail', icon: 'mail' },
    { href: '/pass', label: 'GeneratPass', icon: 'pass' },
    { href: '/tools', label: 'GeneratPro', icon: 'star' },
    { href: '/sertif', label: 'GeneratSertif', icon: 'cert' },
    { href: '/nota', label: 'Invoc', icon: 'nota' },
    { href: '/doc', label: 'GeneratDoc', icon: 'doc' },
    { href: '/history', label: 'History', icon: 'hist' },
  ] as const;

  const iconSvg = (name: string) => {
    switch (name) {
      case 'mail':
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0z"/></svg>;
      case 'pass':
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
      case 'star':
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
      case 'cert':
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>;
      case 'nota':
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
      case 'doc':
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>;
      case 'hist':
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>;
      default:
        return null;
    }
  };

  const avatarInitials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

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

      <div className="navbar-right">
        {user && (
          <div className="navbar-user-avatar" title={profile?.full_name || user.email}>
            {avatarInitials}
          </div>
        )}
        <button
          className="hamburger-btn desktop-hamburger"
          onClick={() => setDesktopOpen(!desktopOpen)}
          aria-label={desktopOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={desktopOpen}
          type="button"
        >
          <span className="hamburger-icon">
            <span style={{ transform: desktopOpen ? 'translateY(8px) rotate(45deg)' : 'none' }} />
            <span style={{ opacity: desktopOpen ? 0 : 1 }} />
            <span style={{ transform: desktopOpen ? 'translateY(-8px) rotate(-45deg)' : 'none' }} />
          </span>
        </button>
      </div>

      <div className={`nav-desktop-overlay ${desktopOpen ? 'open' : ''}`} onClick={() => setDesktopOpen(false)} />

      <div className={`nav-desktop-panel ${desktopOpen ? 'open' : ''}`}>
        <nav className="nav-links-desktop">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setDesktopOpen(false)}
            >
              {iconSvg(item.icon)}
              {item.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="navbar-user-section">
            <div className="user-info-compact">
              <span className="user-email-compat" title={`Role: ${profile?.role || 'user'} | Status: ${profile?.status || 'active'}`}>
                {profile?.full_name || user.email}
              </span>
            </div>
            <button onClick={handleLogout} className="btn-logout" type="button">
              Logout
            </button>
          </div>
        )}
      </div>

      <button
        className="hamburger-btn mobile-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={mobileOpen}
        type="button"
      >
        <div className="hamburger-icon">
          <span style={{ transform: mobileOpen ? 'translateY(8px) rotate(45deg)' : 'none' }} />
          <span style={{ opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ transform: mobileOpen ? 'translateY(-8px) rotate(-45deg)' : 'none' }} />
        </div>
      </button>

      <div className={`nav-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      <nav className={`nav-links ${mobileOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {iconSvg(item.icon)}
            {item.label}
          </Link>
        ))}
        {user && (
          <div className="user-info">
            <span className="user-email" title={`Role: ${profile?.role || 'user'} | Status: ${profile?.status || 'active'}`}>
              {profile?.full_name || user.email}
            </span>
            <button onClick={handleLogout} className="btn-logout" type="button">
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
