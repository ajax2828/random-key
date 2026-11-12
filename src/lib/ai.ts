/* ─────────────────────────────────────────────────────
   Provider catalog — semua AI agent yang didukung
   ───────────────────────────────────────────────────── */

export type AiFormat = 'openai' | 'anthropic' | 'gemini';

export interface AiProviderDef {
  id: string;
  label: string;
  baseUrl: string;
  requiresKey: boolean;
  defaultModel: string;
  format: AiFormat;
}

export interface AiSettings {
  ai_provider: string;
  ai_model: string;
  ai_api_key: string;
  ai_base_url: string;
}

export const AI_PROVIDERS: AiProviderDef[] = [
  { id: 'openai',     label: 'OpenAI',              baseUrl: 'https://api.openai.com/v1',                  requiresKey: true,  defaultModel: 'gpt-4o-mini',              format: 'openai' },
  { id: 'anthropic',  label: 'Anthropic (Claude)',   baseUrl: 'https://api.anthropic.com',                  requiresKey: true,  defaultModel: 'claude-3-5-haiku-20241022', format: 'anthropic' },
  { id: 'gemini',     label: 'Google Gemini',        baseUrl: 'https://generativelanguage.googleapis.com/v1beta', requiresKey: true, defaultModel: 'gemini-1.5-flash', format: 'gemini' },
  { id: 'groq',       label: 'Groq',                 baseUrl: 'https://api.groq.com/openai/v1',             requiresKey: true,  defaultModel: 'llama-3.1-8b-instant',     format: 'openai' },
  { id: 'deepseek',   label: 'DeepSeek',             baseUrl: 'https://api.deepseek.com/v1',                requiresKey: true,  defaultModel: 'deepseek-chat',            format: 'openai' },
  { id: 'mistral',    label: 'Mistral',              baseUrl: 'https://api.mistral.ai/v1',                  requiresKey: true,  defaultModel: 'mistral-small-latest',     format: 'openai' },
  { id: 'xai',        label: 'xAI (Grok)',           baseUrl: 'https://api.x.ai/v1',                        requiresKey: true,  defaultModel: 'grok-3-mini-latest',       format: 'openai' },
  { id: 'openrouter', label: 'OpenRouter',           baseUrl: 'https://openrouter.ai/api/v1',               requiresKey: true,  defaultModel: 'openai/gpt-4o-mini',       format: 'openai' },
  { id: 'ollama',     label: 'Ollama (Lokal)',       baseUrl: 'http://localhost:11434/v1',                  requiresKey: false, defaultModel: 'llama3.2',                 format: 'openai' },
  { id: 'lmstudio',   label: 'LM Studio (Lokal)',    baseUrl: 'http://localhost:1234/v1',                   requiresKey: false, defaultModel: '',                         format: 'openai' },
  { id: 'custom',     label: 'Custom (OpenAI-compatible)', baseUrl: '',                                  requiresKey: true,  defaultModel: '',                         format: 'openai' },
];

export function resolveAiProvider(id: string): AiProviderDef {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0];
}

export function getProviderLabel(id: string): string {
  return resolveAiProvider(id).label;
}

export function canTryLlm(settings: AiSettings): boolean {
  const def = resolveAiProvider(settings.ai_provider);
  if (def.requiresKey) return !!settings.ai_api_key;
  return true;
}

/* ─────────────────────────────────────────────────────
   Tool topics & knowledge base (offline)
   ───────────────────────────────────────────────────── */

export type ToolTopic = 'mail' | 'pass' | 'tools' | 'nota' | 'sertif' | 'doc';

const TOOL_LABELS: Record<ToolTopic, string> = {
  mail: 'GeneratMail (Email & Password acak)',
  pass: 'GeneratPass (Password Vault)',
  tools: 'GeneratPro (Profil & Auto-fill form)',
  nota: 'GeneratNota (Nota penjualan)',
  sertif: 'GeneratSertif (Sertifikat)',
  doc: 'GeneratDoc (Dokumen / kopsurat)',
};

interface Faq {
  keywords: string[];
  q: string;
  a: string;
}

interface ToolKB {
  intro: string;
  faqs: Faq[];
}

const KB: Record<ToolTopic, ToolKB> = {
  mail: {
    intro:
      'Halo! Saya asisten GeneratMail. Saya bisa bantu cara generate email & password acak, menyalin semua, atau menghapus data. Tanya apa saja!',
    faqs: [
      {
        keywords: ['simpan', 'save', 'database', 'db', 'supabase'],
        q: 'Bagaimana cara menyimpan hasil generate?',
        a: 'Hasil generate langsung tampil di daftar hasil (disimpan sementara di sesi browser, tanpa database). Cukup tekan "Generate & Simpan" lalu gunakan tombol salin / hapus di toolbar hasil.',
      },
      {
        keywords: ['hapus', 'delete', 'bersih', 'clear'],
        q: 'Bagaimana cara menghapus hasil?',
        a: 'Gunakan tombol "Hapus Semua" di toolbar hasil, atau tombol hapus per-item. Proses ini dilindungi verifikasi keamanan (captcha).',
      },
      {
        keywords: ['salin', 'copy', 'clipboard'],
        q: 'Bagaimana cara menyalin semua hasil?',
        a: 'Tekan "Salin Semua" pada toolbar hasil untuk menyalin semua email & password sekaligus ke clipboard.',
      },
      {
        keywords: ['export', 'csv', 'download'],
        q: 'Bagaimana cara export hasil ke CSV?',
        a: 'Tekan tombol "Export CSV" untuk mengunduh hasil dalam format CSV yang bisa dibuka di Excel / Google Sheets.',
      },
      {
        keywords: ['tidak', 'gagal', 'tidak muncul', 'error', 'tersimpan'],
        q: 'Hasil tidak muncul / muncul popup notifikasi?',
        a: 'Pastikan Anda sudah mengganti tab atau refresh halaman setelah generate. Hasil disimpan sementara di sesi browser dan tidak memakai database.',
      },
    ],
  },
  pass: {
    intro:
      'Halo! Saya asisten GeneratPass. Saya bisa bantu membuat password kuat, menyimpan ke vault, dan tips keamanan. Tanya apa saja!',
    faqs: [
      {
        keywords: ['generate', 'buat', 'password', 'cuat'],
        q: 'Bagaimana cara generate password?',
        a: 'Atur panjang & kombinasi karakter (huruf besar/kecil, angka, simbol), lalu klik "Generate 1 Password (Keamanan)". Response ide dengan verifikasi keamanan lalu password tampil di vault.',
      },
      {
        keywords: ['kuat', 'aman', 'strength', 'kekuatan'],
        q: 'Bagaimana membuat password yang kuat?',
        a: 'Gunakan panjang minimal 16 karakter dan aktifkan semua opsi (huruf besar, kecil, angka, simbol). Indikator kekuatan akan menunjukkan seberapa kuat passwordnya.',
      },
      {
        keywords: ['vault', 'simpan', 'tersimpan'],
        q: 'Password tersimpan di mana?',
        a: 'Password tersimpan sementara di sesi browser (localStorage) pada halaman ini, tanpa database.',
      },
      {
        keywords: ['hapus', 'delete'],
        q: 'Bagaimana menghapus password di vault?',
        a: 'Gunakan tombol "Hapus Semua" atau hapus per kartu. Ada verifikasi keamanan (captcha).',
      },
      {
        keywords: ['salin', 'copy'],
        q: 'Bagaimana menyalin password?',
        a: 'Klik tombol salin pada kartu vault atau "Salin Semua" untuk menyalin semuanya.',
      },
    ],
  },
  tools: {
    intro:
      'Halo! Saya asisten GeneratPro. Saya bisa bantu generate profil lengkap dan autofill formulir. Tanya apa saja!',
    faqs: [
      {
        keywords: ['generate', 'profil', 'buat'],
        q: 'Bagaimana cara generate profil?',
        a: 'Klik "Generate" untuk membuat profil acak lalu tampilkan di daftar hasil, atau gunakan tombol autofill untuk langsung mengisi formulir dengan bookmarklet.',
      },
      {
        keywords: ['autofill', 'bookmarklet', 'isi formulir', 'form'],
        q: 'Bagaimana cara autofill formulir?',
        a: 'Gunakan "Buka & Auto-Fill Form": salin bookmarklet, lalu jalankan pada formulir target. Buka "Salin Bookmarklet Auto-Fill" untuk mengambilnya.',
      },
      {
        keywords: ['export', 'csv', 'json', 'download'],
        q: 'Bagaimana export profil?',
        a: 'Gunakan tombol Export CSV atau Export JSON pada toolbar hasil.',
      },
      {
        keywords: ['hapus', 'delete'],
        q: 'Bagaimana menghapus semua profil?',
        a: 'Tekan "Hapus Semua" di toolbar (dengan verifikasi captcha) untuk membersihkan daftar profil di sesi browser.',
      },
      {
        keywords: ['error', 'gagal', 'tidak tersimpan', 'popup'],
        q: 'Profil tidak muncul?',
        a: 'Pastikan Anda sudah mengganti tab atau refresh halaman setelah generate. Daftar profil ditampilkan dari sesi browser dan tidak memakai database.',
      },
    ],
  },
  nota: {
    intro:
      'Halo! Saya asisten GeneratNota. Saya bisa bantu menyusun nota penjualan dan mencetak. Tanya apa saja!',
    faqs: [
      {
        keywords: ['tambah', 'item', 'barang', 'baris'],
        q: 'Bagaimana menambah barang di nota?',
        a: 'Tekan "Tambah Barang" untuk menambahkan baris baru di tabel nota, lalu isi nama barang, harga, dan jumlah.',
      },
      {
        keywords: ['cetak', 'print', 'save as pdf', 'pdf'],
        q: 'Bagaimana mencetak nota?',
        a: 'Tekan "Cetak Nota" untuk membuka dialog cetak browser — lalu pilih tujuan output "Save as PDF" atau printer Anda.',
      },
      {
        keywords: ['total', 'total harga', 'harga'],
        q: 'Bagaimana cara menghitung total?',
        a: 'Total otomatis dihitung dari semua baris barang ketika nota dicetak.',
      },
    ],
  },
  sertif: {
    intro:
      'Halo! Saya asisten GeneratSertif. Saya bisa bantu generate sertifikat dari daftar nama (CSV). Tanya apa saja!',
    faqs: [
      {
        keywords: ['csv', 'nama', 'import', 'daftar'],
        q: 'Bagaimana cara input daftar nama?',
        a: 'Tempel daftar nama atau hasil CSV ke area input, lalu atur nomor sertifikat otomatis. Tekan "Generate Semua Sertifikat".',
      },
      {
        keywords: ['preview', 'tampilkan', 'lihat'],
        q: 'Bagaimana melihat hasilnya?',
        a: 'Tekan "Tampilkan Preview" untuk melihat hasil, lalu download per-item atau semuanya (ZIP).',
      },
      {
        keywords: ['download', 'zip', 'unduh'],
        q: 'Bagaimana mengunduh semua sertifikat sekaligus?',
        a: 'Gunakan tombol "Download Semua (ZIP)" untuk mengunduh semua sertifikat dalam satu file ZIP.',
      },
    ],
  },
  doc: {
    intro:
      'Halo! Saya asisten GeneratDoc. Saya bisa bantu menyusun dokumen ber-kopsurat dan mengunduh dalam format DOC/PDF. Tanya apa saja!',
    faqs: [
      {
        keywords: ['kopsurat', 'logo', 'template', 'header'],
        q: 'Bagaimana menambahkan logo/template kopsurat?',
        a: 'Di bagian "Kopsurat" pilih template (Klasik kiri / Tengah / Formal garis ganda) dan klik "Upload Logo" untuk memilih gambar logo. Hasilnya muncul di header dokumen.',
      },
      {
        keywords: ['download', 'doc', 'pdf', 'unduh'],
        q: 'Bagaimana mengunduh dokumen?',
        a: 'Tekan "Download DOC" untuk file Word, atau "Download PDF" untuk file PDF. Format HTML sudah diganti menjadi DOC & PDF.',
      },
      {
        keywords: ['tabel', 'section', 'bab'],
        q: 'Bagaimana menambahkan tabel dan section?',
        a: 'Aktifkan "Aktifkan Tabel" untuk menambah tabel per section, dan gunakan "+ Tambah Section" untuk bab baru. Ukuran font & jenis font bisa diatur per section.',
      },
      {
        keywords: ['preview', 'lihat'],
        q: 'Bagaimana melihat preview sebelum download?',
        a: 'Tekan "Preview Dokumen" untuk melihat hasil akhir di jendela pratinjau.',
      },
    ],
  },
};

export function getToolLabel(topic: ToolTopic): string {
  return TOOL_LABELS[topic];
}

export function getIntro(topic: ToolTopic): string {
  return KB[topic]?.intro || 'Halo! Saya asisten bantuan RandMail. Tanya apa saja!';
}

export function getQuickQuestions(topic: ToolTopic): string[] {
  const kb = KB[topic];
  if (!kb) return [];
  return kb.faqs.slice(0, 3).map((f) => f.q);
}

/**
 * Respons offline berbasis aturan — dipakai bila API key AI belum diisi.
 */
export function offlineReply(topic: ToolTopic, userMessage: string): string {
  const kb = KB[topic];
  if (!kb) {
    return 'Halo! Saya asisten bantuan RandMail. Karena API key AI belum diisi, saya menjawab dari panduan offline. Tanyakan cara pakai alat yang sedang Anda gunakan!';
  }

  const msg = userMessage.toLowerCase();
  for (const faq of kb.faqs) {
    if (faq.keywords.some((k) => msg.includes(k.toLowerCase()))) {
      return `${faq.a}\n\n(Panduan offline — untuk jawaban LLM lebih pintar, isi API key AI di pengaturan aplikasi.)`;
    }
  }

  return `Saya tidak yakin soal itu. Berikut yang bisa saya bantu untuk ${getToolLabel(topic)}:
${kb.faqs.map((f, i) => `${i + 1}. ${f.q}`).join('\n')}
Ketik salah satu topik di atas.`;
}

/* ─────────────────────────────────────────────────────
   LLM helpers
   ───────────────────────────────────────────────────── */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(topic: ToolTopic): string {
  return `Kamu adalah asisten bantuan untuk aplikasi RandMail, khusus alat "${TOOL_LABELS[topic]}". Jawab dalam Bahasa Indonesia, singkat, jelas, dan ramah. Hindari jawaban panjang.`;
}

function buildHeaders(def: AiProviderDef, settings: AiSettings): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (def.requiresKey && settings.ai_api_key) {
    if (def.format === 'anthropic') {
      headers['x-api-key'] = settings.ai_api_key;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${settings.ai_api_key}`;
    }
  }
  return headers;
}

function buildBody(
  def: AiProviderDef,
  system: string,
  messages: ChatMessage[],
  maxTokens: number,
  model: string
): unknown {
  if (def.format === 'anthropic') {
    return {
      model,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
  }
  if (def.format === 'gemini') {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    return {
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: maxTokens },
    };
  }
  // openai-compatible
  return {
    model,
    messages: [{ role: 'system', content: system }, ...messages],
    max_tokens: maxTokens,
  };
}

function extractReply(def: AiProviderDef, data: unknown): string {
  if (def.format === 'anthropic') {
    const d = data as { content?: { text?: string }[] };
    return d?.content?.[0]?.text || '';
  }
  if (def.format === 'gemini') {
    const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return d?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  }
  const d = data as { choices?: { message?: { content?: string } }[] };
  return d?.choices?.[0]?.message?.content || '';
}

/**
 * Panggil LLM eksternal. Melempar error bila gagal —
 * pemanggil wajib fallback ke offlineReply.
 */
export async function callLlm(
  settings: AiSettings,
  topic: ToolTopic,
  messages: ChatMessage[]
): Promise<string> {
  const def = resolveAiProvider(settings.ai_provider);
  const base = settings.ai_base_url || def.baseUrl;
  const model = settings.ai_model || def.defaultModel;
  const system = buildSystemPrompt(topic);
  const body = buildBody(def, system, messages, 500, model);
  const headers = buildHeaders(def, settings);

  let res: Response;
  if (def.format === 'gemini') {
    const keyParam = def.requiresKey ? `&key=${encodeURIComponent(settings.ai_api_key)}` : '';
    const url = `${base}/models/${model}:generateContent?alt=json${keyParam}`;
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } else {
    const url = def.format === 'anthropic' ? `${base}/v1/messages` : `${base}/chat/completions`;
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  }

  if (!res.ok) throw new Error(`${def.label}: HTTP ${res.status}`);
  const data = await res.json();
  const text = extractReply(def, data);
  if (!text) throw new Error(`${def.label}: tidak ada konten dalam respons`);
  return text;
}

/* ─────────────────────────────────────────────────────
   Ping / tes koneksi
   ───────────────────────────────────────────────────── */

export async function pingAi(
  settings: AiSettings
): Promise<{ ok: boolean; message: string }> {
  const def = resolveAiProvider(settings.ai_provider);
  const base = settings.ai_base_url || def.baseUrl;
  const model = settings.ai_model || def.defaultModel;

  if (!base) {
    return { ok: false, message: 'Base URL tidak boleh kosong untuk provider Custom.' };
  }
  if (def.requiresKey && !settings.ai_api_key) {
    return { ok: false, message: `${def.label}: API key belum diisi.` };
  }

  const testMessages: ChatMessage[] = [{ role: 'user', content: 'ping' }];
  const system = 'Balas dengan satu kata saja: OK.';
  const body = buildBody(def, system, testMessages, 10, model);
  const headers = buildHeaders(def, settings);

  try {
    let res: Response;
    if (def.format === 'gemini') {
      const keyParam = def.requiresKey ? `&key=${encodeURIComponent(settings.ai_api_key)}` : '';
      res = await fetch(
        `${base}/models/${model}:generateContent?alt=json${keyParam}`,
        { method: 'POST', headers, body: JSON.stringify(body) }
      );
    } else {
      const url = def.format === 'anthropic' ? `${base}/v1/messages` : `${base}/chat/completions`;
      res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    }
    if (res.ok) return { ok: true, message: `${def.label}: kunci valid — ${model}.` };
    return { ok: false, message: `${def.label}: HTTP ${res.status}. Periksa key / base URL.` };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? `${def.label}: ${err.message}` : `${def.label}: gagal terhubung.`,
    };
  }
}
