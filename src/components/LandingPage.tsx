import { useEffect, useState } from 'react';
import {
  ArrowRight, Check, ChevronDown, CreditCard, Globe2, Layers, Layout,
  Menu, Music2, Palette, Play, Sparkles, Wand2, Zap
} from 'lucide-react';
import { CelticEmblem } from './CelticEmblem';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { t } = useI18n();

  const capabilities = [
    { icon: Globe2, eyebrow: '01 / WEB', title: t('create.websites'), desc: t('create.websitesDesc') },
    { icon: Palette, eyebrow: '02 / BRAND', title: t('create.brands'), desc: t('create.brandsDesc') },
    { icon: Layout, eyebrow: '03 / LANDING', title: t('create.landing'), desc: t('create.landingDesc') },
    { icon: Layers, eyebrow: '04 / SOCIAL', title: t('create.cards'), desc: t('create.cardsDesc') },
    { icon: Sparkles, eyebrow: '05 / EVENTS', title: t('create.invitations'), desc: t('create.invitationsDesc') },
    { icon: Zap, eyebrow: '06 / CAMPAIGN', title: t('create.social'), desc: t('create.socialDesc') },
  ];

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
      <section className="designly-hero" aria-label="DESIGNLY STUDIO">
        <img src="/alap.jpg" alt="" className="designly-hero-image" aria-hidden="true" />
        <div className="designly-hero-vignette" />
        <div className="designly-hero-grain" />

        <div className="designly-hero-runes" aria-hidden="true">
          <span>ᛉ</span><span>ᚨ</span><span>ᛟ</span><span>ᚱ</span><span>ᚦ</span><span>ᚷ</span><span>ᛏ</span>
        </div>

        <div className="designly-hero-emblem" aria-hidden="true">
          <CelticEmblem size={620} animate showD={false} />
        </div>

        <div className="designly-hero-copy">
          <div className="designly-kicker">
            <span />
            AI CREATIVE INTELLIGENCE
            <span />
          </div>
          <h1>
            CREATE
            <strong>WITHOUT</strong>
            LIMITS.
          </h1>
          <p>
            DESIGNLY STUDIO turns one idea into a complete visual world —
            websites, brands, campaigns, content and music.
          </p>
          <div className="designly-hero-actions">
            <button className="btn-gold designly-primary-cta" onClick={() => onNavigate('signup')}>
              Start creating <ArrowRight className="w-4 h-4" />
            </button>
            <button className="designly-outline-cta" onClick={() => onNavigate('features')}>
              <Play className="w-4 h-4" /> Explore the studio
            </button>
          </div>
          <div className="designly-proof">
            <span><i /> AI-powered</span>
            <span><i /> One creative workspace</span>
            <span><i /> Built for speed</span>
          </div>
        </div>

        <div className="designly-scroll" aria-hidden="true">
          <span>SCROLL</span><i />
        </div>
      </section>

      <section className="designly-manifesto">
        <div className="designly-manifesto-mark"><CelticEmblem size={110} animate showD /></div>
        <div>
          <span className="designly-eyebrow">THE NEW CREATIVE WORKFLOW</span>
          <h2>One thought.<br /><em>Infinite possibilities.</em></h2>
        </div>
        <p>
          Stop jumping between tools. DESIGNLY brings the creative process together
          in one intelligent studio, from the first prompt to the finished asset.
        </p>
      </section>

      <section id="features" className="designly-section designly-capabilities">
        <div className="designly-section-head">
          <div>
            <span className="designly-eyebrow">THE STUDIO</span>
            <h2>Everything you need<br /><em>to make an impact.</em></h2>
          </div>
          <p>From a blank canvas to a complete campaign — create, refine and ship from one place.</p>
        </div>

        <div className="designly-capability-grid">
          {capabilities.map((item, index) => (
            <button key={item.title} className="designly-capability" onClick={() => onNavigate('signup')}>
              <div className="designly-capability-top">
                <span>{item.eyebrow}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="designly-capability-icon"><item.icon /></div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <div className="designly-capability-line" />
              <small>CREATE WITH AI</small>
            </button>
          ))}
        </div>
      </section>

      <section id="ai-music" className="designly-music">
        <div className="designly-music-orbit"><CelticEmblem size={500} animate showD={false} /></div>
        <div className="designly-music-content">
          <span className="designly-eyebrow">07 / AI MUSIC STUDIO</span>
          <h2>Give your idea<br /><em>a voice.</em></h2>
          <p>
            Write or generate lyrics, shape the song, then turn it into a complete
            track with vocals. A creative studio for the sound behind your story.
          </p>
          <div className="designly-tags">
            <span>Lyrics</span><span>Vocals</span><span>Music</span><span>WAV</span>
          </div>
          <button className="btn-gold" onClick={() => onNavigate('signup')}>
            Create your first track <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="designly-wave" aria-hidden="true">
          {Array.from({ length: 34 }).map((_, i) => <i key={i} style={{ ['--wave-i' as any]: i }} />)}
        </div>
      </section>

      <section id="workflow" className="designly-section designly-workflow">
        <div className="designly-section-head centered">
          <span className="designly-eyebrow">THE METHOD</span>
          <h2>From thought<br /><em>to finished work.</em></h2>
          <p>Simple on the surface. Powerful underneath.</p>
        </div>
        <div className="designly-workflow-grid">
          {workflow.map(([number, title, desc]) => (
            <div className="designly-step" key={number}>
              <span className="designly-step-number">{number}</span>
              <div className="designly-step-mark"><Wand2 className="w-4 h-4" /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="templates" className="designly-section designly-templates">
        <div className="designly-section-head">
          <div>
            <span className="designly-eyebrow">THE LIBRARY</span>
            <h2>Start with a direction.<br /><em>Make it yours.</em></h2>
          </div>
          <button className="designly-text-link" onClick={() => onNavigate('signup')}>View all templates <ArrowRight className="w-4 h-4" /></button>
        </div>
        <div className="designly-template-grid">
          {categories.map((cat, i) => (
            <button key={cat} className={`designly-template designly-template-${(i % 6) + 1}`} onClick={() => onNavigate('signup')}>
              <span className="designly-template-number">{String(i + 1).padStart(2, '0')}</span>
              <span>{cat}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ))}
        </div>
      </section>

      <section id="credits" className="designly-credits">
        <div className="designly-credit-orbit"><CelticEmblem size={360} animate showD={false} /></div>
        <div className="designly-credit-content">
          <span className="designly-eyebrow">ONE SYSTEM / PAY FOR CREATION</span>
          <h2>Credits that<br /><em>move with you.</em></h2>
          <p>Use your credits across the studio. Websites, identities, social content, campaigns and more — one flexible creative balance.</p>
          <div className="designly-credit-stats">
            <div><strong>100</strong><span>Social</span></div>
            <div><strong>300</strong><span>Logo</span></div>
            <div><strong>600</strong><span>Brand identity</span></div>
            <div><strong>3000</strong><span>Full website</span></div>
          </div>
          <button className="designly-text-link" onClick={() => onNavigate('pricing')}>See plans <ArrowRight className="w-4 h-4" /></button>
        </div>
      </section>

      <section id="pricing" className="designly-section designly-pricing">
        <div className="designly-section-head centered">
          <span className="designly-eyebrow">CHOOSE YOUR SCALE</span>
          <h2>Build more.<br /><em>Waste less.</em></h2>
          <p>Start free, then scale when your ideas demand more.</p>
        </div>
        <PricingPreview onNavigate={onNavigate} />
      </section>

      <section id="faq" className="designly-section designly-faq">
        <div className="designly-section-head centered">
          <span className="designly-eyebrow">QUESTIONS</span>
          <h2>Clear answers.<br /><em>No fog.</em></h2>
        </div>
        <FAQList />
      </section>

      <section className="designly-final">
        <div className="designly-final-runes">ᛉ ᚨ ᛟ &nbsp; ᚱ ᚦ ᚷ &nbsp; ᛏ ᚹ ᛒ</div>
        <CelticEmblem size={150} animate showD />
        <span className="designly-eyebrow">YOUR NEXT IDEA STARTS HERE</span>
        <h2>Make something<br /><em>worth remembering.</em></h2>
        <button className="btn-gold designly-final-button" onClick={() => onNavigate('signup')}>
          Enter DESIGNLY <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      <footer className="designly-footer">
        <div className="designly-footer-brand"><CelticEmblem size={42} animate showD /><span>DESIGNLY<small>STUDIO</small></span></div>
        <p>© {new Date().getFullYear()} DESIGNLY STUDIO. {t('footer.rights')}</p>
        <button onClick={() => onNavigate('landing')}>Back to top ↑</button>
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
    supabase.from('plans')
      .select('id,name,price_monthly,credits_monthly,features,sort_order')
      .eq('is_public', true)
      .order('sort_order')
      .then(({ data }) => {
        if (!mounted || !data?.length) return;
        setPlans(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price_monthly,
          credits: p.credits_monthly,
          features: Array.isArray(p.features) ? p.features.slice(0, 3) : [],
          highlight: p.id === 'pro',
        })));
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="designly-pricing-grid">
      {plans.map((plan) => (
        <div key={plan.id} className={`designly-price-card ${plan.highlight ? 'featured' : ''}`}>
          {plan.highlight && <span className="designly-price-badge">MOST POPULAR</span>}
          <span className="designly-price-name">{plan.name}</span>
          <strong>{new Intl.NumberFormat('hu-HU').format(plan.price)} <small>Ft</small></strong>
          <span className="designly-price-period">{t('plan.perMonth')}</span>
          <div className="designly-price-credits"><CreditCard className="w-4 h-4" /> {plan.credits} {t('plan.creditsMo')}</div>
          <ul>{plan.features.map((f) => <li key={f}><Check className="w-3.5 h-3.5" />{f}</li>)}</ul>
          <button className={plan.highlight ? 'btn-gold' : 'designly-price-button'} onClick={() => onNavigate('signup')}>
            {t('plan.getStarted')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function FAQList() {
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ];

  return (
    <div className="designly-faq-list">
      {faqs.map((faq, i) => (
        <div key={i} className={`designly-faq-item ${openIdx === i ? 'open' : ''}`}>
          <button onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            <span>{String(i + 1).padStart(2, '0')}</span><strong>{faq.q}</strong><ChevronDown className="w-4 h-4" />
          </button>
          {openIdx === i && <div className="designly-faq-answer">{faq.a}</div>}
        </div>
      ))}
    </div>
  );
}
