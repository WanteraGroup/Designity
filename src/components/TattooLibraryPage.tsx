import { useMemo, useState, type CSSProperties } from 'react';
import {
  Bookmark, ChevronDown, Crown, Filter, Heart, LayoutTemplate, Search,
  Sparkles, Star, Tattoo, Users, X
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

type TattooCategory = {
  id: string;
  name: string;
  description: string;
  motifs: string[];
  count: number;
};

type TattooStyle = 'Blackwork' | 'Fine Line' | 'Traditional' | 'Neo Traditional' | 'Realistic' | 'Ornamental' | 'Geometric' | 'Tribal' | 'Lettering' | 'Japanese';

const CATEGORIES: TattooCategory[] = [
  { id: 'dragon', name: 'Sárkányok', description: 'Kelti, fantasy, kínai és japán sárkány flash minták.', motifs: ['sárkány', 'szárny', 'láng', 'kígyótest', 'karmok'], count: 420 },
  { id: 'rose', name: 'Rózsák & virágok', description: 'Rózsa, peónia, liliom, bazsarózsa és botanikai kompozíciók.', motifs: ['rózsa', 'peónia', 'liliom', 'levelek', 'tüske'], count: 380 },
  { id: 'skull', name: 'Koponyák', description: 'Koponya, grim reaper, csont és dark flash kollekciók.', motifs: ['koponya', 'kaszás', 'csont', 'díszítés', 'láng'], count: 360 },
  { id: 'cross', name: 'Keresztek & vallási', description: 'Kereszt, rózsafüzér, szent szimbólumok és ornamentika.', motifs: ['kereszt', 'rózsafüzér', 'szárny', 'glória', 'ornament'], count: 260 },
  { id: 'lettering', name: 'Feliratok', description: 'Nevek, idézetek, dátumok, kalligráfia és custom lettering.', motifs: ['név', 'idézet', 'dátum', 'gótikus betű', 'kézírás'], count: 340 },
  { id: 'maori', name: 'Maori & Polinéz', description: 'Törzsi, polinéz, samoai és geometrikus törzsi rendszerek.', motifs: ['spirál', 'harcos', 'óceán', 'napszimbólum', 'törzsi ív'], count: 330 },
  { id: 'celtic', name: 'Kelta', description: 'Kelta csomók, harcosok, farkasok, hollók és sárkányok.', motifs: ['kelta csomó', 'runa', 'holló', 'farkas', 'sárkány'], count: 300 },
  { id: 'japanese', name: 'Japán', description: 'Irezumi ihlette koi, hannya, tigris, hullám és krizantém.', motifs: ['koi', 'hannya', 'tigris', 'hullám', 'krizantém'], count: 310 },
  { id: 'geometric', name: 'Geometrikus', description: 'Mandala, sacred geometry, linework és szerkesztett formák.', motifs: ['mandala', 'fraktál', 'kör', 'vonal', 'szimmetria'], count: 270 },
  { id: 'animal', name: 'Állatok', description: 'Farkas, medve, sas, oroszlán, kígyó, szarvas és egyedi állatportrék.', motifs: ['farkas', 'sas', 'oroszlán', 'szarvas', 'kígyó'], count: 390 },
  { id: 'bird', name: 'Madarak', description: 'Holló, sas, bagoly, főnix és tollas kompozíciók.', motifs: ['holló', 'sas', 'bagoly', 'főnix', 'toll'], count: 250 },
  { id: 'minimal', name: 'Minimal & Fine Line', description: 'Apró, finom, egyvonalas és letisztult minták.', motifs: ['vonal', 'pont', 'kis szimbólum', 'botanika', 'csillag'], count: 290 },
  { id: 'ornamental', name: 'Ornament & Mandala', description: 'Dekoratív körök, csipkeminták és ornamentális kompozíciók.', motifs: ['mandala', 'csipke', 'ornament', 'szimmetria', 'pontozás'], count: 280 },
  { id: 'oldschool', name: 'Old School', description: 'Klasszikus hajó, rózsa, kígyó, tőr, szív és tradicionális flash.', motifs: ['hajó', 'tőr', 'szív', 'kígyó', 'rózsa'], count: 240 },
  { id: 'gothic', name: 'Gothic & Dark', description: 'Sötét ornamentika, gótikus motívumok és blackwork.', motifs: ['gótika', 'korona', 'sötét angyal', 'runa', 'tüske'], count: 300 },
  { id: 'symbol', name: 'Szimbólumok', description: 'Rúnák, csillagképek, szakrális jelek és személyes ikonok.', motifs: ['runa', 'nap', 'hold', 'csillag', 'szem'], count: 220 },
];

const STYLES: TattooStyle[] = ['Blackwork', 'Fine Line', 'Traditional', 'Neo Traditional', 'Realistic', 'Ornamental', 'Geometric', 'Tribal', 'Lettering', 'Japanese'];

const PALETTES = ['Black / White', 'Black / Grey', 'Red accent', 'Gold accent', 'Mono line'];

function motifFor(category: TattooCategory, variant: number) {
  return category.motifs[variant % category.motifs.length];
}

function previewStyle(categoryId: string, variant: number, style: TattooStyle): CSSProperties {
  const rotations = [-7, -3, 0, 4, 7];
  const angle = rotations[variant % rotations.length];
  const density = 20 + (variant % 5) * 5;
  const isFine = style === 'Fine Line' || style === 'Geometric' || style === 'Lettering';
  return {
    transform: `rotate(${angle}deg)`,
    background:
      categoryId === 'dragon'
        ? `radial-gradient(circle at 50% 35%, rgba(255,255,255,.06), transparent 28%), repeating-linear-gradient(${118 + variant % 18}deg, #111 0 ${Math.max(2, density / 9)}px, transparent ${Math.max(3, density / 9 + 2)}px ${Math.max(8, density / 3)}px)`
        : categoryId === 'rose'
          ? 'radial-gradient(circle at 48% 42%, #111 0 7%, transparent 8%), radial-gradient(circle at 58% 55%, #111 0 10%, transparent 11%), repeating-radial-gradient(circle at 50% 50%, transparent 0 13px, #181818 14px 17px, transparent 18px 29px)'
          : isFine
            ? `radial-gradient(circle, #171717 0 1px, transparent 1.6px) 0 0 / ${8 + (variant % 3) * 3}px ${8 + (variant % 4) * 2}px, linear-gradient(135deg,#111,#777)`
            : `repeating-linear-gradient(${45 + variant % 25}deg, #0a0a0a 0 5px, #d8d2c8 6px ${11 + variant % 4}px)`,
    filter: 'contrast(1.1)',
  };
}

export function TattooLibraryPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { lang } = useI18n();
  const hu = lang === 'hu';
  const [category, setCategory] = useState('all');
  const [style, setStyle] = useState<'All' | TattooStyle>('All');
  const [palette, setPalette] = useState('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [studioMode, setStudioMode] = useState(false);

  const total = CATEGORIES.reduce((sum, item) => sum + item.count, 0);
  const selectedCategory = CATEGORIES.find((item) => item.id === category);

  const designs = useMemo(() => {
    const pool = category === 'all' ? CATEGORIES : CATEGORIES.filter((item) => item.id === category);
    const q = search.trim().toLowerCase();
    const rows: Array<{ id: number; category: TattooCategory; variant: number; motif: string; title: string }> = [];
    let id = 1;
    for (const cat of pool) {
      const localMax = Math.min(cat.count, 48);
      for (let i = 0; i < localMax; i += 1) {
        const motif = motifFor(cat, i);
        const title = `${cat.name} · ${motif} · ${String(i + 1).padStart(3, '0')}`;
        if (!q || title.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q) || motif.includes(q)) {
          rows.push({ id: id++, category: cat, variant: i, motif, title });
        }
      }
    }
    return rows;
  }, [category, search]);

  const toggleFavorite = (id: number) => setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-gold-600/20 bg-[#090a0b] p-6 lg:p-9">
        <div className="absolute inset-0 opacity-45" style={{ background: 'radial-gradient(circle at 78% 25%, rgba(214,170,74,.18), transparent 26%), radial-gradient(circle at 20% 80%, rgba(255,255,255,.06), transparent 30%)' }} />
        <div className="relative grid lg:grid-cols-[1.2fr_.8fr] gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-gold-300 text-[10px] uppercase tracking-[.28em]">
              <Tattoo className="w-4 h-4" />
              DESIGNLY TATTOO LIBRARY
            </div>
            <h1 className="mt-3 text-3xl lg:text-5xl font-display font-semibold text-cream-50">
              {hu ? 'Tetoválás mintakönyvtár szalonoknak.' : 'Tattoo template library for studios.'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cream-200/60">
              {hu
                ? 'Külön, szalonokra optimalizált flash könyvtár több ezer kategorizált mintával. Sárkányok, rózsák, keresztek, feliratok, koponyák, maori, kelta és még sok más.'
                : 'A dedicated studio-ready flash library with thousands of categorized tattoo concepts: dragons, roses, crosses, lettering, skulls, Maori, Celtic and more.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip border-gold-500/30 bg-gold-500/10 text-gold-200"><LayoutTemplate className="w-3.5 h-3.5" /> {total.toLocaleString('hu-HU')} mintakoncepció</span>
              <span className="chip border-gold-500/15"><Users className="w-3.5 h-3.5" /> {hu ? 'Szalon mód' : 'Studio mode'}</span>
              <span className="chip border-gold-500/15"><Crown className="w-3.5 h-3.5" /> PRO könyvtár</span>
            </div>
          </div>
          <div className="relative min-h-[250px] rounded-2xl border border-white/10 bg-[#f3eee5] overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(circle, #fff 1px, transparent 1.5px) 0 0 / 18px 18px' }} />
            <div className="relative w-48 h-56 rotate-[-7deg]">
              <div className="absolute inset-3 border-[3px] border-black rounded-[46%_54%_48%_52%/42%_45%_55%_58%]" />
              <div className="absolute inset-7 rounded-full border-2 border-black" />
              <div className="absolute left-1/2 top-3 w-2 h-44 bg-black rounded-full -translate-x-1/2 rotate-[-22deg]" />
              <div className="absolute left-1/2 bottom-2 w-20 h-20 -translate-x-1/2 border-4 border-black rounded-full" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-[9px] uppercase tracking-[.25em] text-black/55">Celtic / Dragon / Flash Reference</div>
          </div>
        </div>
      </section>

      <section className="card-lux p-4 lg:p-5">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-lux pl-10" placeholder={hu ? 'Keresés: sárkány, rózsa, név, kelta...' : 'Search: dragon, rose, name, Celtic...'} />
          </div>
          <button onClick={() => setStudioMode((v) => !v)} className={`chip ${studioMode ? 'border-gold-500/40 bg-gold-500/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}>
            <Users className="w-3.5 h-3.5" /> {hu ? 'Szalon mód' : 'Studio mode'}
          </button>
          <select value={style} onChange={(e) => setStyle(e.target.value as 'All' | TattooStyle)} className="input-lux xl:w-44">
            <option value="All">Minden stílus</option>
            {STYLES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={palette} onChange={(e) => setPalette(e.target.value)} className="input-lux xl:w-44">
            <option value="All">Minden paletta</option>
            {PALETTES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <section className="grid lg:grid-cols-[250px_1fr] gap-5">
        <aside className="card-lux p-4 h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[.22em] text-gold-300/70">KATEGÓRIÁK</div>
            <Filter className="w-4 h-4 text-cream-300/35" />
          </div>
          <div className="mt-4 space-y-1.5">
            <button onClick={() => setCategory('all')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${category === 'all' ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20' : 'text-cream-300/65 hover:bg-ink-800/60'}`}>
              <span>Összes minta</span><span className="text-[10px]">{total}</span>
            </button>
            {CATEGORIES.map((item) => (
              <button key={item.id} onClick={() => setCategory(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${category === item.id ? 'bg-gold-600/15 text-gold-200 border border-gold-600/20' : 'text-cream-300/65 hover:bg-ink-800/60'}`}>
                <span className="truncate">{item.name}</span><span className="text-[10px] text-cream-400/35">{item.count}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          {selectedCategory && (
            <div className="rounded-xl border border-gold-600/15 bg-ink-900/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] uppercase tracking-[.22em] text-gold-300/70">KATEGÓRIA</div>
                  <div className="text-lg font-display text-cream-50 mt-1">{selectedCategory.name}</div>
                  <p className="text-xs text-cream-300/50 mt-1">{selectedCategory.description}</p>
                </div>
                <span className="chip border-gold-600/15">{selectedCategory.count} koncepció</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] uppercase tracking-[.18em] text-cream-400/45">
            <span>{designs.length} előnézet / {category === 'all' ? total : selectedCategory?.count} teljes koncepció</span>
            <span>{favorites.length} mentett</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {designs.map((design) => {
              const saved = favorites.includes(design.id);
              return (
                <article key={design.id} className="group card-lux overflow-hidden border-gold-600/10 hover:border-gold-500/35 transition-all">
                  <div className="relative aspect-[4/5] bg-[#eee8dd] overflow-hidden">
                    <div className="absolute inset-4 rounded-[28%] border border-black/10" />
                    <div className="absolute inset-7 rounded-[22%] bg-[#f8f3ea] shadow-inner" />
                    <div
                      className="absolute inset-12 rounded-full opacity-80 mix-blend-multiply"
                      style={previewStyle(design.category.id, design.variant, style === 'All' ? 'Blackwork' : style)}
                    />
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                      <span className="chip text-[8px] border-black/10 bg-white/65 text-black/65">{design.category.name}</span>
                      <button type="button" onClick={() => toggleFavorite(design.id)} className={`w-8 h-8 rounded-full border backdrop-blur bg-white/65 flex items-center justify-center ${saved ? 'border-red-500/40 text-red-500' : 'border-black/10 text-black/55'}`}>
                        <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <span className="text-[8px] uppercase tracking-[.22em] text-black/45">FLASH #{String(design.id).padStart(4, '0')}</span>
                      <button type="button" className="w-8 h-8 rounded-full border border-black/10 bg-white/65 backdrop-blur flex items-center justify-center text-black/65">
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-[9px] uppercase tracking-[.18em] text-gold-300/70">{design.motif}</div>
                    <div className="text-sm font-medium text-cream-100 mt-1 truncate">{design.title}</div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => onNavigate('create')} className="btn-gold flex-1 text-[10px] py-2">
                        {hu ? 'Szerkesztés' : 'Customize'}
                      </button>
                      <button type="button" className="btn-ghost px-3 py-2" aria-label="More"><ChevronDown className="w-3 h-3" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-2xl border border-gold-600/15 bg-gradient-to-r from-gold-500/8 via-ink-950 to-transparent p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-gold-300 text-[10px] uppercase tracking-[.25em]"><Sparkles className="w-4 h-4" /> AI CUSTOM TATTOO</div>
              <h2 className="text-xl font-display text-cream-50 mt-2">{hu ? 'Saját mintát szeretnél?' : 'Need a custom tattoo design?'}</h2>
              <p className="text-sm text-cream-300/50 mt-1 max-w-2xl">{hu ? 'Írj egy briefet, válassz stílust, és a DESIGNLY alakítsa a szalonod következő egyedi mintáját.' : 'Write a brief, pick a style, and let DESIGNLY create the next custom studio concept.'}</p>
            </div>
            <button onClick={() => onNavigate('create')} className="btn-gold whitespace-nowrap"><Sparkles className="w-4 h-4" /> AI minta készítése</button>
          </div>

          <div className="text-[10px] text-cream-400/35 leading-5">
            A könyvtár több ezer kategorizált mintakoncepciót jelenít meg; a kártyák előnézetei procedurálisan képzett flash-változatok. A tényleges kliensre szabott tetoválásmintát a DESIGNLY AI generálási folyamatával készítheted el.
          </div>
        </div>
      </section>
    </div>
  );
}
