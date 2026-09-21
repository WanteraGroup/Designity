import { useEffect, useMemo, useState } from 'react';
import { Check, FolderOpen, Palette, Plus, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { BrandKit } from '@/types';

interface BrandsProps {
  onNavigate: (page: string) => void;
}

const PRESET_COLORS = ['#c49a2e', '#0a0a0b', '#f9f5ec', '#2d2d34', '#e0c066', '#1a1a1e'];

export default function Brands({ onNavigate }: BrandsProps) {
  const { profile, isUnlimited, refreshProfile } = useAuth();
  const [brands, setBrands] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [tone, setTone] = useState('Nordic / Minimal / Luxury / Futuristic');
  const [colors, setColors] = useState(['#c49a2e', '#0a0a0b', '#f9f5ec']);
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setBrands((data as BrandKit[]) || []);
      setLoading(false);
    }
    load();
  }, [profile]);

  const totalBrands = brands.length;
  const activeBrands = brands.length;
  const templatesLinked = useMemo(() => brands.reduce((sum, brand) => sum + Math.max(0, (brand.style_keywords || []).length), 0), [brands]);

  const toggleColor = (color: string) => {
    setColors((current) =>
      current.includes(color)
        ? current.filter((item) => item !== color)
        : [...current, color].slice(0, 6),
    );
    setSaved(false);
  };

  const saveDraft = () => {
    localStorage.setItem(
      'designly_brand_draft',
      JSON.stringify({
        name: name.trim(),
        tone: tone.trim(),
        colors,
        savedAt: new Date().toISOString(),
      }),
    );
    setSaved(true);
  };

  const createBrand = async () => {
    if (!profile || !name.trim() || creating) return;
    setError(null);

    if (!isUnlimited && (profile.credits ?? 0) < 5) {
      setError('Nincs elegendő kredit a brand létrehozásához.');
      return;
    }

    setCreating(true);
    const { data, error: insertError } = await supabase
      .from('brands')
      .insert({
        user_id: profile.id,
        name: name.trim(),
        industry: 'DESIGNLY',
        colors,
        fonts: { heading: 'Cormorant Garamond', body: 'Inter' },
        tone: tone.trim(),
        style_keywords: tone
          .split('/')
          .map((item) => item.trim())
          .filter(Boolean),
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    if (!isUnlimited) {
      const { data: deducted, error: deductError } = await supabase.rpc('deduct_credits', {
        p_user_id: profile.id,
        p_amount: 5,
        p_description: 'Brand identity generation',
      });

      if (deductError || deducted !== true) {
        await supabase.from('brands').delete().eq('id', data.id);
        setError('A kreditlevonás nem sikerült, a brand nem lett létrehozva.');
        setCreating(false);
        return;
      }

      await refreshProfile();
    }

    setBrands((current) => [data as BrandKit, ...current]);
    setName('');
    setTone('Nordic / Minimal / Luxury / Futuristic');
    setColors(['#c49a2e', '#0a0a0b', '#f9f5ec']);
    setCreating(false);
    setSaved(false);
  };

  const applyBrand = (brand: BrandKit) => {
    localStorage.setItem(
      'designly_selected_brand',
      JSON.stringify({
        id: brand.id,
        name: brand.name,
        tone: brand.tone,
        colors: brand.colors || [],
        fonts: brand.fonts || {},
      }),
    );
    onNavigate('create');
  };

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

      <NordicHeader title="BRANDS — IDENTITY HALL" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Palette className="w-4 h-4" /> IDENTITY COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Brand Overview</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Márkaidentitások, színrendszerek és vizuális irányok kezelése a DESIGNLY Identity Hall rendszerében.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Metric label="Total Brands" value={String(totalBrands)} icon={Palette} />
            <Metric label="Active" value={String(activeBrands)} icon={Sparkles} />
            <Metric label="Templates Linked" value={String(templatesLinked)} icon={FolderOpen} />
          </div>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">IDENTITY FORGE</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Create Brand</h2>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="grid md:grid-cols-3 gap-5 text-xs">
              <Field label="Brand Name" placeholder="Pl. Odin Studio" value={name} onChange={setName} />
              <Field label="Tone" placeholder="Nordic / Minimal / Luxury / Futuristic" value={tone} onChange={setTone} />
              <div className="space-y-2">
                <div className="text-[#EEE8DC]/70">Primary Colors</div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`w-9 h-9 rounded-lg border-2 transition-all ${colors.includes(color) ? 'border-[#D6B36A] scale-105' : 'border-[#263636] opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Toggle color ${color}`}
                    >
                      {colors.includes(color) && <Check className="w-4 h-4 text-white mx-auto drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <ForgedButton variant="primary" onClick={createBrand} disabled={creating || !name.trim()}>
                <Sparkles className="w-4 h-4" /> {creating ? 'Creating…' : 'Create Brand'}
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={saveDraft}>
                <FolderOpen className="w-4 h-4" /> {saved ? 'Draft Saved' : 'Save Draft'}
              </ForgedButton>
            </div>
            {error && <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
            <p className="mt-3 text-[11px] text-[#EEE8DC]/35">Brand létrehozása a meglévő Supabase brand-rendszerbe ment; a normál csomag esetén 5 kredit a művelet költsége.</p>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">IDENTITY VAULT</div>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Brands</h2>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('templates')}>
              <FolderOpen className="w-4 h-4" /> Open Templates
            </ForgedButton>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((id) => <ForgedPanel key={id} className="h-52 animate-pulse"><div className="h-full rounded-2xl bg-black/20" /></ForgedPanel>)}
            </div>
          ) : brands.length === 0 ? (
            <ForgedPanel className="p-12 text-center">
              <Palette className="w-12 h-12 mx-auto mb-4 text-[#EEE8DC]/20" />
              <div className="font-serif text-2xl">No brands yet</div>
              <p className="mt-2 text-sm text-[#EEE8DC]/40">Hozd létre az első brand identitást az Identity Forge panelből.</p>
              <div className="mt-6">
                <ForgedButton variant="primary" onClick={() => window.scrollTo({ top: 420, behavior: 'smooth' })}>
                  <Plus className="w-4 h-4" /> Create Brand
                </ForgedButton>
              </div>
            </ForgedPanel>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {brands.map((brand) => (
                <ForgedPanel key={brand.id}>
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div>
                      <div className="font-serif text-2xl">{brand.name}</div>
                      <div className="text-xs text-[#EEE8DC]/55 mt-1">{brand.tone}</div>
                    </div>
                    <div className="text-xs text-[#9CEEE5]/70">{(brand.style_keywords || []).length} linked</div>
                  </div>
                  <div className="flex gap-2 mb-5">
                    {(brand.colors || []).slice(0, 6).map((color, index) => (
                      <div key={index} className="w-9 h-9 rounded-lg border border-[#263636]" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <ForgedButton variant="secondary" className="flex-1" onClick={() => applyBrand(brand)}>
                      Apply
                    </ForgedButton>
                    <ForgedButton variant="secondary" className="flex-1" onClick={() => onNavigate('templates')}>
                      Open
                    </ForgedButton>
                  </div>
                </ForgedPanel>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[#EEE8DC]/70">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40 focus:ring-2 focus:ring-[#9CEEE5]/5"
        placeholder={placeholder}
      />
    </label>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Palette;
}) {
  return (
    <ForgedPanel>
      <Icon className="w-5 h-5 mb-3 text-[#D6B36A]/75" />
      <div className="text-xs text-[#EEE8DC]/55">{label}</div>
      <div className="font-serif text-4xl mt-2">{value}</div>
    </ForgedPanel>
  );
}
