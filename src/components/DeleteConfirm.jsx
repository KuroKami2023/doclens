export default function DeleteConfirm({ fileName, onCancel, onConfirm, busy }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-espresso-950/60 p-4 backdrop-blur-[2px]">
      <div className="card w-full max-w-sm p-5" role="alertdialog" aria-modal="true" aria-label="Delete document">
        <span className="stamp border-rose-700 bg-rose-50 text-rose-800">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M2 3.5h7M4.5 3.5v-.7a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.7M3 3.5l.4 5.4a.6.6 0 0 0 .6.6h3a.6.6 0 0 0 .6-.6L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Shred notice
        </span>
        <h3 className="mt-2 font-display text-base font-bold text-espresso-950">Delete document?</h3>
        <p className="mt-1 text-sm text-espresso-600">
          <span className="mono break-all font-semibold text-espresso-900">{fileName}</span> and all its pages, OCR results,
          extractions and history will be permanently deleted.
        </p>
        <div className="mt-4 flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={busy}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="btn-danger flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {busy ? 'Shredding…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
