# RandMail

Generator acak berbasis web: email & password, password vault, profil form-filler,
nota penjualan (Invoc), sertifikat, dan dokumen ber-kopsurat.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- PostgreSQL lokal (`pg`) sebagai database utama; Supabase sebagai opsi provider data
- Auth: JWT + cookie httpOnly, password di-hash bcrypt
- AI assistant: OpenAI / Anthropic / Gemini / Groq / DeepSeek / Mistral / xAI /
  OpenRouter / Ollama / LM Studio / Custom (OpenAI-compatible), dengan mode
  panduan offline bila API key belum diisi

## Struktur

```
src/app/              Halaman & API route
  dashboard/          Ringkasan, monitoring, koneksi DB & AI, cleanup
  dashboard/generate  GeneratMail (email + password acak)
  pass/               GeneratPass (password vault)
  tools/              GeneratPro (profil + autofill form)
  nota/               Invoc (nota penjualan)
  sertif/             GeneratSertif (sertifikat dari daftar nama)
  doc/                GeneratDoc (dokumen + kopsurat)
  history/            Riwayat gabungan
  api/                accounts, vault, profiles, auth/*, admin/*, health, usage, ai/chat
src/components/       Navbar, AuthForm, AiAssistant, NoticePopup, modal verifikasi, dsb.
src/lib/              db, dataProvider, session, ai, usage, schema.sql, generator
```

## Menjalankan

### Lokal

```bash
npm install
npm run db:setup     # buat tabel dari src/lib/schema.sql (butuh DATABASE_URL)
npm run dev
```

Buka http://localhost:3000

### Docker

```bash
docker compose up -d
```

Layanan: http://localhost:9012 (db Postgres di port 5432).

## Variabel Lingkungan

Lihat `.env.example`. Nilai yang dipakai:

| Variabel | Fungsi |
| --- | --- |
| `DATABASE_URL` | Koneksi PostgreSQL (host/port/user/password/database) |
| `JWT_SECRET` | Kunci penandatanganan token sesi |
| `AI_PROVIDER` / `AI_MODEL` / `AI_BASE_URL` / `AI_API_KEY` | Override opsional kunci AI dari environment |

Koneksi database & kunci AI juga bisa diatur lewat Dashboard → Koneksi Database & AI
(tersimpan di tabel `app_settings`).

## Script

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run db:setup` | Terapkan `src/lib/schema.sql` ke database |

## Mode Demo

Halaman login menyediakan kredensial demo (akun demo tanpa baris di database),
berguna untuk mencoba aplikasi saat PostgreSQL belum tersedia.
