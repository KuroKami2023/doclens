# DEPLOYMENT.md — Vercel + Supabase + NVIDIA only

No AWS, no Docker, no paid services. Free tiers suffice for the whole demo.

## 1. Supabase (free)

1. app.supabase.com → New project → note URL + anon key.
2. SQL Editor → paste & run `supabase/schema.sql` → then `supabase/storage.sql`.
3. Authentication → Providers → enable Email. (Confirmations: on for prod.)
4. Optional: Storage → confirm private bucket `doclens-docs` exists.

## 2. NVIDIA (free tier)

1. build.nvidia.com → generate API key.
2. Keep it server-side: you will paste it **only** into Vercel env vars.

## 3. Vercel Hobby

1. Push this folder to GitHub (`.env` is gitignored — secrets never committed).
2. vercel.com → Add New Project → import the repo.
3. Framework preset: Vite. Build: `npm run build`. Output: `dist`.
   (`vercel.json` already pins this + the Node runtime for `api/**/*.js`.)
4. Settings → Environment Variables (all environments):
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `NVIDIA_API_KEY` = your NVIDIA key (**no** `VITE_` prefix)
   - optional: `NVIDIA_BASE_URL`, `NVIDIA_MODEL`
5. Deploy. Then verify:
   - `https://<app>.vercel.app/api/health` → `{"ok":true,…,"nvidiaConfigured":true}`
   - Sign up → Dashboard → Load synthetic demo → open a document.
   - Upload a real PDF → status flows to `done` with extraction + confidence.

## Local parity

```bash
npm install
cp .env.example .env   # VITE_* only
NVIDIA_API_KEY=... npx vercel dev   # runs Vite + /api together
```

## Rollback / rotation

- Redeploy any previous Vercel deployment for instant rollback.
- Rotate the NVIDIA key at build.nvidia.com → update the Vercel env var →
  redeploy. No code change needed.
