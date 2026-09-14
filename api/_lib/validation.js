// Shared request validation for /api/* — JavaScript only.

export const DOC_TYPES = [
  'invoice',
  'receipt',
  'purchase_order',
  'resume',
  'contract',
  'general',
];

export const MAX_OCR_CHARS = 24_000; // cap what we forward to NVIDIA
export const MAX_PAGES = 10;

/**
 * Validate the analyze request body. Returns { ok, error }.
 * Never throws on bad input — returns a human-readable error instead.
 */
export function validateAnalyzeBody(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const { ocrText, fileName, mimeType, pageCount } = body;

  if (typeof ocrText !== 'string' || ocrText.trim().length < 10) {
    return {
      ok: false,
      error: 'ocrText must be a non-empty string (at least 10 characters).',
    };
  }
  if (ocrText.length > 120_000) {
    return { ok: false, error: 'ocrText exceeds the 120,000 character limit.' };
  }
  if (fileName !== undefined && typeof fileName !== 'string') {
    return { ok: false, error: 'fileName must be a string.' };
  }
  if (mimeType !== undefined && typeof mimeType !== 'string') {
    return { ok: false, error: 'mimeType must be a string.' };
  }
  if (
    pageCount !== undefined &&
    (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > MAX_PAGES)
  ) {
    return { ok: false, error: `pageCount must be an integer 1..${MAX_PAGES}.` };
  }
  return { ok: true, error: null };
}

export function truncateOcr(text) {
  if (text.length <= MAX_OCR_CHARS) return { text, truncated: false };
  return { text: text.slice(0, MAX_OCR_CHARS), truncated: true };
}
