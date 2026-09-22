import { useAsync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

interface Row {
  id: string;
  created_at: string;
  amount: number;
  type: string;
  description: string;
  balance_after: number;
}

/**
 * The credit ledger. Reads the user's own transactions through RLS — the table
 * has no write policy at all, so this view can only ever be a read.
 */
export default function Credits() {
  const { data, loading, error } = useAsync(async () => {
    const { data: rows, error: e } = await supabase
      .from('credit_transactions')
      .select('id, created_at, amount, type, description, balance_after')
      .order('created_at', { ascending: false })
      .limit(100);
    if (e) throw e;
    return (rows ?? []) as Row[];
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-cream-100">Credits</h1>
        <p className="mt-2 text-sm text-cream-300/60">Every charge and top-up, newest first.</p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && <div className="h-24 animate-pulse rounded-xl bg-ink-850/60" />}

      {!loading && data?.length === 0 && (
        <div className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-12 text-center">
          <p className="text-sm text-cream-300/60">No credit activity yet.</p>
        </div>
      )}

      {!!data?.length && (
        <div className="overflow-hidden rounded-xl border border-gold-700/20">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/70 text-xs text-cream-300/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Change</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-gold-700/10">
                  <td className="px-4 py-3 text-cream-300/55">
                    {new Date(r.created_at).toLocaleString('hu-HU', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-cream-200">{r.description || r.type}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-xs ${
                      r.amount < 0 ? 'text-cream-300/60' : 'text-emerald-300'
                    }`}
                  >
                    {r.amount > 0 ? '+' : ''}
                    {r.amount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-gold-300">
                    {r.balance_after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
