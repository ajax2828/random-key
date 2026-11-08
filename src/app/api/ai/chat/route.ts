import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings } from '@/lib/dataProvider';
import { getSessionUser } from '@/lib/session';
import { ChatMessage, ToolTopic, callLlm, canTryLlm, offlineReply, getIntro } from '@/lib/ai';

// POST /api/ai/chat — chatbot bantuan per alat
// Tamu (tanpa login) boleh memakai panduan offline; LLM hanya untuk user login
// agar API key server tidak dipakai publik tanpa batas.
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);

  const body = await request.json().catch(() => ({})) as {
    topic?: string;
    messages?: ChatMessage[];
  };

  const topic = (body.topic || 'mail') as ToolTopic;
  const messages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages.slice(-12) // batasi panjang percakapan
    : [];

  if (!messages.length) {
    return NextResponse.json({ reply: getIntro(topic), mode: 'offline' });
  }

  if (!user) {
    const last = messages[messages.length - 1];
    return NextResponse.json({
      reply: offlineReply(topic, last?.content || ''),
      mode: 'offline',
    });
  }

  const settings = await getAppSettings();

  if (canTryLlm(settings)) {
    try {
      const reply = await callLlm(settings, topic, messages);
      return NextResponse.json({ reply, mode: 'llm' });
    } catch {
      return NextResponse.json({
        reply:
          'Layanan AI sedang bermasalah. Berikut jawaban dari panduan offline:\n\n' +
          offlineReply(topic, messages[messages.length - 1].content),
        mode: 'offline',
      });
    }
  }

  const last = messages[messages.length - 1];
  return NextResponse.json({
    reply: offlineReply(topic, last?.content || ''),
    mode: 'offline',
  });
}