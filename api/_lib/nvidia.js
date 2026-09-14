// Server-side NVIDIA client. The API key lives ONLY here (process.env).
// The browser never imports this file and never sees NVIDIA_API_KEY.

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

export const DOC_TYPES = [
  'invoice',
  'receipt',
  'purchase_order',
  'resume',
  'contract',
  'general',
];

// Expected fields per document type. The model MUST emit exactly these keys
// (with null for anything unknowable) — never invented values.
export const SCHEMAS = {
  invoice: [
    'invoice_number',
    'vendor_name',
    'vendor_address',
    'customer_name',
    'issue_date',
    'due_date',
    'currency',
    'subtotal',
    'tax_amount',
    'total_amount',
    'line_items',
    'payment_terms',
    'notes',
  ],
  receipt: [
    'merchant_name',
    'merchant_address',
    'receipt_number',
    'transaction_date',
    'currency',
    'subtotal',
    'tax_amount',
    'total_amount',
    'payment_method',
    'line_items',
    'notes',
  ],
  purchase_order: [
    'po_number',
    'buyer_name',
    'supplier_name',
    'order_date',
    'delivery_date',
    'currency',
    'subtotal',
    'tax_amount',
    'total_amount',
    'line_items',
    'delivery_address',
    'notes',
  ],
  resume: [
    'full_name',
    'email',
    'phone',
    'location',
    'summary',
    'skills',
    'experience',
    'education',
    'links',
    'notes',
  ],
  contract: [
    'contract_title',
    'party_a',
    'party_b',
    'effective_date',
    'expiry_date',
    'governing_law',
    'total_value',
    'currency',
    'key_clauses',
    'signatures',
    'notes',
  ],
  general: ['title', 'author', 'date', 'language', 'summary', 'key_points', 'entities', 'notes'],
};

export function buildPrompt({ ocrText, fileName, mimeType }) {
  return [
    'You are DocLens AI, a precise document-understanding engine.',
    'Analyze the OCR text below. OCR may contain misspellings — correct only',
    'obvious OCR noise, but NEVER invent facts, numbers, names, or dates.',
    '',
    'RULES (strict):',
    '1. Classify into exactly one of: invoice | receipt | purchase_order | resume | contract | general.',
    '2. Extract the fields for that type (see schema list).',
    '3. Use JSON null for ANY value that cannot be reliably determined from the text.',
    '4. Do not guess totals, dates, names, or amounts. Null is always safer than a guess.',
    '5. line_items / experience / education / key_points / entities must be arrays (possibly empty).',
    '6. Every field gets a 0-100 confidence score in field_confidence.',
    '7. overall_confidence is the mean of field confidences, rounded to 1 decimal.',
    '',
    'SCHEMAS:',
    ...Object.entries(SCHEMAS).map(([t, fs]) => `- ${t}: ${fs.join(', ')}`),
    '',
    `Source file: ${fileName || 'unknown'} (${mimeType || 'unknown type'})`,
    '',
    'OCR TEXT:',
    '<<<',
    ocrText,
    '>>>',
    '',
    'Respond with ONLY valid JSON (no markdown fences, no commentary):',
    '{ "doc_type": "<one of the six>",',
    '  "fields": { "<field>": <string|number|array|object|null> },',
    '  "field_confidence": { "<field>": <0-100> },',
    '  "overall_confidence": <0-100> }',
  ].join('\n');
}

/**
 * Try to salvage JSON from a model reply that may include fences/prose.
 */
export function safeParseJson(raw) {
  if (typeof raw !== 'string') return null;
  const direct = tryParse(raw);
  if (direct) return direct;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && tryParse(fenced[1])) return tryParse(fenced[1]);
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start && tryParse(raw.slice(start, end + 1))) {
    return tryParse(raw.slice(start, end + 1));
  }
  return null;
}

function tryParse(s) {
  try {
    return JSON.parse(s.trim());
  } catch {
    return null;
  }
}

/**
 * Normalize + sanitize the model's JSON so the DB always gets a safe shape.
 * Unknown doc types fall back to 'general'. Unknown fields are dropped.
 * Missing fields become null with 0 confidence (never fabricated).
 */
export function normalizeResult(parsed, fallbackType = 'general') {
  let docType =
    parsed && typeof parsed.doc_type === 'string'
      ? parsed.doc_type.trim().toLowerCase()
      : fallbackType;
  if (!DOC_TYPES.includes(docType)) docType = 'general';

  const expected = SCHEMAS[docType];
  const rawFields =
    parsed && parsed.fields && typeof parsed.fields === 'object' ? parsed.fields : {};
  const rawConf =
    parsed && parsed.field_confidence && typeof parsed.field_confidence === 'object'
      ? parsed.field_confidence
      : {};

  const fields = {};
  const fieldConfidence = {};
  for (const key of expected) {
    const v = Object.prototype.hasOwnProperty.call(rawFields, key) ? rawFields[key] : null;
    fields[key] = v === undefined ? null : v;
    const c = Number(rawConf[key]);
    fieldConfidence[key] = Number.isFinite(c) ? Math.max(0, Math.min(100, Math.round(c))) : 0;
  }

  const vals = Object.values(fieldConfidence);
  const overall =
    vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;

  return {
    doc_type: docType,
    fields,
    field_confidence: fieldConfidence,
    overall_confidence:
      Number.isFinite(Number(parsed && parsed.overall_confidence)) && vals.length > 0
        ? Math.max(0, Math.min(100, Number(parsed.overall_confidence)))
        : overall,
  };
}

export async function callNemotron({ prompt }) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    const err = new Error(
      'Server misconfigured: NVIDIA_API_KEY is not set. Add it in Vercel env vars.'
    );
    err.code = 'MISSING_API_KEY';
    throw err;
  }
  const baseUrl = process.env.NVIDIA_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`NVIDIA API error ${res.status}: ${text.slice(0, 500)}`);
    err.code = 'NVIDIA_ERROR';
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';
  return { content, model, raw: data };
}
