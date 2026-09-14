// POST /api/analyze — secure server-side Nemotron understanding.
// The browser sends OCR text; this function calls NVIDIA with the secret key
// and returns { doc_type, fields, field_confidence, overall_confidence }.
// The NVIDIA key NEVER leaves the server.
//
// Expected body: { ocrText, fileName?, mimeType?, pageCount? }

import { checkRateLimit } from './_lib/rateLimit.js';
import { validateAnalyzeBody, truncateOcr } from './_lib/validation.js';
import { buildPrompt, callNemotron, safeParseJson, normalizeResult } from './_lib/nvidia.js';

function send(res, status, obj, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, String(v));
  res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    send(res, 405, { error: 'Method not allowed. Use POST.' });
    return;
  }

  const rl = checkRateLimit(req, { windowMs: 60_000, max: 20, keyPrefix: 'analyze' });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (!rl.allowed) {
    send(
      res,
      429,
      { error: 'Rate limit exceeded. Try again shortly.' },
      { 'Retry-After': String(rl.retryAfterSec) }
    );
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      send(res, 400, { error: 'Invalid JSON body.' });
      return;
    }
  }

  const validation = validateAnalyzeBody(body);
  if (!validation.ok) {
    send(res, 400, { error: validation.error });
    return;
  }

  const started = Date.now();
  try {
    const { text: ocrForModel, truncated } = truncateOcr(body.ocrText.trim());
    const prompt = buildPrompt({
      ocrText: ocrForModel,
      fileName: body.fileName,
      mimeType: body.mimeType,
    });

    const { content, model } = await callNemotron({ prompt });
    const parsed = safeParseJson(content);
    if (!parsed) {
      send(res, 502, {
        error: 'AI returned non-JSON output. Retry the analysis.',
        debug: String(content).slice(0, 300),
      });
      return;
    }

    const result = normalizeResult(parsed);
    send(res, 200, {
      ...result,
      model,
      truncatedOcr: truncated,
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    if (err && err.code === 'MISSING_API_KEY') {
      send(res, 500, { error: err.message });
      return;
    }
    const status = err && err.status === 401 ? 502 : 502;
    send(res, status, {
      error: 'AI analysis failed. Check server logs / NVIDIA key and retry.',
      detail: String((err && err.message) || err).slice(0, 300),
    });
  }
}
