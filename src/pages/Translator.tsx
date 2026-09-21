import { useState } from 'react';
import { Languages, ArrowLeft, Copy, Save, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface TranslatorProps {
  onNavigate: (page: string) => void;
}

const translations = [
  { id: 1, title: 'Campaign tagline', source: 'HU', target: 'EN', length: '2 lines' },
  { id: 2, title: 'Product description', source: 'EN', target: 'HU', length: '5 lines' },
];

export default function Translator({ onNavigate }: TranslatorProps) {
  const [sourceText, setSourceText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('HU');
  const [targetLanguage, setTargetLanguage] = useState('EN');
  const [translated, setTranslated] = useState('');
  const [saved, setSaved] = useState(false);

  const saveArtifact = () => {
    localStorage.setItem(
      'designly_translation_artifact',
      JSON.stringify({
        source: sourceText,
        translated,
        sourceLanguage,
        targetLanguage,
      }),
    );
    setSaved(true);
  };

  const openRealtime = () => {
    localStorage.setItem(
      'designly_translator_handoff',
      JSON.stringify({ sourceText, sourceLanguage, targetLanguage }),
    );
    onNavigate('translator-workspace');
  };

  const copyTranslation = async () => {
    if (!translated || !navigator.clipboard) return;
    await navigator.clipboard.writeText(translated);
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

      <NordicHeader title="TRANSLATOR — GLOBAL RUNE NETWORK" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">LANGUAGE COMMAND</div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl tracking-wide">Translation Overview</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Szövegfordítás és élő fordítás egy közös Nordic felületen. A realtime motor a meglévő Translator Agent workspace-ben fut.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="w-4 h-4" /> Command
            </ForgedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OverviewMetric label="Texts Translated" value="1,284" />
            <OverviewMetric label="Languages" value="24" />
            <OverviewMetric label="Brands Linked" value="7" />
          </div>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">RUNE TRANSLATION FORGE</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Translate Text</h2>
          </div>

          <ForgedPanel className="max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <label className="block text-[#EEE8DC]/70">Source</label>
                <textarea
                  value={sourceText}
                  onChange={(e) => {
                    setSourceText(e.target.value);
                    setSaved(false);
                  }}
                  className="w-full h-40 bg-[#071311]/70 border border-[#263636] rounded-[10px] px-3 py-3 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40 focus:ring-2 focus:ring-[#9CEEE5]/5 resize-none"
                  placeholder="Írd be a fordítandó szöveget."
                />
                <Field label="Source language" value={sourceLanguage} onChange={setSourceLanguage} placeholder="HU / EN / DE / etc." />
              </div>

              <div className="space-y-3">
                <label className="block text-[#EEE8DC]/70">Target</label>
                <div className="w-full min-h-40 bg-[#020505]/80 border border-[#9CEEE5]/20 rounded-[10px] px-3 py-3 text-xs text-[#EEE8DC]/65">
                  {translated || 'Translation will appear here.'}
                </div>
                <Field label="Target language" value={targetLanguage} onChange={setTargetLanguage} placeholder="EN / HU / etc." />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 items-center">
              <ForgedButton variant="primary" onClick={openRealtime} disabled={!sourceText.trim()}>
                <Sparkles className="w-4 h-4" /> Translate
              </ForgedButton>
              <ForgedButton
                variant="secondary"
                onClick={saveArtifact}
                disabled={!sourceText.trim() && !translated.trim()}
              >
                <Save className="w-4 h-4" /> {saved ? 'Artifact Saved' : 'Save as Artifact'}
              </ForgedButton>
              {translated && (
                <ForgedButton variant="secondary" onClick={copyTranslation}>
                  <Copy className="w-4 h-4" /> Copy
                </ForgedButton>
              )}
              <span className="text-[10px] uppercase tracking-[.18em] text-[#EEE8DC]/35">
                LIVE SPEECH → TRANSLATION → VOICE
              </span>
            </div>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6">
            <div className="text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">LANGUAGE ARCHIVE</div>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl tracking-wide">Recent Translations</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {translations.map((item) => (
              <ForgedPanel key={item.id}>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#071311] border border-[#9CEEE5]/25 flex items-center justify-center">
                      <Languages className="w-5 h-5 text-[#9CEEE5]/75" />
                    </div>
                    <div>
                      <div className="font-serif text-xl">{item.title}</div>
                      <div className="text-xs text-[#EEE8DC]/55 mt-1">{item.source} → {item.target}</div>
                    </div>
                  </div>
                  <div className="text-[9px] uppercase tracking-[.18em] text-[#9CEEE5]/70">{item.length}</div>
                </div>

                <div className="mt-5 flex gap-3">
                  <ForgedButton variant="secondary" className="flex-1" onClick={() => onNavigate('translator-workspace')}>Open</ForgedButton>
                  <ForgedButton
                    variant="secondary"
                    className="flex-1"
                    onClick={() => navigator.clipboard?.writeText(`${item.title}: ${item.source} → ${item.target}`)}
                  >
                    <Copy className="w-4 h-4" /> Copy
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
      <div className="font-serif text-4xl mt-2">{value}</div>
    </ForgedPanel>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[#EEE8DC]/70">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40 focus:ring-2 focus:ring-[#9CEEE5]/5"
        placeholder={placeholder}
      />
    </label>
  );
}
