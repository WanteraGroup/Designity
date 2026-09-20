import { CreditCard, X, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CREDIT_PACKAGES, formatPrice, getCustomCreditPrice } from '@/lib/constants';

interface CreditPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (
    page: string,
    item?: { type: 'subscription' | 'credit_package'; itemId: string }
  ) => void;
  currentCredits?: number | null;
  reason?: string;
}

export function CreditPurchaseModal({
  open,
  onClose,
  onNavigate,
  currentCredits,
  reason = 'A művelethez további kredit szükséges.',
}: CreditPurchaseModalProps) {
  const { lang } = useI18n();
  const [minCredits, setMinCredits] = (() => {
    const React = require('react') as typeof import('react');
    return React.useState(100);
  })();

  if (!open) return null;

  const goCheckout = (itemId: string) => {
    onClose();
    onNavigate('checkout', { type: 'credit_package', itemId });
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div role="dialog" aria-modal="true" aria-labelledby="credit-modal-title" className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gold-500/30 bg-ink-950 shadow-[0_30px_100px_rgba(0,0,0,.6)]">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full border border-ink-600/60 bg-ink-900/80 flex items-center justify-center text-cream-300 hover:text-cream-50 hover:border-gold-500/30" aria-label="Bezárás">
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center pr-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 mb-4">
              <CreditCard className="w-6 h-6 text-gold-300" />
            </div>
            <div className="text-[10px] uppercase tracking-[.24em] text-gold-300/80">DESIGNLY CREDIT CENTER</div>
            <h2 id="credit-modal-title" className="mt-2 text-2xl sm:text-3xl font-display font-bold text-cream-50">Kredit vásárlás</h2>
            <p className="mt-2 text-sm text-cream-300/60">{reason}</p>
            <div className="mt-3 text-xs text-cream-400/50">Jelenlegi egyenleg: {currentCredits == null ? '—' : currentCredits}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-7">
            {CREDIT_PACKAGES.map((pkg) => (
              <button key={pkg.id} type="button" onClick={() => goCheckout(pkg.id)} className="rounded-xl border border-gold-600/15 bg-ink-900/70 p-4 text-left hover:border-gold-500/45 hover:bg-gold-500/5 transition-all">
                <div className="text-xl font-display font-bold gold-text">{pkg.credits.toLocaleString('hu-HU')}</div>
                <div className="text-[10px] uppercase tracking-wider text-cream-400/50 mt-1">kredit</div>
                <div className="text-sm text-cream-100 mt-3">{formatPrice(pkg.price, lang)}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-gold-600/15 bg-ink-900/60 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-cream-100">Egyedi kreditmennyiség</div>
                <div className="text-xs text-cream-400/55 mt-1">Válassz pontosan 1–10 000 kredit között.</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  step={1}
                  value={minCredits}
                  onChange={(e) => setMinCredits(Math.max(1, Math.min(10000, Math.floor(Number(e.target.value) || 1))))}
                  className="input-lux w-36"
                  aria-label="Egyedi kreditmennyiség"
                />
                <button type="button" onClick={() => goCheckout('custom_' + minCredits)} className="btn-gold text-sm whitespace-nowrap">
                  <Sparkles className="w-4 h-4" />
                  Vásárlás · {formatPrice(getCustomCreditPrice(minCredits), lang)}
                </button>
              </div>
            </div>
          </div>

          <button type="button" onClick={onClose} className="btn-ghost w-full mt-5">Vissza</button>
        </div>
      </div>
    </div>
  );
}
