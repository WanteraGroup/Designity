import { Activity, CheckCircle2, FileText, Play, ShieldCheck } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface DiagnosticsProps {
  onNavigate: (page: string) => void;
}

const logs = [
  { status: 'OK', label: 'Campaign engine', detail: 'Campaign generation path available' },
  { status: 'OK', label: 'Music engine', detail: 'Music workspace route available' },
  { status: 'OK', label: 'CNC engine', detail: 'CAM generator and validation available' },
];

export default function Diagnostics({ onNavigate }: DiagnosticsProps) {
  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95"
        aria-hidden="true"
      />

      <NordicHeader title="DIAGNOSTICS — SYSTEM DIAGNOSTICS" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <ShieldCheck className="w-4 h-4" /> QA COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">System Diagnostics</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Rendszerállapot, motorok és integrációk ellenőrzése a DESIGNLY QA Center munkafolyamatán keresztül.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <ForgedPanel className="max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatusMetric icon={Activity} label="Uptime" value="—" detail="A live uptime metric nincs bekötve." />
              <StatusMetric icon={ShieldCheck} label="Admin QA" value="Protected" detail="Csak admin/owner számára." />
              <StatusMetric icon={CheckCircle2} label="Checks" value="5" detail="A teljes QA suite 5 integrációt ellenőriz." />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <ForgedButton variant="primary" onClick={() => onNavigate('diagnostics-workspace')}>
                <Play className="w-4 h-4" /> Run Full Diagnostics
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={() => onNavigate('diagnostics-workspace')}>
                Open QA Center
              </ForgedButton>
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">SYSTEM STATUS</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl">System Status</h2>
          </div>

          <ForgedPanel>
            <div className="space-y-3">
              <StatusRow label="Uptime" value="Live metric unavailable" />
              <StatusRow label="Agents" value="Live QA check in workspace" />
              <StatusRow label="Storage" value="Live metric unavailable" />
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">ENGINE LOG</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Logs</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {logs.map((entry) => (
              <ForgedPanel key={entry.label}>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-300">[{entry.status}]</span>
                      <span className="font-serif text-xl">{entry.label}</span>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[#EEE8DC]/45">{entry.detail}</div>
                  </div>
                </div>
              </ForgedPanel>
            ))}
          </div>
        </section>

        <ForgedPanel className="max-w-5xl">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">DIAGNOSTICS BRIDGE</div>
              <div className="font-serif text-2xl mt-1">System Diagnostics → QA Center</div>
              <p className="mt-2 text-sm leading-7 text-[#EEE8DC]/45">
                A részletes élő ellenőrzés a meglévő DiagnosticsPage QA Centerben fut: profil, kreditkatalógus, CNC CAM, Shopify és HUGINN kapcsolat.
              </p>
            </div>
          </div>
        </ForgedPanel>
      </main>
    </div>
  );
}

function StatusMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#263636] bg-black/20 p-5">
      <Icon className="w-5 h-5 text-[#D6B36A]/75 mb-3" />
      <div className="text-xs text-[#EEE8DC]/55">{label}</div>
      <div className="mt-2 font-serif text-2xl">{value}</div>
      <div className="mt-1 text-[10px] leading-5 text-[#EEE8DC]/35">{detail}</div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#263636] bg-black/15 px-4 py-3">
      <span className="text-xs uppercase tracking-[.12em] text-[#EEE8DC]/45">{label}</span>
      <span className="text-xs text-[#9CEEE5]/70">{value}</span>
    </div>
  );
}
