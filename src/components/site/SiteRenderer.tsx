import type { SiteDocument } from '@/lib/site-schema';

export interface SiteRendererProps {
  document: SiteDocument;
  /** Renders inside the editor at a fixed width instead of full-bleed. */
  embedded?: boolean;
}

/**
 * Renders a site document.
 *
 * Wave 1 built the equivalent by compiling a string of HTML the model had
 * written and dropping it into an iframe with `srcDoc`. That put model output
 * in the DOM. Here the model returns a block list and this component owns
 * every element that reaches the page — the model's text is always a text
 * node, never markup.
 */
export function SiteRenderer({ document: doc, embedded }: SiteRendererProps) {
  const { theme } = doc.site;
  const light = theme.mode === 'light';

  return (
    <div
      className={`designly-site ${embedded ? 'rounded-xl overflow-hidden border border-gold-700/20' : ''}`}
      style={{
        background: light ? '#fdfbf7' : '#050505',
        color: light ? '#141417' : '#f9f5ec',
        fontFamily: theme.body_font,
      }}
    >
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${theme.palette[0] ?? '#c49a2e'}33` }}
      >
        <span style={{ fontFamily: theme.heading_font, letterSpacing: '0.12em' }}>
          {doc.site.title}
        </span>
        <nav className="flex gap-5 text-sm opacity-75">
          {doc.site.nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      {doc.blocks.map((block, i) => renderBlock(block, i, theme))}
    </div>
  );
}

function renderBlock(block: SiteDocument['blocks'][number], index: number, theme: SiteDocument['site']['theme']) {
  const gold = theme.palette[0] ?? '#c49a2e';

  switch (block.type) {
    case 'hero':
      return (
        <section key={index} className="px-6 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.25em]" style={{ color: gold }}>
            {block.eyebrow}
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl leading-tight" style={{ fontFamily: theme.heading_font }}>
            {block.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base opacity-70">{block.subheadline}</p>
          <a
            href={block.cta.href}
            className="mt-9 inline-block rounded-lg px-7 py-3 text-sm font-semibold"
            style={{ background: gold, color: theme.mode === 'light' ? '#fff' : '#050505' }}
          >
            {block.cta.label}
          </a>
        </section>
      );

    case 'features':
      return (
        <section key={index} className="px-6 py-16">
          <h2 className="mb-10 text-center text-2xl" style={{ fontFamily: theme.heading_font }}>
            {block.heading}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {block.items.map((item) => (
              <div key={item.title} className="rounded-xl p-6" style={{ border: `1px solid ${gold}33` }}>
                <h3 className="text-lg" style={{ fontFamily: theme.heading_font }}>
                  {item.title}
                </h3>
                <p className="mt-2 text-sm opacity-70">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'about':
      return (
        <section key={index} className="px-6 py-16">
          <h2 className="mb-5 text-2xl" style={{ fontFamily: theme.heading_font }}>
            {block.heading}
          </h2>
          <p className="max-w-3xl text-base leading-relaxed opacity-75">{block.body}</p>
        </section>
      );

    case 'services':
      return (
        <section key={index} className="px-6 py-16">
          <h2 className="mb-10 text-center text-2xl" style={{ fontFamily: theme.heading_font }}>
            {block.heading}
          </h2>
          <ul className="mx-auto max-w-2xl divide-y" style={{ borderColor: `${gold}22` }}>
            {block.items.map((item) => (
              <li key={item.name} className="flex items-baseline justify-between gap-6 py-4">
                <div>
                  <span className="text-base">{item.name}</span>
                  <p className="mt-1 text-sm opacity-60">{item.text}</p>
                </div>
                <span className="font-mono text-sm" style={{ color: gold }}>
                  {item.price}
                </span>
              </li>
            ))}
          </ul>
        </section>
      );

    case 'gallery':
      return (
        <section key={index} className="px-6 py-16">
          <h2 className="mb-8 text-center text-2xl" style={{ fontFamily: theme.heading_font }}>
            {block.heading}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {block.images.map((img) => (
              <figure key={img.query} className="overflow-hidden rounded-xl" style={{ border: `1px solid ${gold}22` }}>
                <div className="grid aspect-[4/3] place-items-center text-xs opacity-40">{img.query}</div>
                {img.caption && <figcaption className="px-3 py-2 text-xs opacity-60">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section key={index} className="px-6 py-16">
          <h2 className="mb-10 text-center text-2xl" style={{ fontFamily: theme.heading_font }}>
            {block.heading}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {block.items.map((item) => (
              <blockquote key={item.author} className="rounded-xl p-6" style={{ border: `1px solid ${gold}22` }}>
                <p className="text-sm italic opacity-80">“{item.quote}”</p>
                <footer className="mt-4 text-xs opacity-60">
                  {item.author}
                  {item.role ? ` — ${item.role}` : ''}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      );

    case 'pricing':
      return (
        <section key={index} className="px-6 py-16">
          <h2 className="mb-10 text-center text-2xl" style={{ fontFamily: theme.heading_font }}>
            {block.heading}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {block.tiers.map((tier) => (
              <div key={tier.name} className="rounded-xl p-6" style={{ border: `1px solid ${gold}33` }}>
                <h3 className="text-lg" style={{ fontFamily: theme.heading_font }}>
                  {tier.name}
                </h3>
                <p className="mt-3 text-3xl" style={{ color: gold, fontFamily: theme.heading_font }}>
                  {tier.price}
                  {tier.period && <span className="ml-1 text-sm opacity-60">{tier.period}</span>}
                </p>
                <ul className="mt-5 space-y-2 text-sm opacity-70">
                  {tier.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section key={index} className="px-6 py-16">
          <h2 className="mb-10 text-center text-2xl" style={{ fontFamily: theme.heading_font }}>
            {block.heading}
          </h2>
          <dl className="mx-auto max-w-2xl space-y-5">
            {block.items.map((item) => (
              <div key={item.q}>
                <dt className="text-base">{item.q}</dt>
                <dd className="mt-1.5 text-sm opacity-70">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      );

    case 'contact':
      return (
        <section key={index} className="px-6 py-16">
          <h2 className="mb-5 text-2xl" style={{ fontFamily: theme.heading_font }}>
            {block.heading}
          </h2>
          <p className="max-w-2xl text-sm opacity-70">{block.body}</p>
          <ul className="mt-6 space-y-1.5 text-sm">
            {block.email && <li>{block.email}</li>}
            {block.phone && <li>{block.phone}</li>}
            {block.address && <li>{block.address}</li>}
          </ul>
        </section>
      );

    case 'cta':
      return (
        <section key={index} className="px-6 py-20 text-center">
          <h2 className="text-3xl" style={{ fontFamily: theme.heading_font }}>
            {block.headline}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm opacity-70">{block.subheadline}</p>
          <a
            href={block.cta.href}
            className="mt-8 inline-block rounded-lg px-7 py-3 text-sm font-semibold"
            style={{ background: gold, color: theme.mode === 'light' ? '#fff' : '#050505' }}
          >
            {block.cta.label}
          </a>
        </section>
      );

    case 'footer':
      return (
        <footer key={index} className="px-6 py-10 text-xs opacity-60" style={{ borderTop: `1px solid ${gold}22` }}>
          <p>{block.text}</p>
          <ul className="mt-4 flex gap-4">
            {block.links.map((l) => (
              <li key={l.href}>{l.label}</li>
            ))}
          </ul>
        </footer>
      );

    default:
      return null;
  }
}
