import { DOC_TYPES, docTypeLabel } from '../lib/docTypes.js';

export default function SearchFilters({ query, setQuery, type, setType, status, setStatus }) {
  return (
    <div className="card flex flex-col gap-3 p-4 sm:flex-row">
      <div className="relative sm:flex-1">
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso-400"
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="10" y1="10" x2="13.2" y2="13.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search file name or OCR text…"
          aria-label="Search documents"
          className="input !pl-9"
        />
      </div>
      <select value={type} onChange={(e) => setType(e.target.value)} className="input sm:w-52" aria-label="Filter by type">
        <option value="">All types</option>
        {DOC_TYPES.map((t) => (
          <option key={t} value={t}>
            {docTypeLabel(t)}
          </option>
        ))}
      </select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-52" aria-label="Filter by status">
        <option value="">All statuses</option>
        <option value="done">Done</option>
        <option value="analyzing">Analyzing</option>
        <option value="processing_ocr">Processing OCR</option>
        <option value="failed">Failed</option>
        <option value="uploaded">Uploaded</option>
      </select>
    </div>
  );
}
