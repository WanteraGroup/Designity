import { useEffect, useState } from 'react';
import { CreditCard, Check, AlertCircle, Infinity as InfinityIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { PUBLIC_PLANS, CREDIT_PACKAGES, formatPrice } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface BillingPageProps {
  onNavigate: (page: string, item?: { type: 'subscription' | 'credit_package'; itemId: string }) => void;
}

export function BillingPage({ onNavigate }: BillingPageProps) {
  const { t } = useI18n();
  const { profile, isOwner } = useAuth();
  const [tab, setTab] = useState<'plans' | 'credits' | 'history'>('plans');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadHistory() {
      if (!profile) return;
      const { data } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setTransactions(data || []);
    }
    loadHistory();
  }, [profile]);

  const handleSubscribe = async (planId: string) => {
    setCheckoutError(null);
    onNavigate('checkout', { type: 'subscription', itemId: planId });
  };

  const handleBuyCredits = async () => {
    setCheckoutError(null);
    if (!selectedPackage) return;
    onNavigate('checkout', { type: 'credit_package', itemId: selectedPackage });
  };

  if (isOwner) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-cream-50">{t('nav.billing')}</h1>
        <div className="card-lux p-12 text-center border-gold-600/30">
          <InfinityIcon className="w-16 h-16 text-gold-400 mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold gold-text mb-2">{t('billing.ownerTitle')}</h2>
          <p className="text-sm text-cream-300/60 max-w-md mx-auto">
            {t('billing.ownerDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-cream-50">{t('nav.billing')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-600/40">
        {[
          { id: 'plans', label: t('billing.tabs.plans') },
          { id: 'credits', label: t('billing.tabs.credits') },
          { id: 'history', label: t('billing.tabs.history') },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => { setTab(tb.id as any); setCheckoutError(null); }}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === tb.id ? 'text-gold-200 border-gold-400' : 'text-cream-300/50 border-transparent hover:text-cream-200'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {checkoutError && (
        <div className="flex items-start gap-2 p-4 rounded-lg border border-gold-600/30 bg-gold-600/10 text-sm text-gold-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Plans tab */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PUBLIC_PLANS.map((plan) => {
            const isCurrent = profile?.plan_id === plan.id;
            return (
              <div key={plan.id} className={`card-lux p-6 flex flex-col ${plan.highlighted ? 'border-gold-600/40' : ''}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold-gradient text-xs font-semibold text-ink-950 whitespace-nowrap">
                    {t('plan.recommended')}
                  </div>
                )}
                <h3 className="text-lg font-display font-bold text-cream-50 mb-1">{plan.name}</h3>
                <div className="text-2xl font-display font-bold gold-text mb-1">{formatPrice(plan.priceMonthly)}</div>
                <div className="text-xs text-cream-300/40 mb-4">{t('plan.perMonth')}</div>
                <div className="text-sm text-gold-200 font-semibold mb-3">{plan.creditsMonthly} {t('plan.creditsMo')}</div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-cream-300/60 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent}
                  className={`w-full text-sm py-2.5 rounded-lg transition-all ${
                    isCurrent ? 'btn-ghost opacity-50 cursor-default' : plan.highlighted ? 'btn-gold' : 'btn-ghost'
                  }`}
                >
                  {isCurrent ? t('plan.currentPlan') : t('plan.subscribe')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Credits tab */}
      {tab === 'credits' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div key={pkg.id} className={`card-lux p-6 text-center flex flex-col ${selectedPackage === pkg.id ? 'border-gold-600/50' : ''}`}>
              <div className="text-3xl font-display font-bold gold-text mb-1">{pkg.credits.toLocaleString()}</div>
              <div className="text-xs text-cream-300/50 mb-4">{t('misc.credits')}</div>
              <div className="text-lg font-medium text-cream-100 mb-4">{formatPrice(pkg.price)}</div>
              <button
                onClick={() => { setSelectedPackage(pkg.id); handleBuyCredits(); }}
                className="btn-gold text-sm mt-auto"
              >
                <CreditCard className="w-4 h-4" />
                {t('credits.buyNow')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="card-lux overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-10 h-10 text-cream-400/30 mx-auto mb-3" />
              <p className="text-sm text-cream-300/50">{t('billing.noTransactions')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-600/40">
                  <th className="text-left py-3 px-5 text-cream-300/50 font-medium">{t('billing.colDescription')}</th>
                  <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('billing.colAmount')}</th>
                  <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('billing.colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-ink-700/30 last:border-0">
                    <td className="py-3 px-5 text-cream-100">{tx.description}</td>
                    <td className={`py-3 px-5 text-right font-medium ${tx.amount > 0 ? 'text-green-300' : 'text-gold-200'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                    <td className="py-3 px-5 text-right text-cream-300/40 text-xs">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
