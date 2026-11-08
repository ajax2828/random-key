'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ToolTopic, ChatMessage, getIntro, getQuickQuestions } from '@/lib/ai';

interface AiAssistantProps {
  topic: ToolTopic;
  title?: string;
}

export default function AiAssistant({ topic, title }: AiAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: getIntro(topic) },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'offline' | 'llm' | 'checking'>('offline');
  const bodyRef = useRef<HTMLDivElement>(null);

  const quick = getQuickQuestions(topic);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    setBusy(true);
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          messages: [...messages, { role: 'user', content: trimmed }],
        }),
      });
      const data = (await res.json()) as { reply?: string; mode?: 'llm' | 'offline' };
      setMode(data.mode || 'offline');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.reply || 'Maaf, saya tidak bisa menjawab saat ini. Silakan coba lagi.',
        },
      ]);
    } catch {
      setMode('offline');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Gagal terhubung ke server. Periksa koneksi Anda lalu coba lagi.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: getIntro(topic) }]);
    setMode('offline');
  };

  return (
    <>
      {!open && (
        <button
          className="ai-bubble"
          onClick={() => setOpen(true)}
          type="button"
          title="Bantuan AI"
          aria-label="Bantuan AI"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="ai-bubble-label">AI Bantuan</span>
        </button>
      )}

      {open && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <span className="ai-panel-avatar">🤖</span>
              <div>
                <strong>{title || 'AI Bantuan'}</strong>
                <span className="ai-panel-mode">
                  {mode === 'llm' ? '• AI online' : '• Mode panduan offline'}
                </span>
              </div>
            </div>
            <div className="ai-panel-actions">
              <button className="ai-icon-btn" onClick={resetChat} type="button" title="Reset percakapan">
                ↺
              </button>
              <button className="ai-icon-btn" onClick={() => setOpen(false)} type="button" title="Tutup">
                ×
              </button>
            </div>
          </div>

          <div className="ai-messages" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`}>
                <span className="ai-msg-bubble">{m.content}</span>
              </div>
            ))}
            {busy && (
              <div className="ai-msg ai-msg-bot">
                <span className="ai-msg-bubble ai-typing">Mengetik…</span>
              </div>
            )}
          </div>

          {messages.length <= 1 && quick.length > 0 && (
            <div className="ai-chips">
              {quick.map((q) => (
                <button key={q} className="ai-chip" type="button" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="ai-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya soal Generator ini..."
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Kirim">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}