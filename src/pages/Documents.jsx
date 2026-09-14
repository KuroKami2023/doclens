import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, STORAGE_BUCKET } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import SearchFilters from '../components/SearchFilters.jsx';
import DeleteConfirm from '../components/DeleteConfirm.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import { docTypeLabel } from '../lib/docTypes.js';
import { exportDocumentsCsv } from '../lib/exportUtils.js';

// Archival stamp palette (warm ink + scan-lamp; replaces the cold sky/violet fills).
const DOC_STAMPS = {
  invoice: 'border-lamp-700 bg-lamp-50 text-lamp-700',
  receipt: 'border-espresso-700 bg-espresso-100 text-espresso-800',
  purchase_order: 'border-amber-700 bg-amber-50 text-amber-800',
  resume: 'border-espresso-400 bg-paper-deep text-espresso-700',
  contract: 'border-rose-800 bg-rose-50 text-rose-800',
  general: 'border-espresso-300 bg-paper text-espresso-600',
};

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [ocrIndex, setOcrIndex] = useState({}); // docId -> concatenated text
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setDocs(data || []);
      if (data && data.length > 0) {
        const { data: ocr } = await supabase
          .from('ocr_results')
          .select('document_id,raw_text')
          .in('document_id', data.map((d) => d.id));
        const idx = {};
        for (const r of ocr || []) {
          idx[r.document_id] = `${idx[r.document_id] || ''} ${r.raw_text || ''}`;
        }
        setOcrIndex(idx);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (type && d.doc_type !== type) return false;
      if (status && d.status !== status) return false;
      if (q) {
        const hay = `${d.file_name} ${(ocrIndex[d.id] || '').slice(0, 5000)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [docs, ocrIndex, query, type, status]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      // Delete storage objects under the user's folder for this document.
      const prefix = `${user.id}/${toDelete.id}`;
      try {
        const { data: listed } = await supabase.storage.from(STORAGE_BUCKET).list(`${user.id}`, {
          search: toDelete.id,
        });
        void listed;
      } catch {
        /* list is best-effort */
      }
      // Remove known paths explicitly (original + page previews up to 10).
      const paths = [toDelete.file_path];
      for (let n = 1; n <= Math.max(toDelete.page_count || 1, 1) && n <= 10; n++) {
        paths.push(`${prefix}/pages/page-${n}.png`);
      }
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
      const { error } = await supabase.from('documents').delete().eq('id', toDelete.id);
      if (error) throw error;
      setToDelete(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="eyebrow">Filing cabinet</p>
          <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight text-espresso-950">Documents</h1>
          <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.14em] text-espresso-500">
            {filtered.length} of {docs.length} shown · search covers file names + OCR text
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => exportDocumentsCsv(filtered)} className="btn-secondary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1.5v7M4 6l3 3 3-3M2 10.5h10V12a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </button>
          <Link to="/upload" className="btn-primary">Upload</Link>
        </div>
      </div>
      <div aria-hidden="true" className="rule-lamp" />
      <SearchFilters
        query={query} setQuery={setQuery}
        type={type} setType={setType}
        status={status} setStatus={setStatus}
      />
      {error && (
        <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
          {error}
        </p>
      )}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton mt-2 h-3 w-1/2" />
              <div className="mt-3 flex gap-2">
                <div className="skeleton h-6 w-20" />
                <div className="skeleton h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-espresso-950 text-lamp-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 2.5h8L19 8v13.5a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-18a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M14 2.5V8h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-display text-base font-bold text-espresso-950">No documents match.</p>
          <p className="mt-1 text-sm text-espresso-500">
            Upload your first file or load the synthetic demo from the dashboard.
          </p>
        </div>
      ) : (
        <div className="stagger grid gap-3 md:grid-cols-2">
          {filtered.map((d) => (
            <div key={d.id} className="card doc-card p-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0">
                  <Link
                    to={`/documents/${d.id}`}
                    className="block truncate font-bold text-espresso-950 hover:text-lamp-700 hover:underline"
                  >
                    {d.file_name}
                  </Link>
                  <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.08em] text-espresso-400">
                    {new Date(d.created_at).toLocaleString()} · {d.page_count}p ·{' '}
                    {(d.file_size_bytes / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => setToDelete(d)}
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                  title="Delete document"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.2 3.5h7.6M4.8 3.5v-.8a.6.6 0 0 1 .6-.6h1.2a.6.6 0 0 1 .6.6v.8M3.2 3.5l.4 6a.6.6 0 0 0 .6.6h3.6a.6.6 0 0 0 .6-.6l.4-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Delete
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-dashed border-espresso-200 pt-2.5">
                <span
                  className={`stamp border-2 ${DOC_STAMPS[d.doc_type] || DOC_STAMPS.general}`}
                >
                  {docTypeLabel(d.doc_type)}
                </span>
                <span className="mono rounded-md bg-espresso-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-espresso-600">
                  {d.status}
                </span>
                <ConfidenceBadge score={d.overall_confidence} label="Overall confidence" />
              </div>
            </div>
          ))}
        </div>
      )}
      {toDelete && (
        <DeleteConfirm
          fileName={toDelete.file_name}
          busy={deleting}
          onCancel={() => !deleting && setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
