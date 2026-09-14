import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly in dev so misconfiguration is obvious; in prod this surfaces
  // once instead of as cryptic RLS errors.
  console.warn(
    '[DocLens] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them.'
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '');

export const STORAGE_BUCKET = 'doclens-docs';

// 10 MB client-side cap (mirrors SECURITY.md). Server/RLS is the real guard.
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
];

export const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff'];
