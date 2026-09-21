import { useMemo, useState } from 'react';
import { BookOpen, Crown, LayoutTemplate, Search, Sparkles, Type, Wand2 } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import {
  TEMPLATE_TOTAL,
  DESIGNLY_TEMPLATE_INDEXES,
  DESIGNLY_TEMPLATE_STYLES,
  DESIGNLY_FONT_PAIRS,
  DESIGNLY_EFFECTS,
  DESIGNLY_PALETTES,
  DESIGNLY_MATERIAL_CATEGORIES,
  DESIGNLY_MATERIAL_LIBRARY,
  getDesignlyTemplate,
  type DesignlyTemplate,
} from '@/lib/designly-templates';
import { TEMPLATE_CATEGORIES } from '@/lib/constants';

interface TemplatesProps {
  onNavigate: (page: string) => void;
}

export default function Templates({ onNavigate }: TemplatesProps) {
  const [category, setCategory] = useState('All');
  const [style, setStyle] = useState('All');
  const [effect, setEffect] = useState('All');
  const [material, setMaterial] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return DESIGNLY_TEMPLATE_INDEXES
      .map((index) => getDesignlyTemplate(index))
      .filter((template) => {
        const categoryMatch = category === 'All' || template.category === category;
        const styleMatch = style === 'All' || template.style === style.toLowerCase();
        const effectMatch = effect === 'All' || template.effect === effect;
        const textMatch = !query || [
          template.name,
          template.description,
          template.category,
          template.style,
          template.effect,
          template.fontPair,
        ].some((value) => value.toLowerCase().includes(query));
        return categoryMatch && styleMatch && effectMatch && textMatch;
      });
  }, [category, effect, search, style]);

  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const resetPage = <T extends string>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const selectTemplate = (template: DesignlyTemplate, destination: 'create' | 'editor') => {
    try {
      localStorage.setItem('designly_selected_template', JSON.stringify(template));
    } catch {
      // Navigation still works if storage is unavailable.
    }
    onNavigate(destination);
  };

  const filteredMaterials = material === 'All'
    ? DESIGNLY_MATERIAL_LIBRARY
    : DESIGNLY_MATERIAL_LIBRARY.filter((item) => item.category === material);

  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95"
        aria-hidden="true"
      />

      <NordicHeader title="TEMPLATES — PATTERN LIBRARY" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-10 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <BookOpen className="w-4 h-4" /> PATTERN COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Template Overview</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                A DESIGNLY Pattern Library a sablonokat, tipográfiát, palettákat, anyagokat és vizuális effekteket egyetlen munkafolyamatban rendezi.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Metric label="Total Templates" value={TEMPLATE_TOTAL.toLocaleString('hu-HU')} />
            <Metric label="Brand-linked" value="32" />
            <Metric label="Categories" value={String(TEMPLATE_CATEGORIES.length)} />
          </div>
        </section>

        <ForgedPanel>
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EEE8DC]/35" />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] pl-10 pr-3 py-3 text-sm text-[#E3FFFB] placeholder:text-[#EEE8DC]/30 outline-none focus:border-[#9CEEE5]/40"
                placeholder="Search templates..."
              />
            </div>
            <div className="text-[10px] uppercase tracking-[.2em] text-[#EEE8DC]/40">
              {filtered.length.toLocaleString('hu-HU')} találat · {page} / {pageCount}
            </div>
          </div>
        </ForgedPanel>

        <ForgedPanel>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="text-[9px] uppercase tracking-[.24em] text-[#D6B36A]/70">DESIGN SYSTEM</div>
              <div className="text-sm text-[#EEE8DC]/65 mt-1">Színek · betűpárok · stílusok · effektek</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DESIGNLY_PALETTES.map((palette, index) => (
                <div key={index} className="flex -space-x-1.5" title={palette.join(' / ')}>
                  {palette.map((color) => (
                    <span key={color} className="w-5 h-5 rounded-full border border-[#020505]" style={{ background: color }} />
                  ))}
                </div>
              ))}
            </div>
            <div className="text-[10px] text-[#EEE8DC]/40">
              {DESIGNLY_FONT_PAIRS.length} betűpár · {DESIGNLY_EFFECTS.length} effekt · {DESIGNLY_PALETTES.length} paletta
            </div>
          </div>
        </ForgedPanel>

        <section>
          <div className="mb-3 text-[9px] uppercase tracking-[.24em] text-[#9CEEE5]/55">CATEGORIES</div>
          <div className="flex flex-wrap gap-2">
            {['All', ...TEMPLATE_CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => resetPage(setCategory, item)}
                className={`px-3 py-2 rounded-full border text-[10px] uppercase tracking-[.12em] transition-all ${category === item ? 'border-[#D6B36A]/50 bg-[#D6B36A]/10 text-[#F5DFA3]' : 'border-[#263636] text-[#EEE8DC]/50 hover:border-[#9CEEE5]/30'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 text-[9px] uppercase tracking-[.24em] text-[#9CEEE5]/55">STYLES</div>
          <div className="flex flex-wrap gap-2">
            {['All', ...DESIGNLY_TEMPLATE_STYLES].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => resetPage(setStyle, item)}
                className={`chip transition-all ${style === item ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <ForgedPanel>
          <div className="text-[9px] uppercase tracking-[.24em] text-[#D6B36A]/70">MATERIAL LIBRARY</div>
          <div className="mt-2 text-xs text-[#EEE8DC]/45">Fém · fa · kő · üveg · bőr · textil · beton · karbon és folyékony felületek.</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['All', ...DESIGNLY_MATERIAL_CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => resetPage(setMaterial, item)}
                className={`chip transition-all ${material === item ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {filteredMaterials.slice(0, 21).map((item) => (
              <button key={item.id} type="button" title={item.name} className="rounded-lg border border-[#263636] p-2 text-left hover:border-[#D6B36A]/40 transition-all">
                <div className="h-10 rounded-md border border-white/10" style={{ background: item.css }} />
                <div className="mt-1 text-[9px] text-[#EEE8DC]/65 truncate">{item.name}</div>
              </button>
            ))}
          </div>
        </ForgedPanel>

        <section>
          <div className="mb-3 text-[9px] uppercase tracking-[.24em] text-[#9CEEE5]/55">EFFECTS</div>
          <div className="flex flex-wrap gap-2">
            {['All', ...DESIGNLY_EFFECTS].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => resetPage(setEffect, item)}
                className={`chip transition-all ${effect === item ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visible.map((template) => (
              <ForgedPanel key={template.id} className="overflow-hidden">
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-[#D6B36A]/15 bg-black/30">
                  <div
                    className="absolute inset-3 rounded-lg border border-[#D6B36A]/25 p-4 flex flex-col justify-between"
                    style={{ background: `linear-gradient(135deg, ${template.palette[0]}, ${template.palette[1]}55, ${template.palette[0]})` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-full border border-[#D6B36A]/50 flex items-center justify-center font-serif text-[#F5DFA3]">D</div>
                      {template.premium && (
                        <span className="chip text-[9px] border-[#D6B36A]/30 bg-[#D6B36A]/10 text-[#F5DFA3]">
                          <Crown className="w-3 h-3" /> PRO
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-[.24em] text-[#F5DFA3]/70">{template.category}</div>
                      <div className="text-xl font-serif text-white mt-1">{template.name}</div>
                      <div className="flex items-center gap-2 mt-3">
                        {template.palette.map((color) => <span key={color} className="w-4 h-4 rounded-full border border-white/20" style={{ background: color }} />)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-lg font-serif">{template.name}</div>
                  <div className="mt-1 text-xs text-[#EEE8DC]/45 line-clamp-2">{template.description}</div>
                  <div className="mt-3 text-[10px] uppercase tracking-[.18em] text-[#9CEEE5]/55">
                    {template.fontPair} · {template.effect}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <ForgedButton variant="primary" className="flex-1" onClick={() => selectTemplate(template, 'create')}>
                      <Sparkles className="w-4 h-4" /> Use
                    </ForgedButton>
                    <ForgedButton variant="secondary" className="flex-1" onClick={() => selectTemplate(template, 'editor')}>
                      Edit
                    </ForgedButton>
                  </div>
                </div>
              </ForgedPanel>
            ))}
          </div>

          {visible.length === 0 && (
            <ForgedPanel className="mt-6 p-12 text-center">
              <LayoutTemplate className="w-10 h-10 mx-auto mb-3 text-[#EEE8DC]/20" />
              <div className="font-serif text-2xl">No matching templates</div>
              <p className="mt-2 text-sm text-[#EEE8DC]/40">Módosítsd a keresést vagy a szűrőket.</p>
            </ForgedPanel>
          )}

          {filtered.length > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="btn-ghost text-xs disabled:opacity-30">← Előző</button>
              <span className="text-[10px] uppercase tracking-[.18em] text-[#EEE8DC]/40">Oldal {page} / {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="btn-gold text-xs disabled:opacity-30">Következő →</button>
            </div>
          )}
        </section>

        <ForgedPanel>
          <div className="flex items-start gap-3">
            <Wand2 className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">PATTERN FORGE</div>
              <div className="font-serif text-2xl mt-1">Templates feed directly into Forge Workspace</div>
              <p className="mt-2 text-sm leading-7 text-[#EEE8DC]/45">
                A kiválasztott sablon átadásra kerül a meglévő Create/Editor workflow-nak, így nem készül külön párhuzamos sablonrendszer.
              </p>
            </div>
          </div>
        </ForgedPanel>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <ForgedPanel>
      <div className="text-[10px] uppercase tracking-[.18em] text-[#EEE8DC]/50">{label}</div>
      <div className="font-serif text-4xl mt-2">{value}</div>
    </ForgedPanel>
  );
}
