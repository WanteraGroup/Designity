import { useMemo, useState } from 'react';
import {
  Bookmark, ChevronDown, Check, Crown, Download, Filter, Heart, LayoutTemplate,
  Printer, Save, Search, Sparkles, Users, Wand2, X
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { runDesignlyMasterAgent } from '@/lib/designly-agent';
import { generateDesign } from '@/lib/ai';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { getCreditsForType } from '@/lib/constants';

type TattooCategory = {
  id: string;
  name: string;
  description: string;
  motifs: string[];
  count: number;
  glyph: string;
};

type TattooStyle =
  | 'Blackwork'
  | 'Fine Line'
  | 'Traditional'
  | 'Neo Traditional'
  | 'Realistic'
  | 'Ornamental'
  | 'Geometric'
  | 'Tribal'
  | 'Lettering'
  | 'Japanese';

type BodyPart =
  | 'forearm'
  | 'upper-arm'
  | 'chest'
  | 'back'
  | 'thigh'
  | 'calf'
  | 'neck'
  | 'ribs'
  | 'hand';

type BodyVariant = 'masculine' | 'feminine';

type TattooDesign = {
  id: number;
  category: TattooCategory;
  variant: number;
  motif: string;
  title: string;
};

const CATEGORIES: TattooCategory[] = [
  { id: 'dragon', name: 'Sárkányok', description: 'Keleti, fantasy, kínai és japán sárkány flash minták.', motifs: ['sárkány', 'szárny', 'láng', 'kígyótest', 'karmok'], count: 900, glyph: 'DR' },
  { id: 'rose', name: 'Rózsák & virágok', description: 'Rózsa, peónia, liliom, bazsarózsa és botanika.', motifs: ['rózsa', 'peónia', 'liliom', 'levelek', 'tüske'], count: 850, glyph: 'RO' },
  { id: 'skull', name: 'Koponyák', description: 'Koponya, kaszás, csont és dark flash kollekciók.', motifs: ['koponya', 'kaszás', 'csont', 'díszítés', 'láng'], count: 800, glyph: 'SK' },
  { id: 'cross', name: 'Keresztek & vallási', description: 'Kereszt, rózsafüzér, szent szimbólumok és ornamentika.', motifs: ['kereszt', 'rózsafüzér', 'szárny', 'glória', 'ornament'], count: 650, glyph: 'CR' },
  { id: 'lettering', name: 'Feliratok', description: 'Nevek, idézetek, dátumok és custom lettering.', motifs: ['név', 'idézet', 'dátum', 'gótikus betű', 'kézírás'], count: 800, glyph: 'LT' },
  { id: 'maori', name: 'Maori & Polinéz', description: 'Törzsi, polinéz, samoai és geometrikus rendszerek.', motifs: ['spirál', 'harcos', 'óceán', 'napszimbólum', 'törzsi ív'], count: 800, glyph: 'MO' },
  { id: 'celtic', name: 'Kelta', description: 'Kelta csomók, rúnák, hollók, farkasok és sárkányok.', motifs: ['kelta csomó', 'runa', 'holló', 'farkas', 'sárkány'], count: 750, glyph: 'KE' },
  { id: 'japanese', name: 'Japán', description: 'Irezumi ihlette koi, hannya, tigris, hullám és krizantém.', motifs: ['koi', 'hannya', 'tigris', 'hullám', 'krizantém'], count: 800, glyph: 'JP' },
  { id: 'geometric', name: 'Geometrikus', description: 'Mandala, sacred geometry, linework és szerkesztett formák.', motifs: ['mandala', 'fraktál', 'kör', 'vonal', 'szimmetria'], count: 700, glyph: 'GE' },
  { id: 'animal', name: 'Állatok', description: 'Farkas, medve, sas, oroszlán, kígyó, szarvas.', motifs: ['farkas', 'sas', 'oroszlán', 'szarvas', 'kígyó'], count: 850, glyph: 'AN' },
  { id: 'bird', name: 'Madarak', description: 'Holló, sas, bagoly, főnix és tollas kompozíciók.', motifs: ['holló', 'sas', 'bagoly', 'főnix', 'toll'], count: 650, glyph: 'BD' },
  { id: 'minimal', name: 'Minimal & Fine Line', description: 'Apró, finom, egyvonalas és letisztult minták.', motifs: ['vonal', 'pont', 'szimbólum', 'botanika', 'csillag'], count: 700, glyph: 'MF' },
  { id: 'ornamental', name: 'Ornament & Mandala', description: 'Dekoratív körök, csipkeminták és ornamentális kompozíciók.', motifs: ['mandala', 'csipke', 'ornament', 'szimmetria', 'pontozás'], count: 750, glyph: 'OR' },
  { id: 'oldschool', name: 'Old School', description: 'Klasszikus hajó, rózsa, kígyó, tőr, szív és tradicionális flash.', motifs: ['hajó', 'tőr', 'szív', 'kígyó', 'rózsa'], count: 600, glyph: 'OS' },
  { id: 'gothic', name: 'Gothic & Dark', description: 'Sötét ornamentika, gótikus motívumok és blackwork.', motifs: ['gótika', 'korona', 'sötét angyal', 'runa', 'tüske'], count: 700, glyph: 'GD' },
  { id: 'symbol', name: 'Szimbólumok', description: 'Rúnák, csillagképek, szakrális jelek és személyes ikonok.', motifs: ['runa', 'nap', 'hold', 'csillag', 'szem'], count: 600, glyph: 'SY' },
];

const STYLES: TattooStyle[] = [
  'Blackwork', 'Fine Line', 'Traditional', 'Neo Traditional', 'Realistic',
  'Ornamental', 'Geometric', 'Tribal', 'Lettering', 'Japanese',
];

const PALETTES = ['Black / White', 'Black / Grey', 'Red accent', 'Gold accent', 'Mono line'];

const BODY_PARTS: Array<{ id: BodyPart; name: string }> = [
  { id: 'forearm', name: 'Alkar' },
  { id: 'upper-arm', name: 'Felkar' },
  { id: 'chest', name: 'Mellkas' },
  { id: 'back', name: 'Hát' },
  { id: 'thigh', name: 'Comb' },
  { id: 'calf', name: 'Vádli' },
  { id: 'neck', name: 'Nyak' },
  { id: 'ribs', name: 'Borda' },
  { id: 'hand', name: 'Kézfej' },
];

function motifFor(category: TattooCategory, variant: number) {
  return category.motifs[variant % category.motifs.length];
}

function previewDensity(variant: number, style: TattooStyle) {
  const base = style === 'Fine Line' || style === 'Geometric' ? 14 : 24;
  return base + (variant % 6) * 5;
}

function artClass(categoryId: string, style: TattooStyle, variant: number) {
  const fine = style === 'Fine Line' || style === 'Geometric' || style === 'Lettering';
  return [
    'tattoo-art',
    `tattoo-art-${categoryId}`,
    fine ? 'tattoo-art-fine' : 'tattoo-art-heavy',
    `tattoo-art-v${variant % 5}`,
  ].join(' ');
}

function printFlashSheet(designs: TattooDesign[], studioName: string) {
  const rows = designs.slice(0, 9).map((design) => `
    <article class="card">
      <div class="art"><div class="seal">${design.category.glyph}</div><div class="crosshair"></div><div class="ring"></div></div>
      <div class="category">${design.category.name}</div>
      <h3>${design.title}</h3>
      <div class="motif">${design.motif}</div>
    </article>`).join('');

  const html = `<!doctype html><html lang="hu"><head><meta charset="utf-8"><title>${studioName} · Flash Sheet</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f2eee7;color:#111;font-family:Arial,sans-serif;padding:22mm}
    h1{font-family:Georgia,serif;margin:0 0 4px;font-size:28px;letter-spacing:.04em}
    .meta{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#666;margin-bottom:18px}
    .sheet{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}
    .card{background:#fff;border:1px solid #bbb;padding:8px;break-inside:avoid}
    .art{position:relative;aspect-ratio:1/1.12;background:#faf8f3;display:grid;place-items:center;overflow:hidden}
    .seal{width:42%;height:42%;border:3px solid #111;border-radius:50%;display:grid;place-items:center;font:700 12px Georgia;color:#111}
    .ring{position:absolute;inset:16%;border:1px solid #111;border-radius:50%}
    .crosshair{position:absolute;width:70%;height:1px;background:#111;transform:rotate(38deg)}
    .category{font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:#555;margin-top:7px}
    h3{font:600 13px Georgia;margin:4px 0}
    .motif{font-size:9px;color:#777;text-transform:uppercase;letter-spacing:.12em}
  </style></head><body><h1>${studioName}</h1><div class="meta">DESIGNLY TATTOO · FLASH SHEET · ${new Date().toLocaleDateString('hu-HU')}</div><div class="sheet">${rows}</div><script>window.onload=()=>window.print();</script></body></html>`;

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
}

function TattooArt({ design, style }: { design: TattooDesign; style: TattooStyle }) {
  const density = previewDensity(design.variant, style);
  return (
    <div className="tattoo-art-wrap">
      <div
        className={artClass(design.category.id, style, design.variant)}
        style={{ ['--tattoo-density' as string]: `${density}px` }}
      >
        <div className="tattoo-art-seal">{design.category.glyph}</div>
        <div className="tattoo-art-orbit" />
        <div className="tattoo-art-line tattoo-art-line-a" />
        <div className="tattoo-art-line tattoo-art-line-b" />
        <div className="tattoo-art-core" />
      </div>
      <span className="tattoo-art-label">{design.motif}</span>
    </div>
  );
}

function BodyPreview({
  bodyPart,
  variant,
  design,
  style,
}: {
  bodyPart: BodyPart;
  variant: BodyVariant;
  design: TattooDesign | null;
  style: TattooStyle;
}) {
  const placementNames: Record<BodyPart, string> = Object.fromEntries(BODY_PARTS.map((item) => [item.id, item.name])) as Record<BodyPart, string>;
  return (
    <div className="tattoo-body-stage">
      <div className={`tattoo-body ${variant === 'feminine' ? 'tattoo-body-feminine' : 'tattoo-body-masculine'}`}>
        <div className="tattoo-body-head" />
        <div className="tattoo-body-neck" />
        <div className="tattoo-body-torso" />
        <div className="tattoo-body-arm tattoo-body-arm-left" />
        <div className="tattoo-body-arm tattoo-body-arm-right" />
        <div className="tattoo-body-hand tattoo-body-hand-left" />
        <div className="tattoo-body-hand tattoo-body-hand-right" />
        <div className="tattoo-body-leg tattoo-body-leg-left" />
        <div className="tattoo-body-leg tattoo-body-leg-right" />
        <div className="tattoo-body-knee tattoo-body-knee-left" />
        <div className="tattoo-body-knee tattoo-body-knee-right" />
        <div className={`tattoo-body-placement tattoo-place-${bodyPart}`}>
          {design ? (
            <div className="tattoo-placement-art">
              <TattooArt design={design} style={style} />
            </div>
          ) : (
            <span>Válassz mintát</span>
          )}
        </div>
      </div>
      <div className="text-[9px] uppercase tracking-[.2em] text-cream-300/45 mt-3 text-center">
        Elhelyezés: {placementNames[bodyPart]} · {variant === 'feminine' ? 'Női testpreview' : 'Férfi testpreview'}
      </div>
    </div>
  );
}

export function TattooLibraryPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { lang } = useI18n();
  const { profile, isOwner, refreshProfile } = useAuth();
  const hu = lang === 'hu';
  const [category, setCategory] = useState('all');
  const [style, setStyle] = useState<'All' | TattooStyle>('All');
  const [palette, setPalette] = useState('All');
  const [bodyPart, setBodyPart] = useState<BodyPart>('forearm');
  const [bodyVariant, setBodyVariant] = useState<BodyVariant>('masculine');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<TattooDesign | null>(null);
  const [flashSheetOpen, setFlashSheetOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [consultationClient, setConsultationClient] = useState('');
  const [consultationNote, setConsultationNote] = useState('');
  const [consultationSelection, setConsultationSelection] = useState<number[]>([]);
  const [aiIdea, setAiIdea] = useState('');
  const [aiPreviewImage, setAiPreviewImage] = useState<string | null>(null);
  const [aiPreviewId, setAiPreviewId] = useState<string | null>(null);
  const [aiPreviewBrief, setAiPreviewBrief] = useState<Awaited<ReturnType<typeof runDesignlyMasterAgent>>['designBrief'] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFinalLoading, setAiFinalLoading] = useState(false);
  const [aiFinalUrl, setAiFinalUrl] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const tattooFinalCost = getCreditsForType('custom');

  const total = CATEGORIES.reduce((sum, item) => sum + item.count, 0);
  const selectedCategory = CATEGORIES.find((item) => item.id === category);


  const buildTattooBrief = () => [
    'DESIGNLY TATTOO AI',
    'Create a professional custom tattoo concept for a tattoo studio.',
    'CLIENT IDEA: ' + aiIdea.trim(),
    'CATEGORY: ' + (selectedCategory?.name || 'Custom'),
    'STYLE: ' + (style === 'All' ? 'Choose the best matching tattoo style' : style),
    'PALETTE: ' + (palette === 'All' ? 'Black / Grey with clean negative space' : palette),
    'BODY PART: ' + (BODY_PARTS.find((item) => item.id === bodyPart)?.name || bodyPart),
    'BODY VIEW: ' + (bodyVariant === 'feminine' ? 'feminine' : 'masculine'),
    'Requirements: stencil-ready line hierarchy, readable silhouette, professional negative space, tattoo reference concept rather than a photo mockup.',
  ].join('\n');

  const generateTattooPreview = async () => {
    if (aiIdea.trim().length < 8 || aiLoading || aiFinalLoading) return;
    setAiError(null);
    setAiPreviewImage(null);
    setAiPreviewId(null);
    setAiPreviewBrief(null);
    setAiFinalUrl(null);
    setAiLoading(true);
    const result = await runDesignlyMasterAgent({
      brief: buildTattooBrief(),
      language: lang,
      mode: 'preview',
      requestedOutputs: ['custom'],
    });
    setAiLoading(false);
    if (!result.success || !result.designBrief) {
      setAiError(result.message || 'Az AI előnézet nem készült el.');
      return;
    }
    setAiPreviewImage(result.previewImageUrl || null);
    setAiPreviewId(result.previewId || null);
    setAiPreviewBrief(result.designBrief);
  };

  const continueWithTattoo = async () => {
    if (!aiPreviewId || aiFinalLoading) return;
    if (!isOwner && (profile?.credits ?? 0) < tattooFinalCost) {
      setShowCreditModal(true);
      return;
    }
    setAiFinalLoading(true);
    setAiError(null);
    const result = await generateDesign({
      mode: 'final',
      type: 'custom',
      brief: buildTattooBrief(),
      previewId: aiPreviewId,
    });
    setAiFinalLoading(false);
    if (!result.success) {
      if (result.errorCode === 'INSUFFICIENT_CREDITS') setShowCreditModal(true);
      else setAiError(result.message || 'A végleges AI tetoválás nem sikerült.');
      return;
    }
    setAiFinalUrl((result.result?.imageUrl as string) || null);
    await refreshProfile();
  };

  const designs = useMemo<TattooDesign[]>(() => {
    const pool = category === 'all' ? CATEGORIES : CATEGORIES.filter((item) => item.id === category);
    const q = search.trim().toLowerCase();
    const rows: TattooDesign[] = [];
    let id = 1;
    for (const cat of pool) {
      const localMax = Math.min(cat.count, 60);
      for (let i = 0; i < localMax; i += 1) {
        const motif = motifFor(cat, i);
        const title = `${cat.name} · ${motif} · ${String(i + 1).padStart(3, '0')}`;
        if (!q || title.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q) || motif.includes(q)) {
          rows.push({ id: id++, category: cat, variant: i, motif, title });
        }
      }
    }
    return rows;
  }, [category, search]);

  const toggleFavorite = (id: number) => {
    setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };

  const toggleConsultationSelection = (id: number) => {
    setConsultationSelection((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id].slice(-12));
  };

  const saveConsultation = () => {
    const payload = {
      client: consultationClient.trim() || 'Név nélküli kliens',
      note: consultationNote.trim(),
      bodyPart,
      bodyVariant,
      selections: consultationSelection,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('designly_tattoo_consultation', JSON.stringify(payload));
    setConsultationOpen(false);
  };

  const exportConsultation = () => {
    const payload = {
      client: consultationClient.trim() || 'Név nélküli kliens',
      note: consultationNote.trim(),
      bodyPart,
      bodyVariant,
      selections: consultationSelection,
      designs: designs.filter((item) => consultationSelection.includes(item.id)).slice(0, 12),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'designly-tattoo-consultation.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-gold-600/20 bg-[#090a0b] p-6 lg:p-9">
        <div className="absolute inset-0 opacity-45" style={{ background: 'radial-gradient(circle at 78% 25%, rgba(214,170,74,.18), transparent 26%), radial-gradient(circle at 20% 80%, rgba(255,255,255,.06), transparent 30%)' }} />
        <div className="relative grid lg:grid-cols-[1.2fr_.8fr] gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-gold-300 text-[10px] uppercase tracking-[.28em]">
              <LayoutTemplate className="w-4 h-4" />
              DESIGNLY TATTOO LIBRARY
            </div>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-semibold text-cream-50">
              {hu ? 'Tetoválás mintakönyvtár szalonoknak.' : 'Tattoo template library for studios.'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cream-200/60">
              {hu
                ? 'Külön, szalonokra optimalizált flash könyvtár több ezer kategorizált mintakoncepcióval. Sárkányok, rózsák, keresztek, feliratok, koponyák, maori, kelta és még sok más.'
                : 'A dedicated studio-ready flash library with thousands of categorized tattoo concepts.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip border-gold-500/30 bg-gold-500/10 text-gold-200">
                {total.toLocaleString('hu-HU')} mintakoncepció
              </span>
              <span className="chip border-gold-500/15"><Users className="w-3.5 h-3.5" /> Szalon mód</span>
              <span className="chip border-gold-500/15"><Crown className="w-3.5 h-3.5" /> PRO könyvtár</span>
            </div>
          </div>

          <div className="relative min-h-[250px] rounded-2xl border border-white/10 bg-[#f3eee5] overflow-hidden flex items-center justify-center">
            <div className="tattoo-hero-dragon">
              <div className="tattoo-hero-wing tattoo-hero-wing-a" />
              <div className="tattoo-hero-wing tattoo-hero-wing-b" />
              <div className="tattoo-hero-body" />
              <div className="tattoo-hero-head">DR</div>
              <div className="tattoo-hero-tail" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-[9px] uppercase tracking-[.25em] text-black/55">Celtic / Dragon / Flash Reference</div>
          </div>
        </div>
      </section>

      <section className="card-lux p-5 lg:p-7 border-gold-500/20 bg-[radial-gradient(circle_at_82%_18%,rgba(214,170,74,.13),transparent_34%),#080a0b]">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-6 items-start">
          <div>
            <div className="flex items-center gap-2 text-gold-300 text-[10px] uppercase tracking-[.25em]">
              <Wand2 className="w-4 h-4" /> AI TETOVÁLÁS STUDIO
            </div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-display text-cream-50">Írd le az elképzelésedet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-cream-300/55">Az AI először egy ingyenes látványtervet készít. Megnézed, változtatsz rajta, majd a „Tetszik · Folytatás” gombbal indíthatod a végleges mintát.</p>
            <textarea
              value={aiIdea}
              onChange={(event) => {
                setAiIdea(event.target.value);
                setAiError(null);
                setAiFinalUrl(null);
                setAiPreviewImage(null);
                setAiPreviewId(null);
                setAiPreviewBrief(null);
              }}
              rows={6}
              className="input-lux resize-none mt-5"
              placeholder="Példa: nagy, részletes kelta sárkány az alkar külső oldalára, fekete-szürke blackwork, rúnákkal, erős körvonallal, tiszta negatív térrel..."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip border-gold-600/15">Stílus: {style}</span>
              <span className="chip border-gold-600/15">Paletta: {palette}</span>
              <span className="chip border-gold-600/15">Testrész: {BODY_PARTS.find((item) => item.id === bodyPart)?.name}</span>
            </div>
            <button type="button" onClick={generateTattooPreview} disabled={aiIdea.trim().length < 8 || aiLoading} className="btn-gold mt-5">
              {aiLoading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Wand2 className="w-4 h-4" />}
              {aiLoading ? 'AI ELŐNÉZET KÉSZÜL…' : 'INGYENES AI ELŐNÉZET'}
            </button>
            {aiError && <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-200">{aiError}</div>}
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#f2ede5] min-h-[360px] overflow-hidden">
            {aiLoading ? (
              <div className="min-h-[360px] grid place-items-center text-black/45">
                <div className="text-center"><Sparkles className="w-9 h-9 mx-auto mb-3 animate-pulse" /><div className="text-xs uppercase tracking-[.22em]">TATTOO AI · TERVEZÉS</div></div>
              </div>
            ) : aiPreviewImage ? (
              <div className="relative min-h-[360px] flex items-center justify-center p-4">
                <img src={aiPreviewImage} alt="AI tattoo preview" className="max-h-[560px] w-full object-contain select-none" draggable={false} />
                <div className="absolute top-3 left-3 chip text-[8px] border-black/10 bg-white/80 text-black/60">AI ELŐNÉZET · 0 KREDIT</div>
              </div>
            ) : (
              <div className="min-h-[360px] grid place-items-center text-center px-7">
                <div className="text-black/42"><LayoutTemplate className="w-11 h-11 mx-auto mb-3 opacity-35" /><div className="text-sm">Az AI által készített előnézet itt jelenik meg.</div><div className="mt-2 text-[9px] uppercase tracking-[.2em]">ÖTLET → AI → ELŐNÉZET</div></div>
              </div>
            )}
          </div>
        </div>
        {aiPreviewBrief && (
          <div className="mt-5 rounded-2xl border border-gold-600/15 bg-black/25 p-5">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Visual direction', aiPreviewBrief.visualStyle || 'Tattoo concept'],
                ['Mood', aiPreviewBrief.mood || 'Refined'],
                ['Imagery', aiPreviewBrief.imageryDirection || 'Linework'],
                ['Colors', [...aiPreviewBrief.primaryColors, ...aiPreviewBrief.secondaryColors].slice(0, 4).join(', ') || 'Black / Grey'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-gold-600/10 bg-ink-900/50 p-3">
                  <div className="text-[9px] uppercase tracking-[.16em] text-gold-300/65">{label}</div>
                  <div className="mt-1 text-xs text-cream-100">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-[.22em] text-gold-300/65">VÉGLEGES MINTA</div>
                <div className="text-lg font-display text-cream-50 mt-1">{isOwner ? '∞ kredit' : tattooFinalCost + ' kredit'}</div>
                <div className="text-xs text-cream-300/45 mt-1">Az előnézet ingyenes. A végleges generálás csak a jóváhagyás után indul.</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => { setAiPreviewImage(null); setAiPreviewId(null); setAiPreviewBrief(null); setAiFinalUrl(null); }} className="btn-ghost">MÓDOSÍTOM</button>
                {!aiFinalUrl ? (
                  <button type="button" onClick={continueWithTattoo} disabled={aiFinalLoading || !aiPreviewId} className="btn-gold">
                    {aiFinalLoading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Check className="w-4 h-4" />}
                    {aiFinalLoading ? 'VÉGLEGES MINTA KÉSZÜL…' : 'TETSZIK · FOLYTATÁS'}
                  </button>
                ) : (
                  <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-200"><Check className="w-3.5 h-3.5" /> VÉGLEGES MINTA ELKÉSZÜLT</span>
                )}
              </div>
            </div>
            {aiFinalUrl && (
              <div className="mt-5 overflow-hidden rounded-xl border border-gold-600/20 bg-[#f2ede5]">
                <img src={aiFinalUrl} alt="Végleges AI tattoo design" className="block w-full max-h-[820px] object-contain select-none" draggable={false} />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card-lux p-4 lg:p-5">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-lux pl-10" placeholder="Keresés: sárkány, rózsa, név, kelta..." />
          </div>
          <select value={style} onChange={(e) => setStyle(e.target.value as 'All' | TattooStyle)} className="input-lux xl:w-44">
            <option value="All">Minden stílus</option>
            {STYLES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={palette} onChange={(e) => setPalette(e.target.value)} className="input-lux xl:w-44">
            <option value="All">Minden paletta</option>
            {PALETTES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" onClick={() => setFlashSheetOpen(true)} className="btn-gold whitespace-nowrap">
            <Printer className="w-4 h-4" /> Flash Sheet
          </button>
          <button type="button" onClick={() => setConsultationOpen(true)} className="btn-ghost whitespace-nowrap">
            <Users className="w-4 h-4" /> Konzultáció
          </button>
        </div>
      </section>

      <section className="card-lux p-4 lg:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">TESTRÉSZ & ELHELYEZÉS</div>
            <div className="text-sm text-cream-100 mt-1">Mutasd meg a kliensnek a minta arányát és helyét.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setBodyVariant('masculine')} className={`chip ${bodyVariant === 'masculine' ? 'border-gold-500/40 bg-gold-500/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}>Férfi test</button>
            <button type="button" onClick={() => setBodyVariant('feminine')} className={`chip ${bodyVariant === 'feminine' ? 'border-gold-500/40 bg-gold-500/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}>Női test</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {BODY_PARTS.map((item) => (
            <button key={item.id} type="button" onClick={() => setBodyPart(item.id)} className={`chip ${bodyPart === item.id ? 'border-gold-500/40 bg-gold-500/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}>
              {item.name}
            </button>
          ))}
        </div>
        <div className="mt-6 grid lg:grid-cols-[1fr_1.1fr] gap-5 items-center">
          <BodyPreview bodyPart={bodyPart} variant={bodyVariant} design={selectedDesign} style={style === 'All' ? 'Blackwork' : style} />
          <div className="rounded-2xl border border-gold-600/15 bg-black/20 p-5">
            <div className="text-[9px] uppercase tracking-[.2em] text-gold-300/70">KIVÁLASZTOTT MINTA</div>
            {selectedDesign ? (
              <>
                <div className="mt-2 text-lg font-display text-cream-50">{selectedDesign.title}</div>
                <div className="mt-1 text-xs text-gold-300/70">{selectedDesign.category.name} · {selectedDesign.motif}</div>
                <p className="mt-3 text-xs text-cream-300/50 leading-6">{selectedDesign.category.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggleConsultationSelection(selectedDesign.id)} className="btn-gold text-xs">
                    {consultationSelection.includes(selectedDesign.id) ? 'Kivétel a konzultációból' : 'Konzultációhoz adás'}
                  </button>
                  <button type="button" onClick={() => setSelectedDesign(null)} className="btn-ghost text-xs">Törlés</button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-cream-300/45">Kattints egy mintára a lenti könyvtárban.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[250px_1fr] gap-5">
        <aside className="card-lux p-4 h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">KATEGÓRIÁK</div>
            <Filter className="w-4 h-4 text-cream-300/35" />
          </div>
          <div className="mt-4 space-y-1.5">
            <button type="button" onClick={() => setCategory('all')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${category === 'all' ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20' : 'text-cream-300/65 hover:bg-ink-800/60'}`}>
              <span>Összes minta</span><span className="text-[10px]">{total}</span>
            </button>
            {CATEGORIES.map((item) => (
              <button type="button" key={item.id} onClick={() => setCategory(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${category === item.id ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20' : 'text-cream-300/65 hover:bg-ink-800/60'}`}>
                <span className="truncate">{item.name}</span><span className="text-[10px] text-cream-400/35">{item.count}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          {selectedCategory && (
            <div className="rounded-xl border border-gold-600/15 bg-ink-900/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] uppercase tracking-[.22em] text-gold-300/70">KATEGÓRIA</div>
                  <div className="text-lg font-display text-cream-50 mt-1">{selectedCategory.name}</div>
                  <p className="text-xs text-cream-300/50 mt-1">{selectedCategory.description}</p>
                </div>
                <span className="chip border-gold-600/15">{selectedCategory.count} koncepció</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] uppercase tracking-[.18em] text-cream-400/45">
            <span>{designs.length} előnézet / {category === 'all' ? total : selectedCategory?.count} teljes koncepció</span>
            <span>{favorites.length} mentett · {consultationSelection.length} konzultációban</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {designs.map((design) => {
              const saved = favorites.includes(design.id);
              const selected = selectedDesign?.id === design.id;
              const inConsultation = consultationSelection.includes(design.id);
              return (
                <article key={design.id} className={`group card-lux overflow-hidden border-gold-600/10 hover:border-gold-500/35 transition-all ${selected ? 'ring-1 ring-gold-500/45' : ''}`}>
                  <button type="button" onClick={() => setSelectedDesign(design)} className="w-full text-left">
                    <div className="relative aspect-[4/5] bg-[#eee8dd] overflow-hidden">
                      <TattooArt design={design} style={style === 'All' ? 'Blackwork' : style} />
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                        <span className="chip text-[8px] border-black/10 bg-white/65 text-black/65">{design.category.name}</span>
                        <span className="text-[8px] uppercase tracking-[.2em] text-black/45">#{String(design.id).padStart(4, '0')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); toggleFavorite(design.id); }}
                        className={`absolute bottom-3 right-3 w-8 h-8 rounded-full border bg-white/70 backdrop-blur flex items-center justify-center ${saved ? 'border-red-500/40 text-red-500' : 'border-black/10 text-black/55'}`}
                        aria-label={saved ? 'Kedvencből kivétel' : 'Kedvencekhez adás'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                      </button>
                      {inConsultation && <span className="absolute bottom-3 left-3 chip text-[8px] border-gold-600/30 bg-black/65 text-gold-100">KONZULTÁCIÓ</span>}
                    </div>
                  </button>
                  <div className="p-3">
                    <div className="text-[9px] uppercase tracking-[.18em] text-gold-300/70">{design.motif}</div>
                    <div className="text-sm font-medium text-cream-100 mt-1 truncate">{design.title}</div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setSelectedDesign(design)} className="btn-gold flex-1 text-[10px] py-2">Elhelyezés</button>
                      <button type="button" onClick={() => toggleConsultationSelection(design.id)} className={`btn-ghost px-3 py-2 ${inConsultation ? 'border-gold-500/40 text-gold-200' : ''}`}>
                        <Bookmark className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-2xl border border-gold-600/15 bg-gradient-to-r from-gold-500/8 via-ink-950 to-transparent p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-gold-300 text-[10px] uppercase tracking-[.25em]"><Sparkles className="w-4 h-4" /> AI CUSTOM TATTOO</div>
              <h2 className="text-xl font-display text-cream-50 mt-2">{hu ? 'Saját mintát szeretnél?' : 'Need a custom tattoo design?'}</h2>
              <p className="text-sm text-cream-300/50 mt-1 max-w-2xl">{hu ? 'Írj egy briefet, válassz stílust, és a DESIGNLY alakítsa a szalonod következő egyedi mintáját.' : 'Write a brief, pick a style, and let DESIGNLY create the next custom studio concept.'}</p>
            </div>
            <button type="button" onClick={() => onNavigate('create')} className="btn-gold whitespace-nowrap"><Sparkles className="w-4 h-4" /> AI minta készítése</button>
          </div>
        </div>
      </section>

      {flashSheetOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto rounded-3xl border border-gold-600/25 bg-[#171717] shadow-2xl overflow-hidden">
            <div className="p-5 lg:p-7 border-b border-gold-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[.25em] text-gold-300/70">FLASH SHEET GENERATOR</div>
                <h2 className="text-2xl font-display text-cream-50 mt-1">Szalonlap · {designs.slice(0, 9).length} minta</h2>
                <p className="text-xs text-cream-300/45 mt-1">A4-szerű nyomtatható összeállítás az aktuális szűrésből.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => printFlashSheet(designs, 'DESIGNLY TATTOO STUDIO')} className="btn-gold text-xs"><Printer className="w-4 h-4" /> Nyomtatás</button>
                <button type="button" onClick={() => setFlashSheetOpen(false)} className="btn-ghost text-xs"><X className="w-4 h-4" /> Bezárás</button>
              </div>
            </div>
            <div className="bg-[#efeae1] p-5 lg:p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {designs.slice(0, 9).map((design) => (
                  <button key={design.id} type="button" onClick={() => { setSelectedDesign(design); setFlashSheetOpen(false); }} className="text-left bg-white border border-black/10 p-3 hover:border-black/30 transition-all">
                    <TattooArt design={design} style={style === 'All' ? 'Blackwork' : style} />
                    <div className="mt-2 text-[8px] uppercase tracking-[.18em] text-black/50">{design.category.name}</div>
                    <div className="text-sm font-semibold text-black mt-1">{design.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {consultationOpen && (
        <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto rounded-3xl border border-gold-600/25 bg-ink-950 shadow-2xl overflow-hidden">
            <div className="p-5 lg:p-7 border-b border-gold-600/15 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[.25em] text-gold-300/70">SALON CONSULTATION MODE</div>
                <h2 className="text-2xl font-display text-cream-50 mt-1">Kliens konzultációs lap</h2>
              </div>
              <button type="button" onClick={() => setConsultationOpen(false)} className="btn-ghost px-3 py-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5 p-5 lg:p-7">
              <div className="space-y-4">
                <input value={consultationClient} onChange={(e) => setConsultationClient(e.target.value)} className="input-lux" placeholder="Kliens neve" />
                <textarea value={consultationNote} onChange={(e) => setConsultationNote(e.target.value)} rows={6} className="input-lux resize-none" placeholder="Megjegyzés: méret, stílus, színek, elképzelés..." />
                <div className="rounded-xl border border-gold-600/15 bg-black/20 p-4">
                  <div className="text-[9px] uppercase tracking-[.2em] text-gold-300/70">ELHELYEZÉS</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip border-gold-600/20 text-gold-200">{BODY_PARTS.find((item) => item.id === bodyPart)?.name}</span>
                    <span className="chip border-gold-600/20 text-gold-200">{bodyVariant === 'feminine' ? 'Női test' : 'Férfi test'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={saveConsultation} className="btn-gold flex-1 text-xs"><Save className="w-4 h-4" /> Mentés</button>
                  <button type="button" onClick={exportConsultation} className="btn-ghost flex-1 text-xs"><Download className="w-4 h-4" /> Export JSON</button>
                </div>
              </div>
              <div className="rounded-2xl border border-gold-600/15 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-[.2em] text-gold-300/70">KIVÁLASZTOTT MINTÁK</div>
                    <div className="text-sm text-cream-100 mt-1">{consultationSelection.length} / 12 kiválasztva</div>
                  </div>
                  <button type="button" onClick={() => setConsultationSelection([])} className="text-[10px] text-cream-300/45 hover:text-gold-200">Ürítés</button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                  {designs.filter((item) => consultationSelection.includes(item.id)).map((design) => (
                    <div key={design.id} className="rounded-xl border border-gold-600/10 bg-ink-900/50 overflow-hidden">
                      <div className="bg-[#eee8dd] p-2"><TattooArt design={design} style={style === 'All' ? 'Blackwork' : style} /></div>
                      <div className="p-2"><div className="text-[9px] text-gold-300/70 truncate">{design.title}</div><button type="button" onClick={() => toggleConsultationSelection(design.id)} className="text-[9px] text-cream-300/45 hover:text-red-300 mt-1">Kivétel</button></div>
                    </div>
                  ))}
                  {!consultationSelection.length && <div className="col-span-2 py-16 text-center text-xs text-cream-300/35">A mintakártyákon a könyvjelző gombbal vagy a kiválasztott minta panelből adj hozzá mintákat.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreditPurchaseModal open={showCreditModal} onCreditsUpdated={refreshProfile} onClose={() => setShowCreditModal(false)} onNavigate={onNavigate} currentCredits={profile?.credits} reason="A végleges AI tetoválás elkészítéséhez kredit szükséges." />

      <style>{`
        .tattoo-art-wrap{position:absolute;inset:0;display:grid;place-items:center;background:#f3eee4}
        .tattoo-art{position:relative;width:58%;aspect-ratio:1/1;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(0,0,0,.12);background:radial-gradient(circle at 50% 50%,rgba(0,0,0,.05),transparent 55%),repeating-radial-gradient(circle,transparent 0 calc(var(--tattoo-density)/3),rgba(0,0,0,.12) calc(var(--tattoo-density)/3 + 1px) calc(var(--tattoo-density)/3 + 2px))}
        .tattoo-art-seal{position:relative;z-index:3;width:37%;aspect-ratio:1;border:4px solid #111;border-radius:50%;display:grid;place-items:center;font:700 15px Georgia;color:#111;letter-spacing:.1em;background:rgba(255,255,255,.18)}
        .tattoo-art-orbit{position:absolute;inset:14%;border:2px solid #161616;border-radius:50%;transform:rotate(24deg)}
        .tattoo-art-line{position:absolute;background:#141414;height:2px;width:78%;left:11%;transform-origin:center}
        .tattoo-art-line-a{transform:rotate(26deg)}.tattoo-art-line-b{transform:rotate(-34deg)}
        .tattoo-art-core{position:absolute;inset:33%;border:2px solid #111;border-radius:46% 54% 44% 56%;transform:rotate(-21deg)}
        .tattoo-art-fine{filter:contrast(.9)} .tattoo-art-heavy{filter:contrast(1.2)}
        .tattoo-art-dragon .tattoo-art-core{border-radius:40% 60% 55% 45%;transform:rotate(-20deg) scaleX(1.1)}
        .tattoo-art-rose .tattoo-art-core{border-radius:50%;box-shadow:0 0 0 6px rgba(0,0,0,.1), inset 0 0 0 3px #111}
        .tattoo-art-skull .tattoo-art-core{border-radius:42% 58% 50% 50%;box-shadow:inset 0 -8px 0 rgba(0,0,0,.24)}
        .tattoo-art-cross .tattoo-art-line-a{width:56%;height:7px;transform:rotate(90deg);left:22%}.tattoo-art-cross .tattoo-art-line-b{width:58%;height:7px;transform:rotate(0deg);left:21%}
        .tattoo-art-lettering .tattoo-art-seal{border-radius:12%;width:54%;height:28%;aspect-ratio:auto;font-size:12px}
        .tattoo-art-celtic .tattoo-art-orbit{border-width:5px;inset:10%;border-radius:42% 58% 46% 54%}
        .tattoo-art-minimal .tattoo-art-orbit{border-style:dashed;border-width:1px}
        .tattoo-art-label{position:absolute;bottom:9%;left:50%;transform:translateX(-50%);font:600 8px/1 'Oswald',sans-serif;letter-spacing:.22em;text-transform:uppercase;color:rgba(0,0,0,.48)}
        .tattoo-hero-dragon{position:relative;width:180px;height:180px;transform:rotate(-11deg)}
        .tattoo-hero-body{position:absolute;left:56px;top:48px;width:92px;height:52px;border:7px solid #111;border-radius:50%;transform:rotate(-28deg)}
        .tattoo-hero-head{position:absolute;left:21px;top:13px;width:70px;height:52px;border:5px solid #111;border-radius:42% 58% 45% 55%;display:grid;place-items:center;font:700 13px Georgia;color:#111}
        .tattoo-hero-wing{position:absolute;width:100px;height:125px;border:7px solid #111;border-radius:70% 35% 70% 35%;top:18px}
        .tattoo-hero-wing-a{right:12px;transform:rotate(30deg)}.tattoo-hero-wing-b{right:25px;top:48px;transform:rotate(70deg)}
        .tattoo-hero-tail{position:absolute;left:72px;bottom:2px;width:88px;height:74px;border:7px solid #111;border-top-color:transparent;border-left-color:transparent;border-radius:50%;transform:rotate(24deg)}
        .tattoo-body-stage{min-height:430px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#0b0d0f,#070809);border:1px solid rgba(229,201,107,.12);border-radius:20px;padding:24px;overflow:hidden}
        .tattoo-body{position:relative;width:230px;height:370px}
        .tattoo-body-head{position:absolute;width:66px;height:78px;left:82px;top:0;border:2px solid rgba(235,230,217,.52);border-radius:48% 48% 44% 44%;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02))}
        .tattoo-body-neck{position:absolute;width:30px;height:36px;left:100px;top:69px;border-left:2px solid rgba(235,230,217,.40);border-right:2px solid rgba(235,230,217,.40)}
        .tattoo-body-torso{position:absolute;width:112px;height:178px;left:59px;top:86px;border:2px solid rgba(235,230,217,.40);border-radius:28px 28px 20px 20px;background:linear-gradient(180deg,rgba(255,255,255,.035),transparent)}
        .tattoo-body-arm,.tattoo-body-leg{position:absolute;border:2px solid rgba(235,230,217,.40);background:linear-gradient(90deg,rgba(255,255,255,.025),transparent)}
        .tattoo-body-arm{width:38px;height:168px;top:92px;border-radius:22px}
        .tattoo-body-arm-left{left:30px;transform:rotate(6deg)}.tattoo-body-arm-right{right:30px;transform:rotate(-6deg)}
        .tattoo-body-hand{position:absolute;width:24px;height:34px;top:248px;border:2px solid rgba(235,230,217,.35);border-radius:12px}
        .tattoo-body-hand-left{left:19px}.tattoo-body-hand-right{right:19px}
        .tattoo-body-leg{width:47px;height:178px;top:246px;border-radius:24px 24px 15px 15px}
        .tattoo-body-leg-left{left:64px}.tattoo-body-leg-right{right:64px}
        .tattoo-body-knee{position:absolute;top:325px;width:48px;height:32px;border-top:2px solid rgba(235,230,217,.32)}
        .tattoo-body-knee-left{left:64px}.tattoo-body-knee-right{right:64px}
        .tattoo-body-feminine .tattoo-body-torso{width:98px;left:66px;border-radius:30px 30px 24px 24px}
        .tattoo-body-feminine .tattoo-body-arm{height:162px;width:34px}
        .tattoo-body-placement{position:absolute;z-index:5;display:grid;place-items:center;color:rgba(229,201,107,.75);font:500 8px 'Oswald',sans-serif;letter-spacing:.15em;text-transform:uppercase;text-align:center}
        .tattoo-place-forearm{left:40px;top:165px;width:32px;height:95px}.tattoo-place-upper-arm{left:28px;top:105px;width:36px;height:75px}
        .tattoo-place-chest{left:79px;top:118px;width:72px;height:58px}.tattoo-place-back{left:79px;top:118px;width:72px;height:78px}
        .tattoo-place-thigh{left:67px;top:245px;width:44px;height:74px}.tattoo-place-calf{left:67px;top:315px;width:42px;height:76px}
        .tattoo-place-neck{left:91px;top:70px;width:48px;height:30px}.tattoo-place-ribs{left:69px;top:150px;width:43px;height:74px}
        .tattoo-place-hand{left:12px;top:237px;width:32px;height:35px}
        .tattoo-placement-art{width:100%;height:100%;display:grid;place-items:center}.tattoo-placement-art .tattoo-art-wrap{transform:scale(.48);background:transparent}
        @media(max-width:700px){.tattoo-body{transform:scale(.88);transform-origin:top center;margin-bottom:-46px}.tattoo-body-stage{min-height:370px}.tattoo-art{width:62%}}
      `}</style>
    </div>
  );
}
