// Tesseract.js OCR wrapper — one worker, page-by-page, with progress.
// Runs fully in the browser; no file bytes ever leave the client except the
// extracted TEXT sent to /api/analyze.

import { createWorker } from 'tesseract.js';

let workerPromise = null;

async function getWorker(onProgress) {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', undefined, {
        logger: (m) => {
          if (m && m.status === 'recognizing text' && typeof m.progress === 'number') {
            onProgress && onProgress(m.progress);
          }
        },
      });
      return worker;
    })();
  }
  return workerPromise;
}

/**
 * OCR a single page data-URL.
 * @returns {Promise<{ text:string, meanConfidence:number|null, wordCount:number, success:boolean }>}
 */
export async function ocrPage(dataUrl, onProgress) {
  const started = Date.now();
  try {
    const worker = await getWorker(onProgress);
    const {
      data: { text, confidence, words },
    } = await worker.recognize(dataUrl);
    const clean = (text || '').replace(/\r/g, '').trim();
    const wordCount = clean ? clean.split(/\s+/).length : 0;
    // Tesseract word-level confidences are more honest than the top-line one.
    let mean = null;
    if (Array.isArray(words) && words.length > 0) {
      const cs = words.map((w) => w.confidence).filter((c) => Number.isFinite(c));
      if (cs.length > 0) mean = Math.round((cs.reduce((a, b) => a + b, 0) / cs.length) * 10) / 10;
    } else if (Number.isFinite(confidence)) {
      mean = Math.round(confidence * 10) / 10;
    }
    return {
      text: clean,
      meanConfidence: mean,
      wordCount,
      success: clean.length > 0,
      durationMs: Date.now() - started,
    };
  } catch (e) {
    console.error('[DocLens] OCR failed:', e);
    return { text: '', meanConfidence: null, wordCount: 0, success: false, durationMs: Date.now() - started };
  }
}

export async function terminateOcrWorker() {
  if (workerPromise) {
    try {
      const w = await workerPromise;
      await w.terminate();
    } catch {
      /* ignore */
    }
    workerPromise = null;
  }
}
