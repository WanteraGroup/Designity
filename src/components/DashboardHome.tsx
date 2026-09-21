import { useEffect, useState } from 'react';
import {
  Plus, FolderOpen, Coins, Sparkles, TrendingUp, Infinity as InfinityIcon,
  Layout, Palette, CreditCard, FileText, Image as ImageIcon, Globe, Music2, Gamepad2, Radio,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { GENERATION_COSTS } from '@/lib/constants';
import { CelticEmblem } from './CelticEmblem';
import { ForgedPanel } from './layout/ForgedPanel';
import { ForgedButton } from './layout/ForgedButton';
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
      {/* DESIGNLY CORE — Nordic command center */}
      <section className="designly-core-dashboard">
        <div className="designly-core-bg" aria-hidden="true" />
        <div className="designly-core-runes" aria-hidden="true">ᛉ ᚨ ᛟ ᚱ ᚦ ᚷ ᛏ ᚹ ᛒ</div>

        <div className="designly-core-top">
          <div className="designly-core-kicker"><CelticEmblem size={26} animate showD={false} /> DESIGNLY · CREATIVE OPERATING SYSTEM</div>
          <div className="designly-core-user">
            <span className="designly-online-dot" />
            {isUnlimited ? 'SYSTEM ONLINE · FULL ACCESS' : 'SYSTEM ONLINE'}
          </div>
        </div>

        <div className="designly-core-main">
          <div className="designly-core-copy">
            <div className="text-[10px] uppercase tracking-[.32em] text-amber-200/70">ANCIENT WISDOM · MODERN CREATION</div>
            <h1 className="mt-3 text-4xl lg:text-6xl font-display font-semibold text-cream-50">
              {t('dash.welcome')}, {profile?.full_name || profile?.email?.split('@')[0]}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-cream-200/65">
              A DESIGNLY CORE összekapcsolja a kreatív eszközöket, az AI agenteket és a projektmunkát egyetlen műveleti térben.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ForgedButton onClick={() => onNavigate('create')} variant="primary">
                <Plus className="w-4 h-4" /> FORGE · CREATE
              </ForgedButton>
              <ForgedButton onClick={() => onNavigate('agents')} variant="secondary">
                <Sparkles className="w-4 h-4" /> AGENT COMMAND
              </ForgedButton>
            </div>
          </div>

          <div className="designly-core-orbital" aria-label="DESIGNLY CORE module map">
            <div className="designly-core-ring designly-core-ring-outer" />
            <div className="designly-core-ring designly-core-ring-inner" />
            {[
              { id: 'create', label: 'CREATE', sub: 'FORGE', glyph: '⚒' },
              { id: 'agents', label: 'AGENTS', sub: 'AI TEAM', glyph: '◈' },
              { id: 'campaign', label: 'CAMPAIGNS', sub: 'WAR ROOM', glyph: '⚑' },
              { id: 'music', label: 'MUSIC', sub: 'SOUND HALL', glyph: '♫' },
              { id: 'voice', label: 'VOICE', sub: 'VOICE STUDIO', glyph: '◉' },
              { id: 'translator', label: 'TRANSLATOR', sub: 'GLOBAL REACH', glyph: 'ᚱ' },
              { id: 'shopify', label: 'SHOPIFY', sub: 'MERCHANT HALL', glyph: '◇' },
              { id: 'cnc', label: 'CNC', sub: 'ENGINEERING', glyph: '⌘' },
            ].map((m, i) => {
              const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 42;
              const y = 50 + Math.sin(angle) * 42;
              return (
                <button
                  key={m.id}
                  onClick={() => onNavigate(m.id)}
                  className="designly-core-module"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className="designly-core-module-glyph">{m.glyph}</span>
                  <span className="designly-core-module-name">{m.label}</span>
                  <span className="designly-core-module-sub">{m.sub}</span>
                </button>
              );
            })}
            <button onClick={() => onNavigate('agents')} className="designly-core-center">
              <CelticEmblem size={132} animate />
              <span className="designly-core-center-label">DESIGNLY CORE</span>
              <span className="designly-core-center-sub">AI OPERATING SYSTEM</span>
              <span className="designly-core-center-status">● ONLINE</span>
            </button>
          </div>

          <div className="designly-core-side">
            <div className="designly-system-panel">
              <div className="designly-panel-title">SYSTEM STATUS</div>
              <div className="designly-system-state"><span className="designly-online-dot" /> ONLINE</div>
              <div className="designly-system-row"><span>Agents</span><strong>{isUnlimited ? '14 / 14' : 'ACTIVE'}</strong></div>
              <div className="designly-system-row"><span>Projects</span><strong>{isUnlimited ? '∞' : projects.length}</strong></div>
              <div className="designly-system-row"><span>Credits</span><strong>{isUnlimited ? '∞' : (profile?.credits ?? 0).toLocaleString('hu-HU')}</strong></div>
              <div className="designly-system-row"><span>Access</span><strong>{isOwner ? 'OWNER' : isUnlimited ? 'FULL' : 'STANDARD'}</strong></div>
            </div>
            <div className="designly-huginn-card">
              <div className="designly-panel-title">HUGINN AI</div>
              <div className="designly-huginn-state"><span className="designly-online-dot" /> READY</div>
              <p>Mit építsünk ma?</p>
              <div className="designly-huginn-actions">
                <button onClick={() => onNavigate('create')}>Új design</button>
                <button onClick={() => onNavigate('campaign')}>Campaign</button>
                <button onClick={() => onNavigate('agents')}>Elemzés</button>
                <button onClick={() => onNavigate('translator')}>Fordítás</button>
              </div>
            </div>
          </div>
        </div>

        <div className="designly-world-strip">
          {[
            { id: 'create', title: 'CREATE', sub: 'Forge Studio', icon: '⚒' },
            { id: 'agents', title: 'AGENTS', sub: 'AI Command', icon: '◈' },
            { id: 'campaign', title: 'CAMPAIGNS', sub: 'War Room', icon: '⚑' },
            { id: 'music', title: 'MUSIC', sub: 'Sound Hall', icon: '♫' },
            { id: 'shopify', title: 'SHOPIFY', sub: 'Merchant Hall', icon: '◇' },
            { id: 'cnc', title: 'CNC', sub: 'Engineering', icon: '⌘' },
          ].map((m) => (
            <button key={m.id} onClick={() => onNavigate(m.id)} className="designly-world-card">
              <span className="designly-world-glyph">{m.icon}</span>
              <span className="designly-world-title">{m.title}</span>
              <span className="designly-world-sub">{m.sub}</span>
              <span className="designly-world-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

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
                  localStorage.setItem('designly_auto_build', JSON.stringify({ type:'website', brief, projectName: companyName.trim(), clientName: clientName.trim(), companyName: companyName.trim(), packageName }));
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

      {/* Creator / Gamer Product Studio */}
      <section className="relative overflow-hidden card-lux p-6 border-gold-600/20">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.2em]">
              <Gamepad2 className="w-4 h-4" /> Creator / Gamer Product Studio
            </div>
            <h2 className="text-2xl font-display font-semibold text-cream-50 mt-2">Merch → master artwork → gyártási specifikáció</h2>
            <p className="text-sm text-cream-300/55 mt-2 max-w-2xl">
              Póló, hoodie, XXL egérpad, bögre, sapka, poszter, matrica vagy telefontok. A streamer/gamer saját nevére és stílusára szabható grafika projektként menthető.
            </p>
          </div>
          <button onClick={() => onNavigate('creator')} className="btn-gold text-sm shrink-0">
            <Gamepad2 className="w-4 h-4" /> Termék készítése
          </button>
        </div>
      </section>

      {/* Streamer / Gamer Studio */}
      <section className="relative overflow-hidden card-lux p-6 border-gold-500/20">
        <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-gold-500/6 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-gold-300"><Radio className="w-4 h-4" /> Streamer Studio</div>
            <h2 className="mt-2 text-2xl font-display font-semibold text-cream-50">Overlayek · Alertok · Screens · Branding · Community</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-cream-300/55">
              Készíts teljes creator csomagot: Starting Soon, BRB, Ending, gameplay overlay, webcam frame, chat box, event list, goal bar, follow/sub/donation/raid alert, panelek, thumbnailok, emote- és badge-rendszer, esports grafika és motion-ready scene.
            </p>
          </div>
          <button onClick={() => onNavigate('streamer')} className="btn-gold text-sm shrink-0"><Gamepad2 className="w-4 h-4" /> Streamer Studio megnyitása</button>
        </div>
      </section>

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
    <ForgedPanel className={accent ? 'border-[#D6B36A]/30' : ''}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-[#D6B36A]/15' : 'bg-[#071311]/70'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-[#D6B36A]' : 'text-[#9CEEE5]/65'}`} />
        </div>
        <span className="text-xs text-cream-300/50 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-display font-bold ${accent ? 'text-[#E3FFFB]' : 'text-cream-50'}`}>{value}</div>
    </ForgedPanel>
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
