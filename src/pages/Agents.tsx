import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';
import { CelticCorners } from '@/components/layout/CommandDeck';
import { Bird, BrainCircuit, Cpu, Search, Waypoints, BriefcaseBusiness, Package, Hammer, ShieldCheck, Sparkles, FileBarChart2, Network } from 'lucide-react';

interface AgentsProps {
  onNavigate: (page: string) => void;
}

const specialists = [
  { id: 1, name: 'ARCHITECT', role: 'System Design', sigil: 'ᚠ', icon: Cpu },
  { id: 2, name: 'RESEARCH', role: 'Data & Insights', sigil: 'ᚱ', icon: Search },
  { id: 3, name: 'TECH SCOUT', role: 'Technology Discovery', sigil: 'ᚦ', icon: Waypoints },
  { id: 4, name: 'BUSINESS', role: 'Strategy & Ops', sigil: 'ᚨ', icon: BriefcaseBusiness },
  { id: 5, name: 'PRODUCT', role: 'Product Development', sigil: 'ᚲ', icon: Package },
  { id: 6, name: 'BUILDER', role: 'Creation Engine', sigil: 'ᚷ', icon: Hammer },
  { id: 7, name: 'REVIEWER', role: 'Quality Control', sigil: 'ᚹ', icon: ShieldCheck },
  { id: 8, name: 'SALES', role: 'Market Execution', sigil: 'ᚺ', icon: Sparkles },
  { id: 9, name: 'REPORT', role: 'Analytics & Output', sigil: 'ᛉ', icon: FileBarChart2 },
];

const networkNodes = [
  { label: 'HUGINN', x: '18%', y: '16%' },
  { label: 'MUNINN', x: '70%', y: '12%' },
  { label: 'ARCHITECT', x: '8%', y: '58%' },
  { label: 'RESEARCH', x: '80%', y: '52%' },
  { label: 'BUILDER', x: '30%', y: '82%' },
  { label: 'REVIEWER', x: '64%', y: '78%' },
];

export default function Agents({ onNavigate }: AgentsProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020505] text-[#E3FFFB]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/94"
        aria-hidden="true"
      />

      <NordicHeader title="AGENTS — ODIN'S RAVENS" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">ODIN RAVEN SYSTEM</div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl tracking-wide">Odin’s Ravens</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                HUGINN és MUNINN alkotják a DESIGNLY tudás- és navigációs rétegének két központi pillérét.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RavenCard
              name="HUGINN"
              role="Strategy & Intelligence"
              icon={Bird}
              description="Navigáció, AI concierge és stratégiai döntési útvonalak."
            />
            <RavenCard
              name="MUNINN"
              role="Memory & Insight"
              icon={BrainCircuit}
              description="Kontextus, memória, tudás-összefoglalás és handoff."
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">VYRON / NEXORA</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Specialist Agents</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {specialists.map((agent) => {
              const Icon = agent.icon;
              return (
                <ForgedPanel key={agent.id} className="text-center py-6">
                  <div className="pointer-events-none absolute inset-0 text-[#9CEEE5]/20">
                    <CelticCorners />
                  </div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#071311] border border-[#9CEEE5]/30 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(156,238,229,0.06)]">
                    <div className="relative">
                      <Icon className="w-6 h-6 text-[#9CEEE5]/65" />
                      <span className="absolute -right-4 -bottom-3 text-[10px] text-[#D6B36A]/65">{agent.sigil}</span>
                    </div>
                  </div>
                  <div className="font-serif text-lg">{agent.name}</div>
                  <div className="text-xs text-[#EEE8DC]/55 mt-1">{agent.role}</div>
                  <div className="mt-4">
                    <ForgedButton
                      variant="secondary"
                      className="w-full"
                      onClick={() => onNavigate('forge')}
                    >
                      Open
                    </ForgedButton>
                  </div>
                </ForgedPanel>
              );
            })}
          </div>
        </section>

        <section className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">LIVE ORCHESTRATION</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">AI Orchestration Network</h2>
          </div>

          <ForgedPanel className="relative h-[420px] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(156,238,229,0.15),_transparent_52%)]" />
            <div className="absolute inset-0 opacity-40">
              <NetworkLines />
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-32 rounded-full bg-[#071311] border border-[#9CEEE5]/45 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(156,238,229,0.14),inset_0_0_35px_rgba(156,238,229,0.08)]">
                <Network className="w-7 h-7 text-[#D6B36A]/80 mb-2" />
                <span className="text-lg font-serif">CORE</span>
                <span className="text-[8px] uppercase tracking-[.18em] text-[#9CEEE5]/55 mt-1">ORCHESTRATOR</span>
              </div>
            </div>

            {networkNodes.map((node, i) => (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: node.x, top: node.y }}>
                <div className="w-20 h-20 rounded-full bg-[#020505]/95 border border-[#9CEEE5]/30 flex items-center justify-center text-[9px] tracking-[.08em] text-center shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
                  {node.label}
                </div>
              </div>
            ))}
          </ForgedPanel>
        </section>
      </main>
    </div>
  );
}

function RavenCard({
  name,
  role,
  description,
  icon: Icon,
}: {
  name: string;
  role: string;
  description: string;
  icon: typeof Bird;
}) {
  return (
    <ForgedPanel className="min-h-[170px]">
      <div className="pointer-events-none absolute inset-0 text-[#9CEEE5]/22">
        <CelticCorners />
      </div>
      <div className="relative z-10 flex items-center gap-5">
        <div className="w-24 h-24 shrink-0 rounded-2xl bg-[#071311] border border-[#9CEEE5]/30 flex items-center justify-center shadow-[0_0_35px_rgba(156,238,229,0.08)]">
          <Icon className="w-11 h-11 text-[#9CEEE5]/78" />
        </div>
        <div>
          <div className="font-serif text-2xl">{name}</div>
          <div className="text-xs text-[#9CEEE5]/70 mt-1">{role}</div>
          <div className="text-xs text-[#EEE8DC]/55 mt-3 leading-5">{description}</div>
          <div className="mt-3 text-[9px] uppercase tracking-[.18em] text-emerald-200/70">Status: ONLINE</div>
        </div>
      </div>
    </ForgedPanel>
  );
}

function NetworkLines() {
  const lines = [
    [50,50,18,16],[50,50,70,12],[50,50,8,58],[50,50,80,52],[50,50,30,82],[50,50,64,78],
  ];
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {lines.map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth=".35" strokeDasharray="2 2" />
      ))}
    </svg>
  );
}
