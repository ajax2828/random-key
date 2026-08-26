'use client';

import React from 'react';
import ResultItem, { CredentialPair } from './ResultItem';

interface ResultsListProps {
  pairs: CredentialPair[];
  onCopy: (text: string, label: string) => void;
  onDelete: (id: string) => void;
}

export default function ResultsList({ pairs, onCopy, onDelete }: ResultsListProps) {
  if (pairs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>
          </svg>
        </div>
        <p>Click <strong>Generate & Save</strong> to create email & password pairs</p>
        <span style={{ fontSize: '0.78rem' }}>Results will automatically sync with Supabase database</span>
      </div>
    );
  }

  return (
    <div className="results-list">
      {pairs.map((pair, idx) => (
        <ResultItem
          key={pair.id}
          pair={pair}
          index={idx}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
