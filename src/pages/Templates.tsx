import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { TEMPLATE_CATEGORIES } from '@/lib/constants';
import { templateCoverUrl } from '@/lib/template-art';
import { useTemplateHandoff } from '@/lib/use-template-seed';
import type { Template } from '@/types';

/**
 * The template hall. Templates are public rows, so this reads without a
 * session. Categories come from the same list the seed used, so a category
 * with no templates still shows as an empty filter rather than disappearing.
 */
export default function Templates() {
  const [category, setCategory] = useState<string | null>(null);
  const handoff = useTemplateHandoff();

  const { data, loading, error } = useAsync(async () => {
    let query = supabase
      .from('templates')
      .select('id, name, category, type, thumbnail_url, premium')
      .order('sort_order', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data: rows, error: e } = await query;
    if (e) throw e;
    return (rows ?? []) as Template[];
  }, [category]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-cream-100">Templates</h1>
        <p className="mt-2 text-sm text-cream-300/60">
          Start from a structure instead of a blank page.
        </p>
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
            category === null
              ? 'border-gold-600/60 bg-gold-600/15 text-gold-200'
              : 'border-gold-700/25 text-cream-300/60 hover:border-gold-600/45 hover:text-cream-200'
          }`}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
              category === c
                ? 'border-gold-600/60 bg-gold-600/15 text-gold-200'
                : 'border-gold-700/25 text-cream-300/60 hover:border-gold-600/45 hover:text-cream-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && (
        <div className="grid min-h-[30vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-600/30 border-t-gold-400" />
        </div>
      )}

      {!loading && data?.length === 0 && (
        <div className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-12 text-center">
          <p className="text-sm text-cream-300/60">
            {category ? `No templates in ${category} yet.` : 'The catalogue is empty.'}
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handoff(t.name, t.category)}
            className="group overflow-hidden rounded-xl border border-gold-700/20 bg-ink-850/60 text-left transition hover:border-gold-600/45"
          >
            <div className="aspect-[4/3] overflow-hidden bg-ink-800">
              {/* A stored thumbnail wins; the drawn cover is the fallback, so a
                  template without artwork is never a broken image. */}
              <img
                src={t.thumbnail_url ?? templateCoverUrl(t.name, t.category)}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </div>

            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base text-cream-100">{t.name}</h2>
                {t.premium && (
                  <span className="rounded bg-gold-600/15 px-2 py-0.5 text-[11px] text-gold-200">
                    Premium
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-cream-300/45">
                {t.category} · {t.type.replace(/_/g, ' ')}
              </p>
            </div>
          </button>
        ))}
      </div>

      {!loading && !!data?.length && (
        <p className="mt-8 text-xs text-cream-300/40">
          Pick one and it opens the create flow with a starting brief.{' '}
          <Link to="/app/create" className="text-gold-300 hover:text-gold-200">
            Or start from nothing
          </Link>
          .
        </p>
      )}
    </div>
  );
}
