// Document-type metadata shared by every component. JavaScript only.

export const DOC_TYPES = [
  'invoice',
  'receipt',
  'purchase_order',
  'resume',
  'contract',
  'general',
];

export const DOC_TYPE_LABELS = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  purchase_order: 'Purchase Order',
  resume: 'Resume',
  contract: 'Contract',
  general: 'General Document',
};

export const DOC_TYPE_COLORS = {
  invoice: 'bg-sky-100 text-sky-800 border-sky-200',
  receipt: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  purchase_order: 'bg-violet-100 text-violet-800 border-violet-200',
  resume: 'bg-amber-100 text-amber-800 border-amber-200',
  contract: 'bg-rose-100 text-rose-800 border-rose-200',
  general: 'bg-slate-100 text-slate-700 border-slate-200',
};

// Human-friendly labels for extracted field keys.
export function prettyFieldName(key) {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function docTypeLabel(t) {
  return DOC_TYPE_LABELS[t] || 'General Document';
}
