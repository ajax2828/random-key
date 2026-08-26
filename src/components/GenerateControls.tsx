'use client';

import React from 'react';

interface GenerateControlsProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onGenerate: () => void;
  onExport: () => void;
  isGenerating: boolean;
}

export default function GenerateControls({
  quantity,
  onQuantityChange,
  onGenerate,
  onExport,
  isGenerating,
}: GenerateControlsProps) {
  return (
    <div className="generate-section">
      <div className="quantity-control">
        <label htmlFor="gen-quantity">Generate</label>
        <div className="quantity-input-group">
          <button
            className="qty-btn"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            type="button"
          >
            −
          </button>
          <input
            type="number"
            id="gen-quantity"
            value={quantity}
            min="1"
            max="100"
            onChange={(e) => onQuantityChange(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          />
          <button
            className="qty-btn"
            onClick={() => onQuantityChange(Math.min(100, quantity + 1))}
            type="button"
          >
            +
          </button>
        </div>
        <span className="qty-label">pairs</span>
      </div>

      <button
        className="btn-generate"
        onClick={onGenerate}
        disabled={isGenerating}
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
        </svg>
        <span>{isGenerating ? 'Generating...' : 'Generate & Save'}</span>
      </button>

      <button className="btn-export" onClick={onExport} type="button" title="Export as CSV">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Export CSV</span>
      </button>
    </div>
  );
}
