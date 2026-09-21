import { useMemo } from 'react';
import { Coins, Infinity as InfinityIcon, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CREDIT_PACKAGES, formatPrice, GENERATION_COSTS } from '@/lib/constants';

interface CreditsProps {
  onNavigate: (
    page: string,
    item?: { type: 'subscription' | 'credit_package'; itemId: string }
  ) => void;
}

export default function Credits({ onNavigate }: CreditsProps) {
  const { profile, isUnlimited } = useAuth();

  const availableCredits = profile?.credits ?? 0;
  const planName = profile?.plan_id || '—';
  const generationSummary = useMemo(
    () => GENERATION_COSTS.filter((item) => item.credits > 0).slice(0, 3),
    [],
  );

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

      <NordicHeader title="CREDITS — SYSTEM CREDITS" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Coins className="w-4 h-4" /> CREDIT COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Credit Overview</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Kredit-egyenleg, csomagok és generálási költségek egyetlen DESIGNLY System Credits felületen.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ForgedPanel>
              <Coins className="w-5 h-5 mb-3 text-[#D6B36A]/75" />
              <div className="text-xs text-[#EEE8DC]/60">Available Credits</div>
              <div className="font-serif text-4xl mt-2">{isUnlimited ? '∞' : availableCredits.toLocaleString('hu-HU')}</div>
            </ForgedPanel>

            <ForgedPanel>
              <TrendingUp className="w-5 h-5 mb-3 text-[#9CEEE5]/75" />
              <div className="text-xs text-[#EEE8DC]/60">Used This Month</div>
              <div className="font-serif text-4xl mt-2">—</div>
              <div className="text-[10px] text-[#EEE8DC]/35 mt-2">Részletes havi usage-log nincs jelenleg bekötve.</div>
            </ForgedPanel>

            <ForgedPanel>
              {isUnlimited ? <InfinityIcon className="w-5 h-5 mb-3 text-[#D6B36A]/75" /> : <Sparkles className="w-5 h-5 mb-3 text-[#D6B36A]/75" />}
              <div className="text-xs text-[#EEE8DC]/60">Plan</div>
              <div className="font-serif text-2xl mt-2 capitalize">{isUnlimited ? 'Unlimited / Owner' : planName}</div>
            </ForgedPanel>
          </div>
        </section>

        {isUnlimited ? (
          <section>
            <ForgedPanel className="p-8 lg:p-10 border-[#D6B36A]/25">
              <div className="flex items-center gap-3">
                <InfinityIcon className="w-8 h-8 text-[#D6B36A]" />
                <div>
                  <div className="text-[9px] uppercase tracking-[.25em] text-[#D6B36A]/70">OWNER ACCESS</div>
                  <h2 className="font-serif text-3xl mt-1">Unlimited Credits</h2>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Az owner hozzáférés korlátlan kreditjogosultságot használ. A generálási költségek információs módban továbbra is láthatók.
              </p>
            </ForgedPanel>
          </section>
        ) : (
          <section>
            <div className="mb-6">
              <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">CREDIT FORGE</div>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Buy Credits</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CREDIT_PACKAGES.map((pkg) => (
                <ForgedPanel key={pkg.id} className="flex flex-col">
                  <div className="text-3xl font-serif text-[#F5DFA3]">{pkg.credits.toLocaleString('hu-HU')}</div>
                  <div className="text-xs text-[#EEE8DC]/45 mt-1">credits</div>
                  <div className="text-lg text-[#EEE8DC] mt-5">{formatPrice(pkg.price)}</div>
                  <ForgedButton
                    variant="primary"
                    className="mt-6 w-full"
                    onClick={() => onNavigate('checkout', { type: 'credit_package', itemId: pkg.id })}
                  >
                    <Plus className="w-4 h-4" /> Buy Now
                  </ForgedButton>
                </ForgedPanel>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">USAGE HISTORY</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Usage History</h2>
          </div>

          <ForgedPanel>
            <div className="space-y-3 text-xs">
              {generationSummary.map((item) => (
                <div key={item.type} className="flex items-center justify-between gap-4 border-b border-[#263636]/70 pb-3 last:border-0 last:pb-0">
                  <span className="text-[#EEE8DC]/75">{item.label}</span>
                  <span className="text-[#D6B36A]">{item.credits} credits</span>
                </div>
              ))}
              <div className="pt-2 text-[10px] text-[#EEE8DC]/35">
                A tényleges terhelés a meglévő generálási és kredit-RPC folyamatokból történik.
              </div>
            </div>
          </ForgedPanel>
        </section>

        <ForgedPanel className="max-w-4xl">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">SYSTEM CREDIT BRIDGE</div>
              <div className="font-serif text-2xl mt-1">Credits → checkout → generation</div>
              <p className="mt-2 text-sm leading-7 text-[#EEE8DC]/45">
                A vásárlás a meglévő Checkout folyamatba kerül, a generálások pedig a jelenlegi kreditellenőrzést és levonást használják.
              </p>
            </div>
          </div>
        </ForgedPanel>
      </main>
    </div>
  );
}
