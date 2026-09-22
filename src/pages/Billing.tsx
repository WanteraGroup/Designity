import { useAsync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PUBLIC_PLANS, CREDIT_PACKAGES, formatPrice } from '@/lib/constants';
import type { Payment } from '@/types';

/**
 * Plan and payment history.
 *
 * The upgrade buttons stay disabled until a payment provider is configured.
 * `system_settings.payment_provider_configured` is the switch: a button that
 * opens a checkout with no provider behind it is worse than a dead button,
 * because it reads as a failed payment.
 */
export default function Billing() {
  const { profile } = useAuth();
  const lang = 'hu';

  const { data, loading, error } = useAsync(async () => {
    const [paymentsRes, settingsRes] = await Promise.all([
      supabase
        .from('payments')
        .select('id, amount, currency, type, status, provider, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'payment_provider_configured')
        .maybeSingle(),
    ]);

    if (paymentsRes.error) throw paymentsRes.error;

    return {
      payments: (paymentsRes.data ?? []) as Payment[],
      providerLive: settingsRes.data?.value === true,
    };
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-cream-100">Billing</h1>
        <p className="mt-2 text-sm text-cream-300/60">
          Current plan: <span className="text-gold-300">{profile?.plan_id ?? 'free'}</span>
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-cream-100">Plans</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PUBLIC_PLANS.map((plan) => {
            const current = plan.id === profile?.plan_id;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 ${
                  current ? 'border-gold-600/60 bg-gold-600/[0.07]' : 'border-gold-700/20 bg-ink-850/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-cream-100">{plan.name}</h3>
                  {current && (
                    <span className="rounded bg-gold-600/20 px-2 py-0.5 text-[11px] text-gold-200">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-3 font-display text-2xl text-gold-300">
                  {formatPrice(plan.priceMonthly, lang)}
                  <span className="ml-1 text-xs text-cream-300/50">/ hó</span>
                </p>
                <ul className="mt-5 space-y-2 text-xs text-cream-300/65">
                  {plan.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={!data?.providerLive || current}
                  className="designly-btn mt-6 w-full"
                >
                  {current ? 'Active' : data?.providerLive ? 'Choose' : 'Coming soon'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-cream-100">Credit packs</h2>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-4 text-center"
            >
              <p className="font-mono text-sm text-gold-300">{pkg.credits}</p>
              <p className="mt-2 text-xs text-cream-300/50">{formatPrice(pkg.price, lang)}</p>
            </div>
          ))}
        </div>
        {!data?.providerLive && (
          <p className="mt-4 text-xs text-cream-300/40">
            Top-ups open once a payment provider is connected.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-cream-100">Payment history</h2>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading && <div className="h-20 animate-pulse rounded-xl bg-ink-850/60" />}

        {!loading && data?.payments.length === 0 && (
          <div className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-8 text-center">
            <p className="text-sm text-cream-300/60">No payments yet.</p>
          </div>
        )}

        {!!data?.payments.length && (
          <div className="overflow-hidden rounded-xl border border-gold-700/20">
            <table className="w-full text-sm">
              <thead className="bg-ink-900/70 text-xs text-cream-300/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-t border-gold-700/10">
                    <td className="px-4 py-3 text-cream-300/55">
                      {new Date(p.created_at).toLocaleDateString('hu-HU')}
                    </td>
                    <td className="px-4 py-3 text-cream-200">{p.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-cream-300/60">{p.status}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gold-300">
                      {formatPrice(p.amount, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
