import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Check, CreditCard, Infinity as InfinityIcon, Receipt, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { PUBLIC_PLANS, CREDIT_PACKAGES, formatPrice, getCustomCreditPrice } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface BillingProps {
  onNavigate: (
    page: string,
    item?: { type: 'subscription' | 'credit_package'; itemId: string }
  ) => void;
}

type BillingTab = 'plans' | 'payment' | 'history';

export default function Billing({ onNavigate }: BillingProps) {
  const { lang } = useI18n();
  const { profile, isOwner, isUnlimited } = useAuth();
  const [tab, setTab] = useState<BillingTab>('plans');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [plans, setPlans] = useState(PUBLIC_PLANS);
  const [packages, setPackages] = useState(CREDIT_PACKAGES);
  const [customCredits, setCustomCredits] = useState(100);

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

  useEffect(() => {
    Promise.all([
      supabase
        .from('plans')
        .select('id,name,price_monthly,credits_monthly,project_limit,features,is_public,sort_order')
        .eq('is_public', true)
        .order('sort_order'),
      supabase
        .from('credit_packages')
        .select('id,credits,price,label,sort_order')
        .order('sort_order'),
    ]).then(([planResult, packageResult]) => {
      if (planResult.data?.length) {
        setPlans(planResult.data.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          priceMonthly: plan.price_monthly,
          creditsMonthly: plan.credits_monthly,
          projectLimit: plan.project_limit,
          features: Array.isArray(plan.features) ? plan.features : [],
          highlighted: plan.id === 'pro',
        })));
      }
      if (packageResult.data?.length) setPackages(packageResult.data as any);
    });
  }, []);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === profile?.plan_id),
    [plans, profile?.plan_id],
  );

  const nextBilling = 'Nincs elérhető dátum';

  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95"
        aria-hidden="true"
      />

      <NordicHeader title="BILLING — BILLING HALL" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Receipt className="w-4 h-4" /> BILLING COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Billing Hall</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Előfizetés, kreditvásárlás és a meglévő tranzakciós előzmények egyetlen DESIGNLY pénzügyi munkafelületen.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-6">
            <ForgedPanel className="border-[#D6B36A]/25">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[.25em] text-[#D6B36A]/70">CURRENT PLAN</div>
                  <div className="font-serif text-3xl mt-2">{isUnlimited ? 'Unlimited / Owner' : currentPlan?.name || profile?.plan_id || '—'}</div>
                  {!isUnlimited && currentPlan && (
                    <div className="mt-2 text-sm text-[#EEE8DC]/45">
                      {formatPrice(currentPlan.priceMonthly, lang)} · {currentPlan.creditsMonthly} credit / hó
                    </div>
                  )}
                </div>
                {isUnlimited ? (
                  <InfinityIcon className="w-8 h-8 text-[#D6B36A]" />
                ) : (
                  <Sparkles className="w-8 h-8 text-[#D6B36A]/75" />
                )}
              </div>

              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#263636] bg-black/20 p-4">
                  <div className="text-[9px] uppercase tracking-[.18em] text-[#EEE8DC]/40">NEXT BILLING</div>
                  <div className="mt-2 text-sm text-[#EEE8DC]/75">{nextBilling}</div>
                </div>
                <div className="rounded-xl border border-[#263636] bg-black/20 p-4">
                  <div className="text-[9px] uppercase tracking-[.18em] text-[#EEE8DC]/40">CREDITS</div>
                  <div className="mt-2 text-sm text-[#EEE8DC]/75">{isUnlimited ? '∞' : (profile?.credits ?? 0).toLocaleString('hu-HU')}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <ForgedButton variant="secondary" onClick={() => setTab('plans')}>Change Plan</ForgedButton>
                <ForgedButton variant="secondary" onClick={() => setTab('history')}>View Invoices / History</ForgedButton>
              </div>
            </ForgedPanel>

            <ForgedPanel>
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-[#D6B36A]/80" />
                <div>
                  <div className="text-[9px] uppercase tracking-[.25em] text-[#D6B36A]/70">PAYMENT METHOD</div>
                  <div className="font-serif text-2xl mt-1">Checkout Provider</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#EEE8DC]/50">
                A jelenlegi Billing modul nem tárol vagy olvas ki kártyaszámot, ezért biztonsági okból nem jelenítek meg kitalált „1234” végződést.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ForgedButton variant="secondary" onClick={() => onNavigate('checkout', { type: 'subscription', itemId: currentPlan?.id || 'pro' })}>
                  Update Card / Checkout
                </ForgedButton>
                <ForgedButton variant="secondary" onClick={() => setTab('payment')}>
                  <CreditCard className="w-4 h-4" /> Payment Details
                </ForgedButton>
              </div>
            </ForgedPanel>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap gap-2 border-b border-[#263636]">
            {[
              ['plans', 'Plans'],
              ['payment', 'Credits & Payment'],
              ['history', 'Usage / Invoices'],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                onClick={() => setTab(id as BillingTab)}
                className={`px-4 py-3 text-xs uppercase tracking-[.16em] border-b-2 -mb-px transition-all ${tab === id ? 'text-[#F5DFA3] border-[#D6B36A]' : 'text-[#EEE8DC]/40 border-transparent hover:text-[#EEE8DC]/75'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'plans' && (
            <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const isCurrent = profile?.plan_id === plan.id;
                return (
                  <ForgedPanel key={plan.id} className={plan.highlighted ? 'border-[#D6B36A]/40' : ''}>
                    {plan.highlighted && <div className="chip mb-4 w-fit border-[#D6B36A]/30 bg-[#D6B36A]/10 text-[#F5DFA3]">PRO</div>}
                    <div className="font-serif text-2xl">{plan.name}</div>
                    <div className="text-3xl mt-3 text-[#F5DFA3]">{formatPrice(plan.priceMonthly, lang)}</div>
                    <div className="text-xs text-[#EEE8DC]/40 mt-1">/ hó</div>
                    <div className="mt-4 text-sm text-[#D6B36A]">{plan.creditsMonthly} credits / hó</div>
                    <div className="mt-4 space-y-2 min-h-28">
                      {(plan.features || []).map((feature: string) => (
                        <div key={feature} className="flex items-start gap-2 text-xs text-[#EEE8DC]/55">
                          <Check className="w-3.5 h-3.5 text-[#D6B36A] shrink-0 mt-0.5" /> {feature}
                        </div>
                      ))}
                    </div>
                    <ForgedButton
                      variant={isCurrent ? 'secondary' : 'primary'}
                      className="mt-5 w-full"
                      disabled={isCurrent}
                      onClick={() => onNavigate('checkout', { type: 'subscription', itemId: plan.id })}
                    >
                      {isCurrent ? 'Current Plan' : 'Change Plan'}
                    </ForgedButton>
                  </ForgedPanel>
                );
              })}
            </div>
          )}

          {tab === 'payment' && (
            <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ForgedPanel>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-[#D6B36A]/80" />
                  <div>
                    <div className="text-[9px] uppercase tracking-[.2em] text-[#D6B36A]/70">CREDIT FORGE</div>
                    <div className="font-serif text-2xl mt-1">Buy Credits</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packages.map((pkg: any) => (
                    <div key={pkg.id} className="rounded-xl border border-[#263636] bg-black/20 p-4">
                      <div className="text-2xl font-serif text-[#F5DFA3]">{pkg.credits.toLocaleString('hu-HU')}</div>
                      <div className="text-xs text-[#EEE8DC]/40 mt-1">credits</div>
                      <div className="text-lg mt-3">{formatPrice(pkg.price, lang)}</div>
                      <ForgedButton variant="primary" className="mt-4 w-full" onClick={() => onNavigate('checkout', { type: 'credit_package', itemId: pkg.id })}>
                        Buy
                      </ForgedButton>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-[#D6B36A]/15 p-4">
                  <div className="text-xs text-[#EEE8DC]/55">Egyedi kreditcsomag</div>
                  <div className="mt-3 flex items-center gap-3">
                    <input type="number" min={1} max={10000} value={customCredits} onChange={(e) => setCustomCredits(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))} className="input-lux flex-1" />
                    <ForgedButton variant="secondary" onClick={() => onNavigate('checkout', { type: 'credit_package', itemId: `custom_${customCredits}` })}>
                      {formatPrice(getCustomCreditPrice(customCredits), lang)}
                    </ForgedButton>
                  </div>
                </div>
              </ForgedPanel>

              <ForgedPanel>
                <div className="text-[9px] uppercase tracking-[.2em] text-[#D6B36A]/70">PAYMENT DETAILS</div>
                <div className="mt-4 space-y-3 text-sm text-[#EEE8DC]/55">
                  <div className="rounded-xl border border-[#263636] bg-black/20 p-4">A tényleges bankkártya-adatokat a checkout szolgáltató kezeli.</div>
                  <div className="rounded-xl border border-[#263636] bg-black/20 p-4">A DESIGNLY alkalmazásban kártyaszámot nem tárolunk.</div>
                  <div className="flex items-center gap-2 text-emerald-200/80"><AlertCircle className="w-4 h-4" /> Payment method details are not exposed by the current profile schema.</div>
                </div>
              </ForgedPanel>
            </div>
          )}

          {tab === 'history' && (
            <ForgedPanel className="mt-6 overflow-hidden p-0">
              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDays className="w-10 h-10 text-[#EEE8DC]/20 mx-auto mb-3" />
                  <div className="font-serif text-2xl">No transaction history</div>
                  <p className="mt-2 text-sm text-[#EEE8DC]/40">A meglévő credit transaction logban jelennek meg a terhelések és jóváírások.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#263636]">
                        <th className="text-left py-4 px-5 text-[#EEE8DC]/45 font-normal">Description</th>
                        <th className="text-right py-4 px-5 text-[#EEE8DC]/45 font-normal">Amount</th>
                        <th className="text-right py-4 px-5 text-[#EEE8DC]/45 font-normal">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-[#263636]/60 last:border-0">
                          <td className="py-4 px-5 text-[#EEE8DC]/75">{tx.description}</td>
                          <td className={`py-4 px-5 text-right ${tx.amount > 0 ? 'text-emerald-300' : 'text-[#F5DFA3]'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </td>
                          <td className="py-4 px-5 text-right text-xs text-[#EEE8DC]/35">{new Date(tx.created_at).toLocaleDateString(lang === 'hu' ? 'hu-HU' : 'en-US')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ForgedPanel>
          )}
        </section>
      </main>
    </div>
  );
}
