import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function BrandPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-espresso-950 px-8 py-10 text-paper sm:px-10 lg:px-12">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(560px 300px at 15% 0%, rgba(234,88,12,0.22), transparent 60%), radial-gradient(480px 320px at 90% 100%, rgba(234,88,12,0.10), transparent 60%)',
        }}
      />
      <div className="relative">
        <Link to="/" className="flex items-center gap-3" aria-label="DocLens home">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.07] text-lamp-500 ring-1 ring-white/15">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.6" />
              <line x1="10" y1="1.5" x2="10" y2="4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="10" y1="15.6" x2="10" y2="18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="1.5" y1="10" x2="4.4" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="15.6" y1="10" x2="18.5" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="4" y1="13.2" x2="16" y2="13.2" stroke="#EA580C" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight">DocLens</span>
            <span className="mono block text-[10px] font-semibold uppercase tracking-[0.24em] text-paper/60">
              Archive · Scan · Extract
            </span>
          </span>
        </Link>
        <p className="mono mt-10 text-[11px] font-bold uppercase tracking-[0.22em] text-lamp-500">
          The darkroom desk
        </p>
        <h2 className="mt-3 max-w-md font-display text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
          Every document, developed like a negative.
        </h2>
        <div className="mt-4 h-px w-14 bg-lamp-500" aria-hidden="true" />
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-paper/80">
          {[
            'OCR + vision extraction in your browser session.',
            'Confidence readouts filed beside every page.',
            'Supabase Auth · Row Level Security on every shelf.',
          ].map((line) => (
            <li key={line} className="flex gap-2.5">
              <svg className="mt-0.5 shrink-0 text-lamp-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              {line}
            </li>
          ))}
        </ul>
      </div>
      <p className="mono relative mt-10 text-[11px] uppercase tracking-[0.18em] text-paper/50">
        Vercel + Supabase + Nemotron
      </p>
    </div>
  );
}

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'signup'
      ? 'signup'
      : 'signin',
  ); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await signUp(email.trim(), password);
        if (error) throw error;
        setInfo('Account created. Check your email to confirm, then sign in. One account works on every app.');
        setMode('signin');
      }
    } catch (err) {
      const msg = err.message || 'Authentication failed.';
      if (mode === 'signup' && /already (registered|exists|been registered)/i.test(msg)) {
        setInfo('This email already has an account — one account works on every app. Enter your password and hit Sign in.');
        setMode('signin');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <div className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="page-enter w-full max-w-md">
          <div className="card p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-espresso-950 text-lamp-500">
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.6" />
                  <line x1="10" y1="1.5" x2="10" y2="4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="10" y1="15.6" x2="10" y2="18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="1.5" y1="10" x2="4.4" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="15.6" y1="10" x2="18.5" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="4" y1="13.2" x2="16" y2="13.2" stroke="#EA580C" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <h1 className="font-display text-lg font-bold tracking-tight text-espresso-950">
                  DocLens
                </h1>
                <p className="mono text-[10px] uppercase tracking-[0.24em] text-espresso-500">
                  Archive · Scan · Extract
                </p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-espresso-200 bg-paper-deep p-1 text-sm font-bold">
              {['signin', 'signup'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg py-2 transition ${mode === m ? 'bg-[#FFFDF7] text-espresso-950 shadow-card' : 'text-espresso-500 hover:text-espresso-800'}`}
                >
                  {m === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  {error}
                </p>
              )}
              {info && (
                <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                  {info}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>
            <p className="mono mt-4 text-center text-[11px] uppercase tracking-[0.12em] text-espresso-400">
              Supabase Auth · Row Level Security
            </p>
          </div>
          <div aria-hidden="true" className="mx-auto mt-3 h-2 w-3/4 rounded-b-xl bg-espresso-200/60" />
          <div aria-hidden="true" className="mx-auto h-2 w-2/3 rounded-b-xl bg-espresso-200/40" />
        </div>
      </div>
    </div>
  );
}
