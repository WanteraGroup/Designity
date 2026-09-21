import { Activity, Radio, Sparkles, Tv2, Users, Video } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader, FogAndEmbers } from '@/components/ui';

interface StreamerProps {
  onNavigate: (page: string) => void;
}

export default function Streamer({ onNavigate }: StreamerProps) {
  return (
    <div className="relative min-h-screen bg-[#020505] text-[#E3FFFB] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <FogAndEmbers />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95"
        aria-hidden="true"
      />

      <NordicHeader title="STREAMER — STREAM HALL" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <Radio className="w-4 h-4" /> STREAM COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Live Streams</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Stream setup, live overlays, alerts és kampányaktivitás egyetlen DESIGNLY Stream Hall felületen.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StreamMetric icon={Activity} label="System Activity" value="LIVE" />
            <StreamMetric icon={Tv2} label="Campaign Stream" value="12" />
            <StreamMetric icon={Users} label="Creator Assets" value="40+" />
          </div>
        </section>

        <section>
          <ForgedPanel className="max-w-5xl">
            <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="text-[9px] uppercase tracking-[.25em] text-[#D6B36A]/65">STREAM HALL</div>
                <h2 className="font-serif text-3xl mt-2">Open Stream Studio</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/50">
                  A teljes Streamer Studio kezeli az OBS, Streamlabs, Twitch, YouTube, TikTok Live, Kick és Discord kreatívokat, valamint a generálható overlayeket, screeneket, alertokat és esports asseteket.
                </p>
              </div>
              <ForgedButton variant="primary" onClick={() => onNavigate('streamer-workspace')}>
                <Sparkles className="w-4 h-4" /> Open Stream
              </ForgedButton>
            </div>
          </ForgedPanel>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ForgedPanel>
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
              <div>
                <div className="font-serif text-2xl">System activity stream</div>
                <p className="mt-2 text-xs leading-6 text-[#EEE8DC]/45">
                  A valódi creator asset generálás és projektmentés a Streamer Studio workspace-ben történik.
                </p>
              </div>
            </div>
          </ForgedPanel>

          <ForgedPanel>
            <div className="flex items-start gap-3">
              <Radio className="w-5 h-5 text-[#9CEEE5]/75 mt-0.5" />
              <div>
                <div className="font-serif text-2xl">Campaign performance stream</div>
                <p className="mt-2 text-xs leading-6 text-[#EEE8DC]/45">
                  A kampányteljesítmény részletes kezelése a Strategic War Room rendszerben érhető el.
                </p>
                <div className="mt-4">
                  <ForgedButton variant="secondary" onClick={() => onNavigate('campaign')}>Open Campaigns</ForgedButton>
                </div>
              </div>
            </div>
          </ForgedPanel>
        </section>

        <ForgedPanel className="max-w-5xl">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">STREAM BRIDGE</div>
              <div className="font-serif text-2xl mt-1">Stream Hall → Streamer Studio</div>
              <p className="mt-2 text-sm leading-7 text-[#EEE8DC]/45">
                Az új Stream Hall központi nézet, a meglévő Streamer Studio pedig a teljes AI asset-generálási, ingyenes előnézeti, véglegesítési és projektmentési munkafolyamatot biztosítja.
              </p>
            </div>
          </div>
        </ForgedPanel>
      </main>
    </div>
  );
}

function StreamMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <ForgedPanel>
      <Icon className="w-5 h-5 mb-3 text-[#D6B36A]/75" />
      <div className="text-xs text-[#EEE8DC]/60">{label}</div>
      <div className="font-serif text-4xl mt-2">{value}</div>
    </ForgedPanel>
  );
}
