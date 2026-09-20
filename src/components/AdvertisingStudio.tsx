import { useState, useEffect } from 'react';
import { Megaphone, Sparkles, AlertCircle, Check, RefreshCw, Layout, Eye, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { generateDesign } from '@/lib/ai';
import { AD_FORMATS, DESIGN_STYLES, getCreditsForType } from '@/lib/constants';
import { CelticEmblem } from './CelticEmblem';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import type { BrandKit } from '@/types';

interface AdvertisingStudioProps {
  onNavigate: (page: string) => void;
}

export function AdvertisingStudio({ onNavigate }: AdvertisingStudioProps) {
  const { t } = useI18n();
  const { profile, isOwner, refreshProfile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('premium');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brands, setBrands] = useState<BrandKit[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [providerNotConfigured, setProviderNotConfigured] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    async function loadBrands() {
      if (!profile) return;
      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setBrands((data as BrandKit[]) || []);
    }
    loadBrands();
  }, [profile]);

  const cost = 3; // advertisement/poster = 3 credits
  const hasEnoughCredits = isOwner || (profile?.credits ?? 0) >= cost;

  const handleGenerate = async () => {
    if (!profile || !selectedFormat) return;
    setError(null);
    setProviderNotConfigured(false);

    if (!isOwner && (profile.credits ?? 0) < cost) {
      setError(t('gen.insufficientCredits'));
      return;
    }

    setGenerating(true);
    setGenStep(0);

    const stepLabels = [
      t('gen.analyzing'),
      t('gen.direction'),
      t('gen.layout'),
      t('gen.brand'),
      t('gen.optimizing'),
    ];

    for (let i = 0; i < stepLabels.length; i++) {
      setGenStep(i);
      await new Promise((r) => setTimeout(r, 800));
    }

    const formatInfo = AD_FORMATS.find((f) => f.id === selectedFormat);

    const genResult = await generateDesign({
      type: 'advertisement',
      brief,
      brandKitId: selectedBrand,
      style: selectedStyle,
      format: formatInfo?.label || selectedFormat,
    });

    if (!genResult.success) {
      if (genResult.providerNotConfigured) {
        setProviderNotConfigured(true);
        setError(genResult.message || t('ad.providerNotConfigured'));
      } else if (genResult.errorCode === 'INSUFFICIENT_CREDITS') {
        setError(t('gen.insufficientCredits'));
      } else {
        setError(genResult.message || t('gen.failed'));
      }
      setGenerating(false);
      return;
    }

    await refreshProfile();
    setResult(genResult.result || null);
    setGenStep(5);
    await new Promise((r) => setTimeout(r, 600));
    setGenerating(false);
    setStep(5);
  };

  const handleVariation = async (command: string) => {
    if (!brief) return;
    if (!isOwner && (profile?.credits ?? 0) < cost) {
      setError(t('gen.insufficientCredits'));
      setShowCreditModal(true);
      return;
    }
    setError(null);
    setGenerating(true);
    setGenStep(0);

    const genResult = await generateDesign({
      type: 'advertisement',
      brief: `${brief} — ${t(`var.${command}`)}`,
      brandKitId: selectedBrand,
      style: selectedStyle,
    });

    if (!genResult.success) {
      setError(genResult.message || t('gen.failed'));
      setGenerating(false);
      return;
    }

    await refreshProfile();
    setResult(genResult.result || null);
    setGenerating(false);
  };

  if (generating) {
    return <GenerationOverlay step={genStep} t={t} />;
  }

  if (step === 5 && result) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-cream-50 mb-2">{t('gen.success')}</h2>
          <p className="text-sm text-cream-300/60 mb-8">{t('ad.successDesc')}</p>
        </div>

        {/* Preview */}
        <div className="card-lux p-8">
          <div className="aspect-[4/5] sm:aspect-video bg-gradient-to-br from-ink-800 to-ink-900 rounded-lg border border-gold-600/20 flex flex-col items-center justify-center p-8">
            <Megaphone className="w-16 h-16 text-gold-400/40 mb-4" />
            <h3 className="text-xl font-display font-bold gold-text mb-2">{t('ad.yourDesign')}</h3>
            <p className="text-sm text-cream-300/50 text-center max-w-md">
              {(result?.content as string)?.slice(0, 200) || t('ad.previewReady')}
            </p>
          </div>
        </div>

        {/* Variations */}
        <div className="card-lux p-6">
          <h3 className="text-sm font-display font-semibold text-cream-100 mb-4">{t('ad.variations')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['more_premium', 'more_minimal', 'more_professional', 'more_elegant', 'more_bold'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleVariation(cmd)}
                className="px-3 py-2 rounded-lg text-xs text-cream-300/70 border border-ink-600/40 hover:border-gold-600/40 hover:text-gold-200 hover:bg-gold-600/5 transition-all"
              >
                {t(`var.${cmd}`)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
            {['regenerate', 'change_headline', 'change_colors', 'change_image', 'change_layout'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleVariation(cmd)}
                className="px-3 py-2 rounded-lg text-xs text-cream-300/70 border border-ink-600/40 hover:border-gold-600/40 hover:text-gold-200 hover:bg-gold-600/5 transition-all"
              >
                {t(`var.${cmd}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => onNavigate('editor')} className="btn-gold text-sm">
            <Eye className="w-4 h-4" />
            {t('common.open')}
          </button>
          <button onClick={() => onNavigate('credits')} className="btn-ghost text-sm">
            <Download className="w-4 h-4" />
            {t('editor.export')}
          </button>
          <button onClick={() => { setStep(1); setSelectedFormat(null); setBrief(''); setResult(null); }} className="btn-ghost text-sm">
            <RefreshCw className="w-4 h-4" />
            {t('common.createAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              step >= s ? 'bg-gold-gradient text-ink-950' : 'bg-ink-700 text-cream-400/40'
            }`}>{s}</div>
            {s < 4 && <div className={`w-12 h-px ${step > s ? 'bg-gold-500' : 'bg-ink-600'}`} />}
          </div>
        ))}
      </div>

      {providerNotConfigured && (
        <div className="card-lux p-6 border-amber-600/30 bg-amber-600/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-200 mb-1">{t('ad.providerNotConfigured')}</h3>
              <p className="text-xs text-amber-300/70">{t('ad.providerNotConfiguredDesc')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Choose format */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-display font-bold text-cream-50 text-center mb-2">{t('ad.chooseFormat')}</h2>
          <p className="text-sm text-cream-300/50 text-center mb-8">{t('ad.chooseFormatDesc')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {AD_FORMATS.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => { setSelectedFormat(fmt.id); setStep(2); }}
                className={`card-lux p-4 text-center group hover:scale-105 transition-all duration-300 ${
                  selectedFormat === fmt.id ? 'border-gold-600/50 bg-gold-600/5' : ''
                }`}
              >
                <div className={`text-xs font-medium text-cream-100 mb-1 ${fmt.type === 'print' ? 'text-gold-200' : 'text-cream-200'}`}>
                  {fmt.type === 'print' ? t('ad.print') : t('ad.digital')}
                </div>
                <div className="text-sm font-display font-semibold text-cream-50">{fmt.label}</div>
                <div className="text-[10px] text-cream-300/40 mt-1">{fmt.width} × {fmt.height}px</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Brief */}
      {step === 2 && selectedFormat && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-display font-bold text-cream-50 text-center mb-2">{t('ad.enterBrief')}</h2>
          <p className="text-sm text-cream-300/50 text-center mb-8">{t('ad.enterBriefDesc')}</p>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={6}
            className="input-lux resize-none"
            placeholder={t('ad.briefPlaceholder')}
          />
          <div className="flex justify-between items-center mt-6">
            <button onClick={() => setStep(1)} className="btn-ghost text-sm">{t('common.back')}</button>
            <button onClick={() => setStep(3)} disabled={brief.trim().length < 5} className="btn-gold text-sm disabled:opacity-40">
              {t('common.continue')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Style */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-display font-bold text-cream-50 text-center mb-2">{t('ad.chooseStyle')}</h2>
          <p className="text-sm text-cream-300/50 text-center mb-8">{t('ad.chooseStyleDesc')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {DESIGN_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => { setSelectedStyle(style); setStep(4); }}
                className={`card-lux p-3 text-center text-xs font-medium capitalize transition-all hover:scale-105 ${
                  selectedStyle === style ? 'border-gold-600/50 bg-gold-600/5 text-gold-200' : 'text-cream-200'
                }`}
              >
                {t(`style.${style}`)}
              </button>
            ))}
          </div>
          <div className="flex justify-start mt-6">
            <button onClick={() => setStep(2)} className="btn-ghost text-sm">{t('common.back')}</button>
          </div>
        </div>
      )}

      {/* Step 4: Review and generate */}
      {step === 4 && (
        <div className="animate-fade-in space-y-6">
          <h2 className="text-xl font-display font-bold text-cream-50 text-center mb-2">{t('cw.reviewGenerate')}</h2>
          <div className="card-lux p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-ink-600/40">
              <span className="text-sm text-cream-300/60">{t('ad.format')}</span>
              <span className="text-sm font-medium text-gold-200">{AD_FORMATS.find((f) => f.id === selectedFormat)?.label}</span>
            </div>
            <div className="pb-3 border-b border-ink-600/40">
              <span className="text-sm text-cream-300/60 block mb-1">{t('cw.brief')}</span>
              <span className="text-sm text-cream-100">{brief}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-ink-600/40">
              <span className="text-sm text-cream-300/60">{t('ad.style')}</span>
              <span className="text-sm font-medium text-gold-200 capitalize">{t(`style.${selectedStyle}`)}</span>
            </div>
            {brands.length > 0 && (
              <div className="pb-3 border-b border-ink-600/40">
                <span className="text-sm text-cream-300/60 block mb-2">{t('cw.brandKit')}</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedBrand(null)} className={`chip transition-all ${!selectedBrand ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}>
                    {t('cw.brandKitNone')}
                  </button>
                  {brands.map((b) => (
                    <button key={b.id} onClick={() => setSelectedBrand(b.id)} className={`chip transition-all ${selectedBrand === b.id ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}>
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-cream-300/60 block">{t('cw.creditCost')}</span>
                <span className="text-lg font-display font-bold gold-text">{isOwner ? '∞' : cost}</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-cream-300/60 block">{t('cw.currentBalance')}</span>
                <span className="text-lg font-display font-bold text-cream-50">{isOwner ? '∞' : profile?.credits ?? 0}</span>
              </div>
            </div>
            {!hasEnoughCredits && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t('gen.insufficientCredits')}</span>
              </div>
            )}
          </div>
          {error && <div className="text-sm text-red-300 text-center">{error}</div>}
          <div className="flex justify-between items-center">
            <button onClick={() => setStep(3)} className="btn-ghost text-sm">{t('common.back')}</button>
            <button onClick={handleGenerate} disabled={!hasEnoughCredits} className="btn-gold text-sm disabled:opacity-40">
              <Sparkles className="w-4 h-4" />
              {t('common.generate')}
            </button>
          </div>
        </div>
      )}
      </div>
      <CreditPurchaseModal open={showCreditModal} onClose={() => setShowCreditModal(false)} onNavigate={onNavigate} currentCredits={profile?.credits} reason="Vásárolj kreditet közvetlenül az Ad Studio-ból, visszalépés nélkül." />
    </>
  );
}

function GenerationOverlay({ step, t }: { step: number; t: (k: any) => string }) {
  const steps = [
    t('gen.analyzing'),
    t('gen.direction'),
    t('gen.layout'),
    t('gen.brand'),
    t('gen.optimizing'),
  ];
  const done = step >= 5;

  return (
    <div className="fixed inset-0 z-[100] bg-ink-950/95 backdrop-blur-xl flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative flex flex-col items-center">
        <CelticEmblem size={200} animate showD />
        <div className="font-display text-2xl font-bold text-cream-50 tracking-wide mt-8 mb-2">DESIGNLY STUDIO</div>
        <div className="text-sm text-gold-200 mb-8">{done ? t('gen.reveal') : t('gen.creating')}</div>
        <div className="w-64 space-y-2">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-500 ${
              i < step ? 'text-gold-300' : i === step ? 'text-cream-100' : 'text-cream-400/30'
            }`}>
              <div className={`w-4 h-4 rounded-full border transition-all ${
                i < step ? 'border-gold-400 bg-gold-400' : i === step ? 'border-gold-400 animate-pulse' : 'border-ink-600'
              }`}>
                {i < step && <Check className="w-3 h-3 text-ink-950 mx-auto" />}
              </div>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
