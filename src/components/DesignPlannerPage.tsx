import { useMemo, useState } from 'react';
import {
  Box, Check, Download, Grid3X3, Home, Layers3, Lightbulb,
  Network, Ruler, Save, Sparkles, Triangle, Wrench, X
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PreviewWatermark } from './PreviewWatermark';
import { useI18n } from '@/lib/i18n';
import { runDesignlyMasterAgent } from '@/lib/designly-agent';
import { generateDesign } from '@/lib/ai';
import { getCreditsForType } from '@/lib/constants';
import { CreditPurchaseModal } from './CreditPurchaseModal';

interface DesignPlannerPageProps {
  onNavigate: (page: string) => void;
}

const PLAN_TYPES = [
  { id: 'floor-plan', label: 'Alaprajz', icon: Home, desc: 'Helyiségek, méretek, ajtók, ablakok, közlekedés' },
  { id: 'electrical', label: 'Villamos terv', icon: Lightbulb, desc: 'Koncepció: világítási és dugalj-hálózat, áramkörök' },
  { id: 'plumbing', label: 'Gépészeti / víz', icon: Wrench, desc: 'Víz, lefolyó, gépészeti pontok koncepcionálisan' },
  { id: 'lighting', label: 'Világítási terv', icon: Lightbulb, desc: 'Lámpatestek, kapcsolások és zónák' },
  { id: 'hvac', label: 'Hőtechnika / HVAC', icon: Network, desc: 'Helyiségek és gépészeti pontok vázlata' },
  { id: 'interior', label: 'Belsőépítészet', icon: Layers3, desc: 'Bútorozás, térszervezés, anyag- és hangulatkoncepció' },
  { id: 'site-plan', label: 'Helyszínrajz', icon: Triangle, desc: 'Telek, épület, közlekedés és kert koncepció' },
  { id: 'roof', label: 'Tetőterv', icon: Grid3X3, desc: 'Tetőforma és funkcionális kiosztás' },
  { id: 'structural-concept', label: 'Szerkezeti koncepció', icon: Box, desc: 'Falak, pillérek, födém és terhelési logika vázlata' },
] as const;

const BODY_PRESETS = [
  { id: 'house-100', label: '100 m² családi ház', brief: 'kb. 100 m²-es egyszintes családi ház' },
  { id: 'house-80', label: '80 m² családi ház', brief: 'kb. 80 m²-es egyszintes családi ház' },
  { id: 'apartment-60', label: '60 m² lakás', brief: 'kb. 60 m²-es lakás' },
  { id: 'office-120', label: '120 m² iroda', brief: 'kb. 120 m²-es iroda' },
];

function buildPlannerPrompt(planLabel: string, userBrief: string, area: string, rooms: string, constraints: string, language: string) {
  return [
    'DESIGNLY PLANNER & VISUALIZER',
    'Create a clear professional CONCEPT PLAN / VISUALIZATION, not a certified engineering document.',
    'PLAN TYPE: ' + planLabel,
    'AREA: ' + area,
    'ROOM / ZONE PROGRAM: ' + rooms,
    'USER BRIEF: ' + userBrief,
    'CONSTRAINTS: ' + constraints,
    'LANGUAGE: ' + language,
    'Show a logical plan hierarchy, readable labels, clear zones, circulation and a clean technical presentation.',
    'For electrical / plumbing / HVAC / structural requests, show a conceptual network or schematic only. Do not invent compliance certificates, conductor sizing, structural reinforcement calculations or permit approval.',
  ].join('\n');
}

function exportPlanSpec(planType: string, planLabel: string, area: string, rooms: string, constraints: string, brief: string, imageUrl: string | null, finalImage: boolean) {
  const payload = {
    product: 'DESIGNLY PLANNER & VISUALIZER',
    planType,
    planLabel,
    area,
    rooms,
    constraints,
    brief,
    previewImageUrl: finalImage ? imageUrl : null,
    generatedAt: new Date().toISOString(),
    status: 'CONCEPT_ONLY_ENGINEERING_REVIEW_REQUIRED',
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'designly-planner-project.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function DesignPlannerPage({ onNavigate }: DesignPlannerPageProps) {
  const { lang } = useI18n();
  const { profile, isUnlimited, refreshProfile } = useAuth();
  const hu = lang === 'hu';
  const [planType, setPlanType] = useState('floor-plan');
  const [area, setArea] = useState('100 m²');
  const [rooms, setRooms] = useState('nappali-konyha, 3 hálószoba, 1 fürdőszoba, WC, előszoba, gépészeti helyiség');
  const [constraints, setConstraints] = useState('egyszintes, modern, jól szeparált hálózóna, sok természetes fény');
  const [brief, setBrief] = useState('Készíts egy 100 négyzetméteres, modern egyszintes családi ház koncepció alaprajzot, logikus közlekedéssel és jól használható helyiségarányokkal.');
  const [preview, setPreview] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewBrief, setPreviewBrief] = useState<Awaited<ReturnType<typeof runDesignlyMasterAgent>>['designBrief'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalLoading, setFinalLoading] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [approved, setApproved] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  const selectedPlan = useMemo(() => PLAN_TYPES.find((item) => item.id === planType) || PLAN_TYPES[0], [planType]);
  const finalCost = getCreditsForType('custom');
  const enough = isUnlimited || (profile?.credits ?? 0) >= finalCost;

  const choosePreset = (presetId: string) => {
    const preset = BODY_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setArea(preset.brief.includes('100') ? '100 m²' : preset.brief.match(/\d+/)?.[0] + ' m²');
    setBrief(preset.brief + ' részletes, funkcionális térszervezéssel.');
    setPreview(null);
    setPreviewId(null);
    setPreviewBrief(null);
    setFinalImage(null);
    setApproved(false);
  };

  const createPreview = async () => {
    if (brief.trim().length < 10 || loading || finalLoading) return;
    setLoading(true);
    setError('');
    setPreview(null);
    setPreviewId(null);
    setPreviewBrief(null);
    setFinalImage(null);
    setApproved(false);
    const result = await runDesignlyMasterAgent({
      brief: buildPlannerPrompt(selectedPlan.label, brief, area, rooms, constraints, lang),
      language: lang,
      mode: 'preview',
      requestedOutputs: ['custom'],
    });
    setLoading(false);
    if (!result.success || !result.designBrief) {
      setError(result.message || 'A tervezési előnézet nem készült el.');
      return;
    }
    setPreview(result.previewImageUrl || null);
    setPreviewId(result.previewId || null);
    setPreviewBrief(result.designBrief);
  };

  const continueToFinal = async () => {
    if (!previewId || finalLoading) return;
    if (!enough) {
      setShowCredits(true);
      return;
    }
    setFinalLoading(true);
    setError('');
    const result = await generateDesign({
      mode: 'final',
      type: 'custom',
      brief: buildPlannerPrompt(selectedPlan.label, brief, area, rooms, constraints, lang),
      previewId,
      format: 'planner-concept:' + planType,
    });
    setFinalLoading(false);
    if (!result.success) {
      if (result.errorCode === 'INSUFFICIENT_CREDITS') setShowCredits(true);
      else setError(result.message || 'A végleges tervkoncepció nem sikerült.');
      return;
    }
    setFinalImage((result.result?.imageUrl as string) || null);
    setApproved(true);
    await refreshProfile();
  };

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-gold-600/20 bg-[#080a0b] p-6 lg:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(67,139,175,.16),transparent_34%),radial-gradient(circle_at_18%_85%,rgba(214,170,74,.08),transparent_30%)]" />
        <div className="relative grid lg:grid-cols-[1.08fr_.92fr] gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-gold-300 text-[10px] uppercase tracking-[.28em]">
              <Ruler className="w-4 h-4" /> DESIGNLY PLANNER & VISUALIZER
            </div>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-semibold text-cream-50">
              {hu ? 'Tervezd meg. Lásd előre. Dolgozd ki.' : 'Plan it. Visualize it. Refine it.'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cream-200/60">
              {hu
                ? 'Írd le természetes nyelven, mit szeretnél: alaprajz, villamos tervkoncepció, gépészet, világítás, belsőépítészet, helyszínrajz és további műszaki vizualizációk.'
                : 'Describe what you need in natural language: floor plans, electrical concepts, lighting, HVAC, interior layouts, site plans and more.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip border-gold-500/30 bg-gold-500/10 text-gold-200"><Sparkles className="w-3.5 h-3.5" /> Ingyenes előnézet</span>
              <span className="chip border-gold-500/15">AI tervező</span>
              <span className="chip border-gold-500/15">Nagy nézet</span>
              <span className="chip border-gold-500/15">Koncept / műszaki vázlat</span>
            </div>
          </div>
          <div className="relative min-h-[260px] rounded-2xl border border-white/10 bg-[#f1eee8] p-4 overflow-hidden">
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(#d8d2c8 1px, transparent 1px), linear-gradient(90deg,#d8d2c8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative mx-auto mt-5 w-[88%] h-[210px] border-4 border-black/75 bg-[#fbfaf7]">
              <div className="absolute left-0 top-0 w-[42%] h-[54%] border-r-2 border-b-2 border-black/60"><span className="absolute inset-0 grid place-items-center text-xs font-semibold text-black/55">NAPPALI</span></div>
              <div className="absolute right-0 top-0 w-[58%] h-[54%]"><div className="absolute left-0 top-0 w-[50%] h-full border-r-2 border-b-2 border-black/60" /><div className="absolute right-0 top-0 w-[50%] h-full border-b-2 border-black/60" /><span className="absolute inset-x-0 bottom-3 text-center text-[10px] text-black/45">HÁLÓ / HÁLÓ / FÜRDŐ</span></div>
              <div className="absolute left-0 bottom-0 w-full h-[46%] border-t-2 border-black/60"><span className="absolute inset-0 grid place-items-center text-sm font-semibold text-black/45">KONYHA · ÉTKEZŐ · KÖZLEKEDÉS</span></div>
            </div>
            <div className="absolute right-4 top-4 chip text-[8px] bg-black/75 text-white border-black/10">100 m² CONCEPT</div>
          </div>
        </div>
      </section>

      <section className="card-lux p-5 lg:p-6">
        <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">MIT TERVEZÜNK?</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PLAN_TYPES.map((item) => {
                const Icon = item.icon;
                return (
                  <button type="button" key={item.id} onClick={() => setPlanType(item.id)} className={`text-left rounded-xl border p-3 transition-all ${planType === item.id ? 'border-gold-500/40 bg-gold-500/10' : 'border-gold-600/10 bg-black/15 hover:border-gold-600/25'}`}>
                    <Icon className="w-5 h-5 text-gold-300" />
                    <div className="mt-2 text-sm font-medium text-cream-50">{item.label}</div>
                    <div className="mt-1 text-[10px] leading-4 text-cream-300/45">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">GYORS KEZDÉS</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {BODY_PRESETS.map((preset) => (
                <button type="button" key={preset.id} onClick={() => choosePreset(preset.id)} className="chip border-gold-600/15 text-cream-200/70 hover:border-gold-500/35">{preset.label}</button>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <input value={area} onChange={(e) => setArea(e.target.value)} className="input-lux" placeholder="Méret / terület" />
              <input value={rooms} onChange={(e) => setRooms(e.target.value)} className="input-lux md:col-span-2" placeholder="Helyiségek / zónák" />
              <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={3} className="input-lux resize-none md:col-span-3" placeholder="Megkötések, stílus, elvárások..." />
            </div>
          </div>
        </div>
      </section>

      <section className="card-lux p-5 lg:p-7 border-gold-500/20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">TERMÉSZETES NYELVŰ TERVEZÉS</div>
            <h2 className="text-xl lg:text-2xl font-display text-cream-50 mt-1">{selectedPlan.label} AI brief</h2>
          </div>
          <span className="chip border-gold-600/15">{selectedPlan.desc}</span>
        </div>
        <textarea value={brief} onChange={(e) => { setBrief(e.target.value); setError(''); }} rows={7} className="input-lux resize-none mt-4" placeholder="Írd le pontosan, mit szeretnél..." />
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={createPreview} disabled={loading || brief.trim().length < 10} className="btn-gold">
            {loading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'ELŐNÉZET KÉSZÜL…' : 'INGYENES AI ELŐNÉZET'}
          </button>
          <button type="button" onClick={() => exportPlanSpec(planType, selectedPlan.label, area, rooms, constraints, brief, finalImage, Boolean(finalImage))} disabled={!finalImage} className="btn-ghost disabled:opacity-30">
            <Download className="w-4 h-4" /> {finalImage ? 'VÉGLEGES TERVSPEC EXPORT' : 'TERVSPEC · JÓVÁHAGYÁS UTÁN'}
          </button>
          {finalImage && (
            <a href={finalImage} download target="_blank" rel="noreferrer" className="btn-ghost">
              <Download className="w-4 h-4" /> VÉGLEGES KÉP LETÖLTÉSE
            </a>
          )}
          <button type="button" onClick={() => onNavigate('projects')} className="btn-ghost">
            <Save className="w-4 h-4" /> PROJEKTEK
          </button>
        </div>
        {error && <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>}
      </section>

      {(loading || preview || finalImage) && (
        <section className="card-lux overflow-hidden border-gold-600/20">
          <div className="p-4 lg:p-5 border-b border-gold-600/15 flex items-center justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] text-gold-300/70">VISUAL PREVIEW</div>
              <div className="text-lg font-display text-cream-50 mt-1">{selectedPlan.label} · {area}</div>
            </div>
            <span className="chip border-gold-600/15">{finalImage ? 'VÉGLEGES' : 'AI ELŐNÉZET · 0 KREDIT'}</span>
          </div>
          <div className="bg-[#030404] p-2 sm:p-5 lg:p-8">
            <div className="relative mx-auto w-full max-w-[1500px] min-h-[420px] rounded-2xl bg-[#f1eee8] overflow-hidden border border-gold-600/15 shadow-2xl">
              {loading ? (
                <div className="min-h-[420px] grid place-items-center text-black/45">
                  <div className="text-center"><Sparkles className="w-10 h-10 mx-auto mb-3 animate-pulse" /><div className="text-xs uppercase tracking-[.22em]">AI PLANNER · GENERÁLÁS</div></div>
                </div>
              ) : (finalImage || preview) ? (
                <div className="relative w-full max-h-[850px] overflow-hidden">
                  <img src={finalImage || preview || ''} alt="DESIGNLY Planner preview" className="block w-full max-h-[850px] object-contain select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                  {!finalImage && <PreviewWatermark projectName="DESIGNLY PLANNER" />}
                </div>
              ) : null
            </div>
          </div>
          {previewBrief && (
            <div className="p-5 border-t border-gold-600/15 bg-black/20">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Vizuális irány', previewBrief.visualStyle || 'Technical concept'],
                  ['Hangulat', previewBrief.mood || 'Precise / clean'],
                  ['Képi irány', previewBrief.imageryDirection || 'Plan / schematic'],
                  ['Színek', [...previewBrief.primaryColors, ...previewBrief.secondaryColors].slice(0, 4).join(', ') || 'Black / White'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-gold-600/10 bg-ink-900/50 p-3">
                    <div className="text-[9px] uppercase tracking-[.16em] text-gold-300/65">{label}</div>
                    <div className="text-xs text-cream-100 mt-1">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[.2em] text-gold-300/65">KÖVETKEZŐ LÉPÉS</div>
                  <div className="text-lg font-display text-cream-50 mt-1">{isUnlimited ? '∞ kredit' : finalCost + ' kredit'}</div>
                  <div className="text-xs text-cream-300/45 mt-1">A koncepció előnézete ingyenes. A végleges változat csak jóváhagyás után készül.</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => { setPreview(null); setPreviewId(null); setPreviewBrief(null); setFinalImage(null); setApproved(false); }} className="btn-ghost">
                    <X className="w-4 h-4" /> MÓDOSÍTOM
                  </button>
                  {!approved ? (
                    <button type="button" onClick={continueToFinal} disabled={!previewId || finalLoading} className="btn-gold">
                      {finalLoading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Check className="w-4 h-4" />}
                      {finalLoading ? 'VÉGLEGES TERV KÉSZÜL…' : 'TETSZIK · FOLYTATÁS'}
                    </button>
                  ) : (
                    <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-200"><Check className="w-3.5 h-3.5" /> KÉSZ · VÉGLEGES KONCEPCIÓ</span>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-gold-600/15 bg-amber-500/5 p-4 text-xs text-cream-300/60">
                <strong className="text-gold-200">Fontos:</strong> ez tervezési/vizualizációs koncepció. Engedélyezési dokumentációhoz, statikai számításhoz, villamos méretezéshez és kivitelezéshez jogosult szakember ellenőrzése szükséges.
              </div>
            </div>
          )}
        </section>
      )}

      <CreditPurchaseModal open={showCredits} onCreditsUpdated={refreshProfile} onClose={() => setShowCredits(false)} onNavigate={onNavigate} currentCredits={profile?.credits} reason="A végleges tervezési koncepció elkészítéséhez kredit szükséges." />
    </div>
  );
}
