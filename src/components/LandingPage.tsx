import { useEffect, useState, type ComponentType } from 'react';
import {
  ArrowRight, Check, ChevronDown, Gamepad2, Image, Layout, Palette,
  Play, Sparkles, Wand2, Zap, Shirt, Bot, Layers3, MousePointer2,
  Globe2, ShoppingBag, Megaphone, Music2, Trophy, Users, Ruler
} from 'lucide-react';
import { CelticEmblem } from './CelticEmblem';
import { Logo } from './Logo';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { PUBLIC_PLANS } from '@/lib/constants';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

function Raven({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 180 140" className={`dl-home-raven ${flip ? 'is-flipped' : ''}`} aria-hidden="true">
      <defs>
        <linearGradient id={flip ? 'ravenMetalB' : 'ravenMetalA'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1d98f" />
          <stop offset=".42" stopColor="#9d7423" />
          <stop offset="1" stopColor="#17120a" />
        </linearGradient>
      </defs>
      <path d="M70 80C35 45 20 33 6 24c18 34 31 58 59 71 7 3 9-3 5-15Z" fill="#0a0b0d" stroke={`url(#${flip ? 'ravenMetalB' : 'ravenMetalA'})`} strokeWidth="2" />
      <ellipse cx="104" cy="88" rx="55" ry="31" fill="#08090a" stroke={`url(#${flip ? 'ravenMetalB' : 'ravenMetalA'})`} strokeWidth="2" />
      <circle cx="145" cy="54" r="24" fill="#08090a" stroke={`url(#${flip ? 'ravenMetalB' : 'ravenMetalA'})`} strokeWidth="2" />
      <path d="M162 55 178 62 162 68Z" fill="#171108" stroke="#ba8b2d" strokeWidth="1.5" />
      <circle cx="150" cy="51" r="3.6" fill="#ffd978" />
      <path d="M70 102c24 19 49 25 78 20" fill="none" stroke="#0f1113" strokeWidth="12" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { t, lang } = useI18n();
  const hu = lang === 'hu';

  const copy = hu ? {
    badge: 'AI ALAPÚ CREATIVE OS',
    title: 'ÖTLETBŐL',
    emphasis: 'VALÓSÁG.',
    desc: 'DESIGNLY STUDIO — egyetlen kreatív rendszer weboldalakhoz, márkákhoz, streamer/gamer grafikákhoz, kampányokhoz és mindenhez, amit létre szeretnél hozni.',
    start: 'Kezdj el alkotni',
    demo: 'Nézd meg a működést',
    creator: 'Creator Zone',
    business: 'Business Zone',
    creatorDesc: 'Streamereknek, gamereknek, tartalomkészítőknek.',
    businessDesc: 'Vállalkozásoknak, márkáknak és kreatív csapatoknak.',
    createTitle: 'MIT SZERETNÉL LÉTREHOZNI?',
    createSub: 'Válassz egy területet, és indulhat az alkotás.',
    popular: 'NÉPSZERŰ KATEGÓRIÁK',
    workflowTitle: 'HOGYAN MŰKÖDIK?',
    workflowSub: 'Négy lépés. Egy folyamatos kreatív rendszer.',
    testimonial: 'A DESIGNLY egy helyre hozza a teljes kreatív folyamatot.',
    pricingTitle: 'PRICING / ÁRAZÁS',
    pricingSub: 'Válassz a számodra megfelelő csomagot.',
    finalTitle: 'KÉSZÍTS VALAMI EMLÉKEZETESET, AMIRE BÜSZKE LESZEL.',
    finalSub: 'Egy ötlet. Egy rendszer. Végtelen lehetőség.',
    join: 'Belépek a DESIGNLY-be',
    back: 'Vissza a tetejére',
    all: 'Összes kategória',
  } : {
    badge: 'AI-POWERED CREATIVE OS',
    title: 'IDEAS INTO',
    emphasis: 'REALITY.',
    desc: 'DESIGNLY STUDIO — one creative system for websites, brands, streamer/gamer graphics, campaigns, and everything you want to make.',
    start: 'Start creating',
    demo: 'See how it works',
    creator: 'Creator Zone',
    business: 'Business Zone',
    creatorDesc: 'For streamers, gamers and content creators.',
    businessDesc: 'For businesses, brands and creative teams.',
    createTitle: 'WHAT DO YOU WANT TO CREATE?',
    createSub: 'Choose a creative area and start making.',
    popular: 'POPULAR CATEGORIES',
    workflowTitle: 'HOW IT WORKS',
    workflowSub: 'Four steps. One continuous creative system.',
    testimonial: 'DESIGNLY brings the entire creative workflow into one place.',
    pricingTitle: 'PRICING',
    pricingSub: 'Choose the plan that fits your creative scale.',
    finalTitle: 'MAKE SOMETHING WORTH REMEMBERING',
    finalSub: 'One idea. One system. Infinite possibilities.',
    join: 'Enter DESIGNLY',
    back: 'Back to top',
    all: 'All categories',
  };

  const creationCards = [
    { label: 'AI Website Builder', desc: hu ? 'Profi weboldalak egy briefből.' : 'Professional websites from one brief.', icon: Globe2, page: 'create', media: 'web' },
    { label: 'Streamer Studio', desc: hu ? 'Overlayek, alertok, panelek és scene-ek.' : 'Overlays, alerts, panels and scenes.', icon: Gamepad2, page: 'streamer', media: 'stream' },
    { label: 'Merch Studio', desc: hu ? 'Pólók, bögrék, egérpadok és csapatgrafikák.' : 'Shirts, mugs, mousepads and team graphics.', icon: Shirt, page: 'creator', media: 'merch' },
    { label: 'Sablonok', desc: hu ? '100 000+ kreatív irány, igény szerint.' : '100,000+ creative directions on demand.', icon: Layers3, page: 'templates', media: 'templates' },
    { label: 'Design Editor', desc: hu ? 'AI-képszerkesztés és vizuális finomhangolás.' : 'AI editing and visual refinement.', icon: Wand2, page: 'editor', media: 'editor' },
    { label: 'Tervező & Vizualizáló', desc: hu ? 'Alaprajzok, villamos és gépészeti tervkoncepciók AI-val.' : 'Floor plans, electrical and building-system concepts with AI.', icon: Ruler, page: 'planner', media: 'planner' },
    { label: 'AI Video & Mockup', desc: hu ? 'Videós, animációs és prezentációs kreatívok.' : 'Video, animation and presentation creatives.', icon: Play, page: 'create', media: 'video' },
  ];

  const popular = [
    { title: hu ? 'Stream Overlayek' : 'Stream Overlays', icon: Gamepad2, color: 'blue', page: 'streamer' },
    { title: hu ? 'Alert Animációk' : 'Alert Animations', icon: Zap, color: 'gold', page: 'streamer' },
    { title: 'YouTube Thumbnail', icon: Play, color: 'red', page: 'streamer' },
    { title: hu ? 'Logók és Arculatok' : 'Logos & Identity', icon: Palette, color: 'violet', page: 'create' },
    { title: hu ? 'Pólók és Merch' : 'Apparel & Merch', icon: Shirt, color: 'silver', page: 'creator' },
    { title: hu ? 'Weboldal Sablonok' : 'Website Templates', icon: Globe2, color: 'cyan', page: 'templates' },
    { title: hu ? 'Emote Csomagok' : 'Emote Packs', icon: Users, color: 'pink', page: 'streamer' },
    { title: hu ? 'Esport Design' : 'Esports Design', icon: Trophy, color: 'green', page: 'streamer' },
    { title: hu ? 'Alaprajz & Tervrajz' : 'Plans & Layouts', icon: Ruler, color: 'gold', page: 'planner' },
  ];

  const workflow: Array<[string, string, string, ComponentType<{ className?: string }>]> = [
    [ '01', hu ? 'Válassz sablont vagy AI-területet' : 'Choose a template or AI tool', hu ? 'Kezdj egy kész iránnyal vagy tiszta lappal.' : 'Start from a direction or a clean canvas.', MousePointer2 ],
    [ '02', hu ? 'Szabd testre' : 'Customize it', hu ? 'Színek, szöveg, stílus, elemek és márkaarculat.' : 'Colors, copy, style, elements and brand system.', Palette ],
    [ '03', hu ? 'Nézd meg nagy előnézetben' : 'Preview at full size', hu ? 'Ellenőrizd az egész kompozíciót és az exportot.' : 'Review the full composition and export setup.', Image ],
    [ '04', hu ? 'Töltsd le vagy használd fel' : 'Export or publish', hu ? 'Digitálisan, nyomtatva vagy a saját projektjeidben.' : 'Digital, print or inside your own projects.', ArrowRight ],
  ];

  const categories = [
    t('tpl.business'), t('tpl.restaurant'), t('tpl.realEstate'), t('tpl.beauty'),
    t('tpl.fitness'), t('tpl.technology'), t('tpl.events'), t('tpl.wedding'),
    t('tpl.personal'), t('tpl.ecommerce'), t('tpl.marketing'), t('tpl.corporate'),
  ];

  return (
    <div className="dl-home">
      <section className="dl-home-hero">
        <div className="dl-home-hero-bg" aria-hidden="true" />
        <div className="dl-home-hero-vignette" aria-hidden="true" />
        <div className="dl-home-runes dl-home-runes-left" aria-hidden="true">{['ᛉ','ᚨ','ᛟ','ᚱ','ᚦ','ᚷ','ᛏ','ᚹ'].map((r,i)=><span key={`l${i}`}>{r}</span>)}</div>
        <div className="dl-home-runes dl-home-runes-right" aria-hidden="true">{['ᛒ','ᛞ','ᛃ','ᚾ','ᛁ','ᛇ','ᛈ','ᛗ'].map((r,i)=><span key={`r${i}`}>{r}</span>)}</div>

        <div className="dl-home-raven-wrap dl-home-raven-left"><Raven /></div>
        <div className="dl-home-raven-wrap dl-home-raven-right"><Raven flip /></div>

        <div className="dl-home-hero-center">
          <div className="dl-home-crest"><CelticEmblem size={168} animate showD /></div>
          <span className="dl-home-kicker">{copy.badge}</span>
          <h1>DESIGNLY <em>STUDIO</em></h1>
          <div className="dl-home-tagline">CREATE · SHAPE · SHIP</div>
          <p>{copy.desc}</p>
          <div className="dl-home-actions">
            <button className="dl-home-btn dl-home-btn-primary" onClick={() => onNavigate('signup')}>{copy.start}<ArrowRight className="w-4 h-4" /></button>
            <button className="dl-home-btn dl-home-btn-ghost" onClick={() => document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' })}><Play className="w-4 h-4" />{copy.demo}</button>
          </div>
          <div className="dl-home-proof">
            <span><strong>100 000+</strong>{hu ? 'sablonvariáció' : 'template variations'}</span>
            <span><strong>44</strong>{hu ? 'asset típus' : 'asset types'}</span>
            <span><strong>AI</strong>{hu ? 'egyedi generálás' : 'custom generation'}</span>
            <span><strong>∞</strong>{hu ? 'kreatív lehetőség' : 'creative possibilities'}</span>
          </div>
        </div>

        <div className="dl-home-raven-label dl-home-raven-label-left"><strong>HUGINN</strong><span>{hu ? 'Gondolatból valóság.' : 'From thought to reality.'}</span></div>
        <div className="dl-home-raven-label dl-home-raven-label-right"><strong>MUNINN</strong><span>{hu ? 'Tudásból alkotás.' : 'From knowledge to creation.'}</span></div>

        <div className="dl-home-hero-side-note">{hu ? 'AI ALAPÚ KREATÍV PLATFORM' : 'AI-POWERED CREATIVE PLATFORM'}<br /><small>{hu ? 'MINDEN ALKOTÓ SZÁMÁRA' : 'FOR EVERY CREATOR'}</small></div>
        <div className="dl-home-scroll"><span>↓</span>{hu ? 'GÖRGESS TOVÁBB' : 'SCROLL TO CREATE'}</div>
      </section>

      <section id="create" className="dl-home-section dl-home-create">
        <div className="dl-home-section-head">
          <div>
            <span className="dl-home-label">01 / CREATIVE FACTORY</span>
            <h2>{copy.createTitle}</h2>
            <p>{copy.createSub}</p>
          </div>
          <button className="dl-home-inline-link" onClick={() => onNavigate('create')}>{hu ? 'Teljes létrehozás' : 'Open creation'} <ArrowRight className="w-4 h-4" /></button>
        </div>

        <div className="dl-home-create-grid">
          {creationCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <button key={card.label} className={`dl-home-create-card dl-home-media-${card.media}`} onClick={() => onNavigate(card.page)}>
                <div className="dl-home-card-art" aria-hidden="true"><div className="dl-home-card-glow" /><Icon className="w-10 h-10" /></div>
                <div className="dl-home-card-index">{String(i + 1).padStart(2,'0')}</div>
                <div className="dl-home-card-copy">
                  <h3>{card.label}</h3><p>{card.desc}</p>
                  <span>{hu ? 'MEGNYITÁS' : 'OPEN'} <ArrowRight className="w-3.5 h-3.5" /></span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="dl-home-stats">
          <div><strong>0 KREDIT</strong><span>{hu ? 'előnézetek' : 'previews'}</span></div>
          <div><strong>AI</strong><span>{hu ? 'kreatív partner' : 'creative partner'}</span></div>
          <div><strong>01</strong><span>{hu ? 'egységes workflow' : 'unified workflow'}</span></div>
          <div><strong>∞</strong><span>{hu ? 'kreatív irány' : 'creative directions'}</span></div>
          <div><strong>24/7</strong><span>{hu ? 'alkotási rendszer' : 'creation system'}</span></div>
        </div>
      </section>

      <section className="dl-home-section dl-home-popular">
        <div className="dl-home-section-head center">
          <div><span className="dl-home-label">02 / LIBRARY</span><h2>{copy.popular}</h2><p>{hu ? 'Fedezd fel a leggyakrabban használt kreatív irányokat.' : 'Explore the most useful creative directions.'}</p></div>
          <button className="dl-home-inline-link" onClick={() => onNavigate('templates')}>{copy.all} <ArrowRight className="w-4 h-4" /></button>
        </div>
        <div className="dl-home-popular-grid">
          {popular.map((item, i) => {
            const Icon = item.icon;
            return <button key={item.title} className={`dl-home-popular-card dl-home-popular-${item.color}`} onClick={() => onNavigate(item.page)}>
              <div className="dl-home-popular-art"><Icon className="w-8 h-8" /></div>
              <strong>{item.title}</strong>
              <span>{String(i + 1).padStart(2,'0')}</span>
            </button>;
          })}
        </div>
      </section>

      <section className="dl-home-section dl-home-zones">
        <div className="dl-home-zone creator">
          <div className="dl-home-zone-image" />
          <div className="dl-home-zone-content"><span className="dl-home-label">CREATOR / STREAMER</span><h2>{copy.creator}</h2><p>{copy.creatorDesc}</p><div className="dl-home-zone-tags"><span>OVERLAYS</span><span>ALERTS</span><span>EMOTES</span><span>MERCH</span></div><button className="dl-home-btn dl-home-btn-primary" onClick={() => onNavigate('streamer')}>{hu ? 'Fedezd fel' : 'Explore'} <ArrowRight className="w-4 h-4" /></button></div>
        </div>
        <div className="dl-home-zone business">
          <div className="dl-home-zone-image" />
          <div className="dl-home-zone-content"><span className="dl-home-label">BUSINESS / BRAND</span><h2>{copy.business}</h2><p>{copy.businessDesc}</p><div className="dl-home-zone-tags"><span>BRAND</span><span>CAMPAIGN</span><span>WEBSITE</span><span>AI</span></div><button className="dl-home-btn dl-home-btn-primary" onClick={() => onNavigate('create')}>{hu ? 'Növeld a márkád' : 'Grow your brand'} <ArrowRight className="w-4 h-4" /></button></div>
        </div>
      </section>

      <section className="dl-home-section dl-home-workflow">
        <div className="dl-home-section-head center">
          <div><span className="dl-home-label">03 / WORKFLOW</span><h2>{copy.workflowTitle}</h2><p>{copy.workflowSub}</p></div>
        </div>
        <div className="dl-home-workflow-grid">
          {workflow.map(([number, title, desc, Icon]) => (
            <div key={number} className="dl-home-step"><span className="dl-home-step-number">{number}</span><div className="dl-home-step-icon"><Icon className="w-5 h-5" /></div><h3>{title}</h3><p>{desc}</p></div>
          ))}
        </div>
      </section>

      <section className="dl-home-section dl-home-categories">
        <div className="dl-home-section-head"><div><span className="dl-home-label">04 / TEMPLATE UNIVERSE</span><h2>{hu ? 'Sablonok minden iparágra.' : 'Templates for every industry.'}</h2><p>{hu ? 'Válassz egy témát, majd engedd, hogy a DESIGNLY a saját irányoddá alakítsa.' : 'Choose a theme and let DESIGNLY turn it into your own direction.'}</p></div></div>
        <div className="dl-home-category-grid">{categories.map((cat, i) => <button key={cat} onClick={() => onNavigate('templates')} className="dl-home-category"><span>{String(i + 1).padStart(2,'0')}</span><strong>{cat}</strong><ArrowRight className="w-4 h-4" /></button>)}</div>
      </section>

      <section className="dl-home-quote">
        <div className="dl-home-quote-mark"><CelticEmblem size={70} animate /></div>
        <div><span className="dl-home-label">05 / CREATIVE OS</span><h2>{copy.testimonial}</h2><p>{hu ? 'Egy helyen marad a brief, a márka, az AI-generálás, a szerkesztés, az export és a projekt.' : 'Brief, brand, AI generation, editing, export and project history stay in one place.'}</p></div>
        <div className="dl-home-quote-badge"><Bot className="w-5 h-5" /><strong>HUGINN · MUNINN</strong><span>{hu ? 'AI ügynökpár' : 'AI agent duo'}</span></div>
      </section>

      <section id="pricing" className="dl-home-section dl-home-pricing">
        <div className="dl-home-section-head center"><div><span className="dl-home-label">06 / SCALE</span><h2>{copy.pricingTitle}</h2><p>{copy.pricingSub}</p></div></div>
        <PricingPreview onNavigate={onNavigate} />
      </section>

      <section className="dl-home-faq" id="faq">
        <div className="dl-home-section-head center"><div><span className="dl-home-label">07 / FAQ</span><h2>{hu ? 'Válaszok köd nélkül.' : 'Clear answers. No fog.'}</h2></div></div>
        <FAQList />
      </section>

      <section className="dl-home-final">
        <div className="dl-home-final-bg" />
        <div className="dl-home-final-runes">ᛉ ᚨ ᛟ · ᚱ ᚦ ᚷ · ᛏ ᚹ ᛒ</div>
        <Logo size={58} showText={false} />
        <span className="dl-home-label">{hu ? 'A KÖVETKEZŐ ÖTLETED ITT KEZDŐDIK' : 'YOUR NEXT IDEA STARTS HERE'}</span>
        <h2>{copy.finalTitle}</h2>
        <p>{copy.finalSub}</p>
        <button className="dl-home-btn dl-home-btn-primary" onClick={() => onNavigate('signup')}>{copy.join} <ArrowRight className="w-4 h-4" /></button>
      </section>

      <footer className="dl-home-footer">
        <div className="dl-home-footer-brand"><Logo size={36} showText={true} /></div>
        <div className="dl-home-footer-copy"><strong>CREATE · DESIGN · STREAM · DOMINATE</strong><span>© {new Date().getFullYear()} DESIGNLY STUDIO. {t('footer.rights')}</span></div>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{copy.back} ↑</button>
      </footer>
    </div>
  );
}

function PricingPreview({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { t } = useI18n();
  const fallbackPlans = PUBLIC_PLANS.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.priceMonthly,
    credits: plan.creditsMonthly,
    features: plan.features.slice(0, 4),
    highlight: plan.highlighted === true,
  }));
  const [plans, setPlans] = useState(fallbackPlans);
  useEffect(() => {
    let mounted = true;
    supabase.from('plans').select('id,name,price_monthly,credits_monthly,features,sort_order').eq('is_public', true).order('sort_order')
      .then(({ data }) => {
        if (!mounted || !data?.length) return;
        setPlans(data.map((p: any) => ({ id:p.id, name:p.name, price:p.price_monthly, credits:p.credits_monthly, features:Array.isArray(p.features)?p.features.slice(0,4):[], highlight:p.id==='pro' })));
      });
    return () => { mounted = false; };
  }, []);
  return <div className="dl-home-pricing-grid">{plans.map((plan) => (
    <div key={plan.id} className={`dl-home-price-card ${plan.highlight ? 'featured' : ''}`}>
      {plan.highlight && <span className="dl-home-price-badge">NÉPSZERŰ</span>}
      <span className="dl-home-price-name">{plan.name}</span>
      <strong>{new Intl.NumberFormat('hu-HU').format(plan.price)} <small>Ft</small></strong>
      <span className="dl-home-price-period">{t('plan.perMonth')}</span>
      <div className="dl-home-price-credits">{plan.credits} {t('plan.creditsMo')}</div>
      <ul>{plan.features.map((f) => <li key={f}><Check className="w-3.5 h-3.5" />{f}</li>)}</ul>
      <button className={plan.highlight ? 'dl-home-btn dl-home-btn-primary' : 'dl-home-price-button'} onClick={() => onNavigate('signup')}>{t('plan.getStarted')} <ArrowRight className="w-3.5 h-3.5" /></button>
    </div>
  ))}</div>;
}

function FAQList() {
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q:t('faq.q1'), a:t('faq.a1') },
    { q:t('faq.q2'), a:t('faq.a2') },
    { q:t('faq.q3'), a:t('faq.a3') },
    { q:t('faq.q4'), a:t('faq.a4') },
    { q:t('faq.q5'), a:t('faq.a5') },
    { q:t('faq.q6'), a:t('faq.a6') },
  ];
  return <div className="dl-home-faq-list">{faqs.map((faq,i) => (
    <div key={i} className={`dl-home-faq-item ${openIdx===i?'open':''}`}>
      <button onClick={() => setOpenIdx(openIdx===i?null:i)}>
        <span>{String(i+1).padStart(2,'0')}</span>
        <strong>{faq.q}</strong>
        <ChevronDown className="w-4 h-4" />
      </button>
      {openIdx===i && <div className="dl-home-faq-answer">{faq.a}</div>}
    </div>
  ))}</div>;
}
