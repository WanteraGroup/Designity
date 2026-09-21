import type { ReactNode } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { CelticGoldFrame, RunePulse } from '@/components/ui';

interface HuginnPanelProps {
  agentsActive?: number;
  analysisStatus?: string;
  optimizationStatus?: string;
  children?: ReactNode;
}

export function HuginnPanel({
  agentsActive = 14,
  analysisStatus = 'Valós idejű kreatív elemzés',
  optimizationStatus = 'Kampányoptimalizálás folyamatban',
  children,
}: HuginnPanelProps) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#263636] bg-[#020505]/70 p-5 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(156,238,229,.09),transparent_36%),linear-gradient(135deg,transparent,rgba(214,179,106,.025))]" aria-hidden="true" />

      <div className="relative z-10 pr-8">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#D6B36A]/80" />
          <div className="font-serif text-xl text-[#9CEEE5]">
            HUGINN — Rendszerintelligencia
          </div>
        </div>

        <div className="mt-1 text-xs text-[#EEE8DC]/70">
          Állapot: <span className="text-[#9CEEE5]">ONLINE</span>
        </div>

        <div className="mt-3 space-y-1 text-xs text-[#EEE8DC]/60">
          <div>• {agentsActive} ügynök aktív</div>
          <div>• {analysisStatus}</div>
          <div>• {optimizationStatus}</div>
        </div>

        {children ?? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D6B36A]/15 bg-black/20 px-3 py-1.5 text-[9px] uppercase tracking-[.18em] text-[#D6B36A]/65">
            <Sparkles className="h-3.5 w-3.5" />
            HUGINN AI CORE
          </div>
        )}
      </div>

      <RunePulse rune="ᚱ" duration="2s" />
      <CelticGoldFrame intensity="soft" />
    </div>
  );
}

export default HuginnPanel;
