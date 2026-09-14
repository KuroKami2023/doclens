# OCR_PIPELINE.md — PDF.js → OpenCV.js → Tesseract.js

All client-side (`src/lib/`), so scanned bytes never transit a third-party OCR
API. Only extracted **text** is sent to `/api/analyze`.

## Stage 1 — Page rendering (`pdfProcessor.js`)

- PDFs: `pdfjs-dist` with bundled worker (`pdf.worker.min.mjs?url`), scale 2,
  white background fill, max 10 pages (DoS + cost guard).
- Images (PNG/JPG/WEBP/TIFF): pass through as a single page; dimensions probed
  for the preprocess decision.
- Output per page: `{ pageNumber, dataUrl (PNG), width, height }`.

## Stage 2 — OpenCV preprocessing (`opencvPreprocess.js`)

- Lazy-loads `@techstark/opencv-js` once (WASM); any load/runtime failure sets
  a sticky `cvFailed` flag → graceful fallback to raw pixels (`skipped: true`).
- `shouldPreprocess`: images under ~0.4 MP skip OpenCV (clean thumbnails gain
  nothing from thresholding).
- Steps, in order: `grayscale` (RGBA→GRAY) → `denoise` (median blur k=3) →
  `adaptiveThreshold` (Gaussian, block 31, C=10). The applied list is stored per
  page in `ocr_results.preprocessing`, e.g. `["grayscale","denoise",
  "adaptiveThreshold"]`, and shown in the UI.
- Mats are explicitly `.delete()`d in `finally` to avoid WASM heap leaks.

## Stage 3 — Tesseract.js OCR (`ocrPipeline.js`)

- Single shared English worker (`createWorker('eng')`), reused across pages;
  progress callback drives the per-page % in `Upload.jsx`.
- Confidence: mean of word-level confidences (more honest than the top-line
  figure), rounded to 1 decimal; `null` when unavailable.
- `success = text.length > 0`. Empty OCR aborts the pipeline with a user-facing
  message ("try a clearer scan") instead of sending nothing to the AI.
- `word_count`, `processing_time_ms` recorded per page.

## Failure modes

| Failure | Behavior |
|---|---|
| Corrupt PDF/image | Immediate error, no DB row left in `processing_ocr` without an error note |
| OpenCV WASM blocked | Raw pixels used, `skipped: true`, pipeline continues |
| Tesseract empty | `documents.status=failed`, run logged, user told to retry |
| >10 pages | Pages beyond 10 ignored (documented limit) |

## Tuning

- Increase render `scale` (Upload → `renderFileToPages`) for tiny fonts at the
  cost of OCR time; decrease for speed.
- Threshold block size `31`/`C=10` suits receipts/invoices; dense contracts may
  prefer plain grayscale (edit `preprocessPage` steps per doc type).
