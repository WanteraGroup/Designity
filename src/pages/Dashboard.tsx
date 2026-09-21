import { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Cog, FolderOpen, Globe2, Mic, Music2, Palette, Radio, Sparkles, Store, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ForgedPanel, NordicHeader, ForgedButton, FogAndEmbers, HuginnPanel } from '@/components/ui';
import type { Project } from '@/types';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const coreModules = [
  { id: 'create', label: 'Create', icon: Palette },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'campaign', label: 'Campaigns', icon: Radio },
  { id: 'music', label: 'Music', icon: Music2 },
  { id: 'translator', label: 'Translator', icon: Globe2 },
  { id: 'shopify', label: 'Shopify', icon: Store },
  { id: 'cnc', label: 'CNC', icon: Wrench },
  { id: 'voice', label: 'Voice', icon: Mic },
] as const;

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, isUnlimited, isOwner } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      if (!profile) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false })
        .limit(6);

      if (active) {
        setProjects((data as Project[]) || []);
        setLoading(false);
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, [profile]);

  const displayProjects = useMemo(() => projects.slice(0, 4), [projects]);
  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Operator';
  const creditLabel = isUnlimited ? '∞' : (profile?.credits ?? 0).toLocaleString('hu-HU');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020505] text-[#E3FFFB]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.30]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(156,238,229,.08),transparent_34%),linear-gradient(to_bottom,rgba(2,5,5,.38),rgba(2,5,5,.96))]" aria-hidden="true" />
      <FogAndEmbers />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(214,179,106,.08)_1px,transparent_1px)] [background-size:32px_32px]" aria-hidden="true" />

      <NordicHeader title="DESIGNLY CORE — CREATIVE OPERATING SYSTEM" />

      <main className="relative z-10 mx-auto grid max-w-[1800px] grid-cols-1 gap-8 px-5 pb-24 pt-10 sm:px-8 xl:grid-cols-3">
        <ForgedPanel className="xl:col-span-2 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.3em] text-[#D6B36A]/70">CORE MAP</div>
              <h1 className="mt-2 font-serif text-3xl lg:text-4xl">DESIGNLY CORE</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#EEE8DC]/50">
                {userName} · a kreatív, AI és üzleti modulok központi vezérlőtere.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('agents')}>
              <Bot className="h-4 w-4" /> Agent Command
            </ForgedButton>
          </div>

          <div className="relative mt-6 h-[420px] overflow-hidden rounded-3xl border border-[#9CEEE5]/15 bg-[#020505]/55">
            <div className="absolute inset-[13%] rounded-full border border-[#D6B36A]/10" />
            <div className="absolute inset-[23%] rounded-full border border-[#9CEEE5]/14" />
            <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#9CEEE5]/45 bg-[#071311]/90 shadow-[0_0_70px_rgba(156,238,229,.12),inset_0_0_50px_rgba(214,179,106,.07)] backdrop-blur-xl">
              <button onClick={() => onNavigate('agents')} className="flex h-full w-full flex-col items-center justify-center rounded-full">
                <div className="font-serif text-xl">DESIGNLY</div>
                <div className="mt-1 text-[9px] uppercase tracking-[.25em] text-[#D6B36A]/75">CORE</div>
                <div className="mt-3 text-[8px] uppercase tracking-[.18em] text-[#9CEEE5]/55">● SYSTEM ONLINE</div>
              </button>
            </div>

            {coreModules.map((module, index) => {
              const angle = (index / coreModules.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 39;
              const y = 50 + Math.sin(angle) * 39;
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => onNavigate(module.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#9CEEE5]/30 bg-[#020505]/85 px-4 py-3 text-left shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur-md transition-all duration-300 hover:-translate-x-1/2 hover:-translate-y-[55%] hover:border-[#D6B36A]/50 hover:bg-[#0b1514]"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#D6B36A]/80" />
                    <span className="text-[10px] uppercase tracking-[.18em] text-[#E3FFFB]">{module.label}</span>
                  </span>
                </button>
              );
            })}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-[8px] uppercase tracking-[.28em] text-[#EEE8DC]/30">
              NORDIC CREATIVE COMMAND · SELECT A MODULE
            </div>
          </div>
        </ForgedPanel>

        <ForgedPanel>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#D6B36A]/80" />
            <h2 className="font-serif text-2xl">System Status</h2>
          </div>
          <div className="mt-5 space-y-3 text-xs">
            <StatusRow label="Core" value="ONLINE" />
            <StatusRow label="Agents" value="READY" />
            <StatusRow label="Projects" value={isUnlimited ? '∞' : String(projects.length)} />
            <StatusRow label="Credits" value={creditLabel} />
            <StatusRow label="Access" value={isOwner ? 'OWNER' : isUnlimited ? 'FULL' : 'STANDARD'} />
            <StatusRow label="Storage" value="LIVE CHECK" muted />
            <StatusRow label="Uptime" value="LIVE CHECK" muted />
          </div>
          <div className="mt-6">
            <HuginnPanel>
              <div className="grid grid-cols-2 gap-2">
                <SmallAction onClick={() => onNavigate('create')}>New Design</SmallAction>
                <SmallAction onClick={() => onNavigate('campaign')}>Campaign</SmallAction>
                <SmallAction onClick={() => onNavigate('agents')}>Analysis</SmallAction>
                <SmallAction onClick={() => onNavigate('translator')}>Translate</SmallAction>
              </div>
            </HuginnPanel>
          </div>
        </ForgedPanel>

        <ForgedPanel className="xl:col-span-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">PROJECT VAULT</div>
              <h2 className="mt-2 font-serif text-3xl">Recent Projects</h2>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('projects')}>View All</ForgedButton>
          </div>

          {loading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-[#263636] bg-black/20" />)}
            </div>
          ) : displayProjects.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[#263636] bg-black/25 p-10 text-center">
              <FolderOpen className="mx-auto h-9 w-9 text-[#EEE8DC]/25" />
              <div className="mt-3 text-sm text-[#EEE8DC]/50">Még nincs mentett projekt.</div>
              <ForgedButton className="mt-5" onClick={() => onNavigate('create')}>Create First Project</ForgedButton>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {displayProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    localStorage.setItem('designly_selected_project', project.id);
                    onNavigate('editor');
                  }}
                  className="group rounded-2xl border border-[#263636] bg-black/30 p-4 text-left transition-all hover:-translate-y-1 hover:border-[#D6B36A]/35 hover:bg-black/45"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-serif text-xl text-[#E3FFFB]">{project.name}</div>
                      <div className="mt-1 text-xs capitalize text-[#EEE8DC]/45">{project.type.replace('_', ' ')}</div>
                    </div>
                    <span className="rounded-full border border-[#9CEEE5]/15 px-2 py-1 text-[8px] uppercase tracking-[.12em] text-[#9CEEE5]/55">{project.status}</span>
                  </div>
                  <div className="mt-5 text-[10px] uppercase tracking-[.16em] text-[#D6B36A]/55">Open in Editor →</div>
                </button>
              ))}
            </div>
          )}
        </ForgedPanel>

        <ForgedPanel>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D6B36A]/75" />
            <h2 className="font-serif text-2xl">Today’s Activity</h2>
          </div>
          <div className="mt-5 space-y-3">
            <ActivityRow label="Latest project" value={projects[0]?.name || 'Nincs adat'} />
            <ActivityRow label="Project status" value={projects[0]?.status || '—'} />
            <ActivityRow label="Last update" value={projects[0]?.updated_at ? new Date(projects[0].updated_at).toLocaleString('hu-HU') : 'Nincs adat'} />
            <ActivityRow label="Credit state" value={creditLabel} />
          </div>
        </ForgedPanel>

        <ForgedPanel className="xl:col-span-3">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">CORE BRIDGES</div>
              <h2 className="mt-2 font-serif text-3xl">Creative Operating System</h2>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-[#EEE8DC]/50">
                A Core nem különálló oldalak gyűjteménye: innen közvetlenül indítható a Forge, az Agent Hub, a Campaign War Room, a Music, a Voice, a Translator, a Shopify és a CNC.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <ForgedButton variant="primary" onClick={() => onNavigate('create')}><Palette className="h-4 w-4" /> Create</ForgedButton>
              <ForgedButton variant="secondary" onClick={() => onNavigate('creator')}><Store className="h-4 w-4" /> Creator</ForgedButton>
              <ForgedButton variant="secondary" onClick={() => onNavigate('streamer')}><Radio className="h-4 w-4" /> Streamer</ForgedButton>
              <ForgedButton variant="secondary" onClick={() => onNavigate('cnc')}><Cog className="h-4 w-4" /> CNC</ForgedButton>
            </div>
          </div>
        </ForgedPanel>
      </main>
    </div>
  );
}

function StatusRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#9CEEE5]/10 bg-black/15 px-3 py-2.5">
      <span className="text-[#EEE8DC]/45">{label}</span>
      <span className={muted ? 'text-[#EEE8DC]/30' : 'text-[#D6B36A]'}>{value}</span>
    </div>
  );
}

function ActivityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#9CEEE5]/10 pb-3 last:border-b-0 last:pb-0">
      <div className="text-[8px] uppercase tracking-[.18em] text-[#EEE8DC]/30">{label}</div>
      <div className="mt-1 text-xs text-[#EEE8DC]/65 truncate">{value}</div>
    </div>
  );
}

function SmallAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-[#D6B36A]/15 bg-black/20 px-2 py-2 text-[9px] uppercase tracking-[.12em] text-[#EEE8DC]/55 transition-colors hover:border-[#D6B36A]/35 hover:text-[#D6B36A]">
      {children}
    </button>
  );
}
