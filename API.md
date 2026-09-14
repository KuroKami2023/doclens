# API.md — Vercel JavaScript serverless functions

Base URL: same origin as the app (`/api/*`). Runtime `@vercel/node@3.1.5`
(see `vercel.json`). JavaScript only — no TypeScript.

## POST /api/analyze

Secure Nemotron understanding. Body → validation → prompt → NVIDIA → parse →
normalize → JSON. The key never leaves the server.

Request (`application/json`):

```json
{
  "ocrText": "INVOICE #INV-…",
  "fileName": "invoice.pdf",
  "mimeType": "application/pdf",
  "pageCount": 2
}
```

Constraints: `ocrText` 10…120,000 chars (forwarded truncated at 24,000);
`pageCount` integer 1…10; `fileName`/`mimeType` optional strings.

Success `200`:

```json
{
  "doc_type": "invoice",
  "fields": { "invoice_number": "INV-…", "notes": null },
  "field_confidence": { "invoice_number": 98, "notes": 0 },
  "overall_confidence": 93.2,
  "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
  "truncatedOcr": false,
  "latencyMs": 2314
}
```

Errors: `400` bad body (message in `error`); `405` non-POST; `429` rate-limited
(`Retry-After` header + `X-RateLimit-Remaining` always set); `500` missing
`NVIDIA_API_KEY`; `502` NVIDIA failure or non-JSON model output (first 300
chars in `detail`/`debug`, never the key).

Example:

```bash
curl -X POST https://<app>.vercel.app/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"ocrText":"INVOICE number INV-1 total 10.00 USD …"}'
```

## GET /api/health

Liveness, no auth: `{ ok, service, time, nvidiaConfigured (bool only),
model }`. Use it to verify the NVIDIA key is set without exposing it.

## Internals (`api/_lib/`)

- `validation.js` — `validateAnalyzeBody`, `truncateOcr`, limits.
- `nvidia.js` — `SCHEMAS`, `buildPrompt`, `callNemotron`, `safeParseJson`,
  `normalizeResult`.
- `rateLimit.js` — per-IP sliding window (20/min). Per-isolate memory:
  best-effort on serverless, documented in `SECURITY.md`.
