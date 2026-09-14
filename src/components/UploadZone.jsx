import { useRef, useState } from 'react';
import { ACCEPTED_EXTENSIONS, MAX_FILE_BYTES } from '../lib/supabaseClient.js';

export default function UploadZone({ onFiles, busy }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  function filterFiles(list) {
    const files = Array.from(list || []);
    const ok = [];
    for (const f of files) {
      const ext = `.${(f.name.split('.').pop() || '').toLowerCase()}`;
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError(`Rejected ${f.name}: only PDF/PNG/JPG/WEBP/TIFF allowed.`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        setError(`Rejected ${f.name}: exceeds 10 MB limit.`);
        continue;
      }
      if (f.size === 0) {
        setError(`Rejected ${f.name}: empty file.`);
        continue;
      }
      ok.push(f);
    }
    if (ok.length > 0) {
      setError('');
      onFiles(ok);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) filterFiles(e.dataTransfer.files);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-disabled={busy}
        onKeyDown={(e) => {
          if (!busy && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`scanframe cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragOver
            ? 'border-lamp-600 bg-lamp-50 shadow-lamp-glow'
            : 'border-espresso-300 bg-[#FFFDF7] hover:border-lamp-600/60 hover:bg-lamp-50/40'
        } ${busy ? 'pointer-events-none opacity-80' : ''}`}
      >
        {/* scan-line beam while dragging or processing */}
        {(dragOver || busy) && <span aria-hidden="true" className="scanbeam" />}
        <div
          className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border transition ${
            dragOver ? 'border-lamp-600 bg-espresso-950 text-lamp-500' : 'border-espresso-200 bg-espresso-950 text-lamp-500'
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 2.5h8L19 8v13.5a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-18a.5.5 0 0 1 .5-.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M14 2.5V8h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <line x1="8" y1="12.5" x2="16" y2="12.5" stroke="#EA580C" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="8" y1="15.5" x2="14" y2="15.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
            <line x1="8" y1="18.2" x2="13" y2="18.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
          </svg>
        </div>
        <p className="font-display text-[15px] font-bold text-espresso-950">
          {busy ? 'Developing in the darkroom — please wait' : 'Drop documents here or click to browse'}
        </p>
        <p className="mono mt-1.5 text-[11px] uppercase tracking-[0.14em] text-espresso-500">
          PDF · PNG · JPG · WEBP · TIFF · max 10 MB · private per user
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => {
            filterFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p className="mt-2 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="mt-px shrink-0">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="7" cy="10" r="0.9" fill="currentColor" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
