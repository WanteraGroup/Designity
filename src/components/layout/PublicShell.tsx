import { Link, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { LANGUAGES } from '@/lib/constants';

export function PublicShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();
  const { pathname } = useLocation();
  const bare = pathname === '/';

  return (
    <div className="relative min-h-screen bg-ink-950 text-cream-100">
      <div className="designly-backdrop" aria-hidden />

      {!bare && (
        <header className="fixed inset-x-0 top-0 z-40 border-b border-gold-700/20 bg-ink-950/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-10">
            <Link to="/" className="flex items-center gap-3">
              <img src="/designly-knot.svg" alt="" className="h-7 w-7" />
              <span className="font-display text-base tracking-[0.2em] text-gold-200">DESIGNLY</span>
            </Link>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-cream-300/60">
                <Globe className="h-3.5 w-3.5" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="bg-transparent text-cream-200 outline-none"
                  aria-label="Language"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-ink-900">
                      {l.flag}
                    </option>
                  ))}
                </select>
              </label>

              <Link
                to={user ? '/app' : '/login'}
                className="rounded-lg bg-gold-600 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-500"
              >
                {user ? 'Dashboard' : 'Sign in'}
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className={bare ? '' : 'pt-16 lg:pt-20'}>{children}</main>
    </div>
  );
}
