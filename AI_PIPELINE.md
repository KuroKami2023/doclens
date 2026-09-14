# AI_PIPELINE.md — NVIDIA Nemotron multimodal understanding

Model: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`
Endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
Call site: **only** `api/_lib/nvidia.js` via `POST /api/analyze`. The browser
never sees `NVIDIA_API_KEY`.

## Input

`{ ocrText (≤120k chars validated, ≤24k forwarded), fileName, mimeType,
pageCount }`. Over-long OCR is truncated (`truncatedOcr: true` in response) so
one giant scan cannot blow the context window or the bill.

## Prompt (`buildPrompt`)

- Role: precise document-understanding engine; OCR noise may be corrected, but
  facts never invented.
- Strict rules: exactly one of 6 types; emit exactly the schema fields; `null`
  for anything unreliable; arrays may be empty; per-field 0–100 confidence;
  overall = mean, 1 decimal.
- Schemas (see `SCHEMAS` in code): invoice (13 fields), receipt (11),
  purchase_order (12), resume (10), contract (11), general (8).
- Output contract: **only** raw JSON
  `{ doc_type, fields, field_confidence, overall_confidence }` — no fences, no
  prose. `temperature: 0.1`, `max_tokens: 2048` for determinism.

## Output hardening

1. `safeParseJson`: direct parse → fenced-code extract → brace-slice fallback.
   Total failure → HTTP 502 "AI returned non-JSON, retry" (never persisted).
2. `normalizeResult`: unknown `doc_type` → `general`; unknown fields dropped;
   missing fields → `null` + `0` confidence; confidences clamped 0–100 ints;
   overall recomputed when the model omits it.
3. Persistence: one `extractions` row per document (`fields` + `field_confidence`
   JSONB, `model`, `prompt_version='v1'`); `documents` updated with verdict +
   confidence + timing.

## Never-fabricate policy

Three layers agree: prompt ("Null is always safer than a guess"), normalizer
(missing → null), UI ("null — not found" rendering + `0%` badges). Demo data in
`src/demo/syntheticDocs.js` is invented **only** as labeled demo rows
(`model='demo-synthetic'`), never as AI output on real user files.

## Cost / limits

- 20 req/min/IP sliding window (`api/_lib/rateLimit.js`); 429 + `Retry-After`.
- Only OCR text (not images) is sent — cheap, fast, Hobby-friendly.
- Multimodal in the fullest sense (image bytes to Nemotron) is intentionally
  deferred: it would need image-capable payload + larger bills; the OpenCV +
  OCR + text-understanding chain already demonstrates vision → language.
