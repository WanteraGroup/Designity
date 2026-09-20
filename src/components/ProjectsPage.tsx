import { useEffect, useState } from 'react';
import { FolderOpen, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';
import { PreviewWatermark } from './PreviewWatermark';

interface ProjectsPageProps {
  onNavigate: (page: string) => void;
}

export function ProjectsPage({ onNavigate }: ProjectsPageProps) {
  const { t } = useI18n();
  const { profile, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      if (!profile) return;
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });
      setProjects((data as Project[]) || []);
      setLoading(false);
    }
    load();
  }, [profile]);

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.type === filter);
  const types = [...new Set(projects.map((p) => p.type))];

  const handleDelete = async (id: string) => {
    if (!confirm(t('projects.deleteConfirm'))) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card-lux h-44 animate-pulse"><div className="h-full bg-ink-700/30 rounded-xl" /></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-cream-50">{t('projects.title')}</h1>
        <button onClick={() => onNavigate('create')} className="btn-gold text-sm w-full sm:w-auto">
          <Sparkles className="w-4 h-4" />
          {t('nav.create')}
        </button>
      </div>

      {types.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`chip transition-all ${filter === 'all' ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}
          >
            {t('projects.all')} ({projects.length})
          </button>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`chip transition-all capitalize ${filter === type ? 'border-gold-600/40 bg-gold-600/10 text-gold-200' : 'border-ink-500/40 text-cream-300/60'}`}
            >
              {type.replace('_', ' ')} ({projects.filter((p) => p.type === type).length})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card-lux p-16 text-center">
          <FolderOpen className="w-12 h-12 text-cream-400/30 mx-auto mb-4" />
          <p className="text-sm text-cream-300/50 mb-4">{t('dash.noProjects')}</p>
          <button onClick={() => onNavigate('create')} className="btn-gold text-sm">
            <Sparkles className="w-4 h-4" />
            {t('nav.startCreating')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div key={project.id} className="card-lux p-5 group">
              <div
                className="aspect-video rounded-lg bg-ink-700/40 mb-3 flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => { localStorage.setItem('designly_selected_project', project.id); onNavigate('editor'); }}
              >
                {project.preview_url ? (
                  <>
                    <img src={project.preview_url} alt={project.name} className="w-full h-full object-cover" />
                    <PreviewWatermark hidden={isAdmin} projectName={project.name} label="DESIGNLY · PREVIEW" />
                  </>
                ) : (
                  <div className="text-3xl font-display gold-text opacity-30 capitalize">{project.type[0]}</div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-cream-100 truncate">{project.name}</div>
                  <div className="text-xs text-cream-300/40 capitalize">{project.type.replace('_', ' ')}</div>
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-1.5 text-cream-400/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
