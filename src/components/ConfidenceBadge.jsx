import { confidenceClasses, formatConfidence } from '../lib/confidence.js';

export default function ConfidenceBadge({ score, label }) {
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold ${confidenceClasses(
        score
      )}`}
      title={label || 'Confidence score'}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="3.6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="5" cy="5" r="1.2" fill="currentColor" />
      </svg>
      {formatConfidence(score)}
    </span>
  );
}
