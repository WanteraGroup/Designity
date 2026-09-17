import { Coins, Plus, Sparkles, Infinity as InfinityIcon, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { CREDIT_PACKAGES, formatPrice, GENERATION_COSTS } from '@/lib/constants';

interface CreditsPageProps {
  onNavigate: (page: string) => void;
}

export function CreditsPage({ onNavigate }: CreditsPageProps) {
  const { t } = useI18n();
  const { profile, isOwner } = useAuth();

  if (isOwner) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-cream-50">{t('nav.credits')}</h1>
        <div className="card-lux p-12 text-center border-gold-600/30">
          <InfinityIcon className="w-16 h-16 text-gold-400 mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold gold-text mb-2">∞ {t('dash.unlimited')}</h2>
          <p className="text-sm text-cream-300/60 max-w-md mx-auto">
            {t('dash.ownerDesc')}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-display font-semibold text-cream-100 mb-4">{t('credits.genCosts')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {GENERATION_COSTS.map((c) => (
              <div key={c.type} className="card-lux p-4 text-center">
                <div className="text-2xl font-display font-bold gold-text">{c.credits}</div>
                <div className="text-xs text-cream-300/50 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-cream-50">{t('nav.credits')}</h1>
        <p className="text-sm text-cream-300/50 mt-1">{t('credits.buyCredits')}</p>
      </div>

      {/* Balance card */}
      <div className="card-lux p-6 flex items-center gap-6">
        <div className="w-14 h-14 rounded-xl bg-gold-600/15 border border-gold-600/20 flex items-center justify-center">
          <Coins className="w-7 h-7 text-gold-400" />
        </div>
        <div>
          <div className="text-xs text-cream-300/50 uppercase tracking-wider">{t('credits.currentBalance')}</div>
          <div className="text-3xl font-display font-bold gold-text">{profile?.credits ?? 0}</div>
        </div>
        <div className="ml-auto">
          <div className="text-xs text-cream-300/50 uppercase tracking-wider mb-1">{t('dash.currentPlan')}</div>
          <div className="text-sm font-medium text-cream-100 capitalize">{profile?.plan_id}</div>
        </div>
      </div>

      {/* Buy credits */}
      <div>
        <h2 className="text-lg font-display font-semibold text-cream-100 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-gold-400" />
          {t('credits.buyCredits')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div key={pkg.id} className="card-lux p-6 text-center flex flex-col">
              <div className="text-3xl font-display font-bold gold-text mb-1">{pkg.credits.toLocaleString()}</div>
              <div className="text-xs text-cream-300/50 mb-4">{t('misc.credits')}</div>
              <div className="text-lg font-medium text-cream-100 mb-4">{formatPrice(pkg.price)}</div>
              <button
                onClick={() => onNavigate('billing')}
                className="btn-gold text-sm mt-auto"
              >
                <TrendingUp className="w-4 h-4" />
                {t('credits.buyNow')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generation costs */}
      <div>
        <h2 className="text-lg font-display font-semibold text-cream-100 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold-400" />
          {t('credits.genCosts')}
        </h2>
        <div className="card-lux overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-600/40">
                <th className="text-left py-3 px-5 text-cream-300/50 font-medium">{t('credits.designType')}</th>
                <th className="text-right py-3 px-5 text-cream-300/50 font-medium">{t('credits.creditsCol')}</th>
              </tr>
            </thead>
            <tbody>
              {GENERATION_COSTS.map((c) => (
                <tr key={c.type} className="border-b border-ink-700/30 last:border-0">
                  <td className="py-3 px-5 text-cream-100">{c.label}</td>
                  <td className="py-3 px-5 text-right font-medium text-gold-200">{c.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
