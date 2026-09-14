import { confidenceClasses, formatConfidence } from '../lib/confidence.js';
import { prettyFieldName } from '../lib/docTypes.js';

function renderValue(v) {
  if (v === null || v === undefined) {
    return <span className="italic text-espresso-400">null — not found</span>;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="italic text-espresso-400">[] (empty)</span>;
    return (
      <pre className="mono max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-espresso-200 bg-paper-deep/50 p-2 text-xs text-espresso-800">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  if (typeof v === 'object') {
    return (
      <pre className="mono max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-espresso-200 bg-paper-deep/50 p-2 text-xs text-espresso-800">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  return <span className="text-sm font-medium text-espresso-900">{String(v)}</span>;
}

export default function ExtractionViewer({ extraction }) {
  if (!extraction) {
    return (
      <div className="card p-5">
        <p className="eyebrow">Field ledger</p>
        <h3 className="mt-1 font-display text-base font-bold text-espresso-950">AI extracted information</h3>
        <p className="mt-1 text-sm text-espresso-500">
          No AI extraction yet — run processing first. Missing values are always{' '}
          <span className="mono rounded bg-paper-deep px-1">null</span>, never guessed.
        </p>
      </div>
    );
  }
  const fields = extraction.fields || {};
  const conf = extraction.field_confidence || {};
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="eyebrow">Field ledger</p>
          <h3 className="mt-0.5 font-display text-base font-bold text-espresso-950">AI extracted information</h3>
        </div>
        <span
          className={`stamp ml-auto border-2 ${confidenceClasses(
            extraction.overall_confidence
          )}`}
        >
          overall {formatConfidence(extraction.overall_confidence)}
        </span>
      </div>
      <p className="mono mt-1.5 text-[11px] uppercase tracking-[0.14em] text-espresso-500">
        Model · {extraction.model}
      </p>
      <div aria-hidden="true" className="rule-lamp mt-3" />
      <dl className="mt-1 divide-y divide-dashed divide-espresso-200">
        {Object.keys(fields).map((key) => (
          <div key={key} className="grid gap-1 py-2.5 sm:grid-cols-[180px_1fr_auto] sm:gap-3">
            <dt className="mono text-[11px] font-bold uppercase tracking-[0.14em] text-espresso-500">
              {prettyFieldName(key)}
            </dt>
            <dd className="min-w-0">{renderValue(fields[key])}</dd>
            <dd>
              <span
                className={`mono rounded-md border px-2 py-0.5 text-[11px] font-bold ${confidenceClasses(
                  conf[key]
                )}`}
                title={`Field confidence: ${formatConfidence(conf[key])}`}
              >
                {formatConfidence(conf[key])}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
