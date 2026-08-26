'use client';

import React from 'react';
import { PasswordOptions } from '@/lib/generators';

interface PasswordSettingsProps {
  options: PasswordOptions;
  onChange: (options: PasswordOptions) => void;
}

export default function PasswordSettings({ options, onChange }: PasswordSettingsProps) {
  const updateOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  // Calculate Password Strength
  const calculateStrength = () => {
    const { length, useUpper, useLower, useNumbers, useSymbols } = options;
    const types = [useUpper, useLower, useNumbers, useSymbols].filter(Boolean).length;

    let score = 0;
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (length >= 24) score += 1;
    score += types;

    if (score <= 2) return { label: 'Weak', color: '#fb7185', width: '25%' };
    if (score <= 4) return { label: 'Fair', color: '#fbbf24', width: '50%' };
    if (score <= 6) return { label: 'Strong', color: '#34d399', width: '75%' };
    return { label: 'Very Strong', color: '#06b6d4', width: '100%' };
  };

  const strength = calculateStrength();

  return (
    <div className="card card-password">
      <div className="card-header">
        <div className="card-icon password-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2>Password Settings</h2>
      </div>

      <div className="card-body">
        <div className="form-group">
          <label htmlFor="pass-length">Length: <span>{options.length}</span></label>
          <input
            type="range"
            id="pass-length"
            min="8"
            max="64"
            value={options.length}
            onChange={(e) => updateOption('length', parseInt(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Character Types</label>
          <div className="char-types">
            <div className="form-check">
              <input
                type="checkbox"
                id="pass-upper"
                checked={options.useUpper}
                onChange={(e) => updateOption('useUpper', e.target.checked)}
              />
              <label htmlFor="pass-upper">A-Z</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="pass-lower"
                checked={options.useLower}
                onChange={(e) => updateOption('useLower', e.target.checked)}
              />
              <label htmlFor="pass-lower">a-z</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="pass-numbers"
                checked={options.useNumbers}
                onChange={(e) => updateOption('useNumbers', e.target.checked)}
              />
              <label htmlFor="pass-numbers">0-9</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="pass-symbols"
                checked={options.useSymbols}
                onChange={(e) => updateOption('useSymbols', e.target.checked)}
              />
              <label htmlFor="pass-symbols">!@#$</label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Password Strength</label>
          <div className="strength-meter">
            <div
              className="strength-bar"
              style={{ width: strength.width, background: strength.color }}
            />
          </div>
          <span className="strength-label" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>
      </div>
    </div>
  );
}
