import { useEffect, useState, type CSSProperties, type ComponentType } from 'react';
import {
  ArrowRight, Check, ChevronDown, Gamepad2, Palette, Play,
  Sparkles, Wand2, Shirt, Layers3, MousePointer2, Globe2, Shield, Compass
} from 'lucide-react';
import { Logo } from './Logo';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { PUBLIC_PLANS } from '@/lib/constants';

interface LandingPageProps { onNavigate: (page: string) => void; }

/*
  DESIGNLY - public landing.

  Paired with designly-brand.css. The markup defines the system; the stylesheet
  owns it. The bk- prefix is new and closed so nothing else can override it.

  Brand: black ground, gold Celtic knotwork, Norse picture layer (rune wheel,
  mountain range, aurora, rune band). The CSS-drawn ravens were removed - at
  real sizes they read as smudges rather than birds.
*/

const runes = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ'] as const;

function RuneWheel() {
  return (
    <div className="bk-wheel" aria-hidden="true">
      <div className="bk-wheel-core"><Logo size={104} /></div>
      {runes.map((rune, i) => (
        <span key={rune} className="bk-wheel-rune" style={{ '--i': i } as CSSProperties}>{rune}</span>
      ))}
      <span className="bk-wheel-orbit bk-wheel-orbit--a" />
      <span className="bk-wheel-orbit bk-wheel-orbit--b" />
    </div>
  );
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { lang } = useI18n();
  const hu = lang === 'hu';

  const copy = {
    eyebrow: hu ? 'AI KREATÍV RENDSZER' : 'AI CREATIVE SYSTEM',
    titleA: hu ? 'Ne csak tervezz.' : 'Don’t just design.',
    titleB: hu ? 'Kovácsolj rendszert.' : 'Forge a system.',
    sub: hu
      ? 'A DESIGNLY egyetlen műhely, ahol az ötletből márka, kampány, weboldal és gyártásra kész kreatív anyag lesz. Brief be, kész rendszer ki.'
      : 'DESIGNLY is one workshop where an idea becomes a brand, a campaign, a website and production-ready creative work. Brief in, finished system out.',
    primary: hu ? 'Kezdj egy briefet' : 'Start a brief',
    secondary: hu ? 'Nézd meg a műhelyt' : 'See the workshop',
    toolsLabel: hu ? 'A nyolc műhely' : 'The eight studios',
    toolsTitle: hu ? 'Válassz eszközt. Vagy bízd az egészet a rendszerre.' : 'Pick a tool. Or let the system do all of it.',
    stepsLabel: hu ? 'Hogyan működik' : 'How it works',
    stepsTitle: hu ? 'Négy lépés a briefig.' : 'Four steps from brief.',
    priceLabel: hu ? 'Árak' : 'Pricing',
    priceTitle: hu ? 'Növekedj a saját tempódban.' : 'Scale at your own pace.',
    faqLabel: hu ? 'Gyakori kérdések' : 'Questions',
    faqTitle: hu ? 'Amit tudni érdemes.' : 'What to know.',
    finalTitle: hu ? 'A következő projekted ne fájl legyen. Hanem rendszer.' : 'Your next project should not be a file. It should be a system.',
    finalCta: hu ? 'Vágjunk bele' : 'Let’s build it',
    wheelA: hu ? 'A HOLLÓK ÉS RÚNÁK MŰHELYE' : 'THE FORGE OF RAVENS & RUNES',
    wheelB: 'CREATE · REFINE · SHIP',
  };

  const tools: Array<{ label: string; desc: string; icon: ComponentType<{ className?: string }>; page: string }> = [
    { label: hu ? 'Weboldal-építő' : 'Website Builder', desc: hu ? 'Teljes webélmény egy briefből.' : 'Complete web experiences from one brief.', icon: Globe2, page: 'create' },
    { label: hu ? 'Hirdetésstúdió' : 'Ad Studio', desc: hu ? 'Reklámok, kampányok, vizuálok.' : 'Ads, campaigns and visual creatives.', icon: Sparkles, page: 'advertising' },
    { label: hu ? 'Kampánymotor' : 'Campaign Engine', desc: hu ? 'Egy briefből teljes kampányrendszer.' : 'Turn one brief into a campaign system.', icon: Layers3, page: 'campaign' },
    { label: hu ? 'Streamer-stúdió' : 'Streamer Studio', desc: hu ? 'Overlay, alert, scene, creator pack.' : 'Overlays, alerts, scenes and creator packs.', icon: Gamepad2, page: 'streamer' },
    { label: hu ? 'Merch-stúdió' : 'Merch Studio', desc: hu ? 'Master artwork és gyártható merch.' : 'Master artwork and production-ready merch.', icon: Shirt, page: 'creator' },
    { label: hu ? 'Design-szerkesztő' : 'Design Editor', desc: hu ? 'Finomhangolás és export.' : 'Refine, edit and export visual work.', icon: Wand2, page: 'editor' },
    { label: hu ? 'Zene-stúdió' : 'Music Studio', desc: hu ? 'Dal, hang, narráció.' : 'Music, voice and narration.', icon: Play, page: 'music' },
    { label: hu ? 'Tervező és vizualizáló' : 'Planner & Visualizer', desc: hu ? 'Tervkoncepciók AI-val.' : 'Plans and concepts with AI.', icon: Compass, page: 'planner' },
  ];

  const steps: Array<[string, string, string, ComponentType<{ className?: string }>]> = [
    ['01', hu ? 'Kitalálod' : 'Conceive', hu ? 'Elmondod, mit szeretnél.' : 'Describe what you want.', MousePointer2],
    ['02', hu ? 'Megépül' : 'Forge', hu ? 'A rendszer felállítja az irányt.' : 'The system builds the direction.', Compass],
    ['03', hu ? 'Finomítod' : 'Refine', hu ? 'Minden részlet a te kezedben.' : 'You control every detail.', Palette],
    ['04', hu ? 'Elindítod' : 'Ship', hu ? 'Export, publikálás, projekt.' : 'Export, publish, project.', ArrowRight],
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs: Array<[string, string]> = [
    [hu ? 'Mi az a DESIGNLY?' : 'What is DESIGNLY?', hu ? 'Egyetlen kreatív platform weboldalhoz, márkához, kampányhoz, streamer-anyagokhoz és merchhez.' : 'A single creative platform for websites, brands, campaigns, streamer assets and merch.'],
    [hu ? 'Van ingyenes előnézet?' : 'Is there a free preview?', hu ? 'Igen. Az előnézet ingyenes, a végleges generálás csak jóváhagyás után indul.' : 'Yes. Preview is free; final generation starts only after you approve it.'],
    [hu ? 'Megmaradnak a projektjeim?' : 'Are projects saved?', hu ? 'Igen, minden munka projektként marad meg, később visszanyitható és szerkeszthető.' : 'Yes. Every piece of work is kept as a project you can reopen and keep editing.'],
  ];

  return (
    <div className="bk">
      <section className="bk-hero">
        <span className="bk-aurora bk-aurora--a" aria-hidden="true" />
        <span className="bk-aurora bk-aurora--b" aria-hidden="true" />
        <span className="bk-mountains" aria-hidden="true" />
        <span className="bk-mist bk-mist--a" aria-hidden="true" />
        <span className="bk-mist bk-mist--b" aria-hidden="true" />

        <div className="bk-sky-runes" aria-hidden="true">
          {[...runes, ...runes].map((r, i) => <span key={i}>{r}</span>)}
        </div>

        <div className="bk-shell bk-hero-inner">
          <div className="bk-hero-copy">
            <p className="bk-eyebrow">{copy.eyebrow}</p>
            <h1 className="bk-title">
              <span>{copy.titleA}</span>
              <em>{copy.titleB}</em>
            </h1>
            <p className="bk-lede">{copy.sub}</p>

            <div className="bk-actions">
              <button className="bk-btn bk-btn--gold" onClick={() => onNavigate('signup')}>
                {copy.primary}<ArrowRight className="w-4 h-4" />
              </button>
              <button
                className="bk-btn bk-btn--line"
                onClick={() => document.getElementById('bk-tools')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {copy.secondary}
              </button>
            </div>

            <dl className="bk-stats">
              <div><dt>100K+</dt><dd>{hu ? 'sablon' : 'templates'}</dd></div>
              <div><dt>0 Ft</dt><dd>{hu ? 'előnézet' : 'preview'}</dd></div>
              <div><dt>8</dt><dd>{hu ? 'műhely' : 'studios'}</dd></div>
              <div><dt>∞</dt><dd>{hu ? 'irány' : 'directions'}</dd></div>
            </dl>
          </div>

          <div className="bk-wheel-wrap">
            <RuneWheel />
            <div className="bk-wheel-caption">
              <span>{copy.wheelA}</span>
              <em>{copy.wheelB}</em>
            </div>
          </div>
        </div>
      </section>

      <div className="bk-knot bk-knot--divider" aria-hidden="true" />

      <section id="bk-tools" className="bk-band">
        <div className="bk-shell">
          <header className="bk-head">
            <p className="bk-eyebrow">{copy.toolsLabel}</p>
            <h2>{copy.toolsTitle}</h2>
          </header>

          <ul className="bk-tools">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <li key={tool.label}>
                  <button className="bk-tool" onClick={() => onNavigate(tool.page)}>
                    <span className="bk-tool-icon"><Icon className="w-5 h-5" /></span>
                    <h3>{tool.label}</h3>
                    <p>{tool.desc}</p>
                    <span className="bk-tool-go">{hu ? 'Megnyitás' : 'Open'} <ArrowRight className="w-3.5 h-3.5" /></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bk-band bk-band--tint">
        <div className="bk-shell">
          <header className="bk-head">
            <p className="bk-eyebrow">{copy.stepsLabel}</p>
            <h2>{copy.stepsTitle}</h2>
          </header>

          <ol className="bk-steps">
            {steps.map(([n, title, desc, Icon]) => (
              <li key={n}>
                <span className="bk-step-n">{n}</span>
                <Icon className="w-5 h-5 bk-step-icon" />
                <h3>{title}</h3>
                <p>{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bk-band">
        <div className="bk-shell">
          <header className="bk-head">
            <p className="bk-eyebrow">{copy.priceLabel}</p>
            <h2>{copy.priceTitle}</h2>
          </header>
          <PricingPreview hu={hu} onNavigate={onNavigate} />
        </div>
      </section>

      <section className="bk-band bk-band--tint">
        <div className="bk-shell">
          <header className="bk-head">
            <p className="bk-eyebrow">{copy.faqLabel}</p>
            <h2>{copy.faqTitle}</h2>
          </header>

          <div className="bk-faq">
            {faqs.map(([q, a], i) => {
              const open = openFaq === i;
              return (
                <div key={q} className={open ? 'bk-faq-item bk-faq-item--open' : 'bk-faq-item'}>
                  <button onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open}>
                    <span>{q}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {open && <p>{a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bk-close">
        <div className="bk-shell bk-close-inner">
          <Shield className="w-8 h-8 bk-close-mark" />
          <h2>{copy.finalTitle}</h2>
          <button className="bk-btn bk-btn--gold" onClick={() => onNavigate('signup')}>
            {copy.finalCta}<ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <div className="bk-knot" aria-hidden="true" />

      <footer className="bk-foot">
        <div className="bk-shell bk-foot-inner">
          <Logo size={28} showText />
          <span>DESIGNLY STUDIO · CREATIVE OS</span>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{hu ? 'Vissza a tetejére ↑' : 'Back to top ↑'}</button>
        </div>
      </footer>
    </div>
  );
}

function PricingPreview({ hu, onNavigate }: { hu: boolean; onNavigate: (p: string) => void }) {
  const fallback = PUBLIC_PLANS.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.priceMonthly,
    credits: plan.creditsMonthly,
    features: plan.features.slice(0, 3),
    highlight: plan.highlighted === true,
  }));

  const [plans, setPlans] = useState(fallback);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('plans')
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
    <ul className="bk-plans">
      {plans.map((plan) => (
        <li key={plan.id} className={plan.highlight ? 'bk-plan bk-plan--hot' : 'bk-plan'}>
          {plan.highlight && <span className="bk-plan-tag">{hu ? 'Népszerű' : 'Most chosen'}</span>}
          <h3>{plan.name}</h3>
          <p className="bk-plan-price">
            {new Intl.NumberFormat('hu-HU').format(plan.price)} <small>Ft</small>
            <span>/{hu ? 'hó' : 'mo'}</span>
          </p>
          <p className="bk-plan-credits">{plan.credits} {hu ? 'kredit / hó' : 'credits / mo'}</p>
          <ul>
            {plan.features.map((f) => (
              <li key={f}><Check className="w-3.5 h-3.5" />{f}</li>
            ))}
          </ul>
          <button
            className={plan.highlight ? 'bk-btn bk-btn--gold bk-btn--full' : 'bk-btn bk-btn--line bk-btn--full'}
            onClick={() => onNavigate('signup')}
          >
            {hu ? 'Kezdés' : 'Get started'}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default LandingPage;
