import { useState } from 'react';
import { useAsync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

interface SettingsRow {
  key: string;
  value: unknown;
  description: string;
}

/**
 * Control hall. Three surfaces, all of which the RLS policies already permit
 * for an owner or admin: the user list, the credit grant, and the settings the
 * agents read server-side.
 */
export default function Admin() {
  const [tab, setTab] = useState<'users' | 'settings'>('users');

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-cream-100">Control Hall</h1>
      </header>

      <div className="mb-6 flex gap-2">
        {(['users', 'settings'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-xs capitalize transition ${
              tab === t
                ? 'border-gold-600/60 bg-gold-600/15 text-gold-200'
                : 'border-gold-700/25 text-cream-300/60 hover:text-cream-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UserTable /> : <SettingsTable />}
    </div>
  );
}

function UserTable() {
  const [busy, setBusy] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const { data: rows, error: e } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (e) throw e;
    return (rows ?? []) as UserProfile[];
  }, []);

  async function grant(userId: string, amount: number) {
    setBusy(userId);
    // add_credits is SECURITY DEFINER and writes the ledger entry itself, so
    // the balance and the audit log cannot drift apart.
    await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_type: 'admin_grant',
      p_description: `Admin grant: ${amount} credits`,
    });
    await reload();
    setBusy(null);
  }

  async function toggleUnlimited(userId: string, enabled: boolean) {
    setBusy(userId);
    await supabase.rpc('grant_unlimited', { p_user_id: userId, p_enabled: enabled });
    await reload();
    setBusy(null);
  }

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-ink-850/60" />;

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gold-700/20">
      <table className="w-full text-sm">
        <thead className="bg-ink-900/70 text-xs text-cream-300/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">User</th>
            <th className="px-4 py-3 text-left font-medium">Plan</th>
            <th className="px-4 py-3 text-right font-medium">Credits</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((u) => (
            <tr key={u.id} className="border-t border-gold-700/10">
              <td className="px-4 py-3">
                <span className="text-cream-100">{u.full_name || '—'}</span>
                <span className="ml-2 text-xs text-cream-300/45">{u.email}</span>
                {u.role !== 'user' && (
                  <span className="ml-2 rounded bg-gold-600/15 px-1.5 py-0.5 text-[10px] text-gold-200">
                    {u.role}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-cream-300/60">{u.plan_id}</td>
              <td className="px-4 py-3 text-right font-mono text-xs text-gold-300">
                {u.unlimited_access ? '∞' : u.credits}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy === u.id}
                    onClick={() => grant(u.id, 100)}
                    className="rounded border border-gold-700/30 px-2.5 py-1 text-xs text-cream-300/70 transition hover:border-gold-600/50 hover:text-cream-100"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    disabled={busy === u.id}
                    onClick={() => toggleUnlimited(u.id, !u.unlimited_access)}
                    className="rounded border border-gold-700/30 px-2.5 py-1 text-xs text-cream-300/70 transition hover:border-gold-600/50 hover:text-cream-100"
                  >
                    {u.unlimited_access ? 'Lock' : 'Unlock'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTable() {
  const { data, loading, error } = useAsync(async () => {
    const { data: rows, error: e } = await supabase
      .from('system_settings')
      .select('key, value, description')
      .order('key');
    if (e) throw e;
    return (rows ?? []) as SettingsRow[];
  }, []);

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-ink-850/60" />;

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data?.map((s) => (
        <div key={s.key} className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-xs text-gold-300">{s.key}</span>
            <span className="text-xs text-cream-300/45">{s.description}</span>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-ink-900 p-3 font-mono text-xs text-cream-300/70">
            {JSON.stringify(s.value, null, 2)}
          </pre>
        </div>
      ))}
      <p className="text-xs text-cream-300/40">
        Edit these with a row update; the agents read them server-side on every call.
      </p>
    </div>
  );
}
