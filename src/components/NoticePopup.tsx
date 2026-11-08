'use client';

import React from 'react';

interface NoticePopupProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function NoticePopup({ open, title, message, onClose }: NoticePopupProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card notice-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon-warning notice-popup-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3>{title}</h3>
            <span className="modal-subtitle notice-popup-subtitle">Tidak Tersimpan</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p className="notice-popup-message">{message}</p>
          <div className="modal-footer-actions">
            <button type="button" className="btn-modal-next" onClick={onClose}>
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}