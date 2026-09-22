import { Link } from 'react-router-dom';
import { useAsync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { getCreditsForType } from '@/lib/constants';
import type { Project, ProjectStatus } from '@/types';

const STATUS_STYLE: Record<ProjectStatus, string> = {
  draft: 'bg-ink-700 text-cream-300/70',
  generating: 'bg-gold-600/20 text-gold-200',
  completed: 'bg-emerald-500/15 text-emerald-300',
  failed: 'bg-red-500/15 text-red-300',
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  completed: 'Ready',
  failed: 'Failed',
};

/**
 * The project list. RLS scopes this to the signed-in user's own rows, so no
 * filter is needed here — but the ordering is explicit, because a list that
 * arrives unordered reshuffles between renders.
 */
export default function Projects() {
  const { data, loading, error } = useAsync(async () => {
    const { data: rows, error: e } = await supabase
      .from('projects')
      .select('id, name, type, status, brief, preview_url, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (e) throw e;
    return (rows ?? []) as Project[];
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-600/30 border-t-gold-400" />
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-cream-100">Projects</h1>
          <p className="mt-2 text-sm text-cream-300/60">
            {data?.length ? `${data.length} saved` : 'Everything you generate lands here.'}
          </p>
        </div>
        <Link to="/app/create" className="designly-btn">
          New project
        </Link>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && data?.length === 0 && (
        <div className="rounded-xl border border-gold-700/20 bg-ink-850/60 p-12 text-center">
          <p className="text-sm text-cream-300/60">Nothing here yet.</p>
          <Link to="/app/create" className="mt-5 inline-block text-sm text-gold-300 hover:text-gold-200">
            Create your first project →
          </Link>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((p) => (
          <Link
            key={p.id}
            to={`/app/projects/${p.id}`}
            className="group rounded-xl border border-gold-700/20 bg-ink-850/60 p-5 transition hover:border-gold-600/45"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="line-clamp-1 font-display text-lg text-cream-100">{p.name}</h2>
              <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] ${STATUS_STYLE[p.status]}`}>
                {STATUS_LABEL[p.status]}
              </span>
            </div>

            <p className="mt-2 text-xs text-cream-300/45">
              {p.type.replace(/_/g, ' ')} · {getCreditsForType(p.type)} cr
            </p>

            {p.brief && <p className="mt-3 line-clamp-2 text-sm text-cream-300/60">{p.brief}</p>}

            <p className="mt-4 text-[11px] text-cream-300/35">
              {new Date(p.updated_at).toLocaleDateString('hu-HU')}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
