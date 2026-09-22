import { useAsync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';

/**
 * Exported files. Nothing is stored twice: preview_url is an export of a
 * project, so a project with no export simply has no entry here.
 */
export default function Assets() {
  const { data, loading, error } = useAsync(async () => {
    const { data: rows, error: e } = await supabase
      .from('projects')
      .select('id, name, type, preview_url, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (e) throw e;
    return ((rows ?? []) as Project[]).filter((p) => !!p.preview_url);
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-cream-100">Assets</h1>
        <p className="mt-2 text-sm text-cream-300/60">Exported files from your projects.</p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && <div className="h-24 animate-pulse rounded-xl bg-ink-850/60" />}

      {!loading && data?.length === 0 && (
        <div className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-12 text-center">
          <p className="text-sm text-cream-300/60">
            No exports yet. A project shows up here once you export it.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
        {data?.map((p) => (
          <a
            key={p.id}
            href={p.preview_url ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-xl border border-gold-700/20 bg-ink-850/60 transition hover:border-gold-600/45"
          >
            <div className="grid aspect-[4/3] place-items-center bg-ink-800">
              <span className="font-display text-2xl text-gold-700/40">
                {p.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="px-4 py-3">
              <h2 className="line-clamp-1 text-sm text-cream-100">{p.name}</h2>
              <p className="mt-1 text-xs text-cream-300/45">{p.type.replace(/_/g, ' ')}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
