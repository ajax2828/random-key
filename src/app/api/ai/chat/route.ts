import { NextRequest, NextResponse } from 'next/server';
import { ToolTopic, getIntro, offlineReply } from '@/lib/ai';

// POST /api/ai/chat — chatbot bantuan per alat (mode tanpa login & tanpa database)
// Selalu memakai mode offline karena tidak ada pengaturan AI yang tersimpan.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as {
    topic?: string;
    messages?: { role: string; content: string }[];
  };

  const topic = (body.topic || 'mail') as ToolTopic;
  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter((m) => m && typeof m.content === 'string')
        .slice(-12)
        .map((m) => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: m.content }))
    : [];

  if (!messages.length) {
    return NextResponse.json({ reply: getIntro(topic), mode: 'offline' });
  }

  const last = messages[messages.length - 1];
  return NextResponse.json({
    reply: offlineReply(topic, last?.content || ''),
    mode: 'offline',
  });
}
