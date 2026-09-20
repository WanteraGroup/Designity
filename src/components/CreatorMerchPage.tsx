import { useState } from 'react';
import { Check, Download, Gamepad2, Headphones, Image, Palette, Shirt, ShoppingBag, Sparkles, Twitch, Tv2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { generateDesign } from '@/lib/ai';
import { getCreditsForType } from '@/lib/constants';
import { PreviewWatermark } from './PreviewWatermark';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { FreePreviewModal } from './FreePreviewModal';
import { runDesignlyMasterAgent } from '@/lib/designly-agent';

interface CreatorMerchPageProps { onNavigate: (page: string) => void; }

const PRODUCTS = [
  { id:'tshirt', label:'Póló', icon:Shirt, area:'28 × 38 cm', desc:'Elöl / hátul nyomtatható merch' },
  { id:'hoodie', label:'Hoodie', icon:ShoppingBag, area:'30 × 40 cm', desc:'Nagy grafika, gamer/creator merch' },
  { id:'mousepad', label:'XXL egérpad', icon:Gamepad2, area:'90 × 40 cm', desc:'Teljes felületű print' },
  { id:'mug', label:'Bögre', icon:Headphones, area:'21 × 9 cm', desc:'360° wrap grafika' },
  { id:'cap', label:'Sapka', icon:Twitch, area:'10 × 6 cm', desc:'Front hímzés / print koncepció' },
  { id:'poster', label:'Poszter', icon:Image, area:'A2 · 4961 × 7016 px', desc:'Nagy felbontású falikép' },
  { id:'sticker', label:'Matrica', icon:Palette, area:'Egyedi kivágás', desc:'Die-cut creator sticker' },
  { id:'phonecase', label:'Telefontok', icon:Tv2, area:'Egyedi modell', desc:'Creator / gamer cover' },
] as const;

const STYLE_OPTIONS = ['gaming','streamer','esports','cyberpunk','tech_noir','nordic','celtic','minimal','premium','anime','retro'];

export function CreatorMerchPage({ onNavigate }: CreatorMerchPageProps) {
  const { lang } = useI18n();
  const { profile, isOwner, refreshProfile } = useAuth();
  const [productId, setProductId] = useState<(typeof PRODUCTS)[number]['id']>('tshirt');
  const [creator, setCreator] = useState('');
  const [channel, setChannel] = useState('');
  const [slogan, setSlogan] = useState('');
  const [style, setStyle] = useState('gaming');
  const [colors, setColors] = useState('fekete, arany, ezüst');
  const [brief, setBrief] = useState('');
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const product = PRODUCTS.find((item) => item.id === productId) || PRODUCTS[0];
  const Icon = product.icon;
  const cost = getCreditsForType('custom');
  const enough = isOwner || (profile?.credits ?? 0) >= cost;

  const buildPreview = async () => {
    if (!profile || previewLoading) return;
    const creatorName = creator.trim() || 'CREATOR';
    const channelName = channel.trim() || creatorName;
    const customBrief = [
      'DESIGNLY CREATOR MERCH MASTER ARTWORK',
      `PRODUCT: ${product.label} — ${product.desc}`,
      `CREATOR: ${creatorName}`,
      `CHANNEL / GAMERTAG: ${channelName}`,
      `SLOGAN: ${slogan.trim() || 'editable creator slogan'}`,
      `STYLE: ${style}`,
      `COLORS: ${colors.trim() || 'black, gold, silver'}`,
      `USER BRIEF: ${brief.trim() || 'Create a commercially usable creator/gamer merch identity with a strong central emblem and production-friendly composition.'}`,
      'OUTPUT: a clean production-oriented master artwork, strong silhouette, readable at small size, transparent-background-friendly composition, no mockup text baked into the artwork, editable brand placeholders where information is unknown.',
    ].join('\n');

    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewImage(null);
    setPreviewId(null);
    setError('');
    const preview = await runDesignlyMasterAgent({
      brief: customBrief,
      language: lang,
      mode: 'preview',
      requestedOutputs: ['custom'],
    });
    setPreviewLoading(false);
    if (!preview.success) {
      setError(preview.message || 'Az ingyenes merch előnézet nem készült el.');
      return;
    }
    setPreviewImage(preview.previewImageUrl || null);
    setPreviewId(preview.previewId || null);
  };

  const generate = async () => {
    if (!profile || !previewId) return;
    if (!enough) { setShowCreditModal(true); return; }
    const creatorName = creator.trim() || 'CREATOR';
    const channelName = channel.trim() || creatorName;
    const customBrief = [
      'DESIGNLY CREATOR MERCH MASTER ARTWORK',
      `PRODUCT: ${product.label} — ${product.desc}`,
      `CREATOR: ${creatorName}`,
      `CHANNEL / GAMERTAG: ${channelName}`,
      `SLOGAN: ${slogan.trim() || 'editable creator slogan'}`,
      `STYLE: ${style}`,
      `COLORS: ${colors.trim() || 'black, gold, silver'}`,
      `USER BRIEF: ${brief.trim() || 'Create a commercially usable creator/gamer merch identity with a strong central emblem and production-friendly composition.'}`,
      'OUTPUT: a clean production-oriented master artwork, strong silhouette, readable at small size, transparent-background-friendly composition, no mockup text baked into the artwork, editable brand placeholders where information is unknown.',
    ].join('\\n');

    setGenerating(true);
    setError('');
    setStatus('AI merchandise artwork készítése…');
    const result = await generateDesign({
      type: 'custom',
      brief: customBrief,
      style,
      format: `creator-merch:${product.id}` ,
      previewId,
    });
    if (!result.success) {
      setError(result.message || 'A merch generálás nem sikerült.');
      setGenerating(false);
      return;
    }

    const nextImage = (result.result?.imageUrl as string) || null;
    const { data: savedProject } = await supabase.from('projects').insert({
      user_id: profile.id,
      name: `${creatorName} · ${product.label} Merch`,
      type: 'custom',
      status: 'completed',
      brief: customBrief,
      brand_kit_id: null,
      preview_url: nextImage,
      config: {
        creatorMerch: {
          creator: creatorName, channel: channelName, slogan, style, colors,
          productId: product.id, productLabel: product.label, printArea: product.area,
          masterArtwork: nextImage, productionStatus: 'DESIGN_READY',
          productionNotes: ['300 DPI export javasolt', 'CMYK színprofil nyomtatás előtt', 'Áttetsző háttér / vágóterület ellenőrzése', 'Gyártói sablonhoz igazítandó'],
        },
        generation: { imageUrl: nextImage, generatedAt: new Date().toISOString() },
      },
    }).select().single();

    await refreshProfile();
    setImageUrl(nextImage);
    setProjectId(savedProject?.id || null);
    setStatus('Kész · gyártásra előkészíthető');
    setGenerating(false);
    setShowSpec(true);
  };

  const downloadSpec = () => {
    const spec = {
      product: product.label,
      printArea: product.area,
      creator: creator || 'CREATOR',
      channel: channel || creator || 'CREATOR',
      slogan, style, colors,
      projectId,
      productionStatus: 'DESIGN_READY',
      requirements: ['300 DPI', 'CMYK ellenőrzés', 'Gyártói sablon szerint kifutó / vágóterület', 'Áttetsző háttér ahol szükséges'],
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type:'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(creator || 'creator').replace(/\s+/g,'-').toLowerCase()}-${product.id}-production-spec.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className='space-y-8'>
      <section className='relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-ink-900 via-[#0a0c0e] to-black p-7 lg:p-10'>
        <div className='absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold-500/8 blur-3xl' />
        <div className='relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <div className='flex items-center gap-2 text-[10px] uppercase tracking-[.28em] text-gold-300'><Gamepad2 className='h-4 w-4' /> CREATOR / GAMER PRODUCT STUDIO</div>
            <h1 className='mt-3 text-4xl lg:text-5xl font-display font-bold text-cream-50'>Merch & Product Factory</h1>
            <p className='mt-3 max-w-3xl text-sm leading-7 text-cream-300/60'>Streamerek, gamerek és tartalomkészítők saját pólót, hoodie-t, egérpadot, bögrét, sapkát, posztert, matricát és telefontokot tervezhetnek ugyanebben a DESIGNLY munkafolyamatban.</p>
          </div>
          <div className='chip border-gold-500/25 bg-gold-500/5 text-gold-200 text-[10px]'>MASTER ARTWORK → PRODUCTION SPEC</div>
        </div>
      </section>

      {!imageUrl ? (
        <section className='grid gap-6 xl:grid-cols-[1.15fr_.85fr]'>
          <div className='card-lux p-6'>
            <div className='mb-5'><div className='text-[9px] uppercase tracking-[.24em] text-gold-300/60'>01 · PRODUCT</div><h2 className='mt-1 text-2xl font-display text-cream-50'>Mit gyártsunk?</h2></div>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
              {PRODUCTS.map((item) => { const PIcon=item.icon; const active=item.id===productId; return <button key={item.id} onClick={()=>setProductId(item.id)} className={'rounded-xl border p-3 text-left transition-all ' + (active ? 'border-gold-400/45 bg-gold-400/10 text-gold-100' : 'border-gold-600/10 bg-black/20 text-cream-300/65 hover:border-gold-500/25')}><PIcon className='h-5 w-5 mb-3 text-gold-300'/><div className='text-xs font-semibold'>{item.label}</div><div className='mt-1 text-[9px] text-cream-300/40'>{item.desc}</div></button>; })}
            </div>
            <div className='mt-6 grid gap-3 md:grid-cols-2'>
              <input value={creator} onChange={e=>setCreator(e.target.value)} className='input-lux' placeholder='Streamer / gamer neve' />
              <input value={channel} onChange={e=>setChannel(e.target.value)} className='input-lux' placeholder='Twitch / YouTube / TikTok / Gamertag' />
              <input value={slogan} onChange={e=>setSlogan(e.target.value)} className='input-lux md:col-span-2' placeholder='Slogan / battle cry / közösségi mottó' />
              <select value={style} onChange={e=>setStyle(e.target.value)} className='input-lux'>{STYLE_OPTIONS.map((s)=><option key={s} value={s}>{s}</option>)}</select>
              <input value={colors} onChange={e=>setColors(e.target.value)} className='input-lux' placeholder='Színek' />
              <textarea value={brief} onChange={e=>setBrief(e.target.value)} rows={5} className='input-lux md:col-span-2 resize-none' placeholder='Írd le a grafikát: logó, karakter, fegyver, állat, rúnák, esports jel, neon, stb.' />
            </div>
            <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gold-600/10 bg-black/20 p-4'>
              <div><div className='text-[9px] uppercase tracking-[.2em] text-gold-300/60'>AI CREATION</div><div className='mt-1 text-sm text-cream-100'>Master artwork · {isOwner ? '∞' : cost + ' kredit'}</div></div>
              <button onClick={() => void buildPreview()} disabled={generating || previewLoading} className='btn-gold text-sm'><Sparkles className='h-4 w-4'/>{previewLoading ? 'ELŐNÉZET KÉSZÜL…' : 'INGYENES ELŐNÉZET'}</button>
            </div>
            {error && <div className='mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200'>{error}</div>}
          </div>

          <div className='card-lux p-6'>
            <div className='text-[9px] uppercase tracking-[.24em] text-gold-300/60'>02 · PRODUCTION</div>
            <h2 className='mt-1 text-2xl font-display text-cream-50'>{product.label} specifikáció</h2>
            <div className='mt-5 rounded-2xl border border-gold-600/10 bg-black/20 p-5'>
              <div className='flex items-center gap-3'><div className='grid h-12 w-12 place-items-center rounded-xl border border-gold-500/20 bg-gold-500/5'><Icon className='h-5 w-5 text-gold-300'/></div><div><div className='text-sm font-semibold text-cream-100'>{product.label}</div><div className='text-xs text-cream-300/45'>{product.desc}</div></div></div>
              <div className='mt-5 grid grid-cols-2 gap-2'>{[['Nyomtatási terület',product.area],['Master', 'AI artwork'],['Minőség','300 DPI'],['Szín','CMYK ellenőrzés']].map(([k,v])=><div key={k} className='rounded-lg border border-gold-600/10 bg-black/15 p-3'><div className='text-[9px] text-cream-300/35'>{k}</div><div className='mt-1 text-xs text-gold-200'>{v}</div></div>)}</div>
            </div>
          </div>
        </section>
      ) : (
        <section className='space-y-5'>
          <div className='card-lux overflow-hidden border-gold-600/30 bg-black'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-gold-600/15 bg-ink-900/90 px-5 py-4'>
              <div><div className='text-[9px] uppercase tracking-[.22em] text-gold-300/65'>KÉSZ MŰ · NAGY ELŐNÉZET</div><div className='mt-1 text-lg font-display text-cream-50'>{creator || 'CREATOR'} · {product.label}</div></div>
              <div className='flex gap-2'><button onClick={downloadSpec} className='btn-ghost text-xs'><Download className='h-4 w-4'/> Production spec</button><button onClick={()=>onNavigate('projects')} className='btn-gold text-xs'>Projekt megnyitása</button></div>
            </div>
            <div className='relative min-h-[70vh] overflow-auto bg-[#020303] p-2 sm:p-5 lg:p-8'>
              {imageUrl && <img src={imageUrl} alt='Creator merch master artwork' className='mx-auto block w-full max-w-[1500px] h-auto object-contain rounded-xl' draggable={false} />}
              <PreviewWatermark hidden={true} projectName={creator || 'CREATOR'} label='DESIGNLY · CREATOR FINAL' />
            </div>
          </div>
          <div className='grid gap-5 lg:grid-cols-[1fr_auto]'>
            <div className='card-lux p-5'><div className='flex items-center gap-2 text-gold-300'><Check className='h-4 w-4'/><span className='text-sm font-semibold'>DESIGN READY</span></div><p className='mt-2 text-xs leading-6 text-cream-300/50'>A master artwork elkészült és projektként mentve van. A tényleges gyártást a választott gyártó/POD szolgáltató sablonjához és specifikációjához kell illeszteni.</p></div>
            <button onClick={()=>{setImageUrl(null);setShowSpec(false);setStatus('')}} className='btn-ghost text-sm'>Új termék</button>
          </div>
          {showSpec && <div className='card-lux p-5'><div className='text-[9px] uppercase tracking-[.2em] text-gold-300/60'>PRODUCTION HANDOFF</div><div className='mt-2 text-sm text-cream-100'>{status || 'Gyártásra előkészíthető'}</div></div>}
        </section>
      )}

      <FreePreviewModal
        open={previewOpen}
        title={product.label + ' · Merch előnézet'}
        imageUrl={previewImage}
        loading={previewLoading}
        cost={cost}
        balance={profile?.credits}
        onClose={() => setPreviewOpen(false)}
        onApprove={() => void generate().then(() => setPreviewOpen(false))}
        onModify={() => { setPreviewOpen(false); setPreviewImage(null); setPreviewId(null); }}
        onBuyCredits={() => setShowCreditModal(true)}
        approvedLoading={generating}
      />
      <CreditPurchaseModal open={showCreditModal} onCreditsUpdated={refreshProfile} onClose={()=>setShowCreditModal(false)} onNavigate={onNavigate} currentCredits={profile?.credits} reason='Vásárolj kreditet közvetlenül a Creator / Gamer Product Studio-ból.' />
    </div>
  );
}