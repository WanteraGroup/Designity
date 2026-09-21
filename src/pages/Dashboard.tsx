import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Globe2,
  Mic,
  Music2,
  Palette,
  Radio,
  Store,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  CelticGoldFrame,
  FogAndEmbers,
  ForgedButton,
  ForgedPanel,
  HuginnPanel,
  NordicHeader,
  RunePulse,
} from '@/components/ui';
import type { Project } from '@/types';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const coreModules = [
  { id: 'create', label: 'Készítés', x: '10%', y: '10%', icon: Palette },
  { id: 'agents', label: 'Ügynökök', x: '75%', y: '12%', icon: Bot },
  { id: 'campaign', label: 'Kampányok', x: '85%', y: '55%', icon: Radio },
  { id: 'music', label: 'Zene', x: '70%', y: '85%', icon: Music2 },
  { id: 'translator', label: 'Fordító', x: '15%', y: '80%', icon: Globe2 },
  { id: 'shopify', label: 'Shopify', x: '5%', y: '50%', icon: Store },
  { id: 'cnc', label: 'CNC', x: '50%', y: '5%', icon: Wrench },
  { id: 'voice', label: 'Hang', x: '50%', y: '90%', icon: Mic },
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

  const recentProjects = useMemo(
    () =>
      projects.slice(0, 4).map((project) => ({
        ...project,
        typeLabel: project.type.replaceAll('_', ' '),
        updatedLabel: project.updated_at
          ? `Frissítve ${new Date(project.updated_at).toLocaleString('hu-HU')}`
          : 'Frissítés: nincs adat',
      })),
    [projects],
  );

  const creditLabel = isUnlimited
    ? '∞'
    : (profile?.credits ?? 0).toLocaleString('hu-HU');

  const accessLabel = isOwner ? 'TULAJDONOS' : isUnlimited ? 'TELJES HOZZÁFÉRÉS' : 'STANDARD';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020505] text-[#E3FFFB]">
      {/* Háttér: nordikus hegyek + jégfény */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.28]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/40 to-[#020505]/92"
        aria-hidden="true"
      />

      {/* Füst + köd + parázs */}
      <FogAndEmbers />

      <NordicHeader title="DESIGNLY CORE — Kreatív Operációs Rendszer" />

      <main className="relative z-10 grid grid-cols-1 gap-8 px-5 pb-24 pt-10 sm:px-8 xl:grid-cols-3">
        {/* HUGINN PANEL */}
        <HuginnPanel>
          <div className="mt-4 flex items-center gap-2">
            <ForgedButton variant="secondary" onClick={() => onNavigate('agents')}>
              <Bot className="h-4 w-4" />
              Agent Command
            </ForgedButton>
          </div>
        </HuginnPanel>

        {/* CORE RING */}
        <ForgedPanel className="relative overflow-hidden xl:col-span-2">
          <CelticGoldFrame intensity="soft" />
          <RunePulse rune="ᚱ" duration="2s" />

          <div className="relative z-30">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-[.26em] text-[#D6B36A]/65">
                  CORE RING
                </div>
                <h2 className="font-serif text-2xl">Mag Modulok</h2>
              </div>
              <div className="hidden text-[8px] uppercase tracking-[.18em] text-[#EEE8DC]/35 sm:block">
                NORDIC CREATIVE COMMAND
              </div>
            </div>

            <div className="relative h-[360px]">
              {/* Központi mag */}
              <button
                onClick={() => onNavigate('agents')}
                className="absolute left-1/2 top-1/2 z-20 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#D6B36A]/60 bg-[#071311] font-serif text-lg shadow-[0_0_22px_rgba(214,179,106,0.45)] transition-all hover:scale-[1.03] hover:shadow-[0_0_34px_rgba(214,179,106,0.65)]"
              >
                <span>DESIGNLY MAG</span>
                <span className="mt-2 text-[8px] uppercase tracking-[.2em] text-[#9CEEE5]/55">
                  AI OPERATING SYSTEM
                </span>
              </button>

              {/* Modulok */}
              {coreModules.map((module) => {
                const Icon = module.icon;
                const isCampaign = module.id === 'campaign';

                return (
                  <button
                    key={module.id}
                    onClick={() => onNavigate(module.id)}
                    className={[
                      'absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-left transition-all duration-300',
                      'border shadow-[0_0_12px_rgba(214,179,106,0.25)] hover:-translate-x-1/2 hover:-translate-y-[55%]',
                      isCampaign
                        ? 'overflow-hidden border-[#D6B36A]/50 bg-[#020505]/80'
                        : 'border-[#D6B36A]/50 bg-[#020505]/80 hover:border-[#F2D99A]/65',
                    ].join(' ')}
                    style={{ left: module.x, top: module.y }}
                  >
                    {isCampaign && (
                      <>
                        <FogAndEmbers />
                        <CelticGoldFrame />
                        <RunePulse rune="ᚱ" duration="2s" />
                      </>
                    )}
                    <span className="relative z-30 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-[#D6B36A]/85" />
                      <span className="text-xs text-[#E3FFFB]">{module.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ForgedPanel>

        {/* Rendszerstátusz */}
        <ForgedPanel className="relative">
          <CelticGoldFrame intensity="soft" />
          <div className="relative z-30">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#D6B36A]/80" />
              <h2 className="font-serif text-2xl">Rendszerstátusz</h2>
            </div>

            <div className="mt-5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Ügynökök</span>
                <span className="text-[#9CEEE5]">READY</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Projektek</span>
                <span className="text-[#9CEEE5]">{isUnlimited ? '∞' : projects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kreditek</span>
                <span className="text-[#9CEEE5]">{creditLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hozzáférés</span>
                <span className="text-[#D6B36A]">{accessLabel}</span>
              </div>
              <div className="flex items-center justify-between text-[#EEE8DC]/35">
                <span>Tárhely</span>
                <span>LIVE CHECK</span>
              </div>
              <div className="flex items-center justify-between text-[#EEE8DC]/35">
                <span>Uptime</span>
                <span>LIVE CHECK</span>
              </div>
            </div>
          </div>
        </ForgedPanel>

        {/* Legutóbbi projektek */}
        <ForgedPanel className="relative xl:col-span-2">
          <CelticGoldFrame intensity="soft" />
          <div className="relative z-30">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-[.25em] text-[#D6B36A]/60">
                  PROJECT VAULT
                </div>
                <h2 className="font-serif text-2xl">Legutóbbi Projektek</h2>
              </div>
              <ForgedButton variant="secondary" onClick={() => onNavigate('projects')}>
                Összes projekt
              </ForgedButton>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-[12px] border border-[#263636] bg-[#020505]/60"
                  />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="rounded-[12px] border border-[#263636] bg-[#020505]/60 p-8 text-center text-xs text-[#EEE8DC]/50">
                Még nincs mentett projekt.
                <div className="mt-4">
                  <ForgedButton onClick={() => onNavigate('create')}>Első projekt készítése</ForgedButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      localStorage.setItem('designly_selected_project', project.id);
                      onNavigate('editor');
                    }}
                    className="rounded-[12px] border border-[#D6B36A]/40 bg-[#020505]/80 px-4 py-4 text-left shadow-[0_0_12px_rgba(214,179,106,0.25)] transition-all hover:-translate-y-1 hover:border-[#D6B36A]/65"
                  >
                    <div className="font-serif text-lg text-[#E3FFFB]">{project.name}</div>
                    <div className="mt-1 capitalize text-[#EEE8DC]/60">{project.typeLabel}</div>
                    <div className="mt-2 text-[#9CEEE5]/70">{project.updatedLabel}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ForgedPanel>

        {/* Mai aktivitás */}
        <ForgedPanel className="relative">
          <CelticGoldFrame intensity="soft" />
          <div className="relative z-30">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#D6B36A]/75" />
              <h2 className="font-serif text-2xl">Mai Aktivitás</h2>
            </div>
            <div className="space-y-3 text-xs">
              <ActivityRow label="Legutóbbi projekt" value={projects[0]?.name || 'Nincs adat'} />
              <ActivityRow label="Állapot" value={projects[0]?.status || '—'} />
              <ActivityRow
                label="Utolsó frissítés"
                value={
                  projects[0]?.updated_at
                    ? new Date(projects[0].updated_at).toLocaleString('hu-HU')
                    : 'Nincs adat'
                }
              />
              <ActivityRow label="Kreditállapot" value={creditLabel} />
            </div>
          </div>
        </ForgedPanel>
      </main>
    </div>
  );
}

function ActivityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#9CEEE5]/10 pb-3 last:border-b-0 last:pb-0">
      <div className="text-[8px] uppercase tracking-[.18em] text-[#EEE8DC]/30">{label}</div>
      <div className="mt-1 truncate text-xs text-[#EEE8DC]/65">{value}</div>
    </div>
  );
}
