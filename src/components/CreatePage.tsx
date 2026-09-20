import { useState, useEffect, type SyntheticEvent } from 'react';
import { Sparkles, AlertCircle, Check, X, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { GENERATION_COSTS, getCreditsForType, CREDIT_PACKAGES, formatPrice, getCustomCreditPrice } from '@/lib/constants';
import { DESIGNLY_TEMPLATE_INDEXES, getDesignlyTemplate } from '@/lib/designly-templates';
import { generateDesign } from '@/lib/ai';
import { runDesignlyMasterAgent, type DesignBrief as AgentDesignBrief, type DesignOutput, type MasterAgentResult as AgentDesignResult } from '@/lib/designly-agent';
import { CelticEmblem } from './CelticEmblem';
import { PreviewWatermark } from './PreviewWatermark';
import type { ProjectType, BrandKit } from '@/types';


interface VyronBlueprint {
  source: 'VYRON';
  businessName: string;
  businessType: string;
  targetAudience: string;
  features: string[];
  channels: string[];
  adminModules: string[];
  monetization: string[];
  cta: string;
  responsive: boolean;
  brief: string;
  report: string;
}

function extractVyronBusinessName(text: string): string {
  const match = text.match(/(?:ÜZLETI ÖTLET|ÜZLETI ÖTLET[\s\S]{0,80}?)(?:\*\*)?[\s:—-]*[„"“]?([^\n„"“”]+)[”"]?/i);
  const candidate = match?.[1]?.replace(/\*\*/g, '').trim();
  return candidate && candidate.length >= 4 && candidate.length <= 90
    ? candidate.replace(/^[-–—:]+\s*/, '')
    : 'VYRON AI üzleti projekt';
}

function buildVyronBlueprint(brief: string, report: string): VyronBlueprint {
  const combined = `${brief}\n${report}`;
  const extracted = extractVyronBusinessName(report);
  const businessName = extracted !== 'VYRON AI üzleti projekt'
    ? extracted
    : (combined.match(/Virág Rendelés Asszisztens/i)?.[0] || 'VYRON AI üzleti projekt');

  return {
    source: 'VYRON',
    businessName,
    businessType: 'AI-alapú üzleti webplatform',
    targetAudience: 'A VYRON riportban meghatározott célcsoport',
    features: [
      'AI chat asszisztens',
      'Online rendelési rendszer',
      'Messenger / WhatsApp rendelési folyamat koncepció',
      'Admin felület',
      'Árképzés és csomagok',
      'CTA és kapcsolatfelvétel',
      'Mobilbarát reszponzív felület',
      'Üzleti bemutatkozó oldal',
      'Termék / szolgáltatás katalógus',
      'Ügyfél- és rendeléskezelési folyamat',
    ],
    channels: ['Web', 'Messenger', 'WhatsApp'],
    adminModules: ['Dashboard', 'Rendelések', 'Ügyfelek', 'Termékek', 'Árak', 'Beállítások'],
    monetization: ['A VYRON riportban javasolt bevételi modell', 'Ellenőrizendő árképzés és csomagok'],
    cta: 'Rendelés indítása',
    responsive: true,
    brief,
    report,
  };
}

interface CreatePageProps {
  onNavigate: (
    page: string,
    item?: { type: 'subscription' | 'credit_package'; itemId: string }
  ) => void;
}

export function CreatePage({ onNavigate }: CreatePageProps) {
  const { t, lang } = useI18n();
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
  const [projectName, setProjectName] = useState('DESIGNLY STUDIO');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<AgentDesignBrief | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [orchestration, setOrchestration] = useState<AgentDesignResult['orchestration'] | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [customCredits, setCustomCredits] = useState(100);
  const [vyronBlueprint, setVyronBlueprint] = useState<VyronBlueprint | null>(null);
  const [autoBuildRequested, setAutoBuildRequested] = useState(false);
  const [autoBuildMode, setAutoBuildMode] = useState(false);
  const [autoBuildFinalizeRequested, setAutoBuildFinalizeRequested] = useState(false);
  const [autoBuildStatus, setAutoBuildStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const handoff = params.get('vyron');
      if (handoff) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(handoff))));
        if (decoded?.brief) {
          const report = typeof decoded.report === 'string' ? decoded.report : '';
          const originalMission = typeof decoded.mission === 'string' ? decoded.mission : decoded.brief;
          const blueprint = buildVyronBlueprint(originalMission, report);
          const enrichedBrief = `VYRON BUSINESS BUILD SPEC\n\nPROJECT: ${blueprint.businessName}\n\nORIGINAL MISSION:\n${originalMission}\n\nFULL VYRON REPORT:\n${report}\n\nAUTOMATIC BUILD REQUIREMENTS:\n- Build the complete responsive website/app concept, not only a hero image.\n- Include AI chat assistant, ordering flow, Messenger/WhatsApp concept, admin dashboard, pricing, CTA, mobile layout, product/service catalogue and customer/order flow.\n- Use the VYRON report as the source of truth for business details; mark unsupported assumptions as editable placeholders.\n- Produce a production-oriented MVP structure that can be saved as a DESIGNLY project.\n`;
          setVyronBlueprint(blueprint);
          setSelectedType((decoded.type || 'website') as ProjectType);
          setBrief(enrichedBrief);
          setStep(2);
          window.history.replaceState({}, '', window.location.pathname + '#create');
          return;
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem('designly_selected_template');
      if (raw) {
        const tpl = JSON.parse(raw) as { id?: string; name?: string; type?: string; description?: string; style?: string; effect?: string; fontPair?: string; palette?: string[] };
        const allowed = GENERATION_COSTS.some((item) => item.type === tpl.type);
        if (allowed) {
          setSelectedType(tpl.type as ProjectType);
          setBrief((current) => current.trim() ? current : `Use the "${tpl.name || 'DESIGNLY template'}" template as the starting point. ${tpl.description || ''} Style: ${tpl.style || 'premium'}. Effect: ${tpl.effect || 'Metallic sheen'}. Typography: ${tpl.fontPair || 'Cinzel + Inter'}. Palette: ${(tpl.palette || []).join(', ')}.`);
          setStep(2);
        }
        localStorage.removeItem('designly_selected_template');
      }
    } catch {
      localStorage.removeItem('designly_selected_template');
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('designly_auto_build');
      if (!raw) return;
      const build = JSON.parse(raw) as { type?: ProjectType; brief?: string; projectName?: string; clientName?: string; companyName?: string; packageName?: string };
      localStorage.removeItem('designly_auto_build');
      if (build.type && build.brief) {
        setSelectedType(build.type);
        setBrief(build.brief);
        if (build.projectName) setProjectName(build.projectName);
        setStep(2);
        setAutoBuildMode(true);
        setAutoBuildStatus('AI BUSINESS BUILDER: előkészítés…');
        setAutoBuildRequested(true);
      }
    } catch {
      localStorage.removeItem('designly_auto_build');
    }
  }, []);

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
  const canDownloadImages = isOwner || profile?.role === 'admin';

  const protectImage = (event: SyntheticEvent<HTMLImageElement>) => {
    if (!canDownloadImages) {
      event.preventDefault();
    }
  };

  const getAgentOutput = (): DesignOutput => {
    const map: Record<string, DesignOutput> = {
      website: 'website',
      landing: 'landing_page',
      logo: 'logo',
      brand: 'brand_identity',
      business_card: 'business_card',
      invitation: 'invitation',
      flyer: 'flyer',
      social: 'social_post',
      brochure: 'brochure',
      menu: 'menu',
      presentation: 'presentation',
      poster: 'poster',
      advertisement: 'custom',
      banner: 'banner',
      pricelist: 'price_list',
      campaign: 'campaign',
      custom: 'custom',
    };
    return map[selectedType || ''] || 'brand_identity';
  };

  const handlePreview = async () => {
    if (!selectedType || brief.trim().length < 5) return;
    setPreviewError(null);
    setPreview(null);
    setPreviewImageUrl(null);
    setPreviewId(null);
    setActiveAgents([]);
    setOrchestration(null);
    setApproved(false);
    setPreviewLoading(true);
    if (autoBuildMode) setAutoBuildStatus('AI BUSINESS BUILDER: AI előnézet készítése…');

    let result: Awaited<ReturnType<typeof runDesignlyMasterAgent>>;
    try {
      result = await runDesignlyMasterAgent({
        brief,
        brandKitId: selectedBrand,
        requestedOutputs: [getAgentOutput()],
        language: lang,
        mode: 'preview',
      });
    } catch (previewRunError) {
      setPreviewLoading(false);
      setPreviewError(previewRunError instanceof Error ? previewRunError.message : 'Az AI előnézet futtatása közben váratlan hiba történt.');
      if (autoBuildMode) setAutoBuildStatus('AI BUSINESS BUILDER: hiba történt — újrapróbálható');
      return;
    }

    setPreviewLoading(false);

    if (!result.success || !result.designBrief) {
      setPreviewError(result.message || 'The free design preview could not be created.');
      if (autoBuildMode) setAutoBuildStatus('AI BUSINESS BUILDER: az előnézet nem készült el — újrapróbálható');
      return;
    }

    setPreview(result.designBrief);
    setPreviewImageUrl(result.previewImageUrl || null);
    setPreviewId(result.previewId || null);
    setActiveAgents(result.activeAgents || ['master']);
    setOrchestration(result.orchestration || null);
    setStep(3);
    if (autoBuildMode) {
      if (isOwner) {
        setApproved(true);
        setAutoBuildStatus('AI BUSINESS BUILDER: előnézet jóváhagyva — végleges weboldal építése…');
        setAutoBuildFinalizeRequested(true);
      } else {
        setAutoBuildStatus('AI BUSINESS BUILDER: előnézet kész — jóváhagyásra vár');
      }
    }
  };

  // Automatic Business Builder: trigger the free AI preview after the dashboard handoff is loaded.
  useEffect(() => {
    if (!autoBuildRequested || !selectedType || brief.trim().length < 5 || previewLoading) return;
    setAutoBuildRequested(false);
    void handlePreview();
  }, [autoBuildRequested, selectedType, brief]);

  useEffect(() => {
    if (!autoBuildFinalizeRequested || !autoBuildMode || !approved || !previewId || !previewImageUrl || generating) return;
    setAutoBuildFinalizeRequested(false);
    setAutoBuildStatus('AI BUSINESS BUILDER: végleges weboldal építése…');
    void handleGenerate();
  }, [autoBuildFinalizeRequested, autoBuildMode, approved, previewId, previewImageUrl, generating]);

  const handleGenerate = async () => {
    if (!profile || !selectedType || !approved) return;
    setError(null);

    if (!isOwner && (profile.credits ?? 0) < cost) {
      setError(t('gen.insufficientCredits'));
      setShowCreditModal(true);
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

    // Create the project first so the server-side generation job is linked
    // to a real project from the beginning. This prevents a successful AI
    // generation from becoming orphaned if project persistence fails later.
    const { data: projectData, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: profile.id,
        name: vyronBlueprint?.businessName || brief.slice(0, 50) || `${selectedType} project`,
        type: selectedType,
        status: 'processing',
        brief,
        brand_kit_id: selectedBrand,
        config: { type: selectedType, brief, brand_kit_id: selectedBrand, ...(vyronBlueprint ? { source: 'VYRON', websiteBlueprint: vyronBlueprint, buildStatus: 'planned' } : {}), ...(orchestration ? { orchestration, buildSpec: orchestration.buildSpec, qaStatus: orchestration.qaStatus, blockers: orchestration.blockers } : {}) },
      })
      .select()
      .single();

    if (insertError || !projectData) {
      setError(insertError?.message || t('gen.failed'));
      setGenerating(false);
      return;
    }

    // Final generation is the only paid generation path.
    // The preview path above never calls this endpoint.
    const genResult = await generateDesign({
      mode: 'final',
      type: selectedType,
      brief,
      brandKitId: selectedBrand ?? undefined,
      projectId: projectData.id,
      previewId: previewId ?? undefined,
    });

    if (!genResult.success) {
      await supabase
        .from('projects')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', projectData.id);

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

    const generatedImageUrlValue = (genResult.result?.imageUrl as string) || null;
    const finalOrchestration = orchestration;
    await supabase
      .from('projects')
      .update({
        status: 'completed',
        preview_url: generatedImageUrlValue,
        updated_at: new Date().toISOString(),
        config: {
          ...(projectData.config || {}),
          ...(vyronBlueprint ? {
            source: 'VYRON',
            websiteBlueprint: {
              ...vyronBlueprint,
              buildStatus: 'generated',
              generatedAt: new Date().toISOString(),
            },
          } : {}),
          generation: {
            ...(projectData.config?.generation || {}),
            imageUrl: generatedImageUrlValue,
            generatedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', projectData.id);

    await refreshProfile();

    setGeneratedImageUrl(generatedImageUrlValue);
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
        <p className="text-sm text-cream-300/60 mb-6">{t('gen.successDesc')}</p>
        {generatedImageUrl ? (
          <div className="relative w-full max-w-[1500px] mb-8 rounded-2xl overflow-hidden border border-gold-600/25 bg-black shadow-2xl">
            <img
              src={generatedImageUrl}
              alt="DESIGNLY AI generated design"
              draggable={canDownloadImages}
              onContextMenu={protectImage}
              onDragStart={protectImage}
              className={`block w-full h-auto ${canDownloadImages ? '' : 'select-none'}`}
            />
            <PreviewWatermark
              hidden={canDownloadImages}
              projectName={vyronBlueprint?.businessName || projectName}
              label="DESIGNLY · FINAL PREVIEW"
            />
          </div>
        ) : (
          <div className="w-full max-w-2xl mb-8 rounded-xl border border-gold-600/20 bg-ink-900/70 px-5 py-4 text-sm text-cream-300/70">
            A generálás sikerült, de a kép nem érkezett vissza. Ezt a projektben még ellenőrizhetjük.
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => { if (createdProject) localStorage.setItem('designly_selected_project', createdProject); onNavigate('editor'); }} className="btn-gold text-sm">
            {t('common.open')}
          </button>
          <button onClick={() => { setStep(1); setSelectedType(null); setBrief(''); setCreatedProject(null); setGeneratedImageUrl(null); }} className="btn-ghost text-sm">
            {t('common.createAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`w-full mx-auto space-y-8 ${step === 3 ? 'max-w-[1700px]' : 'max-w-5xl'}`}>
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
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[.2em] text-gold-400/80">Sablonok</div>
              <p className="text-sm text-cream-300/55 mt-1">Indulj kész prémium dizájnról, majd alakítsd teljesen egyedire.</p>
            </div>
            <button onClick={() => onNavigate('templates')} className="btn-ghost text-xs whitespace-nowrap">Összes sablon →</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {DESIGNLY_TEMPLATE_INDEXES.slice(0, 12).map((index) => { const tpl = getDesignlyTemplate(index); return (
              <button key={tpl.id} onClick={() => {
                setSelectedType(tpl.type as ProjectType);
                setBrief(`Use the "${tpl.name}" template as the starting point. ${tpl.description} Style: ${tpl.style}. Effect: ${tpl.effect}. Typography: ${tpl.fontPair}. Palette: ${tpl.palette.join(', ')}.`);
                setStep(2);
              }} className="group rounded-xl border border-gold-600/15 bg-ink-950/70 p-3 text-left hover:border-gold-500/40 hover:bg-gold-600/5 transition-all">
                <div className="aspect-[16/9] rounded-lg overflow-hidden border border-gold-600/10 mb-3" style={{ background: `linear-gradient(135deg, ${tpl.palette[0]}, ${tpl.palette[1]}66, ${tpl.palette[0]})` }}>
                  <div className="h-full p-3 flex flex-col justify-between">
                    <div className="w-7 h-7 rounded-full border border-gold-400/40 flex items-center justify-center text-gold-300 font-display text-xs">D</div>
                    <div>
                      <div className="text-[8px] uppercase tracking-widest text-gold-300/70">{tpl.category}</div>
                      <div className="text-sm font-display text-cream-50 truncate">{tpl.name}</div>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-medium text-cream-100 truncate">{tpl.name}</div>
                <div className="text-[10px] text-gold-400/70 mt-1">{tpl.type}</div>
              </button>
            ); })}
          </div>

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
          <h2 className="text-xl font-display font-bold text-cream-50 text-center mb-2">
            {autoBuildMode ? 'Az AI felépíti az üzletedet' : t('cw.describeVision')}
          </h2>
          <p className="text-sm text-cream-300/50 text-center mb-8">
            {autoBuildMode ? 'Az Automatic Business Builder a teljes weboldal/app struktúrát automatikusan megtervezi.' : t('cw.describeVisionDesc')}
          </p>

          {autoBuildMode ? (
            <div className="rounded-2xl border border-gold-500/25 bg-gradient-to-br from-gold-500/10 via-ink-950 to-black p-7 text-center shadow-2xl">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full border border-gold-400/40 bg-gold-500/10 flex items-center justify-center text-2xl text-gold-300">◆</div>
              <div className="text-sm font-semibold uppercase tracking-[.18em] text-gold-300">Automatic Business Builder</div>
              <p className="mt-3 text-sm leading-6 text-cream-200/70">
                Nem kell promptot írnod. A DESIGNLY AI automatikusan elkészíti az üzleti struktúrát, a vizuális irányt, a funkciókat és az első előnézetet.
              </p>
              {autoBuildStatus && (
                <div className="mt-5 rounded-lg border border-gold-600/20 bg-black/30 px-4 py-3 text-xs text-gold-200/90" role="status">
                  {autoBuildStatus}
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value);
                if (previewError) setPreviewError(null);
              }}
              rows={6}
              className="input-lux resize-none"
              placeholder={t('cw.briefPlaceholder')}
            />
          )}

          {previewError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <div className="font-medium mb-1">AI előnézet hiba</div>
              <div className="text-red-200/80 break-words">{previewError}</div>
              <button
                type="button"
                onClick={handlePreview}
                disabled={brief.trim().length < 5 || previewLoading}
                className="mt-3 underline text-gold-200 disabled:opacity-40"
              >
                Újrapróbálom
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <button onClick={() => setStep(1)} className="btn-ghost text-sm">
              {t('common.back')}
            </button>
            <button
              onClick={handlePreview}
              disabled={brief.trim().length < 5 || previewLoading}
              className="btn-gold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {previewLoading ? t('common.loading') : t('designer.previewFree')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Free AI preview -> explicit approval -> paid final generation */}
      {step === 3 && selectedType && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-display font-bold text-cream-50 mb-2">{t('designer.previewTitle')}</h2>
            <p className="text-sm text-cream-300/50">{t('designer.previewDesc')}</p>
          </div>

          {previewError && (
            <div className="card-lux p-4 border-red-500/30 bg-red-500/5 text-sm text-red-300">
              {previewError}
            </div>
          )}

          {previewImageUrl && (
            <div className="card-lux overflow-hidden border-gold-600/30 bg-black shadow-2xl">
              <div className="px-5 py-3 border-b border-gold-600/15 flex items-center justify-between bg-ink-900/90 sticky top-0 z-10">
                <div>
                  <span className="text-xs uppercase tracking-[.18em] text-gold-400">AI eredmény · nagy előnézet</span>
                  <div className="text-[10px] text-cream-300/40 mt-1">A kész művet nagy, fókuszált vásznon látod.</div>
                </div>
                <span className="chip border-gold-600/20 bg-black/30 text-cream-300/50 text-[10px]">0 kredit</span>
              </div>
              <div className="bg-[#020303] p-2 sm:p-4 lg:p-6">
                <div className="relative mx-auto w-full max-w-[1500px] overflow-hidden rounded-xl border border-gold-600/15 bg-black shadow-[0_0_80px_rgba(0,0,0,.6)]">
                  <img
                    src={previewImageUrl}
                    alt="DESIGNLY AI preview"
                    draggable={canDownloadImages}
                    onContextMenu={protectImage}
                    onDragStart={protectImage}
                    className={`block w-full h-auto object-contain ${canDownloadImages ? '' : 'select-none'}`}
                  />
                  <PreviewWatermark
                    hidden={canDownloadImages}
                    projectName={vyronBlueprint?.businessName || undefined}
                  />
                </div>
              </div>
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
                        {output.replace(/_/g, ' ')}
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
                  <span className="text-sm text-cream-300/60 block">{t('designer.finalCost')}</span>
                  <span className="text-xl font-display font-bold gold-text">{isOwner ? '∞' : cost} credits</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-cream-300/60 block">{t('credits.currentBalance')}</span>
                  <span className="text-xl font-display font-bold text-cream-50">{isOwner ? '∞' : profile?.credits ?? 0}</span>
                </div>
              </div>
              {!hasEnoughCredits && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('gen.insufficientCredits')} <button onClick={() => setShowCreditModal(true)} className="underline">{t('credits.buyCredits')}</button>.</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {!isOwner && (
                  <button type="button" onClick={() => setShowCreditModal(true)} className="btn-ghost text-xs px-4 py-2">
                    KREDIT VÁSÁRLÁS · 1–10 000
                  </button>
                )}
                <div className="flex justify-between items-center gap-3 sm:ml-auto">
                  <button onClick={() => setStep(2)} className="btn-ghost text-sm">{t('common.back')}</button>
                  <button
                    onClick={() => setApproved(true)}
                    disabled={!preview || !previewImageUrl || !previewId || !hasEnoughCredits}
                    className="btn-gold text-sm disabled:opacity-40"
                  >
                    {t('designer.select')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-lux p-6 space-y-5 border-gold-500/40 bg-gold-500/5">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-gold-400/70">{t('designer.finalConfirm')}</div>
                <h3 className="text-lg font-display font-bold text-cream-50 mt-1">{t('designer.finalConfirm')}</h3>
                <p className="text-sm text-cream-300/60 mt-2">{t('designer.finalConfirmDesc')}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gold-600/20 bg-ink-900/60 p-4">
                <div>
                  <span className="text-xs text-cream-300/60 block">{t('designer.finalCost')}</span>
                  <span className="text-2xl font-display font-bold gold-text">{isOwner ? '∞' : cost} kredit</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-cream-300/60 block">{t('designer.remaining')}</span>
                  <span className="text-lg font-display font-bold text-cream-50">{isOwner ? '∞' : Math.max(0, (profile?.credits ?? 0) - cost)} kredit</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {!isOwner && (
                  <button type="button" onClick={() => setShowCreditModal(true)} className="btn-ghost text-xs px-4 py-2">
                    KREDIT VÁSÁRLÁS · 1–10 000
                  </button>
                )}
                <div className="flex justify-between items-center gap-3 sm:ml-auto">
                  <button onClick={() => setApproved(false)} className="btn-ghost text-sm">{t('designer.modify')}</button>
                  <button
                    onClick={handleGenerate}
                    disabled={!hasEnoughCredits}
                    className="btn-gold text-sm disabled:opacity-40"
                  >
                    {t('designer.continue').replace('{credits}', isOwner ? '∞' : String(cost))}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

      {showCreditModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-purchase-title"
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gold-600/30 bg-ink-950 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowCreditModal(false)}
              className="absolute right-4 top-4 w-9 h-9 rounded-full border border-ink-600/60 bg-ink-900 flex items-center justify-center text-cream-300 hover:text-cream-50"
              aria-label="Bezárás"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">
              <div className="text-center pr-8">
                <CreditCard className="w-10 h-10 text-gold-400 mx-auto mb-3" />
                <h2 id="credit-purchase-title" className="text-xl sm:text-2xl font-display font-bold text-cream-50">
                  {t('credits.buyCredits')}
                </h2>
                <p className="text-sm text-cream-300/60 mt-2">
                  {t('gen.insufficientCredits')}
                </p>
                <div className="mt-3 text-sm text-gold-200">
                  {t('credits.currentBalance')}: {isOwner ? '∞' : profile?.credits ?? 0} · {t('designer.finalCost')}: {cost}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {CREDIT_PACKAGES.map((pkg) => (
                  <div key={pkg.id} className="card-lux p-5 flex flex-col border-gold-600/15 hover:border-gold-600/40 transition-colors">
                    <div className="text-2xl font-display font-bold gold-text">{pkg.credits.toLocaleString()}</div>
                    <div className="text-xs text-cream-300/50 mt-1">{t('misc.credits')}</div>
                    <div className="text-lg font-medium text-cream-100 mt-3 mb-4">{formatPrice(pkg.price, lang)}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreditModal(false);
                        onNavigate('checkout', { type: 'credit_package', itemId: pkg.id });
                      }}
                      className="btn-gold text-sm mt-auto"
                    >
                      <CreditCard className="w-4 h-4" />
                      {t('credits.buyNow')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-gold-600/20 bg-ink-900/60 p-5">
                <div className="text-sm font-semibold text-cream-100">Egyedi kreditmennyiség</div>
                <p className="text-xs text-cream-300/50 mt-1">Válassz 1–10 000 kredit között pontosan annyit, amennyire szükséged van.</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    step={1}
                    value={customCredits}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setCustomCredits(Number.isFinite(value) ? Math.max(1, Math.min(10000, Math.floor(value))) : 1);
                    }}
                    className="input-lux flex-1"
                    aria-label="Egyedi kreditek"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreditModal(false);
                      onNavigate('checkout', { type: 'credit_package', itemId: `custom_${customCredits}` });
                    }}
                    className="btn-gold sm:min-w-[190px]"
                  >
                    <CreditCard className="w-4 h-4" />
                    Vásárlás · {formatPrice(getCustomCreditPrice(customCredits), lang)}
                  </button>
                </div>
                <div className="text-[11px] text-cream-300/40 mt-2">Minimum 1 · maximum 10 000 kredit</div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreditModal(false)}
                className="btn-ghost text-sm w-full mt-5"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="fixed inset-0 z-[100] bg-ink-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
      <div className="absolute top-5 left-1/2 -translate-x-1/2 chip border-gold-500/20 bg-black/30 text-gold-200 text-[10px] uppercase tracking-[.2em]">
        AUTOMATIC BUILD · NAGY MUNKATÉR
      </div>
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative flex flex-col items-center">
        <CelticEmblem size={200} animate showD />
        <div className="font-display text-2xl font-bold text-cream-50 tracking-wide mt-8 mb-2">DESIGNLY STUDIO</div>
        <div className="text-sm text-gold-200 mb-8">{done ? t('gen.reveal') : t('gen.creating')}</div>

        <div className="w-full max-w-xl space-y-2 rounded-2xl border border-gold-600/10 bg-black/20 p-5">
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
