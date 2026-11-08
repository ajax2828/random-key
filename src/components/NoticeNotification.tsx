'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface NoticeState {
  title: string;
  message: string;
  open: boolean;
}

interface NoticeContextValue {
  showNotice: (title: string, message: string) => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<NoticeState>({ title: '', message: '', open: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((title: string, message: string) => {
    setNotice({ title, message, open: true });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setNotice({ title: '', message: '', open: false });
    }, 2000);
  }, []);

  return (
    <NoticeContext.Provider value={{ showNotice }}>
      {children}
      {notice.open && (
        <div className="modal-backdrop" onClick={() => setNotice({ title: '', message: '', open: false })}>
          <div className="modal-card success-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-success success-popup-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <h3 className="success-popup-title">{notice.title}</h3>
                <span className="modal-subtitle success-popup-subtitle">Tersimpan</span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setNotice({ title: '', message: '', open: false })}
                type="button"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="success-popup-message">{notice.message}</p>
            </div>
          </div>
        </div>
      )}
    </NoticeContext.Provider>
  );
}

export function useNotice(): NoticeContextValue {
  const ctx = useContext(NoticeContext);
  if (!ctx) {
    throw new Error('useNotice harus dipanggil di dalam NoticeProvider');
  }
  return ctx;
}
