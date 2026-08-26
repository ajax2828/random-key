'use client';

import React from 'react';
import { EmailOptions } from '@/lib/generators';

interface EmailSettingsProps {
  options: EmailOptions;
  onChange: (options: EmailOptions) => void;
}

export default function EmailSettings({ options, onChange }: EmailSettingsProps) {
  const updateOption = <K extends keyof EmailOptions>(key: K, value: EmailOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="card card-email">
      <div className="card-header">
        <div className="card-icon email-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>
          </svg>
        </div>
        <h2>Email Settings</h2>
      </div>

      <div className="card-body">
        <div className="form-group">
          <label htmlFor="email-prefix-style">Username Style</label>
          <select
            id="email-prefix-style"
            value={options.style}
            onChange={(e) => updateOption('style', e.target.value as EmailOptions['style'])}
          >
            <option value="random">Random Characters</option>
            <option value="name">Name-Based</option>
            <option value="word">Word Combo</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="email-length">Username Length: <span>{options.length}</span></label>
          <input
            type="range"
            id="email-length"
            min="5"
            max="20"
            value={options.length}
            onChange={(e) => updateOption('length', parseInt(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email-domain">Domain</label>
          <select
            id="email-domain"
            value={options.domain}
            onChange={(e) => updateOption('domain', e.target.value)}
          >
            <option value="@gmail.com">gmail.com</option>
            <option value="@yahoo.com">yahoo.com</option>
            <option value="@outlook.com">outlook.com</option>
            <option value="@hotmail.com">hotmail.com</option>
            <option value="@protonmail.com">protonmail.com</option>
            <option value="@mail.com">mail.com</option>
            <option value="random">Random Domain</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-check">
            <input
              type="checkbox"
              id="email-numbers"
              checked={options.includeNumbers}
              onChange={(e) => updateOption('includeNumbers', e.target.checked)}
            />
            <label htmlFor="email-numbers">Include Numbers</label>
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              id="email-dots"
              checked={options.includeDots}
              onChange={(e) => updateOption('includeDots', e.target.checked)}
            />
            <label htmlFor="email-dots">Include Dots</label>
          </div>
        </div>
      </div>
    </div>
  );
}
