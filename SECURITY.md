# SECURITY.md — DocLens AI threat model & controls

## Secrets

- `NVIDIA_API_KEY` exists **only** as a Vercel environment variable, read in
  `api/_lib/nvidia.js`. No `VITE_*` prefix, never imported by `src/`, never
  logged, never returned (health endpoint exposes only a boolean).
- Supabase: only URL + **anon** key in the browser. No service-role key in the
  repo, Vercel, or docs. Cross-user isolation comes from RLS, not secrecy.

## Authentication & ownership

- Supabase Auth email/password; session via `@supabase/supabase-js`; logged-out
  users are bounced to `/login` by `ProtectedRoute`.
- Every table has `owner_id` + RLS policies (`auth.uid() = owner_id`); profiles
  keyed by `id = auth.uid()`. Storage policies require the first path segment
  to equal `auth.uid()`. One user can never read/write another's rows or
  objects, even with a stolen anon key.

## Input validation & file limits

- Client (`UploadZone` + `supabaseClient.js`): extension allowlist
  (pdf/png/jpg/jpeg/webp/tif/tiff), 10 MB cap, non-empty check — for UX speed.
- Server (`api/_lib/validation.js`): strict body shape, OCR 10…120k chars,
  `pageCount` 1…10. PDF pages capped at 10 during render (DoS guard).
- Filenames sanitized (`[^a-zA-Z0-9._-]` → `_`); storage paths are
  server-structured (`<uid>/<docId>/…`), never raw user paths.

## Abuse controls

- `POST /api/analyze`: 20 req/min/IP sliding window → `429` + `Retry-After`.
  Documented limitation: in-memory per serverless isolate, so a distributed
  flood needs an external counter (Upstash etc.) — out of scope for a
  zero-paid-services Hobby app; bursts from one client are still stopped.
- OCR truncation (24k chars to the model) bounds token spend per call.

## Storage & transport

- Bucket `doclens-docs` private; previews via 1-hour signed URLs; HTTPS only
  (Vercel + Supabase defaults); originals + page PNGs deleted with the record.

## Residual risks (honest)

- Per-isolate rate limiting (see above); JWT theft via XSS is mitigated by
  React escaping + no `dangerouslySetInnerHTML`, but users should still use
  Supabase's default short-lived sessions; demo rows are synthetic by design.
