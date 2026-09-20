import { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, BadgeCheck, Bell, Camera, Check, Clock3, Download, Gamepad2, Image,
  Layout, MessageSquare, Play, Radio, Shield, Shirt, Sparkles, Star, Tv2, Users, Video
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { generateDesign } from '@/lib/ai';
import { getCreditsForType } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { PreviewWatermark } from './PreviewWatermark';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { buildStreamerTemplatePrompt, getStreamerTemplate, STREAMER_TEMPLATE_COUNT } from '@/lib/streamer-template-catalog';

type Asset = { id:string; label:string; group:string; platform:string; icon:any; size:string; mode:'static'|'motion-ready'; description:string };

const ASSETS: Asset[] = [
  { id:'starting-soon',label:'Starting Soon',group:'Stream Screens',platform:'Twitch / YouTube / Kick',icon:Clock3,size:'1920×1080',mode:'static',description:'Adás előtti képernyő.' },
  { id:'brb',label:'Be Right Back',group:'Stream Screens',platform:'Twitch / YouTube / Kick',icon:Clock3,size:'1920×1080',mode:'static',description:'Szünet képernyő.' },
  { id:'ending',label:'Ending Stream',group:'Stream Screens',platform:'Twitch / YouTube / Kick',icon:Radio,size:'1920×1080',mode:'static',description:'Adás lezáró képernyő.' },
  { id:'offline',label:'Offline Screen',group:'Stream Screens',platform:'Twitch / YouTube / Kick',icon:Tv2,size:'1920×1080',mode:'static',description:'Offline csatornaképernyő.' },
  { id:'gameplay',label:'Gameplay Scene',group:'Stream Screens',platform:'OBS / Streamlabs',icon:Gamepad2,size:'1920×1080',mode:'static',description:'Játék scene.' },
  { id:'just-chatting',label:'Just Chatting Scene',group:'Stream Screens',platform:'Twitch / YouTube',icon:Users,size:'1920×1080',mode:'static',description:'Kamerás beszélgetős scene.' },
  { id:'countdown',label:'Countdown Screen',group:'Stream Screens',platform:'OBS / Streamlabs',icon:Clock3,size:'1920×1080',mode:'motion-ready',description:'Animálható visszaszámláló.' },
  { id:'full-overlay',label:'Full Stream Overlay',group:'Overlays',platform:'OBS / Streamlabs',icon:Layout,size:'1920×1080',mode:'static',description:'Teljes adás-overlay.' },
  { id:'webcam',label:'Webcam Frame',group:'Overlays',platform:'OBS / Streamlabs',icon:Camera,size:'16:9 / egyedi',mode:'static',description:'Facecam keret.' },
  { id:'vertical-overlay',label:'Vertical Live Overlay',group:'Overlays',platform:'TikTok Live',icon:Video,size:'1080×1920',mode:'static',description:'Vertikális live overlay.' },
  { id:'chat',label:'Chat Box',group:'Overlays',platform:'Twitch / YouTube / Kick',icon:MessageSquare,size:'Widget',mode:'static',description:'Chat keret.' },
  { id:'events',label:'Recent Events',group:'Overlays',platform:'OBS / Streamlabs',icon:Bell,size:'Widget',mode:'static',description:'Follow / sub / donation lista.' },
  { id:'goal',label:'Goal Bar',group:'Overlays',platform:'OBS / Streamlabs',icon:Star,size:'Widget',mode:'static',description:'Sub / follower / donation goal.' },
  { id:'lower-third',label:'Lower Third',group:'Overlays',platform:'OBS / Streamlabs',icon:Layout,size:'1920×300',mode:'motion-ready',description:'Név és social sáv.' },
  { id:'sponsor',label:'Sponsor Frame',group:'Overlays',platform:'OBS / Streamlabs',icon:Shield,size:'1920×1080',mode:'static',description:'Szponzor megjelenítés.' },
  { id:'follow-alert',label:'New Follower Alert',group:'Alerts',platform:'Twitch / YouTube / Kick',icon:Bell,size:'800×450',mode:'motion-ready',description:'Új követő alert.' },
  { id:'sub-alert',label:'New Subscriber Alert',group:'Alerts',platform:'Twitch / YouTube',icon:BadgeCheck,size:'800×450',mode:'motion-ready',description:'Feliratkozás alert.' },
  { id:'gift-alert',label:'Gift Sub Alert',group:'Alerts',platform:'Twitch',icon:Star,size:'800×450',mode:'motion-ready',description:'Gift sub alert.' },
  { id:'raid-alert',label:'Raid Alert',group:'Alerts',platform:'Twitch',icon:Users,size:'800×450',mode:'motion-ready',description:'Raid alert.' },
  { id:'donation-alert',label:'Donation Alert',group:'Alerts',platform:'Twitch / YouTube / Kick',icon:Sparkles,size:'800×450',mode:'motion-ready',description:'Donation alert.' },
  { id:'bits-alert',label:'Bits / Cheers Alert',group:'Alerts',platform:'Twitch',icon:Sparkles,size:'800×450',mode:'motion-ready',description:'Bits és cheers alert.' },
  { id:'superchat-alert',label:'Super Chat Alert',group:'Alerts',platform:'YouTube',icon:Sparkles,size:'800×450',mode:'motion-ready',description:'Super Chat alert.' },
  { id:'tiktok-gift',label:'TikTok Gift Alert',group:'Alerts',platform:'TikTok Live',icon:Star,size:'800×450',mode:'motion-ready',description:'TikTok gift alert.' },
  { id:'about-panel',label:'About Panel',group:'Panels',platform:'Twitch / Discord',icon:Users,size:'320×1000',mode:'static',description:'Bemutatkozó panel.' },
  { id:'rules-panel',label:'Rules Panel',group:'Panels',platform:'Twitch / Discord',icon:Shield,size:'320×1000',mode:'static',description:'Chat szabályzat.' },
  { id:'schedule-panel',label:'Schedule Panel',group:'Panels',platform:'Twitch / YouTube',icon:Clock3,size:'320×1000',mode:'static',description:'Adásrend panel.' },
  { id:'donate-panel',label:'Donate Panel',group:'Panels',platform:'Twitch / Discord',icon:Sparkles,size:'320×1000',mode:'static',description:'Támogatás panel.' },
  { id:'social-panel',label:'Socials Panel',group:'Panels',platform:'Twitch / Discord',icon:Users,size:'320×1000',mode:'static',description:'Social link panel.' },
  { id:'pc-panel',label:'PC Specs Panel',group:'Panels',platform:'Twitch / Discord',icon:Gamepad2,size:'320×1000',mode:'static',description:'Gamer PC specifikáció.' },
  { id:'stream-logo',label:'Creator Stream Logo',group:'Branding',platform:'All platforms',icon:Sparkles,size:'1000×1000',mode:'static',description:'Streamer / gamer logó.' },
  { id:'channel-banner',label:'Channel Banner',group:'Branding',platform:'YouTube / Twitch',icon:Image,size:'2560×1440 safe zone',mode:'static',description:'Csatorna banner.' },
  { id:'profile-avatar',label:'Profile Avatar',group:'Branding',platform:'All platforms',icon:Users,size:'1000×1000',mode:'static',description:'Profilkép / avatar.' },
  { id:'stream-schedule',label:'Stream Schedule',group:'Branding',platform:'All platforms',icon:Clock3,size:'1920×1080',mode:'static',description:'Heti stream schedule.' },
  { id:'youtube-thumb',label:'YouTube Thumbnail',group:'Social',platform:'YouTube',icon:Play,size:'1280×720',mode:'static',description:'Gamer videó thumbnail.' },
  { id:'tiktok-cover',label:'TikTok Cover',group:'Social',platform:'TikTok',icon:Video,size:'1080×1920',mode:'static',description:'Videóborító.' },
  { id:'live-now',label:'Go Live Announcement',group:'Social',platform:'All platforms',icon:Radio,size:'1080×1080',mode:'static',description:'LIVE NOW promo.' },
  { id:'emote-pack',label:'Emote Pack',group:'Community',platform:'Twitch / YouTube',icon:Star,size:'112 / 56 / 28 px',mode:'static',description:'Közösségi emote rendszer.' },
  { id:'sub-badges',label:'Subscriber Badges',group:'Community',platform:'Twitch / YouTube',icon:BadgeCheck,size:'18 / 36 / 72 px',mode:'static',description:'Sub badge rendszer.' },
  { id:'loyalty-badges',label:'Loyalty Badges',group:'Community',platform:'Twitch',icon:BadgeCheck,size:'18 / 36 / 72 px',mode:'static',description:'Loyalty badge rendszer.' },
  { id:'stinger',label:'Stinger Transition',group:'Motion FX',platform:'OBS / Streamlabs',icon:Video,size:'1920×1080',mode:'motion-ready',description:'Átmenet keyframe artwork.' },
  { id:'intermission',label:'Intermission Scene',group:'Motion FX',platform:'OBS / Streamlabs',icon:Tv2,size:'1920×1080',mode:'motion-ready',description:'Animálható intermission.' },
  { id:'esports-overlay',label:'Esports Match Overlay',group:'Esports',platform:'OBS / Tournament',icon:Gamepad2,size:'1920×1080',mode:'motion-ready',description:'Score / team / sponsor HUD.' },
  { id:'tournament-poster',label:'Tournament Poster',group:'Esports',platform:'Social / Print',icon:Gamepad2,size:'1080×1350 / A3',mode:'static',description:'Verseny plakát.' },
  { id:'team-jersey',label:'Esports Jersey Graphic',group:'Esports',platform:'Merch',icon:Shirt,size:'Gyártói sablon',mode:'static',description:'Csapatmez grafikai koncepció.' },
];

const GROUPS = ['All','Stream Screens','Overlays','Alerts','Panels','Branding','Social','Community','Motion FX','Esports'];
const PLATFORMS = ['All','Twitch','YouTube','TikTok','Kick','OBS','Streamlabs','Discord'];

export function StreamerStudioPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { profile, isOwner } = useAuth();
  const [group, setGroup] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [assetId, setAssetId] = useState('full-overlay');
  const [creator, setCreator] = useState('');
  const [handle, setHandle] = useState('');
  const [style, setStyle] = useState('tech_noir');
  const [colors, setColors] = useState('fekete, arany, ezüst');
  const [brief, setBrief] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showCredits, setShowCredits] = useState(false);
  const [templateIndex, setTemplateIndex] = useState(0);
  const templateCatalogSize = STREAMER_TEMPLATE_COUNT;
  const assetCombinationCount = ASSETS.length * templateCatalogSize;

  const filtered = useMemo(() => ASSETS.filter((a) => (group === 'All' || a.group === group) && (platform === 'All' || a.platform.toLowerCase().includes(platform.toLowerCase()))), [group, platform]);
  const selected = ASSETS.find((a) => a.id === assetId) || ASSETS[0];
  const templateSeed = getStreamerTemplate(templateIndex);
  const cost = getCreditsForType('custom');
  const enough = isOwner || (profile?.credits ?? 0) >= cost;

  const generate = async () => {
    if (!profile) return;
    if (!enough) { setShowCredits(true); return; }
    const creatorName = creator.trim() || 'CREATOR';
    const creatorHandle = handle.trim() || creatorName;
    const prompt = buildStreamerTemplatePrompt(
      { ...templateSeed, style, palette: colors || templateSeed.palette },
      selected.label,
      selected.platform,
      selected.size,
      creatorName,
      creatorHandle,
      brief.trim(),
    );
    setGenerating(true);
    setError('');
    const result = await generateDesign({ type:'custom', brief:prompt, style, format:`creator-stream:${selected.id}:${selected.size}` });
    if (!result.success) { setError(result.message || 'A creator asset generálása nem sikerült.'); setGenerating(false); return; }
    const imageUrl = (result.result?.imageUrl as string) || null;
    const save = await supabase.from('projects').insert({
      user_id: profile.id, name: `${creatorName} · ${selected.label}`, type:'custom', status:'completed', brief:prompt, brand_kit_id:null, preview_url:imageUrl,
      config:{ creatorStreamAsset:{ assetId:selected.id, assetLabel:selected.label, group:selected.group, platform:selected.platform, size:selected.size, mode:selected.mode, creator:creatorName, handle:creatorHandle, style, colors, masterArtwork:imageUrl, productionStatus:'DESIGN_READY' }, generation:{ imageUrl, generatedAt:new Date().toISOString() } },
    }).select().single();
    setResultUrl(imageUrl);
    setSavedProjectId(save.data?.id || null);
    setGenerating(false);
  };

  const downloadSpec = () => {
    const spec = { asset:selected.label, group:selected.group, platform:selected.platform, size:selected.size, mode:selected.mode, creator:creator || 'CREATOR', handle:handle || creator || 'CREATOR', style, colors, projectId:savedProjectId, production:['Safe zones ellenőrzése','Platform-specifikus export','Motion assetnél alpha / frame ellenőrzése'] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(spec,null,2)], { type:'application/json;charset=utf-8' }));
    const a=document.createElement('a'); a.href=url; a.download=`${(creator || 'creator').replace(/\s+/g,'-').toLowerCase()}-${selected.id}-spec.json`; a.click(); URL.revokeObjectURL(url);
  };

  if (generating) return <div className='fixed inset-0 z-[110] grid place-items-center bg-black/95 backdrop-blur-xl'><div className='text-center'><div className='mx-auto grid h-24 w-24 place-items-center rounded-full border border-gold-400/40 bg-gold-400/10 animate-pulse'><Sparkles className='h-9 w-9 text-gold-200'/></div><div className='mt-7 text-2xl font-display text-cream-50'>STREAMER ASSET GYÁRTÁSA</div><div className='mt-2 text-sm text-gold-200'>{selected.label} · {selected.size}</div><div className='mt-4 text-xs text-cream-300/45'>DESIGNLY AI → MASTER ARTWORK → PROJECT SAVE</div></div></div>;

  return <div className='space-y-7'>
    <section className='relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-ink-900 via-[#0a0c0e] to-black p-7 lg:p-10'>
      <div className='absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold-500/7 blur-3xl'/>
      <div className='relative z-10'><div className='flex items-center gap-2 text-[10px] uppercase tracking-[.28em] text-gold-300'><Gamepad2 className='h-4 w-4'/> CREATOR / STREAMER / GAMER</div><h1 className='mt-3 text-4xl lg:text-5xl font-display font-bold text-cream-50'>Streamer Studio</h1><p className='mt-3 max-w-4xl text-sm leading-7 text-cream-300/60'>Overlayek, stream screenek, alertok, webcam keretek, chat boxok, goal barok, panelek, csatorna branding, thumbnailok, emote- és badge-rendszerek, motion-ready scene-ek és esports kreatívok.</p><div className='mt-5 flex flex-wrap gap-2'>{['OBS','Streamlabs','Twitch','YouTube','TikTok Live','Kick','Discord'].map((p)=><span key={p} className='chip border-gold-500/15 bg-black/20 text-cream-300/60 text-[9px]'>{p}</span>)}<span className='chip border-gold-400/30 bg-gold-500/10 text-gold-100 text-[9px]'>{templateCatalogSize.toLocaleString('hu-HU')}+ SABLONVARIÁCIÓ</span></div></div>
    </section>
    {!resultUrl ? <>
      <section className='card-lux p-5'><div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'><div><div className='text-[9px] uppercase tracking-[.22em] text-gold-300/60'>ASSET LIBRARY</div><h2 className='mt-1 text-2xl font-display text-cream-50'>Minden streamer/gamer kreatív egy helyen</h2></div><select value={platform} onChange={(e)=>setPlatform(e.target.value)} className='input-lux w-full lg:w-56 text-xs'>{PLATFORMS.map((p)=><option key={p}>{p}</option>)}</select></div><div className='mt-4 flex flex-wrap gap-2'>{GROUPS.map((g)=><button key={g} onClick={()=>setGroup(g)} className={'chip ' + (group===g ? 'border-gold-400/45 bg-gold-500/10 text-gold-100' : 'border-gold-600/10 bg-black/10 text-cream-300/55')}>{g}</button>)}</div></section>
      <section className='card-lux p-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <div className='text-[9px] uppercase tracking-[.22em] text-gold-300/60'>STREAMER TEMPLATE FACTORY</div>
            <div className='mt-1 text-sm font-semibold text-cream-100'>{templateCatalogSize.toLocaleString('hu-HU')} kombinálható sablonvariáció</div>
            <div className='mt-1 text-[10px] text-cream-300/40'>Virtuális sablonmotor: nem több százezer előre renderelt fájl, hanem igény szerint összeállított variációk. {ASSETS.length} asset-típussal ez {assetCombinationCount.toLocaleString('hu-HU')} lehetséges kombináció.</div>
          </div>
          <div className='flex items-center gap-2'>
            <span className='chip border-gold-600/10 bg-black/10 text-cream-300/55 text-[9px]'>#{(templateIndex + 1).toLocaleString('hu-HU')}</span>
            <button onClick={() => setTemplateIndex((v) => (v + 1) % STREAMER_TEMPLATE_COUNT)} className='btn-ghost text-xs'><Sparkles className='h-4 w-4'/> Másik sablon</button>
          </div>
        </div>
        <div className='mt-3 grid gap-2 sm:grid-cols-5'>
          {[
            ['Style', templateSeed.style],
            ['Layout', templateSeed.layout],
            ['Motif', templateSeed.motif],
            ['Palette', templateSeed.palette],
            ['Type', templateSeed.typography],
          ].map(([k,v]) => <div key={k} className='rounded-lg border border-gold-600/10 bg-black/15 px-3 py-2'><div className='text-[8px] uppercase tracking-[.18em] text-cream-300/35'>{k}</div><div className='mt-1 text-[10px] text-gold-200'>{v}</div></div>)}
        </div>
      </section>
      <section className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>{filtered.map((asset)=>{const I=asset.icon; const active=asset.id===assetId; return <button key={asset.id} onClick={()=>{setAssetId(asset.id); setTemplateIndex((v) => (v + asset.id.length) % STREAMER_TEMPLATE_COUNT);}} className={'card-lux p-4 text-left transition-all ' + (active ? 'border-gold-400/45 bg-gold-400/8' : 'hover:-translate-y-1')}><div className='flex items-start justify-between'><div className='grid h-10 w-10 place-items-center rounded-xl border border-gold-500/15 bg-black/20 text-gold-300'><I className='h-5 w-5'/></div><span className='text-[8px] uppercase tracking-[.18em] text-gold-300/45'>{asset.mode}</span></div><div className='mt-4 text-sm font-semibold text-cream-100'>{asset.label}</div><div className='mt-1 text-[10px] text-cream-300/40'>{asset.group} · {asset.platform}</div><div className='mt-3 text-[9px] text-gold-200/70'>{asset.size}</div><p className='mt-2 text-xs leading-5 text-cream-300/45'>{asset.description}</p></button>;})}</section>
      <section className='grid gap-6 xl:grid-cols-[1.1fr_.9fr]'><div className='card-lux p-6'><div className='text-[9px] uppercase tracking-[.22em] text-gold-300/60'>CREATOR BRIEF</div><h2 className='mt-1 text-2xl font-display text-cream-50'>{selected.label}</h2><div className='mt-5 grid gap-3 md:grid-cols-2'><input value={creator} onChange={(e)=>setCreator(e.target.value)} className='input-lux' placeholder='Streamer / gamer neve'/><input value={handle} onChange={(e)=>setHandle(e.target.value)} className='input-lux' placeholder='@handle / gamertag'/><select value={style} onChange={(e)=>setStyle(e.target.value)} className='input-lux'>{['tech_noir','gaming','esports','cyberpunk','neon','minimal','premium','celtic','nordic','retro'].map((s)=><option key={s}>{s}</option>)}</select><input value={colors} onChange={(e)=>setColors(e.target.value)} className='input-lux' placeholder='Színek'/><textarea value={brief} onChange={(e)=>setBrief(e.target.value)} rows={6} className='input-lux md:col-span-2 resize-none' placeholder='Pl.: két holló, farkas, rúnák, neon kék, arany, erős gamer tipográfia…'/></div><div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gold-600/10 bg-black/20 p-4'><div><div className='text-[9px] uppercase tracking-[.2em] text-gold-300/60'>AI CREATION</div><div className='mt-1 text-sm text-cream-100'>{isOwner ? '∞' : cost + ' kredit'} · {selected.size}</div></div><button onClick={generate} className='btn-gold text-sm'><Sparkles className='h-4 w-4'/> KREATÍV GYÁRTÁSA</button></div>{error && <div className='mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200'><AlertTriangle className='mr-2 inline h-3.5 w-3.5'/>{error}</div>}</div>
        <div className='card-lux p-6'><div className='text-[9px] uppercase tracking-[.22em] text-gold-300/60'>ASSET PROFILE</div><h2 className='mt-1 text-2xl font-display text-cream-50'>{selected.group}</h2><div className='mt-5 space-y-2'>{[['Platform',selected.platform],['Méret',selected.size],['Típus',selected.mode],['Safe zone','Briefben rögzítve'],['Export','PNG / platform-specific']].map(([k,v])=><div key={k} className='flex items-center justify-between gap-4 rounded-lg border border-gold-600/10 bg-black/15 p-3'><span className='text-xs text-cream-300/45'>{k}</span><span className='text-xs text-gold-200'>{v}</span></div>)}</div></div></section>
    </> : <section className='space-y-5'><div className='card-lux overflow-hidden border-gold-600/30 bg-black'><div className='flex flex-wrap items-center justify-between gap-3 border-b border-gold-600/15 bg-ink-900/90 px-5 py-4'><div><div className='text-[9px] uppercase tracking-[.22em] text-gold-300/65'>KÉSZ MŰ · NAGY ELŐNÉZET</div><div className='mt-1 text-xl font-display text-cream-50'>{creator || 'CREATOR'} · {selected.label}</div></div><div className='flex gap-2'><button onClick={downloadSpec} className='btn-ghost text-xs'><Download className='h-4 w-4'/> Spec</button><button onClick={()=>onNavigate('projects')} className='btn-gold text-xs'>Projekt</button></div></div><div className='relative min-h-[72vh] overflow-auto bg-[#020303] p-2 sm:p-5 lg:p-8'><img src={resultUrl} alt={selected.label} className='mx-auto block w-full max-w-[1500px] h-auto object-contain rounded-xl' draggable={false}/><PreviewWatermark hidden={isOwner} projectName={creator || 'CREATOR'} label='DESIGNLY · STREAMER PREVIEW'/></div></div><div className='grid gap-4 md:grid-cols-3'><div className='card-lux p-5'><Check className='h-5 w-5 text-gold-300'/><div className='mt-3 text-sm font-semibold text-cream-100'>Design ready</div><div className='mt-1 text-[9px] text-cream-300/40'>Projektbe mentve</div></div><div className='card-lux p-5'><Radio className='h-5 w-5 text-gold-300'/><div className='mt-3 text-sm font-semibold text-cream-100'>{selected.platform}</div><div className='mt-1 text-[9px] text-cream-300/40'>Platform</div></div><div className='card-lux p-5'><Download className='h-5 w-5 text-gold-300'/><div className='mt-3 text-sm font-semibold text-cream-100'>{selected.size}</div><div className='mt-1 text-[9px] text-cream-300/40'>Export méret</div></div></div><div className='flex justify-center'><button onClick={()=>setResultUrl(null)} className='btn-ghost text-sm'><ArrowLeft className='h-4 w-4'/> Új kreatív</button></div></section>}
    <CreditPurchaseModal open={showCredits} onClose={()=>setShowCredits(false)} onNavigate={onNavigate} currentCredits={profile?.credits} reason='Vásárolj kreditet a Streamer Studio kreatívokhoz.' />
  </div>;
}