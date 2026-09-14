import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, STORAGE_BUCKET } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import DocumentPreview from '../components/DocumentPreview.jsx';
import OcrViewer from '../components/OcrViewer.jsx';
import ExtractionViewer from '../components/ExtractionViewer.jsx';
import ProcessingHistory from '../components/ProcessingHistory.jsx';
import DeleteConfirm from '../components/DeleteConfirm.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import { docTypeLabel } from '../lib/docTypes.js';
import {
  exportDocumentJson,
  exportExtractionCsv,
  exportDocumentsCsv,
} from '../lib/exportUtils.js';

// Archival stamp palette (warm ink + scan-lamp; replaces the cold sky/violet fills).
const DOC_STAMPS = {
  invoice: 'border-lamp-700 bg-lamp-50 text-lamp-700',
  receipt: 'border-espresso-700 bg-espresso-100 text-espresso-800',
  purchase_order: 'border-amber-700 bg-amber-50 text-amber-800',
  resume: 'border-espresso-400 bg-paper-deep text-espresso-700',
  contract: 'border-rose-800 bg-rose-50 text-rose-800',
  general: 'border-espresso-300 bg-paper text-espresso-600',
};

function BackLink({ to, children }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-xs font-bold text-lamp-700 hover:text-lamp-600 hover:underline">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M10 6H3M5.5 3.5 3 6l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </Link>
  );
}

export default function DocumentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [ocr, setOcr] = useState([]);
  const [extraction, setExtraction] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data: d, error: dErr } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single();
        if (dErr) throw dErr;
        setDoc(d);
        const [{ data: p }, { data: o }, { data: e }, { data: r }] = await Promise.all([
          supabase.from('document_pages').select('*').eq('document_id', id).order('page_number'),
          supabase.from('ocr_results').select('*').eq('document_id', id).order('page_number'),
          supabase.from('extractions').select('*').eq('document_id', id).maybeSingle(),
          supabase.from('doclens_processing_runs').select('*').eq('document_id', id).order('created_at', { ascending: false }),
        ]);
        setPages(p || []);
        setOcr(o || []);
        setExtraction(e || null);
        setRuns(r || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const paths = [doc.file_path];
      for (let n = 1; n <= Math.max(doc.page_count || 1, 1) && n <= 10; n++) {
        paths.push(`${user.id}/${doc.id}/pages/page-${n}.png`);
      }
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;
      navigate('/documents');
    } catch (e) {
      setError(e.message);
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-8 w-2/3" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-4"><div className="skeleton h-64 w-full" /></div>
          <div className="card p-4"><div className="skeleton h-64 w-full" /></div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-3">
        <BackLink to="/documents">Back to documents</BackLink>
        <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
          {error}
        </p>
      </div>
    );
  }
  if (!doc) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <BackLink to="/documents">Documents</BackLink>
          <h1 className="mt-1 truncate font-display text-[22px] font-bold tracking-tight text-espresso-950">{doc.file_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`stamp border-2 ${DOC_STAMPS[doc.doc_type] || DOC_STAMPS.general}`}
            >
              {docTypeLabel(doc.doc_type)}
            </span>
            <span className="mono rounded-md bg-espresso-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-espresso-600">
              {doc.status}
            </span>
            <ConfidenceBadge score={doc.overall_confidence} />
            <span className="mono text-[11px] uppercase tracking-[0.08em] text-espresso-400">
              {doc.processing_time_ms ? `${(doc.processing_time_ms / 1000).toFixed(1)}s` : ''} ·{' '}
              {new Date(doc.created_at).toLocaleString()}
            </span>
          </div>
          {doc.error && (
            <p className="mt-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              {doc.error}
            </p>
          )}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button onClick={() => exportDocumentJson(doc, extraction, ocr)} className="btn-secondary !text-xs">
            Export JSON
          </button>
          <button onClick={() => exportExtractionCsv(doc, extraction)} className="btn-secondary !text-xs">
            Export CSV
          </button>
          <button onClick={() => exportDocumentsCsv([doc])} className="btn-secondary !text-xs">
            Row CSV
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="rule-lamp" />

      <div className="grid gap-4 lg:grid-cols-2">
        <DocumentPreview document={doc} pages={pages} />
        <div className="space-y-4">
          <ExtractionViewer extraction={extraction} />
        </div>
      </div>
      <OcrViewer results={ocr} />
      <ProcessingHistory runs={runs} />

      {confirming && (
        <DeleteConfirm
          fileName={doc.file_name}
          busy={deleting}
          onCancel={() => !deleting && setConfirming(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
