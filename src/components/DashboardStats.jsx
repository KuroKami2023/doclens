import { Link } from 'react-router-dom';
import { docTypeLabel } from '../lib/docTypes.js';
import ConfidenceBadge from './ConfidenceBadge.jsx';

// Archival stamp palette (warm ink + scan-lamp; replaces the cold sky/violet fills).
const DOC_STAMPS = {
  invoice: 'border-lamp-700 bg-lamp-50 text-lamp-700',
  receipt: 'border-espresso-700 bg-espresso-100 text-espresso-800',
  purchase_order: 'border-amber-700 bg-amber-50 text-amber-800',
  resume: 'border-espresso-400 bg-paper-deep text-espresso-700',
  contract: 'border-rose-800 bg-rose-50 text-rose-800',
  general: 'border-espresso-300 bg-paper text-espresso-600',
};

const CARD_META = [
  { key: 'total', hint: 'Sheets in archive' },
  { key: 'ocr', hint: 'Tesseract hit rate' },
  { key: 'conf', hint: 'Mean extraction' },
  { key: 'time', hint: 'Pipeline average' },
];

export default function DashboardStats({ stats, recent }) {
  const cards = [
    { label: 'Total documents', value: stats.total },
    { label: 'OCR success rate', value: stats.ocrRate === null ? '—' : `${stats.ocrRate}%` },
    { label: 'Avg confidence', value: stats.avgConf === null ? '—' : `${stats.avgConf}%` },
    {
      label: 'Avg processing time',
      value: stats.avgTimeMs === null ? '—' : `${(stats.avgTimeMs / 1000).toFixed(1)}s`,
    },
  ];
  return (
    <div className="space-y-4">
      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div key={c.label} className="card doc-card p-4">
            <div aria-hidden="true" className="mb-2 h-1 w-8 rounded-full bg-lamp-600" />
            <p className="mono text-[11px] font-bold uppercase tracking-[0.16em] text-espresso-500">{c.label}</p>
            <p className="mono mt-1 text-[26px] font-bold tracking-tight text-espresso-950">{c.value}</p>
            <p className="mt-0.5 text-[11px] text-espresso-400">{CARD_META[i]?.hint}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="card p-4">
          <p className="eyebrow">Index</p>
          <p className="mt-0.5 font-display text-[15px] font-bold text-espresso-950">Documents by type</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {stats.byType.length === 0 && (
              <span className="text-sm text-espresso-400">No documents yet.</span>
            )}
            {stats.byType.map((t) => (
              <span
                key={t.type}
                className={`stamp border-2 ${DOC_STAMPS[t.type] || DOC_STAMPS.general}`}
              >
                {docTypeLabel(t.type)} · {t.count}
              </span>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div>
              <p className="eyebrow">Fresh from the tray</p>
              <p className="mt-0.5 font-display text-[15px] font-bold text-espresso-950">Recently processed</p>
            </div>
            <Link to="/documents" className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-lamp-700 hover:text-lamp-600 hover:underline">
              View all
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6h7M7 3.5 9.5 6 7 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-dashed divide-espresso-200">
            {(recent || []).slice(0, 5).map((d) => (
              <li key={d.id} className="flex items-center gap-2 py-1.5 text-sm">
                <Link to={`/documents/${d.id}`} className="truncate font-semibold text-espresso-900 hover:text-lamp-700 hover:underline">
                  {d.file_name}
                </Link>
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  <span className="mono hidden text-[11px] uppercase tracking-[0.1em] text-espresso-400 sm:inline">{docTypeLabel(d.doc_type)}</span>
                  <ConfidenceBadge score={d.overall_confidence} />
                </span>
              </li>
            ))}
            {(!recent || recent.length === 0) && (
              <li className="py-2 text-sm text-espresso-400">Nothing processed yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
