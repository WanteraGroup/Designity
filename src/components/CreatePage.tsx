import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { GENERATION_COSTS, getCreditsForType } from '@/lib/constants';
import { generateDesign } from '@/lib/ai';
import { runDesignlyMasterAgent, type DesignBrief as AgentDesignBrief, type DesignOutput } from '@/lib/designly-agent';
import { CelticEmblem } from './CelticEmblem';
import type { ProjectType, BrandKit } from '@/types';

interface CreatePageProps {
  onNavigate: (page: string) => void;
}

export function CreatePage({ onNavigate }: CreatePageProps) {
  const { t } = useI18n();
  const { profile, isOwner, refreshProfile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
  const [brief, setBrief] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brands, setBrands] = useState<BrandKit[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<AgentDesignBrief | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

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

  const cost = selectedType ? getCreditsForType(selectedType) : 0;
  const hasEnoughCredits = isOwner || (profile?.credits ?? 0) >= cost;

  const getAgentOutput = (): DesignOutput => {
    const map: Record<string, DesignOutput> = {
      logo: 'logo',
      brand_identity: 'brand_identity',
      business_card: 'business_card',
      invitation: 'invitation',
      flyer: 'flyer',
      poster: 'poster',
      social_post: 'social_post',
      social_story: 'social_story',
      landing_page: 'landing_page',
      website: 'website',
      presentation: 'presentation',
      brochure: 'brochure',
      price_list: 'price_list',
      digital_business_card: 'digital_business_card',
    };
    return map[selectedType || ''] || 'brand_identity';
  };

  const handlePreview = async () => {
    if (!selectedType || brief.trim().length < 5) return;
    setPreviewError(null);
    setPreview(null);
    setApproved(false);
    setPreviewLoading(true);

    const result = await runDesignlyMasterAgent({
      brief,
      brandKitId: selectedBrand,
      requestedOutputs: [getAgentOutput()],
      mode: 'preview',
    });

    setPreviewLoading(false);

    if (!result.success || !result.designBrief) {
      setPreviewError(result.message || 'The free design preview could not be created.');
      return;
    }

    setPreview(result.designBrief);
    setStep(3);
  };

  const handleGenerate = async () => {
    if (!profile || !selectedType || !approved) return;
    setError(null);

    if (!isOwner && (profile.credits ?? 0) < cost) {
      setError(t('gen.insufficientCredits'));
      return;
    }

    setGenerating(true);
    setGenStep(0);

    const steps = [
      t('gen.analyzing'),
      t('gen.direction'),
      t('gen.layout'),
      t('gen.brand'),
      t('gen.optimizing'),
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenStep(i);
      await new Promise((r) => setTimeout(r, 900));
    }

    // Call the server-side AI generation edge function
    const genResult = await generateDesign({
      type: selectedType,
      brief,
      brandKitId: selectedBrand,
    });

    if (!genResult.success) {
      if (genResult.providerNotConfigured) {
        setError(genResult.message || t('ad.providerNotConfigured'));
      } else if (genResult.errorCode === 'INSUFFICIENT_CREDITS') {
        setError(t('gen.insufficientCredits'));
      } else {
        setError(genResult.message || t('gen.failed'));
      }
      setGenerating(false);
      return;
    }

    // Create the project record
    const { data: projectData, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: profile.id,
        name: brief.slice(0, 50) || `${selectedType} project`,
        type: selectedType,
        status: 'completed',
        brief,
        brand_kit_id: selectedBrand,
        config: genResult.result || { type: selectedType, brief, brand_kit_id: selectedBrand },
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setGenerating(false);
      return;
    }

    await refreshProfile();

    setCreatedProject(projectData.id);
    setGenStep(5);
    await new Promise((r) => setTimeout(r, 800));
    setGenerating(false);
    setStep(4);
  };

  if (generating) {
    return <GenerationOverlay step={genStep} t={t} />;
  }

  if (step === 4 && createdProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-50 mb-2">{t('gen.success')}</h2>
        <p className="text-sm text-cream-300/60 mb-8">{t('gen.successDesc')}</p>
        <div className="flex gap-3">
          <button onClick={() => onNavigate('editor')} className="btn-gold text-sm">
            {t('common.open')}
          </button>
          <button onClick={() => { setStep(1); setSelectedType(null); setBrief(''); setCreatedProject(null); }} className="btn-ghost text-sm">
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
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-px ${step > s ? 'bg-gold-500' : 'bg-ink-600'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose type */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-display font-bold text-cream-50 text-center mb-2">{t('cw.whatCreate')}</h2>
          <p className="text-sm text-cream-300/50 text-center mb-8">{t('cw.whatCreateDesc')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {GENERATION_COSTS.map((item) => (
              <button
                key={item.type}
                onClick={() => { setSelectedType(item.type); setStep(2); }}
                className={`card-lux p-5 text-center group hover:scale-105 transition-all duration-300 ${
                  selectedType === item.type ? 'border-gold-600/50 bg-gold-600/5' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gold-600/10 border border-gold-600/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-gold-600/20 transition-all">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </div>
                <div className="text-xs font-medium text-cream-100">{item.label}</div>
                <div className="text-[10px] text-gold-400 mt-1">{isOwner ? '∞' : `${item.credits} credits`}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Brief */}
      {step === 2 && selectedType && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-display font-bold text-cream-50 text-center mb-2">{t('cw.describeVision')}</h2>
          <p className="text-sm text-cream-300/50 text-center mb-8">{t('cw.describeVisionDesc')}</p>

          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={6}
            className="input-lux resize-none"
            placeholder={t('cw.briefPlaceholder')}
          />

          <div className="flex justify-between items-center mt-6">
            <button onClick={() => setStep(1)} className="btn-ghost text-sm">
              {t('common.back')}
            </button>
            <button
              onClick={handlePreview}
              disabled={brief.trim().length < 5 || previewLoading}
              className="btn-gold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {previewLoading ? t('common.loading') : 'AI Preview — 0 credits'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Free AI preview -> explicit approval -> paid final generation */}
      {step === 3 && selectedType && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-display font-bold text-cream-50 mb-2">AI Design Preview</h2>
            <p className="text-sm text-cream-300/50">Explore the design direction for free. Credits are charged only after you explicitly approve the final generation.</p>
          </div>

          {previewError && (
            <div className="card-lux p-4 border-red-500/30 bg-red-500/5 text-sm text-red-300">
              {previewError}
            </div>
          )}

          {preview && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="card-lux p-5 space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold-400/70">Visual direction</span>
                  <p className="text-sm text-cream-100 mt-1">{preview.visualStyle || 'Premium'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold-400/70">Mood</span>
                  <p className="text-sm text-cream-100 mt-1">{preview.mood || 'Refined and distinctive'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold-400/70">Typography</span>
                  <p className="text-sm text-cream-100 mt-1">{preview.typographyDirection || 'Premium modern typography'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold-400/70">Imagery</span>
                  <p className="text-sm text-cream-100 mt-1">{preview.imageryDirection || 'Brand-consistent imagery'}</p>
                </div>
              </div>

              <div className="card-lux p-5 space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold-400/70">Color palette</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[...preview.primaryColors, ...preview.secondaryColors].slice(0, 8).map((color, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full border border-gold-600/20 bg-ink-800/70 text-xs text-cream-200">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold-400/70">Outputs</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preview.requiredOutputs.map((output) => (
                      <span key={output} className="chip border-gold-600/30 bg-gold-600/10 text-gold-200 capitalize">
                        {output.replaceAll('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-ink-600/40">
                  <span className="text-[10px] uppercase tracking-wider text-gold-400/70">Preview cost</span>
                  <p className="text-lg font-display font-bold text-gold-300 mt-1">0 credits</p>
                </div>
              </div>
            </div>
          )}

          {!approved ? (
            <div className="card-lux p-6 space-y-4 border-gold-600/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-cream-300/60 block">Final generation cost</span>
                  <span className="text-xl font-display font-bold gold-text">{isOwner ? '∞' : cost} credits</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-cream-300/60 block">Current balance</span>
                  <span className="text-xl font-display font-bold text-cream-50">{isOwner ? '∞' : profile?.credits ?? 0}</span>
                </div>
              </div>
              {!hasEnoughCredits && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('gen.insufficientCredits')} <button onClick={() => onNavigate('credits')} className="underline">{t('credits.buyCredits')}</button>.</span>
                </div>
              )}
              <div className="flex justify-between items-center gap-3">
                <button onClick={() => setStep(2)} className="btn-ghost text-sm">{t('common.back')}</button>
                <button
                  onClick={() => setApproved(true)}
                  disabled={!preview || !hasEnoughCredits}
                  className="btn-gold text-sm disabled:opacity-40"
                >
                  EZT VÁLASZTOM
                </button>
              </div>
            </div>
          ) : (
            <div className="card-lux p-6 space-y-5 border-gold-500/40 bg-gold-500/5">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-gold-400/70">Final confirmation</div>
                <h3 className="text-lg font-display font-bold text-cream-50 mt-1">A kiválasztott előnézet véglegesítése</h3>
                <p className="text-sm text-cream-300/60 mt-2">Ekkor még egyszer megmutatjuk a levonandó kreditet. A levonás csak a végső generálás indításakor történik.</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gold-600/20 bg-ink-900/60 p-4">
                <div>
                  <span className="text-xs text-cream-300/60 block">Levonás</span>
                  <span className="text-2xl font-display font-bold gold-text">{isOwner ? '∞' : cost} kredit</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-cream-300/60 block">Marad</span>
                  <span className="text-lg font-display font-bold text-cream-50">{isOwner ? '∞' : Math.max(0, (profile?.credits ?? 0) - cost)} kredit</span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-3">
                <button onClick={() => setApproved(false)} className="btn-ghost text-sm">Módosítom</button>
                <button
                  onClick={handleGenerate}
                  disabled={!hasEnoughCredits}
                  className="btn-gold text-sm disabled:opacity-40"
                >
                  MEHET TOVÁBB – {isOwner ? '∞' : cost} KREDIT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                i < step ? 'text-gold-300' : i === step ? 'text-cream-100' : 'text-cream-400/30'
              }`}
            >
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
