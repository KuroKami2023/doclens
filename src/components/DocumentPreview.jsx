import { useEffect, useState } from 'react';
import { supabase, STORAGE_BUCKET } from '../lib/supabaseClient.js';

// Signed-URL preview: works for PDFs (iframe) and images. Never public.
export default function DocumentPreview({ document: doc, pages }) {
  const [urls, setUrls] = useState({});
  const [active, setActive] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      const next = {};
      try {
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(doc.file_path, 3600);
        if (error) throw error;
        next.original = data.signedUrl;
      } catch (e) {
        if (!cancelled) setError(`Preview unavailable: ${e.message}`);
        return;
      }
      // Page previews were uploaded as PNGs alongside the original.
      for (const p of pages || []) {
        if (!p.storage_path) continue;
        try {
          const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(p.storage_path, 3600);
          if (!error && data) next[p.page_number] = data.signedUrl;
        } catch {
          /* page preview optional */
        }
      }
      if (!cancelled) {
        setUrls(next);
        setActive(0);
      }
    }
    if (doc?.file_path) load();
    return () => {
      cancelled = true;
    };
  }, [doc]);

  const isPdf = doc.mime_type === 'application/pdf';
  const pageList = pages && pages.length > 0 ? pages : [{ page_number: 1, storage_path: null }];
  const activeUrl = pageList[active] ? urls[pageList[active].page_number] || urls.original : urls.original;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-espresso-200/70 bg-paper-deep/50 px-4 py-2.5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="text-lamp-600">
          <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="7" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="mono text-[11px] font-bold uppercase tracking-[0.22em] text-espresso-600">Preview</span>
        <span className="mono text-[11px] text-espresso-400">
          p{pageList[active]?.page_number ?? 1}/{pageList.length}
        </span>
        {pageList.length > 1 && (
          <div className="ml-auto flex items-center gap-1">
            {pageList.map((p, i) => (
              <button
                key={p.page_number}
                onClick={() => setActive(i)}
                className={`mono rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  i === active
                    ? 'bg-espresso-950 text-lamp-500'
                    : 'bg-espresso-100 text-espresso-600 hover:bg-espresso-200'
                }`}
              >
                p{p.page_number}
              </button>
            ))}
          </div>
        )}
      </div>
      {error ? (
        <p className="p-6 text-sm text-rose-700">{error}</p>
      ) : !activeUrl ? (
        <div className="scanframe bg-paper-deep/60 p-6">
          <span aria-hidden="true" className="scanbeam" />
          <div className="skeleton h-64 w-full" />
          <p className="mono mt-3 text-xs uppercase tracking-[0.18em] text-espresso-500">
            Exposing preview…
          </p>
        </div>
      ) : isPdf && !urls[pageList[active]?.page_number] ? (
        <iframe title="document preview" src={activeUrl} className="h-[560px] w-full bg-paper-deep" />
      ) : (
        <img
          src={activeUrl}
          alt={`Page ${pageList[active]?.page_number ?? 1}`}
          className="max-h-[560px] w-full bg-paper-deep object-contain"
        />
      )}
    </div>
  );
}
