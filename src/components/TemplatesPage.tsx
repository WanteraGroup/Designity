import { useMemo, useState } from 'react';
import { Crown, LayoutTemplate, Search, Sparkles, Type, Wand2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { TEMPLATE_CATEGORIES } from '@/lib/constants';
import { DESIGNLY_MATERIAL_CATEGORIES, DESIGNLY_MATERIAL_LIBRARY } from '@/lib/designly-templates';
import { TEMPLATE_TOTAL, DESIGNLY_TEMPLATE_INDEXES, getDesignlyTemplate, DESIGNLY_TEMPLATE_STYLES, DESIGNLY_FONT_PAIRS, DESIGNLY_EFFECTS, DESIGNLY_PALETTES, type DesignlyTemplate } from '@/lib/designly-templates';

interface TemplatesPageProps { onNavigate: (page: string) => void; }

const swatches = (colors: string[]) => colors.map((c) => (
  <span key={c} className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ background: c }} />
));

export function TemplatesPage({ onNavigate }: TemplatesPageProps) {
  const { t } = useI18n();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [style, setStyle] = useState('All');
  const [effect, setEffect] = useState('All');
  const [material, setMaterial] = useState('All');
  const PAGE_SIZE = 60;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches: DesignlyTemplate[] = [];
    for (const index of DESIGNLY_TEMPLATE_INDEXES) {
      const tpl = getDesignlyTemplate(index);
      const cat = category === 'All' || tpl.category === category;
      const st = style === 'All' || tpl.style === style.toLowerCase();
      const fx = effect === 'All' || tpl.effect === effect;
      if (cat && st && fx && (!q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.fontPair.toLowerCase().includes(q) ||
        tpl.effect.toLowerCase().includes(q))) {
        matches.push(tpl);
      }
    }
    return matches;
  }, [category, search, style, effect]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCategory = (value: string) => { setCategory(value); setPage(1); };
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleStyle = (value: string) => { setStyle(value); setPage(1); };
  const handleEffect = (value: string) => { setEffect(value); setPage(1); };

  const handleUseTemplate = (tpl: DesignlyTemplate) => {
    try {
      localStorage.setItem('designly_selected_template', JSON.stringify(tpl));
    } catch {
      // Ignore storage failures; navigation should still work.
    }
    onNavigate('create');
  };

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-2xl border border-gold-600/20 bg-ink-900/70 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,rgba(202,165,92,.28),transparent_40%)]" />
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-gold-500/10 shadow-[0_0_100px_rgba(202,165,92,.10)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[.25em]"><Sparkles className="w-4 h-4" /> DESIGNLY STUDIO</div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-cream-50 mt-2">{t('templates.title')}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-cream-300/65">
            <span className="chip border-gold-600/25 text-gold-200"><LayoutTemplate className="w-3.5 h-3.5" /> {TEMPLATE_TOTAL.toLocaleString('hu-HU')} sablon</span>
            <span className="chip border-gold-600/15"><Type className="w-3.5 h-3.5" /> {DESIGNLY_FONT_PAIRS.length} prémium betűpár</span>
            <span className="chip border-gold-600/15"><Wand2 className="w-3.5 h-3.5" /> {DESIGNLY_EFFECTS.length} effekt</span>
          </div>
          <p className="text-sm text-cream-300/55 mt-2 max-w-2xl">{t('templates.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)} className="input-lux pl-10" placeholder={t('tpl.searchPlaceholder')} />
        </div>
      </div>

      <div className="card-lux p-4 sm:p-5 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">DESIGN SYSTEM</div>
            <div className="text-sm text-cream-100 mt-1">Színek · betűpárok · stílusok · effektek</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DESIGNLY_PALETTES.map((palette, i) => (
              <div key={i} className="flex -space-x-1.5 transition-transform hover:scale-110" title={palette.join(' / ')}>
                {palette.map((color) => <span key={color} className="w-5 h-5 rounded-full border border-ink-950" style={{ background: color }} />)}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-cream-300/45">{DESIGNLY_FONT_PAIRS.length} betűpár · {DESIGNLY_EFFECTS.length} vizuális effekt · {DESIGNLY_PALETTES.length} paletta · {DESIGNLY_MATERIAL_LIBRARY.length} anyag</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleCategory('All')} className={`chip transition-all ${category === 'All' ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}>{t('tpl.all')}</button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => handleCategory(cat)} className={`chip transition-all ${category === cat ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}>{cat}</button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', ...DESIGNLY_TEMPLATE_STYLES].map((item) => (
          <button key={item} onClick={() => handleStyle(item)} className={'chip transition-all ' + (style === item ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60')}>{item}</button>
        ))}
      </div>

      <div className="card-lux p-4 border-gold-600/15">
        <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70 mb-2">MATERIAL LIBRARY</div>
        <div className="text-xs text-cream-300/55 mb-3">Fém · fa · kő · üveg · bőr · textil · beton · karbon · folyékony anyagok — felületre és betűre.</div>
        <div className="flex flex-wrap gap-2">
          {['All', ...DESIGNLY_MATERIAL_CATEGORIES].map((item) => (
            <button key={item} onClick={() => setMaterial(item)} className={'chip transition-all ' + (material === item ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60')}>{item}</button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(material === 'All' ? DESIGNLY_MATERIAL_LIBRARY : DESIGNLY_MATERIAL_LIBRARY.filter((m) => m.category === material)).map((m) => (
            <button key={m.id} title={m.name} className="rounded-lg border border-ink-600/40 p-2 text-left hover:border-gold-500/40 transition-all">
              <div className="h-10 rounded-md border border-white/10" style={{ background: m.css }} />
              <div className="text-[9px] text-cream-200/70 mt-1 truncate">{m.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', ...DESIGNLY_EFFECTS].map((item) => (
          <button key={item} onClick={() => handleEffect(item)} className={'chip transition-all ' + (effect === item ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60')}>{item}</button>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] uppercase tracking-[.18em] text-cream-400/45">
        <span>{filtered.length.toLocaleString('hu-HU')} találat</span>
        <span>Oldal {page} / {pageCount}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {visible.map((tpl) => (
          <article key={tpl.id} className={`group card-lux overflow-hidden border-gold-600/10 hover:border-gold-500/35 transition-all designly-glow-hover ${tpl.effect === 'Metallic sheen' || tpl.effect === 'Chrome reflection' || tpl.effect === 'Brushed metal' ? 'designly-metallic' : tpl.effect === 'Frosted glass' || tpl.effect === 'Glass edge' ? 'designly-glass' : tpl.effect === 'Soft grain' || tpl.effect === 'Paper texture' ? 'designly-grain' : ''}`}>
            <button onClick={() => handleUseTemplate(tpl)} className="w-full text-left">
              <div className="relative aspect-[16/10] overflow-hidden bg-ink-950">
                <div className="absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_50%_45%,rgba(202,165,92,.18),transparent_42%)]" />
                <div className="absolute inset-4 rounded-xl border border-gold-500/20 p-4 flex flex-col justify-between transition-transform duration-500 group-hover:scale-[1.015]" style={{ background: `linear-gradient(135deg, ${tpl.palette[0]}, ${tpl.palette[1]}33, ${tpl.palette[0]})` }}>
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full border border-gold-400/50 flex items-center justify-center text-gold-300 font-display">D</div>
                    {tpl.premium && <span className="chip text-[9px] border-gold-500/30 bg-gold-500/10 text-gold-200"><Crown className="w-3 h-3" /> PRO</span>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[9px] uppercase tracking-[.25em] text-gold-300/70">{tpl.category}</div>
                      <span className="text-[8px] text-cream-200/45 uppercase tracking-wider">{tpl.effect}</span>
                    </div>
                    <div className="text-xl font-display text-cream-50 mt-1">{tpl.name}</div>
                    <div className="flex items-center justify-between gap-2 mt-3"><div className="flex gap-1.5">{swatches(tpl.palette)}</div><span className="text-[9px] text-cream-200/45 truncate max-w-[55%]">{tpl.fontPair}</span></div>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gold-500/20" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-cream-100">{tpl.name}</h3>
                <p className="text-xs text-cream-300/45 mt-1 line-clamp-2">{tpl.description}</p>
                <div className="mt-3 text-xs text-gold-300 group-hover:text-gold-200">Sablon használata →</div>
              </div>
            </button>
          </article>
        ))}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-ghost text-xs disabled:opacity-30">← Előző</button>
          <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="btn-ghost text-xs disabled:opacity-30">Következő →</button>
        </div>
      )}

      {!filtered.length && <div className="card-lux p-12 text-center"><LayoutTemplate className="w-10 h-10 text-cream-400/30 mx-auto mb-3" /><p className="text-sm text-cream-300/50">{t('tpl.noResults')}</p></div>}
    </div>
  );
}
