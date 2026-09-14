// PDF.js page rendering — turns PDFs into PNG data-URLs for preview + OCR.
// Images pass through untouched. JavaScript only.

import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker from the installed pdfjs-dist version.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * @param {File} file
 * @returns {Promise<{ kind: 'pdf'|'image', pages: Array<{ pageNumber:number, dataUrl:string, width:number, height:number }>, pageCount:number }>}
 */
export async function renderFileToPages(file, { scale = 2 } = {}) {
  if (file.type === 'application/pdf') {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    const pages = [];
    const maxPages = Math.min(pdf.numPages, 10);
    for (let n = 1; n <= maxPages; n++) {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push({
        pageNumber: n,
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      });
      page.cleanup();
    }
    await pdf.destroy();
    return { kind: 'pdf', pages, pageCount: Math.min(pdf.numPages, 10) };
  }

  // Image: single page, original bytes as preview.
  const dataUrl = await fileToDataUrl(file);
  const dims = await getImageDims(dataUrl);
  return {
    kind: 'image',
    pages: [{ pageNumber: 1, dataUrl, width: dims.width, height: dims.height }],
    pageCount: 1,
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getImageDims(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: null, height: null });
    img.src = dataUrl;
  });
}
