import { useEffect, useState } from 'react';
import {
  Plus, FolderOpen, Coins, Sparkles, TrendingUp, Infinity as InfinityIcon,
  Layout, Palette, CreditCard, FileText, Image as ImageIcon, Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { GENERATION_COSTS } from '@/lib/constants';
import { CelticEmblem } from './CelticEmblem';
import type { Project } from '@/types';

interface DashboardHomeProps {
  onNavigate: (page: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { t } = useI18n();
  const { profile, isOwner, isUnlimited } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      if (!profile) return;
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false })
        .limit(6);
      setProjects((data as Project[]) || []);
      setLoading(false);
    }
    loadProjects();
  }, [profile]);

  const quickCreate = GENERATION_COSTS.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-cream-50">
            {t('dash.welcome')}, {profile?.full_name || profile?.email?.split('@')[0]}
          </h1>
          <p className="text-sm text-cream-300/50 mt-1">
            {isUnlimited ? (isOwner ? t('dash.ownerBadge') : 'FULL UNLOCK — Unlimited access') : t('dash.readyCreate')}
          </p>
        </div>
        <button onClick={() => onNavigate('create')} className="btn-gold text-sm shrink-0">
          <Plus className="w-4 h-4" />
          {t('dash.quickCreate')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Coins}
          label={t('dash.remainingCredits')}
          value={isUnlimited ? '∞' : String(profile?.credits ?? 0)}
          accent={isUnlimited}
        />
        <StatCard
          icon={TrendingUp}
          label={t('dash.currentPlan')}
          value={isOwner ? 'OWNER' : isUnlimited ? 'FULL UNLOCK' : (profile?.plan_id || 'free').toUpperCase()}
          accent={isUnlimited}
        />
        <StatCard
          icon={FolderOpen}
          label={t('dash.recentProjects')}
          value={isUnlimited ? '∞' : String(projects.length)}
          accent={false}
        />
      </div>

      {/* Owner banner */}
      {isUnlimited && (
        <div className="card-lux p-6 flex items-center gap-6 border-gold-600/30">
          <CelticEmblem size={64} animate showD={false} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-display font-bold gold-text">{t('dash.unlimited').toUpperCase()}</span>
              <InfinityIcon className="w-5 h-5 text-gold-400" />
            </div>
            <p className="text-sm text-cream-300/60">
              {t('dash.ownerDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Quick create */}
      <div>
        <h2 className="text-lg font-display font-semibold text-cream-100 mb-4">{t('dash.quickCreate')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickCreate.map((item) => (
            <button
              key={item.type}
              onClick={() => onNavigate('create')}
              className="card-lux p-4 text-center group hover:scale-105 transition-transform duration-300"
            >
              <TypeIcon type={item.type} />
              <div className="text-xs font-medium text-cream-200 mt-2">{item.label}</div>
              <div className="text-[10px] text-gold-400 mt-1">
                {isUnlimited ? '∞' : `${item.credits} credits`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-cream-100">{t('dash.recentProjects')}</h2>
          <button onClick={() => onNavigate('projects')} className="text-xs text-gold-400 hover:text-gold-200 transition-colors">
            {t('common.viewAll')} →
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-lux h-40 animate-pulse">
                <div className="h-full bg-ink-700/30 rounded-xl" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="card-lux p-12 text-center">
            <FolderOpen className="w-10 h-10 text-cream-400/30 mx-auto mb-4" />
            <p className="text-sm text-cream-300/50">{t('dash.noProjects')}</p>
            <button onClick={() => onNavigate('create')} className="btn-gold text-sm mt-4">
              <Sparkles className="w-4 h-4" />
              {t('nav.startCreating')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="card-lux p-5 cursor-pointer group" onClick={() => onNavigate('editor')}>
                <div className="aspect-video rounded-lg bg-ink-700/40 mb-3 flex items-center justify-center overflow-hidden">
                  {project.preview_url ? (
                    <img src={project.preview_url} alt={project.name} className="w-full h-full object-cover" />
                  ) : (
                    <TypeIcon type={project.type} large />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-cream-100 truncate">{project.name}</div>
                    <div className="text-xs text-cream-300/40 capitalize">{project.type.replace('_', ' ')}</div>
                  </div>
                  <span className={`chip text-[10px] ${
                    project.status === 'completed'
                      ? 'border-green-500/30 bg-green-500/10 text-green-300'
                      : project.status === 'generating'
                      ? 'border-gold-600/30 bg-gold-600/10 text-gold-200'
                      : project.status === 'failed'
                      ? 'border-red-500/30 bg-red-500/10 text-red-300'
                      : 'border-ink-500/40 bg-ink-700/30 text-cream-300/50'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: boolean }) {
  return (
    <div className={`card-lux p-5 ${accent ? 'border-gold-600/30' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-gold-600/20' : 'bg-ink-700/50'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-gold-300' : 'text-cream-300/60'}`} />
        </div>
        <span className="text-xs text-cream-300/50 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-display font-bold ${accent ? 'gold-text' : 'text-cream-50'}`}>{value}</div>
    </div>
  );
}

function TypeIcon({ type, large = false }: { type: string; large?: boolean }) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    website: Globe, landing: Layout, logo: Palette, brand: Palette,
    business_card: CreditCard, invitation: FileText, flyer: FileText,
    social: ImageIcon, brochure: FileText, menu: FileText,
    presentation: Layout, custom: Sparkles,
  };
  const Icon = map[type] || Sparkles;
  return <Icon className={large ? 'w-8 h-8 text-gold-400/60' : 'w-5 h-5 text-gold-400 mx-auto'} />;
}
