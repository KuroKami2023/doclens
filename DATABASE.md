# DATABASE.md — Supabase PostgreSQL + Storage

Run order in SQL Editor: `supabase/schema.sql` → `supabase/storage.sql`.
Optional notes in `supabase/seed.sql` (prefer the in-app demo button).

## Tables

**profiles** — `id (PK, FK auth.users)`, `email`, `display_name`, `created_at`.
Auto-created by `handle_new_user()` trigger on signup.

**documents** — one row per upload.
`id`, `owner_id (FK auth.users)`, `file_name`, `file_path`, `mime_type`,
`file_size_bytes`, `page_count`, `doc_type` (6-way check), `status`
(`uploaded|processing_ocr|ocr_done|analyzing|done|failed`), `overall_confidence`,
`processing_time_ms`, `error`, timestamps. Indexes on
`(owner_id, created_at)`, `(owner_id, doc_type)`, `(owner_id, status)`.

**document_pages** — `id`, `document_id (cascade)`, `owner_id`, `page_number`,
`width_px`, `height_px`, `storage_path` (page PNG preview), unique
`(document_id, page_number)`.

**ocr_results** — one row per page. `engine` (default `tesseract.js`),
`raw_text`, `mean_confidence`, `word_count`, `preprocessing text[]` (OpenCV
steps), `processing_time_ms`, `success`.

**extractions** — one row per document (`document_id` unique). `doc_type`,
`fields JSONB`, `field_confidence JSONB`, `overall_confidence`, `model`
(default Nemotron id), `prompt_version='v1'`.

**doclens_processing_runs** — append-only history. `stage`
(`upload|pdf_render|opencv_preprocess|ocr|ai_analyze|persist|done|failed`),
`status` (`started|succeeded|failed`), `detail JSONB`, `duration_ms`.
(Prefixed — the shared Supabase project also hosts InvoiceFlow's
`invoice_processing_runs`; the generic `processing_runs` name is retired.)

## Row Level Security

Enabled on all six tables. Every policy predicates on
`auth.uid() = owner_id` (or `= id` for profiles): users can only
select/insert/update/delete **their own** rows. `doclens_processing_runs` has no update
policy (append-only). All app queries run with the anon key + user JWT — there
is deliberately **no service-role key** anywhere in this project.

## Storage

Private bucket `doclens-docs` (created by `storage.sql`, `public=false`).
Layout: `<ownerId>/<docId>/<file>` + `<ownerId>/<docId>/pages/page-<n>.png`.
Four policies (select/insert/update/delete) all require the first path segment
to equal `auth.uid()`. Previews use `createSignedUrl(..., 3600)` — nothing is
ever publicly readable. Delete removes storage objects then the DB row (cascade
cleans pages/ocr/extraction/runs).

## Dashboard queries (client-side aggregation)

Total, by-type counts, OCR success rate (`success` ratio over the user's OCR
rows), avg confidence (mean of non-null `overall_confidence`), avg processing
time (mean of non-null `processing_time_ms`), recent 5 by `created_at desc` —
see `src/pages/Dashboard.jsx`.
