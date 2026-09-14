// CSV / JSON export helpers — pure functions, no Supabase needed.

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportDocumentJson(doc, extraction, ocrResults) {
  const payload = {
    exported_at: new Date().toISOString(),
    document: doc,
    extraction: extraction
      ? {
          doc_type: extraction.doc_type,
          fields: extraction.fields,
          field_confidence: extraction.field_confidence,
          overall_confidence: extraction.overall_confidence,
          model: extraction.model,
        }
      : null,
    ocr: (ocrResults || []).map((r) => ({
      page_number: r.page_number,
      mean_confidence: r.mean_confidence,
      word_count: r.word_count,
      preprocessing: r.preprocessing,
      success: r.success,
      raw_text: r.raw_text,
    })),
  };
  downloadFile(
    `${(doc.file_name || 'document').replace(/\.[^.]+$/, '')}-doclens.json`,
    JSON.stringify(payload, null, 2),
    'application/json'
  );
}

export function exportDocumentsCsv(documents) {
  const header = [
    'id',
    'file_name',
    'doc_type',
    'status',
    'overall_confidence',
    'page_count',
    'file_size_bytes',
    'processing_time_ms',
    'created_at',
  ];
  const rows = documents.map((d) =>
    header.map((h) => escapeCsvCell(d[h])).join(',')
  );
  downloadFile('doclens-documents.csv', [header.join(','), ...rows].join('\n'), 'text/csv');
}

export function exportExtractionCsv(doc, extraction) {
  const header = ['field', 'value', 'confidence'];
  const rows = extraction
    ? Object.keys(extraction.fields || {}).map((field) =>
        [
          escapeCsvCell(field),
          escapeCsvCell(extraction.fields[field]),
          escapeCsvCell((extraction.field_confidence || {})[field]),
        ].join(',')
      )
    : [];
  const base = (doc.file_name || 'document').replace(/\.[^.]+$/, '');
  downloadFile(`${base}-extraction.csv`, [header.join(','), ...rows].join('\n'), 'text/csv');
}
