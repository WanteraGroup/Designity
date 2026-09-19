import { useEffect, useState } from 'react';
import {
  ArrowRight, Check, CreditCard, ChevronDown, Layers, Layout,
  Palette, Play, Sparkles, Wand2, Zap
} from 'lucide-react';
import { CelticEmblem } from './CelticEmblem';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const capabilities = [
  { icon: Wand2, number: '01', title: 'AI Design', desc: 'Create polished visual concepts from one clear brief.' },
  { icon: Zap, number: '02', title: 'Ad Studio', desc: 'Build campaign-ready concepts, copy and formats.' },
  { icon: Layers, number: '03', title: 'Campaigns', desc: 'Keep every asset consistent across a complete campaign.' },
  { icon: Layout, number: '04', title: 'Visual Editor', desc: 'Refine layouts, typography and finishing details.' },
  { icon: Palette, number: '05', title: 'Brand Kit', desc: 'Lock in your colors, type and visual language.' },
  { icon: Sparkles, number: '06', title: 'Template Library', desc: 'Start faster with curated directions for every need.' },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { t } = useI18n();
  const landingHeroBackground = '/stilus.png';

  const workflow = [
    ['01', t('workflow.step1Title'), t('workflow.step1Desc')],
    ['02', t('workflow.step2Title'), t('workflow.step2Desc')],
    ['03', t('workflow.step3Title'), t('workflow.step3Desc')],
    ['04', t('workflow.step4Title'), t('workflow.step4Desc')],
  ];

  const categories = [
    t('tpl.business'), t('tpl.restaurant'), t('tpl.realEstate'), t('tpl.beauty'),
    t('tpl.fitness'), t('tpl.technology'), t('tpl.events'), t('tpl.wedding'),
    t('tpl.personal'), t('tpl.ecommerce'), t('tpl.marketing'), t('tpl.corporate'),
  ];

  return (
    <div className="designly-site">
      <section className="dl-hero dl-hero-reference" aria-label="DESIGNLY STUDIO">
        <div
          className="dl-hero-bg"
          aria-hidden="true"
          style={landingHeroBackground ? { backgroundImage: `url("${landingHeroBackground}")` } : undefined}
        />
        <div className="dl-hero-shade" aria-hidden="true" />
        <div className="dl-reference-frame" aria-hidden="true" />
        <div className="dl-atmosphere" aria-hidden="true">
          <span className="dl-fog dl-fog-a" />
          <span className="dl-fog dl-fog-b" />
          <span className="dl-fog dl-fog-c" />
          <span className="dl-smoke dl-smoke-a" />
          <span className="dl-smoke dl-smoke-b" />
        </div>

        <span className="dl-raven-eye dl-raven-eye-left" aria-hidden="true" />
        <span className="dl-raven-eye dl-raven-eye-right" aria-hidden="true" />
        <span className="dl-raven-eye dl-raven-eye-left-small" aria-hidden="true" />
        <span className="dl-raven-eye dl-raven-eye-right-small" aria-hidden="true" />

        <div className="dl-reference-runes dl-reference-runes-left" aria-hidden="true">
          {['ᛉ','ᚨ','ᛟ','ᚱ','ᚦ','ᚷ','ᛏ','ᚹ','ᛒ'].map((rune, i) => <span key={`l-${rune}` + i}>{rune}</span>)}
        </div>
        <div className="dl-reference-runes dl-reference-runes-right" aria-hidden="true">
          {['ᛉ','ᚨ','ᛟ','ᚱ','ᚦ','ᚷ','ᛏ','ᚹ','ᛒ'].map((rune, i) => <span key={`r-${rune}` + i}>{rune}</span>)}
        </div>

        <div className="dl-reference-center">
          <div className="dl-reference-crest">
            <div className="dl-reference-glow" />
            <CelticEmblem size={410} animate showD />
          </div>

          <div className="dl-reference-tag">{t('landing.tag')}</div>
          <h1>{t('landing.title')} <em>{t('landing.emphasis')}</em></h1>
          <p>{t('landing.desc')}</p>

          <div className="dl-actions dl-reference-actions">
            <button className="dl-btn dl-btn-secondary" onClick={() => { const url = import.meta.env.VITE_VYRON_URL; if (url) window.open(url, '_blank', 'noopener,noreferrer'); }}>
              ◆ VYRON BUSINESS AI
            </button>
            <button className="dl-btn dl-btn-primary" onClick={() => onNavigate('signup')}>
              {t('landing.start')} <ArrowRight className="w-4 h-4" />
            </button>
            <button className="dl-btn dl-btn-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              <Play className="w-4 h-4" /> {t('landing.demo')}
            </button>
          </div>

          <div className="dl-reference-stats">
            <div><strong>50 000+</strong><span>{t('landing.templates')}</span></div>
            <i />
            <div><strong>∞</strong><span>{t('landing.possibilities')}</span></div>
            <i />
            <div><strong>12+</strong><span>{t('landing.tools')}</span></div>
            <i />
            <div><strong>GYORS</strong><span>{t('landing.results')}</span></div>
          </div>
        </div>

        <div className="dl-reference-claim">
          <span>IDEAS</span><br/><strong>BECOME REALITY™</strong>
          <small>AI POWERED<br/>CREATIVE STUDIO</small>
        </div>

        <div className="dl-reference-scroll">
          <span className="dl-mouse"><b /></span>
          <small>GÖRGESS TOVÁBB</small>
          <span>⌄</span>
        </div>

        <div className="dl-reference-footer">
          <span>KREATIVITÁS · TECHNOLÓGIA · SZABADSÁG</span>
          <span>DESIGNLY STUDIO — BUILT FOR CREATORS</span>
        </div>
      </section>

      <section className="dl-metrics" aria-label="Studio overview">
        <div><strong>01</strong><span>AI WORKSPACE</span></div>
        <div><strong>06</strong><span>CREATIVE TOOLS</span></div>
        <div><strong>24</strong><span>DESIGN CATEGORIES</span></div>
        <div><strong>∞</strong><span>WAYS TO CREATE</span></div>
      </section>

      <section id="features" className="dl-section dl-studio">
        <div className="dl-section-head">
          <div>
            <span className="dl-label">THE STUDIO / 01</span>
            <h2>One place.<br /><em>Every creative move.</em></h2>
          </div>
          <p>DESIGNLY combines AI generation, editing, brand systems, campaigns, templates and music into one focused workspace.</p>
        </div>
        <div className="dl-feature-grid">
          {capabilities.map((item) => (
            <button key={item.number} className="dl-feature" onClick={() => onNavigate('signup')}>
              <div className="dl-feature-meta"><span>{item.number}</span><ArrowRight className="w-4 h-4" /></div>
              <div className="dl-feature-icon"><item.icon /></div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <small>OPEN WORKSPACE</small>
            </button>
          ))}
        </div>
      </section>

      <section className="dl-manifesto">
        <div className="dl-manifesto-mark"><CelticEmblem size={92} animate showD={false} /></div>
        <div><span className="dl-label">DESIGNLY / PHILOSOPHY</span><h2>Less friction.<br /><em>More making.</em></h2></div>
        <p>From first thought to finished work, every part of the studio is designed to keep you moving instead of fighting the tools.</p>
      </section>

      <section id="workflow" className="dl-section dl-workflow">
        <div className="dl-section-head dl-centered">
          <span className="dl-label">THE METHOD / 02</span>
          <h2>From thought<br /><em>to finished work.</em></h2>
          <p>Four simple stages. One continuous creative flow.</p>
        </div>
        <div className="dl-workflow-grid">
          {workflow.map(([number, title, desc]) => (
            <div className="dl-step" key={number}>
              <span className="dl-step-number">{number}</span>
              <div className="dl-step-icon"><Wand2 className="w-4 h-4" /></div>
              <h3>{title}</h3><p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="templates" className="dl-section dl-library">
        <div className="dl-section-head">
          <div><span className="dl-label">THE LIBRARY / 03</span><h2>Start with a direction.<br /><em>Make it yours.</em></h2></div>
          <button className="dl-text-link" onClick={() => onNavigate('signup')}>View templates <ArrowRight className="w-4 h-4" /></button>
        </div>
        <div className="dl-category-grid">
          {categories.map((cat, i) => (
            <button key={cat} className="dl-category" onClick={() => onNavigate('signup')}>
              <span>{String(i + 1).padStart(2, '0')}</span><strong>{cat}</strong><ArrowRight className="w-4 h-4" />
            </button>
          ))}
        </div>
      </section>

      <section id="ai-music" className="dl-music">
        <div className="dl-music-art"><div className="dl-music-ring" /><CelticEmblem size={250} animate showD={false} /></div>
        <div className="dl-music-copy">
          <span className="dl-label">07 / AI MUSIC STUDIO</span>
          <h2>Give your idea<br /><em>a voice.</em></h2>
          <p>Shape lyrics, vocals and music in the same creative environment as your visual work.</p>
          <div className="dl-tags"><span>LYRICS</span><span>VOCALS</span><span>MUSIC</span><span>WAV</span></div>
          <button className="dl-btn dl-btn-primary" onClick={() => onNavigate('signup')}>Create a track <ArrowRight className="w-4 h-4" /></button>
        </div>
      </section>

      <section id="credits" className="dl-section dl-credits">
        <div className="dl-section-head">
          <div><span className="dl-label">ONE SYSTEM / 04</span><h2>Credits that<br /><em>move with you.</em></h2></div>
          <p>Use one creative balance across the studio. Generate, refine and keep building without switching systems.</p>
        </div>
        <div className="dl-credit-row">
          {[
            ['100','Social'],['300','Logo'],['600','Brand identity'],['3000','Full website']
          ].map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        <button className="dl-text-link" onClick={() => onNavigate('pricing')}>See plans <ArrowRight className="w-4 h-4" /></button>
      </section>

      <section id="pricing" className="dl-section dl-pricing">
        <div className="dl-section-head dl-centered"><span className="dl-label">CHOOSE YOUR SCALE</span><h2>Build more.<br /><em>Waste less.</em></h2><p>Start free, then scale when your ideas demand more.</p></div>
        <PricingPreview onNavigate={onNavigate} />
      </section>

      <section id="faq" className="dl-section dl-faq">
        <div className="dl-section-head dl-centered"><span className="dl-label">QUESTIONS</span><h2>Clear answers.<br /><em>No fog.</em></h2></div>
        <FAQList />
      </section>

      <section className="dl-final">
        <div className="dl-final-runes">ᛉ ᚨ ᛟ &nbsp; ᚱ ᚦ ᚷ &nbsp; ᛏ ᚹ ᛒ</div>
        <CelticEmblem size={105} animate showD />
        <span className="dl-label">YOUR NEXT IDEA STARTS HERE</span>
        <h2>Make something<br /><em>worth remembering.</em></h2>
        <button className="dl-btn dl-btn-primary" onClick={() => onNavigate('signup')}>Enter DESIGNLY <ArrowRight className="w-4 h-4" /></button>
      </section>

      <footer className="dl-footer">
        <div className="dl-footer-brand"><CelticEmblem size={34} animate showD={false} /><span>DESIGNLY <small>STUDIO</small></span></div>
        <p>© {new Date().getFullYear()} DESIGNLY STUDIO. {t('footer.rights')}</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button>
      </footer>
    </div>
  );
}

function PricingPreview({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { t } = useI18n();
  const fallbackPlans = [
    { id: 'free', name: t('plan.free'), price: 0, credits: 10, features: [t('plan.freeF1'), t('plan.freeF2')], highlight: false },
    { id: 'starter', name: t('plan.starter'), price: 2490, credits: 50, features: [t('plan.starterF1'), t('plan.starterF2'), t('plan.starterF3')], highlight: false },
    { id: 'pro', name: t('plan.pro'), price: 6990, credits: 200, features: [t('plan.proF1'), t('plan.proF2'), t('plan.proF3')], highlight: true },
    { id: 'business', name: t('plan.business'), price: 12990, credits: 500, features: [t('plan.businessF1'), t('plan.businessF2')], highlight: false },
    { id: 'agency', name: t('plan.agency'), price: 24990, credits: 1500, features: [t('plan.agencyF1'), t('plan.agencyF2')], highlight: false },
  ];
  const [plans, setPlans] = useState(fallbackPlans);
  useEffect(() => {
    let mounted = true;
    supabase.from('plans').select('id,name,price_monthly,credits_monthly,features,sort_order').eq('is_public', true).order('sort_order')
      .then(({ data }) => {
        if (!mounted || !data?.length) return;
        setPlans(data.map((p: any) => ({ id:p.id, name:p.name, price:p.price_monthly, credits:p.credits_monthly, features:Array.isArray(p.features)?p.features.slice(0,3):[], highlight:p.id==='pro' })));
      });
    return () => { mounted = false; };
  }, []);
  return <div className="dl-pricing-grid">{plans.map((plan) => (
    <div key={plan.id} className={`dl-price-card ${plan.highlight ? 'featured' : ''}`}>
      {plan.highlight && <span className="dl-price-badge">POPULAR</span>}
      <span className="dl-price-name">{plan.name}</span>
      <strong>{new Intl.NumberFormat('hu-HU').format(plan.price)} <small>Ft</small></strong>
      <span className="dl-price-period">{t('plan.perMonth')}</span>
      <div className="dl-price-credits"><CreditCard className="w-4 h-4" /> {plan.credits} {t('plan.creditsMo')}</div>
      <ul>{plan.features.map((f) => <li key={f}><Check className="w-3.5 h-3.5" />{f}</li>)}</ul>
      <button className={plan.highlight ? 'dl-btn dl-btn-primary' : 'dl-price-button'} onClick={() => onNavigate('signup')}>{t('plan.getStarted')} <ArrowRight className="w-3.5 h-3.5" /></button>
    </div>
  ))}</div>;
}

function FAQList() {
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q:t('faq.q1'), a:t('faq.a1') }, { q:t('faq.q2'), a:t('faq.a2') },
    { q:t('faq.q3'), a:t('faq.a3') }, { q:t('faq.q4'), a:t('faq.a4') },
    { q:t('faq.q5'), a:t('faq.a5') }, { q:t('faq.q6'), a:t('faq.a6') },
  ];
  return <div className="dl-faq-list">{faqs.map((faq,i) => (
    <div key={i} className={`dl-faq-item ${openIdx===i?'open':''}`}>
      <button onClick={() => setOpenIdx(openIdx===i?null:i)}><span>{String(i+1).padStart(2,'0')}</span><strong>{faq.q}</strong><ChevronDown className="w-4 h-4" /></button>
      {openIdx===i && <div className="dl-faq-answer">{faq.a}</div>}
    </div>
  ))}</div>;
}
