-- ============================================================================
-- DocLens AI — Supabase PostgreSQL schema (JavaScript-only stack)
-- SHARED-PROJECT SAFE: all 5 portfolio apps share ONE Supabase project.
-- Safe to run in ANY order alongside the other 4 app schemas.
-- Tables: profiles (SHARED superset), documents, document_pages,
--         ocr_results, extractions, doclens_processing_runs
-- NOTE: processing history lives in doclens_processing_runs (NOT the generic
-- `processing_runs`, which collides with InvoiceFlow AI's invoice table).
-- Run in Supabase Dashboard > SQL Editor. Idempotent where practical.
-- ============================================================================

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- profiles: SHARED across all 5 apps — DO NOT diverge. Superset of every
-- app's columns; app code only reads/writes its own columns.
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text default '',
  headline text default '',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrate a shared DB created by an older per-app schema:
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text default '';
alter table public.profiles add column if not exists headline text default '';
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- --------------------------------------------------------------------------
-- documents: one row per uploaded file. Owner = auth.uid().
-- doc_type: invoice | receipt | purchase_order | resume | contract | general
-- status: uploaded | processing_ocr | ocr_done | analyzing | done | failed
-- --------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text not null,
  file_size_bytes bigint not null default 0,
  page_count int not null default 1,
  doc_type text not null default 'general'
    check (doc_type in ('invoice','receipt','purchase_order','resume','contract','general')),
  status text not null default 'uploaded'
    check (status in ('uploaded','processing_ocr','ocr_done','analyzing','done','failed')),
  overall_confidence numeric(5,2),
  processing_time_ms bigint,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_owner_created_idx
  on public.documents (owner_id, created_at desc);
create index if not exists documents_owner_type_idx
  on public.documents (owner_id, doc_type);
create index if not exists documents_owner_status_idx
  on public.documents (owner_id, status);

-- --------------------------------------------------------------------------
-- document_pages: rendered page images (page 1..N) for PDFs + single images.
-- storage_path points at Supabase Storage object for the page preview.
-- --------------------------------------------------------------------------
create table if not exists public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  page_number int not null check (page_number >= 1),
  width_px int,
  height_px int,
  storage_path text,
  created_at timestamptz not null default now(),
  unique (document_id, page_number)
);
create index if not exists document_pages_doc_idx
  on public.document_pages (document_id, page_number);

-- --------------------------------------------------------------------------
-- ocr_results: one row per page. Engine is tesseract.js; preprocessing notes
-- which OpenCV steps were applied (grayscale/adaptive-threshold/denoise/...).
-- --------------------------------------------------------------------------
create table if not exists public.ocr_results (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  page_id uuid references public.document_pages (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  page_number int not null default 1,
  engine text not null default 'tesseract.js',
  raw_text text not null default '',
  mean_confidence numeric(5,2),
  word_count int not null default 0,
  preprocessing text[] not null default '{}',
  processing_time_ms bigint,
  success boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists ocr_results_doc_idx
  on public.ocr_results (document_id, page_number);

-- --------------------------------------------------------------------------
-- extractions: one row per document. `fields` is the structured JSON produced
-- by Nemotron. NEVER fabricate: missing values are stored as JSON null.
-- `field_confidence` maps field name -> 0..100. `doc_type` mirrors AI verdict.
-- --------------------------------------------------------------------------
create table if not exists public.extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  doc_type text not null default 'general'
    check (doc_type in ('invoice','receipt','purchase_order','resume','contract','general')),
  fields jsonb not null default '{}'::jsonb,
  field_confidence jsonb not null default '{}'::jsonb,
  overall_confidence numeric(5,2),
  model text not null default 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  prompt_version text not null default 'v1',
  created_at timestamptz not null default now()
);
create index if not exists extractions_owner_type_idx
  on public.extractions (owner_id, doc_type);

-- --------------------------------------------------------------------------
-- doclens_processing_runs: append-only history of each pipeline attempt per
-- document. (Prefixed to avoid colliding with invoice_processing_runs.)
-- --------------------------------------------------------------------------
create table if not exists public.doclens_processing_runs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  stage text not null
    check (stage in ('upload','pdf_render','opencv_preprocess','ocr','ai_analyze','persist','done','failed')),
  status text not null default 'started'
    check (status in ('started','succeeded','failed')),
  detail jsonb not null default '{}'::jsonb,
  duration_ms bigint,
  created_at timestamptz not null default now()
);
create index if not exists doclens_processing_runs_doc_created_idx
  on public.doclens_processing_runs (document_id, created_at desc);
create index if not exists doclens_processing_runs_owner_created_idx
  on public.doclens_processing_runs (owner_id, created_at desc);

-- One-time migration for DBs created before the shared-project rename:
-- moves rows from the old generic table into the prefixed one, if present.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'processing_runs')
     and exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'processing_runs'
               and column_name = 'document_id') then
    insert into public.doclens_processing_runs
      (id, document_id, owner_id, stage, status, detail, duration_ms, created_at)
    select id, document_id, owner_id, stage, status, detail, duration_ms, created_at
    from public.processing_runs
    on conflict (id) do nothing;
  end if;
end $$;

-- --------------------------------------------------------------------------
-- updated_at trigger for documents
-- --------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Auto-create profile on signup (SHARED — identical in all 5 schemas)
-- --------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY — user ownership everywhere, no cross-user reads.
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.ocr_results enable row level security;
alter table public.extractions enable row level security;
alter table public.doclens_processing_runs enable row level security;

-- profiles: user can read/update own row only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- documents
drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select using (auth.uid() = owner_id);
drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = owner_id);
drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
  for update using (auth.uid() = owner_id);
drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents
  for delete using (auth.uid() = owner_id);

-- document_pages
drop policy if exists "pages_select_own" on public.document_pages;
create policy "pages_select_own" on public.document_pages
  for select using (auth.uid() = owner_id);
drop policy if exists "pages_insert_own" on public.document_pages;
create policy "pages_insert_own" on public.document_pages
  for insert with check (auth.uid() = owner_id);
drop policy if exists "pages_update_own" on public.document_pages;
create policy "pages_update_own" on public.document_pages
  for update using (auth.uid() = owner_id);
drop policy if exists "pages_delete_own" on public.document_pages;
create policy "pages_delete_own" on public.document_pages
  for delete using (auth.uid() = owner_id);

-- ocr_results
drop policy if exists "ocr_select_own" on public.ocr_results;
create policy "ocr_select_own" on public.ocr_results
  for select using (auth.uid() = owner_id);
drop policy if exists "ocr_insert_own" on public.ocr_results;
create policy "ocr_insert_own" on public.ocr_results
  for insert with check (auth.uid() = owner_id);
drop policy if exists "ocr_update_own" on public.ocr_results;
create policy "ocr_update_own" on public.ocr_results
  for update using (auth.uid() = owner_id);
drop policy if exists "ocr_delete_own" on public.ocr_results;
create policy "ocr_delete_own" on public.ocr_results
  for delete using (auth.uid() = owner_id);

-- extractions
drop policy if exists "ext_select_own" on public.extractions;
create policy "ext_select_own" on public.extractions
  for select using (auth.uid() = owner_id);
drop policy if exists "ext_insert_own" on public.extractions;
create policy "ext_insert_own" on public.extractions
  for insert with check (auth.uid() = owner_id);
drop policy if exists "ext_update_own" on public.extractions;
create policy "ext_update_own" on public.extractions
  for update using (auth.uid() = owner_id);
drop policy if exists "ext_delete_own" on public.extractions;
create policy "ext_delete_own" on public.extractions
  for delete using (auth.uid() = owner_id);

-- doclens_processing_runs (no update: append-only; allow insert/select/delete own)
drop policy if exists "doclens_runs_select_own" on public.doclens_processing_runs;
create policy "doclens_runs_select_own" on public.doclens_processing_runs
  for select using (auth.uid() = owner_id);
drop policy if exists "doclens_runs_insert_own" on public.doclens_processing_runs;
create policy "doclens_runs_insert_own" on public.doclens_processing_runs
  for insert with check (auth.uid() = owner_id);
drop policy if exists "doclens_runs_delete_own" on public.doclens_processing_runs;
create policy "doclens_runs_delete_own" on public.doclens_processing_runs
  for delete using (auth.uid() = owner_id);
