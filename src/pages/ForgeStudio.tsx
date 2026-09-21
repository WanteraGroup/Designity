import { useState } from 'react';
import { CelticCorners } from '@/components/layout/CommandDeck';
import { ForgedPanel, ForgedButton, NordicHeader } from '@/components/ui';

interface ForgeStudioProps {
  onNavigate: (page: string) => void;
}

const FIELDS = [
  ['prompt', 'Prompt', 'Mit szeretnél létrehozni?'],
  ['projectType', 'Project type', 'Campaign / Website / Logo / Product / CNC'],
  ['style', 'Style', 'Nordic / Minimal / Futuristic / Dark luxury'],
  ['brand', 'Brand', 'Márkanév / identitás'],
  ['dimensions', 'Dimensions', '1920x1080, 1080x1080, stb.'],
  ['platform', 'Platform', 'Web, Social, Print, Shopify'],
  ['effects', 'Effects', 'Smoke, aurora, metallic, runes'],
] as const;

export default function ForgeStudio({ onNavigate }: ForgeStudioProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: string) => {
    setSaved(false);
    setValues((current) => ({ ...current, [key]: value }));
  };

  const buildBrief = () =>
    FIELDS.map(([key, label]) => `${label}: ${values[key] || ''}`)
      .join('\n')
      .trim();

  const startForge = () => {
    const brief = buildBrief();
    if (brief) localStorage.setItem('designly_forge_brief', brief);
    onNavigate('create');
  };

  const saveBrief = () => {
    localStorage.setItem('designly_forge_brief', buildBrief());
    setSaved(true);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020505] text-[#E3FFFB]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.28]"
        style={{ backgroundImage: "url('/designly-odin-hall-bg.svg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020505]/35 to-[#020505]/95"
        aria-hidden="true"
      />

      <NordicHeader title="FORGE STUDIO — CREATE" />

      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 lg:px-8 pt-12 lg:pt-16 pb-24 max-w-[1700px] mx-auto">
        <ForgedPanel className="h-full">
          <div className="pointer-events-none absolute inset-0 text-[#9CEEE5]/24">
            <CelticCorners />
          </div>

          <h1 className="font-serif text-3xl text-[#E3FFFB] mb-2">Creative Brief</h1>
          <p className="text-xs leading-6 text-[#EEE8DC]/48 mb-6">
            Határozd meg a mű alapját, majd küldd át a meglévő DESIGNLY Forge motorba végleges generálásra.
          </p>

          <div className="space-y-4 text-xs">
            {FIELDS.map(([key, label, placeholder]) => (
              <Field
                key={key}
                label={label}
                placeholder={placeholder}
                value={values[key] || ''}
                onChange={(value) => update(key, value)}
              />
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <ForgedButton variant="primary" onClick={startForge}>
              Forge Artifact
            </ForgedButton>
            <ForgedButton variant="secondary" onClick={saveBrief}>
              {saved ? 'Brief Saved' : 'Save Brief'}
            </ForgedButton>
          </div>
        </ForgedPanel>

        <ForgedPanel className="h-full">
          <div className="pointer-events-none absolute inset-0 text-[#9CEEE5]/24">
            <CelticCorners />
          </div>

          <h2 className="font-serif text-3xl text-[#E3FFFB] mb-2">Live Artifact</h2>
          <p className="text-xs leading-6 text-[#EEE8DC]/48 mb-6">
            A végleges DESIGNLY generátor itt veszi át a Briefet és indítja az ingyenes AI-előnézetet.
          </p>

          <div className="relative mt-2 h-[320px] rounded-[20px] bg-[#020505]/88 border border-[#9CEEE5]/30 overflow-hidden">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_center,rgba(156,238,229,.16),transparent_58%)]" />
            <div className="absolute inset-3 rounded-[16px] border border-[#D6B36A]/18 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <div>
                <div className="text-[10px] uppercase tracking-[.24em] text-[#D6B36A]/70">FORGE PREVIEW</div>
                <div className="mt-3 text-xs text-[#EEE8DC]/50">
                  Artifact preview will appear here after the free AI preview is generated.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Regenerate', 'Edit', 'Enhance', 'Save', 'Export', 'Variants', 'Details', 'History'].map((action, index) => (
              <ForgedButton
                key={action}
                variant={index === 0 ? 'primary' : 'secondary'}
                onClick={index === 0 ? startForge : undefined}
              >
                {action}
              </ForgedButton>
            ))}
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
    <div className="space-y-1">
      <div className="text-[#EEE8DC]/70">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#071311]/75 border border-[#263636] rounded-[10px] px-3 py-2.5 text-xs text-[#E3FFFB] placeholder:text-[#EEE8DC]/35 outline-none focus:border-[#9CEEE5]/40 focus:ring-2 focus:ring-[#9CEEE5]/5"
        placeholder={placeholder}
      />
    </div>
  );
}
