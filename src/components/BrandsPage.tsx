import { useEffect, useState } from 'react';
import { Palette, Plus, Trash2, Sparkles, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { BrandKit } from '@/types';

interface BrandsPageProps {
  onNavigate: (page: string) => void;
}

const PRESET_COLORS = ['#c49a2e', '#0a0a0b', '#f9f5ec', '#2d2d34', '#e0c066', '#1a1a1e'];

export function BrandsPage({ onNavigate }: BrandsPageProps) {
  const { t } = useI18n();
  const { profile, isUnlimited, refreshProfile } = useAuth();
  const [brands, setBrands] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    industry: '',
    tone: 'Premium, elegant, modern',
    colors: ['#c49a2e', '#0a0a0b', '#f9f5ec'],
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Inter',
    keywords: 'luxury, elegant, premium',
  });

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

  const handleCreate = async () => {
    if (!profile) return;
    setError(null);

    if (!isUnlimited) {
      const cost = 5;
      if ((profile.credits ?? 0) < cost) {
        setError(t('brands.insufficientCredits'));
        return;
      }
    }

    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));

    const { data, error: insertError } = await supabase
      .from('brands')
      .insert({
        user_id: profile.id,
        name: form.name,
        industry: form.industry,
        colors: form.colors,
        fonts: { heading: form.headingFont, body: form.bodyFont },
        tone: form.tone,
        style_keywords: form.keywords.split(',').map((k) => k.trim()),
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setGenerating(false);
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
        setError(t('brands.insufficientCredits'));
        setGenerating(false);
        return;
      }
      await refreshProfile();
    }

    setBrands([data as BrandKit, ...brands]);
    setGenerating(false);
    setShowForm(false);
    setForm({
      name: '', industry: '', tone: 'Premium, elegant, modern',
      colors: ['#c49a2e', '#0a0a0b', '#f9f5ec'],
      headingFont: 'Cormorant Garamond', bodyFont: 'Inter', keywords: 'luxury, elegant, premium',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('brands.deleteConfirm'))) return;
    await supabase.from('brands').delete().eq('id', id);
    setBrands(brands.filter((b) => b.id !== id));
  };

  const toggleColor = (color: string) => {
    setForm((f) => ({
      ...f,
      colors: f.colors.includes(color)
        ? f.colors.filter((c) => c !== color)
        : [...f.colors, color].slice(0, 6),
    }));
  };

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-2 border-gold-600/30 border-t-gold-400 rounded-full animate-spin mb-6" />
        <p className="text-sm text-gold-200">{t('brands.generating')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-cream-50">{t('brands.title')}</h1>
          <p className="text-sm text-cream-300/50 mt-1">{t('brands.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-gold text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          {t('brands.newKit')}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>
      )}

      {showForm && (
        <div className="card-lux p-6 space-y-5 animate-fade-in">
          <h3 className="text-lg font-display font-semibold text-cream-50">{t('brands.newKit')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-lux">{t('brands.brandName')}</label>
              <input className="input-lux" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Atelier Noir" />
            </div>
            <div>
              <label className="label-lux">{t('brands.industry')}</label>
              <input className="input-lux" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Barber shop" />
            </div>
          </div>

          <div>
            <label className="label-lux">{t('brands.toneVoice')}</label>
            <input className="input-lux" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} />
          </div>

          <div>
            <label className="label-lux">{t('brands.brandColors')}</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleColor(c)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${form.colors.includes(c) ? 'border-gold-400 scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                >
                  {form.colors.includes(c) && <Check className="w-4 h-4 text-cream-50 mx-auto drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-lux">{t('brands.headingFont')}</label>
              <select className="input-lux" value={form.headingFont} onChange={(e) => setForm({ ...form, headingFont: e.target.value })}>
                <option>Cormorant Garamond</option>
                <option>Inter</option>
                <option>Georgia</option>
                <option>Playfair Display</option>
              </select>
            </div>
            <div>
              <label className="label-lux">{t('brands.bodyFont')}</label>
              <select className="input-lux" value={form.bodyFont} onChange={(e) => setForm({ ...form, bodyFont: e.target.value })}>
                <option>Inter</option>
                <option>Georgia</option>
                <option>System UI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-lux">{t('brands.styleKeywords')}</label>
            <input className="input-lux" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-cream-300/50">{t('brands.cost')}: {isUnlimited ? '∞' : `5 ${t('misc.creditsShort')}`}</span>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">{t('common.cancel')}</button>
              <button onClick={handleCreate} disabled={!form.name || !form.industry} className="btn-gold text-sm disabled:opacity-40">
                <Sparkles className="w-4 h-4" />
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="card-lux h-48 animate-pulse" />)}
        </div>
      ) : brands.length === 0 ? (
        <div className="card-lux p-16 text-center">
          <Palette className="w-12 h-12 text-cream-400/30 mx-auto mb-4" />
          <p className="text-sm text-cream-300/50 mb-4">{t('brands.noBrandsDesc')}</p>
          <button onClick={() => setShowForm(true)} className="btn-gold text-sm">
            <Plus className="w-4 h-4" />
            {t('brands.createKit')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div key={brand.id} className="card-lux p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-display font-semibold text-cream-50">{brand.name}</h3>
                  <p className="text-xs text-cream-300/40">{brand.industry}</p>
                </div>
                <button onClick={() => handleDelete(brand.id)} className="p-1.5 text-cream-400/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-1.5 mb-4">
                {(brand.colors || []).slice(0, 6).map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg border border-ink-600/40" style={{ backgroundColor: c }} />
                ))}
              </div>

              <div className="space-y-1 text-xs text-cream-300/50">
                <div>{t('brands.heading')}: <span className="text-cream-200">{brand.fonts?.heading}</span></div>
                <div>{t('brands.body')}: <span className="text-cream-200">{brand.fonts?.body}</span></div>
                <div>{t('brands.tone')}: <span className="text-cream-200">{brand.tone}</span></div>
              </div>

              {(brand.style_keywords || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {brand.style_keywords.slice(0, 4).map((k, i) => (
                    <span key={i} className="chip text-[10px] border-gold-600/20 bg-gold-600/5 text-gold-200/70">{k}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
