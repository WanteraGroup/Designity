import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { LANGUAGES } from '@/lib/constants';

/**
 * Profile and preferences. The settings row is `profiles` itself, so this
 * updates the same record the shell reads its credit balance from.
 */
export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  const { lang, setLang } = useI18n();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    setBusy(false);
    if (err) return setError(err.message);
    await refreshProfile();
    setSaved(true);
  }

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-cream-100">Settings</h1>
      </header>

      <form onSubmit={save} className="designly-card space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs text-cream-300/60">Name</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="designly-input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-cream-300/60">Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="designly-input" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-cream-300/60">Email</span>
          <input value={profile?.email ?? ''} readOnly className="designly-input opacity-60" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-cream-300/60">Interface language</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="designly-input">
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-ink-900">
                {l.name}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className="designly-btn">
            {busy ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="text-xs text-emerald-300">Saved.</span>}
        </div>

        <hr className="designly-rule" />

        <dl className="grid grid-cols-2 gap-3 text-xs">
          <dt className="text-cream-300/50">Plan</dt>
          <dd className="text-cream-200">{profile?.plan_id ?? 'free'}</dd>
          <dt className="text-cream-300/50">Credits</dt>
          <dd className="text-cream-200">
            {profile?.unlimited_access ? 'Unlimited' : (profile?.credits ?? 0)}
          </dd>
          <dt className="text-cream-300/50">Role</dt>
          <dd className="text-cream-200">{profile?.role ?? 'user'}</dd>
        </dl>
      </form>
    </div>
  );
}
