// OpenCV.js preprocessing — grayscale, denoise, adaptive threshold.
// Lazy-loads @techstark/opencv-js once; degrades gracefully to raw pixels
// if OpenCV fails (offline CDN, WASM blocked, etc.).

let cvPromise = null;
let cvFailed = false;

function loadOpenCv() {
  if (cvPromise) return cvPromise;
  cvPromise = (async () => {
    const mod = await import('@techstark/opencv-js');
    const cv = mod.default || mod;
    if (cv && typeof cv.then === 'function') {
      // Wait for WASM init if the package exposes a promise.
      try {
        await cv;
      } catch {
        /* ignore */
      }
    }
    // Poll for ready signal used by techstark builds.
    for (let i = 0; i < 100; i++) {
      if (cv && cv.Mat) return cv;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('OpenCV runtime did not initialise');
  })();
  return cvPromise;
}

function dataUrlToCanvas(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Decide whether OpenCV preprocessing is worthwhile.
 * Small clean images skip it; large / low-contrast renders get full treatment.
 */
export function shouldPreprocess(width, height) {
  if (!width || !height) return true;
  const mp = (width * height) / 1_000_000;
  return mp > 0.4; // anything bigger than a thumbnail benefits
}

/**
 * @param {string} dataUrl PNG data URL of the page
 * @param {{ steps?: Array<'grayscale'|'denoise'|'adaptiveThreshold'> }} opts
 * @returns {Promise<{ dataUrl: string, applied: string[], skipped: boolean }>}
 */
export async function preprocessPage(dataUrl, opts = {}) {
  const steps = opts.steps || ['grayscale', 'denoise', 'adaptiveThreshold'];
  if (cvFailed) return { dataUrl, applied: [], skipped: true };

  let cv;
  try {
    cv = await loadOpenCv();
  } catch (e) {
    cvFailed = true;
    console.warn('[DocLens] OpenCV unavailable, using raw pixels:', e.message);
    return { dataUrl, applied: [], skipped: true };
  }

  let src = null;
  let gray = null;
  let denoised = null;
  let out = null;
  try {
    const canvas = await dataUrlToCanvas(dataUrl);
    src = cv.imread(canvas);
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    let current = gray;
    const applied = ['grayscale'];

    if (steps.includes('denoise')) {
      denoised = new cv.Mat();
      cv.medianBlur(current, denoised, 3);
      if (current !== gray) current.delete();
      current = denoised;
      applied.push('denoise');
    }

    if (steps.includes('adaptiveThreshold')) {
      out = new cv.Mat();
      cv.adaptiveThreshold(
        current,
        out,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        31,
        10
      );
      applied.push('adaptiveThreshold');
      const outCanvas = document.createElement('canvas');
      cv.imshow(outCanvas, out);
      return { dataUrl: outCanvas.toDataURL('image/png'), applied, skipped: false };
    }

    const c = document.createElement('canvas');
    cv.imshow(c, current);
    return { dataUrl: c.toDataURL('image/png'), applied, skipped: false };
  } catch (e) {
    console.warn('[DocLens] OpenCV preprocess failed, using raw pixels:', e.message);
    return { dataUrl, applied: [], skipped: true };
  } finally {
    try {
      if (src) src.delete();
      if (gray) gray.delete();
      if (denoised) denoised.delete();
      if (out) out.delete();
    } catch {
      /* ignore double-free */
    }
  }
}
