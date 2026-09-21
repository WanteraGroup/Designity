import { useEffect, useState, type ComponentType, type CSSProperties } from 'react';
import {
  ArrowRight, Check, ChevronDown, Gamepad2, Layout, Palette, Play,
  Sparkles, Wand2, Shirt, Layers3, MousePointer2, Globe2, Trophy,
  Users, Ruler, Shield, Flame, Compass
} from 'lucide-react';
import { CelticEmblem } from './CelticEmblem';
import { Logo } from './Logo';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { PUBLIC_PLANS } from '@/lib/constants';

interface LandingPageProps { onNavigate: (page: string) => void; }

const runes = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ'];

function RuneWheel() {
  return (
    <div className="odin-wheel" aria-hidden="true">
      <div className="odin-wheel-core"><CelticEmblem size={118} animate showD /></div>
      {runes.map((rune, i) => (
        <span key={rune} className="odin-wheel-rune" style={{ '--i': i } as CSSProperties}>{rune}</span>
      ))}
      <span className="odin-wheel-orbit orbit-a" />
      <span className="odin-wheel-orbit orbit-b" />
    </div>
  );
}

function RavenSilhouette({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`odin-raven ${side}`} aria-hidden="true">
      <div className="odin-raven-eye" />
      <div className="odin-raven-beak" />
      <div className="odin-raven-feather f1" />
      <div className="odin-raven-feather f2" />
      <div className="odin-raven-feather f3" />
      <div className="odin-raven-wing" />
    </div>
  );
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { t, lang } = useI18n();
  const hu = lang === 'hu';

  const copy = {
    eyebrow: hu ? 'ODIN KOVÁCSMŰHELYE · AI CREATIVE OS' : "ODIN'S FORGE · AI CREATIVE OS",
    titleA: hu ? 'NE CSAK TERVEZD.' : "DON'T JUST DESIGN.",
    titleB: hu ? 'EMELD LEGENDÁVÁ.' : 'FORGE A LEGEND.',
    sub: hu
      ? 'A DESIGNLY egy új generációs kreatív rendszer. Ötletből márkát, kampányt, weboldalt, merch-et és kész kreatív rendszert épít.'
      : 'DESIGNLY is a next-generation creative system. Turn ideas into brands, campaigns, websites, merch and production-ready creative systems.',
    primary: hu ? 'ALKOSS A DESIGNLY-VEL' : 'CREATE WITH DESIGNLY',
    secondary: hu ? 'NÉZD MEG A MŰHELYT' : 'ENTER THE FORGE',
    system: hu ? 'EGY RENDSZER · MINDEN KREATÍV' : 'ONE SYSTEM · EVERY CREATIVE',
    tools: hu ? 'A teljes kreatív műhely' : 'The complete creative forge',
    toolsSub: hu ? 'Válassz fegyvert. Vagy bízd az egészet az AI-ra.' : 'Choose your weapon. Or let AI forge the whole thing.',
    manifesto: hu ? 'A DESIGNLY NEM SABLON. FOLYAMAT.' : 'DESIGNLY IS NOT A TEMPLATE. IT IS A SYSTEM.',
    manifestoSub: hu ? 'Brief → irány → generálás → szerkesztés → export → projekt.' : 'Brief → direction → generation → editing → export → project.',
    footer: hu ? 'ÉPÍTS OLYAT, AMIT NEM FELEJTENEK EL.' : 'BUILD WHAT THEY CANNOT FORGET.',
  };

  const tools = [
    { label:'AI Website Builder', desc:hu?'Teljes webélmény egy briefből.':'Complete web experiences from one brief.', icon:Globe2, page:'create', key:'web' },
    { label:'Ad Studio', desc:hu?'Reklámok, kreatív kampányok, vizuálok.':'Ads, campaigns and visual creatives.', icon:Sparkles, page:'advertising', key:'ad' },
    { label:'Campaign Engine', desc:hu?'Egy briefből teljes kampányrendszer.':'Turn one brief into a campaign system.', icon:Layers3, page:'campaign', key:'campaign' },
    { label:'Streamer Studio', desc:hu?'Overlay, alert, scene és creator pack.':'Overlays, alerts, scenes and creator packs.', icon:Gamepad2, page:'streamer', key:'stream' },
    { label:'Merch Studio', desc:hu?'Master artwork és gyártásra kész merch.':'Master artwork and production-ready merch.', icon:Shirt, page:'creator', key:'merch' },
    { label:'Design Editor', desc:hu?'Képszerkesztés, finomhangolás, export.':'Refine, edit and export visual work.', icon:Wand2, page:'editor', key:'editor' },
    { label:'AI Music Studio', desc:hu?'Dal, hang, narráció és audio workflow.':'Music, voice, narration and audio workflow.', icon:Play, page:'music', key:'music' },
    { label:'Planner & Visualizer', desc:hu?'Tervkoncepciók és vizualizációk AI-val.':'Plans and visualization concepts with AI.', icon:Ruler, page:'planner', key:'planner' },
  ];

  const pillars: Array<[string,string,string,ComponentType<{ className?: string }>]> = [
    [ '01', hu?'KITALÁLOD':'CONCEIVE', hu?'Elmondod, mit akarsz.':'Describe what you want.', MousePointer2 ],
    [ '02', hu?'MEGTERVEZZÜK':'FORGE', hu?'Az AI felépíti az irányt.':'AI builds the direction.', Compass ],
    [ '03', hu?'FINOMÍTOD':'REFINE', hu?'Te döntesz minden részletről.':'You control every detail.', Palette ],
    [ '04', hu?'ELINDÍTOD':'SHIP', hu?'Export, publikálás, projekt.':'Export, publish, project.', ArrowRight ],
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    [hu?'Mi az a DESIGNLY?':'What is DESIGNLY?', hu?'Egyetlen kreatív platform weboldalhoz, márkához, kampányhoz, streamer/gamer anyagokhoz, merchhez és további kreatív workflow-khoz.':'A single creative platform for websites, brands, campaigns, streamer/gamer assets, merch and more.'],
    [hu?'Van ingyenes előnézet?':'Is there a free preview?', hu?'Igen. A preview külön kezelhető, és a végleges generálás csak jóváhagyás után történik.':'Yes. Preview is handled separately, and final generation happens only after approval.'],
    [hu?'Megmaradnak a projektjeim?':'Are projects saved?', hu?'A DESIGNLY projektként kezeli az elkészült munkákat, így később visszanyithatók és tovább szerkeszthetők.':'DESIGNLY stores finished work as projects so you can reopen and continue editing later.'],
  ];

  return (
    <div className="odin-forge">
      <section className="odin-hero">
        <div className="odin-hero-scene" aria-hidden="true" />
        <div className="odin-hero-noise" aria-hidden="true" />
        <div className="odin-hero-aurora aurora-a" aria-hidden="true" />
        <div className="odin-hero-aurora aurora-b" aria-hidden="true" />
        <div className="odin-mountain mountain-a" aria-hidden="true" />
        <div className="odin-mountain mountain-b" aria-hidden="true" />
        <div className="odin-mist mist-a" aria-hidden="true" />
        <div className="odin-mist mist-b" aria-hidden="true" />
        <RavenSilhouette side="left" />
        <RavenSilhouette side="right" />
        <div className="odin-hero-content">
          <div className="odin-hero-copy">
            <div className="odin-eyebrow"><span className="sigil-dot" />{copy.eyebrow}</div>
            <div className="odin-hero-title"><span>{copy.titleA}</span><strong>{copy.titleB}</strong></div>
            <p>{copy.sub}</p>
            <div className="odin-actions">
              <button className="odin-btn odin-btn-hot" onClick={() => onNavigate('signup')}>{copy.primary}<ArrowRight className="w-4 h-4" /></button>
              <button className="odin-btn odin-btn-dark" onClick={() => document.getElementById('odin-tools')?.scrollIntoView({ behavior:'smooth' })}><Flame className="w-4 h-4" />{copy.secondary}</button>
            </div>
            <div className="odin-proof"><span><b>100K+</b>{hu?'sablon':'templates'}</span><span><b>0</b>{hu?'kredit preview':'preview cost'}</span><span><b>AI</b>workflow</span><span><b>∞</b>{hu?'irány':'directions'}</span></div>
          </div>
          <div className="odin-hero-symbol">
            <RuneWheel />
            <div className="odin-symbol-caption"><span>{hu?'A FEHÉR FARKAS ÉS A HOLLÓK MŰHELYE':'THE FORGE OF WOLVES & RAVENS'}</span><em>CREATE · REFINE · SHIP</em></div>
          </div>
        </div>
        <div className="odin-sky-runes" aria-hidden="true">{runes.concat(runes).map((r,i)=><span key={i} style={{'--i':i} as CSSProperties}>{r}</span>)}</div>
        <div className="odin-hero-bottom"><div className="odin-scroll-mark"><span>↓</span> SCROLL THE FORGE</div><div className="odin-bottom-line" /><div className="odin-scroll-mark">DESIGNLY · CREATIVE OS</div></div>
      </section>

      <section id="odin-tools" className="odin-section odin-tool-section">
        <div className="odin-section-head"><div><span className="odin-label">01 / {copy.tools}</span><h2>{copy.toolsSub}</h2></div><div className="odin-section-intro">{copy.system}</div></div>
        <div className="odin-tool-grid">{tools.map((tool,i)=>{ const Icon=tool.icon; return <button key={tool.key} onClick={()=>onNavigate(tool.page)} className="odin-tool-card"><div className="odin-tool-number">{String(i+1).padStart(2,'0')}</div><div className="odin-tool-icon"><Icon className="w-6 h-6"/></div><div className="odin-tool-content"><h3>{tool.label}</h3><p>{tool.desc}</p><span>{hu?'BELÉPÉS A MŰHELYBE':'ENTER THE FORGE'} <ArrowRight className="w-3.5 h-3.5"/></span></div></button>; })}</div>
      </section>

      <section className="odin-manifesto">
        <div className="odin-manifesto-runes" aria-hidden="true">ᛉ · ᚨ · ᛟ · ᚱ · ᚦ · ᚷ · ᛏ · ᚹ</div>
        <div className="odin-manifesto-mark"><CelticEmblem size={92} animate /></div>
        <span className="odin-label">02 / CREATIVE PHILOSOPHY</span>
        <h2>{copy.manifesto}</h2><p>{copy.manifestoSub}</p>
      </section>

      <section className="odin-section odin-process">
        <div className="odin-section-head"><div><span className="odin-label">03 / WORKFLOW</span><h2>{hu?'Négy mozdulat.':'Four moves.'}</h2></div></div>
        <div className="odin-pillar-grid">{pillars.map(([n,title,desc,Icon])=><div key={n} className="odin-pillar"><div className="odin-pillar-top"><span>{n}</span><Icon className="w-5 h-5"/></div><h3>{title}</h3><p>{desc}</p></div>)}</div>
      </section>

      <section className="odin-section odin-zones">
        <div className="odin-zone zone-copper"><div className="odin-zone-art"><div className="odin-zone-halo"/><Shield className="w-12 h-12"/></div><div><span className="odin-label">CREATOR / STREAMER</span><h2>{hu?'Építs legendás jelenlétet.':'Forge a legendary presence.'}</h2><p>{hu?'Overlay, alert, merch, emote, scene és brand egyetlen rendszerben.':'Overlay, alert, merch, emote, scene and brand in one system.'}</p><button className="odin-link" onClick={()=>onNavigate('streamer')}>CREATOR STUDIO <ArrowRight className="w-4 h-4"/></button></div></div>
        <div className="odin-zone zone-ice"><div className="odin-zone-art"><div className="odin-zone-halo"/><Layout className="w-12 h-12"/></div><div><span className="odin-label">BUSINESS / BRAND</span><h2>{hu?'Építs rendszert, ne csak oldalt.':'Build systems, not just pages.'}</h2><p>{hu?'Weboldal, márka, kampány, AI és ügyfélprojekt egy összefüggő workflow-ban.':'Website, brand, campaign, AI and client work in one coherent workflow.'}</p><button className="odin-link" onClick={()=>onNavigate('create')}>BUSINESS STUDIO <ArrowRight className="w-4 h-4"/></button></div></div>
      </section>

      <section className="odin-section odin-pricing">
        <div className="odin-section-head"><div><span className="odin-label">04 / SCALE</span><h2>{hu?'Növekedj a saját tempódban.':'Scale at your pace.'}</h2></div></div>
        <PricingPreview onNavigate={onNavigate} />
      </section>

      <section className="odin-section odin-faq">
        <div className="odin-section-head"><div><span className="odin-label">05 / FAQ</span><h2>{hu?'Kérdezz. Az AI válaszol.':'Ask. AI answers.'}</h2></div></div>
        <div className="odin-faq-list">{faqs.map(([q,a],i)=><div key={q} className={`odin-faq-item ${openFaq===i?'open':''}`}><button onClick={()=>setOpenFaq(openFaq===i?null:i)}><span>{String(i+1).padStart(2,'0')}</span><b>{q}</b><ChevronDown className="w-4 h-4"/></button>{openFaq===i&&<p>{a}</p>}</div>)}</div>
      </section>

      <section className="odin-final">
        <div className="odin-final-runes" aria-hidden="true">ᛏ ᚨ ᛚ ᚨ · ᛚ ᛖ ᚷ ᛖ ᚾ ᛞ</div>
        <CelticEmblem size={74} animate showD />
        <span className="odin-label">06 / THE LAST WORD</span>
        <h2>{copy.footer}</h2>
        <p>{hu?'A következő projekted nem egy újabb fájl lesz. Hanem egy rendszer.':'Your next project should not be another file. It should be a system.'}</p>
        <button className="odin-btn odin-btn-hot" onClick={()=>onNavigate('signup')}>{hu?'KEZDJÜK EL':'LET’S FORGE IT'} <ArrowRight className="w-4 h-4"/></button>
      </section>

      <footer className="odin-footer"><Logo size={34} showText /><span>DESIGNLY STUDIO · CREATIVE OS</span><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>{hu?'Vissza fel ↑':'Back to top ↑'}</button></footer>
    </div>
  );
}

function PricingPreview({ onNavigate }: { onNavigate: (p:string)=>void }) {
  const { t } = useI18n();
  const fallbackPlans = PUBLIC_PLANS.map((plan)=>({id:plan.id,name:plan.name,price:plan.priceMonthly,credits:plan.creditsMonthly,features:plan.features.slice(0,3),highlight:plan.highlighted===true}));
  const [plans,setPlans]=useState(fallbackPlans);
  useEffect(()=>{let mounted=true; supabase.from('plans').select('id,name,price_monthly,credits_monthly,features,sort_order').eq('is_public',true).order('sort_order').then(({data})=>{if(!mounted||!data?.length)return;setPlans(data.map((p:any)=>({id:p.id,name:p.name,price:p.price_monthly,credits:p.credits_monthly,features:Array.isArray(p.features)?p.features.slice(0,3):[],highlight:p.id==='pro'})));});return()=>{mounted=false};},[]);
  return <div className="odin-price-grid">{plans.map(plan=><div key={plan.id} className={`odin-price-card ${plan.highlight?'hot':''}`}>{plan.highlight&&<span className="odin-price-badge">MOST CHOSEN</span>}<span className="odin-price-name">{plan.name}</span><strong>{new Intl.NumberFormat('hu-HU').format(plan.price)} <small>Ft</small></strong><span className="odin-price-period">{t('plan.perMonth')}</span><div className="odin-price-credits">{plan.credits} {t('plan.creditsMo')}</div><ul>{plan.features.map(f=><li key={f}><Check className="w-3.5 h-3.5"/>{f}</li>)}</ul><button className={plan.highlight?'odin-btn odin-btn-hot':'odin-link'} onClick={()=>onNavigate('signup')}>{t('plan.getStarted')} <ArrowRight className="w-3.5 h-3.5"/></button></div>)}</div>;
}
