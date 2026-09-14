function statusDot(status) {
  if (status === 'succeeded') return 'bg-emerald-600';
  if (status === 'failed') return 'bg-rose-600';
  return 'bg-lamp-500';
}

export default function ProcessingHistory({ runs }) {
  if (!runs || runs.length === 0) {
    return (
      <div className="card p-5">
        <p className="eyebrow">Contact sheet</p>
        <h3 className="mt-1 font-display text-base font-bold text-espresso-950">Processing history</h3>
        <p className="mt-1 text-sm text-espresso-500">No pipeline runs recorded.</p>
      </div>
    );
  }
  return (
    <div className="card p-5">
      <p className="eyebrow">Contact sheet</p>
      <h3 className="mt-1 font-display text-base font-bold text-espresso-950">Processing history</h3>
      <ol className="relative mt-4 space-y-2 border-l-2 border-dashed border-espresso-200 pl-4">
        {runs.map((r) => (
          <li
            key={r.id}
            className="relative flex flex-wrap items-center gap-2 rounded-xl border border-espresso-200/60 bg-paper px-3 py-2 text-xs"
          >
            <span aria-hidden="true" className={`absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full ring-2 ring-[#FFFDF7] ${statusDot(r.status)}`} />
            <span className="mono font-bold uppercase tracking-[0.1em] text-espresso-700">{r.stage}</span>
            <span
              className={`mono rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] ${
                r.status === 'succeeded'
                  ? 'bg-emerald-100 text-emerald-800'
                  : r.status === 'failed'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-lamp-100 text-lamp-700'
              }`}
            >
              {r.status}
            </span>
            {r.duration_ms !== null && r.duration_ms !== undefined && (
              <span className="mono text-espresso-500">{r.duration_ms} ms</span>
            )}
            <span className="mono ml-auto text-espresso-400">
              {new Date(r.created_at).toLocaleString()}
            </span>
            {r.detail && Object.keys(r.detail).length > 0 && (
              <pre className="mono w-full overflow-auto whitespace-pre-wrap rounded-lg bg-espresso-950/95 p-2 text-[11px] leading-relaxed text-paper">
                {JSON.stringify(r.detail)}
              </pre>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
