import { Link } from 'react-router-dom';
import { POLISH_SYSTEM_PROMPT } from '@/lib/ai-prompts';

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-32 text-center lg:pt-44">
        <span className="mb-6 rounded-full border border-gold-700/40 px-4 py-1.5 text-xs tracking-[0.25em] text-gold-300">
          AI DESIGN STUDIO
        </span>
        <h1 className="font-display text-4xl leading-tight text-cream-50 lg:text-6xl">
          Describe it.
          <br />
          <span className="bg-gold-gradient bg-clip-text text-transparent">We build it.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base text-cream-300/70 lg:text-lg">
          One sentence is enough. Write what you want — a website, a brand, a poster — and the
          DESIGNLY AI team designs, writes and lays it out for you.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="rounded-lg bg-gold-600 px-7 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-500"
          >
            Start free
          </Link>
          <a
            href="#how"
            className="rounded-lg border border-gold-700/40 px-7 py-3 text-sm font-semibold text-cream-200 transition hover:bg-ink-800"
          >
            How it works
          </a>
        </div>
        <p className="mt-4 text-xs text-cream-300/40">
          20 credits on signup — a full website costs 10.
        </p>
      </section>

      {/* how it works */}
      <section id="how" className="border-y border-gold-700/15 bg-ink-900/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center font-display text-3xl text-cream-100">
            Three steps, no design skills
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Write the brief',
                d: 'One or two sentences. "A landing page for my barber shop, dark and premium, with prices." That is the whole input.',
              },
              {
                n: '02',
                t: 'The AI team plans it',
                d: 'A copywriter and a layout designer pick the structure, the text and the palette — then build the page.',
              },
              {
                n: '03',
                t: 'Refine and export',
                d: 'Change one thing at a time in plain language. Export when it looks right.',
              },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-7">
                <span className="font-mono text-sm text-gold-500">{s.n}</span>
                <h3 className="mt-3 font-display text-xl text-cream-100">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream-300/65">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* under the hood */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center font-display text-3xl text-cream-100">
            The prompt is the product
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-cream-300/60">
            What separates a usable result from a generic one is not the model. It is the system
            prompt that turns a sentence into a structured design plan. Here is the actual one.
          </p>
          <pre className="max-h-96 overflow-auto rounded-xl border border-gold-700/20 bg-ink-900 p-6 text-xs leading-relaxed text-cream-300/70">
            {POLISH_SYSTEM_PROMPT}
          </pre>
        </div>
      </section>
    </div>
  );
}
