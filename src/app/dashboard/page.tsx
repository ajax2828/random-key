'use client';

export default function DashboardPage() {
  return (
    <div>
      {/* Page Hero Header */}
      <section className="page-hero-header">
        <div className="page-hero-left">
          <div className="page-hero-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 8L16 18L28 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="page-hero-title">RandMail</h2>
            <p className="page-hero-sub">Dashboard kosong — Generate email & password acak dengan satu klik</p>
          </div>
        </div>
      </section>

      {/* Empty State */}
      <div className="empty-state dashboard-empty">
        <div className="empty-icon">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M22 7l-10 7L2 7"/>
          </svg>
        </div>
        <h3>Dashboard Kosong</h3>
        <p>Belum ada data yang dibuat. Silakan generate sekarang.</p>
        <a href="/dashboard/generate" className="btn-generate" style={{ marginTop: '24px', display: 'inline-flex' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          Mulai Generate
        </a>
      </div>
    </div>
  );
}
