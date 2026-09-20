import { useState, useEffect } from 'react';
import { Layers, Sparkles, AlertCircle, Check, Download, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { generateDesign } from '@/lib/ai';
import { CAMPAIGN_FORMATS, DESIGN_STYLES } from '@/lib/constants';
import { CelticEmblem } from './CelticEmblem';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import type { BrandKit } from '@/types';

interface CampaignGeneratorProps {
  onNavigate: (page: string) => void;
}

export function CampaignGenerator({ onNavigate }: CampaignGeneratorProps) {
  const { t } = useI18n();
  const { profile, isOwner, refreshProfile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [brief, setBrief] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('premium');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['poster', 'flyer', 'facebook', 'instagram_post']);
  const [brands, setBrands] = useState<BrandKit[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [providerNotConfigured, setProviderNotConfigured] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
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

  const cost = 10; // campaign = 10 credits
  const hasEnoughCredits = isOwner || (profile?.credits ?? 0) >= cost;

  const toggleFormat = (fmt: string) => {
    setSelectedFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  };

  const handleGenerate = async () => {
    if (!profile || selectedFormats.length === 0) return;
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
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Create campaign record
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .insert({
        user_id: profile.id,
        name: brief.slice(0, 50) || 'Campaign',
        brief,
        brand_kit_id: selectedBrand,
        style: selectedStyle,
        status: 'generating',
        formats: selectedFormats,
      })
      .select()
      .single();

    if (campError) {
      setError(campError.message);
      setGenerating(false);
      return;
    }

    setCampaignId(campaign.id);

    // Generate each format via the AI edge function
    let allSuccess = true;
    for (let i = 0; i < selectedFormats.length; i++) {
      const fmt = selectedFormats[i];

      // Create campaign item
      await supabase.from('campaign_items').insert({
        campaign_id: campaign.id,
        user_id: profile.id,
        format: fmt,
        name: `${fmt} for campaign`,
        status: 'generating',
        sort_order: i,
      });

      const genResult = await generateDesign({
        type: 'advertisement',
        brief: `${brief} — Format: ${fmt}`,
        brandKitId: selectedBrand,
        style: selectedStyle,
        format: fmt,
        campaignId: campaign.id,
      });

      if (!genResult.success) {
        allSuccess = false;
        if (genResult.providerNotConfigured) {
          setProviderNotConfigured(true);
          break;
        }
      }
    }

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ status: allSuccess ? 'completed' : 'failed', updated_at: new Date().toISOString() })
      .eq('id', campaign.id);

    if (!allSuccess && providerNotConfigured) {
      setError(t('ad.providerNotConfigured'));
      setGenerating(false);
      return;
    }

    await refreshProfile();
    setGenStep(5);
    await new Promise((r) => setTimeout(r, 800));
    setGenerating(false);
    setStep(4);
  };

  if (generating) {
    return <CampaignGenOverlay step={genStep} t={t} total={selectedFormats.length} />;
  }

  if (step === 4 && campaignId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-cream-50 mb-2">{t('campaign.success')}</h2>
          <p className="text-sm text-cream-300/60 mb-8">{t('campaign.successDesc')}</p>
        </div>

        {/* Campaign outputs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedFormats.map((fmt) => (
            <div key={fmt} className="card-lux p-4 group">
              <div className="aspect-[3/4] bg-gradient-to-br from-ink-800 to-ink-900 rounded-lg border border-gold-600/20 flex flex-col items-center justify-center mb-3 group-hover:border-gold-600/40 transition-all">
                <Layers className="w-8 h-8 text-gold-400/30 mb-2" />
                <span className="text-xs font-medium text-cream-200 capitalize">{t(`campaign.fmt${fmt.charAt(0).toUpperCase() + fmt.slice(1).replace(/_./g, (m) => m.charAt(1).toUpperCase())}`)}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onNavigate('editor')} className="flex-1 text-[10px] py-1.5 rounded bg-ink-700/50 text-cream-300/60 hover:text-gold-200 transition-colors">
                  <Eye className="w-3 h-3 inline" />
                </button>
                <button className="flex-1 text-[10px] py-1.5 rounded bg-ink-700/50 text-cream-300/60 hover:text-gold-200 transition-colors">
                  <Download className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={() => { setStep(1); setBrief(''); setCampaignId(null); setSelectedFormats(['poster', 'flyer', 'facebook', 'instagram_post']); }} className="btn-ghost text-sm">
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
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              step >= s ? 'bg-gold-gradient text-ink-950' : 'bg-ink-700 text-cream-400/40'
            }`}>{s}</div>
            {s < 3 && <div className={`w-12 h-px ${step > s ? 'bg-gold-500' : 'bg-ink-600'}`} />}
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

      {/* Step 1: Brief + Format selection */}
      {step === 1 && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-display font-bold text-cream-50 mb-2">{t('campaign.title')}</h2>
            <p className="text-sm text-cream-300/50">{t('campaign.subtitle')}</p>
          </div>

          <div>
            <label className="label-lux">{t('cw.brief')}</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              className="input-lux resize-none"
              placeholder={t('campaign.briefPlaceholder')}
            />
          </div>

          <div>
            <label className="label-lux">{t('campaign.selectFormats')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CAMPAIGN_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => toggleFormat(fmt.id)}
                  className={`card-lux p-3 text-center text-xs font-medium transition-all ${
                    selectedFormats.includes(fmt.id) ? 'border-gold-600/50 bg-gold-600/10 text-gold-200' : 'text-cream-300/60'
                  }`}
                >
                  {t(fmt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={brief.trim().length < 5 || selectedFormats.length === 0}
              className="btn-gold text-sm disabled:opacity-40"
            >
              {t('common.continue')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Style + Brand Kit */}
      {step === 2 && (
        <div className="animate-fade-in space-y-6">
          <div>
            <label className="label-lux">{t('ad.chooseStyle')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {DESIGN_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`card-lux p-3 text-center text-xs font-medium capitalize transition-all ${
                    selectedStyle === style ? 'border-gold-600/50 bg-gold-600/5 text-gold-200' : 'text-cream-200'
                  }`}
                >
                  {t(`style.${style}`)}
                </button>
              ))}
            </div>
          </div>

          {brands.length > 0 && (
            <div>
              <label className="label-lux">{t('cw.brandKit')}</label>
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

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-ghost text-sm">{t('common.back')}</button>
            <button onClick={() => setStep(3)} className="btn-gold text-sm">{t('common.continue')}</button>
          </div>
        </div>
      )}

      {/* Step 3: Review and generate */}
      {step === 3 && (
        <div className="animate-fade-in space-y-6">
          <h2 className="text-xl font-display font-bold text-cream-50 text-center mb-2">{t('cw.reviewGenerate')}</h2>
          <div className="card-lux p-6 space-y-4">
            <div className="pb-3 border-b border-ink-600/40">
              <span className="text-sm text-cream-300/60 block mb-1">{t('cw.brief')}</span>
              <span className="text-sm text-cream-100">{brief}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-ink-600/40">
              <span className="text-sm text-cream-300/60">{t('ad.style')}</span>
              <span className="text-sm font-medium text-gold-200 capitalize">{t(`style.${selectedStyle}`)}</span>
            </div>
            <div className="pb-3 border-b border-ink-600/40">
              <span className="text-sm text-cream-300/60 block mb-2">{t('campaign.formats')}</span>
              <div className="flex flex-wrap gap-2">
                {selectedFormats.map((fmt) => (
                  <span key={fmt} className="chip border-gold-600/30 bg-gold-600/10 text-gold-200 capitalize">
                    {t(`campaign.fmt${fmt.charAt(0).toUpperCase() + fmt.slice(1).replace(/_./g, (m) => m.charAt(1).toUpperCase())}`)}
                  </span>
                ))}
              </div>
            </div>
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
            <button onClick={() => setStep(2)} className="btn-ghost text-sm">{t('common.back')}</button>
            <button type="button" onClick={() => setShowCreditModal(true)} className="btn-ghost text-xs px-4 py-2">KREDIT VÁSÁRLÁS</button>
            <button onClick={handleGenerate} disabled={!hasEnoughCredits} className="btn-gold text-sm disabled:opacity-40">
              <Sparkles className="w-4 h-4" />
              {t('campaign.generate')}
            </button>
          </div>
        </div>
      )}
    </div>
    <CreditPurchaseModal open={showCreditModal} onClose={() => setShowCreditModal(false)} onNavigate={onNavigate} currentCredits={profile?.credits} reason="Vásárolj kreditet közvetlenül a Campaign Engine-ből, visszalépés nélkül." />
  );
}

function CampaignGenOverlay({ step, t, total }: { step: number; t: (k: any) => string; total: number }) {
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
        <div className="text-sm text-gold-200 mb-4">{done ? t('gen.reveal') : t('campaign.generating')}</div>
        <div className="text-xs text-cream-300/40 mb-8">{total} {t('campaign.outputsBeingGenerated')}</div>
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
