import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

/**
 * One component for signup, signin and password reset — the three forms share
 * every field, the validation and the layout, and Wave 1 kept three near-copies
 * of it in one file.
 */
export type AuthMode = 'login' | 'signup' | 'reset';

const copy: Record<AuthMode, { title: string; cta: string; alt: string; altTo: string }> = {
  login: { title: 'Welcome back', cta: 'Sign in', alt: 'Need an account?', altTo: '/signup' },
  signup: { title: 'Create your account', cta: 'Sign up', alt: 'Already have an account?', altTo: '/login' },
  reset: { title: 'Reset your password', cta: 'Send reset link', alt: 'Back to', altTo: '/login' },
};

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const result =
      mode === 'login'
        ? await signIn(email, password)
        : mode === 'signup'
          ? await signUp(email, password, fullName)
          : await resetPassword(email);

    setBusy(false);
    if (result.error) return setError(result.error);

    if (mode === 'reset') return setSent(true);
    if (mode === 'signup') {
      setError(null);
      return setSent(true);
    }
    navigate('/app');
  }

  const c = copy[mode];

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl text-cream-100">
          {mode === 'signup' ? 'Check your inbox' : 'Reset link sent'}
        </h1>
        <p className="mt-3 text-sm text-cream-300/60">
          {mode === 'signup'
            ? 'Confirm your email address to activate the account.'
            : 'Follow the link in the email to choose a new password.'}
        </p>
        <Link to="/login" className="mt-8 text-sm text-gold-300 hover:text-gold-200">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-3xl text-cream-100">{c.title}</h1>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === 'signup' && (
          <Field label="Name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="designly-input"
            />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="designly-input"
          />
        </Field>

        {mode !== 'reset' && (
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="designly-input"
            />
          </Field>
        )}

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-gold-600 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-500 disabled:opacity-50"
        >
          {busy ? 'Working…' : c.cta}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-cream-300/50">
        {c.alt}{' '}
        <Link to={c.altTo} className="text-gold-300 hover:text-gold-200">
          {mode === 'reset' ? 'sign in' : mode === 'login' ? 'Sign up' : 'Sign in'}
        </Link>
      </p>
      {mode === 'login' && (
        <p className="mt-3 text-center text-xs text-cream-300/35">
          <Link to="/reset" className="hover:text-cream-300/60">
            Forgot your password?
          </Link>
        </p>
      )}
      <p className="sr-only">{lang}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-cream-300/60">{label}</span>
      {children}
    </label>
  );
}
