import { useState } from 'react';
import { Play, Music2, Save, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface MusicProps {
  onNavigate: (page: string) => void;
}

const playlists = [
  {
    id: 1,
    name: 'Nordic Ambient',
    description: 'Fog, mountains, slow aurora, deep drones.',
    tracks: 24,
  },
  {
    id: 2,
    name: 'Battle Campaign',
    description: 'Epic drums, brass, tension, cinematic build.',
    tracks: 18,
  },
];

export default function Music({ onNavigate }: MusicProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  const update = (key: string, value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const savePreset = () => {
    localStorage.setItem('designly_music_preset', JSON.stringify(form));
    setSaved(true);
  };

  const generateTrack = () => {
    localStorage.setItem('designly_music_brief', JSON.stringify(form));
    onNavigate('music-workspace');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020505] text-[#E3FFFB]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.24]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95"
        aria-hidden="true"
      />

      <NordicHeader title="MUSIC — SOUND HALL" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">AUDIO COMMAND</div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl tracking-wide">Music Overview</h1>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OverviewMetric label="Tracks Generated" value="128" />
            <OverviewMetric label="Active Playlists" value="9" />
            <OverviewMetric label="Brands Linked" value="6" />
          </div>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">SOUND FORGE</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Create New Track</h2>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="grid md:grid-cols-2 gap-5 text-xs">
              <Field label="Track Name" placeholder="Pl. Odin’s March" value={form.trackName || ''} onChange={(v) => update('trackName', v)} />
              <Field label="Mood" placeholder="Epic / Calm / Dark / Futuristic" value={form.mood || ''} onChange={(v) => update('mood', v)} />
              <Field label="Genre" placeholder="Ambient / Orchestral / Electronic / Hybrid" value={form.genre || ''} onChange={(v) => update('genre', v)} />
              <Field label="Tempo" placeholder="Pl. 120 BPM" value={form.tempo || ''} onChange={(v) => update('tempo', v)} />
              <Field label="Usage" placeholder="Campaign, Brand, Product, Background" value={form.usage || ''} onChange={(v) => update('usage', v)} />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <ForgedButton variant="primary" onClick={generateTrack}>
                <Sparkles className="w-4 h-4" /> Generate Track
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={savePreset}>
                <Save className="w-4 h-4" /> {saved ? 'Preset Saved' : 'Save Preset'}
              </ForgedButton>
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">CURATED LIBRARY</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Playlists</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {playlists.map((playlist) => (
              <ForgedPanel key={playlist.id}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-serif text-2xl">{playlist.name}</div>
                    <div className="text-xs text-[#EEE8DC]/55 mt-1">{playlist.description}</div>
                  </div>
                  <div className="text-[9px] uppercase tracking-[.18em] text-[#9CEEE5]/70">
                    {playlist.tracks} tracks
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <ForgedButton variant="secondary" className="flex-1" onClick={() => onNavigate('music-workspace')}>
                    Open
                  </ForgedButton>
                  <ForgedButton
                    variant={playing === playlist.id ? 'primary' : 'secondary'}
                    className="flex-1"
                    onClick={() => setPlaying((current) => current === playlist.id ? null : playlist.id)}
                  >
                    <Play className="w-4 h-4" /> {playing === playlist.id ? 'Playing…' : 'Play'}
                  </ForgedButton>
                </div>
              </ForgedPanel>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <ForgedPanel>
      <div className="text-xs text-[#EEE8DC]/55">{label}</div>
      <div className="font-serif text-4xl mt-2 text-[#E3FFFB]">{value}</div>
    </ForgedPanel>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[#EEE8DC]/70">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40 focus:ring-2 focus:ring-[#9CEEE5]/5"
        placeholder={placeholder}
      />
    </label>
  );
}
