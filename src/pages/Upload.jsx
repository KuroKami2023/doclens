import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UploadZone from '../components/UploadZone.jsx';
import { supabase, STORAGE_BUCKET } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { renderFileToPages } from '../lib/pdfProcessor.js';
import { preprocessPage, shouldPreprocess } from '../lib/opencvPreprocess.js';
import { ocrPage } from '../lib/ocrPipeline.js';

function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = (head.match(/data:(.*?);/) || [])[1] || 'image/png';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function logRun({ documentId, ownerId, stage, status, detail, durationMs }) {
  try {
    await supabase.from('doclens_processing_runs').insert({
      document_id: documentId,
      owner_id: ownerId,
      stage,
      status,
      detail: detail || {},
      duration_ms: durationMs ?? null,
    });
  } catch {
    /* history is best-effort */
  }
}

const PIPELINE_STAGES = ['Storage', 'PDF.js', 'OpenCV', 'Tesseract.js', 'Nemotron', 'Supabase'];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState([]);
  const [errors, setErrors] = useState([]);

  function setFileProgress(name, patch) {
    setProgress((prev) => {
      const i = prev.findIndex((p) => p.name === name);
      if (i === -1) return [...prev, { name, stage: 'queued', ...patch }];
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  async function processOne(file) {
    const totalStarted = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    setFileProgress(file.name, { stage: 'rendering PDF / loading image' });

    // 1. Render pages (PDF.js for PDFs, direct for images)
    let rendered;
    try {
      rendered = await renderFileToPages(file);
    } catch (e) {
      throw new Error(`Could not read file (${e.message}). Is it a valid PDF/image?`);
    }

    // 2. Create the documents row first (RLS: owner_id = auth.uid())
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .insert({
        owner_id: user.id,
        file_name: file.name,
        file_path: `${user.id}/${Date.now()}-${safeName}`,
        mime_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size,
        page_count: rendered.pageCount,
        status: 'processing_ocr',
      })
      .select()
      .single();
    if (docErr) throw new Error(`Database insert failed: ${docErr.message}`);

    try {
      // 3. Upload original to private storage
      setFileProgress(file.name, { stage: 'uploading to private storage' });
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(doc.file_path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);
      await logRun({ documentId: doc.id, ownerId: user.id, stage: 'upload', status: 'succeeded' });

      // 4-5. OpenCV preprocess + Tesseract OCR per page
      const ocrRows = [];
      for (const page of rendered.pages) {
        setFileProgress(file.name, { stage: `OCR page ${page.pageNumber}/${rendered.pages.length}` });
        const t0 = Date.now();
        let pixels = page.dataUrl;
        let applied = [];
        if (shouldPreprocess(page.width, page.height)) {
          const pre = await preprocessPage(page.dataUrl);
          pixels = pre.dataUrl;
          applied = pre.applied;
        }
        await logRun({
          documentId: doc.id, ownerId: user.id, stage: 'opencv_preprocess', status: 'succeeded',
          detail: { page: page.pageNumber, applied },
        });
        const ocr = await ocrPage(pixels, (p) =>
          setFileProgress(file.name, {
            stage: `OCR page ${page.pageNumber} — ${Math.round(p * 100)}%`,
          })
        );

        // Persist page preview (preprocessed pixels help the preview too)
        const pagePath = `${user.id}/${doc.id}/pages/page-${page.pageNumber}.png`;
        try {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(pagePath, dataUrlToBlob(pixels), { contentType: 'image/png', upsert: true });
        } catch {
          /* preview upload is optional */
        }
        const { data: pageRow } = await supabase
          .from('document_pages')
          .insert({
            document_id: doc.id, owner_id: user.id, page_number: page.pageNumber,
            width_px: page.width, height_px: page.height, storage_path: pagePath,
          })
          .select()
          .single();

        const { data: ocrRow, error: ocrErr } = await supabase
          .from('ocr_results')
          .insert({
            document_id: doc.id,
            page_id: pageRow ? pageRow.id : null,
            owner_id: user.id,
            page_number: page.pageNumber,
            engine: 'tesseract.js',
            raw_text: ocr.text,
            mean_confidence: ocr.meanConfidence,
            word_count: ocr.wordCount,
            preprocessing: applied,
            processing_time_ms: Date.now() - t0,
            success: ocr.success,
          })
          .select()
          .single();
        if (ocrErr) throw new Error(`OCR persist failed: ${ocrErr.message}`);
        if (ocrRow) ocrRows.push(ocrRow);
        await logRun({
          documentId: doc.id, ownerId: user.id, stage: 'ocr', status: 'succeeded',
          detail: { page: page.pageNumber, words: ocr.wordCount, confidence: ocr.meanConfidence },
          durationMs: Date.now() - t0,
        });
      }

      const combinedText = ocrRows.map((r) => r.raw_text).join('\n\n').trim();
      if (!combinedText) {
        throw new Error('OCR found no text — try a clearer scan or photo.');
      }
      await supabase.from('documents').update({ status: 'analyzing' }).eq('id', doc.id);

      // 6. Server-side Nemotron analysis (key never touches the browser)
      setFileProgress(file.name, { stage: 'Nemotron AI analysis…' });
      const tAi = Date.now();
      const aiRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrText: combinedText,
          fileName: file.name,
          mimeType: file.type,
          pageCount: rendered.pages.length,
        }),
      });
      const aiJson = await aiRes.json().catch(() => ({}));
      if (!aiRes.ok) {
        throw new Error(aiJson.error || `AI analysis failed (HTTP ${aiRes.status}).`);
      }
      await logRun({
        documentId: doc.id, ownerId: user.id, stage: 'ai_analyze', status: 'succeeded',
        detail: { doc_type: aiJson.doc_type, overall_confidence: aiJson.overall_confidence, model: aiJson.model },
        durationMs: Date.now() - tAi,
      });

      // 7. Persist extraction + finalize
      const { error: extErr } = await supabase.from('extractions').insert({
        document_id: doc.id,
        owner_id: user.id,
        doc_type: aiJson.doc_type,
        fields: aiJson.fields,
        field_confidence: aiJson.field_confidence,
        overall_confidence: aiJson.overall_confidence,
        model: aiJson.model || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
      });
      if (extErr) throw new Error(`Extraction persist failed: ${extErr.message}`);

      const totalMs = Date.now() - totalStarted;
      await supabase
        .from('documents')
        .update({ status: 'done', doc_type: aiJson.doc_type, overall_confidence: aiJson.overall_confidence, processing_time_ms: totalMs })
        .eq('id', doc.id);
      await logRun({ documentId: doc.id, ownerId: user.id, stage: 'done', status: 'succeeded', detail: { totalMs }, durationMs: totalMs });

      setFileProgress(file.name, { stage: 'done' });
      return doc.id;
    } catch (inner) {
      await supabase.from('documents').update({ status: 'failed', error: String(inner.message).slice(0, 500) }).eq('id', doc.id);
      await logRun({ documentId: doc.id, ownerId: user.id, stage: 'failed', status: 'failed', detail: { error: String(inner.message).slice(0, 500) } });
      throw inner;
    }
  }

  async function handleFiles(files) {
    setBusy(true);
    setErrors([]);
    setProgress(files.map((f) => ({ name: f.name, stage: 'queued' })));
    const ids = [];
    for (const f of files) {
      try {
        const id = await processOne(f);
        ids.push(id);
      } catch (e) {
        setFileProgress(f.name, { stage: `failed: ${e.message}` });
        setErrors((prev) => [...prev, `${f.name}: ${e.message}`]);
      }
    }
    setBusy(false);
    if (ids.length === 1) navigate(`/documents/${ids[0]}`);
    else if (ids.length > 1) navigate('/documents');
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Feed the scanner</p>
        <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight text-espresso-950">Upload</h1>
        <ol className="mono mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] uppercase tracking-[0.12em] text-espresso-500" aria-label="Pipeline stages">
          {PIPELINE_STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              {i > 0 && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="text-lamp-600">
                  <path d="M3.5 2 6.5 5 3.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span className={i === 4 ? 'font-bold text-lamp-700' : undefined}>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div aria-hidden="true" className="rule-lamp" />
      <UploadZone onFiles={handleFiles} busy={busy} />
      {progress.length > 0 && (
        <div className={`card p-4 ${busy ? 'scanframe' : ''}`}>
          {busy && <span aria-hidden="true" className="scanbeam" />}
          <p className="eyebrow">Developing</p>
          <p className="mt-0.5 font-display text-[15px] font-bold text-espresso-950">Progress</p>
          <ul className="mt-2 space-y-1.5">
            {progress.map((p) => {
              const isDone = p.stage === 'done';
              const isFailed = p.stage.startsWith('failed');
              const isActive = busy && !isDone && !isFailed;
              return (
                <li key={p.name} className="flex items-center gap-2 text-sm">
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-emerald-700">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                      <path d="m4.5 7 1.8 1.8L9.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isFailed ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-rose-700">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={`shrink-0 ${isActive ? 'animate-spin text-lamp-600' : 'text-espresso-400'}`}>
                      <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 3" strokeLinecap="round" />
                    </svg>
                  )}
                  <span className="truncate font-semibold text-espresso-900">{p.name}</span>
                  <span className={`mono ml-auto shrink-0 text-xs ${isFailed ? 'text-rose-700' : isDone ? 'font-bold text-emerald-700' : 'text-espresso-500'}`}>
                    {p.stage}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {errors.length > 0 && (
        <div className="card !border-rose-300 p-4">
          {errors.map((e, i) => (
            <p key={i} className="flex items-start gap-2 text-sm text-rose-800">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="mt-1 shrink-0">
                <circle cx="6" cy="6" r="1.6" fill="currentColor" />
              </svg>
              {e}
            </p>
          ))}
        </div>
      )}
      <p className="text-xs text-espresso-400">
        Tip: explore instantly with <Link to="/" className="font-bold text-lamp-700 hover:underline">synthetic demo documents</Link> — no upload or NVIDIA key needed.
      </p>
    </div>
  );
}
