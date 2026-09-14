'use client';

import React from 'react';

export interface CredentialPair {
  id: string;
  email: string;
  password: string;
  created_at?: string;
}

interface ResultItemProps {
  pair: CredentialPair;
  index: number;
  onCopy: (text: string, label: string) => void;
  onDelete: (id: string) => void;
}

export default function ResultItem({ pair, index, onCopy, onDelete }: ResultItemProps) {
  const handleCopyBoth = () => {
    onCopy(`${pair.email}\n${pair.password}`, 'Email & Password tersalin!');
  };

  return (
    <div className="result-item">
      <div className="result-index">{index + 1}</div>

      <div className="result-field">
        <span className="result-label email-label">Email</span>
        <span
          className="result-value"
          title="Klik untuk salin email"
          onClick={() => onCopy(pair.email, 'Email tersalin!')}
        >
          {pair.email}
        </span>
      </div>

      <div className="result-field">
        <span className="result-label password-label">Password</span>
        <span
          className="result-value"
          title="Klik untuk salin password"
          onClick={() => onCopy(pair.password, 'Password tersalin!')}
        >
          {pair.password}
        </span>
      </div>

      <div className="result-actions">
        <button
          className="btn-action"
          title="Salin Keduanya"
          onClick={handleCopyBoth}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>

        <button
          className="btn-action delete"
          title="Hapus"
          onClick={() => onDelete(pair.id)}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
