import { useState, useEffect, type SyntheticEvent } from 'react';
import { Sparkles, AlertCircle, Check, X, CreditCard, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { GENERATION_COSTS, getCreditsForType, CREDIT_PACKAGES, formatPrice, getCustomCreditPrice } from '@/lib/constants';
import { DESIGNLY_TEMPLATE_INDEXES, getDesignlyTemplate } from '@/lib/designly-templates';
import { generateDesign } from '@/lib/ai';
import { runDesignlyMasterAgent, type DesignBrief as AgentDesignBrief, type DesignOutput, type MasterAgentResult as AgentDesignResult } from '@/lib/designly-agent';
import { CelticEmblem } from './CelticEmblem';
import { PreviewWatermark } from './PreviewWatermark';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import type { ProjectType, BrandKit } from '@/types';


export interface VyronBlueprint {
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
  const { profile, isUnlimited, isAdmin, refreshProfile } = useAuth();
  const billableAccount = !isUnlimited && profile?.role !== 'owner';
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
    const storedBrief = localStorage.getItem('designly_forge_brief');
    if (!storedBrief) return;
    localStorage.removeItem('designly_forge_brief');
    setBrief((current) => current.trim() ? current : storedBrief);
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
  const hasEnoughCredits = (profile?.credits ?? 0) >= cost;
  const canDownloadImages = profile?.role === 'owner' || profile?.role === 'admin' || step === 4;

  const protectImage = (event: SyntheticEvent<HTMLImageElement>) => {
    if (!canDownloadImages) {
      event.preventDefault();
    }
  };

  // Selecting a type now advances straight to the brief step so the tiles are real buttons.
  const selectType = (type: ProjectType) => {
    setSelectedType(type);
    setError(null);
    setPreviewError(null);
    setStep(2);
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
      if (isUnlimited) {
        setApproved(true);
        setAutoBuildStatus('AI BUSINESS BUILDER: előnézet jóváhagyva — végleges weboldal építése…');
        setAutoBuildFinalizeRequested(true);
      } else {
        setAutoBuildStatus('AI BUSINESS BUILDER: előnézet kész — jóváhagyásra vár');
      }
    }
  };

  useEffect(() => {
    if (!autoBuildRequested || !selectedType || brief.trim().length < 5 || previewLoading) return;
    setAutoBuildRequested(false);
    void handlePreview();
  }, [autoBuildRequested, selectedType, brief]);

  useEffect(() => {
    if (!autoBuildFinalizeRequested || !autoBuildMode || !approved || !previewId || generating) return;
    setAutoBuildFinalizeRequested(false);
    setAutoBuildStatus('AI BUSINESS BUILDER: végleges weboldal építése…');
    void handleGenerate();
  }, [autoBuildFinalizeRequested, autoBuildMode, approved, previewId, previewImageUrl, generating]);

  const handleGenerate = async () => {
    if (!profile || !selectedType || !approved) return;
    setError(null);

    if (billableAccount && (profile.credits ?? 0) < cost) {
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

    if (selectedType === 'website') {
      const { data: deducted, error: deductError } = await supabase.rpc('deduct_credits', {
        p_user_id: profile.id,
        p_amount: cost,
        p_description: 'DESIGNLY website finalization',
      });

      if (deductError || deducted !== true) {
        await supabase
          .from('projects')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', projectData.id);
        setError(deductError?.message || t('gen.insufficientCredits'));
        setGenerating(false);
        return;
      }

      const websiteSpec = {
        version: 2,
        kind: 'website',
        name: vyronBlueprint?.businessName || projectData.name,
        pages: Array.isArray(orchestration?.buildSpec?.pages) ? orchestration.buildSpec.pages : [{ path: '/', title: projectData.name, sections: [] }],
        sections: Array.isArray(orchestration?.buildSpec?.sections) ? orchestration.buildSpec.sections : [],
        components: Array.isArray(orchestration?.buildSpec?.components) ? orchestration.buildSpec.components : [],
        content: orchestration?.buildSpec?.content || {},
        interactions: Array.isArray(orchestration?.buildSpec?.interactions) ? orchestration.buildSpec.interactions : [],
        responsiveRules: Array.isArray(orchestration?.buildSpec?.responsiveRules) ? orchestration.buildSpec.responsiveRules : [],
        acceptanceCriteria: Array.isArray(orchestration?.buildSpec?.acceptanceCriteria) ? orchestration.buildSpec.acceptanceCriteria : [],
      };

      await supabase
        .from('projects')
        .update({
          status: 'completed',
          config: { type: selectedType, brief, brand_kit_id: selectedBrand, site: websiteSpec, buildSpec: orchestration?.buildSpec || null, orchestration, qaStatus: orchestration?.qaStatus, updatedAt: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectData.id);

      localStorage.setItem('designly_selected_project', projectData.id);
      setCreatedProject(projectData.id);
      await refreshProfile();
      setGenerating(false);
      setStep(4);
      return;
    }

    if (billableAccount) {
      const { data: deducted, error: deductError } = await supabase.rpc('deduct_credits', {
        p_user_id: profile.id,
        p_amount: cost,
        p_description: `DESIGNLY generation: ${selectedType}`,
      });
      if (deductError || deducted !== true) {
        await supabase.from('projects').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', projectData.id);
        setError(deductError?.message || t('gen.insufficientCredits'));
        setGenerating(false);
        return;
      }
    }

    try {
      const design = await generateDesign({
        type: selectedType,
        brief,
        brandKitId: selectedBrand,
      } as never);
      const result = design as { imageUrl?: string; previewUrl?: string };
      const imageUrl = result.imageUrl || result.previewUrl || null;
      setGeneratedImageUrl(imageUrl);
      await supabase
        .from('projects')
        .update({ status: 'completed', preview_url: imageUrl, config: { type: selectedType, brief, brand_kit_id: selectedBrand, orchestration, updatedAt: new Date().toISOString() }, updated_at: new Date().toISOString() })
        .eq('id', projectData.id);
      localStorage.setItem('designly_selected_project', projectData.id);
      setCreatedProject(projectData.id);
      await refreshProfile();
      setGenerating(false);
      setStep(4);
    } catch (genError) {
      await supabase.from('projects').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', projectData.id);
      setError(genError instanceof Error ? genError.message : t('gen.failed'));
      setGenerating(false);
    }
  };

  const resetCreate = () => {
    setStep(1);
    setSelectedType(null);
    setBrief('');
    setSelectedBrand(null);
    setGeneratedImageUrl(null);
    setError(null);
    setCreatedProject(null);
    setPreview(null);
    setPreviewImageUrl(null);
    setPreviewId(null);
    setApproved(false);
    setActiveAgents([]);
    setOrchestration(null);
    setVyronBlueprint(null);
    setAutoBuildMode(false);
    setAutoBuildStatus(null);
  };

  const selectedLabel = GENERATION_COSTS.find((c) => c.type === selectedType)?.label || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gold-600/15 border border-gold-600/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-gold-400" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-cream-50">{t('create.title')}</h1>
          <p className="text-xs text-cream-300/50">{t('create.subtitle')}</p>
        </div>
        {autoBuildStatus && (
          <span className="ml-auto chip border-gold-600/40 bg-gold-600/15 text-gold-300 text-[10px]">{autoBuildStatus}</span>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.18em]">
        {[['1', 'Típus'], ['2', 'Brief'], ['3', 'Előnézet'], ['4', 'Kész']].map(([n, label], i) => {
          const active = step === Number(n);
          const done = step > Number(n);
          return (
            <div key={n} className="flex items-center gap-2">
              <span className={`w-6 h-6 grid place-items-center rounded-full border ${active ? 'border-gold-500/60 bg-gold-600/15 text-gold-200' : done ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-ink-600/50 text-cream-300/40'}`}>{n}</span>
              <span className={active ? 'text-gold-200' : 'text-cream-300/40'}>{label}</span>
              {i < 3 && <span className="w-6 h-px bg-ink-600/50" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Type selection — every tile is now a real, working button */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">MIT HOZHATSZ LÉTRE</div>
            <h2 className="mt-1 text-xl lg:text-2xl font-display text-cream-50">Válassz típust — azonnal továbblép a briefhez.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GENERATION_COSTS.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => selectType(item.type)}
                className="card-lux p-4 text-left transition-all cursor-pointer hover:border-gold-500/60 hover:-translate-y-0.5"
              >
                <div className="w-9 h-9 rounded-lg bg-gold-600/10 border border-gold-600/20 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </div>
                <div className="text-xs font-medium text-cream-100">{item.label}</div>
                <div className="text-[10px] text-gold-400 mt-1">
                  {billableAccount ? `${item.credits} credits` : (isUnlimited ? '∞' : `${item.credits} credits`)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Brief */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">BRIEF</div>
              <h2 className="mt-1 text-xl lg:text-2xl font-display text-cream-50">{selectedLabel}</h2>
            </div>
            <button type="button" onClick={() => setStep(1)} className="btn-ghost text-xs">
              <ArrowLeft className="w-4 h-4" /> Típus módosítása
            </button>
          </div>

          <div className="card-lux p-6 space-y-4">
            <div className="text-sm font-medium text-cream-100">{t('create.brief')}</div>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
              className="input-lux resize-none text-sm"
              placeholder={t('create.briefPlaceholder')}
            />
            {brands.length > 0 && (
              <div className="grid md:grid-cols-3 gap-3">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => setSelectedBrand(brand.id)}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${selectedBrand === brand.id ? 'border-gold-500/60 bg-gold-600/10' : 'border-ink-600/40 hover:border-gold-600/40'}`}
                  >
                    <div className="font-medium text-cream-100">{brand.name}</div>
                    <div className="text-cream-300/50 mt-1">{brand.industry}</div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handlePreview()}
                disabled={brief.trim().length < 5 || previewLoading}
                className="btn-gold disabled:opacity-40"
              >
                {previewLoading ? t('create.previewLoading') : t('create.preview')}
              </button>
              <button type="button" onClick={resetCreate} className="btn-ghost">{t('common.cancel')}</button>
            </div>

            {previewError && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-300 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {previewError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Preview approval */}
      {step === 3 && preview && (
        <div className="space-y-4">
          <div className="card-lux p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-gold-300 uppercase tracking-wider">{t('create.previewTitle')}</div>
                <div className="text-lg font-display text-cream-50 mt-1">{preview.title || projectName}</div>
              </div>
              <div className="chip border-gold-600/30 bg-gold-600/10 text-gold-300 text-[10px]">
                {activeAgents.length} {t('create.agents')}
              </div>
            </div>
            {preview.summary && (
              <p className="text-xs text-cream-300/60 mt-3 leading-relaxed">{preview.summary}</p>
            )}
            {previewImageUrl && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gold-600/20">
                <img src={previewImageUrl} alt={preview.title || projectName} onContextMenu={protectImage} className="w-full" />
                <PreviewWatermark />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button type="button" onClick={() => setApproved(true)} disabled={approved} className="btn-gold disabled:opacity-50">
              <Check className="w-4 h-4" /> {approved ? t('create.approved') : t('create.approve')}
            </button>
            {approved && (
              <button type="button" onClick={() => void handleGenerate()} disabled={generating} className="btn-gold disabled:opacity-50">
                {generating ? `${t('create.generating')} ${stepsLabel(genStep, t)}` : `${t('create.finalize')} · ${cost} ${t('misc.creditsShort')}`}
              </button>
            )}
            <button type="button" onClick={() => setStep(2)} className="btn-ghost">{t('common.back')}</button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && (
        <div className="card-lux p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">{t('create.success')}</span>
          </div>
          {generatedImageUrl && (
            <div className="rounded-lg overflow-hidden border border-gold-600/20">
              <img src={generatedImageUrl} alt={projectName} className="w-full" />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {createdProject && (
              <button type="button" onClick={() => onNavigate('editor')} className="btn-gold">
                {t('create.openEditor')}
              </button>
            )}
            <button type="button" onClick={resetCreate} className="btn-ghost">{t('create.newProject')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function stepsLabel(index: number, t: (key: string) => string): string {
  const keys = ['gen.analyzing', 'gen.direction', 'gen.layout', 'gen.brand', 'gen.optimizing'];
  return t(keys[index] || 'gen.analyzing');
}

export default CreatePage;
