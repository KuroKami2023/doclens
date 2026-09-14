# ARCHITECTURE.md — DocLens AI

## System map

```
Browser (React + Vite + Tailwind)
 ├── Supabase Auth (email/password, JWT)
 ├── Supabase Storage (private bucket doclens-docs, signed-URL preview)
 ├── Supabase PostgreSQL (RLS, owner_id = auth.uid() everywhere)
 ├── Client CV/OCR: PDF.js → OpenCV.js → Tesseract.js (all in-browser)
 └── /api/analyze (Vercel JS serverless) → NVIDIA Nemotron (secret key)
```

No backend server to operate: the only server code is two Vercel functions.
No AWS, no paid services, no TypeScript.

## End-to-end data flow

1. **Upload** (`src/pages/Upload.jsx`): validate type/size → `renderFileToPages`
   (PDF.js) → insert `documents` row (`status=processing_ocr`) → upload original
   to `<uid>/<docId>/<file>`.
2. **Preprocess** (`src/lib/opencvPreprocess.js`): grayscale → median denoise →
   adaptive Gaussian threshold, per page, skipped for tiny images.
3. **OCR** (`src/lib/ocrPipeline.js`): Tesseract.js worker, word-level mean
   confidence → `document_pages` + `ocr_results` rows, `processing_runs` per stage.
4. **Understand** (`POST /api/analyze`): combined OCR text → Nemotron
   classification + extraction + confidence (key stays server-side).
5. **Persist**: `extractions` row, `documents` → `done` with `doc_type`,
   `overall_confidence`, `processing_time_ms`; `processing_runs done`.
6. **Consume**: dashboard analytics, search/filters, detail (preview + OCR +
   extraction + history), delete, JSON/CSV export.

## File tree

```
api/
  analyze.js            POST multimodal analysis (NVIDIA, rate-limited)
  health.js             GET liveness (leaks no secrets)
  _lib/nvidia.js        prompt, schemas, safeParse, normalize, fetch
  _lib/validation.js    body validation + OCR truncation
  _lib/rateLimit.js     per-IP sliding window
src/
  main.jsx App.jsx index.css
  lib/  supabaseClient.js docTypes.js confidence.js exportUtils.js
        pdfProcessor.js opencvPreprocess.js ocrPipeline.js
  context/AuthContext.jsx
  components/ Layout ProtectedRoute UploadZone DocumentPreview OcrViewer
              ExtractionViewer ConfidenceBadge SearchFilters
              ProcessingHistory DashboardStats DeleteConfirm
  pages/ Login Dashboard Documents DocumentDetail Upload
  demo/syntheticDocs.js
supabase/ schema.sql storage.sql seed.sql
public/demo-docs/       6 synthetic .txt originals
```

## Key decisions

- **OCR in browser**: zero OCR server cost, works on Vercel Hobby; trade-off is
  large client bundles (chunk limit raised) and device-speed variance.
- **AI server-side**: the only way to keep `NVIDIA_API_KEY` secret on a static
  host; also gives one place for validation + rate limiting + normalization.
- **RLS, not service role**: the app never holds a Supabase service key; every
  query runs as the user JWT, so a leaked anon key alone grants nothing
  cross-user.
- **Null-over-guess**: extraction schemas + prompt + normalizer all enforce
  `null` for unknowable values; confidence 0. Demonstrates honest AI UX.
