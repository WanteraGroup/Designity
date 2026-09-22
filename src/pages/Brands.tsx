import { useState } from 'react';
import { useAsync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { BrandKit } from '@/types';

const EMPTY = { name: '', industry: '', tone: '', colors: ['#c49a2e', '#050505'] };

/**
 * Brand kits: the colours, fonts and voice a generation should respect.
 * Kept deliberately small — a kit is five fields, and a form that asks for
 * more than that does not get filled in.
 */
export default function Brands() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useAsync(async () => {
    const { data: rows, error: e } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false });
    if (e) throw e;
    return (rows ?? []) as BrandKit[];
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !user) return;
    setBusy(true);
    setError(null);

    const { error: err } = await supabase.from('brands').insert({
      name: form.name.trim(),
      industry: form.industry.trim(),
      tone: form.tone.trim(),
      colors: form.colors,
      user_id: user.id,
    });

    setBusy(false);
    if (err) return setError(err.message);
    setForm(EMPTY);
    await reload();
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-cream-100">Brand Kits</h1>
        <p className="mt-2 text-sm text-cream-300/60">
          A palette and a voice the AI will follow on every generation.
        </p>
      </header>

      <form onSubmit={create} className="designly-card mb-8 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs text-cream-300/60">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="designly-input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-cream-300/60">Industry</span>
          <input
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            className="designly-input"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-xs text-cream-300/60">Voice</span>
          <input
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value })}
            placeholder="pl. barátságos, szakértő, visszafogott"
            className="designly-input"
          />
        </label>

        <div className="md:col-span-2">
          <span className="mb-1.5 block text-xs text-cream-300/60">Colours</span>
          <div className="flex flex-wrap items-center gap-3">
            {form.colors.map((c, i) => (
              <label key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={c}
                  onChange={(e) => {
                    const next = [...form.colors];
                    next[i] = e.target.value;
                    setForm({ ...form, colors: next });
                  }}
                  className="h-9 w-9 cursor-pointer rounded border border-gold-700/25 bg-transparent"
                />
                <span className="font-mono text-xs text-cream-300/50">{c}</span>
              </label>
            ))}
            {form.colors.length < 4 && (
              <button
                type="button"
                onClick={() => setForm({ ...form, colors: [...form.colors, '#ffffff'] })}
                className="rounded border border-gold-700/25 px-3 py-1.5 text-xs text-cream-300/60 hover:text-cream-200"
              >
                + colour
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 md:col-span-2">
            {error}
          </p>
        )}

        <div className="md:col-span-2">
          <button type="submit" disabled={busy} className="designly-btn">
            {busy ? 'Saving…' : 'Create brand kit'}
          </button>
        </div>
      </form>

      {loading && <div className="h-20 animate-pulse rounded-xl bg-ink-850/60" />}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((b) => (
          <div key={b.id} className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-5">
            <div className="mb-3 flex gap-1.5">
              {b.colors.map((c) => (
                <span
                  key={c}
                  className="h-6 w-6 rounded border border-white/10"
                  style={{ background: c }}
                />
              ))}
            </div>
            <h2 className="font-display text-base text-cream-100">{b.name}</h2>
            <p className="mt-1 text-xs text-cream-300/45">
              {[b.industry, b.tone].filter(Boolean).join(' · ') || 'No details'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
