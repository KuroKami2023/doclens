// Confidence helpers: color + label for 0-100 scores.
// Rule: <60 low, 60-84 medium, >=85 high. Null-safe everywhere.

export function confidenceLevel(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 'unknown';
  const s = Number(score);
  if (s >= 85) return 'high';
  if (s >= 60) return 'medium';
  return 'low';
}

export function confidenceClasses(score) {
  const level = confidenceLevel(score);
  if (level === 'high') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (level === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (level === 'low') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
}

export function formatConfidence(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return '—';
  return `${Number(score).toFixed(1)}%`;
}
