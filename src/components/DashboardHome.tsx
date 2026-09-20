import { useEffect, useState } from 'react';
import {
  Plus, FolderOpen, Coins, Sparkles, TrendingUp, Infinity as InfinityIcon,
  Layout, Palette, CreditCard, FileText, Image as ImageIcon, Globe, Music2,
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
  const [clientModal, setClientModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [packageName, setPackageName] = useState('Prémium weboldal');

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
              {isOwner ? '100 000 000 tulajdonosi kredit · nincs kreditlevonás · korlátlan DESIGNLY AI használat.' : t('dash.ownerDesc')}
            </p>
          </div>
        </div>
      )}

      {/* One-click Business Builder */}
      <section className="relative overflow-hidden card-lux p-6 lg:p-8 border-gold-600/30 bg-gradient-to-r from-gold-600/10 via-ink-900/60 to-transparent">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold-300 mb-2">◆ AI BUSINESS BUILDER</div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-cream-50">Ötletből kész projekt.</h2>
            <p className="text-sm text-cream-300/60 mt-2 max-w-2xl">A DESIGNLY létrehozza a projekt alapját, az AI ügynökök pedig a briefből felépítik a struktúrát, tartalmat és vizuális irányt. VYRON riportból is közvetlenül indítható.</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => {
              localStorage.setItem('designly_auto_build', JSON.stringify({
                type: 'website',
                brief: 'AUTOMATIC BUSINESS BUILD: Create a complete production-oriented responsive business website/app from the user\'s next idea. Include a premium hero, clear value proposition, services/products, pricing, CTA, contact flow, mobile navigation, AI assistant concept, admin/dashboard structure, customer/order flow where relevant, and a coherent brand system. Make all unsupported business details editable placeholders. Use DESIGNLY\'s premium black, gold, metallic and Celtic visual language.'
              }));
              onNavigate('create');
            }} className="btn-gold text-sm">◆ AUTOMATIC BUILD</button>
            <button onClick={() => setClientModal(true)} className="px-4 py-2 rounded-lg border border-gold-500/30 text-gold-200 text-sm hover:bg-gold-500/10 transition-all">
              ÜGYFÉLPROJEKT
            </button>
          </div>
        </div>
      </section>

      {clientModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl border border-gold-500/25 bg-[#0b0b0b] shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div><div className="text-[10px] uppercase tracking-[.25em] text-gold-300">DESIGNLY CLIENT BUILDER</div><h3 className="text-2xl font-display font-bold text-cream-50 mt-1">Új ügyfélprojekt</h3><p className="text-xs text-cream-300/50 mt-1">Add meg az alapadatokat. A DESIGNLY AI a többit felépíti.</p></div>
              <button onClick={() => setClientModal(false)} className="text-cream-300/50 hover:text-cream-50 text-xl">×</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={clientName} onChange={e=>setClientName(e.target.value)} className="input-lux" placeholder="Ügyfél neve" />
              <input value={companyName} onChange={e=>setCompanyName(e.target.value)} className="input-lux" placeholder="Cégnév" />
              <input value={industry} onChange={e=>setIndustry(e.target.value)} className="input-lux" placeholder="Iparág / tevékenység" />
              <select value={packageName} onChange={e=>setPackageName(e.target.value)} className="input-lux"><option>Bemutatkozó weboldal</option><option>Prémium weboldal</option><option>Webshop</option><option>AI üzleti rendszer</option></select>
              <textarea value={goal} onChange={e=>setGoal(e.target.value)} className="input-lux sm:col-span-2 resize-none" rows={4} placeholder="Mit szeretne az ügyfél? Pl. több érdeklődő, online foglalás, értékesítés, márkaépítés…" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setClientModal(false)} className="btn-ghost text-sm">Mégse</button>
              <button
                disabled={!companyName.trim() || !industry.trim() || !goal.trim()}
                onClick={() => {
                  const brief = `ÜGYFÉLPROJEKT — ${companyName.trim()} — ${industry.trim()}. Ügyfél kapcsolattartó: ${clientName.trim() || 'nincs megadva'}. Cél: ${goal.trim()}. Megrendelt csomag: ${packageName}. Build a complete production-oriented responsive business website/app. Include premium hero, value proposition, services/products, pricing, CTA, contact flow, mobile navigation, AI assistant concept, admin/dashboard structure, customer/order flow where relevant, coherent brand system, editable placeholders for unknown details. Use DESIGNLY premium black, gold, metallic and Celtic visual language. Treat all client-specific details as editable content.`;
                  localStorage.setItem('designly_auto_build', JSON.stringify({ type:'website', brief }));
                  setClientModal(false);
                  onNavigate('create');
                }}
                className="btn-gold text-sm disabled:opacity-40"
              >AI ÜGYFÉLPROJEKT INDÍTÁSA →</button>
            </div>
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

      {/* AI Music Studio */}
      <section className="relative overflow-hidden card-lux p-6 border-gold-600/20">
        <div className="absolute -right-8 -top-12 opacity-20 pointer-events-none"><CelticEmblem size={180} animate showD /></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.2em]">
              <Music2 className="w-4 h-4" /> AI Music Studio
            </div>
            <h2 className="text-2xl font-display font-semibold text-cream-50 mt-2">Dalszöveg → zene → ének</h2>
            <p className="text-sm text-cream-300/55 mt-2 max-w-2xl">
              Készíts komplett AI-dalokat énekkel, hallgasd meg, töltsd le WAV-ban, vagy oszd meg e-mailben.
            </p>
          </div>
          <button onClick={() => onNavigate('music')} className="btn-gold text-sm shrink-0">
            <Music2 className="w-4 h-4" /> Zene készítése
          </button>
        </div>
      </section>

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
              <div key={project.id} className="card-lux p-5 cursor-pointer group" onClick={() => { localStorage.setItem('designly_selected_project', project.id); onNavigate('editor'); }}>
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
