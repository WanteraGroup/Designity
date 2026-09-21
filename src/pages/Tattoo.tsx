import { useState } from 'react';
import { Bookmark, Download, PenTool, Save, Sparkles } from 'lucide-react';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface TattooProps {
  onNavigate: (page: string) => void;
}

const tattoos = [
  { id: 1, name: 'Raven & Rune Ring', style: 'Nordic blackwork', placement: 'Forearm' },
  { id: 2, name: 'Celtic Core Geometry', style: 'Geometric', placement: 'Back' },
];

export default function Tattoo({ onNavigate }: TattooProps) {
  const [concept, setConcept] = useState('');
  const [style, setStyle] = useState('');
  const [placement, setPlacement] = useState('');
  const [saved, setSaved] = useState(false);

  const saveConcept = () => {
    localStorage.setItem(
      'designly_tattoo_concept',
      JSON.stringify({
        concept: concept.trim(),
        style: style.trim(),
        placement: placement.trim(),
        savedAt: new Date().toISOString(),
      }),
    );
    setSaved(true);
  };

  const generateDesign = () => {
    localStorage.setItem(
      'designly_tattoo_concept',
      JSON.stringify({ concept: concept.trim(), style: style.trim(), placement: placement.trim() }),
    );
    onNavigate('tattoo-library');
  };

  const openDesign = (design: typeof tattoos[number]) => {
    localStorage.setItem('designly_tattoo_selected', JSON.stringify(design));
    onNavigate('tattoo-library');
  };

  const exportDesign = (design: typeof tattoos[number]) => {
    const blob = new Blob(
      [JSON.stringify({ ...design, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = design.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-') + '.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

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

      <NordicHeader title="TATTOO — RUNE & SKIN STUDIO" />

      <main className="relative z-10 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 space-y-12 max-w-[1700px] mx-auto">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.28em] text-[#D6B36A]/65">
                <PenTool className="w-4 h-4" /> RUNE & SKIN COMMAND
              </div>
              <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Tattoo Concepts</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#EEE8DC]/55">
                Egyedi tetováláskoncepciók előkészítése, szalon-kompatibilis briefek és a meglévő DESIGNLY Tattoo Library AI munkafolyamata egyetlen felületen.
              </p>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('dashboard')}>← Command</ForgedButton>
          </div>

          <ForgedPanel className="max-w-4xl">
            <div className="grid md:grid-cols-3 gap-5 text-xs">
              <Field label="Concept" placeholder="Pl. Odin raven + runes" value={concept} onChange={setConcept} />
              <Field label="Style" placeholder="Linework / Blackwork / Nordic / Geometric" value={style} onChange={setStyle} />
              <Field label="Placement" placeholder="Forearm / Back / Chest / Neck" value={placement} onChange={setPlacement} />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <ForgedButton variant="primary" onClick={generateDesign} disabled={!concept.trim()}>
                <Sparkles className="w-4 h-4" /> Generate Design
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={saveConcept}>
                <Save className="w-4 h-4" /> {saved ? 'Concept Saved' : 'Save Concept'}
              </ForgedButton>
              <ForgedButton variant="secondary" onClick={() => onNavigate('tattoo-library')}>
                <Bookmark className="w-4 h-4" /> Open Tattoo Library
              </ForgedButton>
            </div>

            <p className="mt-3 text-[11px] text-[#EEE8DC]/35">
              A Generate Design gomb a meglévő Tattoo Library AI custom workflow-ba lép tovább; így a valós AI-generálás és kreditkezelés megmarad.
            </p>
          </ForgedPanel>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[.28em] text-[#9CEEE5]/60">SAVED CONCEPTS</div>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl">Saved Designs</h2>
            </div>
            <ForgedButton variant="secondary" onClick={() => onNavigate('tattoo-library')}>
              <Sparkles className="w-4 h-4" /> Explore Library
            </ForgedButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tattoos.map((tattoo) => (
              <ForgedPanel key={tattoo.id}>
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div>
                    <div className="font-serif text-2xl">{tattoo.name}</div>
                    <div className="text-xs text-[#EEE8DC]/55 mt-1">{tattoo.style}</div>
                  </div>
                  <div className="text-[9px] uppercase tracking-[.18em] text-[#9CEEE5]/70">{tattoo.placement}</div>
                </div>

                <div className="mb-5 rounded-2xl border border-[#D6B36A]/15 bg-[#eee8dd] aspect-[16/7] overflow-hidden flex items-center justify-center">
                  <div className="relative w-32 h-32 rounded-full border-[3px] border-black/70 flex items-center justify-center">
                    <div className="absolute inset-3 rounded-full border border-black/45 rotate-12" />
                    <div className="absolute h-px w-24 bg-black/65 rotate-35" />
                    <div className="absolute h-px w-24 bg-black/65 -rotate-35" />
                    <span className="font-serif font-bold text-black/75 text-sm">{tattoo.id === 1 ? 'RUNE' : 'KELT'}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ForgedButton variant="secondary" className="flex-1" onClick={() => openDesign(tattoo)}>
                    Open
                  </ForgedButton>
                  <ForgedButton variant="secondary" className="flex-1" onClick={() => exportDesign(tattoo)}>
                    <Download className="w-4 h-4" /> Export
                  </ForgedButton>
                </div>
              </ForgedPanel>
            ))}
          </div>
        </section>

        <ForgedPanel className="max-w-4xl">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#D6B36A]/75 mt-0.5" />
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] text-[#D6B36A]/60">CUSTOM TATTOO WORKFLOW</div>
              <div className="font-serif text-2xl mt-1">AI Tattoo Library → custom generation</div>
              <p className="mt-2 text-sm leading-7 text-[#EEE8DC]/45">
                A Tattoo Library-ben elérhető a kategorizált mintakönyvtár, testpozíció-preview, konzultációs lap, flash sheet és a meglévő AI custom generálás.
              </p>
            </div>
          </div>
        </ForgedPanel>
      </main>
    </div>
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
