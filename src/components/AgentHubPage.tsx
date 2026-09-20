import {
  Bird, BrainCircuit, BriefcaseBusiness, CheckCircle2, Cpu, FileBarChart2, Hammer, Network, Package,
  Search, ShieldCheck, Sparkles, Waypoints, Mic, Languages,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { DESIGNLY_FULL_AGENT_TEAM, VYRON_AGENT_TEAM, type DesignlyAgent } from '@/lib/designly-agents';

interface AgentHubPageProps { onNavigate?: (page: string) => void; }

const iconById: Record<string, ComponentType<{ className?: string }>> = {
  huginn: Bird, muninn: BrainCircuit, core: Network, architect: Cpu, research: Search, techScout: Waypoints,
  business: BriefcaseBusiness, product: Package, builder: Hammer, reviewer: ShieldCheck, sales: Sparkles, report: FileBarChart2,
  voice: Mic, translator: Languages,
};

function AgentCard({ agent }: { agent: DesignlyAgent }) {
  const Icon = iconById[agent.id] || Sparkles;
  const raven = agent.id === 'huginn' || agent.id === 'muninn';
  const orchestrator = agent.id === 'core';
  const shell = raven
    ? 'border-gold-400/35 bg-gradient-to-br from-gold-500/10 via-ink-900 to-black'
    : orchestrator
      ? 'border-violet-400/25 bg-gradient-to-br from-violet-500/10 via-ink-900 to-black'
      : 'border-gold-600/12 bg-ink-900/80 hover:-translate-y-1 hover:border-gold-500/30';
  return (
    <article className={'group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ' + shell}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold-400/5 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className={'grid h-11 w-11 place-items-center rounded-xl border ' + (raven ? 'border-gold-400/35 bg-gold-400/10 text-gold-200' : 'border-gold-500/15 bg-black/20 text-gold-300')}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={'chip text-[9px] uppercase tracking-[.18em] ' + (raven ? 'border-gold-400/30 bg-gold-400/10 text-gold-200' : orchestrator ? 'border-violet-400/25 bg-violet-400/10 text-violet-200' : 'border-ink-500/40 bg-ink-800/60 text-cream-300/55')}>
          {raven ? 'ODIN RAVEN' : orchestrator ? 'ORCHESTRATOR' : 'SPECIALIST'}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-display font-semibold text-cream-50">{agent.name}</h3>
      <div className="mt-1 text-[10px] uppercase tracking-[.18em] text-gold-300/65">{agent.purpose}</div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {agent.outputs.map((output) => <span key={output} className="rounded-full border border-gold-600/10 bg-black/20 px-2.5 py-1 text-[9px] text-cream-300/55">{output}</span>)}
      </div>
    </article>
  );
}

export function AgentHubPage({ onNavigate }: AgentHubPageProps) {
  const ravens = VYRON_AGENT_TEAM.filter((agent) => agent.id === 'huginn' || agent.id === 'muninn');
  const orchestration = VYRON_AGENT_TEAM.filter((agent) => agent.id !== 'huginn' && agent.id !== 'muninn');
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-ink-900 via-[#0b0c0d] to-black p-7 lg:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/8 blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.28em] text-gold-300"><Bird className="h-4 w-4" /> ODIN RAVEN SYSTEM</div>
            <h1 className="mt-3 text-4xl font-display font-bold text-cream-50 lg:text-5xl">Agent Hub</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-cream-300/60">A DESIGNLY agentrétege egy közös munkafolyamatba rendezi a látogatói AI-t, Odin két hollóját és a VYRON/NEXORA specialistákat.</p>
          </div>
          <div className="rounded-2xl border border-gold-500/15 bg-black/25 p-5">
            <div className="text-[9px] uppercase tracking-[.24em] text-gold-300/65">Rendszerállapot</div>
            <div className="mt-2 flex items-center gap-2 text-cream-50"><CheckCircle2 className="h-4 w-4 text-gold-300" /> Agent registry betöltve</div>
            <div className="mt-2 text-xs text-cream-300/45">{DESIGNLY_FULL_AGENT_TEAM.length} regisztrált agent · Huginn + Muninn + VYRON specialisták</div>
          </div>
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><div className="text-[9px] uppercase tracking-[.25em] text-gold-300/60">ODIN KÉT HOLLÓJA</div><h2 className="mt-1 text-2xl font-display font-semibold text-cream-50">HUGINN + MUNINN</h2></div>
          {onNavigate && <button onClick={() => onNavigate('dashboard')} className="btn-ghost text-xs">← Vissza</button>}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">{ravens.map((agent) => <AgentCard key={agent.id} agent={agent} />)}</div>
      </section>
      <section>
        <div className="mb-4"><div className="text-[9px] uppercase tracking-[.25em] text-gold-300/60">VYRON / NEXORA RÉTEG</div><h2 className="mt-1 text-2xl font-display font-semibold text-cream-50">Orchestration & specialist agents</h2></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{orchestration.map((agent) => <AgentCard key={agent.id} agent={agent} />)}</div>
      </section>
      <section>
        <div className="mb-4">
          <div className="text-[9px] uppercase tracking-[.25em] text-gold-300/60">VOICE & LANGUAGE</div>
          <h2 className="mt-1 text-2xl font-display font-semibold text-cream-50">MIRA / VEYRA capability bridge</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <button onClick={() => onNavigate?.('voice')} className="group text-left">
            <AgentCard agent={VYRON_AGENT_TEAM.find((agent) => agent.id === 'voice')!} />
          </button>
          <button onClick={() => onNavigate?.('translator')} className="group text-left">
            <AgentCard agent={VYRON_AGENT_TEAM.find((agent) => agent.id === 'translator')!} />
          </button>
        </div>
        <p className="mt-3 text-xs leading-6 text-cream-300/45">
          A hang- és fordító réteg most böngészőalapú képességként került be. A MIRA-specifikus backend/agent runtime külön adapterként köthető rá; a VEYRA-ból igazolt beszédfelismerés, fordítás és felolvasás már használható.
        </p>
      </section>
      <section className="card-lux p-6">
        <div className="mb-5 flex items-center gap-2"><Network className="h-5 w-5 text-gold-300" /><div><div className="text-[9px] uppercase tracking-[.24em] text-gold-300/60">AUTOMATIC BUILD PIPELINE</div><h2 className="text-xl font-display font-semibold text-cream-50">Brief → döntés → build → QA → riport</h2></div></div>
        <div className="grid gap-2 md:grid-cols-5">
          {['CORE / ARCHITECT','RESEARCH / TECH SCOUT','BUSINESS / PRODUCT','BUILDER','REVIEWER / REPORT'].map((step, index) => <div key={step} className="relative rounded-xl border border-gold-600/12 bg-black/20 p-4"><div className="text-2xl font-display text-gold-400/35">0{index + 1}</div><div className="mt-2 text-xs font-semibold text-cream-100">{step}</div></div>)}
        </div>
        <p className="mt-4 text-xs leading-6 text-cream-300/45">A Hub a regisztrált agent-szerepeket és az orchestration tervét mutatja. A tényleges specialistahívás a VYRON runtime/API rétegen kapcsolható hozzá; a felület nem szimulál végrehajtást.</p>
      </section>
    </div>
  );
}