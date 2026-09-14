import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import useReveal from '../hooks/useReveal.js';

function ApertureMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <line x1="10" y1="1.5" x2="10" y2="4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="10" y1="15.6" x2="10" y2="18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="1.5" y1="10" x2="4.4" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15.6" y1="10" x2="18.5" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="4" y1="13.2" x2="16" y2="13.2" stroke="#EA580C" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* Pointer driven 3D tilt. Writes CSS vars directly, no rerenders. */
function useTilt(max = 7) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return { ref, onMove, onLeave };
}

const FEATURES = [
  {
    title: 'PDF plus image rendering',
    body: 'PDFs are rendered page by page in your browser with PDF.js. Photos and scans load directly. No desktop software, no converter step.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="2.5" width="16" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <line x1="6.5" y1="7" x2="15.5" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="6.5" y1="11" x2="15.5" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="6.5" y1="15" x2="12.5" y2="15" stroke="#EA580C" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'OpenCV preprocessing',
    body: 'Grayscale, denoise and adaptive threshold clean up uneven scans before OCR. If the vision runtime is unavailable, pages fall back to raw pixels.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 3.5v3M11 15.5v3M3.5 11h3M15.5 11h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="11" cy="11" r="2" fill="#EA580C" />
      </svg>
    ),
  },
  {
    title: 'In-browser OCR with confidence',
    body: 'Tesseract.js reads every page on your device and reports word level mean confidence, so you can see exactly how sure the read is.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M3 5.5h16M3 11h16M3 16.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="16.5" cy="16" r="3" stroke="#EA580C" strokeWidth="1.6" />
        <path d="m15.2 16 1 1 1.8-2" stroke="#EA580C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Structured AI extraction',
    body: 'Nemotron turns raw OCR text into typed fields with per field confidence. Anything it cannot read comes back null, never guessed.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 9.2 10 11l4-4.4" stroke="#EA580C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="7" y1="14.5" x2="15" y2="14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Six document classifiers',
    body: 'Invoice, receipt, purchase order, resume, contract, or general. Every upload is typed so the archive stays sortable from day one.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 4h5l2 2.5h7V18H4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="7" y1="12" x2="15" y2="12" stroke="#EA580C" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="7" y1="15" x2="13" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'History, search and export',
    body: 'A per document processing timeline, search and filter across the archive, and one click JSON or CSV export of documents and extractions.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 3v11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="m6.5 9.5 4.5 4.5 4.5-4.5" stroke="#EA580C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="4" y1="18.5" x2="18" y2="18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const STEPS = [
  { name: 'Upload', detail: 'Drop PDFs or images into the feed tray' },
  { name: 'Render', detail: 'PDF.js rasterizes each page in-browser' },
  { name: 'Preprocess', detail: 'OpenCV: grayscale, denoise, threshold' },
  { name: 'OCR', detail: 'Tesseract.js with word-level confidence' },
  { name: 'AI extract', detail: 'Nemotron structures fields, nulls unknowns' },
  { name: 'Persist', detail: 'Private rows, timeline, export anytime' },
];

const FAQS = [
  {
    q: 'Where do my files go?',
    a: 'Originals are stored in private per-user storage, and every pipeline run is logged against your account. Other users cannot see your documents, because access is scoped to your login by row-level security.',
  },
  {
    q: 'Is OCR really in-browser?',
    a: 'Yes. Rendering, OpenCV preprocessing and Tesseract OCR all run on your device. Only the extracted text (never the file bytes) is sent to the server for the AI structuring step.',
  },
  {
    q: 'What if the AI cannot read a field?',
    a: 'It returns null for that field along with a low confidence score, and the raw OCR text stays attached to the document so you can always check the source yourself. Missing values are never invented.',
  },
  {
    q: 'Which file types are supported?',
    a: 'PDF documents and common image formats (PNG, JPEG and similar). Each file is processed page by page, and the classifier sorts the result into one of six types: invoice, receipt, purchase order, resume, contract, or general.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes. Documents, OCR results and extractions are private to your account, so signing in is what keeps your archive separate from everyone else. Sign in or create an account on the login page to start.',
  },
  {
    q: 'What does it cost, and who is it for?',
    a: 'DocLens is a portfolio project: an end-to-end demonstration of an OCR-plus-LLM document pipeline (PDF.js, OpenCV, Tesseract, Nemotron, Supabase). It is built for anyone curious how scanned paper becomes structured, searchable data.',
  },
];

function FaqItem({ q, a, open, onToggle, index }) {
  return (
    <div className="card overflow-hidden !rounded-xl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-panel-${index}`}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="mono text-[11px] font-bold text-lamp-700">{String(index + 1).padStart(2, '0')}</span>
        <span className="flex-1 text-sm font-bold text-espresso-900">{q}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-lamp-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m3 5.5 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        id={`faq-panel-${index}`}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? '[grid-template-rows:1fr]' : '[grid-template-rows:0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 pl-[42px] text-sm leading-relaxed text-espresso-600">{a}</p>
        </div>
      </div>
    </div>
  );
}

function ScanVisual() {
  const { ref, onMove, onLeave } = useTilt(6);
  return (
    <div className="doc-tilt-scene" onMouseMove={onMove} onMouseLeave={onLeave}>
      <div ref={ref} className="doc-tilt relative mx-auto max-w-md">
        <div className="doc-orb" aria-hidden="true" />
        <figure className="scanframe card relative overflow-hidden p-0">
          <img
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1000&auto=format&fit=crop"
            alt="A hand signing a paper document"
            width="720"
            height="560"
            loading="eager"
            className="aspect-[720/560] w-full object-cover"
          />
          <span className="scanbeam" aria-hidden="true" />
        </figure>
        <div aria-hidden="true" className="mx-auto h-2 w-3/4 rounded-b-xl bg-espresso-200/60" />
        <div aria-hidden="true" className="mx-auto h-2 w-2/3 rounded-b-xl bg-espresso-200/40" />
        <figcaption className="mt-3 text-center text-[12.5px] italic leading-relaxed text-espresso-500">
          From paper pile to searchable archive.
        </figcaption>
      </div>
    </div>
  );
}

function FeatureArticle({ f, image, wide }) {
  return (
    <article className="doc-card card flex h-full flex-col overflow-hidden p-0">
      {image}
      <div className="flex flex-1 flex-col p-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-espresso-950 text-lamp-500">
          {f.icon}
        </span>
        <h3 className="mt-3 font-display text-[17px] font-bold text-espresso-950">{f.title}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-espresso-600">{f.body}</p>
      </div>
    </article>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const revealRef = useReveal();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div ref={revealRef} className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-espresso-200/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-espresso-950 text-lamp-500 shadow-card">
              <ApertureMark />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[17px] font-bold tracking-tight text-espresso-950">
                DocLens
              </span>
              <span className="mono block text-[10px] font-semibold uppercase tracking-[0.24em] text-espresso-500">
                Paper to rows
              </span>
            </span>
          </span>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Page sections">
            {[
              { href: '#features', label: 'Features' },
              { href: '#pipeline', label: 'Pipeline' },
              { href: '#faq', label: 'FAQ' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-espresso-600 transition hover:bg-espresso-100 hover:text-espresso-900"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="btn-secondary !py-2 !text-xs">
              Sign in
            </Link>
            <Link to="/login?mode=signup" className="btn-primary !py-2 !text-xs">
              Get started
            </Link>
          </div>
        </div>
        <div aria-hidden="true" className="h-[2px] bg-gradient-to-r from-transparent via-lamp-600/60 to-transparent" />
      </header>

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden px-4 pb-10 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
          <div className="doc-hero-mesh" aria-hidden="true" />
          <div className="reveal relative">
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-espresso-950 sm:text-5xl">
              Point a scanner at the paper pile. Keep the{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">structure.</span>
                <span aria-hidden="true" className="absolute inset-x-0 bottom-1 z-0 h-3 bg-lamp-200/70" />
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-espresso-600">
              Scan PDFs and photos in your browser. OCR with confidence, AI extraction into six types, unknowns kept null.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary !px-5 !py-3 !text-sm">
                  Open archive dashboard
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-primary !px-5 !py-3 !text-sm">
                    Sign in
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <a href="#pipeline" className="btn-secondary !px-5 !py-3 !text-sm">
                    See how it works
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="reveal reveal-delay-1 relative">
            <ScanVisual />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12" aria-label="At a glance">
          <div className="reveal">
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-espresso-200/70 bg-espresso-200/70 sm:grid-cols-3">
              {[
                ['Runs in your browser', 'Rendering, cleanup and OCR on device.'],
                ['Private to your account', 'Only extracted text reaches the server.'],
                ['Six document types', 'Invoice to contract, sorted on arrival.'],
              ].map(([term, def]) => (
                <div key={term} className="bg-[#FFFDF7] px-5 py-4">
                  <dt className="font-display text-[15px] font-bold text-espresso-950">{term}</dt>
                  <dd className="mt-0.5 text-[13px] text-espresso-500">{def}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div aria-hidden="true" className="rule-lamp mx-auto max-w-6xl" />

        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
          <div className="reveal max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-espresso-950">
              Everything the darkroom does
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-espresso-600">
              Six capabilities, each one wired into the real pipeline.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="reveal md:col-span-2">
              <FeatureArticle
                f={FEATURES[0]}
                image={
                  <img
                    src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?q=80&w=1000&auto=format&fit=crop"
                    alt="Document pages spread on a desk"
                    width="720"
                    height="300"
                    loading="lazy"
                    className="aspect-[720/300] w-full object-cover"
                  />
                }
              />
            </div>
            <div className="reveal reveal-delay-1">
              <FeatureArticle f={FEATURES[1]} />
            </div>
            <div className="reveal">
              <FeatureArticle f={FEATURES[2]} />
            </div>
            <div className="reveal reveal-delay-1">
              <FeatureArticle f={FEATURES[3]} />
            </div>
            <div className="reveal reveal-delay-2">
              <FeatureArticle f={FEATURES[4]} />
            </div>
            <div className="reveal md:col-span-3">
              <article className="doc-card card grid h-full gap-5 p-5 sm:grid-cols-[1fr_1.2fr] sm:items-center">
                <img
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=900&auto=format&fit=crop"
                  alt="Shelves of a sorted archive"
                  width="640"
                  height="360"
                  loading="lazy"
                  className="aspect-[640/360] w-full rounded-xl border border-espresso-200/70 object-cover"
                />
                <div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-espresso-950 text-lamp-500">
                    {FEATURES[5].icon}
                  </span>
                  <h3 className="mt-3 font-display text-[19px] font-bold text-espresso-950">{FEATURES[5].title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-espresso-600">{FEATURES[5].body}</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <div aria-hidden="true" className="rule-lamp mx-auto max-w-6xl" />

        <section id="pipeline" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
          <div className="reveal max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-espresso-950">
              The pipeline, end to end
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-espresso-600">
              The same six stages you watch live on the upload page. Every run is recorded on the timeline.
            </p>
          </div>
          <ol className="mt-8 grid gap-2 md:grid-cols-6 md:gap-0">
            {STEPS.map((s, i) => (
              <li key={s.name} className={`reveal relative ${i % 2 === 1 ? 'reveal-delay-1' : ''}`}>
                <div className="flex h-full flex-col rounded-xl border border-espresso-200/70 bg-[#FFFDF7] p-4 shadow-card md:rounded-none md:border-x-0 md:shadow-none md:first:rounded-l-xl md:first:border-l md:last:rounded-r-xl md:last:border-r">
                  <span className="mono text-[11px] font-bold text-lamp-700">{String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-1 font-display text-[15px] font-bold text-espresso-950">{s.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-espresso-500">{s.detail}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-lamp-600/40 bg-[#FFFDF7] text-lamp-700 md:block"
                  >
                    <path d="M6 4.5 9.5 8 6 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ol>
          <div className="reveal mt-6 flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn-primary !text-sm">
              Sign in
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="mono text-[11px] uppercase tracking-[0.12em] text-espresso-400">
              Upload page shows live per-page progress
            </span>
          </div>
        </section>

        <div aria-hidden="true" className="rule-lamp mx-auto max-w-6xl" />

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14">
          <div className="reveal">
            <h2 className="font-display text-3xl font-bold tracking-tight text-espresso-950">
              Honest answers
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-espresso-600">
              The limits of the system, stated plainly.
            </p>
          </div>
          <div className="mt-6 space-y-2.5">
            {FAQS.map((f, i) => (
              <div key={f.q} className="reveal">
                <FaqItem
                  q={f.q}
                  a={f.a}
                  index={i}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="reveal card relative overflow-hidden p-8 text-center sm:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-lamp-600/70 to-transparent"
            />
            <h2 className="mx-auto max-w-xl font-display text-3xl font-bold tracking-tight text-espresso-950 sm:text-4xl">
              Your paper pile, searchable.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-espresso-600">
              Sign in, drop in a scan, and watch it develop from pixels to structured rows.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary !px-6 !py-3">
                  Open archive dashboard
                </Link>
              ) : (
                <Link to="/login" className="btn-primary !px-6 !py-3">
                  Sign in
                </Link>
              )}
              <a href="#features" className="btn-secondary !px-6 !py-3">
                Browse features
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-espresso-200/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center">
          <span className="flex items-center gap-2 text-espresso-700">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-espresso-950 text-lamp-500">
              <ApertureMark size={15} />
            </span>
            <span className="font-display text-sm font-bold text-espresso-950">DocLens</span>
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm font-semibold text-espresso-600" aria-label="Footer">
            <a href="#features" className="transition hover:text-lamp-700">Features</a>
            <a href="#pipeline" className="transition hover:text-lamp-700">Pipeline</a>
            <a href="#faq" className="transition hover:text-lamp-700">FAQ</a>
            <Link to="/login" className="transition hover:text-lamp-700">Sign in</Link>
          </nav>
          <div aria-hidden="true" className="rule-lamp mx-auto w-full max-w-xs opacity-70" />
          <p className="mono text-[11px] uppercase tracking-[0.18em] text-espresso-400">
            DocLens, darkroom build, Vercel plus Supabase plus Nemotron
          </p>
        </div>
      </footer>
    </div>
  );
}
