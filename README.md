# DocLens AI — Intelligent Document Processing

JavaScript-only SaaS for document understanding: upload invoices, receipts,
purchase orders, resumes, contracts, and general documents → OCR + computer
vision → NVIDIA Nemotron multimodal extraction → searchable, classified,
confidence-scored records.

**Stack:** React · JavaScript · Vite · Tailwind CSS · Supabase (Auth +
PostgreSQL + Storage) · Vercel Hobby (hosting + JS serverless functions) ·
NVIDIA Nemotron 3 Nano Omni 30B A3B Reasoning · Tesseract.js · OpenCV.js ·
PDF.js. No AWS, no paid cloud, no TypeScript.

## Quick start

```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
```

## Supabase setup (10 min)

1. Create a free Supabase project.
2. SQL Editor → run `supabase/schema.sql`, then `supabase/storage.sql`.
3. Auth → enable Email provider (confirmation optional for local dev).
4. Copy Project URL + anon key into `.env`.
5. Storage bucket `doclens-docs` is created private by `storage.sql`.

## NVIDIA setup (server-side only)

1. Get a key at build.nvidia.com (free tier works).
2. **Never** put it in `.env` or any `VITE_*` var — the browser must not see it.
3. Local: `NVIDIA_API_KEY=... npx vercel dev` (serverless functions need it).
4. Vercel Dashboard → Settings → Environment Variables → add `NVIDIA_API_KEY`
   (plus optional `NVIDIA_BASE_URL`, `NVIDIA_MODEL`). Redeploy.

## Run the demo (no key needed)

Sign in → Dashboard → **Load synthetic demo**. Six labeled synthetic documents
(`src/demo/syntheticDocs.js`, `public/demo-docs/`) populate every table so
analytics, search, filters, history, and exports work instantly. Demo rows are
tagged `demo-synthetic` and never presented as AI output on real files.

## Features

Upload · preview (signed URLs) · per-page OCR text · AI extraction ·
classification (6 types) · per-field + overall confidence · search (file name +
OCR text) · type/status filters · processing history · delete (DB + storage) ·
export JSON/CSV · dashboard analytics (totals, by-type, OCR success rate, avg
confidence, avg processing time, recent).

## Truthfulness contract

The AI prompt (`api/_lib/nvidia.js`) forbids invention: unknowable fields are
`null` with `0` confidence. The server normalizer drops unknown fields and
fills missing ones with `null`. See `AI_PIPELINE.md`.

## Docs

| File | Covers |
|---|---|
| `ARCHITECTURE.md` | system map, data flow, file tree |
| `OCR_PIPELINE.md` | PDF.js → OpenCV → Tesseract |
| `AI_PIPELINE.md` | Nemotron prompt, schemas, null policy |
| `DATABASE.md` | tables, RLS, storage |
| `API.md` | `/api/analyze`, `/api/health` |
| `SECURITY.md` | auth, validation, rate limits, keys |
| `DEPLOYMENT.md` | Vercel + Supabase + NVIDIA deploy |

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build (`dist/`)
- `npm run preview` — preview the build
