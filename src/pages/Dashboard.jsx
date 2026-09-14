import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardStats from '../components/DashboardStats.jsx';
import { SYNTHETIC_DOCS } from '../demo/syntheticDocs.js';

function StatsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton mt-2 h-8 w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="card p-4"><div className="skeleton h-20 w-full" /></div>
        <div className="card p-4"><div className="skeleton h-20 w-full" /></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [ocrResults, setOcrResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data: docs, error: dErr } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (dErr) throw dErr;
      setDocuments(docs || []);
      const ids = (docs || []).map((d) => d.id);
      if (ids.length > 0) {
        const { data: ocr, error: oErr } = await supabase
          .from('ocr_results')
          .select('id,document_id,success')
          .in('document_id', ids);
        if (oErr) throw oErr;
        setOcrResults(ocr || []);
      } else {
        setOcrResults([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const stats = useMemo(() => {
    const total = documents.length;
    const byTypeMap = {};
    let confSum = 0;
    let confN = 0;
    let timeSum = 0;
    let timeN = 0;
    for (const d of documents) {
      byTypeMap[d.doc_type] = (byTypeMap[d.doc_type] || 0) + 1;
      if (d.overall_confidence !== null && d.overall_confidence !== undefined) {
        confSum += Number(d.overall_confidence);
        confN++;
      }
      if (d.processing_time_ms !== null && d.processing_time_ms !== undefined) {
        timeSum += Number(d.processing_time_ms);
        timeN++;
      }
    }
    const ocrOk = ocrResults.filter((r) => r.success).length;
    return {
      total,
      byType: Object.entries(byTypeMap).map(([type, count]) => ({ type, count })),
      ocrRate:
        ocrResults.length > 0 ? Math.round((ocrOk / ocrResults.length) * 1000) / 10 : null,
      avgConf: confN > 0 ? Math.round((confSum / confN) * 10) / 10 : null,
      avgTimeMs: timeN > 0 ? Math.round(timeSum / timeN) : null,
    };
  }, [documents, ocrResults]);

  // One-click synthetic demo: inserts ONLY clearly-labeled demo rows so the
  // dashboard/analytics can be explored without uploading real files or
  // spending NVIDIA calls. No real user data is ever fabricated.
  async function loadDemo() {
    setSeeding(true);
    setError('');
    try {
      for (const demo of SYNTHETIC_DOCS) {
        const { data: doc, error: dErr } = await supabase
          .from('documents')
          .insert({
            owner_id: user.id,
            file_name: `demo-${demo.docType}.txt`,
            file_path: `${user.id}/demo/${Date.now()}-${demo.docType}.txt`,
            mime_type: 'text/plain',
            file_size_bytes: demo.ocrText.length,
            page_count: 1,
            doc_type: demo.docType,
            status: 'done',
            overall_confidence: demo.extraction.overall_confidence,
            processing_time_ms: demo.processingTimeMs,
          })
          .select()
          .single();
        if (dErr) throw dErr;
        await supabase.from('ocr_results').insert({
          document_id: doc.id,
          owner_id: user.id,
          page_number: 1,
          engine: 'tesseract.js (demo)',
          raw_text: demo.ocrText,
          mean_confidence: demo.ocrConfidence,
          word_count: demo.ocrText.split(/\s+/).length,
          preprocessing: ['demo-synthetic'],
          processing_time_ms: 120,
          success: true,
        });
        await supabase.from('extractions').insert({
          document_id: doc.id,
          owner_id: user.id,
          doc_type: demo.docType,
          fields: demo.extraction.fields,
          field_confidence: demo.extraction.field_confidence,
          overall_confidence: demo.extraction.overall_confidence,
          model: 'demo-synthetic (no NVIDIA call)',
        });
        await supabase.from('doclens_processing_runs').insert({
          document_id: doc.id,
          owner_id: user.id,
          stage: 'done',
          status: 'succeeded',
          detail: { demo: true },
          duration_ms: demo.processingTimeMs,
        });
      }
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="eyebrow">Light table</p>
          <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight text-espresso-950">Dashboard</h1>
          <p className="mt-0.5 text-sm text-espresso-500">Analytics across your processed documents.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={loadDemo} disabled={seeding} className="btn-secondary">
            {seeding ? 'Loading demo…' : 'Load synthetic demo'}
          </button>
          <Link to="/upload" className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2v8M3.5 6.5 7 3l3.5 3.5M2.5 11.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Upload document
          </Link>
        </div>
      </div>
      <div aria-hidden="true" className="rule-lamp" />
      {error && (
        <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
          {error}
        </p>
      )}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <DashboardStats stats={stats} recent={documents} />
      )}
    </div>
  );
}
