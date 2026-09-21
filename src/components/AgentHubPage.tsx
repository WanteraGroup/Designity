import {
  Bird, BrainCircuit, BriefcaseBusiness, CheckCircle2, Cpu, FileBarChart2, Hammer, Languages,
  Mic, Network, Package, Search, ShieldCheck, Sparkles, Waypoints,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { DESIGNLY_FULL_AGENT_TEAM, VYRON_AGENT_TEAM, type DesignlyAgent } from '@/lib/designly-agents';
import { CelticEmblem } from '@/components/CelticEmblem';

interface AgentHubPageProps { onNavigate?: (page: string) => void; }

const iconById: Record<string, ComponentType<{ className?: string }>> = {
  huginn: Bird, muninn: BrainCircuit, core: Network, architect: Cpu, research: Search, techScout: Waypoints,
  business: BriefcaseBusiness, product: Package, builder: Hammer, reviewer: ShieldCheck, sales: Sparkles,
  report: FileBarChart2, voice: Mic, translator: Languages,
};

function AgentCard({ agent }: { agent: DesignlyAgent }) {
  const Icon = iconById[agent.id] || Sparkles;
  const raven = agent.id === 'huginn' || agent.id === 'muninn';
  const orchestrator = agent.id === 'core';
  const shell = raven
    ? 'designly-agent-card designly-agent-card--raven'
    : orchestrator
      ? 'designly-agent-card designly-agent-card--core'
      : 'designly-agent-card';

  return (
    <article className={shell}>
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-200/5 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-amber-300/5 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="designly-agent-icon">
            <Icon className="h-6 w-6 text-cyan-100" />
          </div>
          <span className="chip text-[9px] uppercase tracking-[.18em]">
            {raven ? 'ODIN RAVEN' : orchestrator ? 'ORCHESTRATOR' : 'SPECIALIST'}
          </span>
        </div>
        <h3 className="mt-5 text-2xl font-display font-semibold text-cream-50">{agent.name}</h3>
        <div className="mt-1 text-[10px] uppercase tracking-[.18em] text-cyan-200/70">{agent.purpose}</div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {agent.outputs.map((output) => (
            <span key={output} className="rounded-full border border-cyan-200/10 bg-black/20 px-2.5 py-1 text-[9px] text-cream-300/60">
              {output}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function AgentHubPage({ onNavigate }: AgentHubPageProps) {
  const ravens = VYRON_AGENT_TEAM.filter((agent) => agent.id === 'huginn' || agent.id === 'muninn');
  const orchestration = VYRON_AGENT_TEAM.filter((agent) => agent.id !== 'huginn' && agent.id !== 'muninn');

  return (
    <div className="designly-agent-hub space-y-9">
      <section className="designly-agent-hero p-6 lg:p-10">
        <div className="designly-agent-orbit" aria-hidden="true" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div className="designly-agent-copy flex items-start gap-5">
            <CelticEmblem size={112} animate className="hidden sm:inline-flex shrink-0" />
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.30em] text-cyan-200">
                <Bird className="h-4 w-4" /> ODIN RAVEN SYSTEM
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-[.30em] text-amber-200/65">DESIGNLY / COMMAND DECK</div>
              <h1 className="mt-2 text-4xl font-display font-bold text-cream-50 lg:text-6xl">Agent Hub</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-cream-300/68">
                A DESIGNLY agentrétege közös munkafolyamatba rendezi Odin két hollóját, a VYRON/NEXORA specialistákat,
                valamint a hang- és nyelvi réteget.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="chip">LIVE REGISTRY</span>
                <span className="chip">NORDIC ORCHESTRATION</span>
                <span className="chip">CROSS-AGENT ROUTING</span>
              </div>
            </div>
          </div>

          <div className="designly-agent-status rounded-2xl p-5 lg:p-6">
            <div className="text-[9px] uppercase tracking-[.24em] text-cyan-200/65">Rendszerállapot</div>
            <div className="mt-3 flex items-center gap-2 text-cream-50">
              <CheckCircle2 className="h-4 w-4 text-cyan-200" /> Agent registry betöltve
            </div>
            <div className="mt-3 text-xs leading-6 text-cream-300/50">
              {DESIGNLY_FULL_AGENT_TEAM.length} regisztrált agent · Huginn + Muninn + VYRON specialisták
            </div>
            <div className="mt-5 h-px bg-gradient-to-r from-cyan-200/0 via-cyan-200/25 to-amber-200/0" />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div><div className="text-lg font-display text-cyan-100">{ravens.length}</div><div className="text-[8px] uppercase tracking-[.16em] text-cream-300/40">ravens</div></div>
              <div><div className="text-lg font-display text-cyan-100">{orchestration.length}</div><div className="text-[8px] uppercase tracking-[.16em] text-cream-300/40">specialists</div></div>
              <div><div className="text-lg font-display text-amber-100">∞</div><div className="text-[8px] uppercase tracking-[.16em] text-cream-300/40">routes</div></div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[.25em] text-amber-200/65">ODIN KÉT HOLLÓJA</div>
            <h2 className="mt-1 text-2xl font-display font-semibold text-cream-50 lg:text-3xl">HUGINN + MUNINN</h2>
          </div>
          {onNavigate && <button onClick={() => onNavigate('dashboard')} className="btn-ghost text-xs">← Vissza</button>}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">{ravens.map((agent) => <AgentCard key={agent.id} agent={agent} />)}</div>
      </section>

      <section className="designly-section-surface p-5 lg:p-7">
        <div className="mb-5">
          <div className="text-[9px] uppercase tracking-[.25em] text-cyan-200/65">VYRON / NEXORA RÉTEG</div>
          <h2 className="mt-1 text-2xl font-display font-semibold text-cream-50 lg:text-3xl">Orchestration & specialist agents</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{orchestration.map((agent) => <AgentCard key={agent.id} agent={agent} />)}</div>
      </section>

      <section className="designly-section-surface p-5 lg:p-7">
        <div className="mb-5">
          <div className="text-[9px] uppercase tracking-[.25em] text-cyan-200/65">VOICE & LANGUAGE</div>
          <h2 className="mt-1 text-2xl font-display font-semibold text-cream-50 lg:text-3xl">MIRA / VEYRA capability bridge</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <button onClick={() => onNavigate?.('voice')} className="group text-left">
            <AgentCard agent={VYRON_AGENT_TEAM.find((agent) => agent.id === 'voice')!} />
          </button>
          <button onClick={() => onNavigate?.('translator')} className="group text-left">
            <AgentCard agent={VYRON_AGENT_TEAM.find((agent) => agent.id === 'translator')!} />
          </button>
        </div>
        <p className="mt-4 max-w-4xl text-xs leading-6 text-cream-300/45">
          A hang- és fordító réteg böngészőalapú képességként került be. A MIRA-specifikus backend/agent runtime külön adapterként köthető rá;
          a VEYRA-ból igazolt beszédfelismerés, fordítás és felolvasás már használható.
        </p>
      </section>

      <section className="designly-agent-pipeline p-5 lg:p-7">
        <div className="relative z-10 mb-5 flex items-center gap-3">
          <div className="designly-agent-icon"><Network className="h-5 w-5 text-cyan-100" /></div>
          <div>
            <div className="text-[9px] uppercase tracking-[.24em] text-cyan-200/65">AUTOMATIC BUILD PIPELINE</div>
            <h2 className="text-xl font-display font-semibold text-cream-50 lg:text-2xl">Brief → döntés → build → QA → riport</h2>
          </div>
        </div>
        <div className="relative z-10 grid gap-3 md:grid-cols-5">
          {['CORE / ARCHITECT','RESEARCH / TECH SCOUT','BUSINESS / PRODUCT','BUILDER','REVIEWER / REPORT'].map((step, index) => (
            <div key={step} className="designly-agent-step p-4">
              <div className="text-2xl font-display text-amber-200/45">0{index + 1}</div>
              <div className="mt-2 text-xs font-semibold text-cream-100">{step}</div>
            </div>
          ))}
        </div>
        <p className="relative z-10 mt-5 text-xs leading-6 text-cream-300/45">
          A Hub a regisztrált agent-szerepeket és az orchestration tervét mutatja. A tényleges specialistahívás a VYRON runtime/API rétegen kapcsolható hozzá;
          a felület nem szimulál végrehajtást.
        </p>
      </section>
    </div>
  );
}
