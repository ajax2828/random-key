# RandMail

Generator acak berbasis web: email & password, password vault, profil form-filler,
nota penjualan (Invoc), sertifikat, dan dokumen ber-kopsurat.

## Mode

Aplikasi berjalan di **mode tanpa login & tanpa database**:

- **Tidak ada login** — semua halaman (termasuk dashboard, generator, history) bisa
  langsung dibuka tanpa autentikasi. Tidak ada halaman /login atau /register.
- **Tidak ada database** — tidak ada penyimpanan ke PostgreSQL/Supabase. Hasil generate
  disimpan sementara di sesi browser (localStorage untuk vault, state untuk hasil
  generate) dan tidak pernah masuk ke database.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- AI assistant: OpenAI / Anthropic / Gemini / Groq / DeepSeek / Mistral / xAI /
  OpenRouter / Ollama / LM Studio / Custom (OpenAI-compatible), dengan mode
  panduan offline bila API key belum diisi

## Struktur

```
src/app/              Halaman & API route
  dashboard/          Ringkasan, monitoring, quick links
  dashboard/generate  GeneratMail (email + password acak)
  pass/               GeneratPass (password vault lokal)
  tools/              GeneratPro (profil + autofill form)
  nota/               GeneratNota (nota penjualan)
  sertif/             GeneratSertif (sertifikat dari daftar nama)
  doc/                GeneratDoc (dokumen + kopsurat)
  history/            Riwayat (kosong — tanpa penyimpanan backend)
  api/                accounts, vault, profiles, auth/user, auth/logout, health, usage, ai/chat
src/components/       Navbar, AiAssistant, modal verifikasi captcha, dsb.
src/lib/              session, ai, usage, generators, dsb.
```

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

### Docker

```bash
docker compose up -d
```

Layanan: http://localhost:9012

## Variabel Lingkungan

Tidak ada lagi variabel database (DATABASE_URL / JWT_SECRET) yang wajib.
Sisa konfigurasi AI bisa lewat environment (`AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL`, `AI_API_KEY`).

Lihat `.env.example`.

## Script

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run db:setup` | Tidak diperlukan (tidak ada database) |

## Catatan

- Semua endpoint API publik (`/api/*`) kini beroperasi tanpa autentikasi & tanpa
  database (mengembalikan data kosong / mode offline).
- Verifikasi keamanan (captcha) tetap dipakai untuk aksi generasi/hapus.
