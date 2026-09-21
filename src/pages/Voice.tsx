import { useState } from 'react';
import { Mic, Volume2, Download, Play, Save, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface VoiceProps {
  onNavigate: (page: string) => void;
}

const voices = [
  { id: 1, title: 'Campaign intro', voice: 'Nordic male', language: 'EN', length: '00:18' },
  { id: 2, title: 'Product explainer', voice: 'Calm female', language: 'HU', length: '00:32' },
];

export default function Voice({ onNavigate }: VoiceProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  const update = (key: string, value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const savePreset = () => {
    localStorage.setItem('designly_voice_preset', JSON.stringify(form));
    setSaved(true);
  };

  const generateVoice = () => {
    localStorage.setItem('designly_voice_brief', JSON.stringify(form));
    onNavigate('voice-workspace');
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

      <NordicHeader title="VOICE — COMMUNICATION CHAMBER" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">VOICE COMMAND</div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl tracking-wide">Voice Overview</h1>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OverviewMetric label="Generated Voice Lines" value="3,482" />
            <OverviewMetric label="Voices" value="18" />
            <OverviewMetric label="Languages" value="12" />
          </div>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">COMMUNICATION FORGE</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Create Voice Line</h2>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="grid md:grid-cols-2 gap-5 text-xs">
              <Field label="Text" placeholder="Írd be a mondatot, amit fel kell olvasni." value={form.text || ''} onChange={(v) => update('text', v)} />
              <Field label="Voice" placeholder="Male / Female / Nordic / Calm / Epic" value={form.voice || ''} onChange={(v) => update('voice', v)} />
              <Field label="Language" placeholder="HU / EN / DE / etc." value={form.language || ''} onChange={(v) => update('language', v)} />
              <Field label="Tone" placeholder="Narration / Promo / Whisper / Command" value={form.tone || ''} onChange={(v) => update('tone', v)} />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <ForgedButton variant="primary" onClick={generateVoice}>
                <Sparkles className="w-4 h-4" /> Generate Voice
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={savePreset}>
                <Save className="w-4 h-4" /> {saved ? 'Preset Saved' : 'Save Preset'}
              </ForgedButton>
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">AUDIO ARCHIVE</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Recent Voice Lines</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {voices.map((voice) => (
              <ForgedPanel key={voice.id}>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#071311] border border-[#9CEEE5]/25 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-[#9CEEE5]/75" />
                    </div>
                    <div>
                      <div className="font-serif text-xl">{voice.title}</div>
                      <div className="text-xs text-[#EEE8DC]/55 mt-1">{voice.voice} · {voice.language}</div>
                    </div>
                  </div>
                  <div className="text-[9px] uppercase tracking-[.18em] text-[#9CEEE5]/70">{voice.length}</div>
                </div>

                <div className="mt-5 flex gap-3">
                  <ForgedButton
                    variant={playing === voice.id ? 'primary' : 'secondary'}
                    className="flex-1"
                    onClick={() => setPlaying((current) => current === voice.id ? null : voice.id)}
                  >
                    <Play className="w-4 h-4" /> {playing === voice.id ? 'Playing…' : 'Play'}
                  </ForgedButton>
                  <ForgedButton variant="secondary" className="flex-1">
                    <Download className="w-4 h-4" /> Download
                  </ForgedButton>
                </div>
              </ForgedPanel>
            ))}
          </div>
        </section>

        <section className="max-w-4xl">
          <ForgedPanel>
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-[#D6B36A]/75" />
              <div>
                <div className="text-[9px] uppercase tracking-[.22em] text-[#9CEEE5]/55">VOICE BRIDGE</div>
                <div className="font-serif text-2xl mt-1">HUGINN voice runtime</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#EEE8DC]/55">
              A Generate Voice művelet a tényleges Voice Agent munkaterületre továbbítja a beállításokat, ahol a mikrofon, beszédfelismerés és HUGINN válaszréteg működik.
            </p>
          </ForgedPanel>
        </section>
      </main>
    </div>
  );
}

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <ForgedPanel>
      <div className="text-xs text-[#EEE8DC]/55">{label}</div>
      <div className="font-serif text-4xl mt-2">{value}</div>
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
