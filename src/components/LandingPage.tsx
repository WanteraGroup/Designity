import { useEffect, useState } from 'react';
import { Sparkles, Globe2, Palette, Layout, CreditCard, Layers, Zap, Music2 } from 'lucide-react';
import { CelticEmblem } from './CelticEmblem';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { t } = useI18n();

  const createItems = [
    { icon: Globe2, title: t('create.websites'), desc: t('create.websitesDesc') },
    { icon: Palette, title: t('create.brands'), desc: t('create.brandsDesc') },
    { icon: Layout, title: t('create.landing'), desc: t('create.landingDesc') },
    { icon: Layers, title: t('create.cards'), desc: t('create.cardsDesc') },
    { icon: Sparkles, title: t('create.invitations'), desc: t('create.invitationsDesc') },
    { icon: Zap, title: t('create.social'), desc: t('create.socialDesc') },
    { icon: Music2, title: t('create.music'), desc: t('create.musicDesc') },
  ];

  const workflowSteps = [
    { title: t('workflow.step1Title'), desc: t('workflow.step1Desc') },
    { title: t('workflow.step2Title'), desc: t('workflow.step2Desc') },
    { title: t('workflow.step3Title'), desc: t('workflow.step3Desc') },
    { title: t('workflow.step4Title'), desc: t('workflow.step4Desc') },
  ];

  const creditExamples = [
    { label: t('create.social'), credits: 100 },
    { label: t('create.logo'), credits: 300 },
    { label: t('create.brandIdentity'), credits: 600 },
    { label: t('create.fullWebsite'), credits: 3000 },
  ];

  const templateCats = [
    t('tpl.business'), t('tpl.restaurant'), t('tpl.realEstate'), t('tpl.beauty'), t('tpl.fitness'), t('tpl.technology'),
    t('tpl.events'), t('tpl.wedding'), t('tpl.personal'), t('tpl.ecommerce'), t('tpl.marketing'), t('tpl.corporate'),
  ];

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative min-h-[900px] lg:min-h-[1000px] flex items-center justify-center overflow-hidden pt-20 hero-cinematic">
        <div className="hero-reference-art" aria-hidden="true" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        {/* Atmospheric smoke layers — translucent gray, non-blocking */}
        <div className="smoke-layer smoke-1" />
        <div className="smoke-layer smoke-2" />
        <div className="smoke-layer smoke-3" />
        {/* Mist layers — low contrast, near bottom */}
        <div className="mist-layer mist-1" />
        <div className="mist-layer mist-2" />
        {/* Subtle gold light */}
        <div className="gold-light" style={{ width: 400, height: 400, top: 30, left: 'calc(50% - 200px)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/15 via-ink-950/50 to-ink-950" />
        <div className="hero-emblem" aria-hidden="true">
          <CelticEmblem size={390} animate showD />
        </div>
        <div className="rune-field" aria-hidden="true">
          {['ᚱ','ᚨ','ᚾ','ᛏ','ᚲ','ᛉ','ᛟ','ᚠ','ᚷ','ᛞ'].map((rune, i) => (
            <span key={i} className="floating-rune" style={{ ['--rune-i' as string]: i } as React.CSSProperties}>{rune}</span>
          ))}
        </div>
                <div className="hero-art-vignette" aria-hidden="true" />

        <div className="absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col gap-2 text-[10px] sm:text-xs tracking-[0.28em] text-gold-200/80 uppercase">
          {['AI', 'DESIGN', 'BRAND', 'WEB', 'BUSINESS'].map((item) => <span key={item}>{item}</span>)}
          <span className="mt-2 h-px w-10 bg-gold-500/50" />
        </div>
        <div className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col items-end gap-2 text-[10px] sm:text-xs tracking-[0.28em] text-gold-200/80 uppercase">
          {['VISION', 'STRATEGY', 'CREATIVITY', 'TECHNOLOGY', 'RESULTS'].map((item) => <span key={item}>{item}</span>)}
          <span className="mt-2 h-px w-10 bg-gold-500/50" />
        </div>

        <div className="relative section-pad max-w-6xl mx-auto text-center z-10 hero-content">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 rounded-full border border-gold-600/20 bg-gold-600/5 animate-fade-in">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-medium tracking-widest text-gold-200 uppercase">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-display font-bold text-cream-50 text-balance mb-6 hero-copy animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {t('hero.title')}
          </h1>

          <p className="text-lg sm:text-xl text-cream-300/80 max-w-3xl mx-auto mb-10 text-balance leading-relaxed hero-copy animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <button onClick={() => onNavigate('signup')} className="btn-gold text-base w-full sm:w-auto">
              <Sparkles className="w-5 h-5" />
              {t('hero.ctaPrimary')}
            </button>
            <button onClick={() => onNavigate('features')} className="btn-ghost text-base w-full sm:w-auto">
              {t('hero.ctaSecondary')}
            </button>
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 hidden lg:flex items-center gap-8 text-xs text-cream-300/80">
          <div><span className="text-gold-300 font-medium">AI POWERED</span><span className="block text-[10px] text-cream-400/60">Professional results</span></div>
          <div className="h-8 w-px bg-gold-500/20" />
          <div><span className="text-gold-300 font-medium">PREMIUM TEMPLATES</span><span className="block text-[10px] text-cream-400/60">Print & digital formats</span></div>
          <div className="h-8 w-px bg-gold-500/20" />
          <div><span className="text-gold-300 font-medium">BRAND CONSISTENCY</span><span className="block text-[10px] text-cream-400/60">Your style, everywhere</span></div>
          <div className="h-8 w-px bg-gold-500/20" />
          <div><span className="text-gold-300 font-medium">SAVE TIME</span><span className="block text-[10px] text-cream-400/60">From idea to reality</span></div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="w-px h-12 bg-gradient-to-b from-gold-600/40 to-transparent" />
        </div>
      </section>

      {/* What You Can Create */}
      <section id="features" className="py-24 lg:py-32 section-pad max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold gold-text mb-4">
            {t('create.title')}
          </h2>
          <p className="text-lg text-cream-300/70 max-w-2xl mx-auto">{t('create.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {createItems.map((item, i) => (
            <div
              key={item.title}
              className="card-lux p-6 group cursor-pointer animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => onNavigate('signup')}
            >
              <div className="w-12 h-12 rounded-lg bg-gold-600/10 border border-gold-600/20 flex items-center justify-center mb-4 group-hover:bg-gold-600/20 transition-all duration-300">
                <item.icon className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="text-lg font-display font-semibold text-cream-50 mb-2">{item.title}</h3>
              <p className="text-sm text-cream-300/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Creative Workflow */}
      <section id="workflow" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gold opacity-50" />
        <div className="relative section-pad max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold gold-text mb-4">
              {t('workflow.title')}
            </h2>
            <p className="text-lg text-cream-300/70 max-w-2xl mx-auto">{t('workflow.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((step, i) => (
              <div key={step.title} className="card-lux p-6 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-5xl font-display font-bold gold-text mb-3 opacity-50">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-base font-semibold text-cream-50 mb-2">{step.title}</h3>
                <p className="text-sm text-cream-300/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit System */}
      <section id="credits" className="py-24 lg:py-32 section-pad max-w-5xl mx-auto">
        <div className="card-lux p-8 lg:p-12 text-center">
          <CreditCard className="w-10 h-10 text-gold-400 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-display font-bold gold-text mb-4">
            {t('credits.title')}
          </h2>
          <p className="text-lg text-cream-300/70 max-w-2xl mx-auto mb-8">{t('credits.subtitle')}</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {creditExamples.map((ex) => (
              <div key={ex.label} className="p-4 rounded-lg bg-ink-800/50 border border-ink-600/40">
                <div className="text-2xl font-display font-bold text-gold-300">{ex.credits}</div>
                <div className="text-xs text-cream-300/50 mt-1">{ex.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section id="templates" className="py-24 lg:py-32 section-pad max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold gold-text mb-4">
            {t('templates.title')}
          </h2>
          <p className="text-lg text-cream-300/70 max-w-2xl mx-auto">{t('templates.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {templateCats.map((cat, i) => (
            <div
              key={cat}
              className="aspect-[3/4] card-lux flex items-center justify-center p-4 cursor-pointer hover:scale-105 transition-transform duration-500 animate-fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={() => onNavigate('signup')}
            >
              <span className="text-sm font-display font-medium text-cream-200 text-center">{cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gold opacity-30" />
        <div className="relative section-pad max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold gold-text mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-lg text-cream-300/70 max-w-2xl mx-auto">{t('pricing.subtitle')}</p>
          </div>
          <PricingPreview onNavigate={onNavigate} />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 lg:py-32 section-pad max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold gold-text mb-4">
            {t('faq.title')}
          </h2>
          <p className="text-lg text-cream-300/70 max-w-2xl mx-auto">{t('faq.subtitle')}</p>
        </div>
        <FAQList />
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-32 section-pad max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          <CelticEmblem size={120} animate showD />
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-bold text-cream-50 mb-6 text-balance">
          {t('hero.finalCtaTitle')}
        </h2>
        <p className="text-lg text-cream-300/70 mb-10 max-w-2xl mx-auto">
          {t('hero.finalCtaDesc')}
        </p>
        <button onClick={() => onNavigate('signup')} className="btn-gold text-lg px-10 py-4">
          <Sparkles className="w-5 h-5" />
          {t('nav.startCreating')}
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold-600/10 py-10 section-pad">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm text-cream-300/60">DESIGNLY</span>
            <span className="text-[10px] tracking-[0.3em] text-gold-400/60">STUDIO</span>
          </div>
          <p className="text-xs text-cream-400/40">
            © {new Date().getFullYear()} DESIGNLY STUDIO. {t('footer.rights')}
          </p>
        </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`card-lux p-6 flex flex-col ${plan.highlight ? 'border-gold-600/50 shadow-lg shadow-gold-600/10' : ''}`}
        >
          {plan.highlight && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold-gradient text-xs font-semibold text-ink-950 whitespace-nowrap">
              {t('plan.recommended')}
            </div>
          )}
          <h3 className="text-lg font-display font-bold text-cream-50 mb-1">{plan.name}</h3>
          <div className="text-2xl font-display font-bold gold-text mb-2">{new Intl.NumberFormat("hu-HU").format(plan.price)} Ft</div>
          <div className="text-xs text-cream-300/50 mb-4">{t('plan.perMonth')}</div>
          <div className="text-sm text-gold-200 font-semibold mb-3">{plan.credits} {t('plan.creditsMo')}</div>
          <ul className="space-y-2 mb-6 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="text-xs text-cream-300/60 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-gold-400" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => onNavigate('signup')}
            className={`w-full text-sm py-2.5 rounded-lg transition-all duration-300 ${
              plan.highlight ? 'btn-gold' : 'btn-ghost'
            }`}
          >
            {t('plan.getStarted')}
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
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="card-lux overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <span className="text-sm font-medium text-cream-100">{faq.q}</span>
            <span className={`text-gold-400 transition-transform duration-300 ${openIdx === i ? 'rotate-45' : ''}`}>
              +
            </span>
          </button>
          {openIdx === i && (
            <div className="px-6 pb-4 text-sm text-cream-300/60 leading-relaxed animate-fade-in">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
