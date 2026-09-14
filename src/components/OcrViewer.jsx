import { formatConfidence, confidenceClasses } from '../lib/confidence.js';

export default function OcrViewer({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="card p-5">
        <p className="eyebrow">Darkroom readout</p>
        <h3 className="mt-1 font-display text-base font-bold text-espresso-950">OCR text</h3>
        <p className="mt-1 text-sm text-espresso-500">No OCR results yet.</p>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-espresso-200/70 bg-espresso-950 px-5 py-3">
        <p className="mono text-[11px] font-bold uppercase tracking-[0.22em] text-lamp-500">Darkroom readout</p>
        <h3 className="mt-0.5 font-display text-base font-bold text-paper">OCR text · Tesseract.js</h3>
      </div>
      <div className="space-y-4 p-5">
        {results.map((r) => (
          <div key={r.id || r.page_number} className="overflow-hidden rounded-xl border border-espresso-200 bg-[#FFFDF7]">
            <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-espresso-200 bg-paper-deep/50 px-3 py-2 text-xs">
              <span className="mono font-bold uppercase tracking-[0.12em] text-espresso-700">Page {r.page_number}</span>
              <span
                className={`mono rounded-md border px-2 py-0.5 font-bold ${confidenceClasses(
                  r.mean_confidence
                )}`}
              >
                {formatConfidence(r.mean_confidence)}
              </span>
              <span className="mono text-espresso-500">{r.word_count} words</span>
              {!r.success && (
                <span className="stamp border-rose-700 bg-rose-50 text-rose-800">
                  OCR empty
                </span>
              )}
              {r.preprocessing?.length > 0 && (
                <span className="mono text-espresso-400">
                  OpenCV: {r.preprocessing.join(' → ')}
                </span>
              )}
            </div>
            <pre className="readout max-h-56 overflow-auto p-3">
              {r.raw_text || '(no text recognized)'}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
