-- ============================================================================
-- DocLens AI — Supabase Storage policies (private bucket: doclens-docs)
-- SHARED-PROJECT SAFE: policy names are bucket-prefixed (doclens_docs_*)
-- so they never collide with the other 4 apps' storage policies.
-- Run this whole file in SQL Editor (bucket creation included).
-- Object layout: <owner_id>/<document_id>/<filename>
-- Page previews: <owner_id>/<document_id>/pages/page-<n>.png
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('doclens-docs', 'doclens-docs', false)
on conflict (id) do nothing;

-- SELECT (download): owner folder prefix must match auth.uid()
drop policy if exists "doclens_docs_storage_select_own" on storage.objects;
create policy "doclens_docs_storage_select_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'doclens-docs'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- INSERT (upload): same ownership check
drop policy if exists "doclens_docs_storage_insert_own" on storage.objects;
create policy "doclens_docs_storage_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'doclens-docs'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- UPDATE: owner only
drop policy if exists "doclens_docs_storage_update_own" on storage.objects;
create policy "doclens_docs_storage_update_own" on storage.objects
  for update to authenticated using (
    bucket_id = 'doclens-docs'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  ) with check (
    bucket_id = 'doclens-docs'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- DELETE: owner only (used by Delete documents feature)
drop policy if exists "doclens_docs_storage_delete_own" on storage.objects;
create policy "doclens_docs_storage_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'doclens-docs'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );
