import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/documents', label: 'Documents' },
  { to: '/upload', label: 'Upload' },
];

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      {/* Scanner aperture mark */}
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-espresso-950 text-lamp-500 shadow-card">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
        <span className="block font-display text-[17px] font-bold tracking-tight text-espresso-950">
          DocLens

        </span>
        <span className="mono block text-[10px] font-semibold uppercase tracking-[0.24em] text-espresso-500">
          Archive, Scan, Extract
        </span>
      </span>
    </span>
  );
}

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-espresso-200/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" aria-label="DocLens home">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {NAV.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-espresso-950 text-paper'
                      : 'text-espresso-600 hover:bg-espresso-100 hover:text-espresso-900'
                  }`}
                >
                  {n.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-lamp-500"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="mono hidden max-w-[220px] truncate text-xs text-espresso-500 sm:block">
              {user?.email}
            </span>
            <button onClick={handleSignOut} className="btn-secondary !py-1.5 !text-xs">
              Sign out
            </button>
          </div>
        </div>
        {/* scan-lamp hairline under the header */}
        <div aria-hidden="true" className="h-[2px] bg-gradient-to-r from-transparent via-lamp-600/60 to-transparent" />
      </header>
      <main className="page-enter mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center">
        <div aria-hidden="true" className="rule-lamp mx-auto mb-3 max-w-xs opacity-70" />
        <p className="mono text-[11px] uppercase tracking-[0.18em] text-espresso-400">
          DocLens, Darkroom build, Vercel + Supabase + Nemotron
        </p>
      </footer>
    </div>
  );
}



